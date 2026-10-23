import { useState, useEffect, useCallback, useRef } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'
import UpgradeModal from '../components/UpgradeModal'
import CustomCharacterBuilder from '../components/CustomCharacterBuilder'
import CharacterActions from '../components/CharacterActions'
import RestPanel from '../components/RestPanel'
import CombatPanel from '../components/CombatPanel'
import GearTab from '../components/GearTab'
import { InventoryPanel } from './Inventory'
import { PrintOverlay } from '../components/CharacterSheet'
import { derive } from '../utils/sheet'
import { useRoller, RollPanel } from '../components/RollPanel'
import { loadSrdMany } from '../utils/srd'
import { SkeletonCharacterPage } from '../components/Skeleton'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'
import { thumbnail } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'

const CLOUD_NAME = 'crcbzpw6' //cloud id

function getOptimisedUrl(cloudinaryUrl, width = null) {
  if (!cloudinaryUrl) return ''
  const afterUpload = cloudinaryUrl.replace(/^.*\/upload\/(?:v\d+\/)?/, '')
  const publicId = afterUpload.replace(/\.[^.]+$/, '')
  if (!publicId) return cloudinaryUrl
  let img = new CloudinaryImage(publicId, { cloudName: CLOUD_NAME })
    .delivery(quality(autoQuality()))
    .delivery(format(autoFormat()))
  if (width) img = img.resize(thumbnail().width(width).height(width).gravity(autoGravity()))
  return img.toURL()
}

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
  background: '', personality: '', goals: '', lore: '',
}

// Remembers which character was last open per campaign (per browser), so
// returning to the Character page shows that character again instead of
// always resetting to the primary one.
const lastCharKey = (campaignId) => `lastChar:${campaignId}`
const recallLastChar = (campaignId) => { try { return localStorage.getItem(lastCharKey(campaignId)) } catch { return null } }
const rememberLastChar = (campaignId, charId) => { try { localStorage.setItem(lastCharKey(campaignId), charId) } catch { /* ignore */ } }

export default function Character() {
  const { activeCampaign, setActive, campaigns } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()
  const [tab, setTab]       = useState('actions')
  const [characters, setCharacters] = useState([])
  const [activeCharId, setActiveCharId] = useState(null)
  const [char, setChar]     = useState(null)
  const [form, setForm]     = useState(DEFAULT)
  const [editing, setEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [builder, setBuilder] = useState(null) // null | 'custom'
  const roller = useRoller()
  const [srdData, setSrdData] = useState(null)
  const [printing, setPrinting] = useState(false)
  const [sharing, setSharing] = useState(false)

  // Rules data is only fetched once the Actions / Gear tabs are opened
  useEffect(() => {
    if ((tab === 'actions' || tab === 'gear' || printing || sharing) && !srdData) {
      loadSrdMany('core', 'classes', 'races', 'traits', 'features', 'equipment', 'spells').then(setSrdData).catch(() => toast('Could not load the rules data'))
    }
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const FREE_CHAR_LIMIT = 2
  const atCharLimit = !isPremium && characters.length >= FREE_CHAR_LIMIT

  // Loads every character this player owns in the active campaign, then
  // selects the primary one (or the first) as the active sheet.
  const load = useCallback(async () => {
    if (!activeCampaign) return
    const list = await api(`/campaigns/${activeCampaign._id}/characters`)
    setCharacters(list)
    const rememberedId = recallLastChar(activeCampaign._id)
    const chosen = (rememberedId && list.find(c => c._id === rememberedId)) || list.find(c => c.isPrimary) || list[0] || null
    setActiveCharId(chosen?._id || null)
    if (chosen) { setChar(chosen); setForm(chosen); setAvatarPreview(chosen.avatarUrl || ''); rememberLastChar(activeCampaign._id, chosen._id) }
    else { setChar(null); setForm(DEFAULT); setAvatarPreview('') }
    setLoaded(true)
  }, [activeCampaign])

  useEffect(() => { if (!activeCampaign) return; setLoaded(false); load() }, [activeCampaign, load])

  const selectCharacter = (c) => {
    setActiveCharId(c._id)
    setChar(c)
    setForm(c)
    setAvatarPreview(c.avatarUrl || '')
    setEditing(false)
    if (activeCampaign) rememberLastChar(activeCampaign._id, c._id)
  }

  const [creatorNew, setCreatorNew] = useState(false) // creator launched from "+ New Character"
  const openNewChooser = () => {
    if (!activeCampaign) return
    if (atCharLimit) { setShowUpgrade(true); return }
    setCreatorNew(true)
    setBuilder('custom')
  }

  const deleteCharacter = async (c, e) => {
    e.stopPropagation()
    if (characters.length <= 1) { toast('You must have at least one character sheet.'); return }
    if (!window.confirm(`Delete "${c.name || 'Unnamed Hero'}"? This cannot be undone.`)) return
    try {
      await api(`/campaigns/${activeCampaign._id}/characters/${c._id}`, { method: 'DELETE' })
      const remaining = characters.filter(x => x._id !== c._id)
      setCharacters(remaining)
      if (activeCharId === c._id) selectCharacter(remaining[0])
      toast('Character deleted')
    } catch (err) { toast(err.message || 'Could not delete character') }
  }

  // Persist a creator / level-up result onto the active sheet
  const applyBuild = async (campaignId, patch) => {
    // The level-up flow passes only a patch; the creator also passes a target campaign
    if (typeof campaignId === 'object') { patch = campaignId; campaignId = activeCampaign._id }
    try {
      let updated
      if (campaignId === activeCampaign._id && activeCharIdRef.current && !creatorNew) {
        updated = await api(`/campaigns/${campaignId}/characters/${activeCharIdRef.current}`, { method: 'PUT', body: { ...form, ...patch } })
        setCharacters(p => p.map(c => c._id === updated._id ? updated : c))
      } else {
        updated = await api(`/campaigns/${campaignId}/characters`, { method: 'POST', body: { ...(campaignId === activeCampaign._id && !creatorNew ? form : DEFAULT), ...patch } })
        if (campaignId === activeCampaign._id) {
          setCharacters(p => [...p, updated])
          setActiveCharId(updated._id)
        } else {
          setBuilder(null)
          setActive(campaigns.find(c => c._id === campaignId))
          toast('Character created in that campaign')
          return
        }
      }
      if (creatorNew) selectCharacter(updated); else { setChar(updated); setForm(updated) }
      setBuilder(null); setCreatorNew(false)
      toast('Character updated')
    } catch (e) {
      if (e?.status === 403) { setShowUpgrade(true); return }
      toast(e.message || 'Save failed')
    }
  }

  const [avatarUploading, setAvatarUploading] = useState(false)

  const activeCharIdRef = useRef(null)
  activeCharIdRef.current = activeCharId

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
      let updated
      if (activeCharIdRef.current) {
        updated = await api(`/campaigns/${activeCampaign._id}/characters/${activeCharIdRef.current}`, { method: 'PUT', body: form })
        setCharacters(p => p.map(c => c._id === updated._id ? updated : c))
      } else {
        updated = await api(`/campaigns/${activeCampaign._id}/characters`, { method: 'POST', body: form })
        setCharacters(p => [...p, updated])
        setActiveCharId(updated._id)
      }
      setChar(updated); setForm(updated); setEditing(false); toast('Character saved')
    } catch (e) {
      if (e?.status === 403) { setShowUpgrade(true); return }
      toast(e.message || 'Save failed')
    }
  }

  const hpSaveTimer = useRef(null)
  const adjustHp = (delta) => {
    setForm(p => {
      const max = p.hp?.max ?? 10
      const current = p.hp?.current ?? 10
      const next = Math.max(0, Math.min(max, current + delta))
      const nextForm = { ...p, hp: { current: next, max } }
      if (activeCampaign && activeCharIdRef.current) {
        clearTimeout(hpSaveTimer.current)
        hpSaveTimer.current = setTimeout(async () => {
          try {
            const updated = await api(`/campaigns/${activeCampaign._id}/characters/${activeCharIdRef.current}`, { method: 'PUT', body: nextForm })
            setChar(updated)
            setCharacters(p => p.map(c => c._id === updated._id ? updated : c))
          } catch { toast('Could not save HP change') }
        }, 400)
      }
      return nextForm
    })
  }

  // Saves a partial update (spell slots, carried weapons…) without touching unsaved sheet edits
  const setShare = async (enabled) => {
    try {
      const r = await api(`/campaigns/${activeCampaign._id}/characters/${activeCharIdRef.current}/share`, { method: 'POST', body: { enabled } })
      const patch = { shareToken: r.shareToken || undefined }
      setChar(c => (c ? { ...c, ...patch } : c))
      setCharacters(p => p.map(c => (c._id === activeCharIdRef.current ? { ...c, ...patch } : c)))
    } catch (e) { toast(e.message || 'Could not update sharing') }
  }

  const patchChar = useCallback(async (patch) => {
    const id = activeCharIdRef.current
    if (!activeCampaign || !id) return
    setChar(c => (c ? { ...c, ...patch } : c))
    setForm(f => ({ ...f, ...patch }))
    setCharacters(p => p.map(c => (c._id === id ? { ...c, ...patch } : c)))
    try {
      await api(`/campaigns/${activeCampaign._id}/characters/${id}`, { method: 'PUT', body: patch })
    } catch (e) { toast(e.message || 'Could not save') }
  }, [activeCampaign]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave for free-text fields (notes + backstory tabs) — debounced 800ms
  // after typing stops, so nothing is lost if the user navigates away or the
  // browser closes without clicking Save.
  const [autosaveStatus, setAutosaveStatus] = useState('') // '' | 'saving' | 'saved'
  const textSaveTimer = useRef(null)
  const scheduleTextAutosave = useCallback((nextForm) => {
    if (!activeCampaign || !activeCharIdRef.current) return
    clearTimeout(textSaveTimer.current)
    setAutosaveStatus('saving')
    textSaveTimer.current = setTimeout(async () => {
      try {
        const updated = await api(`/campaigns/${activeCampaign._id}/characters/${activeCharIdRef.current}`, { method: 'PUT', body: nextForm })
        setChar(updated)
        setCharacters(p => p.map(c => c._id === updated._id ? updated : c))
        setAutosaveStatus('saved')
      } catch { setAutosaveStatus(''); toast('Could not autosave') }
    }, 800)
  }, [activeCampaign])

  const setTextField = (field) => (e) => {
    const value = e.target.value
    setForm(p => {
      const next = { ...p, [field]: value }
      scheduleTextAutosave(next)
      return next
    })
  }

  // Flush pending autosave on unmount
  useEffect(() => () => { if (textSaveTimer.current) clearTimeout(textSaveTimer.current) }, [])

  const F = form

  if (!activeCampaign) return (
    <div className="page-content">
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>My Characters</h2>
      <div style={{ color: 'var(--text-3)' }}>Select a campaign.</div>
    </div>
  )
  if (!loaded) return <SkeletonCharacterPage />

  return (
    <div className="page-content">
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>My Characters</h2>
      {/* Character switcher — up to 2 free / unlimited premium per campaign */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {characters.map(c => (
          <div key={c._id}
            onClick={() => selectCharacter(c)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
              fontSize: 12, fontWeight: 500,
              background: activeCharId === c._id ? 'var(--gold-bg)' : 'var(--surface2)',
              color: activeCharId === c._id ? 'var(--gold)' : 'var(--text-2)',
              border: `1px solid ${activeCharId === c._id ? 'var(--gold-border)' : 'var(--border)'}`,
            }}>
            <span>{c.name || 'Unnamed Hero'}</span>
            {characters.length > 1 && (
              <span onClick={(e) => deleteCharacter(c, e)} title="Delete character" style={{ opacity: 0.6, fontSize: 11 }}>✕</span>
            )}
          </div>
        ))}
        <button
          onClick={openNewChooser}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 12, opacity: atCharLimit ? 0.7 : 1 }}
        >
          {atCharLimit ? `✦ ${characters.length}/${FREE_CHAR_LIMIT}` : '+ New Character'}
        </button>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--gold-bg)', border: '2px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {avatarPreview ? <img src={getOptimisedUrl(avatarPreview, 112)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '𖥔'}
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
            : <>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
                {char && <button className="btn btn-ghost btn-sm" onClick={() => setPrinting(true)} title="Printable sheet for playing without a device">Print</button>}
                {char && <button className="btn btn-ghost btn-sm" onClick={() => setSharing(true)}>Share</button>}
              </>}
        </div>
      </div>

      {/* Onboarding banner for new players */}
      {loaded && !form.name && (
        <div style={{ padding: '12px 16px', marginBottom: 12, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
          <strong>Welcome!</strong> Click <strong>Edit</strong> to set up your character. Your DM and the Roleplay Assistant both read this sheet — the more you fill in, the better your session plans become.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {['stats', 'actions', 'gear', 'inventory', 'backstory', 'notes'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {(tab === 'actions' || tab === 'gear') && (
        !char ? <div className="card" style={{ padding: 20, fontSize: 13, color: 'var(--text-2)' }}>Save your character first, then your actions will show up here.</div>
        : !srdData ? <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading rules…</div>
        : tab === 'actions'
          ? <><RestPanel char={char} srd={srdData} roller={roller} onPatch={patchChar} /><CombatPanel char={char} srd={srdData} d={derive(char, srdData)} roller={roller} onPatch={patchChar} /><CharacterActions char={char} srd={srdData} roller={roller} onPatch={patchChar} /></>
          : <GearTab char={char} srd={srdData} d={derive(char, srdData)} onPatch={patchChar} />
      )}
      {tab === 'inventory' && <InventoryPanel toast={toast} />}
      {tab === 'actions' && char && <RollPanel roller={roller} />}

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

      {tab === 'backstory' && (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, lineHeight: 1.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Your DM can see this in their Campaign Guide. The Roleplay Assistant uses it to personalise your session plans.</span>
            <span style={{ fontSize: 11, color: autosaveStatus === 'saving' ? 'var(--text-3)' : 'var(--green)', flexShrink: 0, marginLeft: 8 }}>
              {autosaveStatus === 'saving' ? 'Saving…' : autosaveStatus === 'saved' ? 'Saved' : ''}
            </span>
          </div>
          {[['background', 'Background / Origin', "Where did you come from? What shaped you before the campaign?"], ['personality', 'Personality Traits', "How do you speak, carry yourself, treat others? Key quirks and mannerisms."], ['goals', 'Goals & Motivations', "What does your character want — short and long term?"], ['lore', 'Lore / Secrets / Backstory', "Secrets, fears, obligations, scars — anything that drives or haunts you."]].map(([field, label, ph]) => (
            <div key={field}>
              <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>{label}</label>
              <textarea className="input" rows={3} style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
                placeholder={ph} value={F[field] || ''}
                onChange={setTextField(field)} />
            </div>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: autosaveStatus === 'saving' ? 'var(--text-3)' : 'var(--green)' }}>
              {autosaveStatus === 'saving' ? 'Saving…' : autosaveStatus === 'saved' ? 'Saved' : ''}
            </span>
          </div>
          <textarea className="input" rows={editing ? 10 : 14} style={{ resize: 'vertical', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.7 }}
            placeholder="Character notes, backstory, personality traits, bonds, flaws..."
            value={F.notes || ''} onChange={setTextField('notes')} />
        </div>
      )}

      {printing && srdData && char && <PrintOverlay char={char} srd={srdData} onClose={() => setPrinting(false)} />}
      {printing && !srdData && <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.5)', color: '#fff', display: 'grid', placeItems: 'center' }}>Preparing sheet…</div>}
      {sharing && char && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSharing(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: 'var(--gold)', marginBottom: 8 }}>Share {char.name || 'this character'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>Anyone with the link can view a read-only sheet and print it, even without an account. Your notes, lore and goals are never shared.</div>
            {char.shareToken ? (
              <>
                <input className="input" readOnly value={`${window.location.origin}/s/${char.shareToken}`} onFocus={e => e.target.select()} style={{ fontSize: 12, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/s/${char.shareToken}`).then(() => toast('Link copied'))}>Copy link</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShare(false)}>Stop sharing</button>
                </div>
              </>
            ) : <button className="btn btn-primary btn-sm" onClick={() => setShare(true)}>Create share link</button>}
            <div style={{ marginTop: 14 }}><button className="btn btn-ghost btn-sm" onClick={() => setSharing(false)}>Close</button></div>
          </div>
        </div>
      )}
      <ToastContainer />
      {builder === 'custom' && <CustomCharacterBuilder onClose={() => { setBuilder(null); setCreatorNew(false) }} onComplete={applyBuild} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} message={`Free accounts are limited to ${FREE_CHAR_LIMIT} characters per campaign. Upgrade to Premium for unlimited characters.`} />}
    </div>
  )
}
