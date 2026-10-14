import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import UpgradeModal from '../components/UpgradeModal'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonTextLines } from '../components/Skeleton'

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

// Player-only journal — split out from the old shared Journal/Sessions page.
// DMs now use SessionPlanner.jsx instead (see /session-planner route).
export default function Journal() {
  const { activeCampaign, campaignsLoading, campaignsError, reload: reloadCampaigns } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()

  const apiBase    = 'journal'
  const placeholder = 'Record what happened this session…'

  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [entriesError, setEntriesError] = useState('')
  const [entriesReload, setEntriesReload] = useState(0)
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')
  const saveTimer = useRef(null)

  const active = entries.find(e => e._id === activeId)
  const entryNum = e => e.day ?? '?'
  const entryTitle = e => e.title || `Day ${entryNum(e)}`

  useEffect(() => {
    if (!activeCampaign) {
      setEntries([])
      setActiveId(null)
      setContent('')
      setEntriesLoading(false)
      return
    }
    let cancelled = false
    setEntries([])
    setActiveId(null)
    setContent('')
    setEntriesLoading(true)
    setEntriesError('')
    api(`/${apiBase}/${activeCampaign._id}?kind=day`)
      .then(data => {
        if (cancelled) return
        setEntries(data)
        if (data.length) { setActiveId(data[0]._id); setContent(data[0].content) }
      })
      .catch(err => {
        if (!cancelled) setEntriesError(err.message || 'Failed to load journal entries')
      })
      .finally(() => {
        if (!cancelled) setEntriesLoading(false)
      })
    return () => { cancelled = true }
  }, [activeCampaign, entriesReload])

  const selectEntry = (e) => {
    // Flush any pending save for the current entry before switching
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setActiveId(e._id)
    setContent(e.content)
  }

  // Autosave — debounced 800ms after the user stops typing.
  // We do NOT replace the full entry from the server response because that
  // would cause a re-render where `active` momentarily resolves to the stale
  // server object and the textarea content flashes blank. Instead we only
  // update the content field in place, keeping local state as source of truth.
  const autosave = useCallback(async (id, text) => {
    if (!id) return
    setSaving(true)
    try {
      await api(`/${apiBase}/${id}`, { method: 'PUT', body: { content: text } })
      // Only update content in the sidebar list (word count), don't replace whole entry
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
    const flush = () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
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
    // Optimistic update so the sidebar/header reflect the new title instantly
    setEntries(p => p.map(e => e._id === id ? { ...e, title } : e))
    try {
      await api(`/${apiBase}/${id}`, { method: 'PUT', body: { title } })
    } catch { toast('Failed to rename day') }
  }

  const newEntry = async () => {
    if (!activeCampaign) return
    const maxNum = entries.reduce((m, e) => Math.max(m, e.day ?? 0), 0)
    const nextNum = maxNum + 1
    try {
      const entry = await api(`/${apiBase}/${activeCampaign._id}`, {
        method: 'POST',
        body: { day: nextNum, title: `Day ${nextNum}`, content: '' },
      })
      setEntries(p => [entry, ...p])
      setActiveId(entry._id)
      setContent('')
    } catch (err) {
      if (err && (err.status === 403 || String(err.message || '').toLowerCase().includes('limited'))) {
        setShowUpgrade(true)
        return
      }
      toast('Failed to create day')
    }
  }

  // DMs shouldn't land here — send them to their own Session Planner instead.
  // (Placed after all hooks above to satisfy the Rules of Hooks.)
  if (user?.role === 'dm') return <Navigate to="/session-planner" replace />

  if (!activeCampaign) return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Journal</h2>
      </div>
      {campaignsLoading
        ? <SkeletonTextLines lines={10} style={{ maxWidth: 720 }} />
        : campaignsError
          ? <div style={{ color: 'var(--text-2)' }}>
              <p style={{ marginBottom: 12 }}>{campaignsError}</p>
              <button className="btn btn-ghost" onClick={reloadCampaigns}>Retry</button>
            </div>
          : <p style={{ color: 'var(--text-3)' }}>Select or create a campaign to get started.</p>}
    </div>
  )

  // Sort sidebar numerically by day number, descending (newest first) —
  // independent of title text, so renaming a title never shuffles the list.
  const sorted = [...entries].sort((a, b) => (b.day ?? 0) - (a.day ?? 0))

  return (
    <div className="journal-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div className="journal-day-list" style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</span>
          <button className="btn btn-ghost btn-sm" onClick={newEntry} style={{ padding: '3px 8px' }}>+</button>
        </div>
        {sorted.map(e => (
          <div key={e._id}
            onClick={(ev) => { if (renamingId === e._id) return; selectEntry(e) }}
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
                <span
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => startRename(ev, e)}
                  title="Click to rename"
                  style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text', flex: 1 }}
                >{entryTitle(e)}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {wordCount(e.content || '')} words
            </div>
          </div>
        ))}
        {!entriesLoading && !entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>No days yet.</div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <h2 onClick={(ev) => { if (active && renamingId !== active._id) startRename(ev, active) }} style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'text' }}>
            {active ? (
              renamingId === active._id ? (
                <input
                  autoFocus
                  className="input"
                  value={titleDraft}
                  onClick={ev => ev.stopPropagation()}
                  onChange={ev => setTitleDraft(ev.target.value)}
                  onBlur={() => commitRename(active._id)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') { ev.preventDefault(); commitRename(active._id) }
                    if (ev.key === 'Escape') setRenamingId(null)
                  }}
                  style={{ fontSize: 15, padding: '3px 8px' }}
                />
              ) : (
                <span
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => startRename(ev, active)}
                  title="Click to rename"
                  style={{ cursor: 'text' }}
                >
                  {entryTitle(active)}
                </span>
              )
            ) : 'Select a day'}
            {active && renamingId !== active._id && (
              <button
                type="button"
                onClick={(ev) => startRename(ev, active)}
                title="Rename"
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1 }}
              >✎</button>
            )}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{wordCount(content)} words</span>
            {/* Autosave indicator — no manual save button needed */}
            {saving && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Saving…</span>}
            {!saving && activeId && <span style={{ fontSize: 11, color: 'var(--green)' }}>Saved</span>}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {entriesLoading ? (
            <SkeletonTextLines lines={12} style={{ maxWidth: 840 }} />
          ) : entriesError ? (
            <div style={{ color: 'var(--text-2)' }}>
              <p style={{ marginBottom: 12 }}>{entriesError}</p>
              <button className="btn btn-ghost" onClick={() => setEntriesReload(n => n + 1)}>Retry</button>
            </div>
          ) : activeId ? (
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
              No day selected. Start a new one with +
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
