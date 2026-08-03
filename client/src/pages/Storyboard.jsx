import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'

function Cover({ campaignName }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3f2b1d, #352417 38%, #4a3322 100%)' }}>
      <div style={{ width: '100%', height: '100%', maxWidth: '760px', maxHeight: '100%', borderRadius: 28, border: '1px solid rgba(245,220,180,0.14)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 0 32px rgba(0,0,0,0.22)', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'radial-gradient(circle at 25% 18%, rgba(255,255,255,0.05), transparent 28%), repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0 3px, rgba(0,0,0,0.02) 3px 6px), linear-gradient(180deg, #7d563b, #6b492f 45%, #5a3f2a 100%)' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 34, color: '#f3e7cd', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{campaignName || 'Your Campaign'}</div>
        <div style={{ marginTop: 18, fontSize: 12, color: '#e6d7b0', letterSpacing: '0.2em', fontFamily: 'Cinzel, serif', textAlign: 'center' }}>CHRONICLE</div>
      </div>
    </div>
  )
}

function BookSpread({ card, index, onEdit }) {
  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top — image */}
        <div style={{ flex: '0 0 55%', background: '#1a1208', borderBottom: '2px solid #b39b74', overflow: 'hidden', position: 'relative' }}>
          {card.imageUrl
            ? <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8a7060' }}><div style={{ fontSize: 32, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'Cinzel, serif' }}>No image uploaded</div></div>
          }
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(to top, rgba(30,18,8,0.45), transparent)', pointerEvents: 'none' }} />
        </div>
        {/* Bottom — text */}
        <div style={{ flex: 1, background: 'linear-gradient(180deg, #f7efde, #ede1c8)', padding: '14px 20px 12px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.032) 28px)', backgroundPosition: '0 14px' }}>
          <div style={{ position: 'absolute', top: 8, right: 12, fontFamily: 'Cinzel, serif', fontSize: 9, color: '#9a8060', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
          <button onClick={onEdit} title="Edit scene" style={{ position: 'absolute', top: 10, right: 36, background: 'rgba(92,66,37,0.12)', border: '1px solid rgba(92,66,37,0.25)', color: '#6b4a2a', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'Cinzel, serif', zIndex: 2 }}>Edit</button>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 15, color: '#3f2b1f', lineHeight: 1.3, margin: '0 0 10px 0', textAlign: 'center', paddingRight: 0, position: 'relative', zIndex: 1 }}>{card.title}</h2>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, color: '#5b4431', lineHeight: 1.85, margin: 0, textAlign: 'justify', hyphens: 'auto', position: 'relative', zIndex: 1 }}>{card.description}</p>
          </div>
          {card.createdAt && (
            <div style={{ fontSize: 9, color: '#7c624a', fontFamily: 'Cinzel, serif', letterSpacing: '0.06em', marginTop: 8, textAlign: 'right', position: 'relative', zIndex: 1 }}>
              {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', minWidth: 0 }}>
      {/* Left — image full bleed */}
      <div style={{ flex: 1, background: '#1a1208', borderRight: '2px solid #b39b74', overflow: 'hidden', position: 'relative' }}>
        {card.imageUrl
          ? <img src={card.imageUrl} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#8a7060' }}><div style={{ fontSize: 40, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'Cinzel, serif' }}>No image uploaded</div></div>
        }
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(60,40,20,0.18), transparent)', pointerEvents: 'none' }} />
      </div>
      {/* Right — text */}
      <div style={{ flex: 1, background: 'linear-gradient(180deg, #f7efde, #ede1c8)', padding: '32px 44px 28px 40px', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: 'radial-gradient(circle at 12% 20%, rgba(125,89,53,0.08), transparent 26%), radial-gradient(circle at 82% 74%, rgba(125,89,53,0.06), transparent 24%), repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.032) 28px)', backgroundPosition: '0 0, 0 0, 0 32px' }}>
        {/* Page number */}
        <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'Cinzel, serif', fontSize: 10, color: '#9a8060', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
        {/* Edit button — floating top-right below page number */}
        <button onClick={onEdit} title="Edit scene" style={{ position: 'absolute', top: 32, right: 18, background: 'rgba(92,66,37,0.12)', border: '1px solid rgba(92,66,37,0.25)', color: '#6b4a2a', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'Cinzel, serif', zIndex: 2 }}>Edit</button>
        {/* Centered title */}
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: '#3f2b1f', lineHeight: 1.4, margin: '0 0 20px 0', textAlign: 'center', position: 'relative', zIndex: 1, paddingRight: 44 }}>{card.title}</h2>
        {/* Description — constrained column centered on the page */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, color: '#5b4431', lineHeight: 2, margin: 0, maxWidth: 320, width: '100%', textAlign: 'justify', hyphens: 'auto', position: 'relative', zIndex: 1 }}>{card.description}</p>
        </div>
        {card.createdAt && (
          <div style={{ fontSize: 10, color: '#7c624a', fontFamily: 'Cinzel, serif', letterSpacing: '0.06em', marginTop: 20, textAlign: 'right', position: 'relative', zIndex: 1 }}>
            {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(92,66,37,0.11), transparent)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

export default function Storyboard() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [cards, setCards] = useState([])
  const [currentPage, setCurrentPage] = useState(-1)
  const bookRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const scrollRef = useRef(null)
  const scrollAccum = useRef(0)
  const THRESHOLD = 80

  // Add scene form
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newImage, setNewImage] = useState(null) // base64
  const [saving, setSaving] = useState(false)

  // Edit modal
  const [editCard, setEditCard] = useState(null) // card being edited
  const [editSaving, setEditSaving] = useState(false)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setCards(await api(`/storyboard/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const goTo = useCallback((dir) => {
    const next = currentPage + dir
    if (next < -1 || next > cards.length - 1) return
    setCurrentPage(next)
  }, [currentPage, cards.length])

  useEffect(() => {
    const el = scrollRef.current; if (!el) return
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

  const [imageUploading, setImageUploading]     = useState(false)
  const [editImgUploading, setEditImgUploading] = useState(false)

  const handleImagePick = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setImageUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'lore-ledger/storyboard')
      setNewImage(url)
    } catch (err) { toast(err.message || 'Upload failed') }
    setImageUploading(false)
  }

  const handleEditImagePick = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setEditImgUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'lore-ledger/storyboard')
      setEditCard(p => ({ ...p, imageUrl: url }))
    } catch (err) { toast(err.message || 'Upload failed') }
    setEditImgUploading(false)
  }

  const addScene = async () => {
    if (!newTitle.trim() || !activeCampaign) return
    setSaving(true)
    try {
      const card = await api(`/storyboard/${activeCampaign._id}`, {
        method: 'POST',
        body: { title: newTitle.trim(), description: newDesc.trim(), imageUrl: newImage || '' },
      })
      const updated = [...cards, card]
      setCards(updated)
      setCurrentPage(updated.length - 1)
      setNewTitle(''); setNewDesc(''); setNewImage(null); setShowForm(false)
      toast('Scene added')
    } catch (err) {
      toast(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  const saveEdit = async () => {
    if (!editCard) return
    setEditSaving(true)
    try {
      const updated = await api(`/storyboard/${editCard._id}`, {
        method: 'PUT',
        body: { title: editCard.title, description: editCard.description, imageUrl: editCard.imageUrl },
      })
      setCards(p => p.map(c => c._id === updated._id ? updated : c))
      setEditCard(null)
      toast('Scene updated')
    } catch (err) { toast(err.message || 'Failed to save') }
    setEditSaving(false)
  }

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#100d08', color: 'var(--text)' }}>
      {/* Top bar */}
      <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1208', borderBottom: '1px solid #3a2a14', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#a08060' }}>
          {onCover ? activeCampaign.name : `Scene ${currentPage + 1} / ${cards.length}`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowForm(f => !f)} style={{ background: showForm ? '#c8a060' : '#4a3020', border: 'none', color: showForm ? '#1a1208' : '#c8a060', padding: '6px 14px', borderRadius: 6, fontFamily: 'Cinzel, serif', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
            {showForm ? '✕ Close' : '+ Add Scene'}
          </button>
          {!onCover && currentCard && (
            <button onClick={() => { if (!window.confirm('Delete this scene?')) return; deleteCard(currentCard._id) }} style={{ background: 'transparent', border: '1px solid #4a3020', color: '#8a6040', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* Add scene form */}
      {showForm && (
        <div style={{ padding: '12px 20px', background: '#1e1610', borderBottom: '1px solid #3a2a14', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input" placeholder="Scene title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <textarea className="input" rows={2} placeholder="Describe what happened in this scene..." value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ resize: 'none', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ cursor: imageUploading ? 'wait' : 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                🖼 {imageUploading ? 'Uploading…' : newImage ? 'Image selected ✓' : 'Upload image'}
                {!imageUploading && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />}
              </label>
              {newImage && <button onClick={() => setNewImage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>}
              <div style={{ fontSize: 11, color: '#6a5040' }}>Use AI tools (Midjourney, DALL·E, etc.) to create images, then upload here.</div>
            </div>
          </div>
          <button onClick={addScene} disabled={saving || !newTitle.trim()} style={{ background: saving ? 'var(--border)' : '#c8a060', border: 'none', color: saving ? 'var(--text-3)' : '#1a1208', padding: '10px 18px', borderRadius: 6, fontFamily: 'Cinzel, serif', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'stretch', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✦ Add'}
          </button>
        </div>
      )}

      {/* Book viewport */}
      <div ref={scrollRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 16px', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at center, #1e1508 0%, #100d08 70%)' }}>
        <div ref={bookRef} className="book-viewport" style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,160,96,0.15)', borderRadius: 3 }}>
          {!onCover && (
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(to right, #2a1810, #4a3020, #2a1810)', zIndex: 10, transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, transition: 'opacity .35s', opacity: onCover ? 1 : 0, pointerEvents: onCover ? 'auto' : 'none' }}>
            <Cover campaignName={activeCampaign?.name} />
          </div>
          {cards.map((card, i) => (
            <div key={card._id} style={{ position: 'absolute', inset: 0, opacity: i === currentPage ? 1 : 0, transition: 'none', pointerEvents: i === currentPage ? 'auto' : 'none' }}>
              <BookSpread card={card} index={i} onEdit={() => setEditCard({ ...card })} />
            </div>
          ))}
          {cards.length === 0 && !onCover && (
            <div style={{ position: 'absolute', inset: 0, background: '#fdfaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#a89070' }}>
              <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13 }}>Your chronicle awaits</div>
            </div>
          )}
        </div>

        {[{ dir: -1, side: 'left', char: '‹', disabled: onCover }, { dir: 1, side: 'right', char: '›', disabled: currentPage >= cards.length - 1 }].map(({ dir, side, char, disabled }) => (
          <button key={side} onClick={() => goTo(dir)} disabled={disabled} style={{ position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(200,160,96,0.12)', border: '1px solid rgba(200,160,96,0.25)', color: '#c8a060', width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.2 : 0.8, transition: 'opacity .2s' }}>{char}</button>
        ))}
      </div>

      {/* Dots */}
      <div style={{ padding: '6px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#100d08', flexShrink: 0 }}>
        <div onClick={() => setCurrentPage(-1)} style={{ width: 5, height: 5, borderRadius: '50%', background: onCover ? '#c8a060' : '#4a3020', cursor: 'pointer' }} />
        {cards.map((_, i) => (
          <div key={i} onClick={() => setCurrentPage(i)} style={{ width: 5, height: 5, borderRadius: '50%', background: i === currentPage ? '#c8a060' : '#4a3020', cursor: 'pointer' }} />
        ))}
      </div>

      {/* Edit modal */}
      {editCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditCard(null)}>
          <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 16 }}>Edit Scene</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" placeholder="Title" value={editCard.title} onChange={e => setEditCard(p => ({ ...p, title: e.target.value }))} />
              <textarea className="input" rows={4} placeholder="Description" value={editCard.description || ''} onChange={e => setEditCard(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ cursor: editImgUploading ? 'wait' : 'pointer', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🖼 {editImgUploading ? 'Uploading…' : 'Replace image'}
                  {!editImgUploading && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditImagePick} />}
                </label>
                {editCard.imageUrl && <span style={{ fontSize: 11, color: 'var(--green)' }}>Image set ✓</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => setEditCard(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

