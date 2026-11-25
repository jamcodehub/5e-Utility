import { useEffect, useState } from 'react'
import { api } from '../context/AuthContext'

// The New Campaign dialog: a name, then either a blank homebrew campaign or one of the ready-made campaigns (story, NPCs, lore
// and a plan for every session are filled in). Ready-made ones marked locked need DM Premium.
export default function NewCampaignDialog({ onCreate, onClose, onUpgrade }) {
  const [templates, setTemplates] = useState(null) // null while loading
  const [choice, setChoice] = useState('homebrew')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    api('/campaigns/templates').then(list => { if (live) setTemplates(Array.isArray(list) ? list : []) }).catch(() => { if (live) setTemplates([]) })
    return () => { live = false }
  }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const picked = templates?.find(t => t.id === choice) || null
  const canCreate = !busy && (choice === 'homebrew' ? name.trim().length > 0 : Boolean(picked) && !picked.locked)

  const submit = async (e) => {
    e.preventDefault()
    if (!canCreate) return
    setBusy(true); setError('')
    const err = await onCreate({ name: name.trim() || picked?.title || '', ...(picked ? { templateId: picked.id } : {}) })
    if (err) { setError(err); setBusy(false) }
  }

  const card = (selected, locked) => ({
    textAlign: 'left', width: '100%', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', display: 'block',
    background: selected ? 'var(--gold-bg)' : 'var(--surface)', color: 'var(--text)',
    border: `1px solid ${selected ? 'var(--gold-border)' : 'var(--border)'}`, opacity: locked ? 0.8 : 1,
  })

  return (
    <div role="dialog" aria-modal="true" aria-label="New campaign" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>New campaign</h2>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Start from a blank page, or let a ready-made campaign do the preparing for you.</div>
          <input autoFocus className="input" style={{ marginTop: 12, width: '100%', boxSizing: 'border-box' }} maxLength={80}
            placeholder={picked ? `Campaign name (leave blank for "${picked.title}")` : 'Campaign name'} value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={() => setChoice('homebrew')} aria-pressed={choice === 'homebrew'} style={card(choice === 'homebrew', false)}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Homebrew</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>An empty campaign for your own world. Add the story, NPCs, maps and sessions yourself.</div>
          </button>
          {templates === null && <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '8px 2px' }}>Loading ready-made campaigns…</div>}
          {templates?.length > 0 && <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '8px 2px 0' }}>Ready-made campaigns</div>}
          {templates?.map(t => (
            <button type="button" key={t.id} onClick={() => setChoice(t.id)} aria-pressed={choice === t.id} style={card(choice === t.id, t.locked)}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Levels {t.levels} · {t.sessions} sessions</span>
                {t.locked
                  ? <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--gold)', border: '1px solid var(--gold-border)', borderRadius: 999, padding: '1px 8px' }}>DM Premium</span>
                  : !t.premium && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--green, #2f9e57)' }}>Free</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 2 }}>{t.tagline}</div>
              {choice === t.id && (
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5 }}>
                  {t.pitch}
                  <div style={{ marginTop: 6, color: 'var(--text-3)' }}>Fills in: the Campaign Guide, lore cards for NPCs, places, factions and foes, and a plan for every session in your session planner. Tone: {t.tone}.</div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 20px 18px' }}>
          {error && <div role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
          {picked?.locked && (
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
              This one comes with DM Premium. <button type="button" onClick={onUpgrade} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline' }}>See DM Premium</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canCreate}>{busy ? 'Creating…' : picked ? 'Start this campaign' : 'Create campaign'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
