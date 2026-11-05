export class ApiError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
  }
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof ApiError) return error.message
  return fallback
}
