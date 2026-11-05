import { useEffect, useRef } from 'react'
import { Icon } from './Icon.jsx'

export function Modal({ open, title, onClose, children, footer, wide = false }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const handleCancel = (event) => {
    event.preventDefault()
    onClose()
  }

  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={`dialog ${wide ? 'dialog--wide' : ''}`}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby="dialog-title"
    >
      {open && (
        <>
          <div className="dialog__header">
            <h2 id="dialog-title">{title}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="dialog__body">{children}</div>
          {footer && <div className="dialog__footer">{footer}</div>}
        </>
      )}
    </dialog>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, busy = false }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={busy}>
            Keep it
          </button>
          <button type="button" className="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}
