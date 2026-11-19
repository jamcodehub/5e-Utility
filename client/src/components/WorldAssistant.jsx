import { useState, useRef, useEffect } from 'react'
import { useWorldAssistant } from '../context/WorldAssistantContext'

// A question-only world-building guide: it never writes campaign content, it asks the DM
// questions so the DM stays the author. State lives in WorldAssistantContext, so a pending
// reply keeps working while you move between pages.
export default function WorldAssistant({ campaignId, onClose }) {
  const { messages, busy, error, send, clear, markRead } = useWorldAssistant(campaignId)
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  useEffect(() => { markRead() }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps
  // Scroll only the message list (scrollIntoView would also scroll the page sideways while the panel is off-screen).
  useEffect(() => { const el = endRef.current?.parentElement; if (el) el.scrollTop = el.scrollHeight }, [messages, busy])

  const submit = (text, opts) => { const t = text.trim(); if (!t || busy) return; setDraft(''); send(t, opts) }

  const bubble = (m, i) => (
    <div key={i} style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%', whiteSpace: 'pre-wrap',
      padding: '8px 11px', borderRadius: 10, fontSize: 13, lineHeight: 1.5,
      background: m.role === 'user' ? 'var(--gold-bg)' : 'var(--surface2)',
      border: `1px solid ${m.role === 'user' ? 'var(--gold-border)' : 'var(--border)'}`,
      color: 'var(--text)',
    }}>{m.text}</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.04em' }}>World-building guide</span>
          {onClose && <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close the guide" style={{ marginLeft: 'auto', marginRight: 6, padding: '4px 10px', fontSize: 13 }}>✕ Close</button>}
          {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Clear this conversation?')) clear() }} style={{ padding: '2px 8px', fontSize: 11 }}>Clear</button>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>Asks questions only. You write the world.</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {messages.length === 0 && !busy && (
          <div style={{ textAlign: 'center', padding: '24px 6px', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
            Stuck on your setting, factions or plot? I'll ask the questions that help you decide.
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => submit('Help me build my world. Ask me your first question.')}>Start with a question</button>
            </div>
          </div>
        )}
        {messages.map(bubble)}
        {busy && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-3)' }}>Thinking of a question… you can keep working, it will be here when you're back.</div>}
        {error && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--red)' }}>
            {error}
            {messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, padding: '1px 8px', fontSize: 11 }} onClick={() => submit(messages[messages.length - 1].text, { retry: true })}>Retry</button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(draft) }} style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          className="input" rows={2} value={draft} placeholder="Answer, or say what you're unsure about…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(draft) } }}
          style={{ flex: 1, resize: 'none', fontSize: 16 }} maxLength={2000}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !draft.trim()}>Send</button>
      </form>
    </div>
  )
}
