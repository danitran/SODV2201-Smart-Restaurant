import { useState } from 'react'
import { CATEGORIES, DIETARY_TAGS } from '../../data/restaurantInfo.js'
import { getErrorMessage } from '../../services/apiError.js'
import { focusFirstError } from '../../utils/dom.js'
import { hasErrors, validateMenuItem } from '../../utils/validation.js'
import { DishImage } from '../common/DishImage.jsx'
import { SelectField, TextAreaField, TextField } from '../common/FormFields.jsx'

const toFormValues = (item) => ({
  name: item?.name ?? '',
  category: item?.category ?? 'mains',
  price: item ? String(item.price) : '',
  image: item?.image ?? '',
  description: item?.description ?? '',
  ingredients: item?.ingredients.join(', ') ?? '',
  dietary: item?.dietary ?? [],
  spicy: item?.spicy ?? false,
  available: item?.available ?? true,
})

export function MenuItemForm({ initial, existingItems, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initial))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const toggleDiet = (dietId) =>
    setValues((current) => ({
      ...current,
      dietary: current.dietary.includes(dietId)
        ? current.dietary.filter((diet) => diet !== dietId)
        : [...current.dietary, dietId],
    }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validateMenuItem({ ...values, id: initial?.id }, existingItems)
    if (hasErrors(found)) {
      setErrors(found)
      setFormError('Please fix the highlighted fields.')
      focusFirstError(found)
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await onSubmit(values)
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setFormError(getErrorMessage(error))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="form-banner" role="alert">
          {formError}
        </p>
      )}
      <div className="field-pair">
        <TextField label="Dish name" name="name" value={values.name} onChange={handleChange} error={errors.name} />
        <SelectField
          label="Category"
          name="category"
          options={CATEGORIES.map((category) => ({ value: category.id, label: category.label }))}
          value={values.category}
          onChange={handleChange}
          error={errors.category}
        />
      </div>
      <div className="field-pair">
        <TextField
          label="Price (CAD)"
          name="price"
          type="number"
          min="0.5"
          step="0.01"
          inputMode="decimal"
          value={values.price}
          onChange={handleChange}
          error={errors.price}
        />
      </div>
      <div className="photo-field">
        <TextField
          label="Photo URL (optional)"
          name="image"
          type="url"
          placeholder="https://images.unsplash.com/…"
          value={values.image}
          onChange={handleChange}
          error={errors.image}
          hint="Leave empty to show the default plate picture."
        />
        <DishImage item={{ image: values.image.trim() }} className="photo-field__preview" sizes="120px" />
      </div>
      <TextAreaField
        label="Description"
        name="description"
        maxLength={240}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
      />
      <TextField
        label="Ingredients"
        name="ingredients"
        value={values.ingredients}
        onChange={handleChange}
        hint="Separate with commas, for example: Penne, Basil, Garlic"
      />
      <fieldset className="field">
        <legend>Dietary tags</legend>
        <div className="choice-row">
          {DIETARY_TAGS.map((tag) => (
            <label key={tag.id} className="choice">
              <input type="checkbox" checked={values.dietary.includes(tag.id)} onChange={() => toggleDiet(tag.id)} />
              {tag.label}
            </label>
          ))}
          <label className="choice">
            <input type="checkbox" name="spicy" checked={values.spicy} onChange={handleChange} />
            Spicy
          </label>
        </div>
        {errors.dietary && <p className="field__error">{errors.dietary}</p>}
      </fieldset>
      <label className="choice">
        <input type="checkbox" name="available" checked={values.available} onChange={handleChange} />
        Available to order now
      </label>

      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add dish'}
        </button>
      </div>
    </form>
  )
}
