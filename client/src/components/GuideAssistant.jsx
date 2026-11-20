import { useState, useEffect } from 'react'
import WorldAssistant from './WorldAssistant'
import { useWorldAssistant } from '../context/WorldAssistantContext'
import { AI_ENABLED } from '../utils/features'

const EASE = 'cubic-bezier(.4,0,.2,1)'

// Slide-out world-building guide for a flex-row parent with position: relative.
// Renders the toggle tab and the right-hand panel; the panel pushes the page on desktop and overlays it on phones.
function ComingSoon({ onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, color: 'var(--gold)', letterSpacing: '0.04em' }}>World-building guide</span>
          {onClose && <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close the guide" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 13 }}>✕ Close</button>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>Asks questions only. You write the world.</div>
      </div>
      <div style={{ flex: 1, padding: '40px 20px', textAlign: 'center', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7 }}>
        <span style={{ display: 'inline-block', marginBottom: 12, padding: '2px 10px', border: '1px solid var(--gold-border)', borderRadius: 3, color: 'var(--gold)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Coming soon</span>
        <div>A guide that asks you the questions that help you decide your setting, factions and plot, so you stay the author of your world.</div>
      </div>
    </div>
  )
}

export default function GuideAssistant({ campaignId }) {
  const { busy, unread } = useWorldAssistant(campaignId)
  const [narrow, setNarrow] = useState(() => window.innerWidth <= 768)
  // On phones the guide starts closed (it covers the whole page); the remembered state is for desktop.
  const [open, setOpen] = useState(() => window.innerWidth > 768 && localStorage.getItem('worldbuildOpen') === '1')
  useEffect(() => { if (!narrow) localStorage.setItem('worldbuildOpen', open ? '1' : '0') }, [open, narrow])
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth <= 768)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  return (
    <>
      {!(narrow && open) && <button
        onClick={() => setOpen(o => !o)} aria-expanded={open} title={open ? 'Hide the world-building guide' : 'Open the world-building guide'}
        style={{
          position: 'absolute', top: 70, right: open ? (narrow ? 'min(340px, 100%)' : 340) : 0, zIndex: 5, transition: `right .3s ${EASE}`,
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', border: '1px solid var(--gold-border)', borderRight: open ? '1px solid var(--gold-border)' : 'none',
          borderRadius: '10px 0 0 10px', background: 'var(--gold-bg)', color: 'var(--gold)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}
      >✦ {open ? 'Hide' : 'Guide'}{!open && busy ? ' …' : ''}{!open && unread && !busy ? ' ●' : ''}</button>}
      <aside
        aria-hidden={!open}
        style={{
          background: 'var(--surface)', visibility: open ? 'visible' : 'hidden',
          ...(narrow
            ? { position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', zIndex: 4, borderLeft: '1px solid var(--border)', transform: open ? 'none' : 'translateX(100%)', transition: `transform .3s ${EASE}, visibility .3s`, boxShadow: open ? '-8px 0 24px rgba(0,0,0,.25)' : 'none' }
            // Closed = zero width, so nothing is left hanging off the page to scroll sideways.
            : { flexShrink: 0, width: open ? 340 : 0, overflow: 'hidden', borderLeft: open ? '1px solid var(--border)' : 'none', transition: `width .3s ${EASE}, visibility .3s` }),
        }}
      >
        <div style={{ width: narrow ? '100%' : 340, height: '100%' }}>{AI_ENABLED ? <WorldAssistant campaignId={campaignId} onClose={narrow ? () => setOpen(false) : undefined} /> : <ComingSoon onClose={narrow ? () => setOpen(false) : undefined} />}</div>
      </aside>
    </>
  )
}
