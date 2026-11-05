import { Component } from 'react'
import { Link } from 'react-router'

// Error boundaries must be class components.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="crash" role="alert">
        <h1>This page hit a problem</h1>
        <p>
          The rest of the app still works. Reload the page to try again, or go back to the home page. If it keeps
          happening, use “Reset demo data” in the admin dashboard.
        </p>
        <pre>{String(this.state.error.message)}</pre>
        <div className="empty-state__actions">
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Link className="button button--secondary" to="/">
            Go to home page
          </Link>
        </div>
      </div>
    )
  }
}
