import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

export default function Journal() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const active = entries.find(e => e._id === activeId)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/journal/${activeCampaign._id}`)
    setEntries(data)
    if (data.length) { setActiveId(data[0]._id); setContent(data[0].content) }
    else { setActiveId(null); setContent('') }
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const selectEntry = (e) => { setActiveId(e._id); setContent(e.content) }

  const newDay = async () => {
    if (!activeCampaign) return
    const maxDay = entries.reduce((m, e) => Math.max(m, e.day), 0)
    const entry = await api(`/journal/${activeCampaign._id}`, {
      method: 'POST', body: { day: maxDay + 1, title: `Day ${maxDay + 1}`, content: '' }
    })
    setEntries(p => [...p, entry])
    setActiveId(entry._id); setContent('')
  }

  const save = async () => {
    if (!activeId) return
    setSaving(true)
    try {
      const updated = await api(`/journal/${activeId}`, { method: 'PUT', body: { content } })
      setEntries(p => p.map(e => e._id === activeId ? updated : e))
      toast('Saved')
    } catch { toast('Save failed') }
    setSaving(false)
  }

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select or create a campaign to get started.
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Day list */}
      <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</span>
          <button className="btn btn-ghost btn-sm" onClick={newDay} style={{ padding: '3px 8px' }}>+</button>
        </div>
        {entries.map(e => (
          <button key={e._id} onClick={() => selectEntry(e)} style={{
            display: 'block', width: '100%', textAlign: 'left', border: 'none',
            padding: '9px 14px', background: activeId === e._id ? 'var(--gold-bg)' : 'transparent',
            color: activeId === e._id ? 'var(--gold)' : 'var(--text-2)',
            fontSize: 13, cursor: 'pointer', borderLeft: `2px solid ${activeId === e._id ? 'var(--gold)' : 'transparent'}`,
          }}>
            <div style={{ fontWeight: 500 }}>Day {e.day}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {wordCount(e.content || '')} words
            </div>
          </button>
        ))}
        {!entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>No entries yet.</div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 16 }}>{active ? `Day ${active.day}` : 'Select a day'}</h2>
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
              placeholder="Record what happened this session..."
              style={{
                width: '100%', minHeight: '100%', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'transparent',
                fontFamily: 'Georgia, serif',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              No day selected. Start a new one with +
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
