import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTO_MS = 6500
const FADE_MS = 3000

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
      {frames.map((f, i) => <img key={f.src} className={i === frame ? 'is-on' : ''} src={f.src} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} />)}
      <span className="showcase-fade-label" aria-hidden="true">{frames[frame].label}</span>
    </div>
  )
}

const Chevron = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// A slideshow of the tools: a screenshot on one side, the description and a demo link on the other. Slides advance on
// their own (pausing while hovered, focused or touched, or when the Pause button is on); arrows, dots and swipe work too.
// For visitors who prefer reduced motion the slides fade in place instead of sliding across. Every slide's text stays in the page so readers and search engines see all of it.
export default function ShowcaseCarousel({ slides, label }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)         // hovering, focused or touching
  const [userPaused, setUserPaused] = useState(false) // the Pause button
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
    if (paused || userPaused || count < 2) return
    const t = setTimeout(() => setIndex(i => (i + 1) % count), AUTO_MS)
    return () => clearTimeout(t)
  }, [index, paused, userPaused, count])

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
        <button type="button" className="showcase-arrow showcase-pause" onClick={() => setUserPaused(p => !p)} aria-pressed={userPaused} aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'} title={userPaused ? 'Play slideshow' : 'Pause slideshow'}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">{userPaused ? <path d="M3 1.5v11l9-5.5z" fill="currentColor" /> : <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" />}</svg>
        </button>
      </div>
    </div>
  )
}
