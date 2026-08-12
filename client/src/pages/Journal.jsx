import { useState, useEffect, useCallback } from 'react'
import UpgradeModal from '../components/UpgradeModal'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

export default function Journal() {
  const { activeCampaign } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()
  const isDM = user?.role === 'dm'

  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  // DM uses "session" terminology; players use "day"
  const noun        = isDM ? 'Session' : 'Day'
  const nounPlural  = isDM ? 'Sessions' : 'Days'
  const apiBase     = isDM ? 'session-planner' : 'journal'
  const placeholder = isDM
    ? 'Plan this session — encounters, NPCs, pacing, hooks, notes for the table…'
    : 'Record what happened this session…'

  const active = entries.find(e => e._id === activeId)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/${apiBase}/${activeCampaign._id}`)
    setEntries(data)
    if (data.length) { setActiveId(data[0]._id); setContent(data[0].content) }
    else { setActiveId(null); setContent('') }
  }, [activeCampaign, apiBase])

  useEffect(() => { load() }, [load])

  const selectEntry = e => { setActiveId(e._id); setContent(e.content) }

  const newEntry = async () => {
    if (!activeCampaign) return
    const maxNum = entries.reduce((m, e) => Math.max(m, e.day ?? e.session ?? 0), 0)
    const nextNum = maxNum + 1
    try {
      const entry = await api(`/${apiBase}/${activeCampaign._id}`, {
        method: 'POST',
        body: isDM
          ? { session: nextNum, title: `Session ${nextNum}`, content: '' }
          : { day: nextNum, title: `Day ${nextNum}`, content: '' },
      })
      setEntries(p => [...p, entry])
      setActiveId(entry._id)
      setContent('')
    } catch (err) {
      if (err && (err.status === 403 || String(err.message || '').toLowerCase().includes('limited'))) {
        setShowUpgrade(true)
        return
      }
      toast(`Failed to create ${noun.toLowerCase()}`)
    }
  }

  const save = async () => {
    if (!activeId) return
    setSaving(true)
    try {
      const updated = await api(`/${apiBase}/${activeId}`, { method: 'PUT', body: { content } })
      setEntries(p => p.map(e => e._id === activeId ? updated : e))
      toast('Saved')
    } catch { toast('Save failed') }
    setSaving(false)
  }

  const entryNum = e => e.session ?? e.day ?? '?'

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select or create a campaign to get started.
    </div>
  )

  return (
    <div className="journal-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div className="journal-day-list" style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{nounPlural}</span>
          <button className="btn btn-ghost btn-sm" onClick={newEntry} style={{ padding: '3px 8px' }}>+</button>
        </div>
        {entries.map(e => (
          <button key={e._id} onClick={() => selectEntry(e)} style={{
            display: 'block', width: '100%', textAlign: 'left', border: 'none',
            padding: '9px 14px', background: activeId === e._id ? 'var(--gold-bg)' : 'transparent',
            color: activeId === e._id ? 'var(--gold)' : 'var(--text-2)',
            fontSize: 13, cursor: 'pointer', borderLeft: `2px solid ${activeId === e._id ? 'var(--gold)' : 'transparent'}`,
          }}>
            <div style={{ fontWeight: 500 }}>{noun} {entryNum(e)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{wordCount(e.content || '')} words</div>
          </button>
        ))}
        {!entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>No {nounPlural.toLowerCase()} yet.</div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 16 }}>
            {active ? `${noun} ${entryNum(active)}` : `Select a ${noun.toLowerCase()}`}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{wordCount(content)} words</span>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !activeId}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {activeId ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', minHeight: '100%', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'transparent',
                fontFamily: 'Georgia, serif',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              No {noun.toLowerCase()} selected. Start a new one with +
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
