// Lightweight shimmer skeleton building blocks used while pages/data load.
// Keeping this dependency-free (no extra libs) so it doesn't add to bundle size.

export function SkeletonBlock({ width = '100%', height = 14, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
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
