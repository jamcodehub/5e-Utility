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

export default SkeletonBlock
