import { useState, useEffect, useCallback, useRef } from 'react'
import UpgradeModal from '../components/UpgradeModal'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

export default function Journal({
  entryType = 'journal',
  entryLabel = 'Day',
  pageTitle = 'Journal',
  emptyHint = 'No entries yet.',
  selectHint = 'No day selected. Start a new one with +',
}) {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [entries, setEntries] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [content, setContent] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved') // saved | saving | unsaved
  const saveTimer = useRef(null)
  const contentRef = useRef(content)
  const activeIdRef = useRef(activeId)

  contentRef.current = content
  activeIdRef.current = activeId

  const active = entries.find(e => e._id === activeId)
  const apiType = entryType === 'session' ? 'session' : 'journal'

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/journal/${activeCampaign._id}?type=${apiType}`)
    setEntries(data)
    if (data.length) { setActiveId(data[0]._id); setContent(data[0].content); setSaveStatus('saved') }
    else { setActiveId(null); setContent(''); setSaveStatus('saved') }
  }, [activeCampaign, apiType])

  useEffect(() => { load() }, [load])

  const persist = useCallback(async (id, text) => {
    if (!id) return
    setSaveStatus('saving')
    try {
      const updated = await api(`/journal/${id}`, { method: 'PUT', body: { content: text } })
      setEntries(p => p.map(e => e._id === id ? updated : e))
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
      toast('Auto-save failed')
    }
  }, [toast])

  useEffect(() => {
    if (!activeId) return
    setSaveStatus('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persist(activeId, content), 800)
    return () => clearTimeout(saveTimer.current)
  }, [content, activeId, persist])

  useEffect(() => () => {
    clearTimeout(saveTimer.current)
    if (activeIdRef.current && contentRef.current !== undefined) {
      persist(activeIdRef.current, contentRef.current)
    }
  }, [persist])

  const selectEntry = (e) => {
    if (activeId && saveStatus === 'unsaved') persist(activeId, content)
    setActiveId(e._id)
    setContent(e.content)
    setSaveStatus('saved')
  }

  const [showUpgrade, setShowUpgrade] = useState(false)

  const newEntry = async () => {
    if (!activeCampaign) return
    if (activeId && saveStatus === 'unsaved') await persist(activeId, content)
    const maxDay = entries.reduce((m, e) => Math.max(m, e.day), 0)
    try {
      const entry = await api(`/journal/${activeCampaign._id}`, {
        method: 'POST',
        body: { day: maxDay + 1, title: `${entryLabel} ${maxDay + 1}`, content: '', entryType: apiType },
      })
      setEntries(p => [...p, entry])
      setActiveId(entry._id)
      setContent('')
      setSaveStatus('saved')
    } catch (err) {
      if (err && (err.status === 403 || String(err.message || '').toLowerCase().includes('limited'))) {
        setShowUpgrade(true)
        return
      }
      toast(`Failed to create ${entryLabel.toLowerCase()}`)
    }
  }

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select or create a campaign to get started.
    </div>
  )

  const saveLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved ✓'

  return (
    <div className="journal-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div className="journal-day-list" style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{entryLabel}s</span>
          <button className="btn btn-ghost btn-sm" onClick={newEntry} style={{ padding: '3px 8px' }}>+</button>
        </div>
        {entries.map(e => (
          <button key={e._id} onClick={() => selectEntry(e)} style={{
            display: 'block', width: '100%', textAlign: 'left', border: 'none',
            padding: '9px 14px', background: activeId === e._id ? 'var(--gold-bg)' : 'transparent',
            color: activeId === e._id ? 'var(--gold)' : 'var(--text-2)',
            fontSize: 13, cursor: 'pointer', borderLeft: `2px solid ${activeId === e._id ? 'var(--gold)' : 'transparent'}`,
          }}>
            <div style={{ fontWeight: 500 }}>{entryLabel} {e.day}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {wordCount(e.content || '')} words
            </div>
          </button>
        ))}
        {!entries.length && (
          <div style={{ padding: '20px 14px', fontSize: 12, color: 'var(--text-3)' }}>{emptyHint}</div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 16 }}>{active ? `${entryLabel} ${active.day}` : pageTitle}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: saveStatus === 'unsaved' ? 'var(--gold)' : 'var(--text-3)' }}>{saveLabel}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{wordCount(content)} words</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {activeId ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onBlur={() => { if (saveStatus === 'unsaved') persist(activeId, content) }}
              placeholder="Record what happened this session..."
              style={{
                width: '100%', minHeight: '100%', border: 'none', outline: 'none', resize: 'none',
                fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'transparent',
                fontFamily: 'Georgia, serif',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 60, fontSize: 13 }}>
              {selectHint}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
