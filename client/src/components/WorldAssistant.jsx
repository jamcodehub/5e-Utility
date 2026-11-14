import { useState, useRef, useEffect } from 'react'
import { api } from '../context/AuthContext'

const storeKey = (id) => `worldbuild:${id}`
const load = (id) => { try { const v = JSON.parse(localStorage.getItem(storeKey(id))); return Array.isArray(v) ? v : [] } catch { return [] } }

// A question-only world-building coach: it never writes campaign content, it asks the DM
// questions so the DM stays the author. The conversation is kept per campaign in this browser.
export default function WorldAssistant({ campaignId }) {
  const [messages, setMessages] = useState(() => load(campaignId))
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => { setMessages(load(campaignId)); setError('') }, [campaignId])
  useEffect(() => { try { localStorage.setItem(storeKey(campaignId), JSON.stringify(messages.slice(-40))) } catch { /* ignore */ } }, [messages, campaignId])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, busy])

  const send = async (text) => {
    const body = text.trim()
    if (!body || busy) return
    const next = [...messages, { role: 'user', text: body }]
    setMessages(next); setDraft(''); setError(''); setBusy(true)
    try {
      const { reply } = await api('/ai/worldbuild', { method: 'POST', body: { campaignId, messages: next.slice(-20) } })
      setMessages(m => [...m, { role: 'assistant', text: reply }])
    } catch (e) {
      setError(e.message || 'The assistant could not answer.')
    } finally { setBusy(false) }
  }

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
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.04em' }}>World-building guide</span>
          {messages.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm('Clear this conversation?')) setMessages([]) }} style={{ padding: '2px 8px', fontSize: 11 }}>Clear</button>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>Asks questions only. You write the world.</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 6px', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
            Stuck on your setting, factions or plot? I'll ask the questions that help you decide.
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => send('Help me build my world. Ask me your first question.')} disabled={busy}>Start with a question</button>
            </div>
          </div>
        )}
        {messages.map(bubble)}
        {busy && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-3)' }}>Thinking of a question…</div>}
        {error && <div role="alert" style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(draft) }} style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          className="input" rows={2} value={draft} placeholder="Answer, or say what you're unsure about…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
          style={{ flex: 1, resize: 'none', fontSize: 13 }} maxLength={2000}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !draft.trim()}>Send</button>
      </form>
    </div>
  )
}
