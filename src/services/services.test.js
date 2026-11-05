import { beforeEach, describe, expect, it } from 'vitest'
import { loadDatabase } from './database.js'
import { placeOrder, updateOrderStatus } from './orderService.js'
import { setItemAvailability } from './menuService.js'
import { createReservation, updateReservationStatus } from './reservationService.js'
import { login } from './authService.js'
import { addDays, toDateInputValue } from '../utils/format.js'

beforeEach(() => {
  const data = new Map()
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
})

const customer = { name: 'Tai Tran', email: 'tai@example.com', phone: '403-555-0199', address: '12 Bow Valley Rd SW' }
const tomorrow = toDateInputValue(addDays(new Date(), 1))

describe('orders', () => {
  it('prices the order from the menu and starts it as pending', async () => {
    const order = await placeOrder({
      ownerId: 'guest-1',
      customer,
      type: 'delivery',
      items: [{ itemId: 'chicken-alfredo', quantity: 2 }],
    })
    expect(order.subtotal).toBe(37.98)
    expect(order.deliveryFee).toBe(4.99)
    expect(order.status).toBe('pending')
    expect(loadDatabase().notifications[0].title).toBe('Order confirmed')
  })

  it('refuses dishes that are sold out', async () => {
    await setItemAvailability('lava-cake', false)
    await expect(
      placeOrder({ ownerId: 'g', customer, type: 'pickup', items: [{ itemId: 'lava-cake', quantity: 1 }] }),
    ).rejects.toThrow(/sold out/)
  })

  it('moves through the kitchen one step at a time and notifies the customer', async () => {
    const order = await placeOrder({ ownerId: 'guest-1', customer, type: 'pickup', items: [{ itemId: 'tiramisu', quantity: 1 }] })
    await expect(updateOrderStatus(order.id, 'delivered')).rejects.toThrow(/cannot change/)
    await updateOrderStatus(order.id, 'preparing')
    await updateOrderStatus(order.id, 'ready')
    const done = await updateOrderStatus(order.id, 'delivered')
    expect(done.statusHistory.map((step) => step.status)).toEqual(['pending', 'preparing', 'ready', 'delivered'])
    const mine = loadDatabase().notifications.filter((note) => note.ownerId === 'guest-1')
    expect(mine.map((note) => note.title)).toEqual(['Picked up', 'Ready for pickup', 'Preparing', 'Order confirmed'])
  })

  it('returns field errors the form can show', async () => {
    await expect(
      placeOrder({ ownerId: 'g', customer: { ...customer, email: 'nope' }, type: 'pickup', items: [{ itemId: 'tiramisu', quantity: 1 }] }),
    ).rejects.toMatchObject({ fieldErrors: { email: expect.any(String) } })
  })
})

describe('reservations', () => {
  const booking = { ...customer, date: tomorrow, time: '18:00', partySize: 4, type: 'table' }

  it('confirms tables at once, but events wait for approval', async () => {
    const table = await createReservation(booking, { ownerId: 'guest-1' })
    const event = await createReservation({ ...booking, type: 'event', eventType: 'birthday', partySize: 20 }, { ownerId: 'guest-1' })
    expect(table.status).toBe('confirmed')
    expect(event.status).toBe('pending')
    expect((await updateReservationStatus(event.id, 'confirmed', 'admin')).status).toBe('confirmed')
  })

  it('does not overbook a time slot (40 seats)', async () => {
    await createReservation({ ...booking, type: 'event', eventType: 'corporate', partySize: 38 }, { ownerId: 'g' })
    await expect(createReservation(booking, { ownerId: 'g' })).rejects.toThrow(/only has room for 2 more guests/)
  })

  it('customers can cancel but not approve', async () => {
    const event = await createReservation({ ...booking, type: 'event', eventType: 'birthday', partySize: 12 }, { ownerId: 'g' })
    await expect(updateReservationStatus(event.id, 'confirmed', 'customer')).rejects.toThrow(/Only the restaurant/)
    expect((await updateReservationStatus(event.id, 'cancelled', 'customer')).status).toBe('cancelled')
  })
})

describe('sign in', () => {
  it('works with the demo account and never returns the password hash', async () => {
    const user = await login('CUSTOMER@demo.com', 'demo123')
    expect(user.name).toBe('Alex Morgan')
    expect(user).not.toHaveProperty('passwordHash')
    await expect(login('customer@demo.com', 'wrong')).rejects.toThrow('Email or password is incorrect.')
  })
})
