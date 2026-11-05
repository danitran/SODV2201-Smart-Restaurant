import { useState } from 'react'
import { formatPrice } from '../../utils/format.js'
import { getNiceTicks } from '../../utils/analytics.js'

export function ColumnChart({ data, caption }) {
  const [active, setActive] = useState(null)
  const ticks = getNiceTicks(Math.max(...data.map((entry) => entry.count)))
  const top = ticks.at(-1)
  const maxIndex = data.reduce((best, entry, index) => (entry.count > data[best].count ? index : best), 0)
  const lastIndex = data.length - 1

  return (
    <figure className="column-chart">
      <div className="column-chart__plot">
        {ticks.map((tick) => (
          <div key={tick} className="column-chart__grid" style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden="true">
            <span>{tick}</span>
          </div>
        ))}
        <div className="column-chart__bars">
          {data.map((entry, index) => {
            const height = `${(entry.count / top) * 100}%`
            const showValue = index === maxIndex || index === lastIndex
            return (
              <button
                key={entry.key}
                type="button"
                className="column-chart__col"
                style={{ '--bar-height': height }}
                aria-label={`${entry.detail}: ${entry.count} orders, ${formatPrice(entry.revenue)}`}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              >
                <span className="column-chart__bar" />
                {showValue && active !== index && <span className="column-chart__value">{entry.count}</span>}
                {active === index && (
                  <span className="chart-tooltip" role="presentation">
                    <strong>{entry.count} orders</strong>
                    <span>{formatPrice(entry.revenue)} in sales</span>
                    <span>{entry.detail}</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="column-chart__labels" aria-hidden="true">
        {data.map((entry) => (
          <span key={entry.key}>{entry.label}</span>
        ))}
      </div>
      {caption && <figcaption className="sr-only">{caption}</figcaption>}

      <details className="table-toggle">
        <summary>Show as a table</summary>
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col" className="num">
                Orders
              </th>
              <th scope="col" className="num">
                Sales
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry) => (
              <tr key={entry.key}>
                <td>{entry.detail}</td>
                <td className="num">{entry.count}</td>
                <td className="num">{formatPrice(entry.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export function BarList({ items, variant = 'default', label }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="hbar-list" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="hbar">
          <span className="hbar__label" title={item.label}>
            {item.label}
          </span>
          <span className="hbar__track" aria-hidden="true">
            <span
              className={`hbar__fill ${variant === 'rating' ? 'hbar__fill--rating' : ''} ${item.value === 0 ? 'is-zero' : ''}`}
              style={{ '--bar-width': `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="hbar__value">{item.valueLabel ?? item.value}</span>
        </li>
      ))}
    </ul>
  )
}
