import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { api } from './AuthContext'

// Keeps every campaign's world-building conversation (and any request still in flight) above the
// pages, so navigating away never cancels a reply or loses the thread.
const Ctx = createContext(null)
const storeKey = (id) => `worldbuild:${id}`
const loadSaved = (id) => { try { const v = JSON.parse(localStorage.getItem(storeKey(id))); return Array.isArray(v) ? v : [] } catch { return [] } }
const REQUEST_TIMEOUT_MS = 100000 // covers a cold-starting server plus the AI's own time

export function WorldAssistantProvider({ children }) {
  const [convos, setConvos] = useState({}) // { [campaignId]: { messages, busy, error, unread } }
  const ref = useRef(convos)
  ref.current = convos

  const get = (id) => ref.current[id] || { messages: loadSaved(id), busy: false, error: '', unread: false }
  const patch = useCallback((id, fn) => setConvos(all => {
    const base = all[id] || { messages: loadSaved(id), busy: false, error: '', unread: false }
    const next = { ...base, ...fn(base) }
    try { localStorage.setItem(storeKey(id), JSON.stringify(next.messages.slice(-40))) } catch { /* ignore */ }
    return { ...all, [id]: next }
  }), [])

  const send = useCallback(async (id, text, opts = {}) => {
    const body = text.trim()
    if (!body || get(id).busy) return
    const prev = get(id).messages
    // A retry re-asks the unanswered last question instead of adding it a second time.
    const messages = opts.retry && prev[prev.length - 1]?.role === 'user' ? prev : [...prev, { role: 'user', text: body }]
    patch(id, () => ({ messages, busy: true, error: '' }))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const { reply } = await api('/ai/worldbuild', { method: 'POST', body: { campaignId: id, messages: messages.slice(-20) }, signal: controller.signal })
      patch(id, b => ({ messages: [...b.messages, { role: 'assistant', text: reply }], busy: false, unread: true }))
    } catch (e) {
      patch(id, () => ({ busy: false, error: e.name === 'AbortError' ? 'The assistant took too long to answer. Please try again.' : (e.message || 'The assistant could not answer.') }))
    } finally { clearTimeout(timer) }
  }, [patch]) // eslint-disable-line react-hooks/exhaustive-deps

  const clear = useCallback((id) => patch(id, () => ({ messages: [], error: '', unread: false })), [patch])
  const markRead = useCallback((id) => { if (ref.current[id]?.unread) patch(id, () => ({ unread: false })) }, [patch])

  return <Ctx.Provider value={{ get, send, clear, markRead, convos }}>{children}</Ctx.Provider>
}

export const useWorldAssistant = (campaignId) => {
  const c = useContext(Ctx)
  const convo = c.convos[campaignId] || { messages: loadSaved(campaignId), busy: false, error: '', unread: false }
  return {
    ...convo,
    send: (t, o) => c.send(campaignId, t, o),
    clear: () => c.clear(campaignId),
    markRead: () => c.markRead(campaignId),
  }
}
