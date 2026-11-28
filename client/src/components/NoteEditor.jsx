import { useRef, useState } from 'react'
import MiniMarkdown from './MiniMarkdown'

// The writing box used by the Journal and the Session Planner: a plain text area with Bold / Italic / bullet buttons
// (and Ctrl/Cmd+B, Ctrl/Cmd+I), plus a Read view that shows the formatting. The text stays ordinary Markdown
// (**bold**, *italic*), so nothing is lost if formatting is never used.
const barBtn = (on) => ({
  minWidth: 30, height: 28, padding: '0 8px', borderRadius: 5, cursor: 'pointer', fontSize: 13, lineHeight: 1,
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`, background: on ? 'var(--gold-bg)' : 'var(--surface)',
  color: on ? 'var(--gold)' : 'var(--text-2)',
})

export default function NoteEditor({ value, onChange, placeholder }) {
  const ref = useRef(null)
  const [reading, setReading] = useState(false)

  const apply = (next, from, to) => {
    onChange(next)
    requestAnimationFrame(() => { const el = ref.current; if (el) { el.focus(); el.setSelectionRange(from, to) } })
  }

  // Wraps the selection (or the word under the cursor) in the mark; with no word it inserts a pair; a second press unwraps.
  const wrap = (mark) => {
    const el = ref.current
    if (!el) return
    let a = el.selectionStart, b = el.selectionEnd
    const n = mark.length
    if (a === b) { // nothing selected: format the word the cursor is in, or insert an empty pair if it is not in a word
      const word = c => /[\p{L}\p{N}'’-]/u.test(c || '')
      let l = a, r = b
      while (l > 0 && word(value[l - 1])) l--
      while (r < value.length && word(value[r])) r++
      if (r > l) { a = l; b = r }
    }
    const sel = value.slice(a, b)
    const around = value.slice(a - n, a) === mark && value.slice(b, b + n) === mark
      && (mark.length > 1 || (value[a - 2] !== '*' && value[b + 1] !== '*'))
    if (around) return apply(value.slice(0, a - n) + sel + value.slice(b + n), a - n, b - n)
    if (sel.length > 2 * n && sel.startsWith(mark) && sel.endsWith(mark) && (mark.length > 1 || (!sel.startsWith('**') && !sel.endsWith('**'))))
      return apply(value.slice(0, a) + sel.slice(n, -n) + value.slice(b), a, b - 2 * n)
    apply(value.slice(0, a) + mark + sel + mark + value.slice(b), a + n, b + n)
  }

  // Turns every selected line into a bullet (or takes the bullets off if they are all there already).
  const bullets = () => {
    const el = ref.current
    if (!el) return
    const a = el.selectionStart, b = el.selectionEnd
    const start = value.lastIndexOf('\n', a - 1) + 1
    let end = value.indexOf('\n', b)
    if (end === -1) end = value.length
    const lines = value.slice(start, end).split('\n')
    const all = lines.every(l => /^\s*[-*]\s+/.test(l) || !l.trim())
    const out = lines.map(l => (all ? l.replace(/^(\s*)[-*]\s+/, '$1') : (l.trim() && !/^\s*[-*]\s+/.test(l) ? `- ${l}` : l))).join('\n')
    apply(value.slice(0, start) + out + value.slice(end), start, start + out.length)
  }

  const onKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === 'b') { e.preventDefault(); wrap('**') }
    else if (k === 'i') { e.preventDefault(); wrap('*') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div role="toolbar" aria-label="Formatting" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12, position: 'sticky', top: -24, zIndex: 2, background: 'var(--bg, var(--surface))', padding: '2px 0 8px' }}>
        <button type="button" disabled={reading} title="Bold (Ctrl+B)" aria-label="Bold" onMouseDown={e => e.preventDefault()} onClick={() => wrap('**')} style={{ ...barBtn(false), fontWeight: 800, opacity: reading ? 0.4 : 1 }}>B</button>
        <button type="button" disabled={reading} title="Italic (Ctrl+I)" aria-label="Italic" onMouseDown={e => e.preventDefault()} onClick={() => wrap('*')} style={{ ...barBtn(false), fontStyle: 'italic', fontFamily: 'Georgia, serif', opacity: reading ? 0.4 : 1 }}>I</button>
        <button type="button" disabled={reading} title="Bullet list" aria-label="Bullet list" onMouseDown={e => e.preventDefault()} onClick={bullets} style={{ ...barBtn(false), opacity: reading ? 0.4 : 1 }}>&bull; List</button>
        <span style={{ flex: 1 }} />
        <button type="button" aria-pressed={!reading} onClick={() => setReading(false)} style={barBtn(!reading)}>Write</button>
        <button type="button" aria-pressed={reading} onClick={() => setReading(true)} style={barBtn(reading)}>Read</button>
      </div>
      {reading ? (
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', maxWidth: 760 }}>
          {value.trim() ? <MiniMarkdown text={value} breaks large /> : <span style={{ color: 'var(--text-3)' }}>Nothing written yet.</span>}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{ width: '100%', flex: 1, minHeight: 320, border: 'none', outline: 'none', resize: 'none', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', background: 'transparent', fontFamily: 'Georgia, serif' }}
        />
      )}
    </div>
  )
}
