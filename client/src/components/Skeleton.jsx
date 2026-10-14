// Lightweight shimmer skeleton building blocks used while pages/data load.
// Keeping this dependency-free (no extra libs) so it doesn't add to bundle size.
import { useState, useEffect } from 'react'

export function SkeletonBlock({ width = '100%', height = 14, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonTextLines({ lines = 10, style = {} }) {
  return (
    <div role="status" aria-label="Loading text" style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={i % 4 === 3 ? '72%' : i % 3 === 2 ? '88%' : '100%'} height={10} radius={3} />
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 3, avatar = false, style = {} }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--surface)',
        ...style,
      }}
    >
      {avatar && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <SkeletonBlock width={40} height={40} radius={20} />
          <SkeletonBlock width="40%" height={14} />
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} width={i === lines - 1 ? '60%' : '100%'} height={12} />
      ))}
    </div>
  )
}

// Generic full-page skeleton used as the Suspense fallback while a
// route chunk loads — mimics a typical page layout (header + card grid)
// so there's no jarring blank flash or plain spinner.
export function SkeletonPage({ cards = 4 }) {
  return (
    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
      <SkeletonBlock width={220} height={22} radius={6} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={2} avatar={i % 2 === 0} />
        ))}
      </div>
    </div>
  )
}

// Mirrors the character switcher, character-sheet panel, tab strip, and stats row.
export function SkeletonCharacterPage() {
  return (
    <div className="page-content" style={{ overflow: 'hidden' }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>My Characters</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <SkeletonBlock width={110} height={28} radius={999} />
        <SkeletonBlock width={90} height={28} radius={999} />
      </div>
      <SkeletonBlock height={118} radius={12} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} width={76} height={30} radius={999} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={76} radius={10} />)}
      </div>
    </div>
  )
}

export function SkeletonInventoryContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SkeletonBlock height={104} radius={12} />
      <SkeletonBlock height={260} radius={12} />
    </div>
  )
}

export function SkeletonLorePage() {
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, flex: 1 }}>Info &amp; Lore</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} width={58} height={30} radius={8} />)}
        </div>
        <SkeletonBlock width={92} height={30} radius={8} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} style={{ minHeight: 130 }} />)}
      </div>
    </div>
  )
}

export function SkeletonRoleplayPage() {
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Roleplay Assistant</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
        <SkeletonCard lines={6} style={{ minHeight: 230 }} />
        <SkeletonCard lines={5} style={{ minHeight: 230 }} />
      </div>
    </div>
  )
}

export function SkeletonMusicPage() {
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Music</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Ambient moods &amp; your own tracks</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
        <SkeletonCard lines={5} style={{ minHeight: 200 }} />
        <SkeletonCard lines={5} style={{ minHeight: 200 }} />
      </div>
    </div>
  )
}

export function SkeletonRulesPage() {
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>5e Rules Reference</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Quick lookups for the rules you forget mid-session.</p>
        </div>
      </div>
      <SkeletonBlock width="min(100%, 400px)" height={38} style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
      </div>
    </div>
  )
}

export function SkeletonPremiumPage() {
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Premium</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Unlock the full &amp; Utility experience for your campaigns.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        {[0, 1].map(i => (
          <div key={i} className="card" style={{ minHeight: 440, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SkeletonBlock width="58%" height={20} />
            <SkeletonBlock width="42%" height={34} style={{ marginBottom: 8 }} />
            {Array.from({ length: i === 0 ? 8 : 5 }).map((_, row) => (
              <SkeletonBlock key={row} width={row % 3 === 2 ? '72%' : '92%'} height={13} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDicePage() {
  return (
    <div className="page-content dice-page" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14, height: '100%' }}>
      <SkeletonBlock width="100%" height="100%" radius={32} style={{ flex: 1, minHeight: 280 }} />
      <div style={{ display: 'flex', gap: 20 }}>
        <SkeletonBlock height={88} radius={22} style={{ flex: 1 }} />
        <SkeletonBlock height={88} radius={22} style={{ flex: 1 }} />
      </div>
    </div>
  )
}

export function SkeletonCombatPage() {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>HP Tracker</h2>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', alignContent: 'start', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} style={{ minHeight: 150 }} />)}
        </div>
      </div>
      <aside style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)', padding: 12 }}>
        <SkeletonBlock width={90} height={12} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} height={48} radius={8} />)}
        </div>
      </aside>
    </div>
  )
}

export default SkeletonBlock

// Mimics the actual app Shell (sidebar + main content) so the loading state
// never looks like a different layout than the real app underneath it —
// used for the initial auth-check screen, which renders before Shell.jsx's
// real sidebar/nav exists. Matches Shell.jsx's own mobile breakpoint (768px)
// so phones see a top-bar + bottom-pill skeleton instead of a desktop sidebar.
export function SkeletonShell({ cards = 4 }) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <SkeletonBlock width={100} height={28} radius={6} />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBlock width={80} height={32} radius={10} />
            <SkeletonBlock width={32} height={32} radius={10} />
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
          <SkeletonBlock width="60%" height={20} radius={6} />
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>

        {/* Bottom pill nav */}
        <div style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)',
          bottom: 'calc(12px + env(safe-area-inset-bottom, 12px))',
          width: 'min(96%, 560px)', height: 52,
          borderRadius: 999, overflow: 'hidden',
        }}>
          <SkeletonBlock width="100%" height="100%" radius={999} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar — long vertical rectangle matching the real 232px nav column */}
      <aside style={{ width: 232, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '16px 14px' }}>
        <SkeletonBlock width="70%" height={28} style={{ margin: '0 auto 24px' }} />
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonBlock key={i} width="100%" height={34} radius={8} style={{ marginBottom: 8 }} />
        ))}
        <div style={{ flex: 1 }} />
        <SkeletonBlock width="100%" height={48} radius={10} />
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <SkeletonBlock width={220} height={22} radius={6} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} lines={2} avatar={i % 2 === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
