import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const STAT_LABELS = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }
const mod = v => { const m = Math.floor((v - 10) / 2); return m >= 0 ? `+${m}` : `${m}` }

const SKILLS = [
  { name: 'Acrobatics',     stat: 'dex' }, { name: 'Animal Handling', stat: 'wis' },
  { name: 'Arcana',         stat: 'int' }, { name: 'Athletics',       stat: 'str' },
  { name: 'Deception',      stat: 'cha' }, { name: 'History',         stat: 'int' },
  { name: 'Insight',        stat: 'wis' }, { name: 'Intimidation',    stat: 'cha' },
  { name: 'Investigation',  stat: 'int' }, { name: 'Medicine',        stat: 'wis' },
  { name: 'Nature',         stat: 'int' }, { name: 'Perception',      stat: 'wis' },
  { name: 'Performance',    stat: 'cha' }, { name: 'Persuasion',      stat: 'cha' },
  { name: 'Religion',       stat: 'int' }, { name: 'Sleight of Hand', stat: 'dex' },
  { name: 'Stealth',        stat: 'dex' }, { name: 'Survival',        stat: 'wis' },
]

const DEFAULT = {
  name: '', race: '', class: '', level: 1,
  dndBeyondUrl: '', notes: '',
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

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/campaigns/${activeCampaign._id}/character`)
    if (data) { setChar(data); setForm(data); setAvatarPreview(data.avatarUrl || '') }
    else { setForm(DEFAULT); setAvatarPreview('') }
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result)
      setForm(p => ({ ...p, avatarUrl: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    try {
      const updated = await api(`/campaigns/${activeCampaign._id}/character`, { method: 'PUT', body: form })
      setChar(updated); setForm(updated); setEditing(false); toast('Character saved')
    } catch { toast('Save failed') }
  }

  const toggleProf = (name) => setForm(p => {
    const profs = p.proficiencies || []
    return { ...p, proficiencies: profs.includes(name) ? profs.filter(s => s !== name) : [...profs, name] }
  })

  const F = form
  const profs = F.proficiencies || []

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      {/* Header card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--gold-bg)', border: '2px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⚔️'}
          </div>
          {editing && (
            <label style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: '#fff', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16 }}>📷</span>
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
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
          ].map(({ label, color }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 44 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
              {editing ? (
                label === 'HP' ? (
                  <div style={{ display: 'flex', gap: 2 }}>
                    <input type="number" className="input" style={{ width: 42, padding: '4px', fontSize: 11, textAlign: 'center' }} value={F.hp?.current ?? 10} onChange={e => setForm(p => ({ ...p, hp: { ...p.hp, current: +e.target.value } }))} />
                    <input type="number" className="input" style={{ width: 42, padding: '4px', fontSize: 11, textAlign: 'center' }} value={F.hp?.max ?? 10} onChange={e => setForm(p => ({ ...p, hp: { ...p.hp, max: +e.target.value } }))} />
                  </div>
                ) : (
                  <input type="number" className="input" style={{ width: 52, padding: '4px', fontSize: 11, textAlign: 'center' }}
                    value={label === 'AC' ? F.ac ?? 10 : F.profBonus ?? 2}
                    onChange={e => setForm(p => ({ ...p, [label === 'AC' ? 'ac' : 'profBonus']: +e.target.value }))} />
                )
              ) : (
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, color }}>{label === 'HP' ? `${F.hp?.current ?? 10}/${F.hp?.max ?? 10}` : label === 'AC' ? F.ac ?? 10 : `+${F.profBonus ?? 2}`}</div>
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
        {['stats', 'skills', 'notes', 'dndbeyond'].map(t => (
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

      {tab === 'skills' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: 640 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Click dot to toggle proficiency</span>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          </div>
          {SKILLS.map((s, i) => {
            const statVal = F.stats?.[s.stat] ?? 10
            const isProficient = profs.includes(s.name)
            const bonus = Math.floor((statVal - 10) / 2) + (isProficient ? (F.profBonus ?? 2) : 0)
            return (
              <div key={s.name} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr 56px',
                alignItems: 'center', gap: 8, padding: '8px 12px',
                borderBottom: i < SKILLS.length - 1 ? '1px solid var(--border)' : 'none',
                background: isProficient ? 'var(--gold-bg)' : 'transparent',
              }}>
                <button onClick={() => toggleProf(s.name)} style={{
                  width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                  background: isProficient ? 'var(--gold)' : 'transparent',
                  border: `2px solid ${isProficient ? 'var(--gold)' : 'var(--border-strong)'}`,
                  transition: 'all .15s', padding: 0,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: isProficient ? 'var(--text)' : 'var(--text-2)' }}>
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{STAT_LABELS[s.stat]}</div>
                </div>
                <div style={{ fontFamily: 'Cinzel, serif', textAlign: 'right', color: bonus >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 13, fontWeight: 600 }}>
                  {bonus >= 0 ? `+${bonus}` : bonus}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card" style={{ padding: 16 }}>
          <textarea className="input" rows={14} style={{ resize: 'vertical', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.7 }}
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
          {F.dndBeyondUrl && <iframe src={F.dndBeyondUrl} title="D&D Beyond" style={{ width: '100%', height: 700, border: 'none', borderRadius: 8 }} sandbox="allow-scripts allow-same-origin" />}
        </div>
      )}
      <ToastContainer />
    </div>
  )
}
