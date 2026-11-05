import { useState } from 'react'
import { getErrorMessage } from '../../services/apiError.js'
import { TextAreaField } from '../common/FormFields.jsx'

export function FeedbackForm({ onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (rating === 0) {
      setError('Pick a star rating first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ rating, comment })
    } catch (submitError) {
      setError(getErrorMessage(submitError))
      setBusy(false)
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="field">
        <legend>How was your meal?</legend>
        <div className="star-input">
          {[5, 4, 3, 2, 1].map((value) => (
            <span key={value}>
              <input
                type="radio"
                id={`rating-${value}`}
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
              />
              <label htmlFor={`rating-${value}`} title={`${value} star${value > 1 ? 's' : ''}`}>
                ★<span className="sr-only">{value} stars</span>
              </label>
            </span>
          ))}
        </div>
      </fieldset>
      <TextAreaField
        label="Comment (optional)"
        name="comment"
        maxLength={300}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="What did you enjoy? What could be better?"
      />
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Sending…' : 'Send feedback'}
      </button>
    </form>
  )
}
