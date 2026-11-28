import { useState, useEffect, useRef } from 'react'
import { api } from '../context/AuthContext'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'
import { backdropClose } from '../utils/backdrop'

// Generates scene images, shows them for review, and only uploads the one the DM confirms.
export default function ImageGenModal({ campaignId, title, description, onUse, onClose }) {
  const [images, setImages] = useState([])
  const [source, setSource] = useState('')
  const [used, setUsed] = useState(0)
  const [picked, setPicked] = useState(0)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const alive = useRef(true)

  const generate = async () => {
    setBusy(true); setError(''); setImages([]); setPicked(0)
    try {
      const res = await api('/ai/storyboard-image', { method: 'POST', body: { campaignId, prompt: `${title || ''}. ${description || ''}`.trim() } })
      if (!alive.current) return
      setImages(res.images || []); setSource(res.source); setUsed(res.usedAvatars || 0)
    } catch (e) { if (alive.current) setError(e.message || 'Could not generate an image') }
    if (alive.current) setBusy(false)
  }
  useEffect(() => { alive.current = true; generate(); return () => { alive.current = false } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = async () => {
    if (!images[picked]) return
    setSaving(true); setError('')
    try {
      const blob = await (await fetch(images[picked])).blob()
      const url = await uploadToCloudinary(new File([blob], 'scene.png', { type: blob.type || 'image/png' }), 'lore-ledger/storyboard')
      onUse(url)
    } catch (e) { setError(e.message || 'Could not save the image'); setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} {...backdropClose(() => !saving && onClose())}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Generated scene images" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>Choose a scene image</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
          {busy ? 'Painting your scene… this can take up to a minute.'
            : images.length ? (source === 'free' ? 'Made with the free service, which describes your characters in words instead of using their avatars.' : used ? `Made using ${used} character avatar${used > 1 ? 's' : ''}.` : 'Made without character avatars (none set yet).')
            : ''}
        </div>

        {busy && <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {[0].map(i => <div key={i} className="skeleton-shimmer" style={{ aspectRatio: '16 / 9', borderRadius: 3 }} />)}
        </div>}

        {!busy && images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {images.map((src, i) => (
              <button key={i} type="button" onClick={() => setPicked(i)} aria-pressed={picked === i} style={{ padding: 0, border: `3px solid ${picked === i ? 'var(--gold)' : 'transparent'}`, borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface2)', lineHeight: 0 }}>
                <img src={src} alt={`Option ${i + 1}`} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}

        {error && <div role="alert" style={{ color: 'var(--red)', fontSize: 13, marginTop: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={generate} disabled={busy || saving}>↻ Regenerate</button>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={busy || saving || !images.length}>{saving ? 'Saving…' : 'Use this image'}</button>
        </div>
      </div>
    </div>
  )
}
