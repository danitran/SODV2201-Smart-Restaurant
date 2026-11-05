import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import { useCart } from '../../context/CartContext.js'
import { useRestaurant } from '../../context/RestaurantContext.js'
import { useToast } from '../../context/ToastContext.js'
import { SUGGESTED_QUESTIONS } from '../../data/aiDataset.js'
import { getAssistantReply } from '../../services/aiService.js'
import { formatPrice } from '../../utils/format.js'
import { DishImage } from '../common/DishImage.jsx'
import { Icon } from '../common/Icon.jsx'

const THINKING_MS = 650

const welcome = {
  id: 'welcome',
  from: 'assistant',
  text: 'Hi! I can help with today’s special, dietary options, recommendations and your last order. Type a question or tap a suggestion below.',
}

export function ChatWidget() {
  const { user, ownerId } = useAuth()
  const { menu, orders } = useRestaurant()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([welcome])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, typing, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const ask = (question) => {
    const text = question.trim()
    if (!text || typing) return
    setMessages((current) => [...current, { id: `u-${Date.now()}`, from: 'user', text }])
    setDraft('')
    setTyping(true)

    timerRef.current = setTimeout(() => {
      const reply = getAssistantReply(text, { menu, orders, user, ownerId })
      setMessages((current) => [...current, { id: `a-${Date.now()}`, from: 'assistant', ...reply }])
      setTyping(false)
    }, THINKING_MS)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    ask(draft)
  }

  const handleAdd = (item) => {
    addItem(item.id)
    showToast(`${item.name} was added to your order.`)
  }

  const clearChat = () => {
    clearTimeout(timerRef.current)
    setTyping(false)
    setMessages([welcome])
  }

  return (
    <div className="chat">
      {open && (
        <section
          className="chat__panel"
          aria-label="Restaurant assistant"
          onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        >
          <header className="chat__header">
            <span className="chat__avatar" aria-hidden="true">
              <Icon name="sparkle" size={18} />
            </span>
            <div>
              <h2>Basil &amp; Brick assistant</h2>
              <p>Simulated AI using our menu and your orders</p>
            </div>
            <button type="button" className="icon-button" onClick={clearChat} aria-label="Start a new conversation" title="New conversation">
              <Icon name="refresh" size={18} />
            </button>
            <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close the assistant">
              <Icon name="close" size={18} />
            </button>
          </header>

          <ol className="chat__messages" ref={listRef} aria-live="polite">
            {messages.map((message) => (
              <li key={message.id} className={`chat__message chat__message--${message.from}`}>
                <p className="chat__bubble">{message.text}</p>

                {message.itemIds?.length > 0 && (
                  <ul className="chat__dishes">
                    {message.itemIds.map((id) => {
                      const item = menu.find((menuItem) => menuItem.id === id)
                      if (!item) return null
                      return (
                        <li key={id} className="chat__dish">
                          <DishImage item={item} className="chat__thumb" sizes="40px" />
                          <Link to={`/menu/${item.id}`}>{item.name}</Link>
                          <span className="muted">{formatPrice(item.price)}</span>
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => handleAdd(item)}
                            disabled={!item.available}
                            aria-label={`Add ${item.name} to your order`}
                          >
                            {item.available ? 'Add' : 'Sold out'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {message.link && (
                  <Link className="chat__link" to={message.link.to}>
                    {message.link.label}
                  </Link>
                )}

              </li>
            ))}
            {typing && (
              <li className="chat__message chat__message--assistant">
                <p className="chat__bubble chat__typing" aria-label="The assistant is typing">
                  <span />
                  <span />
                  <span />
                </p>
              </li>
            )}
          </ol>

          <div className="chat__suggestions" role="group" aria-label="Suggested questions">
            {SUGGESTED_QUESTIONS.map((question) => (
              <button key={question} type="button" className="chat__chip" onClick={() => ask(question)} disabled={typing}>
                {question}
              </button>
            ))}
          </div>

          <form className="chat__form" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Your question
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder="Ask about the menu or your order…"
              value={draft}
              maxLength={200}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="icon-button chat__send" disabled={!draft.trim() || typing} aria-label="Send">
              <Icon name="send" size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat__launcher"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
      >
        <Icon name={open ? 'close' : 'sparkle'} size={20} />
        <span>{open ? 'Close' : 'Ask our assistant'}</span>
      </button>
    </div>
  )
}
