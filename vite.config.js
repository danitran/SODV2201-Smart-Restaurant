/**
 * vite.config.js — build tool configuration.
 *
 * - plugins: @vitejs/plugin-react adds JSX support and Fast Refresh (the page
 *   updates instantly while you edit components during `npm run dev`).
 * - server.port: the dev server always starts on http://localhost:5173.
 * - test: settings for Vitest, the unit-test runner used by `npm test`.
 *   Our tests check plain JavaScript logic (pricing, validation, the AI
 *   matcher, analytics), so they run in the fast "node" environment and
 *   do not need a browser.
 *
 * defineConfig is imported from 'vitest/config' (instead of 'vite') so the
 * same file can hold both the Vite and the Vitest settings.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
