/**
 * analytics.test.js — numbers shown on the admin dashboard.
 */
import { describe, expect, it } from 'vitest'
import { detectThemes, getNiceTicks, getOrdersPerDay, getPopularItems, summarizeFeedback } from './analytics.js'

const now = new Date(2026, 9, 28, 18, 0)
const at = (daysAgo, hour = 12) => new Date(2026, 9, 28 - daysAgo, hour, 0).toISOString()
const order = (daysAgo, status, total, items) => ({ createdAt: at(daysAgo), status, total, items })

const orders = [
  order(0, 'delivered', 30, [{ itemId: 'a', quantity: 2 }]),
  order(0, 'cancelled', 99, [{ itemId: 'b', quantity: 9 }]),
  order(1, 'delivered', 20, [{ itemId: 'b', quantity: 1 }]),
  order(6, 'delivered', 10, [{ itemId: 'a', quantity: 1 }]),
  order(9, 'delivered', 50, [{ itemId: 'b', quantity: 5 }]), // outside the 7-day window
]
const menu = [
  { id: 'a', name: 'Alfredo', category: 'mains' },
  { id: 'b', name: 'Bruschetta', category: 'starters' },
]

describe('getOrdersPerDay', () => {
  it('returns 7 days, oldest first, and skips cancelled orders', () => {
    const days = getOrdersPerDay(orders, 7, now)
    expect(days).toHaveLength(7)
    expect(days.map((day) => day.count)).toEqual([1, 0, 0, 0, 0, 1, 1])
    expect(days.at(-1).revenue).toBe(30)
  })
})

describe('getPopularItems', () => {
  it('ranks by quantity and ignores cancelled orders', () => {
    expect(getPopularItems(orders, menu).map((item) => [item.id, item.quantity])).toEqual([
      ['b', 6],
      ['a', 3],
    ])
  })

  it('can rank inside one category', () => {
    expect(getPopularItems(orders, menu, { category: 'mains' }).map((item) => item.id)).toEqual(['a'])
  })
})

describe('summarizeFeedback', () => {
  const feedback = [
    { id: '1', rating: 5, comment: 'Delicious and fresh', createdAt: at(1) },
    { id: '2', rating: 4, comment: 'Fast delivery, tasty food', createdAt: at(2) },
    { id: '3', rating: 2, comment: 'Delivery was late and the pizza was cold', createdAt: at(3) },
  ]

  it('averages ratings and counts each star', () => {
    const summary = summarizeFeedback(feedback)
    expect(summary.average).toBe(3.67)
    expect(summary.distribution).toEqual({ 5: 1, 4: 1, 3: 0, 2: 1, 1: 0 })
  })

  it('finds praise and complaint themes and writes a summary', () => {
    const summary = summarizeFeedback(feedback)
    expect(summary.praise[0].label).toBe('Food quality')
    expect(summary.complaints[0].label).toBe('Delivery and wait times')
    expect(summary.summary).toMatch(/^Customers rate us 3\.7 out of 5 from 3 reviews\./)
  })

  it('detects themes from words in a comment', () => {
    expect(detectThemes('Friendly staff but my order was missing a drink')).toEqual(['service', 'accuracy'])
  })

  it('handles no feedback', () => {
    expect(summarizeFeedback([]).count).toBe(0)
  })
})

describe('getNiceTicks', () => {
  it('rounds the axis to clean numbers', () => {
    expect(getNiceTicks(8)).toEqual([0, 2, 4, 6, 8])
    expect(getNiceTicks(37)).toEqual([0, 10, 20, 30, 40])
    expect(getNiceTicks(0)).toEqual([0, 1])
  })
})
