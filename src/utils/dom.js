export function focusFirstError(errors) {
  const firstField = Object.keys(errors).find((name) => errors[name])
  if (firstField) document.getElementById(firstField)?.focus()
}
