import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const STAT_LABELS = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }
const mod = v => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}` }
const modNum = v => Math.floor((v - 10) / 2)

const DEFAULT = {
  name: '', race: '', class: '', level: 1,
  dndBeyondUrl: '', notes: '',
  appearancePrompt: '',
  hp: { current: 10, max: 10 }, ac: 10, profBonus: 2,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  proficiencies: [], avatarUrl: '',
}

export default function Character() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [tab, setTab]       = useState('stats')
  const [char, setChar]     = useState(null)
  const [form, setForm]     = useState(DEFAULT)
  const [editing, setEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/campaigns/${activeCampaign._id}/character`)
    if (data) { setChar(data); setForm(data); setAvatarPreview(data.avatarUrl || '') }
    else { setChar(null); setForm(DEFAULT); setAvatarPreview('') }
    setLoaded(true)
  }, [activeCampaign])

  useEffect(() => { if (!activeCampaign) return; setLoaded(false); load() }, [activeCampaign, load])

  const [avatarUploading, setAvatarUploading] = useState(false)

  const handleAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const url = await uploadToCloudinary(file, 'lore-ledger/avatars')
      setAvatarPreview(url)
      setForm(p => ({ ...p, avatarUrl: url }))
    } catch (err) {
      toast(err.message || 'Avatar upload failed')
    }
    setAvatarUploading(false)
  }

  const save = async () => {
    try {
      const updated = await api(`/campaigns/${activeCampaign._id}/character`, { method: 'PUT', body: form })
      setChar(updated); setForm(updated); setEditing(false); toast('Character saved')
    } catch (e) { toast(e.message || 'Save failed') }
  }

  // Quick HP adjust — heal (+) or take damage (-), clamped to [0, max].
  // Updates the number instantly (no waiting on the network), then saves in
  // the background debounced so rapid clicking never feels laggy.
  const hpSaveTimer = useRef(null)
  const adjustHp = (delta) => {
    setForm(p => {
      const max = p.hp?.max ?? 10
      const current = p.hp?.current ?? 10
      const next = Math.max(0, Math.min(max, current + delta))
      const nextForm = { ...p, hp: { current: next, max } }
      if (activeCampaign) {
        clearTimeout(hpSaveTimer.current)
        hpSaveTimer.current = setTimeout(async () => {
          try {
            const updated = await api(`/campaigns/${activeCampaign._id}/character`, { method: 'PUT', body: nextForm })
            setChar(updated)
          } catch { toast('Could not save HP change') }
        }, 400)
      }
      return nextForm
    })
  }

  const F = form

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>
  if (!loaded) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Loading character...</div>

  return (
    <div className="page-content">
      {/* Header card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--gold-bg)', border: '2px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '𖥔'}
          </div>
          {editing && (
            <label style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: avatarUploading ? 'wait' : 'pointer', fontSize: 11, color: '#fff', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16 }}>{avatarUploading ? '⏳' : '📷'}</span>
              {!avatarUploading && <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />}
            </label>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          {editing ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input className="input" placeholder="Name" value={F.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: 150 }} />
              <input className="input" placeholder="Race" value={F.race} onChange={e => setForm(p => ({ ...p, race: e.target.value }))} style={{ width: 110 }} />
              <input className="input" placeholder="Class" value={F.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} style={{ width: 110 }} />
              <input className="input" type="number" placeholder="Level" value={F.level} onChange={e => setForm(p => ({ ...p, level: +e.target.value }))} style={{ width: 65 }} />
            </div>
          ) : (
            <>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600 }}>{F.name || 'Unnamed Hero'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{[F.race, F.class, F.level ? `Level ${F.level}` : ''].filter(Boolean).join(' · ')}</div>
            </>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'HP',   color: 'var(--green)' },
            { label: 'AC',   color: 'var(--text)'  },
            { label: 'Prof', color: 'var(--text)'  },
            { label: 'Init', color: 'var(--accent)' },
          ].map(({ label, color }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 44 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
              {editing ? (
                label === 'HP' ? (
                  <div style={{ display: 'flex', gap: 2 }}>
                    <input type="number" className="input" style={{ width: 42, padding: '4px', fontSize: 11, textAlign: 'center' }} value={F.hp?.current ?? 10} onChange={e => setForm(p => ({ ...p, hp: { ...p.hp, current: +e.target.value } }))} />
                    <input type="number" className="input" style={{ width: 42, padding: '4px', fontSize: 11, textAlign: 'center' }} value={F.hp?.max ?? 10} onChange={e => setForm(p => ({ ...p, hp: { ...p.hp, max: +e.target.value } }))} />
                  </div>
                ) : label === 'Init' ? (
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 600, color }}>{mod(F.stats?.dex ?? 10)}</div>
                ) : (
                  <input type="number" className="input" style={{ width: 52, padding: '4px', fontSize: 11, textAlign: 'center' }}
                    value={label === 'AC' ? F.ac ?? 10 : F.profBonus ?? 2}
                    onChange={e => setForm(p => ({ ...p, [label === 'AC' ? 'ac' : 'profBonus']: +e.target.value }))} />
                )
              ) : (
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, color }}>
                  {label === 'HP' ? `${F.hp?.current ?? 10}/${F.hp?.max ?? 10}` : label === 'AC' ? F.ac ?? 10 : label === 'Prof' ? `+${F.profBonus ?? 2}` : mod(F.stats?.dex ?? 10)}
                </div>
              )}
              {label === 'HP' && !editing && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                  <button onClick={() => adjustHp(1)} title="Heal" style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid var(--green)', background: 'transparent', color: 'var(--green)', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: 0 }}>+</button>
                  <button onClick={() => adjustHp(-1)} title="Take damage" style={{ width: 20, height: 20, borderRadius: 5, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 12, fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: 0 }}>−</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <><button className="btn btn-primary btn-sm" onClick={save}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm(char || DEFAULT); setAvatarPreview(char?.avatarUrl || '') }}>Cancel</button></>
            : <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {['stats', 'notes', 'dndbeyond'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
            {t === 'dndbeyond' ? 'D&D Beyond' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="stat-grid-6">
          {STAT_KEYS.map(k => (
            <div key={k} className="card" style={{ padding: '12px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{STAT_LABELS[k]}</div>
              {editing
                ? <input type="number" className="input" style={{ textAlign: 'center', padding: '4px', fontSize: 15 }} value={F.stats?.[k] ?? 10} onChange={e => setForm(p => ({ ...p, stats: { ...p.stats, [k]: +e.target.value } }))} />
                : <><div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, fontWeight: 600, color: 'var(--gold)' }}>{mod(F.stats?.[k] ?? 10)}</div><div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{F.stats?.[k] ?? 10}</div></>
              }
            </div>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card" style={{ padding: 16 }}>
          <textarea className="input" rows={editing ? 10 : 14} style={{ resize: 'vertical', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.7 }}
            placeholder="Character notes, backstory, personality traits, bonds, flaws..."
            value={F.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={save}>Save notes</button>
        </div>
      )}

      {tab === 'dndbeyond' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Link your D&amp;D Beyond character sheet to embed it here.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="input" style={{ flex: 1 }} placeholder="https://www.dndbeyond.com/characters/..." value={F.dndBeyondUrl || ''} onChange={e => setForm(p => ({ ...p, dndBeyondUrl: e.target.value }))} />
            <button className="btn btn-primary" onClick={save}>Link</button>
          </div>
          {F.dndBeyondUrl && <iframe src={F.dndBeyondUrl} title="D&D Beyond" style={{ width: '100%', minHeight: 360, maxHeight: 560, border: 'none', borderRadius: 8 }} sandbox="allow-scripts allow-same-origin" />}
        </div>
      )}
      <ToastContainer />
    </div>
  )
}
