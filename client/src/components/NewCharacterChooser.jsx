import { useState } from 'react'
import { api } from '../context/AuthContext'
import { backdropClose } from '../utils/backdrop'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const option = { textAlign: 'left', padding: '16px 18px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text)', display: 'block', width: '100%' }

// "+ New Character": build one with our guided creator, or import a public D&D Beyond character.
// `initial` lets a button open straight on the import step.
export default function NewCharacterChooser({ initial = 'choose', onClose, onCreator, onImported }) {
  const [step, setStep] = useState(initial) // 'choose' | 'beyond'
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (e) => {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true); setError('')
    try {
      const { fields, warnings } = await api('/dndbeyond/preview', { method: 'POST', body: { url: url.trim() } })
      await onImported(fields, warnings || [])
    } catch (err) { setError(err?.message || 'Import failed') }
    setBusy(false)
  }

  return (
    <div style={overlay} {...backdropClose(onClose)}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 24 }} onClick={e => e.stopPropagation()} role="dialog" aria-label="New character">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{step === 'choose' ? 'New character' : 'Import from D&D Beyond'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {step === 'choose' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" style={option} onClick={onCreator}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, marginBottom: 4 }}>Use our character creator</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Step by step: race, class, abilities, background and skills.</div>
            </button>
            <button type="button" style={option} onClick={() => setStep('beyond')}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, marginBottom: 4 }}>Import from D&amp;D Beyond</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Paste the link to a public character and we fill in the sheet for you.</div>
            </button>
          </div>
        ) : (
          <form onSubmit={run}>
            <label htmlFor="ddb-link" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Character link</label>
            <input id="ddb-link" className="input" autoFocus autoComplete="off" placeholder="dndbeyond.com/characters/12345678" value={url} onChange={e => { setUrl(e.target.value); setError('') }} />
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
              On D&amp;D Beyond, open your character and set it to <strong>Public</strong> (Character Settings, Privacy), then copy its address. We import the stats, HP, skills, background and story. Spells and items are not imported yet, and armour class is an estimate, so give it a quick check.
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 10 }} role="alert">{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !url.trim()}>{busy ? 'Importing…' : 'Import character'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStep('choose'); setError('') }} disabled={busy}>Back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
