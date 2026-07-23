import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import UpgradeModal from '../components/UpgradeModal'

// Pollinations (flux model) — free, no API key, decent quality, and scales
// fine for a small/medium app. Prompt is engineered for painterly fantasy
// landscape-portrait artwork rather than flat cartoon illustration.
const pollinationsUrl = (prompt, width = 1200, height = 900, seed = Math.floor(Math.random() * 99999)) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `fantasy landscape painting artstyle portrait, epic matte painting, consistent character style, ${prompt}, dramatic lighting, high detail, no text, painterly brushwork`
  )}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${seed}`

// Variation modifiers so the 2 candidates don't look like near-duplicates of
// the same composition/angle/lighting. Kept to 2 (not 4) because Pollinations'
// free tier rate-limits aggressively — fewer simultaneous requests means a
// much higher chance both actually succeed.
const VARIANTS = [
  { angle: 'wide establishing shot, low camera angle', light: 'dramatic side lighting', palette: 'warm amber and shadow tones' },
  { angle: 'close-up dynamic composition', light: 'cool moonlit lighting', palette: 'cold blue and silver tones' },
]

function Cover({ campaignName }) {
  // Single cover page (closed book front cover)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3f2b1d, #352417 38%, #4a3322 100%)' }}>
      <div style={{ width: '100%', height: '100%', maxWidth: '760px', maxHeight: '100%', borderRadius: 28, border: '1px solid rgba(245,220,180,0.14)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 32px rgba(0,0,0,0.22)', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(circle at 25% 18%, rgba(255,255,255,0.05), transparent 28%), repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0 3px, rgba(0,0,0,0.02) 3px 6px), linear-gradient(180deg, #7d563b, #6b492f 45%, #5a3f2a 100%)' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 34, color: '#f3e7cd', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{campaignName || 'Your Campaign'}</div>
        <div style={{ marginTop: 18, fontSize: 12, color: '#e6d7b0', letterSpacing: '0.2em', fontFamily: 'Cinzel, serif', textAlign: 'center' }}>CHRONICLE</div>
      </div>
    </div>
  )
}

// Pollinations free tier rate-limits bursts hard — fully serialize candidate
// loads (one at a time, never overlapping) with a cooldown between each, and
// auto-retry with backoff on failure before giving up.
let candidateQueue = Promise.resolve()
function enqueueCandidateLoad(task) {
  const run = candidateQueue.then(() => task().catch(() => {}))
  candidateQueue = run.then(() => new Promise(r => setTimeout(r, 2500)))
  return run
}

function CandidateImage({ url, index, alt }) {
  const [armed, setArmed] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const MAX_AUTO_RETRIES = 3

  useEffect(() => {
    setFailed(false)
    setArmed(false)
    let cancelled = false
    enqueueCandidateLoad(() => new Promise((resolve, reject) => {
      if (cancelled) return resolve()
      const img = new Image()
      img.onload = () => { if (!cancelled) { setArmed(true) }; resolve() }
      img.onerror = () => {
        if (cancelled) return reject()
        if (attempt < MAX_AUTO_RETRIES) {
          // auto-retry with growing backoff — 429s are usually transient
          setTimeout(() => { if (!cancelled) setAttempt(a => a + 1) }, 1500 * (attempt + 1))
        } else {
          setFailed(true)
        }
        reject()
      }
      img.src = url
    }))
    return () => { cancelled = true }
  }, [index, attempt, url])

  if (failed) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8a6040' }}>
        <div style={{ fontSize: 11, fontFamily: 'Cinzel, serif' }}>Failed to load</div>
        <button onClick={(e) => { e.stopPropagation(); setAttempt(a => a + 1) }} style={{ background: 'transparent', border: '1px solid #4a3020', color: '#c8a060', padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }
  if (!armed) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a6040', fontSize: 11, fontFamily: 'Cinzel, serif' }}>Queued...</div>
  }
  return <img src={url} alt={alt} onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
}

function BookSpread({ card, index }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', minWidth: 0 }}>
      {/* Left — image with responsive cropping */}
      <div style={{ flex: 1, background: 'linear-gradient(180deg, #f6eddc, #efe3cc)', borderRight: '2px solid #b39b74', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', boxShadow: 'inset -10px 0 20px rgba(86,61,34,0.08)', padding: '4%' }}>
        <div style={{ position: 'absolute', top: 14, left: 18, fontFamily: 'Cinzel, serif', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', zIndex: 1 }}>SCENE {index + 1}</div>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', borderRadius: 8 }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-3)' }}><div style={{ fontSize: 40, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'Cinzel, serif' }}>Generating...</div></div>
        }
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 16%, rgba(128,94,59,0.10), transparent 30%), radial-gradient(circle at 84% 78%, rgba(128,94,59,0.08), transparent 28%)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(60,40,20,0.10), transparent)', pointerEvents: 'none' }} />
      </div>
      {/* Right — text with book-like margins */}
      <div style={{ flex: 1, background: 'linear-gradient(180deg, #f7efde, #f0e4cd)', padding: '48px 48px', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: 'radial-gradient(circle at 12% 20%, rgba(125,89,53,0.08), transparent 26%), radial-gradient(circle at 82% 74%, rgba(125,89,53,0.06), transparent 24%), repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.032) 28px)', backgroundPosition: '0 0, 0 0, 0 48px' }}>
        <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'Cinzel, serif', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#3f2b1f', marginBottom: 24, lineHeight: 1.4, position: 'relative', zIndex: 1 }}>{card.title}</h2>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#5b4431', lineHeight: 1.95, position: 'relative', zIndex: 1, flex: 1, overflow: 'auto' }}>{card.description}</p>
        {card.createdAt && (
          <div style={{ fontSize: 10, color: '#7c624a', fontFamily: 'Cinzel, serif', letterSpacing: '0.06em', marginTop: 28, position: 'relative', zIndex: 1 }}>
            {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(92,66,37,0.11), transparent)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

// CastleSlide moved to the Dice page — removed from Storyboard

export default function Storyboard() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [cards, setCards] = useState([])
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [currentPage, setCurrentPage] = useState(-1)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [candidates, setCandidates] = useState(null) // array of 4 image urls awaiting user pick
  const [pendingMeta, setPendingMeta] = useState(null) // { title, prompt }
  const bookRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const scrollRef = useRef(null)
  const scrollAccum = useRef(0)
  const THRESHOLD = 80

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setCards(await api(`/storyboard/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const goTo = useCallback((dir) => {
    const next = currentPage + dir
    if (next < -1 || next > cards.length - 1) return
    // Snap immediately — no animation
    setCurrentPage(next)
  }, [currentPage, cards.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      scrollAccum.current += e.deltaY
      if (scrollAccum.current > THRESHOLD) { scrollAccum.current = 0; goTo(1) }
      else if (scrollAccum.current < -THRESHOLD) { scrollAccum.current = 0; goTo(-1) }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [goTo])

  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    let startY = 0
    const onStart = (e) => { startY = e.touches[0].clientY }
    const onEnd = (e) => { const diff = startY - e.changedTouches[0].clientY; if (Math.abs(diff) > 40) goTo(diff > 0 ? 1 : -1) }
    el.addEventListener('touchstart', onStart)
    el.addEventListener('touchend', onEnd)
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  }, [goTo])

  const generate = async () => {
    if (!prompt.trim() || !activeCampaign) return
    setGenerating(true)
    // compute left-page dimensions from book viewport (half width)
    const rect = bookRef.current?.getBoundingClientRect()
    let w = 1200, h = 900
    if (rect) {
      const leftW = Math.max(360, Math.round(rect.width / 2))
      const pageH = Math.max(360, Math.round(rect.height))
      // upscale for HD / retina
      w = leftW * 2
      h = pageH * 2
    }
    // include saved character appearance prompt for consistency, if present
    let finalPrompt = prompt
    try {
      const char = await api(`/campaigns/${activeCampaign._id}/character`)
      if (char?.appearancePrompt) finalPrompt = `${char.appearancePrompt}, ${prompt}`
    } catch (e) {
      // ignore — fallback to user prompt
    }
    // Offer 4 real variations — distinct framing/lighting/palette per
    // candidate (not just a different seed) so they look meaningfully different.
    const urls = VARIANTS.map(v => {
      const seed = Math.floor(Math.random() * 99999)
      const variedPrompt = `${finalPrompt}, ${v.angle}, ${v.light}, ${v.palette}`
      return pollinationsUrl(variedPrompt, w, h, seed)
    })
    setCandidates(urls)
    setPendingMeta({ title: title || 'Scene', prompt })
    setGenerating(false)
  }

  const chooseCandidate = async (imageUrl) => {
    if (!pendingMeta) return
    try {
      const card = await api(`/storyboard/${activeCampaign._id}`, { method: 'POST', body: { title: pendingMeta.title, description: pendingMeta.prompt, prompt: pendingMeta.prompt, imageUrl } })
      const newCards = [...cards, card]
      setCards(newCards)
      setCurrentPage(newCards.length - 1)
      setPrompt(''); setTitle(''); setShowForm(false)
      setCandidates(null); setPendingMeta(null)
      toast('Scene added to your chronicle')
    } catch (err) {
      console.error(err)
      if (err.status === 403) { setShowUpgrade(true); return }
      toast(err.message || 'Failed to save')
    }
  }

  const cancelCandidates = () => { setCandidates(null); setPendingMeta(null) }

  const deleteCard = async (id) => {
    await api(`/storyboard/${id}`, { method: 'DELETE' })
    setCards(p => p.filter(c => c._id !== id))
    setCurrentPage(p => Math.max(-1, p - 1))
    toast('Scene removed')
  }

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8a060', fontFamily: 'Cinzel, serif' }}>Select a campaign first.</div>
  if (activeCampaign.isPersonal) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#c8a060', fontFamily: 'Cinzel, serif', padding: 24 }}>The Storyboard is a shared party feature.<br/>Join or create a real campaign to use it.</div>

  const onCover = currentPage === -1
  const currentCard = cards[currentPage]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top bar */}
      <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: 'var(--text-3)' }}>
          {onCover ? activeCampaign.name : `Scene ${currentPage + 1} / ${cards.length}`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowForm(f => !f)} style={{ background: showForm ? '#c8a060' : '#4a3020', border: 'none', color: showForm ? '#1a1208' : '#c8a060', padding: '6px 14px', borderRadius: 6, fontFamily: 'Cinzel, serif', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
            {showForm ? '✕ Close' : '+ Add Scene'}
          </button>
          {!onCover && currentCard && (
            <button onClick={() => { if (!window.confirm('Are you sure you want to delete this page?')) return; deleteCard(currentCard._id) }} style={{ background: 'transparent', border: '1px solid #4a3020', color: '#8a6040', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding: '12px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input" placeholder="Scene title" value={title} onChange={e => setTitle(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <textarea className="input" rows={2} placeholder="Describe this scene — who was there, what happened, what it looked like..." value={prompt} onChange={e => setPrompt(e.target.value)} style={{ resize: 'none', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <button onClick={generate} disabled={generating || !prompt.trim()} style={{ background: generating ? 'var(--border)' : 'var(--gold)', border: 'none', color: 'var(--text)', padding: '10px 18px', borderRadius: 6, fontFamily: 'Cinzel, serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'stretch', opacity: generating ? 0.7 : 1 }}>
            {generating ? '✦ Writing...' : '✦ Generate'}
          </button>
        </div>
      )}

      {/* Book viewport */}
      <div ref={scrollRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
        <div ref={bookRef} className="book-viewport" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,160,96,0.15)', borderRadius: 3 }}>
          {!onCover && (
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(to right, #2a1810, #4a3020, #2a1810)', zIndex: 10, transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
          )}

          {/* Cover */}
          <div style={{ position: 'absolute', inset: 0, transition: 'opacity .35s', opacity: onCover ? 1 : 0, pointerEvents: onCover ? 'auto' : 'none' }}>
            <Cover campaignName={activeCampaign?.name} />
          </div>

          {/* Pages with flip animation */}
          {cards.map((card, i) => (
            <div key={card._id} style={{
              position: 'absolute', inset: 0,
              opacity: i === currentPage ? 1 : 0,
              transition: 'none',
              pointerEvents: i === currentPage ? 'auto' : 'none',
            }}>
              <BookSpread card={card} index={i} />
            </div>
          ))}

          {/* Empty */}
          {cards.length === 0 && !onCover && (
            <div style={{ position: 'absolute', inset: 0, background: '#fdfaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#a89070' }}>
              <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13 }}>Your chronicle awaits</div>
            </div>
          )}
        </div>

        {/* Arrows */}
          {[{ dir: -1, side: 'left', char: '‹', disabled: onCover }, { dir: 1, side: 'right', char: '›', disabled: currentPage >= cards.length - 1 }].map(({ dir, side, char, disabled }) => (
          <button key={side} onClick={() => goTo(dir)} disabled={disabled} style={{
            position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(200,160,96,0.12)', border: '1px solid rgba(200,160,96,0.25)', color: '#c8a060',
            width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: disabled ? 0.2 : 0.8, transition: 'opacity .2s',
          }}>{char}</button>
        ))}
      </div>

      {/* Dots */}
      <div style={{ padding: '6px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#1a1208', flexShrink: 0 }}>
        <div onClick={() => setCurrentPage(-1)} style={{ width: 5, height: 5, borderRadius: '50%', background: onCover ? '#c8a060' : '#4a3020', cursor: 'pointer', transition: 'background .2s' }} />
        {cards.map((_, i) => (
          <div key={i} onClick={() => setCurrentPage(i)} style={{ width: 5, height: 5, borderRadius: '50%', background: i === currentPage ? '#c8a060' : '#4a3020', cursor: 'pointer', transition: 'background .2s' }} />
        ))}
      </div>

      <ToastContainer />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {candidates && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={cancelCandidates}>
          <div style={{ width: '100%', maxWidth: 720, background: '#1a1208', border: '1px solid #4a3020', borderRadius: 12, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, color: '#c8a060', marginBottom: 14, textAlign: 'center' }}>Choose your favourite</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {candidates.map((url, i) => (
                <button key={i} onClick={() => chooseCandidate(url)} style={{ padding: 0, border: '2px solid transparent', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none', aspectRatio: '4 / 3', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#c8a060'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                  <CandidateImage url={url} index={i} alt={`Option ${i + 1}`} />
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={cancelCandidates} style={{ background: 'transparent', border: '1px solid #4a3020', color: '#8a6040', padding: '6px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
