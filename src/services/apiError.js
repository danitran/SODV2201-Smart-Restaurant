/**
 * apiError.js — the error type every service throws.
 *
 * `message`     a sentence the UI can show as-is (toast or form banner)
 * `fieldErrors` optional { fieldName: message } so forms can highlight
 *               the exact inputs that need fixing
 *
 * Components catch it with try/catch:
 *   try { await placeOrder(...) } catch (error) { setErrors(error.fieldErrors) }
 */
export class ApiError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
  }
}

/** Text to show for any error, even unexpected ones. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof ApiError) return error.message
  return fallback
}
