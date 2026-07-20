import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import UpgradeModal from '../components/UpgradeModal'

const pollinationsUrl = (prompt, width = 1200, height = 900) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `fantasy cartoon illustration, consistent character style, ${prompt}, high detail, no text, clean linework, vibrant colors`
  )}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 99999)}`

function Cover({ campaignName }) {
  // Single-front cover (no visible back)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 35%), var(--bg)' }}>
      <div style={{ width: '74%', height: '80%', borderRadius: 18, background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, boxShadow: 'inset 0 8px 30px rgba(0,0,0,0.12)' }}>
        <div style={{ width: 40, height: 2, background: 'var(--gold)', marginBottom: 8 }} />
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>The Chronicles of</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2, fontWeight: 700, marginTop: 8 }}>{campaignName || 'Your Campaign'}</div>
        <div style={{ width: 40, height: 2, background: 'var(--gold)', marginTop: 10 }} />
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: 'var(--text-2)', marginTop: 12, fontStyle: 'italic' }}>A visual storyboard</div>
      </div>
    </div>
  )
}

function BookSpread({ card, index }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', minWidth: 0 }}>
      {/* Left — image */}
      <div style={{ flex: 1, background: 'var(--surface)', borderRight: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', boxShadow: 'inset -8px 0 20px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'absolute', top: 14, left: 18, fontFamily: 'Cinzel, serif', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', zIndex: 1 }}>SCENE {index + 1}</div>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', minWidth: '100%', minHeight: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-3)' }}><div style={{ fontSize: 40, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'Cinzel, serif' }}>Generating...</div></div>
        }
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(0,0,0,0.07), transparent)', pointerEvents: 'none' }} />
      </div>
      {/* Right — text */}
      <div style={{ flex: 1, background: 'var(--surface2)', padding: '44px 40px', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.03) 28px)', backgroundPosition: '0 44px' }}>
        <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'Cinzel, serif', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: 'var(--text)', marginBottom: 20, lineHeight: 1.3, position: 'relative', zIndex: 1 }}>{card.title}</h2>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.9, position: 'relative', zIndex: 1, flex: 1 }}>{card.description}</p>
        {card.createdAt && (
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'Cinzel, serif', letterSpacing: '0.06em', marginTop: 20, position: 'relative', zIndex: 1 }}>
            {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(0,0,0,0.04), transparent)', pointerEvents: 'none' }} />
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
    const imageUrl = pollinationsUrl(finalPrompt, w, h)
    try {
      const card = await api(`/storyboard/${activeCampaign._id}`, { method: 'POST', body: { title: title || 'Scene', description: prompt, prompt, imageUrl } })
      const newCards = [...cards, card]
      setCards(newCards)
      setCurrentPage(newCards.length - 1)
      setPrompt(''); setTitle(''); setShowForm(false)
      toast('Scene added to your chronicle')
    } catch (err) {
      console.error(err)
      if (err.status === 403) {
        setShowUpgrade(true)
        return
      }
      toast(err.message || 'Failed to save')
    }
    setGenerating(false)
  }

  const deleteCard = async (id) => {
    await api(`/storyboard/${id}`, { method: 'DELETE' })
    setCards(p => p.filter(c => c._id !== id))
    setCurrentPage(p => Math.max(-1, p - 1))
    toast('Scene removed')
  }

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8a060', fontFamily: 'Cinzel, serif' }}>Select a campaign first.</div>

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
            <button onClick={() => deleteCard(currentCard._id)} style={{ background: 'transparent', border: '1px solid #4a3020', color: '#8a6040', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
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
          {/* Spine */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(to right, #3a2510, #8a6030, #3a2510)', zIndex: 10, transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />

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
    </div>
  )
}
