import { useState, useEffect } from 'react'
import WorldAssistant from './WorldAssistant'
import { useWorldAssistant } from '../context/WorldAssistantContext'

const EASE = 'cubic-bezier(.4,0,.2,1)'

// Slide-out world-building guide for a flex-row parent with position: relative.
// Renders the toggle tab and the right-hand panel; the panel pushes the page on desktop and overlays it on phones.
export default function GuideAssistant({ campaignId }) {
  const { busy, unread } = useWorldAssistant(campaignId)
  const [open, setOpen] = useState(() => localStorage.getItem('worldbuildOpen') === '1')
  const [narrow, setNarrow] = useState(() => window.innerWidth <= 768)
  useEffect(() => { localStorage.setItem('worldbuildOpen', open ? '1' : '0') }, [open])
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth <= 768)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)} aria-expanded={open} title={open ? 'Hide the world-building guide' : 'Open the world-building guide'}
        style={{
          position: 'absolute', top: 70, right: open ? 'min(340px, 100%)' : 0, zIndex: 5, transition: `right .3s ${EASE}`,
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', border: '1px solid var(--gold-border)', borderRight: open ? '1px solid var(--gold-border)' : 'none',
          borderRadius: '10px 0 0 10px', background: 'var(--gold-bg)', color: 'var(--gold)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}
      >✦ {open ? 'Hide' : 'Guide'}{!open && busy ? ' …' : ''}{!open && unread && !busy ? ' ●' : ''}</button>
      <aside
        aria-hidden={!open}
        style={{
          width: 'min(340px, 100%)', flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', visibility: open ? 'visible' : 'hidden',
          ...(narrow
            ? { position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 4, transform: open ? 'none' : 'translateX(100%)', transition: `transform .3s ${EASE}, visibility .3s`, boxShadow: open ? '-8px 0 24px rgba(0,0,0,.25)' : 'none' }
            : { marginRight: open ? 0 : 'calc(-1 * min(340px, 100%))', transition: `margin-right .3s ${EASE}, visibility .3s` }),
        }}
      >
        <WorldAssistant campaignId={campaignId} />
      </aside>
    </>
  )
}
