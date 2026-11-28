import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import UpgradeModal from '../components/UpgradeModal'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonTextLines } from '../components/Skeleton'
import NoteEditor from '../components/NoteEditor'
import ConfirmNameDialog from '../components/ConfirmNameDialog'
import { isPublicDemoPath } from '../utils/demoRuntime'

const fmtDate = d => d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const fmtDateTime = d => d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''
const campaignLabel = c => (c.isPersonal ? 'Personal journal' : c.name)

// Player-only journal — split out from the old shared Journal/Sessions page.
// DMs now use SessionPlanner.jsx instead (see /session-planner route).
export default function Journal() {
  const { campaigns, activeCampaign, setActive, campaignsLoading, campaignsError, reload: reloadCampaigns } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()

  const apiBase    = 'journal'
  const placeholder = 'Record what happened this session…'

  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [entriesCampaignId, setEntriesCampaignId] = useState(null)
  const [entriesError, setEntriesError] = useState('')
  const [entriesReload, setEntriesReload] = useState(0)
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [hasEditedContent, setHasEditedContent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [titleDraft, setTitleDraft] = useState('')
  const renameCancelled = useRef(false)
  const { schedule: scheduleSave, flush: flushSave } = useDebouncedSave(800)

  const active = entries.find(e => e._id === activeId)
  const entryNum = e => e.day ?? '?'
  const entryTitle = e => e.title || `Day ${entryNum(e)}`
  const loadingContent = campaignsLoading || (activeCampaign && (entriesLoading || entriesCampaignId !== activeCampaign._id))

  useEffect(() => {
    if (!activeCampaign) {
      setEntries([])
      setEntriesCampaignId(null)
      setActiveId(null)
      setContent('')
      setHasEditedContent(false)
      setEntriesLoading(false)
      return
    }
    let cancelled = false
    setEntries([])
    setActiveId(null)
    setContent('')
    setHasEditedContent(false)
    setEntriesLoading(true)
    setEntriesError('')
    api(`/${apiBase}/${activeCampaign._id}?kind=day`)
      .then(data => {
        if (cancelled) return
        setEntries(data)
        setEntriesCampaignId(activeCampaign._id)
        if (data.length) { setActiveId(data[0]._id); setContent(data[0].content); setHasEditedContent(false) }
      })
      .catch(err => {
        if (!cancelled) {
          setEntriesCampaignId(activeCampaign._id)
          setEntriesError(err.message || 'Failed to load journal entries')
        }
      })
      .finally(() => {
        if (!cancelled) setEntriesLoading(false)
      })
    return () => { cancelled = true; flushSave() }
  }, [activeCampaign, entriesReload, flushSave])

  const selectEntry = (e) => {
    // Flush any pending save for the current entry before switching
    flushSave()
    setActiveId(e._id)
    setContent(e.content)
    setHasEditedContent(false)
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
      // Only update content/updatedAt in the list, don't replace the whole entry
      setEntries(p => p.map(e => e._id === id ? { ...e, content: text, updatedAt: new Date().toISOString() } : e))
    } catch { /* silently ignore — next keystroke will retry */ }
    setSaving(false)
  }, [])

  const handleContentChange = (text) => {
    setContent(text)
    setHasEditedContent(true)
    const id = activeId
    scheduleSave(() => autosave(id, text))
  }

  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteEntry = async () => {
    const id = activeId
    if (!id) return
    setDeleteBusy(true); setDeleteError('')
    try {
      flushSave()
      await api(`/${apiBase}/${id}`, { method: 'DELETE' })
      const rest = entries.filter(e => e._id !== id)
      setEntries(rest)
      const next = [...rest].sort((a, b) => (b.day ?? 0) - (a.day ?? 0))[0]
      setActiveId(next ? next._id : null); setContent(next ? next.content : '')
      setDeleting(false)
      toast('Day deleted')
    } catch { setDeleteError('Could not delete it. Please try again.') }
    setDeleteBusy(false)
  }

  const startRename = (e, entry) => {
    e.stopPropagation()
    renameCancelled.current = false
    setRenamingId(entry._id)
    setTitleDraft(entryTitle(entry))
  }

  const finishRename = (id) => {
    if (renameCancelled.current) {
      renameCancelled.current = false
      setRenamingId(null)
      return
    }
    commitRename(id)
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
      setHasEditedContent(false)
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
  if (user?.role === 'dm' && !isPublicDemoPath()) return <Navigate to="/session-planner" replace />

  // Sort sidebar numerically by day number, descending (newest first) —
  // independent of title text, so renaming a title never shuffles the list.
  const sorted = [...entries].sort((a, b) => (b.day ?? 0) - (a.day ?? 0))

  return (
    <div className="journal-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div className="journal-day-list" style={{ width: 210, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        {campaigns?.length > 0 && (
          <div className="journal-campaign-pick" style={{ padding: '12px 14px 4px', flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }} htmlFor="journal-campaign">Campaign</label>
            <select
              id="journal-campaign" className="input" style={{ padding: '6px 8px', fontSize: 13 }}
              value={activeCampaign?._id || ''}
              onChange={ev => { flushSave(); const c = campaigns.find(x => x._id === ev.target.value); if (c) setActive(c) }}
            >
              {campaigns.map(c => <option key={c._id} value={c._id}>{campaignLabel(c)}</option>)}
            </select>
          </div>
        )}
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</span>
          <button className="btn btn-ghost btn-sm" onClick={newEntry} disabled={!activeCampaign} style={{ padding: '3px 8px' }}>+</button>
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
              {renamingId === e._id && e._id !== activeId ? (
                <input
                  autoFocus
                  className="input"
                  value={titleDraft}
                  onClick={ev => ev.stopPropagation()}
                  onChange={ev => setTitleDraft(ev.target.value)}
                  onBlur={() => finishRename(e._id)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') { ev.preventDefault(); ev.currentTarget.blur() }
                    if (ev.key === 'Escape') { ev.preventDefault(); renameCancelled.current = true; ev.currentTarget.blur() }
                  }}
                  style={{ fontSize: 12, padding: '2px 6px', width: '100%' }}
                />
              ) : (
                <span
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={e._id === activeId && renamingId !== e._id ? (ev) => startRename(ev, e) : undefined}
                  title={e._id === activeId && renamingId !== e._id ? 'Click to rename' : undefined}
                  style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text', flex: 1 }}
                >{entryTitle(e)}</span>
              )}
            </div>
            {e.createdAt && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{fmtDate(e.createdAt)}</div>}
          </div>
        ))}
        {!loadingContent && activeCampaign && !entriesError && !entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>No days yet.</div>
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
                  onBlur={() => finishRename(active._id)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter') { ev.preventDefault(); ev.currentTarget.blur() }
                    if (ev.key === 'Escape') { ev.preventDefault(); renameCancelled.current = true; ev.currentTarget.blur() }
                  }}
                  style={{ fontSize: 15, padding: '3px 8px' }}
                />
              ) : (
                <button
                  type="button"
                  onClick={(ev) => startRename(ev, active)}
                  title="Click to rename"
                  aria-label={`Rename ${entryTitle(active)}`}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', letterSpacing: 'inherit', cursor: 'text', textAlign: 'left' }}
                >
                  {entryTitle(active)}
                </button>
              )
            ) : 'Select a day'}
            {active && renamingId !== active._id && (
              <button
                type="button"
                onClick={(ev) => startRename(ev, active)}
                title="Edit title"
                aria-label={`Edit title: ${entryTitle(active)}`}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 2, lineHeight: 1 }}
              >✎</button>
            )}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Autosave indicator — no manual save button needed */}
            {saving && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Saving…</span>}
            {isPublicDemoPath() ? (
              <Link to="/register" className="journal-demo-save-link">Sign up to save journal entries</Link>
            ) : (
              !saving && activeId && <span style={{ fontSize: 11, color: 'var(--green)' }}>Saved</span>
            )}
            {active && !isPublicDemoPath() && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDeleteError(''); setDeleting(true) }} title="Delete this day" style={{ color: 'var(--red)', padding: '3px 10px' }}>Delete</button>}
          </div>
        </div>
        {active && activeCampaign && (
          <div className="journal-details" style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--text-2)', display: 'flex', flexWrap: 'wrap', gap: '4px 18px' }}>
            <span><b style={{ fontWeight: 600 }}>Campaign:</b> {campaignLabel(activeCampaign)}</span>
            {active.createdAt && <span><b style={{ fontWeight: 600 }}>Written:</b> {fmtDate(active.createdAt)}</span>}
            {active.updatedAt && <span><b style={{ fontWeight: 600 }}>Last edited:</b> {fmtDateTime(active.updatedAt)}</span>}
          </div>
        )}
        <div className="journal-content-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {loadingContent ? (
            <SkeletonTextLines lines={12} style={{ maxWidth: 840 }} />
          ) : campaignsError ? (
            <div style={{ textAlign: 'center', color: 'var(--text-2)', marginTop: 60, fontSize: 13 }}>
              <p style={{ marginBottom: 12 }}>{campaignsError}</p>
              <button className="btn btn-ghost" onClick={reloadCampaigns}>Retry</button>
            </div>
          ) : !activeCampaign ? (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              Select or create a campaign to get started.
            </div>
          ) : entriesError ? (
            <div style={{ color: 'var(--text-2)' }}>
              <p style={{ marginBottom: 12 }}>{entriesError}</p>
              <button className="btn btn-ghost" onClick={() => setEntriesReload(n => n + 1)}>Retry</button>
            </div>
          ) : activeId ? (
            <>
              <NoteEditor value={content} onChange={handleContentChange} placeholder={placeholder} />
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              No day selected. Start a new one with +
            </div>
          )}
        </div>
      </div>

      <ToastContainer />
      {deleting && active && <ConfirmNameDialog title={'Delete this day'} name={entryTitle(active)} message="This permanently deletes this journal entry and everything written in it. It cannot be undone." working={deleteBusy} error={deleteError} onConfirm={deleteEntry} onClose={() => setDeleting(false)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
