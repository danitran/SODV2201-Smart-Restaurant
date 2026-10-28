/**
 * dom.js — small browser helpers used by forms.
 */

/**
 * Moves keyboard focus to the first field that has an error, so keyboard
 * and screen-reader users land right where they need to fix something.
 * Field ids match their names (see FormFields.jsx).
 */
export function focusFirstError(errors) {
  const firstField = Object.keys(errors).find((name) => errors[name])
  if (firstField) document.getElementById(firstField)?.focus()
}
