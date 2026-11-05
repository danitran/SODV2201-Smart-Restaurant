import { PRICING } from '../../data/restaurantInfo.js'
import { formatPrice } from '../../utils/format.js'

const OPTIONS = [
  {
    value: 'delivery',
    label: 'Delivery',
    note: `${formatPrice(PRICING.deliveryFee)}, free over ${formatPrice(PRICING.freeDeliveryOver)}`,
  },
  { value: 'pickup', label: 'Pickup', note: 'Ready in about 20 minutes' },
]

export function OrderTypePicker({ value, onChange, error }) {
  return (
    <fieldset className="field order-type">
      <legend>How do you want your order?</legend>
      <div className="order-type__options">
        {OPTIONS.map((option) => (
          <label key={option.value} className="order-type__option">
            <input
              type="radio"
              name="orderType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <span className="small muted">{option.note}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}
