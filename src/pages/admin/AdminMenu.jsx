import { useState } from 'react'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { CATEGORIES } from '../../data/restaurantInfo.js'
import { getErrorMessage } from '../../services/apiError.js'
import { matchesQuery } from '../../utils/menuFilters.js'
import { formatPrice } from '../../utils/format.js'
import { DishBadges } from '../../components/common/Badges.jsx'
import { DishImage } from '../../components/common/DishImage.jsx'
import { EmptyState } from '../../components/common/Feedback.jsx'
import { Icon } from '../../components/common/Icon.jsx'
import { ConfirmDialog, Modal } from '../../components/common/Modal.jsx'
import { MenuItemForm } from '../../components/admin/MenuItemForm.jsx'

export default function AdminMenu() {
  const { menu, createMenuItem, updateMenuItem, deleteMenuItem, setItemAvailability, setTodaysSpecial } = useRestaurant()
  const { showToast } = useToast()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const visible = menu.filter((item) => (category === 'all' || item.category === category) && matchesQuery(item, query))
  const soldOut = menu.filter((item) => !item.available).length

  const run = async (action, successMessage) => {
    try {
      await action()
      showToast(successMessage)
    } catch (error) {
      showToast(getErrorMessage(error), { type: 'error' })
    }
  }

  const handleSave = async (values) => {
    if (editing === 'new') {
      const created = await createMenuItem(values)
      showToast(`${created.name} was added to the menu.`)
    } else {
      const updated = await updateMenuItem(editing.id, values)
      showToast(`${updated.name} was updated.`)
    }
    setEditing(null)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    await run(() => deleteMenuItem(toDelete.id), `${toDelete.name} was deleted from the menu.`)
    setDeleting(false)
    setToDelete(null)
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h1>Menu</h1>
          <p>
            {menu.length} dishes, {soldOut} sold out. Changes show on the customer menu straight away.
          </p>
        </div>
        <button type="button" className="button" onClick={() => setEditing('new')}>
          <Icon name="plus" size={18} /> Add dish
        </button>
      </header>

      <div className="admin-toolbar">
        <div className="search-input">
          <Icon name="search" size={18} />
          <label htmlFor="admin-menu-search" className="sr-only">
            Search dishes
          </label>
          <input
            id="admin-menu-search"
            type="search"
            placeholder="Search by name or ingredient"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <label htmlFor="admin-menu-category" className="sr-only">
          Category
        </label>
        <select id="admin-menu-category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="🔍" title="No dishes match">
          Try another search word or category.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Dish</th>
                <th scope="col">Category</th>
                <th scope="col" className="num">
                  Price
                </th>
                <th scope="col">Available</th>
                <th scope="col">Special</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className={item.available ? '' : 'is-muted'}>
                  <td>
                    <div className="dish-cell">
                      <DishImage item={item} className="dish-tile dish-tile--small" sizes="44px" />
                      <div>
                        <strong>{item.name}</strong>
                        <DishBadges item={item} showSpecial={false} />
                      </div>
                    </div>
                  </td>
                  <td>{CATEGORIES.find((entry) => entry.id === item.category)?.label}</td>
                  <td className="num">{formatPrice(item.price)}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        role="switch"
                        checked={item.available}
                        onChange={(event) =>
                          run(
                            () => setItemAvailability(item.id, event.target.checked),
                            event.target.checked ? `${item.name} is back on the menu.` : `${item.name} is now sold out.`,
                          )
                        }
                      />
                      <span className="switch__track" aria-hidden="true" />
                      <span className="sr-only">{item.name} available</span>
                    </label>
                  </td>
                  <td>
                    {item.isSpecial ? (
                      <span className="badge badge--special">Today&apos;s special</span>
                    ) : (
                      <button
                        type="button"
                        className="link-button small"
                        onClick={() => run(() => setTodaysSpecial(item.id), `${item.name} is today's special.`)}
                      >
                        Make special
                      </button>
                    )}
                  </td>
                  <td className="row-actions">
                    <button type="button" className="icon-button" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
                      <Icon name="edit" size={18} />
                    </button>
                    <button type="button" className="icon-button" onClick={() => setToDelete(item)} aria-label={`Delete ${item.name}`}>
                      <Icon name="trash" size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(editing)} title={editing === 'new' ? 'Add a dish' : `Edit ${editing?.name ?? ''}`} onClose={() => setEditing(null)} wide>
        {editing && (
          <MenuItemForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            existingItems={menu}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this dish?"
        message={toDelete ? `${toDelete.name} will be removed from the menu. Past orders keep their copy of it.` : ''}
        confirmLabel="Delete dish"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
