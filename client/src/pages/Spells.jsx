import { alwaysPrepared } from '../utils/sheet'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { api } from '../context/AuthContext'
import {
  ABILITY_NAMES, abilityMod, fmtMod, spellSlots, cantripsKnown, maxSpellLevel, spellMode, spellbookLimit,
  preparedLimit, spellsKnownFixed, spellSaveDc, spellAttackBonus, spellRollSpec,
} from '../utils/rules5e'
import MiniMarkdown from '../components/MiniMarkdown'

const levelName = (n) => (n === 0 ? 'Cantrip' : `Level ${n}`)
const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }
const Chip = ({ children }) => (
  <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-2)', marginRight: 6, marginBottom: 6 }}>{children}</span>
)

function SpellDetail({ spell, children }) {
  return (
    <>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: 'var(--gold)', marginBottom: 4 }}>{spell.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
        {levelName(spell.level)} {spell.school}{spell.ritual ? ' (ritual)' : ''}
      </div>
      <div style={{ marginBottom: 10 }}>
        <Chip>{spell.castingTime}</Chip><Chip>Range: {spell.range}</Chip>
        <Chip>{spell.components?.join(', ')}</Chip><Chip>{spell.concentration ? 'Concentration, ' : ''}{spell.duration}</Chip>
        {spell.save && <Chip>{ABILITY_NAMES[spell.save.ability]} save</Chip>}
        {spell.attackType && <Chip>{spell.attackType} spell attack</Chip>}
      </div>
      {spell.material && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>Material: {spell.material}</div>}
      <MiniMarkdown text={spell.desc} />
      {spell.higher?.length > 0 && (<><div style={label}>At higher levels</div><MiniMarkdown text={spell.higher} /></>)}
      <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 0' }}>Classes: {spell.classes.map(c => c[0].toUpperCase() + c.slice(1)).join(', ')}</div>
      {children}
    </>
  )
}

// ── Spell browser ───────────────────────────────────────────────────────────
export function SpellBrowser({ srd, renderActions, lockClass }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [cls, setCls] = useState(lockClass || 'all')
  const [school, setSchool] = useState('all')
  const [selected, setSelected] = useState(null)

  const schools = useMemo(() => [...new Set(srd.spells.map(s => s.school))].sort(), [srd])
  const filtered = useMemo(() => srd.spells.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
    && (level === 'all' || s.level === Number(level))
    && (cls === 'all' || s.classes.includes(cls))
    && (school === 'all' || s.school === school)
  ), [srd, query, level, cls, school])
  const current = srd.spells.find(s => s.id === selected) || filtered[0]

  const select = { padding: '6px 8px', fontSize: 12 }
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 280, flexShrink: 0, maxWidth: '100%' }}>
        <input className="input" placeholder="Search spells…" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <select className="input" style={{ ...select, flex: 1 }} value={level} onChange={e => setLevel(e.target.value)} aria-label="Spell level">
            <option value="all">Any level</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{levelName(n)}</option>)}
          </select>
          <select className="input" style={{ ...select, flex: 1 }} value={cls} onChange={e => setCls(e.target.value)} aria-label="Class">
            <option value="all">Any class</option>
            {srd.classes.filter(c => c.spellcasting).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" style={{ ...select, flex: 1 }} value={school} onChange={e => setSchool(e.target.value)} aria-label="School">
            <option value="all">Any school</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{filtered.length} spell{filtered.length === 1 ? '' : 's'}</div>
        <div className="card" style={{ maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 8, background: current?.id === s.id ? 'var(--gold-bg)' : 'transparent', color: current?.id === s.id ? 'var(--gold)' : 'var(--text-2)' }}>
              <span>{s.name}</span><span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.level === 0 ? 'C' : s.level}</span>
            </div>
          ))}
          {!filtered.length && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-3)' }}>No matching spells.</div>}
        </div>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 280, padding: 20 }}>
        {current ? <SpellDetail spell={current}>{renderActions?.(current)}</SpellDetail> : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nothing selected.</div>}
      </div>
    </div>
  )
}

function SpellRow({ spell, open, setOpen, action }) {
  const isOpen = open === spell.id
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div onClick={() => setOpen(isOpen ? null : spell.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{spell.name}{spell.concentration && <span title="Concentration" style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>C</span>}{spell.ritual && <span title="Ritual" style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>R</span>}{spell.always && <span title="Always prepared" style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 6 }}>★</span>}</span>
        {action}
      </div>
      {isOpen && <div style={{ padding: '4px 0 10px' }}><SpellDetail spell={spell} /></div>}
    </div>
  )
}

// ── Player spellbook ────────────────────────────────────────────────────────
// Standalone (picks its own character) or embedded in the Character page (`character` + `onSpellsChange`)
export function Spellbook({ srd, campaignId, toast, roller, character, onSpellsChange, concentrating, onConcentrate }) {
  const embedded = !!character
  const [fetchedChars, setChars] = useState(null)
  const [pickedId, setCharId] = useState(null)
  const chars = embedded ? [character] : fetchedChars
  const charId = embedded ? character._id : pickedId
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(false)
  const [castLevel, setCastLevel] = useState({})

  useEffect(() => {
    if (embedded) return undefined
    let live = true
    setChars(null)
    api(`/campaigns/${campaignId}/characters`).then(list => {
      if (!live) return
      setChars(list)
      const caster = list.find(c => srd.classes.find(k => k.id === c.srd?.classId)?.spellcasting)
      setCharId((caster || list.find(c => c.isPrimary) || list[0])?._id || null)
    }).catch(() => live && setChars([]))
    return () => { live = false }
  }, [campaignId, srd, embedded])

  const char = chars?.find(c => c._id === charId)
  const cls = srd.classes.find(c => c.id === char?.srd?.classId)
    || srd.classes.find(c => c.name.toLowerCase() === (char?.class || '').trim().toLowerCase())
  const spells = char?.spells || {}
  const slotsUsed = spells.slotsUsed || {}

  const save = useCallback(async (nextSpells) => {
    if (embedded) { onSpellsChange(nextSpells); return }
    setChars(cs => cs.map(c => c._id === charId ? { ...c, spells: nextSpells } : c))
    try {
      await api(`/campaigns/${campaignId}/characters/${charId}`, { method: 'PUT', body: { spells: nextSpells } })
    } catch (e) { toast(e.message || 'Could not save spells') }
  }, [campaignId, charId, toast, embedded, onSpellsChange])

  if (!chars) return <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
  if (!chars.length) return <div className="card" style={{ padding: 20, fontSize: 13, color: 'var(--text-2)' }}>Create a character first — then you can manage spells here.</div>

  const picker = embedded ? null : (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
      {chars.map(c => (
        <div key={c._id} onClick={() => { setCharId(c._id); setAdding(false) }}
          style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 500, background: charId === c._id ? 'var(--gold-bg)' : 'var(--surface2)', color: charId === c._id ? 'var(--gold)' : 'var(--text-2)', border: `1px solid ${charId === c._id ? 'var(--gold-border)' : 'var(--border)'}` }}>
          {c.name || 'Unnamed Hero'}
        </div>
      ))}
    </div>
  )
  const note = (msg) => <>{picker}<div className="card" style={{ padding: 20, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{msg}</div></>

  if (!cls) return note('This character wasn\'t built with the guided creator, and its class doesn\'t match an SRD class, so there\'s nothing to read spell slots from. Set the class (e.g. Wizard) and level on the Character page.')
  if (!cls.spellcasting) return note(`${cls.name}s don't cast spells.`)

  const level = char.level || 1
  const ability = cls.spellcasting.ability
  const castMod = abilityMod(char.stats?.[ability])
  const prof = char.profBonus || 2
  const mode = spellMode(cls.id)
  const slots = spellSlots(cls, level)
  const topLevel = maxSpellLevel(cls, level)
  const byId = Object.fromEntries(srd.spells.map(s => [s.id, s]))

  const cantripLimit = cantripsKnown(cls, level)
  const known = spells.known || []
  const prepared = spells.prepared || []
  const cantrips = spells.cantrips || []
  const knownLimit = mode === 'spellbook' ? spellbookLimit(level) : mode === 'known' ? spellsKnownFixed(cls, level) : 0
  const prepLimit = mode === 'known' ? 0 : preparedLimit(cls.id, level, castMod)

  const toggle = (field, id, limit, limitName) => {
    const list = spells[field] || []
    if (list.includes(id)) return save({ ...spells, [field]: list.filter(x => x !== id) })
    if (limit && list.length >= limit) { toast(`You can only have ${limit} ${limitName}.`); return }
    save({ ...spells, [field]: [...list, id] })
  }

  const adjustSlot = (lvl, i) => {
    const used = slotsUsed[lvl] || 0
    save({ ...spells, slotsUsed: { ...slotsUsed, [lvl]: i < used ? i : i + 1 } })
  }
  const longRest = () => save({ ...spells, slotsUsed: {} })

  // Domain / oath spells are always prepared and don't count against the preparation limit
  const always = alwaysPrepared(char.srd?.subclassId, level).filter(id => byId[id])
  const active = [...new Set([...(mode === 'known' ? known : prepared), ...always])].map(id => ({ ...byId[id], always: always.includes(id) && !prepared.includes(id) && mode !== 'known' })).filter(s => s.id)
  const ritualBook = mode === 'spellbook' ? known.filter(id => byId[id]?.ritual && !prepared.includes(id)).map(id => byId[id]) : []
  const activeByLevel = (lvl) => active.filter(s => s.level === lvl)

  const cast = (spell) => {
    const lvl = castLevel[spell.id] || spell.level
    const used = slotsUsed[lvl] || 0
    if (!slots[lvl] || used >= slots[lvl]) { toast(`No level ${lvl} slots left.`); return }
    save({ ...spells, slotsUsed: { ...slotsUsed, [lvl]: used + 1 } })
    startConcentration(spell)
    if (!rollFor(spell, lvl)) toast(`Cast ${spell.name}${lvl > spell.level ? ` at level ${lvl}` : ''}.`)
  }

  // Casting a concentration spell ends the previous one (SRD)
  function startConcentration(spell) {
    if (!spell.concentration || !onConcentrate) return
    if (concentrating && concentrating !== spell.name) toast(`You stop concentrating on ${concentrating}.`)
    onConcentrate(spell.name)
  }
  const castRitual = (spell) => {
    startConcentration(spell)
    toast(`Cast ${spell.name} as a ritual: takes 10 minutes longer, no spell slot used.`)
  }

  // Rolls attack / damage / healing for the spell and shows it in the roll panel; false when there is nothing to roll
  function rollFor(spell, lvl) {
    const spec = spellRollSpec(spell, { slotLevel: lvl, charLevel: level, castMod, attackBonus: spellAttackBonus(prof, castMod), dc: spellSaveDc(prof, castMod) })
    if (!spec) return false
    roller.rollSpell(spell.name, spec)
    return true
  }

  const pickerActions = (spell) => {
    if (!spell.classes.includes(cls.id)) return <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>{cls.name}s can't learn this spell.</div>
    if (spell.level > topLevel) return <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>Above the spell levels you can cast yet.</div>
    if (spell.level === 0) {
      return <button className="btn btn-primary btn-sm" onClick={() => toggle('cantrips', spell.id, cantripLimit, 'cantrips')}>{cantrips.includes(spell.id) ? 'Forget cantrip' : `Learn cantrip (${cantrips.length}/${cantripLimit})`}</button>
    }
    if (mode === 'known') {
      return <button className="btn btn-primary btn-sm" onClick={() => toggle('known', spell.id, knownLimit, 'known spells')}>{known.includes(spell.id) ? 'Forget spell' : `Learn spell (${known.length}/${knownLimit})`}</button>
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {mode === 'spellbook' && (
          <button className="btn btn-ghost btn-sm" onClick={() => toggle('known', spell.id, knownLimit, 'spellbook spells')}>
            {known.includes(spell.id) ? 'Remove from spellbook' : `Add to spellbook (${known.length}/${knownLimit})`}
          </button>
        )}
        {(mode === 'prepare-all' || known.includes(spell.id)) && (
          <button className="btn btn-primary btn-sm" onClick={() => toggle('prepared', spell.id, prepLimit, 'prepared spells')}>
            {prepared.includes(spell.id) ? 'Unprepare' : `Prepare (${prepared.length}/${prepLimit})`}
          </button>
        )}
      </div>
    )
  }

  if (adding) {
    return (
      <>
        {picker}
        <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)} style={{ marginBottom: 12 }}>← Back to my spells</button>
        <SpellBrowser key={cls.id} srd={srd} lockClass={cls.id} renderActions={pickerActions} />
      </>
    )
  }

  return (
    <>
      {picker}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div style={label}>Class</div><div style={{ fontSize: 14 }}>{cls.name} {level}</div></div>
        <div><div style={label}>Casting ability</div><div style={{ fontSize: 14 }}>{ABILITY_NAMES[ability]} ({fmtMod(castMod)})</div></div>
        <div><div style={label}>Spell save DC</div><div style={{ fontSize: 14 }}>{spellSaveDc(prof, castMod)}</div></div>
        <div><div style={label}>Spell attack</div><div style={{ fontSize: 14 }}>{fmtMod(spellAttackBonus(prof, castMod))}</div></div>
        <div style={{ flex: 1 }} />
        {!embedded && <button className="btn btn-ghost btn-sm" onClick={longRest}>Long rest</button>}
      </div>

      {Object.keys(slots).length > 0 && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={label}>{cls.id === 'warlock' ? 'Pact magic slots' : 'Spell slots'}</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {Object.entries(slots).map(([lvl, total]) => (
              <div key={lvl}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Level {lvl}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: total }, (_, i) => {
                    const spent = i < (slotsUsed[lvl] || 0)
                    return (
                      <button key={i} onClick={() => adjustSlot(lvl, i)} aria-label={`Level ${lvl} slot ${i + 1} ${spent ? 'used' : 'available'}`}
                        style={{ width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', padding: 0, border: '2px solid var(--gold)', background: spent ? 'transparent' : 'var(--gold)' }} />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={label}>
            My spells
            {cantripLimit > 0 && ` · ${cantrips.length}/${cantripLimit} cantrips`}
            {mode === 'known' ? ` · ${known.length}/${knownLimit} known` : ` · ${prepared.length}/${prepLimit} prepared`}
            {always.length > 0 && ` · ${always.length} always prepared`}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>Add / change spells</button>
        </div>
        {cantrips.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Cantrips (cast at will)</div>
            {cantrips.map(id => byId[id] && <SpellRow key={id} spell={byId[id]} open={open} setOpen={setOpen}
              action={
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>At will</span>
                  {spellRollSpec(byId[id], { slotLevel: 0, charLevel: level, castMod, attackBonus: 0, dc: 0 }) && (
                    <button className="btn btn-primary btn-sm" onClick={() => rollFor(byId[id], 0)}>🎲 Roll</button>
                  )}
                </span>} />)}
          </div>
        )}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => activeByLevel(l).length).map(lvl => (
          <div key={lvl} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Level {lvl}</div>
            {activeByLevel(lvl).map(s => (
              <SpellRow key={s.id} spell={s} open={open} setOpen={setOpen}
                action={
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <select className="input" style={{ padding: '2px 4px', fontSize: 11, width: 64 }} value={castLevel[s.id] || s.level}
                      onChange={e => setCastLevel(p => ({ ...p, [s.id]: Number(e.target.value) }))} aria-label={`Cast ${s.name} at slot level`}>
                      {Object.keys(slots).map(Number).filter(n => n >= s.level).map(n => <option key={n} value={n}>Lv {n}</option>)}
                    </select>
                    {s.ritual && <button className="btn btn-ghost btn-sm" onClick={() => castRitual(s)} title="Ritual: +10 minutes, no slot">Ritual</button>}
                    <button className="btn btn-primary btn-sm" onClick={() => cast(s)}>Cast</button>
                  </span>
                } />
            ))}
          </div>
        ))}
        {!cantrips.length && !active.length && (
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No spells yet. Use "Add / change spells" to choose your cantrips and {mode === 'known' ? 'known spells' : 'prepared spells'}.</div>
        )}
      </div>

      {mode === 'spellbook' && known.length > 0 && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={label}>Spellbook · {known.length}/{knownLimit}</div>
          <div>{known.map(id => byId[id] && <Chip key={id}>{byId[id].name}</Chip>)}</div>
          {ritualBook.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Ritual spells you can cast straight from your spellbook</div>
              {ritualBook.map(sp => <SpellRow key={sp.id} spell={sp} open={open} setOpen={setOpen} action={<button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); castRitual(sp) }}>Ritual</button>} />)}
            </div>
          )}
        </div>
      )}
    </>
  )
}
