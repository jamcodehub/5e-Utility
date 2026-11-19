// Small inline media-control icons (play, pause, previous, next). Drawn as SVG so they can never render as colour emoji.
export default function MediaIcon({ kind, size = 12 }) {
  const common = { width: size, height: size, viewBox: '0 0 12 12', fill: 'currentColor', 'aria-hidden': true, focusable: 'false', style: { display: 'block' } }
  if (kind === 'pause') return <svg {...common}><rect x="2" y="1.5" width="3" height="9" rx="0.5" /><rect x="7" y="1.5" width="3" height="9" rx="0.5" /></svg>
  if (kind === 'prev') return <svg {...common}><rect x="1.5" y="1.5" width="1.8" height="9" rx="0.5" /><path d="M10.5 1.8v8.4L4.6 6z" /></svg>
  if (kind === 'next') return <svg {...common}><rect x="8.7" y="1.5" width="1.8" height="9" rx="0.5" /><path d="M1.5 1.8v8.4L7.4 6z" /></svg>
  return <svg {...common}><path d="M3 1.5v9L10.5 6z" /></svg>
}
