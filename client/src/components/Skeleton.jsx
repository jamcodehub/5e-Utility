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

// Matches Character.jsx's actual layout: character-switcher pills, a header
// card (avatar + name + stat row), then a couple of detail-section cards —
// so the loading state doesn't jump/reflow once the real data arrives.
export function SkeletonCharacterPage() {
  return (
    <div className="page-content" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <SkeletonBlock width={110} height={28} radius={999} />
        <SkeletonBlock width={90} height={28} radius={999} />
      </div>
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <SkeletonBlock width={56} height={56} radius={28} />
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBlock width="40%" height={18} />
          <SkeletonBlock width="60%" height={12} />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <SkeletonBlock width={26} height={8} />
              <SkeletonBlock width={40} height={16} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  )
}

// Matches Inventory.jsx's layout: title, a row of currency pills, then a
// grid of item cards below.
export function SkeletonInventoryPage() {
  return (
    <div className="page-content" style={{ overflow: 'hidden' }}>
      <div style={{ marginBottom: 20 }}>
        <SkeletonBlock width={160} height={22} style={{ marginBottom: 8 }} />
        <SkeletonBlock width={220} height={12} />
      </div>
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <SkeletonBlock width={100} height={14} style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} width={100} height={64} radius={12} />
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
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
