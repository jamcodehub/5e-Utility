import { useState, useEffect, useRef } from 'react'
import { MOODS, useMusic } from '../context/MusicContext'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const CLOUD_NAME = 'crcbzpw6'
const UPLOAD_PRESET = '5e_utility_music'
const FREE_TRACK_LIMIT = 5

async function uploadAudioToCloudinary(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Upload failed (${res.status})`)
  return { url: data.secure_url, publicId: data.public_id, duration: data.duration }
}

export default function MusicPlayer() {
  const { current, volume, play, stop, setVol } = useMusic()
  const { activeCampaign } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()

  const [playlist, setPlaylist] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTrack, setActiveTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [trackTime, setTrackTime] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)

  // Session planner state
  const [sessions, setSessions] = useState([])
  const [newSessionName, setNewSessionName] = useState('')
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editSessionName, setEditSessionName] = useState('')
  const [cueTrackDraft, setCueTrackDraft] = useState('')
  const [cueLabelDraft, setCueLabelDraft] = useState('')

  useEffect(() => {
    if (!activeCampaign) return
    api(`/music/${activeCampaign._id}`).then(data => setPlaylist(data || [])).catch(() => {})
  }, [activeCampaign?._id])

  useEffect(() => {
    if (!activeCampaign) return
    api(`/sessions/${activeCampaign._id}`).then(data => setSessions(data || [])).catch(() => {})
  }, [activeCampaign?._id])

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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const playTrack = (track) => {
    if (current) stop()
    const el = audioRef.current
    if (!el) return
    if (activeTrack?._id === track._id && playing) {
      el.pause(); setPlaying(false); return
    }
    setActiveTrack(track)
    el.src = track.url
    el.volume = volume
    el.play().then(() => setPlaying(true)).catch(() => toast('Could not play track'))
  }

  const stopTrack = () => {
    const el = audioRef.current
    if (!el) return
    el.pause(); el.currentTime = 0
    setPlaying(false); setActiveTrack(null)
  }

  const handleSeek = (e) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = +e.target.value
    setTrackTime(+e.target.value)
  }

  const processFiles = async (files) => {
    if (!files.length || !activeCampaign) return

    // Free tier paywall — max 5 tracks
    if (!isPremium && playlist.length >= FREE_TRACK_LIMIT) {
      toast(`Free accounts are limited to ${FREE_TRACK_LIMIT} tracks. Upgrade to Premium for unlimited uploads.`)
      return
    }

    setUploading(true)
    setUploadProgress(0)
    const uploaded = []
    for (let i = 0; i < files.length; i++) {
      if (!isPremium && playlist.length + uploaded.length >= FREE_TRACK_LIMIT) {
        toast(`Reached the ${FREE_TRACK_LIMIT}-track limit. Upgrade to Premium for unlimited uploads.`)
        break
      }
      const file = files[i]
      setUploadProgress(Math.round((i / files.length) * 100))
      try {
        const { url, publicId, duration } = await uploadAudioToCloudinary(file)
        const name = file.name.replace(/\.[^.]+$/, '')
        const track = await api(`/music/${activeCampaign._id}`, {
          method: 'POST',
          body: { name, url, publicId, duration: Math.round(duration || 0) },
        })
        uploaded.push(track)
      } catch (err) {
        toast(err.message || `Failed to upload ${file.name}`)
      }
    }
    setPlaylist(p => [...p, ...uploaded])
    setUploadProgress(100)
    setUploading(false)
    if (uploaded.length) toast(`${uploaded.length} track${uploaded.length > 1 ? 's' : ''} added`)
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    await processFiles(files)
    e.target.value = ''
  }

  // ── Drag and Drop Handlers ──
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)
    )
    if (files.length > 0) {
      await processFiles(files)
    } else if (e.dataTransfer.files.length > 0) {
      toast('Please drop valid audio files (.mp3, .wav, .ogg, etc.)')
    }
  }

  const deleteTrack = async (track) => {
    if (!window.confirm(`Remove "${track.name}"?`)) return
    try {
      await api(`/music/${track._id}`, { method: 'DELETE' })
      setPlaylist(p => p.filter(t => t._id !== track._id))
      if (activeTrack?._id === track._id) stopTrack()
      if (selectedTrackId === track._id) setSelectedTrackId('')
      setSessions(s => s.map(sess => ({ ...sess, cues: sess.cues.filter(c => c.track?._id !== track._id) })))
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

  // ── Session planner handlers ──
  const createSession = async () => {
    if (!newSessionName.trim() || !activeCampaign) return
    try {
      const session = await api(`/sessions/${activeCampaign._id}`, { method: 'POST', body: { name: newSessionName.trim() } })
      setSessions(s => [...s, { ...session, cues: [] }])
      setNewSessionName('')
      setExpandedSessionId(session._id)
    } catch { toast('Could not create session') }
  }

  const saveSessionRename = async (session) => {
    if (!editSessionName.trim()) return
    try {
      const updated = await api(`/sessions/${session._id}`, { method: 'PUT', body: { name: editSessionName.trim() } })
      setSessions(s => s.map(x => x._id === updated._id ? { ...x, name: updated.name } : x))
      setEditingSessionId(null)
    } catch { toast('Could not rename session') }
  }

  const deleteSession = async (session) => {
    if (!window.confirm(`Delete "${session.name}" and all its cues?`)) return
    try {
      await api(`/sessions/${session._id}`, { method: 'DELETE' })
      setSessions(s => s.filter(x => x._id !== session._id))
    } catch { toast('Could not delete session') }
  }

  const addCue = async (session) => {
    if (!cueTrackDraft || !cueLabelDraft.trim()) return
    try {
      const updated = await api(`/sessions/${session._id}/cues`, {
        method: 'POST',
        body: { trackId: cueTrackDraft, label: cueLabelDraft.trim() },
      })
      setSessions(s => s.map(x => x._id === updated._id ? updated : x))
      setCueTrackDraft(''); setCueLabelDraft('')
    } catch { toast('Could not add cue') }
  }

  const deleteCue = async (session, cue) => {
    try {
      await api(`/sessions/${session._id}/cues/${cue._id}`, { method: 'DELETE' })
      setSessions(s => s.map(x => x._id === session._id ? { ...x, cues: x.cues.filter(c => c._id !== cue._id) } : x))
    } catch { toast('Could not remove cue') }
  }

  const moveCue = async (session, index, dir) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= session.cues.length) return
    const reordered = [...session.cues]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)
    setSessions(s => s.map(x => x._id === session._id ? { ...x, cues: reordered } : x))
    try {
      await api(`/sessions/${session._id}/cues-reorder`, { method: 'PUT', body: { order: reordered.map(c => c._id) } })
    } catch { toast('Could not reorder cues') }
  }

  const playCue = (cue) => {
    if (!cue.track) return
    playTrack({ _id: cue.track._id, id: cue.track._id, name: cue.track.name, url: cue.track.url })
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const isCustomPlaying = playing && !!activeTrack
  const selectedTrack = playlist.find(t => t._id === selectedTrackId) || null
  const atTrackLimit = !isPremium && playlist.length >= FREE_TRACK_LIMIT

  return (
    <div 
      className="page-content" 
      style={{ position: 'relative' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--gold)',
          borderRadius: 12,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎵</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>
            Upload to Tracks
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
            Drop your audio files here to upload them
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Music</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Ambient moods &amp; your own tracks</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {uploading && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Uploading {uploadProgress}%…</span>}
          {atTrackLimit ? (
            <span style={{ fontSize: 12, color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, padding: '6px 12px' }}>
              {FREE_TRACK_LIMIT}/{FREE_TRACK_LIMIT} tracks — upgrade for more
            </span>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !activeCampaign}
              className="btn btn-primary btn-sm"
            >
              ↑ Upload Music
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="audio/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* ── Two-column: Ambient Moods | Your Tracks ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left — Ambient Moods */}
        <div className="card" style={{ flex: 1, minWidth: 240, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Ambient Moods
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => { if (isCustomPlaying) stopTrack(); play(m.id) }}
                className="card"
                style={{
                  padding: '10px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: current === m.id ? '2px solid var(--gold)' : '1px solid var(--border)',
                  cursor: 'pointer', background: current === m.id ? 'var(--gold-bg)' : 'var(--surface2)',
                }}
              >
                <span>
                  <span style={{ fontSize: 13, color: current === m.id ? 'var(--gold)' : 'var(--text)', display: 'block' }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.desc}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{current === m.id ? '⏸' : '▶'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Your Tracks (dropdown + player) */}
        <div className="card" style={{ flex: 1, minWidth: 240, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Your Tracks {!isPremium && <span style={{ fontSize: 10, fontFamily: 'sans-serif', fontWeight: 400, color: 'var(--text-3)', textTransform: 'none' }}>({playlist.length}/{FREE_TRACK_LIMIT} free)</span>}
          </div>

          {!activeCampaign ? (
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Select a campaign first.</div>
          ) : playlist.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
              No tracks yet — upload or drag & drop MP3, WAV, or OGG files.
            </div>
          ) : (
            <>
              {/* Dropdown */}
              <select
                className="input"
                value={selectedTrackId}
                onChange={e => setSelectedTrackId(e.target.value)}
                style={{ fontSize: 13, width: '100%' }}
              >
                <option value="">Select a track…</option>
                {playlist.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.duration ? ` (${fmt(t.duration)})` : ''}
                  </option>
                ))}
              </select>

              {/* Play controls */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => selectedTrack && playTrack({ ...selectedTrack, id: selectedTrack._id })}
                  disabled={!selectedTrackId}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isCustomPlaying && activeTrack?._id === selectedTrackId ? '⏸ Pause' : '▶ Play'}
                </button>
                {isCustomPlaying && (
                  <button onClick={stopTrack} className="btn btn-ghost btn-sm">■ Stop</button>
                )}
              </div>

              {/* Now playing bar */}
              {isCustomPlaying && activeTrack && (
                <div style={{ padding: '10px 12px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{activeTrack.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(trackTime)} / {fmt(trackDuration)}</span>
                  </div>
                  <input type="range" min={0} max={trackDuration || 1} step={0.5} value={trackTime} onChange={handleSeek} style={{ width: '100%', accentColor: 'var(--gold)' }} />
                </div>
              )}

              {/* Manage — compact scrollable list */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manage tracks</div>
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {playlist.map(track => (
                    <div key={track._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {editingId === track._id ? (
                          <input autoFocus className="input"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={() => saveRename(track)}
                            onKeyDown={e => { if (e.key === 'Enter') saveRename(track); if (e.key === 'Escape') setEditingId(null) }}
                            style={{ padding: '1px 4px', fontSize: 12, width: '100%' }}
                          />
                        ) : (
                          <span onDoubleClick={() => { setEditingId(track._id); setEditName(track.name) }} title="Double-click to rename">{track.name}</span>
                        )}
                      </span>
                      <button onClick={() => { setEditingId(track._id); setEditName(track.name) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0 }}>✎</button>
                      <button onClick={() => deleteTrack(track)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Volume */}
      <div style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={volume}
          onChange={e => { setVol(+e.target.value); if (audioRef.current) audioRef.current.volume = +e.target.value }}
          style={{ flex: 1 }} />
      </div>

      {/* ── Session Planner ── */}
      <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Session Planner
        </div>
        {!activeCampaign ? (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>Select a campaign to plan sessions.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="input" placeholder="New session name (e.g. Session 3)"
                value={newSessionName} onChange={e => setNewSessionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createSession() }}
                style={{ flex: 1, fontSize: 13 }} />
              <button onClick={createSession} disabled={!newSessionName.trim()} className="btn btn-ghost btn-sm">+ Add session</button>
            </div>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                No sessions planned yet. Create one, then queue up tracks with a note for when to play each.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map(session => {
                  const isOpen = expandedSessionId === session._id
                  const isEditingName = editingSessionId === session._id
                  return (
                    <div key={session._id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--surface2)', cursor: 'pointer' }}
                        onClick={() => setExpandedSessionId(isOpen ? null : session._id)}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{isOpen ? '▾' : '▸'}</span>
                        {isEditingName ? (
                          <input autoFocus className="input" value={editSessionName}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditSessionName(e.target.value)}
                            onBlur={() => saveSessionRename(session)}
                            onKeyDown={e => { if (e.key === 'Enter') saveSessionRename(session); if (e.key === 'Escape') setEditingSessionId(null) }}
                            style={{ flex: 1, padding: '2px 6px', fontSize: 13 }} />
                        ) : (
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingSessionId(session._id); setEditSessionName(session.name) }}
                            title="Double-click to rename">{session.name}</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{session.cues.length} cue{session.cues.length !== 1 ? 's' : ''}</span>
                        <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(session._id); setEditSessionName(session.name) }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: '0 2px', flexShrink: 0 }}>✎</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteSession(session) }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                      </div>
                      {isOpen && (
                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {session.cues.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 0' }}>No cues yet.</div>}
                          {session.cues.map((cue, i) => (
                            <div key={cue._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-3)', width: 18, flexShrink: 0 }}>{i + 1}.</span>
                              <button onClick={() => playCue(cue)} disabled={!cue.track}
                                style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: cue.track ? 'pointer' : 'not-allowed', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cue.label}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cue.track?.name || 'Track removed'}</div>
                              </div>
                              <button onClick={() => moveCue(session, i, -1)} disabled={i === 0}
                                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: i === 0 ? 'default' : 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0, opacity: i === 0 ? 0.3 : 1 }}>▲</button>
                              <button onClick={() => moveCue(session, i, 1)} disabled={i === session.cues.length - 1}
                                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: i === session.cues.length - 1 ? 'default' : 'pointer', fontSize: 12, padding: '0 2px', flexShrink: 0, opacity: i === session.cues.length - 1 ? 0.3 : 1 }}>▼</button>
                              <button onClick={() => deleteCue(session, cue)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <select className="input" value={cueTrackDraft} onChange={e => setCueTrackDraft(e.target.value)} style={{ fontSize: 12, flex: '0 0 40%' }}>
                              <option value="">Choose track…</option>
                              {playlist.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                            <input className="input" placeholder='Note, e.g. "Entering the forest"'
                              value={cueLabelDraft} onChange={e => setCueLabelDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') addCue(session) }}
                              style={{ flex: 1, fontSize: 12 }} />
                            <button onClick={() => addCue(session)} disabled={!cueTrackDraft || !cueLabelDraft.trim()} className="btn btn-ghost btn-sm">+ Add</button>
                          </div>
                          {playlist.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Upload tracks first.</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer />
    </div>
  )
}