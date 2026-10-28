/**
 * network.js — pretends to be a network round trip.
 *
 * The services are async (they return Promises) and wait a moment before
 * answering, just like calls to a real API would. That way the pages already
 * handle loading and error states, and in the next assignment each service
 * can switch to fetch('/api/...') on the Node.js server without the pages
 * changing. In unit tests (MODE === 'test') there is no delay.
 */
const DEFAULT_DELAY_MS = import.meta.env?.MODE === 'test' ? 0 : 250

export function simulateNetwork(ms = DEFAULT_DELAY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
