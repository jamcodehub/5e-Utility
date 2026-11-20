import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import ImageGenModal from '../components/ImageGenModal'
import { AI_ENABLED } from '../utils/features'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'
import { isPublicDemoPath } from '../utils/demoRuntime'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'
import './Storyboard.css'

const CLOUD_NAME = 'crcbzpw6'

function getOptimisedUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return ''
  const afterUpload = cloudinaryUrl.replace(/^.*\/upload\/(?:v\d+\/)?/, '')
  const publicId = afterUpload.replace(/\.[^.]+$/, '')
  if (!publicId) return cloudinaryUrl
  return new CloudinaryImage(publicId, { cloudName: CLOUD_NAME })
    .delivery(quality(autoQuality()))
    .delivery(format(autoFormat()))
    .toURL()
}


// ─── Cover ──────────────────────────────────────────────────────────────────
function Cover({ campaignName, isMobile }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', overflow: 'hidden', borderRadius: 3 }}>
      {/* Binder spine — left edge, cover only */}
      <div style={{
        width: isMobile ? 18 : 26,
        flexShrink: 0,
        background: 'linear-gradient(to right, #2a1f0e 0%, #5a3e1b 30%, #3d2a0f 60%, #1e1408 100%)',
        boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.4), inset 2px 0 4px rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Binder rivets */}
        {[0.2, 0.5, 0.8].map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            top: `${pos * 100}%`,
            width: isMobile ? 8 : 12,
            height: isMobile ? 8 : 12,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #c8a060, #6b4e1a)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
            transform: 'translateY(-50%)',
          }} />
        ))}
      </div>

      {/* Cover face */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg, var(--sb-bar) 0%, color-mix(in srgb, var(--sb-bar) 70%, var(--sb-spine)) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        position: 'relative',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.15)',
      }}>
        {/* Inner border frame */}
        <div style={{
          position: 'absolute', inset: 12,
          border: '1px solid rgba(200,160,96,0.2)',
          borderRadius: 6,
          pointerEvents: 'none',
        }} />
        <div style={{ fontFamily: 'var(--font-title)', fontSize: isMobile ? 22 : 34, color: 'var(--sb-page-title)', lineHeight: 1.2, fontWeight: 700, letterSpacing: '0.06em', textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          {campaignName || 'Your Campaign'}
        </div>
        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--sb-page-body)', letterSpacing: '0.2em', fontFamily: 'var(--font-title)', textAlign: 'center' }}>
          CHRONICLE
        </div>
      </div>
    </div>
  )
}

// ─── BookSpread ──────────────────────────────────────────────────────────────
function BookSpread({ card, index, onEdit, isMobile }) {
  if (isMobile) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: '0 0 55%', background: 'var(--sb-bar)', borderBottom: '2px solid var(--sb-spine)', overflow: 'hidden', position: 'relative' }}>
          {card.imageUrl
            ? <img src={getOptimisedUrl(card.imageUrl)} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--sb-page-meta)' }}><div style={{ fontSize: 32, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'var(--font-title)' }}>No image</div></div>
          }
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)', pointerEvents: 'none' }} />
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(180deg, var(--sb-page-start), var(--sb-page-end))', padding: '14px 20px 12px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.032) 28px)', backgroundPosition: '0 14px' }}>
          <div style={{ position: 'absolute', top: 8, right: 12, fontFamily: 'var(--font-title)', fontSize: 9, color: 'var(--sb-page-meta)', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
          <button onClick={onEdit} style={{ position: 'absolute', top: 10, right: 36, background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--sb-page-meta)', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-title)', zIndex: 2 }}>Edit</button>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 15, color: 'var(--sb-page-title)', lineHeight: 1.3, margin: '0 0 10px 0', textAlign: 'center', position: 'relative', zIndex: 1 }}>{card.title}</h2>
          <div data-story-text style={{ flex: 1, overflow: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, color: 'var(--sb-page-body)', lineHeight: 1.85, margin: 0, textAlign: 'justify', hyphens: 'auto', position: 'relative', zIndex: 1 }}>{card.description}</p>
          </div>
          {card.createdAt && (
            <div style={{ fontSize: 9, color: 'var(--sb-page-meta)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', marginTop: 8, textAlign: 'right', position: 'relative', zIndex: 1 }}>
              {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', minWidth: 0 }}>
      <div style={{ flex: 1, background: 'var(--sb-bar)', borderRight: '2px solid var(--sb-spine)', overflow: 'hidden', position: 'relative' }}>
        {card.imageUrl
          ? <img src={getOptimisedUrl(card.imageUrl)} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--sb-page-meta)' }}><div style={{ fontSize: 40, opacity: 0.3 }}>✦</div><div style={{ fontSize: 11, fontFamily: 'var(--font-title)' }}>No image uploaded</div></div>
        }
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(0,0,0,0.18), transparent)', pointerEvents: 'none' }} />
      </div>
      <div style={{ flex: 1, background: 'linear-gradient(180deg, var(--sb-page-start), var(--sb-page-end))', padding: '32px 44px 28px 40px', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.032) 28px)', backgroundPosition: '0 32px' }}>
        <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: 'var(--font-title)', fontSize: 10, color: 'var(--sb-page-meta)', letterSpacing: '0.1em' }}>{index * 2 + 2}</div>
        <button onClick={onEdit} style={{ position: 'absolute', top: 32, right: 18, background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.15)', color: 'var(--sb-page-meta)', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-title)', zIndex: 2 }}>Edit</button>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 17, color: 'var(--sb-page-title)', lineHeight: 1.4, margin: '0 0 20px 0', textAlign: 'center', position: 'relative', zIndex: 1, paddingRight: 44 }}>{card.title}</h2>
        <div data-story-text style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', justifyContent: 'center', overscrollBehavior: 'contain' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, color: 'var(--sb-page-body)', lineHeight: 2, margin: 0, maxWidth: 320, width: '100%', textAlign: 'justify', hyphens: 'auto', position: 'relative', zIndex: 1 }}>{card.description}</p>
        </div>
        {card.createdAt && (
          <div style={{ fontSize: 10, color: 'var(--sb-page-meta)', fontFamily: 'var(--font-title)', letterSpacing: '0.06em', marginTop: 20, textAlign: 'right', position: 'relative', zIndex: 1 }}>
            {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Storyboard() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [cards, setCards] = useState([])
  const { user, isPremium } = useAuth()
  const isDM = user?.role === 'dm'
  const [genFor, setGenFor] = useState(null) // { title, description, onUse } while the image picker is open
  const toastRef = useRef(toast)
  toastRef.current = toast
  const [currentPage, setCurrentPage] = useState(-1)
  const bookRef = useRef(null)
  const [showForm, setShowForm] = useState(false)
  const scrollRef = useRef(null)
  const scrollAccum = useRef(0)
  const THRESHOLD = 80
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newImage, setNewImage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const { schedule: scheduleEditSave, flush: flushEditSave } = useDebouncedSave(1000)
  const editUserChange = useRef(false)
  const editField = (fn) => { editUserChange.current = true; setEditCard(fn) }
  // Uploads finish later. If the edit window was closed meanwhile `p` is null, and spreading null would leave a
  // half-empty scene ({ imageUrl } with no title) that crashed the whole page. Only update a scene that is still open.
  const withImage = (url) => (p) => (p ? { ...p, imageUrl: url } : p)
  const editRef = useRef(null)
  // Autosave an existing scene 1s after typing stops.
  useEffect(() => {
    if (!editUserChange.current) return
    editUserChange.current = false
    if (!editCard || !(editCard.title || '').trim()) return
    const card = editCard
    scheduleEditSave(async () => {
      try {
        const updated = await api(`/storyboard/${card._id}`, { method: 'PUT', body: { title: card.title, description: card.description, imageUrl: card.imageUrl } })
        setCards(p => p.map(c => c._id === updated._id ? updated : c))
      } catch (err) { toast(err.message || 'Could not autosave') }
    })
  }, [editCard]) // eslint-disable-line react-hooks/exhaustive-deps
  editRef.current = editCard
  const [editSaving, setEditSaving] = useState(false)

  const load = useCallback(async () => {
    if (!activeCampaign) {
      setCards([])
      return
    }
    try {
      setCards(await api(`/storyboard/${activeCampaign._id}`))
    } catch (err) { toastRef.current(err.message || 'Failed to load storyboard') }
  }, [activeCampaign])

  useEffect(() => { setCards([]); load() }, [load])

  const goTo = useCallback((dir) => {
    const next = currentPage + dir
    if (next < -1 || next > cards.length - 1) return
    setCurrentPage(next)
  }, [currentPage, cards.length])

  // Desktop scroll
  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    const onWheel = (e) => {
      if (e.target instanceof Element && e.target.closest('[data-story-text]')) {
        scrollAccum.current = 0
        e.stopPropagation()
        return
      }
      e.preventDefault()
      scrollAccum.current += e.deltaY
      if (scrollAccum.current > THRESHOLD) { scrollAccum.current = 0; goTo(1) }
      else if (scrollAccum.current < -THRESHOLD) { scrollAccum.current = 0; goTo(-1) }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [goTo])

  // Mobile swipe (horizontal only)
  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    let startX = 0, startY = 0, locked = false
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; locked = false }
    const onMove = (e) => {
      if (locked) { e.preventDefault(); return }
      const dx = Math.abs(e.touches[0].clientX - startX)
      const dy = Math.abs(e.touches[0].clientY - startY)
      if (dx > dy && dx > 8) { locked = true; e.preventDefault() }
    }
    const onEnd = (e) => {
      const diff = e.changedTouches[0].clientX - startX
      const dy = Math.abs(e.changedTouches[0].clientY - startY)
      if (Math.abs(diff) > 44 && Math.abs(diff) > dy) goTo(diff < 0 ? 1 : -1)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [goTo])

  const [imageUploading, setImageUploading] = useState(false)
  const [editImgUploading, setEditImgUploading] = useState(false)

  const handleImagePick = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (isPublicDemoPath()) { toast('Image uploads are available after signing in.'); e.target.value = ''; return }
    setImageUploading(true)
    try { const url = await uploadToCloudinary(file, 'lore-ledger/storyboard'); setNewImage(url) }
    catch (err) { toast(err.message || 'Upload failed') }
    setImageUploading(false)
  }

  const handleEditImagePick = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (isPublicDemoPath()) { toast('Image uploads are available after signing in.'); e.target.value = ''; return }
    setEditImgUploading(true)
    try { const url = await uploadToCloudinary(file, 'lore-ledger/storyboard'); if (editRef.current) editField(withImage(url)); else toast('The scene was closed before the upload finished. Open it again and re-add the image.') }
    catch (err) { toast(err.message || 'Upload failed') }
    setEditImgUploading(false)
  }

  const addScene = async () => {
    if (!newTitle.trim() || !activeCampaign) return
    setSaving(true)
    try {
      const card = await api(`/storyboard/${activeCampaign._id}`, { method: 'POST', body: { title: newTitle.trim(), description: newDesc.trim(), imageUrl: newImage || '' } })
      const updated = [...cards, card]
      setCards(updated); setCurrentPage(updated.length - 1)
      setNewTitle(''); setNewDesc(''); setNewImage(null); setShowForm(false)
      toast('Scene added')
    } catch (err) { toast(err.message || 'Failed to save') }
    setSaving(false)
  }

  const saveEdit = async () => {
    if (!editCard) return
    flushEditSave()
    setEditSaving(true)
    try {
      const updated = await api(`/storyboard/${editCard._id}`, { method: 'PUT', body: { title: editCard.title, description: editCard.description, imageUrl: editCard.imageUrl } })
      setCards(p => p.map(c => c._id === updated._id ? updated : c))
      setEditCard(null); toast('Scene updated')
    } catch (err) { toast(err.message || 'Failed to save') }
    setEditSaving(false)
  }

  const deleteCard = async (id) => {
    await api(`/storyboard/${id}`, { method: 'DELETE' })
    setCards(p => p.filter(c => c._id !== id))
    setCurrentPage(p => Math.max(-1, p - 1))
    toast('Scene removed')
  }

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8a060', fontFamily: 'var(--font-title)' }}>Select a campaign first.</div>
  if (activeCampaign.isPersonal) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#c8a060', fontFamily: 'var(--font-title)', padding: 24 }}>The Storyboard is a shared party feature.<br />Join or create a real campaign to use it.</div>

  const onCover = currentPage === -1
  const currentCard = cards[currentPage]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sb-outer)', color: 'var(--text)' }}>
      {/* Top bar */}
      <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sb-bar)', borderBottom: '1px solid var(--sb-bar-border)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 12, color: 'var(--sb-page-meta)' }}>
          {onCover ? activeCampaign.name : `Scene ${currentPage + 1} / ${cards.length}`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => window.print()} style={{ background: 'var(--sb-bar-border)', border: 'none', color: 'var(--sb-accent)', padding: '6px 14px', borderRadius: 6, fontFamily: 'var(--font-title)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
            Print Book
          </button>
          <button onClick={() => setShowForm(f => !f)} style={{ background: showForm ? 'var(--sb-accent)' : 'var(--sb-bar-border)', border: 'none', color: showForm ? 'var(--sb-outer)' : 'var(--sb-accent)', padding: '6px 14px', borderRadius: 6, fontFamily: 'var(--font-title)', fontSize: 11, cursor: 'pointer', letterSpacing: '0.05em' }}>
            {showForm ? '✕ Close' : '+ Add Scene'}
          </button>
        </div>
      </div>

      {/* Add scene form */}
      {showForm && (
        <div style={{ padding: '12px 20px', background: 'var(--sb-bar)', borderBottom: '1px solid var(--sb-bar-border)', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input" placeholder="Scene title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <textarea className="input" rows={2} placeholder="Describe what happened in this scene..." value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ resize: 'none', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ cursor: imageUploading ? 'wait' : 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {imageUploading ? 'Uploading…' : newImage ? 'Image selected ✓' : 'Upload image'}
                {!imageUploading && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />}
              </label>
              {isDM && AI_ENABLED && <button type="button" disabled={isPremium && (!newTitle.trim() && !(newDesc || '').trim())} onClick={() => !isPremium ? (window.location.href = '/premium') : setGenFor({ title: newTitle, description: newDesc, onUse: setNewImage })} title="Paint this scene with AI, using your campaign characters' avatars" style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--gold)', cursor: 'pointer' }}>{isPremium ? '✦ Generate' : '✦ Generate (Premium)'}</button>}
              {newImage && <button onClick={() => setNewImage(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>}
            </div>
          </div>
          <button onClick={addScene} disabled={saving || !newTitle.trim()} style={{ background: saving ? 'var(--border)' : 'var(--sb-accent)', border: 'none', color: saving ? 'var(--text-3)' : 'var(--sb-outer)', padding: '10px 18px', borderRadius: 6, fontFamily: 'var(--font-title)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'stretch', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✦ Add'}
          </button>
        </div>
      )}

      {/* Keep the book frame mounted while scenes load so the dots stay below it. */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? 0 : '4px 16px',
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--sb-outer) 60%, var(--sb-bar)) 0%, var(--sb-outer) 70%)',
        }}
      >
        <div
          ref={bookRef}
          className="book-viewport"
          style={{
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,160,96,0.15)',
            borderRadius: 3,
            // On mobile make it fill the available space
            ...(isMobile ? { width: '100%', height: '100%', maxWidth: '100%' } : {}),
            overflow: 'hidden',
          }}
        >
          {/* Desktop spine divider */}
          {!onCover && !isMobile && (
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(to right, var(--sb-outer), var(--sb-spine), var(--sb-outer))', zIndex: 10, transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
          )}

          {/* Cover */}
          <div
            style={{
              position: 'absolute', inset: 0,
              opacity: onCover ? 1 : 0,
              pointerEvents: onCover ? 'auto' : 'none',
              transition: 'opacity .2s',
            }}
          >
            <Cover campaignName={activeCampaign?.name} isMobile={isMobile} />
          </div>

          {/* Scene pages */}
          {cards.map((card, i) => {
            if (Math.abs(i - currentPage) > 1) return null
            return (
              <div
                key={card._id}
                style={{
                  position: 'absolute', inset: 0,
                  opacity: i === currentPage ? 1 : 0,
                  pointerEvents: i === currentPage ? 'auto' : 'none',
                }}
              >
                <BookSpread card={card} index={i} onEdit={() => setEditCard({ ...card })} isMobile={isMobile} />
              </div>
            )
          })}

          {cards.length === 0 && !onCover && (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--sb-page-start)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--sb-page-meta)' }}>
              <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 13 }}>Your chronicle awaits</div>
            </div>
          )}
        </div>

        {/* Desktop nav arrows only */}
        {!isMobile && [{ dir: -1, side: 'left', char: '‹', disabled: onCover }, { dir: 1, side: 'right', char: '›', disabled: currentPage >= cards.length - 1 }].map(({ dir, side, char, disabled }) => (
          <button key={side} onClick={() => goTo(dir)} disabled={disabled} style={{ position: 'absolute', [side]: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--sb-accent)', width: 36, height: 36, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.2 : 0.8, transition: 'opacity .2s' }}>{char}</button>
        ))}

        {/* Mobile swipe hint on cover */}
        {isMobile && onCover && cards.length > 0 && (
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'var(--sb-page-meta)', fontFamily: 'var(--font-title)', letterSpacing: '0.1em', pointerEvents: 'none', opacity: 0.7 }}>
            SWIPE TO OPEN
          </div>
        )}
      </div>

      {/* Dots */}
      <div style={{ padding: '6px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--sb-outer)', flexShrink: 0 }}>
        <div onClick={() => setCurrentPage(-1)} style={{ width: 5, height: 5, borderRadius: '50%', background: onCover ? 'var(--sb-accent)' : 'var(--sb-bar-border)', cursor: 'pointer' }} />
        {cards.map((_, i) => (
          <div key={i} onClick={() => setCurrentPage(i)} style={{ width: 5, height: 5, borderRadius: '50%', background: i === currentPage ? 'var(--sb-accent)' : 'var(--sb-bar-border)', cursor: 'pointer' }} />
        ))}
      </div>

      {/* Edit modal */}
      {editCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditCard(null)}>
          <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 16 }}>Edit Scene</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" placeholder="Title" value={editCard.title ?? ''} onChange={e => editField(p => ({ ...p, title: e.target.value }))} />
              <textarea className="input" rows={4} placeholder="Description" value={editCard.description || ''} onChange={e => editField(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ cursor: editImgUploading ? 'wait' : 'pointer', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {editImgUploading ? 'Uploading…' : 'Replace image'}
                  {!editImgUploading && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditImagePick} />}
                </label>
                {isDM && AI_ENABLED && <button type="button" disabled={isPremium && (!(editCard.title || '').trim() && !(editCard.description || '').trim())} onClick={() => !isPremium ? (window.location.href = '/premium') : setGenFor({ title: editCard.title, description: editCard.description, onUse: (url) => editField(withImage(url)) })} title="Paint this scene with AI, using your campaign characters' avatars" style={{ background: 'var(--surface)', border: '1px solid var(--gold-border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--gold)', cursor: 'pointer' }}>{isPremium ? '✦ Generate' : '✦ Generate (Premium)'}</button>}
                {editCard.imageUrl && <span style={{ fontSize: 11, color: 'var(--green)' }}>Image set ✓</span>}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ color: '#e53935', border: '1px solid rgba(229, 57, 53, 0.3)' }}
                onClick={() => {
                  if (!window.confirm('Delete this scene?')) return
                  deleteCard(editCard._id)
                  setEditCard(null)
                }}
              >
                Delete Scene
              </button>
              
              <div style={{ flex: 1 }} />
              
              <button className="btn btn-ghost" onClick={() => { flushEditSave(); setEditCard(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={editSaving || editImgUploading} title={editImgUploading ? 'Wait for the image to finish uploading' : undefined}>{editSaving ? 'Saving...' : editImgUploading ? 'Uploading image…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {genFor && <ImageGenModal campaignId={activeCampaign._id} title={genFor.title} description={genFor.description} onClose={() => setGenFor(null)} onUse={(url) => { genFor.onUse(url); setGenFor(null); toast('Image added') }} />}
      <ToastContainer />
      {createPortal(<div className="storyboard-print-book">
        <section className="storyboard-print-page storyboard-print-cover">
          <div className="storyboard-print-cover-spine" />
          <div className="storyboard-print-cover-face">
            <div className="storyboard-print-cover-frame">
              <h1>{activeCampaign.name || 'Your Campaign'}</h1>
              <p>CHRONICLE</p>
            </div>
          </div>
        </section>
        {cards.map((card, index) => (
          <article className="storyboard-print-page storyboard-print-scene" key={`print-${card._id}`}>
            <div className="storyboard-print-scene-image">
              {card.imageUrl
                ? <img src={getOptimisedUrl(card.imageUrl)} alt="" />
                : <span>No image</span>}
            </div>
            <div className="storyboard-print-scene-copy">
              <span className="storyboard-print-page-number">{String(index + 1).padStart(2, '0')}</span>
              <h2>{card.title || `Scene ${index + 1}`}</h2>
              <p>{card.description}</p>
              {card.createdAt && (
                <time dateTime={card.createdAt}>
                  {new Date(card.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              )}
            </div>
          </article>
        ))}
      </div>, document.body)}
    </div>
  )
}