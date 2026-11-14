import { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

// Wrap any text to show a short-form rules summary on hover, keyboard focus or tap.
// `tip` is { title, tag, stats: string[], summary } (see utils/ruleTips.js); no tip = plain children.
export default function RuleTip({ tip, children, style, as: Tag = 'span' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const anchor = useRef(null), bubble = useRef(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current || !bubble.current) return
    const a = anchor.current.getBoundingClientRect(), b = bubble.current.getBoundingClientRect()
    const left = Math.min(Math.max(8, a.left + a.width / 2 - b.width / 2), window.innerWidth - b.width - 8)
    const below = a.top < b.height + 16
    setPos({ left, top: below ? a.bottom + 8 : a.top - b.height - 8 })
  }, [open])

  if (!tip) return <Tag style={style}>{children}</Tag>
  return (
    <>
      <Tag
        ref={anchor} tabIndex={0} style={{ cursor: 'help', ...style }}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
      >{children}</Tag>
      {open && createPortal(
        <div ref={bubble} role="tooltip" style={{
          position: 'fixed', left: pos.left, top: pos.top, zIndex: 3000, width: 260, pointerEvents: 'none',
          background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--gold-border)', borderRadius: 10,
          padding: '10px 12px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', fontSize: 12, lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
            <strong style={{ fontFamily: 'var(--font-title)', fontSize: 13, color: 'var(--gold)' }}>{tip.title}</strong>
            <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{tip.tag}</span>
          </div>
          {tip.stats.map((s, i) => <div key={i} style={{ marginTop: 4, color: 'var(--text-2)' }}>{s}</div>)}
          {tip.summary && <div style={{ marginTop: 6, color: 'var(--text-2)' }}>{tip.summary}</div>}
        </div>,
        document.body,
      )}
    </>
  )
}
