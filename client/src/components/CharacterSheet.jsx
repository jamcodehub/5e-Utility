import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ABILITIES, ABILITY_NAMES, fmtMod, featuresThrough, spellSlots } from '../utils/rules5e'
import { collapseFamilies, featureUses } from '../utils/featureRolls'
import { COINS, FEATS, alwaysPrepared, derive, itemWeight, weaponStats } from '../utils/sheet'

// Printable / shareable character sheet. Always black-on-white so it prints cleanly and
// reads the same for everyone, whatever theme the app is in. Blank boxes are left for
// slots, feature uses, HP and death saves so the sheet can be played with pencil and dice.
const CSS = `
.cs{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;padding:14mm 12mm;max-width:210mm;margin:0 auto;font-size:11px;line-height:1.35}
.cs *{box-sizing:border-box}
.cs h1{font-family:'Young Serif',Georgia,serif;font-size:24px;margin:0}
.cs h2{font-family:'Young Serif',Georgia,serif;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1.5px solid #111;margin:12px 0 5px;padding-bottom:2px}
.cs .row{display:flex;gap:8px;flex-wrap:wrap}
.cs .box{border:1.5px solid #111;border-radius:5px;padding:4px 6px;text-align:center;min-width:62px}
.cs .box b{display:block;font-size:17px;font-family:'Young Serif',Georgia,serif}
.cs .box small{font-size:8px;letter-spacing:.07em;text-transform:uppercase;color:#444}
.cs .cols{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
.cs .cols3{display:grid;grid-template-columns:repeat(3,1fr);gap:0 14px}
.cs .ln{display:flex;justify-content:space-between;gap:6px;border-bottom:1px dotted #aaa;padding:1.5px 0}
.cs .dot{display:inline-block;width:8px;height:8px;border:1.2px solid #111;border-radius:50%;margin-right:4px}
.cs .dot.f{background:#111}
.cs .sq{display:inline-block;width:10px;height:10px;border:1.2px solid #111;margin-right:3px;vertical-align:-1px}
.cs table{width:100%;border-collapse:collapse}
.cs td,.cs th{border-bottom:1px solid #bbb;padding:2px 4px;text-align:left;font-size:10.5px}
.cs th{font-size:9px;text-transform:uppercase;letter-spacing:.06em}
.cs .muted{color:#555}
.cs .pg{break-inside:avoid}
.cs .tag{font-size:8px;border:1px solid #111;border-radius:3px;padding:0 3px;margin-left:3px}
@media print{
  @page{size:A4;margin:0}
  body>*:not(.sheet-portal){display:none!important}
  .sheet-portal{position:static!important;overflow:visible!important;background:#fff!important}
  .sheet-portal .no-print{display:none!important}
  .cs{padding:12mm;max-width:none}
  .cs .pagebreak{break-before:page}
}
`

const Dots = ({ n, filled = 0 }) => Array.from({ length: n }, (_, i) => <span key={i} className={`dot${i < filled ? ' f' : ''}`} />)
const Squares = ({ n }) => Array.from({ length: Math.min(n, 12) }, (_, i) => <span key={i} className="sq" />)
const firstSentence = (desc) => {
  const t = (Array.isArray(desc) ? desc.join(' ') : String(desc || '')).replace(/\s+/g, ' ').trim()
  return t.length > 190 ? `${t.slice(0, 187).replace(/\s+\S*$/, '')}…` : t
}

export function CharacterSheet({ char, srd }) {
  const d = useMemo(() => derive(char, srd), [char, srd])
  const { cls, race, level } = d
  const combat = char.combat || {}
  const hp = char.hp || { current: 10, max: 10 }

  const features = useMemo(() => {
    if (!cls) return []
    const ids = [...new Set([...(char.srd?.features || []), ...featuresThrough(cls, char.srd?.subclassId, level)])]
    return collapseFamilies(ids.map(id => ({ id, ...srd.features[id] })).filter(f => f.name && f.desc && f.name !== 'Ability Score Improvement'))
      .sort((a, b) => (a.level || 0) - (b.level || 0))
  }, [cls, char.srd, level, srd.features])
  const subrace = race?.subraces?.find(s => s.id === char.srd?.subraceId || s.name.toLowerCase() === (char.race || '').toLowerCase())
  const traits = [...(race?.traits || []), ...(subrace?.traits || [])].map(id => ({ id, ...srd.traits[id] })).filter(t => t.name && t.desc)

  const weapons = d.items.filter(i => i.def?.category === 'weapon')
  const spellsById = useMemo(() => Object.fromEntries(srd.spells.map(s => [s.id, s])), [srd.spells])
  const always = alwaysPrepared(char.srd?.subclassId, level)
  const slots = cls?.spellcasting ? spellSlots(cls, level) : {}
  const mySpells = [...(char.spells?.cantrips || []), ...new Set([...(char.spells?.prepared?.length ? char.spells.prepared : char.spells?.known || []), ...always])]
  const spellRows = mySpells.map(id => spellsById[id]).filter(Boolean)
  const langs = (char.srd?.languages || []).map(l => srd.core.languages?.find(x => x.id === l)?.name || l)
  const profList = (char.proficiencies || []).filter(p => !/^skill-|^saving-throw-/.test(p)).map(p => p.replace(/-/g, ' '))

  return (
    <div className="cs">
      <style>{CSS}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <h1>{char.name || 'Unnamed hero'}</h1>
          <div className="muted" style={{ fontSize: 12 }}>
            {[char.race, char.class && `${char.class} ${level}`, char.background].filter(Boolean).join(' · ')}
          </div>
        </div>
        {char.avatarUrl && <img src={char.avatarUrl} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 6, border: '1.5px solid #111' }} />}
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        {ABILITIES.map(a => <div key={a} className="box"><small>{ABILITY_NAMES[a]}</small><b>{fmtMod(d.mod(a))}</b><span style={{ fontSize: 11 }}>{d.stats[a] ?? 10}</span></div>)}
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <div className="box"><small>Armor class</small><b>{char.ac ?? d.ac}</b></div>
        <div className="box"><small>Initiative</small><b>{fmtMod(d.initiative)}</b></div>
        <div className="box"><small>Speed</small><b>{d.baseSpeed} ft</b></div>
        <div className="box"><small>Proficiency</small><b>{fmtMod(d.prof)}</b></div>
        <div className="box"><small>Passive Perc.</small><b>{d.passive}</b></div>
        {d.spellDc != null && <div className="box"><small>Spell DC / atk</small><b>{d.spellDc} / {fmtMod(d.spellAtk)}</b></div>}
        <div className="box"><small>Inspiration</small><b>{combat.inspiration ? '★' : '☐'}</b></div>
      </div>

      <div className="cols" style={{ marginTop: 8 }}>
        <div className="pg">
          <h2>Hit points</h2>
          <div className="row">
            <div className="box"><small>Maximum</small><b>{hp.max}</b></div>
            <div className="box" style={{ minWidth: 90 }}><small>Current</small><b>{hp.current ?? hp.max}</b></div>
            <div className="box" style={{ minWidth: 70 }}><small>Temp</small><b>{combat.tempHp || '\u00a0'}</b></div>
          </div>
          <div style={{ marginTop: 6 }}>Hit Dice: d{cls?.hitDie || '?'} × {level} — <Squares n={level} /></div>
          <div style={{ marginTop: 4 }}>Death saves: Successes <Dots n={3} filled={combat.deathSaves?.successes || 0} /> Failures <Dots n={3} filled={combat.deathSaves?.failures || 0} /></div>
          <div style={{ marginTop: 4 }}>Exhaustion <Dots n={6} filled={combat.exhaustion || 0} />
            {combat.conditions?.length > 0 && <div style={{ marginTop: 2 }}>Conditions: {combat.conditions.map(c => srd.core.conditions.find(x => x.id === c)?.name || c).join(', ')}</div>}
          </div>

          <h2>Saving throws</h2>
          {ABILITIES.map(a => <div key={a} className="ln"><span><span className={`dot${d.saveProf(a) ? ' f' : ''}`} />{ABILITY_NAMES[a]}</span><b>{fmtMod(d.saveMod(a))}</b></div>)}

          <h2>Skills</h2>
          {[...srd.core.skills].sort((a, b) => a.name.localeCompare(b.name)).map(s => (
            <div key={s.id} className="ln"><span><span className={`dot${d.skillProf(s) ? ' f' : ''}`} />{s.name} <span className="muted" style={{ fontSize: 8 }}>{s.ability.toUpperCase()}</span>{d.expertise(s) ? ' ◆' : ''}</span><b>{fmtMod(d.skillMod(s))}</b></div>
          ))}
        </div>

        <div className="pg">
          <h2>Attacks</h2>
          <table>
            <thead><tr><th>Weapon</th><th>Atk</th><th>Damage</th></tr></thead>
            <tbody>
              {weapons.map((w, i) => { const st = weaponStats(w.def, d); return <tr key={i}><td>{w.def.name}{w.def.properties?.length ? <div className="muted" style={{ fontSize: 8.5 }}>{w.def.properties.join(', ')}</div> : null}</td><td>{fmtMod(st.atk)}</td><td>{st.dmg} {st.type}</td></tr> })}
              <tr><td>Unarmed strike</td><td>{fmtMod(d.mod('str') + d.prof)}</td><td>{Math.max(1, 1 + d.mod('str'))} bludgeoning</td></tr>
              {Array.from({ length: Math.max(0, 3 - weapons.length) }, (_, i) => <tr key={`b${i}`}><td>&nbsp;</td><td /><td /></tr>)}
            </tbody>
          </table>

          <h2>Coin</h2>
          <div className="row">{COINS.map(([k]) => <div key={k} className="box" style={{ minWidth: 46 }}><small>{k}</small><b style={{ fontSize: 14 }}>{char.currency?.[k] || '\u00a0'}</b></div>)}</div>

          <h2>Equipment · {Math.round(d.weight * 10) / 10} / {d.capacity} lb</h2>
          {d.items.length ? d.items.map((it, i) => (
            <div key={i} className="ln"><span>{it.equipped ? '◆ ' : ''}{it.custom ? it.name : it.def?.name || it.id}{it.qty > 1 ? ` ×${it.qty}` : ''}{it.attuned ? <span className="tag">attuned</span> : null}</span><span className="muted">{Math.round(itemWeight(it) * 10) / 10 || ''}</span></div>
          )) : <div className="muted">—</div>}
          <div className="muted" style={{ fontSize: 9, marginTop: 3 }}>◆ = equipped / worn. Spare lines:</div>
          {[0, 1, 2].map(i => <div key={i} className="ln">&nbsp;</div>)}

          {(profList.length > 0 || langs.length > 0) && (<>
            <h2>Proficiencies & languages</h2>
            {profList.length > 0 && <div style={{ textTransform: 'capitalize' }}>{profList.join(', ')}</div>}
            {langs.length > 0 && <div style={{ marginTop: 3 }}><b>Languages:</b> {langs.join(', ')}</div>}
          </>)}
        </div>
      </div>

      <div className="pagebreak" />
      <div className="cols" style={{ marginTop: 8 }}>
        <div>
          <h2>{cls ? `${cls.name} features` : 'Features'}</h2>
          {features.map(f => {
            const uses = featureUses(f.id, { level, stats: d.stats, classId: cls?.id })
            return (
              <div key={f.id} className="pg" style={{ marginBottom: 4 }}>
                <b>{f.name}</b> <span className="muted">Lv {f.level}</span>
                {uses && <span style={{ marginLeft: 6 }}><Squares n={uses.max} /><span className="muted" style={{ fontSize: 8 }}>{uses.recharge === 'short' ? 'short/long' : 'long'}</span></span>}
                <div className="muted">{firstSentence(f.desc)}</div>
              </div>
            )
          })}
          {!features.length && <div className="muted">—</div>}
        </div>
        <div>
          {(char.srd?.feats || []).filter(id => FEATS[id]).map(id => <div key={id} className="pg" style={{ marginTop: 6 }}><b>Feat: {FEATS[id].name}</b><div className="muted">{firstSentence(FEATS[id].desc.slice(1))}</div></div>)}
          {traits.length > 0 && (<>
            <h2>{subrace?.name || race?.name} traits</h2>
            {traits.map(t => <div key={t.id} className="pg" style={{ marginBottom: 4 }}><b>{t.name}</b><div className="muted">{firstSentence(t.desc)}</div></div>)}
          </>)}
          {(char.personality || char.background) && (<>
            <h2>Personality</h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{[char.personality].filter(Boolean).join('\n')}</div>
          </>)}
          {char.companions?.length > 0 && (<>
            <h2>Companions</h2>
            {char.companions.map(c => <div key={c.id} className="ln"><span>{c.name}</span><span>AC {c.ac} · HP {c.hp?.max}</span></div>)}
          </>)}
        </div>
      </div>

      {cls?.spellcasting && (
        <div className="pg">
          <h2>Spells · {cls.spellcasting.ability.toUpperCase()} · DC {d.spellDc} · attack {fmtMod(d.spellAtk)}</h2>
          {Object.keys(slots).length > 0 && (
            <div className="row" style={{ marginBottom: 6 }}>
              {Object.entries(slots).map(([l, n]) => <div key={l}><b>Lv {l}</b> <Squares n={n} /></div>)}
            </div>
          )}
          <table>
            <thead><tr><th>Spell</th><th>Lv</th><th>Time</th><th>Range</th><th>Duration</th><th>Notes</th></tr></thead>
            <tbody>
              {[...spellRows].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map(s => (
                <tr key={s.id}>
                  <td>{s.name}{always.includes(s.id) ? ' ★' : ''}</td><td>{s.level || 'C'}</td><td>{s.castingTime}</td><td>{s.range}</td><td>{s.duration}</td>
                  <td>{[s.concentration && 'Conc.', s.ritual && 'Ritual', s.damage?.type && `${s.damage.type} dmg`, s.save?.ability && `${s.save.ability.toUpperCase()} save`].filter(Boolean).join(', ')}</td>
                </tr>
              ))}
              {Array.from({ length: 4 }, (_, i) => <tr key={`b${i}`}><td>&nbsp;</td><td /><td /><td /><td /><td /></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <div className="muted" style={{ fontSize: 8, marginTop: 14 }}>
        Rules content from the SRD 5.1 © Wizards of the Coast LLC, licensed under CC BY 4.0. Sheet made with 5e Utility.
      </div>
    </div>
  )
}

// Full-screen preview with a Print button; the print stylesheet hides the rest of the app.
export function PrintOverlay({ char, srd, onClose }) {
  return createPortal(
    <div className="sheet-portal" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#e9e6df', overflowY: 'auto' }}>
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 10, background: '#1c1a17', color: '#ddd', fontSize: 12 }}>
        <span>Print preview · black &amp; white, A4 / Letter, 2 pages</span>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Print / save as PDF</button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
      <CharacterSheet char={char} srd={srd} />
    </div>,
    document.body,
  )
}
