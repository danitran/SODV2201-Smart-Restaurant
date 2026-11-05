import { Icon } from './Icon.jsx'

export function QuantityStepper({ value, onChange, min = 1, max = 20, label = 'item' }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`One less ${label}`}>
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite" aria-label={`Quantity of ${label}`}>
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`One more ${label}`}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
