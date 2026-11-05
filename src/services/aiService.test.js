import { describe, expect, it } from 'vitest'
import { BRIEF_DATASET } from '../data/aiDataset.js'
import { createSeedDatabase, DEMO_CUSTOMER_ID } from '../data/seed.js'
import { detectIntent, getAssistantReply, normalize } from './aiService.js'

const db = createSeedDatabase(new Date('2026-10-28T19:00:00'))
const demoCustomer = { ...db.users.find((user) => user.id === DEMO_CUSTOMER_ID) }
const guest = { menu: db.menu, orders: db.orders, user: null, ownerId: 'guest-test' }
const signedIn = { menu: db.menu, orders: db.orders, user: demoCustomer, ownerId: DEMO_CUSTOMER_ID }

describe('brief dataset: the six sample questions', () => {
  it.each(BRIEF_DATASET.map((entry) => [entry.question, entry.response, entry.id]))(
    '"%s" → "%s"',
    (question, response, id) => {
      const context = id === 'last-order' ? signedIn : guest
      expect(getAssistantReply(question, context).text.startsWith(response)).toBe(true)
    },
  )

  it('answers exactly with the brief text for a guest', () => {
    expect(getAssistantReply('What do you recommend?', guest).text).toBe(
      'Based on popular orders, we recommend our Chicken Alfredo.',
    )
  })
})

describe('understanding different wording', () => {
  it.each([
    ['any specials tonight?', 'todays-special'],
    ['Do you have veggie options', 'vegetarian'],
    ['is anything GLUTEN FREE??', 'gluten-free'],
    ['which dessert do you recommend', 'popular-dessert'],
    ['what should I get?', 'recommend'],
    ['what was my previous order', 'last-order'],
    ['can I book a table for 6', 'reservation'],
    ['what time do you close', 'hours'],
    ['do you have vegan food', 'vegan'],
    ['where is my order', 'order-status'],
    ['I have a nut allergy', 'allergy'],
  ])('"%s" → %s', (message, intent) => {
    expect(detectIntent(message)?.id).toBe(intent)
  })

  it('normalises punctuation and case', () => {
    expect(normalize("  What's GLUTEN-free?! ")).toBe('what s gluten free')
  })

  it('falls back politely when it does not understand', () => {
    const reply = getAssistantReply('what is the meaning of life', guest)
    expect(reply.intent).toBe('fallback')
    expect(reply.showSuggestions).toBe(true)
  })
})

describe('personalised answers from live data', () => {
  it('a guest with no orders is asked to sign in', () => {
    expect(getAssistantReply('What did I order last time?', guest).text).toMatch(/sign in/i)
  })

  it('recommendations add a dish the customer has not tried', () => {
    const reply = getAssistantReply('What do you recommend?', signedIn)
    expect(reply.text).toMatch(/^Based on popular orders, we recommend our Chicken Alfredo\. Since you often order/)
    expect(reply.itemIds.length).toBe(2)
  })

  it('respects saved dietary preferences', () => {
    const vegetarian = { ...signedIn, user: { ...demoCustomer, preferences: { dietary: ['vegetarian'] } } }
    expect(getAssistantReply('What do you recommend?', vegetarian).text).toMatch(/your vegetarian preference/)
  })

  it('follows the admin when the special changes or sells out', () => {
    const menu = db.menu.map((item) => ({ ...item, isSpecial: item.id === 'grilled-salmon' }))
    expect(getAssistantReply("What are today's specials?", { ...guest, menu }).text).toBe(
      "Today's special is Grilled Salmon for $24.99.",
    )
    const soldOut = menu.map((item) => (item.id === 'grilled-salmon' ? { ...item, available: false } : item))
    expect(getAssistantReply("What are today's specials?", { ...guest, menu: soldOut }).text).toMatch(/just sold out/)
  })
})
