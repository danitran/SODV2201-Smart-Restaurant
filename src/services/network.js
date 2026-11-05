const DEFAULT_DELAY_MS = import.meta.env?.MODE === 'test' ? 0 : 250

export function simulateNetwork(ms = DEFAULT_DELAY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
