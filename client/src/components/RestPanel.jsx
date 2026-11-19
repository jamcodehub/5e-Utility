import { abilityMod } from '../utils/rules5e'
import { rollDie } from '../utils/dice'
import { collapseFamilies, featureUses } from '../utils/featureRolls'
import { featuresThrough } from '../utils/rules5e'

const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }

// Limited-use features the character currently has, with their max and recharge.
export function limitedFeatures(char, srd) {
  const level = char.level || 1
  const cls = srd.classes.find(c => c.id === char.srd?.classId)
    || srd.classes.find(c => c.name.toLowerCase() === (char.class || '').trim().toLowerCase())
  if (!cls) return { cls: null, list: [] }
  const ids = [...new Set([...(char.srd?.features || []), ...featuresThrough(cls, char.srd?.subclassId, level)])]
  const feats = collapseFamilies(ids.map(id => ({ id, ...srd.features[id] })).filter(f => f.name))
  const list = feats.map(f => ({ id: f.id, name: f.name, uses: featureUses(f.id, { level, stats: char.stats, classId: cls.id }) })).filter(f => f.uses)
  return { cls, list }
}

export default function RestPanel({ char, srd, roller, onPatch }) {
  const { cls, list } = limitedFeatures(char, srd)
  const level = char.level || 1
  const hp = char.hp || { current: 10, max: 10 }
  const hitDiceUsed = char.srd?.hitDiceUsed || 0
  const diceLeft = Math.max(0, level - hitDiceUsed)
  const conMod = abilityMod(char.stats?.con)
  const featureUsed = char.srd?.featureUsed || {}
  const slots = char.spells?.slotsUsed || {}
  const hasSlotsUsed = Object.values(slots).some(v => v > 0)

  // Short rest: spend a Hit Die, roll it + CON modifier, regain that many HP.
  const spendHitDie = () => {
    if (!cls || diceLeft < 1 || hp.current >= hp.max) return
    const roll = rollDie(cls.hitDie)
    const heal = Math.max(0, roll + conMod)
    const next = Math.min(hp.max, hp.current + heal)
    roller.push({ title: 'Hit Die', lines: [{ label: `d${cls.hitDie} + CON`, total: next - hp.current, detail: `${roll} ${conMod >= 0 ? '+' : '−'} ${Math.abs(conMod)} = ${heal} → HP ${next}/${hp.max}` }] })
    onPatch({ hp: { ...hp, current: next }, srd: { ...(char.srd || {}), hitDiceUsed: hitDiceUsed + 1 } })
  }

  // Features that recharge on a short rest (and Warlock Pact Magic slots).
  const shortRest = () => {
    const keep = Object.fromEntries(Object.entries(featureUsed).filter(([id]) => list.find(f => f.id === id)?.uses.recharge !== 'short'))
    const patch = { srd: { ...(char.srd || {}), featureUsed: keep } }
    if (cls?.id === 'warlock') patch.spells = { ...(char.spells || {}), slotsUsed: {} }
    onPatch(patch)
    roller.push({ title: 'Short rest', lines: [{ label: 'Short-rest features recharged', total: null, detail: cls?.id === 'warlock' ? 'Pact Magic slots restored' : 'Spell slots are not restored' }] })
  }

  // Long rest: full HP, half your Hit Dice back (min 1), all slots and features.
  const longRest = () => {
    const regained = Math.max(1, Math.floor(level / 2))
    onPatch({
      hp: { ...hp, current: hp.max },
      srd: { ...(char.srd || {}), hitDiceUsed: Math.max(0, hitDiceUsed - regained), featureUsed: {} },
      spells: { ...(char.spells || {}), slotsUsed: {} },
      // Temp HP fade, concentration ends, death saves reset; a long rest with food and drink removes one exhaustion level.
      combat: { ...(char.combat || {}), tempHp: 0, concentrating: '', deathSaves: { successes: 0, failures: 0 }, exhaustion: Math.max(0, (char.combat?.exhaustion || 0) - 1) },
    })
    roller.push({ title: 'Long rest', lines: [{ label: 'Fully rested', total: null, detail: `HP ${hp.max}/${hp.max}${char.combat?.exhaustion ? ' · exhaustion −1' : ''} · +${regained} Hit ${regained === 1 ? 'Die' : 'Dice'} · spell slots and features restored` }] })
  }

  return (
    <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={label}>Rest</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
            HP {hp.current}/{hp.max}
            {cls && <> · Hit Dice {diceLeft}/{level} (d{cls.hitDie})</>}
            {hasSlotsUsed && ' · slots spent'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cls && <button className="btn btn-ghost btn-sm" disabled={diceLeft < 1 || hp.current >= hp.max} onClick={spendHitDie} title="Short rest: roll a Hit Die + CON modifier to regain HP">Spend Hit Die</button>}
          <button className="btn btn-ghost btn-sm" onClick={shortRest} title="At least 1 hour. Recharges short-rest features.">Short rest</button>
          <button className="btn btn-primary btn-sm" onClick={longRest} title="At least 8 hours. Restores HP, slots, features and half your Hit Dice.">Long rest</button>
        </div>
      </div>
    </div>
  )
}
