function describedBy(name, hint, error) {
  return [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined
}

function FieldMessages({ name, hint, error }) {
  return (
    <>
      {hint && (
        <p id={`${name}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="field__error">
          {error}
        </p>
      )}
    </>
  )
}

export function TextField({ label, name, error, hint, type = 'text', ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...inputProps}
      />
      <FieldMessages name={name} hint={hint} error={error} />
    </div>
  )
}

export function TextAreaField({ label, name, error, hint, ...textareaProps }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...textareaProps}
      />
      <FieldMessages name={name} hint={hint} error={error} />
    </div>
  )
}

export function SelectField({ label, name, error, hint, options, placeholder, ...selectProps }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...selectProps}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages name={name} hint={hint} error={error} />
    </div>
  )
}
