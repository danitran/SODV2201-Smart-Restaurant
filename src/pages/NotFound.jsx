/**
 * NotFound.jsx — shown for any URL that does not match a route (path="*").
 */
import { Link, useLocation } from 'react-router'
import { EmptyState } from '../components/common/Feedback.jsx'

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <div className="container page">
      <EmptyState
        icon="🧭"
        title="We could not find that page"
        actions={
          <>
            <Link className="button" to="/menu">
              Browse the menu
            </Link>
            <Link className="button button--secondary" to="/">
              Go to home page
            </Link>
          </>
        }
      >
        There is no page at <code>{pathname}</code>. Check the address or use the links below.
      </EmptyState>
    </div>
  )
}
