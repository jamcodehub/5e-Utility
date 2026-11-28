import { useState } from 'react'
import { backdropClose } from '../utils/backdrop'

// "Type the name to confirm" dialog for deletions that cannot be undone.
export default function ConfirmNameDialog({ title, name, message, confirmLabel = 'Delete forever', working = false, error = '', onConfirm, onClose }) {
  const [typed, setTyped] = useState('')
  const ok = typed.trim() === name.trim()
  const close = () => { if (!working) onClose() }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(close)}>
      <div className="card" role="dialog" aria-modal="true" aria-label={title} style={{ width: '100%', maxWidth: 400, padding: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--red)', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
          {message} Type <strong style={{ color: 'var(--text)' }}>{name}</strong> to confirm.
        </div>
        <input autoFocus className="input" placeholder={name} value={typed} onChange={e => setTyped(e.target.value)} style={{ marginBottom: 10 }}
          onKeyDown={e => { if (e.key === 'Enter' && ok && !working) onConfirm(); if (e.key === 'Escape') close() }} />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" disabled={!ok || working} onClick={onConfirm}
            style={{ background: 'var(--red)', color: '#fff', border: 'none', flex: 1, opacity: ok ? 1 : 0.4, cursor: ok && !working ? 'pointer' : 'not-allowed' }}>
            {working ? 'Deleting…' : confirmLabel}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={close} disabled={working}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
