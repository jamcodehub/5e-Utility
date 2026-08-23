import { useState, useEffect, useRef } from 'react'
import { MOODS, useMusic } from '../context/MusicContext'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const CLOUD_NAME = 'crcbzpw6'
const UPLOAD_PRESET = 'lore_ledger_music' // create an unsigned preset in Cloudinary dashboard

async function uploadAudioToCloudinary(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', 'lore-ledger/music')
  fd.append('resource_type', 'video') // Cloudinary uses 'video' resource type for audio

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id, duration: data.duration }
}

export default function MusicPlayer() {
  const { current, volume, play, stop, setVol } = useMusic()
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()

  const [playlist, setPlaylist] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTrack, setActiveTrack] = useState(null) // { url, name, id }
  const [playing, setPlaying] = useState(false)
  const [trackTime, setTrackTime] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load playlist from backend
  useEffect(() => {
    if (!activeCampaign) return
    api(`/music/${activeCampaign._id}`).then(data => setPlaylist(data || [])).catch(() => {})
  }, [activeCampaign?._id])

  // Audio element time tracking
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setTrackTime(el.currentTime)
    const onDur  = () => setTrackDuration(el.duration || 0)
    const onEnd  = () => { setPlaying(false); setTrackTime(0) }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onDur)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onDur)
      el.removeEventListener('ended', onEnd)
    }
  }, [])

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const playTrack = (track) => {
    // Stop ambient moods if switching to custom track
    if (current) stop()
    const el = audioRef.current
    if (!el) return
    if (activeTrack?.id === track.id && playing) {
      el.pause()
      setPlaying(false)
      return
    }
    setActiveTrack(track)
    el.src = track.url
    el.volume = volume
    el.play().then(() => setPlaying(true)).catch(() => toast('Could not play track'))
  }

  const stopTrack = () => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setPlaying(false)
    setActiveTrack(null)
  }

  const handleSeek = (e) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = +e.target.value
    setTrackTime(+e.target.value)
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length || !activeCampaign) return
    setUploading(true)
    setUploadProgress(0)

    const uploaded = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(Math.round((i / files.length) * 100))
      try {
        const { url, publicId, duration } = await uploadAudioToCloudinary(file)
        const name = file.name.replace(/\.[^.]+$/, '') // strip extension for display name
        const track = await api(`/music/${activeCampaign._id}`, {
          method: 'POST',
          body: { name, url, publicId, duration: Math.round(duration || 0) },
        })
        uploaded.push(track)
      } catch (err) {
        toast(`Failed to upload ${file.name}`)
      }
    }

    setPlaylist(p => [...p, ...uploaded])
    setUploadProgress(100)
    setUploading(false)
    if (uploaded.length) toast(`${uploaded.length} track${uploaded.length > 1 ? 's' : ''} added`)
    e.target.value = ''
  }

  const deleteTrack = async (track) => {
    if (!window.confirm(`Remove "${track.name}"?`)) return
    try {
      await api(`/music/${track._id}`, { method: 'DELETE' })
      setPlaylist(p => p.filter(t => t._id !== track._id))
      if (activeTrack?.id === track._id) stopTrack()
      toast('Track removed')
    } catch { toast('Could not remove track') }
  }

  const saveRename = async (track) => {
    if (!editName.trim()) return
    try {
      const updated = await api(`/music/${track._id}`, { method: 'PUT', body: { name: editName.trim() } })
      setPlaylist(p => p.map(t => t._id === updated._id ? updated : t))
      setEditingId(null)
    } catch { toast('Could not rename track') }
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const isAmbientPlaying = !!current
  const isCustomPlaying  = playing && !!activeTrack

  return (
    <div className="page-content">
      <audio ref={audioRef} style={{ display: 'none' }} />

      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Music</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Ambient moods &amp; your own tracks</p>
        </div>
      </div>

      {/* ── Custom Playlist ── */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Your Playlist
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !activeCampaign}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {uploading ? `Uploading ${uploadProgress}%…` : '+ Upload tracks'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
        </div>

        {/* Now playing bar */}
        {isCustomPlaying && activeTrack && (
          <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{activeTrack.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(trackTime)} / {fmt(trackDuration)}</span>
                <button onClick={stopTrack} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}>■</button>
              </div>
            </div>
            <input
              type="range" min={0} max={trackDuration || 1} step={0.5}
              value={trackTime} onChange={handleSeek}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
          </div>
        )}

        {!activeCampaign ? (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>Select a campaign to manage your playlist.</div>
        ) : playlist.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            No tracks yet. Upload MP3, WAV, or OGG files — they'll be stored and available across sessions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {playlist.map(track => {
              const isThis = activeTrack?._id === track._id && playing
              const isEditing = editingId === track._id
              return (
                <div key={track._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: isThis ? 'var(--gold-bg)' : 'var(--surface2)', border: `1px solid ${isThis ? 'var(--gold-border)' : 'var(--border)'}` }}>
                  {/* Play/pause button */}
                  <button
                    onClick={() => playTrack({ ...track, id: track._id })}
                    style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', border: `1px solid ${isThis ? 'var(--gold)' : 'var(--border)'}`, background: isThis ? 'var(--gold)' : 'transparent', color: isThis ? '#2a1a00' : 'var(--text-2)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isThis ? '⏸' : '▶'}
                  </button>

                  {/* Name / rename input */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        autoFocus
                        className="input"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => saveRename(track)}
                        onKeyDown={e => { if (e.key === 'Enter') saveRename(track); if (e.key === 'Escape') setEditingId(null) }}
                        style={{ padding: '2px 6px', fontSize: 12, width: '100%' }}
                      />
                    ) : (
                      <span
                        style={{ fontSize: 13, color: isThis ? 'var(--gold)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', cursor: 'text' }}
                        onDoubleClick={() => { setEditingId(track._id); setEditName(track.name) }}
                        title="Double-click to rename"
                      >
                        {track.name}
                      </span>
                    )}
                    {track.duration > 0 && !isEditing && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmt(track.duration)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => { setEditingId(track._id); setEditName(track.name) }}
                    title="Rename"
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                  >✎</button>
                  <button
                    onClick={() => deleteTrack(track)}
                    title="Remove"
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}
                  >✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Ambient Moods ── */}
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Ambient Moods
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginBottom: 20 }}>
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => { if (isCustomPlaying) stopTrack(); play(m.id) }}
            className="card"
            style={{
              padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: current === m.id ? '2px solid var(--gold)' : '1px solid var(--border)',
              cursor: 'pointer',
              background: current === m.id ? 'var(--gold-bg)' : 'var(--surface)',
            }}
          >
            <span>
              <span style={{ fontSize: 14, color: current === m.id ? 'var(--gold)' : 'var(--text)', display: 'block' }}>{m.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.desc}</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{current === m.id ? '⏸ Stop' : '▶ Play'}</span>
          </button>
        ))}
      </div>

      {/* Volume */}
      <div style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>Volume</span>
        <input
          type="range" min={0} max={1} step={0.05} value={volume}
          onChange={e => { setVol(+e.target.value); if (audioRef.current) audioRef.current.volume = +e.target.value }}
          style={{ flex: 1 }}
        />
      </div>

      <ToastContainer />
    </div>
  )
}
