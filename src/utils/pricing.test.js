/**
 * pricing.test.js — the bill must be right to the cent.
 */
import { describe, expect, it } from 'vitest'
import { amountToFreeDelivery, calculateTotals } from './pricing.js'

describe('calculateTotals', () => {
  const alfredoAndCake = [
    { price: 18.99, quantity: 1 },
    { price: 8.99, quantity: 1 },
  ]

  it('pickup: subtotal + 5% GST, no delivery fee', () => {
    expect(calculateTotals(alfredoAndCake, 'pickup')).toEqual({
      itemCount: 2,
      subtotal: 27.98,
      deliveryFee: 0,
      tax: 1.4,
      total: 29.38,
    })
  })

  it('delivery under $50 adds the $4.99 fee, and GST applies to it too', () => {
    const totals = calculateTotals(alfredoAndCake, 'delivery')
    expect(totals.deliveryFee).toBe(4.99)
    expect(totals.tax).toBe(1.65) // 5% of 32.97
    expect(totals.total).toBe(34.62)
  })

  it('delivery is free from $50', () => {
    const totals = calculateTotals([{ price: 25, quantity: 2 }], 'delivery')
    expect(totals.deliveryFee).toBe(0)
    expect(totals.total).toBe(52.5)
  })

  it('avoids floating point errors (0.1 + 0.2 style)', () => {
    expect(calculateTotals([{ price: 0.1, quantity: 1 }, { price: 0.2, quantity: 1 }]).subtotal).toBe(0.3)
  })

  it('an empty cart costs nothing', () => {
    expect(calculateTotals([], 'delivery').total).toBe(0)
  })
})

describe('amountToFreeDelivery', () => {
  it('says how much more is needed, never a negative number', () => {
    expect(amountToFreeDelivery(37.5)).toBe(12.5)
    expect(amountToFreeDelivery(80)).toBe(0)
  })
})
