import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// How long each slide stays on screen. A slide that cross-fades between pictures stays long enough to show all of them.
const AUTO_MS = 2000
const FADE_MS = 2000

// Two (or more) screenshots stacked in one slide that cross-fade every few seconds while the slide is showing,
// with a small label saying which state is on screen. It is an opacity change only (no movement), so it keeps running
// even when the visitor prefers reduced motion; only slide movement and autoplay stop for them.
function FadeShot({ frames, active }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!active) { setFrame(0); return }
    if (frames.length < 2) return
    const t = setInterval(() => setFrame(f => (f + 1) % frames.length), FADE_MS)
    return () => clearInterval(t)
  }, [active, frames.length])
  return (
    <div className="showcase-shot showcase-fade">
      {/* A true cross-fade: the first picture always stays solid underneath, and each later picture fades in and out over it,
          so the two never fade at the same moment (which would dip through the background in the middle). */}
      {frames.map((f, i) => <img key={f.src} className={i === 0 || i <= frame ? 'is-on' : ''} style={{ zIndex: i }} src={f.src} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} />)}
      <span key={frame} className="showcase-fade-label" aria-hidden="true">{frames[frame].label}</span>
    </div>
  )
}

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// A slideshow of the tools: a screenshot on one side, the description and a demo link on the other. Slides advance on
// their own (pausing while hovered, focused or touched); arrows, dots and swipe work too.
// For visitors who prefer reduced motion the slides fade in place instead of sliding across. Every slide's text stays in the page so readers and search engines see all of it.
export default function ShowcaseCarousel({ slides, label }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false) // hovering, focused or touching
  const [reduced, setReduced] = useState(false)
  const [broken, setBroken] = useState({})
  const touch = useRef(null)
  const count = slides.length

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const update = () => setReduced(mq.matches)
    update(); mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  const go = useCallback((n) => setIndex(((n % count) + count) % count), [count])

  useEffect(() => {
    if (paused || count < 2) return
    const frames = slides[index].fade?.length || 0
    const t = setTimeout(() => setIndex(i => (i + 1) % count), frames > 1 ? frames * FADE_MS : AUTO_MS)
    return () => clearTimeout(t)
  }, [index, paused, count, slides])

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1) }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1) }
  }
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; setPaused(true) }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touch.current ?? 0)
    touch.current = null
    if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1))
    setPaused(false)
  }

  return (
    <div
      className="showcase" role="group" aria-roledescription="carousel" aria-label={label} onKeyDown={onKey}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      <div className="showcase-viewport">
        <div className={`showcase-track${reduced ? ' is-instant' : ''}`} style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => (
            <article key={s.title} className={`showcase-slide${i === index ? ' is-active' : ''}${s.visual || s.fade || (s.image && !broken[s.title]) ? '' : ' no-image'}`}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={i === index ? undefined : true} inert={i === index ? undefined : true}>
              {s.visual && <div className="showcase-shot is-visual">{s.visual}</div>}
              {s.fade && <FadeShot frames={s.fade} active={i === index} />}
              {!s.visual && !s.fade && s.image && !broken[s.title] && (
                <div className="showcase-shot">
                  <img src={s.image} alt={s.alt || `${s.title} in 5e Utility`} loading={i === 0 ? 'eager' : 'lazy'} onError={() => setBroken(b => ({ ...b, [s.title]: true }))} />
                </div>
              )}
              <div className="showcase-copy">
                <p className="showcase-count">{String(i + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}{s.badge && <span className="showcase-badge">{s.badge}</span>}</p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <Link to={s.to || `/demo/${s.id}`}>{s.cta || `Try the ${s.title.toLowerCase()} demo`} <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="showcase-controls">
        <button type="button" className="showcase-arrow" onClick={() => go(index - 1)} aria-label="Previous slide"><Chevron dir="left" /></button>
        <div className="showcase-dots">
          {slides.map((s, i) => (
            <button key={s.title} type="button" className={`showcase-dot${i === index ? ' is-active' : ''}`} onClick={() => go(i)} aria-label={`Show ${s.title}`} aria-current={i === index ? 'true' : undefined} />
          ))}
        </div>
        <button type="button" className="showcase-arrow" onClick={() => go(index + 1)} aria-label="Next slide"><Chevron dir="right" /></button>
      </div>
    </div>
  )
}
