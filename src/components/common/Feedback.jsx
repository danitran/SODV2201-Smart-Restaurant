export function Spinner({ label = 'Loading…' }) {
  return (
    <span className="spinner" role="status">
      {label}
    </span>
  )
}

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
