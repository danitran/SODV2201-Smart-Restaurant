import { useState } from 'react'
import { Link } from 'react-router'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { useNow } from '../../hooks/useNow.js'
import { getErrorMessage } from '../../services/apiError.js'
import { getStatusLabel } from '../../services/orderService.js'
import { formatDateTime, formatPrice, toDateInputValue } from '../../utils/format.js'
import { StatusBadge } from '../../components/common/Badges.jsx'
import { ConfirmDialog } from '../../components/common/Modal.jsx'
import { OrderTicket } from '../../components/admin/OrderTicket.jsx'

const COLUMNS = [
  { status: 'pending', title: 'New' },
  { status: 'preparing', title: 'Preparing' },
  { status: 'ready', title: 'Ready' },
]

const PAGE_SIZE = 25

export default function AdminOrders() {
  const { orders, updateOrderStatus } = useRestaurant()
  const { showToast } = useToast()
  const now = useNow(30_000)

  const [view, setView] = useState('board')
  const [busyId, setBusyId] = useState(null)
  const [toCancel, setToCancel] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)

  const changeStatus = async (order, nextStatus) => {
    setBusyId(order.id)
    try {
      await updateOrderStatus(order.id, nextStatus)
      showToast(`${order.id} is now "${getStatusLabel(nextStatus, order.type)}". The customer was notified.`)
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const confirmCancel = async () => {
    await changeStatus(toCancel, 'cancelled')
    setToCancel(null)
  }

  const oldestFirst = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const today = toDateInputValue(now)
  const finishedToday = orders
    .filter((order) => ['delivered', 'cancelled'].includes(order.status) && toDateInputValue(new Date(order.createdAt)) === today)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const text = search.trim().toLowerCase()
  const history = orders
    .filter((order) => statusFilter === 'all' || order.status === statusFilter)
    .filter((order) => !text || order.id.toLowerCase().includes(text) || order.customer.name.toLowerCase().includes(text))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Orders</h1>
          <p>
            <span className="live-dot">Live</span> New orders appear here as customers place them.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
            Kitchen board
          </button>
          <button type="button" aria-pressed={view === 'history'} onClick={() => setView('history')}>
            All orders
          </button>
        </div>
      </header>

      {view === 'board' ? (
        <>
          <div className="board">
            {COLUMNS.map((column) => {
              const columnOrders = oldestFirst.filter((order) => order.status === column.status)
              return (
                <section key={column.status} className="board__column" aria-labelledby={`col-${column.status}`}>
                  <h2 id={`col-${column.status}`}>
                    {column.title}
                    <span className="board__count">{columnOrders.length}</span>
                  </h2>
                  {columnOrders.length === 0 ? (
                    <p className="board__empty">No orders here.</p>
                  ) : (
                    <ul className="board__list">
                      {columnOrders.map((order) => (
                        <li key={order.id}>
                          <OrderTicket
                            order={order}
                            now={now}
                            busy={busyId === order.id}
                            onAdvance={(next) => changeStatus(order, next)}
                            onCancel={() => setToCancel(order)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>

          <section className="panel done-today" aria-labelledby="done-title">
            <div className="panel__title">
              <h2 id="done-title">Finished today</h2>
              <span className="muted small">{finishedToday.length} orders</span>
            </div>
            {finishedToday.length === 0 ? (
              <p className="muted small">Delivered and cancelled orders from today show up here.</p>
            ) : (
              <OrdersTable orders={finishedToday.slice(0, 10)} />
            )}
          </section>
        </>
      ) : (
        <>
          <div className="admin-toolbar">
            <div className="search-input">
              <label htmlFor="order-search" className="sr-only">
                Search orders
              </label>
              <input
                id="order-search"
                type="search"
                placeholder="Search by order number or customer"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setShown(PAGE_SIZE)
                }}
              />
            </div>
            <label htmlFor="order-status" className="sr-only">
              Status
            </label>
            <select
              id="order-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setShown(PAGE_SIZE)
              }}
            >
              <option value="all">All statuses</option>
              {['pending', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
            <span className="muted small">{history.length} orders</span>
          </div>
          {history.length === 0 ? (
            <p className="muted">No orders match.</p>
          ) : (
            <>
              <OrdersTable orders={history.slice(0, shown)} />
              {shown < history.length && (
                <button type="button" className="button button--secondary show-more" onClick={() => setShown(shown + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, history.length - shown)} more
                </button>
              )}
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(toCancel)}
        title={`Cancel ${toCancel?.id ?? ''}?`}
        message={toCancel ? `The customer (${toCancel.customer.name}) will be notified that the order was cancelled.` : ''}
        confirmLabel="Cancel order"
        busy={Boolean(busyId)}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </div>
  )
}

function OrdersTable({ orders }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Placed</th>
            <th scope="col">Customer</th>
            <th scope="col">Type</th>
            <th scope="col" className="num">
              Items
            </th>
            <th scope="col" className="num">
              Total
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <Link to={`/orders/${order.id}`} className="history-item__id">
                  {order.id}
                </Link>
              </td>
              <td>{formatDateTime(order.createdAt)}</td>
              <td>{order.customer.name}</td>
              <td>{order.type === 'pickup' ? 'Pickup' : 'Delivery'}</td>
              <td className="num">{order.items.reduce((sum, line) => sum + line.quantity, 0)}</td>
              <td className="num">{formatPrice(order.total)}</td>
              <td>
                <StatusBadge kind="order" status={order.status} type={order.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
