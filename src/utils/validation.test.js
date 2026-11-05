import { describe, expect, it } from 'vitest'
import { isValidEmail, isValidPhone, validateCheckout, validateMenuItem, validateReservation } from './validation.js'

const contact = { name: 'Tai Tran', email: 'tai@example.com', phone: '403-555-0199' }
const now = new Date(2026, 9, 28, 15, 0)

describe('email and phone', () => {
  it.each(['tai@example.com', 'a.b@school.ca'])('accepts %s', (email) => expect(isValidEmail(email)).toBe(true))
  it.each(['tai', 'tai@', 'tai@example', 'tai example@x.com'])('rejects %s', (email) => expect(isValidEmail(email)).toBe(false))
  it('accepts common Canadian phone formats', () => {
    for (const phone of ['403-555-0199', '(403) 555 0199', '+1 403 555 0199']) expect(isValidPhone(phone)).toBe(true)
    expect(isValidPhone('555-0199')).toBe(false)
  })
})

describe('validateCheckout', () => {
  it('passes for a complete pickup order', () => {
    expect(validateCheckout({ ...contact, type: 'pickup' }, { subtotal: 20 })).toEqual({})
  })

  it('requires an address for delivery', () => {
    expect(validateCheckout({ ...contact, type: 'delivery', address: '' }, { subtotal: 30 })).toHaveProperty('address')
  })

  it('blocks delivery under the $15 minimum', () => {
    const errors = validateCheckout({ ...contact, type: 'delivery', address: '1 Main St SW' }, { subtotal: 9.99 })
    expect(errors.type).toMatch(/at least \$15/)
  })

  it('reports every missing field at once', () => {
    expect(Object.keys(validateCheckout({ type: 'pickup' }))).toEqual(['name', 'email', 'phone'])
  })
})

describe('validateReservation', () => {
  const booking = { ...contact, type: 'table', date: '2026-10-29', time: '19:00', partySize: 4 }

  it('accepts a table tomorrow evening', () => {
    expect(validateReservation(booking, now)).toEqual({})
  })

  it('rejects past dates and times that already passed today', () => {
    expect(validateReservation({ ...booking, date: '2026-10-27' }, now).date).toBeDefined()
    expect(validateReservation({ ...booking, date: '2026-10-28', time: '12:00' }, now).time).toMatch(/already passed/)
  })

  it('rejects times outside opening hours', () => {
    expect(validateReservation({ ...booking, time: '23:00' }, now).time).toBeDefined()
  })

  it('tables are 1 to 12 guests; events are 10 to 60 and need a type', () => {
    expect(validateReservation({ ...booking, partySize: 14 }, now).partySize).toMatch(/special event/)
    const event = { ...booking, type: 'event', partySize: 8, eventType: '' }
    expect(validateReservation(event, now)).toHaveProperty('partySize')
    expect(validateReservation(event, now)).toHaveProperty('eventType')
    expect(validateReservation({ ...event, partySize: 30, eventType: 'corporate' }, now)).toEqual({})
  })
})

describe('validateMenuItem', () => {
  const existing = [{ id: 'chicken-alfredo', name: 'Chicken Alfredo' }]
  const dish = { name: 'Pesto Gnocchi', category: 'mains', price: '19.50', description: 'Potato gnocchi in basil pesto.', dietary: ['vegetarian'] }

  it('accepts a valid new dish', () => {
    expect(validateMenuItem(dish, existing)).toEqual({})
  })

  it('rejects duplicate names (but not when editing the same dish)', () => {
    expect(validateMenuItem({ ...dish, name: 'chicken alfredo' }, existing).name).toMatch(/already/)
    expect(validateMenuItem({ ...dish, id: 'chicken-alfredo', name: 'Chicken Alfredo' }, existing)).toEqual({})
  })

  it('rejects a zero price and an unknown category', () => {
    const errors = validateMenuItem({ ...dish, price: '0', category: 'snacks' }, existing)
    expect(errors).toHaveProperty('price')
    expect(errors).toHaveProperty('category')
  })
})
