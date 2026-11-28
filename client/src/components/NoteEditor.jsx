import { useEffect, useRef, useState } from 'react'
import { toMarkdown, fillFromMarkdown } from '../utils/richText'

// The writing box used by the Journal and the Session Planner. What you type is formatted as you go: Bold and Italic
// (buttons, or Ctrl/Cmd+B and Ctrl/Cmd+I) change the text straight away, with no symbols showing. It is saved as plain
// Markdown (**bold**, *italic*, "- " bullets), so nothing is lost if formatting is never used.
const barBtn = (on) => ({
  minWidth: 30, height: 28, padding: '0 8px', borderRadius: 5, cursor: 'pointer', fontSize: 13, lineHeight: 1,
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`, background: on ? 'var(--gold-bg)' : 'var(--surface)',
  color: on ? 'var(--gold)' : 'var(--text-2)',
})

export default function NoteEditor({ value, onChange, placeholder }) {
  const ref = useRef(null)
  const lastSent = useRef(null)          // the text this editor last reported, so its own typing never rewrites the box
  const [state, setState] = useState({ bold: false, italic: false })

  // Show the text when it comes from outside (opening another entry); never while it is the editor's own change.
  useEffect(() => {
    const el = ref.current
    if (!el || value === lastSent.current) return
    if (value && value.trim()) fillFromMarkdown(el, value); else el.textContent = ''
    el.dataset.empty = value && value.trim() ? '' : '1'
    lastSent.current = value
  }, [value])

  useEffect(() => {
    const read = () => {
      const el = ref.current
      if (!el || !el.contains(document.getSelection()?.anchorNode)) return
      setState({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') })
    }
    document.addEventListener('selectionchange', read)
    return () => document.removeEventListener('selectionchange', read)
  }, [])

  const emit = () => {
    const md = toMarkdown(ref.current)
    ref.current.dataset.empty = md.trim() ? '' : '1'
    lastSent.current = md
    onChange(md)
  }

  const run = (cmd) => {
    ref.current?.focus()
    try { document.execCommand('styleWithCSS', false, false) } catch { /* older browsers */ }
    document.execCommand(cmd)
    emit()
    setState({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') })
  }

  const onPaste = (e) => {
    e.preventDefault()
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`.note-editor[data-empty="1"]::before{content:attr(data-placeholder);color:var(--text-3);pointer-events:none}.note-editor ul{margin:0 0 0 1.3em;padding:0}`}</style>
      <div role="toolbar" aria-label="Formatting" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12, position: 'sticky', top: -24, zIndex: 2, background: 'var(--bg, var(--surface))', padding: '2px 0 8px' }}>
        <button type="button" title="Bold (Ctrl+B)" aria-label="Bold" aria-pressed={state.bold} onMouseDown={e => e.preventDefault()} onClick={() => run('bold')} style={{ ...barBtn(state.bold), fontWeight: 800 }}>B</button>
        <button type="button" title="Italic (Ctrl+I)" aria-label="Italic" aria-pressed={state.italic} onMouseDown={e => e.preventDefault()} onClick={() => run('italic')} style={{ ...barBtn(state.italic), fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>I</button>
        <button type="button" title="Bullet list" aria-label="Bullet list" onMouseDown={e => e.preventDefault()} onClick={() => run('insertUnorderedList')} style={barBtn(false)}>&bull; List</button>
      </div>
      <div
        ref={ref}
        className="note-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Notes"
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={onPaste}
        spellCheck
        style={{ flex: 1, minHeight: 320, outline: 'none', fontSize: 15, lineHeight: 1.8, color: 'var(--text)', fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      />
    </div>
  )
}
