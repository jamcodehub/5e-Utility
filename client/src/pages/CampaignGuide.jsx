import GuideAssistant from '../components/GuideAssistant'
import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonCampaignGuideContent } from '../components/Skeleton'

const nanoid = () => Math.random().toString(36).slice(2, 9)
const emptyGuide = () => ({ story: '', currentArc: '', lastSession: '', worldNotes: '', npcs: [], quests: [] })

// Maps a screen point to a character index inside a textarea. Browsers don't expose this
// for textareas, so a hidden copy with identical text layout is measured instead.
function indexAtPoint(ta, x, y) {
  const cs = getComputedStyle(ta), box = ta.getBoundingClientRect()
  const mirror = document.createElement('div')
  ;['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing', 'textIndent', 'tabSize',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'boxSizing',
  ].forEach(k => { mirror.style[k] = cs[k] })
  Object.assign(mirror.style, {
    position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`,
    overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'normal',
  })
  const text = ta.value
  mirror.textContent = text
  document.body.appendChild(mirror)
  mirror.scrollTop = ta.scrollTop
  try {
    const node = mirror.firstChild
    if (!node) return 0
    const range = document.createRange()
    let best = text.length, bestDist = Infinity, lineHit = false
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1)
      const r = range.getClientRects()[0]
      if (!r) continue
      if (y < r.top || y > r.bottom) { if (lineHit && y < r.top) break; continue }
      lineHit = true
      // Nearest character edge on the line under the pointer.
      const before = Math.abs(x - r.left), after = Math.abs(x - r.right)
      if (before < bestDist) { bestDist = before; best = i }
      if (after < bestDist && text[i] !== '\n') { bestDist = after; best = i + 1 }
    }
    if (!lineHit) best = y < box.top + parseFloat(cs.paddingTop) ? 0 : text.length
    return best
  } finally { mirror.remove() }
}

// ─── DropTextarea ─────────────────────────────────────────────────────────────
// Desktop: drag a player avatar onto this → inserts their name at drop position.
// Mobile:  tap an avatar to select it, then tap this field → inserts name at cursor.
function DropTextarea({ value, onChange, activePlayer, onInserted, style = {}, rows = 2, placeholder, fill = false }) {
  const [over, setOver] = useState(false)
  const ref = useRef(null)

  const insert = (name, el, at) => {
    const ta = el || ref.current
    if (!ta) return
    const pos = at ?? ta.selectionStart ?? value.length
    const before = value.slice(0, pos), after = value.slice(pos)
    const sep = before && !/\s$/.test(before) ? ' ' : ''
    const tail = after && !/^[\s.,;:!?)]/.test(after) ? ' ' : ''
    const next = before + sep + name + tail + after
    onChange({ target: { value: next } })
    requestAnimationFrame(() => {
      ta.focus()
      const c = pos + sep.length + name.length
      ta.setSelectionRange(c, c)
    })
    onInserted?.()
  }

  return (
    <div style={{ position: 'relative', ...(fill ? { flex: 1, minHeight: 0, display: 'flex' } : {}) }}>
      <textarea
        ref={ref}
        className="input"
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={activePlayer ? `Tap to insert "${activePlayer.name}", or type…` : placeholder}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); const n = e.dataTransfer.getData('text/plain'); if (n) insert(n, e.target, indexAtPoint(e.target, e.clientX, e.clientY)) }}
        onClick={e => { if (activePlayer) insert(activePlayer.name, e.target) }}
        style={{
          width: '100%', resize: 'none', fontSize: 12, lineHeight: 1.55, boxSizing: 'border-box', ...(fill ? { height: '100%', fontSize: 13 } : {}),
          outline: over ? '2px solid var(--gold)' : activePlayer ? '2px dashed rgba(154,124,58,0.45)' : undefined,
          cursor: activePlayer ? 'cell' : undefined,
          ...style,
        }}
      />
      {activePlayer && (
        <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--gold-fill, var(--gold))', color: '#2a1a00', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700, pointerEvents: 'none', lineHeight: 1.6 }}>
          tap → {activePlayer.name}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

function RelationNote() {
  return <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 3 }}>↑ Character Relation — shown in each player's Roleplay Assistant</div>
}

// ─── NpcCard ──────────────────────────────────────────────────────────────────
function NpcCard({ npc, onChange, onRemove, activePlayer, onInserted }) {
  const u = f => e => onChange({ ...npc, [f]: e.target.value })
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={npc.name} onChange={u('name')} placeholder="NPC name" style={{ flex: 1, fontSize: 13, fontWeight: 500 }} />
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>✕</button>
      </div>
      <DropTextarea value={npc.description} onChange={u('description')} rows={2}
        placeholder="Who are they? Role, personality, motives…"
        activePlayer={activePlayer} onInserted={onInserted} />
      <div>
        <DropTextarea value={npc.characterRelation} onChange={u('characterRelation')} rows={2}
          placeholder="How do they personally connect to the characters? History, secrets, hooks, debts?"
          activePlayer={activePlayer} onInserted={onInserted}
          style={{ borderColor: 'var(--gold-border)', background: 'var(--gold-bg)' }} />
        <RelationNote />
      </div>
    </div>
  )
}

// ─── QuestCard ────────────────────────────────────────────────────────────────
function QuestCard({ quest, onChange, onRemove, activePlayer, onInserted }) {
  const u = f => e => onChange({ ...quest, [f]: e.target.value })
  const SC = { active: '#1d6a3a', completed: '#9a7c3a', failed: '#b03030' }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={quest.title} onChange={u('title')} placeholder="Quest title" style={{ flex: 1, fontSize: 13, fontWeight: 500 }} />
        <select value={quest.status} onChange={u('status')} style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', background: 'var(--surface)', color: SC[quest.status], cursor: 'pointer', flexShrink: 0 }}>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>✕</button>
      </div>
      <DropTextarea value={quest.description} onChange={u('description')} rows={2}
        placeholder="What is this quest? Stakes, background, what needs to happen…"
        activePlayer={activePlayer} onInserted={onInserted} />
      <div>
        <DropTextarea value={quest.characterRelation} onChange={u('characterRelation')} rows={2}
          placeholder="How does this connect to specific characters? Whose backstory does it touch, who has the most to lose?"
          activePlayer={activePlayer} onInserted={onInserted}
          style={{ borderColor: 'var(--gold-border)', background: 'var(--gold-bg)' }} />
        <RelationNote />
      </div>
    </div>
  )
}

// ─── Character Reference Modal ────────────────────────────────────────────────
function CharModal({ player, onClose }) {
  const char = player.character
  const Row = ({ label, val }) => val ? (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-title)', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{val}</div>
    </div>
  ) : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card" style={{ padding: '22px 24px', width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'var(--gold-bg)', border: '2px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {char?.avatarUrl
              ? <img src={char.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--gold)', fontWeight: 600 }}>{(char?.name || player.username)?.[0]?.toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600 }}>{char?.name || player.username}</div>
            {char && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{[char.race, char.class, char.level ? `Lvl ${char.level}` : null, char.hp ? `${char.hp.current}/${char.hp.max} HP` : null, char.ac ? `AC ${char.ac}` : null].filter(Boolean).join(' · ')}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{player.username}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 22, padding: 4, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>

        {!char ? (
          <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>This player hasn't created a character sheet yet.</div>
        ) : (
          <>
            {char.stats && Object.values(char.stats).some(Boolean) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, marginBottom: 18 }}>
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(s => {
                  const v = char.stats[s] || 10
                  const m = Math.floor((v - 10) / 2)
                  return (
                    <div key={s} style={{ textAlign: 'center', padding: '5px 2px', border: '1px solid var(--border)', borderRadius: 6 }}>
                      <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase' }}>{s}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-title)' }}>{v}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{m >= 0 ? '+' : ''}{m}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <Row label="Background / Origin"  val={char.background} />
            <Row label="Personality Traits"   val={char.personality} />
            <Row label="Goals & Motivations"  val={char.goals} />
            <Row label="Lore / Secrets"       val={char.lore} />
            {char.notes && <Row label="Notes" val={char.notes} />}
            {!char.background && !char.personality && !char.goals && !char.lore && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7, background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' }}>
                No character depth filled in yet. Ask {player.username} to complete their <strong>Backstory</strong> tab on the Character sheet, or generate a Roleplay Assistant plan — both save this data.
              </div>
            )}
          </>
        )}
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CampaignGuide() {
  const { activeCampaign, campaignsLoading } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()
  const isDM = user?.role === 'dm'

  const [guide, setGuide]         = useState(emptyGuide())
  const [members, setMembers]     = useState([])
  const [activePlayer, setActive] = useState(null)   // { userId, name } | null
  const [charModal, setCharModal] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [guideLoading, setGuideLoading] = useState(true)
  const [dirty, setDirty]         = useState(false)
  const [mobileTab, setMobileTab] = useState('story')
  const [isMobile, setIsMobile]   = useState(window.innerWidth <= 768)
  const didDrag = useRef(false)
  const loadedFor = useRef(null)   // campaign id the guide in state belongs to
  const guideRef = useRef(guide)
  guideRef.current = guide
  const loadSeq = useRef(0)
  const { schedule: scheduleSave, flush: flushSave } = useDebouncedSave(1500)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const load = useCallback(async () => {
    if (!activeCampaign || !isDM) {
      setGuideLoading(false)
      return
    }
    const seq = ++loadSeq.current
    const campaignId = activeCampaign._id
    loadedFor.current = null   // nothing may be saved until this campaign's guide is loaded
    setGuideLoading(true)
    try {
      const [guideData, memberData] = await Promise.all([
        api(`/campaigns/${activeCampaign._id}/guide`).catch(() => ({})),
        api(`/campaigns/${activeCampaign._id}/members/characters`).catch(() => []),
      ])
      if (seq !== loadSeq.current) return
      setGuide({ ...emptyGuide(), ...guideData })
      setMembers(memberData || [])
      setDirty(false)
      loadedFor.current = campaignId
    } finally {
      if (seq === loadSeq.current) setGuideLoading(false)
    }
  }, [activeCampaign?._id, isDM])

  // Save anything pending for the campaign being left before loading the next one.
  useEffect(() => flushSave, [activeCampaign?._id, flushSave])
  useEffect(() => { load() }, [load])

  // Autosave 1.5s after typing stops, always to the campaign the edit was made in.
  useEffect(() => {
    if (!dirty || !activeCampaign || loadedFor.current !== activeCampaign._id) return
    const campaignId = activeCampaign._id, snapshot = guide
    scheduleSave(async () => {
      setSaving(true)
      try {
        await api(`/campaigns/${campaignId}/guide`, { method: 'PUT', body: snapshot })
        if (guideRef.current === snapshot) setDirty(false)
      } catch (_e) { toast('Could not autosave the guide — check your connection') }
      setSaving(false)
    })
  }, [guide, dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const upd = f => e => { setGuide(g => ({ ...g, [f]: e.target.value })); setDirty(true) }
  const clearPlayer = () => setActive(null)

  const addNpc   = () => { setGuide(g => ({ ...g, npcs:   [...g.npcs,   { id: nanoid(), name: '', description: '', characterRelation: '' }] })); setDirty(true) }
  const addQuest = () => { setGuide(g => ({ ...g, quests: [...g.quests, { id: nanoid(), title: '', description: '', status: 'active', characterRelation: '' }] })); setDirty(true) }
  const updNpc   = (id, v) => { setGuide(g => ({ ...g, npcs:   g.npcs.map(n => n.id === id ? v : n) })); setDirty(true) }
  const rmNpc    = id      => { setGuide(g => ({ ...g, npcs:   g.npcs.filter(n => n.id !== id) })); setDirty(true) }
  const updQuest = (id, v) => { setGuide(g => ({ ...g, quests: g.quests.map(q => q.id === id ? v : q) })); setDirty(true) }
  const rmQuest  = id      => { setGuide(g => ({ ...g, quests: g.quests.filter(q => q.id !== id) })); setDirty(true) }

  const save = async () => {
    if (loadedFor.current !== activeCampaign._id) return
    flushSave()
    setSaving(true)
    try {
      await api(`/campaigns/${activeCampaign._id}/guide`, { method: 'PUT', body: guide })
      setDirty(false)
      // Sync named NPCs to Lore board (best-effort, no duplicates)
      const namedNpcs = guide.npcs.filter(n => n.name.trim())
      if (namedNpcs.length > 0) {
        try {
          const existingLore = await api(`/lore/${activeCampaign._id}`)
          const existingNpcTitles = new Set(
            (existingLore || []).filter(e => (e.tags || []).includes('npc')).map(e => e.title)
          )
          for (const npc of namedNpcs) {
            if (!existingNpcTitles.has(npc.name.trim())) {
              await api(`/lore/${activeCampaign._id}`, {
                method: 'POST',
                body: { title: npc.name.trim(), content: npc.description || '', tags: ['npc'] },
              })
            }
          }
        } catch (_e) { /* lore sync is best-effort */ }
      }
      toast('Campaign guide saved ✓')
    } catch (_e) { toast('Failed to save — try again') }
    setSaving(false)
  }

  if (!activeCampaign) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingTop: 16 }}>
      <div style={{ padding: '0 24px', marginBottom: 10, flexShrink: 0 }}>
        <h2 style={{ fontSize: 18, marginBottom: 3 }}>Campaign Guide</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          {isMobile ? "Players' Roleplay Assistant reads this automatically."
            : "Players' Roleplay Assistant reads this automatically. Gold fields personalise each player's session plan."}
        </p>
      </div>
      {campaignsLoading
        ? <SkeletonCampaignGuideContent />
        : <div style={{ color: 'var(--text-3)', padding: '8px 24px' }}>Select a campaign.</div>}
    </div>
  )
  if (!isDM) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexDirection: 'column', gap: 8 }}><div style={{ fontSize: 28 }}>📖</div><div>Only Dungeon Masters can edit the Campaign Guide.</div></div>

  const StorySection = (
    <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 12 } : { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: '1fr', gap: 14, height: '100%' }}>
      {[
        { key: 'story',       label: 'Campaign Story & Setting', rows: 4, ph: "World, tone, stakes.\ne.g. A dying empire fracturing into city-states. Two claimants fight for the throne." },
        { key: 'currentArc',  label: 'Current Story Arc',        rows: 3, ph: "What arc are you in? What is the party trying to achieve right now?" },
        { key: 'lastSession', label: 'Last Session Recap',       rows: 3, ph: "2–4 sentences. Update after every session — feeds directly into each player's continuity hooks." },
        { key: 'worldNotes',  label: 'World Notes',              rows: 3, ph: "Factions, lore, recurring themes, world rules — anything that keeps players immersed." },
      ].map(({ key, label, rows, ph }) => (
        <div key={key} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionLabel>{label}</SectionLabel>
          <DropTextarea value={guide[key]} onChange={upd(key)} rows={rows} placeholder={ph} activePlayer={activePlayer} onInserted={clearPlayer} fill={!isMobile} />
        </div>
      ))}
    </div>
  )

  const NpcsSection = (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionLabel style={{ margin: 0 }}>NPCs</SectionLabel>
        <button className="btn btn-ghost btn-sm" onClick={addNpc}>+ Add NPC</button>
      </div>
      {guide.npcs.length === 0
        ? <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>No NPCs yet. The <span style={{ color: 'var(--gold)' }}>Character Relation</span> field appears directly in each player's session plan.</div>
        : <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 10 } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12, alignItems: 'start' }}>
            {guide.npcs.map(n => <NpcCard key={n.id} npc={n} onChange={v => updNpc(n.id, v)} onRemove={() => rmNpc(n.id)} activePlayer={activePlayer} onInserted={clearPlayer} />)}
          </div>}
      {guide.npcs.length > 0 && (
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 12, opacity: dirty ? 1 : 0.45 }}>
          {saving ? 'Saving…' : dirty ? '✦ Save Guide & Sync to Lore' : 'Saved ✓'}
        </button>
      )}
    </div>
  )

  const QuestsSection = (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionLabel style={{ margin: 0 }}>Quests</SectionLabel>
        <button className="btn btn-ghost btn-sm" onClick={addQuest}>+ Add Quest</button>
      </div>
      {guide.quests.length === 0
        ? <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>No quests yet. The <span style={{ color: 'var(--gold)' }}>Character Relation</span> field ties each quest to a specific character's motivation.</div>
        : <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 10 } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12, alignItems: 'start' }}>
            {guide.quests.map(q => <QuestCard key={q.id} quest={q} onChange={v => updQuest(q.id, v)} onRemove={() => rmQuest(q.id)} activePlayer={activePlayer} onInserted={clearPlayer} />)}
          </div>}
      {guide.quests.length > 0 && (
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 12, opacity: dirty ? 1 : 0.45 }}>
          {saving ? 'Saving…' : dirty ? '✦ Save Guide' : 'Saved ✓'}
        </button>
      )}
    </div>
  )

  const AvatarRow = members.length > 0 && (
    <div style={{ flexShrink: 0, padding: '0 24px 10px', display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {isMobile ? 'Players — tap to select, ⓘ to view:' : 'Players — drag into any field, or click ⓘ to view sheet:'}
      </span>
      {members.map(p => {
        const name = p.character?.name || p.username
        const uid  = String(p.userId)
        const selected = activePlayer?.userId === uid
        return (
          <div key={uid} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative', userSelect: 'none' }}>
            <div
              draggable
              onDragStart={e => {
                didDrag.current = true
                setActive({ userId: uid, name })
                e.dataTransfer.setData('text/plain', name)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onDragEnd={() => { setActive(null); setTimeout(() => { didDrag.current = false }, 40) }}
              onClick={() => {
                if (didDrag.current) return
                // Mobile: tap toggles selection for insert; Desktop: opens modal
                if (isMobile) setActive(selected ? null : { userId: uid, name })
                else setCharModal(p)
              }}
              style={{
                width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                background: 'var(--gold-bg)', border: `2px solid ${selected ? 'var(--gold)' : 'var(--gold-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isMobile ? 'pointer' : 'grab',
                boxShadow: selected ? '0 0 0 3px rgba(154,124,58,0.28)' : 'none',
                transition: 'box-shadow .15s, border-color .15s',
              }}
            >
              {p.character?.avatarUrl
                ? <img src={p.character.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'var(--font-title)', fontSize: 15, color: 'var(--gold)', fontWeight: 600 }}>{name[0]?.toUpperCase()}</span>}
            </div>
            <div style={{ fontSize: 9, color: selected ? 'var(--gold)' : 'var(--text-3)', fontWeight: selected ? 700 : 400, maxWidth: 44, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <button
              onClick={e => { e.stopPropagation(); setCharModal(p) }}
              title="View character sheet"
              style={{ position: 'absolute', top: -2, right: -4, width: 15, height: 15, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}
            >ⓘ</button>
          </div>
        )
      })}
      {activePlayer && isMobile && (
        <button onClick={clearPlayer} style={{ flexShrink: 0, padding: '3px 9px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 20, fontSize: 11, color: 'var(--gold)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ✕ Cancel "{activePlayer.name}"
        </button>
      )}
    </div>
  )

  if (guideLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingTop: 16 }}>
      <div style={{ padding: '0 24px', marginBottom: 10, flexShrink: 0 }}>
        <h2 style={{ fontSize: 18, marginBottom: 3 }}>Campaign Guide</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          {isMobile ? "Players' Roleplay Assistant reads this automatically."
            : "Players' Roleplay Assistant reads this automatically. Gold fields personalise each player's session plan."}
        </p>
      </div>
      <SkeletonCampaignGuideContent />
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden', paddingTop: 16 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 24px', marginBottom: 10, flexShrink: 0, gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 3 }}>Campaign Guide</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {isMobile ? "Players' Roleplay Assistant reads this automatically."
              : "Players' Roleplay Assistant reads this automatically. Gold fields personalise each player's session plan."}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !dirty} style={{ flexShrink: 0, opacity: dirty ? 1 : 0.4, whiteSpace: 'nowrap', marginTop: 2 }}>
          {saving ? 'Saving…' : dirty ? '✦ Save' : 'Saved ✓'}
        </button>
      </div>

      {AvatarRow}

      <div role="tablist" style={{ display: 'flex', gap: 4, padding: isMobile ? '0 16px' : '0 24px', marginBottom: 10, flexShrink: 0 }}>
        {[['story', 'Story & World'], ['npcs', `NPCs${guide.npcs.length ? ` (${guide.npcs.length})` : ''}`], ['quests', `Quests${guide.quests.length ? ` (${guide.quests.length})` : ''}`]].map(([k, lbl]) => (
          <button key={k} role="tab" aria-selected={mobileTab === k} onClick={() => setMobileTab(k)} className={`btn btn-sm ${mobileTab === k ? 'btn-primary' : 'btn-ghost'}`} style={isMobile ? { flex: 1 } : { minWidth: 120 }}>{lbl}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '0 16px 80px' : '0 24px 20px' }}>
        {mobileTab === 'story'  && StorySection}
        {mobileTab === 'npcs'   && NpcsSection}
        {mobileTab === 'quests' && QuestsSection}
      </div>

      {charModal && <CharModal player={charModal} onClose={() => setCharModal(null)} />}
      <ToastContainer />
    </div>
    <GuideAssistant campaignId={activeCampaign._id} />
    </div>
  )
}
