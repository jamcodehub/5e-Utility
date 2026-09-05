import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import UpgradeModal from '../components/UpgradeModal'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

// DM-only session planner — split out from Journal.jsx so DMs and players
// each get a page tailored to their own workflow (numbered sessions vs. days).
export default function SessionPlanner() {
  const { activeCampaign } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()

  const apiBase = 'journal' // shared backend collection; DMs use the `session` field
  const placeholder = 'Plan this session — encounters, NPCs, pacing, hooks, notes for the table…'

  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')
  const saveTimer = useRef(null)

  const active = entries.find(e => e._id === activeId)
  const entryNum = e => e.session ?? '?'
  const entryTitle = e => e.title || `Session ${entryNum(e)}`

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/${apiBase}/${activeCampaign._id}`)
    setEntries(data)
    if (data.length) { setActiveId(data[0]._id); setContent(data[0].content) }
    else { setActiveId(null); setContent('') }
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const selectEntry = (e) => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    setActiveId(e._id)
    setContent(e.content)
  }

  // Autosave — debounced 800ms after typing stops (same pattern as Journal).
  const autosave = useCallback(async (id, text) => {
    if (!id) return
    setSaving(true)
    try {
      await api(`/${apiBase}/${id}`, { method: 'PUT', body: { content: text } })
      setEntries(p => p.map(e => e._id === id ? { ...e, content: text } : e))
    } catch { /* silently ignore — next keystroke will retry */ }
    setSaving(false)
  }, [])

  const handleContentChange = (e) => {
    const text = e.target.value
    setContent(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autosave(activeId, text), 800)
  }

  // Flush on unmount / tab close so nothing typed just before navigating away is lost.
  useEffect(() => {
    const flush = () => { if (saveTimer.current) { clearTimeout(saveTimer.current) } }
    window.addEventListener('beforeunload', flush)
    return () => { flush(); window.removeEventListener('beforeunload', flush) }
  }, [])

  const startRename = (e, entry) => {
    e.stopPropagation()
    setRenamingId(entry._id)
    setTitleDraft(entryTitle(entry))
  }

  const commitRename = async (id) => {
    const title = titleDraft.trim()
    setRenamingId(null)
    if (!title) return
    setEntries(p => p.map(e => e._id === id ? { ...e, title } : e))
    try {
      await api(`/${apiBase}/${id}`, { method: 'PUT', body: { title } })
    } catch { toast('Failed to rename session') }
  }

  const newEntry = async () => {
    if (!activeCampaign) return
    // Numeric ordering fix: base the next session number on the highest
    // existing session number, not creation order, so renaming/reordering
    // titles never desyncs the underlying sequence.
    const maxNum = entries.reduce((m, e) => Math.max(m, e.session ?? 0), 0)
    const nextNum = maxNum + 1
    try {
      const entry = await api(`/${apiBase}/${activeCampaign._id}`, {
        method: 'POST',
        body: { session: nextNum, title: `Session ${nextNum}`, content: '' },
      })
      setEntries(p => [entry, ...p])
      setActiveId(entry._id)
      setContent('')
    } catch (err) {
      if (err && (err.status === 403 || String(err.message || '').toLowerCase().includes('limited'))) {
        setShowUpgrade(true)
        return
      }
      toast('Failed to create session')
    }
  }

  // Players shouldn't land here — send them to their own Journal instead.
  // (Placed after all hooks above to satisfy the Rules of Hooks.)
  if (user?.role !== 'dm') return <Navigate to="/journal" replace />

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select or create a campaign to get started.
    </div>
  )

  // Sort sidebar numerically by session number, descending (newest first) —
  // independent of title text or creation order, so renaming a title never
  // shuffles the list.
  const sorted = [...entries].sort((a, b) => (b.session ?? 0) - (a.session ?? 0))

  return (
    <div className="journal-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div className="journal-day-list" style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions</span>
          <button className="btn btn-ghost btn-sm" onClick={newEntry} style={{ padding: '3px 8px' }}>+</button>
        </div>
        {sorted.map(e => (
          <div key={e._id}
            onClick={() => renamingId !== e._id && selectEntry(e)}
            style={{
              width: '100%', textAlign: 'left', border: 'none',
              padding: '9px 14px',
              background: activeId === e._id ? 'var(--gold-bg)' : 'transparent',
              color: activeId === e._id ? 'var(--gold)' : 'var(--text-2)',
              fontSize: 13, cursor: 'pointer',
              borderLeft: `2px solid ${activeId === e._id ? 'var(--gold)' : 'transparent'}`,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              {renamingId === e._id ? (
                <input
                  autoFocus
                  className="input"
                  value={titleDraft}
                  onClick={ev => ev.stopPropagation()}
                  onChange={ev => setTitleDraft(ev.target.value)}
                  onBlur={() => commitRename(e._id)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') { ev.preventDefault(); commitRename(e._id) }
                    if (ev.key === 'Escape') setRenamingId(null)
                  }}
                  style={{ fontSize: 12, padding: '2px 6px', width: '100%' }}
                />
              ) : (
                <>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entryTitle(e)}</span>
                  <button
                    onClick={(ev) => startRename(ev, e)}
                    title="Rename"
                    style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.55, cursor: 'pointer', fontSize: 12, flexShrink: 0, padding: '2px 4px', lineHeight: 1 }}
                  >✎</button>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {wordCount(e.content || '')} words
            </div>
          </div>
        ))}
        {!entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>No sessions yet.</div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {active ? (
              renamingId === active._id ? (
                <input
                  autoFocus
                  className="input"
                  value={titleDraft}
                  onChange={ev => setTitleDraft(ev.target.value)}
                  onBlur={() => commitRename(active._id)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') { ev.preventDefault(); commitRename(active._id) }
                    if (ev.key === 'Escape') setRenamingId(null)
                  }}
                  style={{ fontSize: 15, padding: '3px 8px' }}
                />
              ) : (
                <>
                  <span>{entryTitle(active)}</span>
                  <button
                    onClick={(ev) => startRename(ev, active)}
                    title="Rename"
                    style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.5, cursor: 'pointer', fontSize: 13, padding: 0 }}
                  >✎</button>
                </>
              )
            ) : 'Select a session'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{wordCount(content)} words</span>
            {saving && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Saving…</span>}
            {!saving && activeId && <span style={{ fontSize: 11, color: 'var(--green)' }}>Saved</span>}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {activeId ? (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={placeholder}
              style={{
                width: '100%', minHeight: '100%', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'transparent',
                fontFamily: 'Georgia, serif',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              No session selected. Start a new one with +
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
