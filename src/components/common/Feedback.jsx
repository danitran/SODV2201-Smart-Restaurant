/**
 * Feedback.jsx — small components that show the state of the page:
 *   <Spinner label="Loading…" />           while waiting
 *   <EmptyState title="…">text</EmptyState> when there is nothing to show
 */
export function Spinner({ label = 'Loading…' }) {
  return (
    <span className="spinner" role="status">
      {label}
    </span>
  )
}

/**
 * Props:
 *   icon     emoji shown above the title
 *   title    short heading
 *   children explanation text
 *   actions  buttons/links that tell the user what to do next
 */
export function EmptyState({ icon = '🍽️', title, children, actions }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  )
}
