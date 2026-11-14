import { useCallback, useState } from 'react'
import { rollD20, rollDice, signed } from '../utils/dice'

const d20Line = (label, r) => ({
  label,
  total: r.total,
  detail: `${r.values.length > 1 ? `[${r.values.join(', ')}] → ${r.chosen}` : r.chosen}${r.mod ? ` ${signed(r.mod)}` : ''}`,
  tone: r.nat20 ? 'crit' : r.nat1 ? 'fumble' : '',
  note: r.nat20 ? 'Natural 20!' : r.nat1 ? 'Natural 1' : '',
})
const diceLine = (label, r, type) => ({
  label: `${label}${type ? ` (${type})` : ''}`,
  total: r.total,
  detail: `${r.dice.map(d => `${d.sign < 0 ? '-' : ''}${d.values.length}d${d.sides}[${d.values.join(', ')}]`).join(' + ')}${r.flat ? ` ${signed(r.flat)}` : ''}`,
  tone: r.crit ? 'crit' : '',
  note: r.crit ? 'Critical: dice doubled' : '',
})

// Shared roller: owns the roll history and the advantage mode. Pages render <RollPanel roller={…} />
// and can pass the roller down so several tabs share one history.
export function useRoller() {
  const [history, setHistory] = useState([])
  const [mode, setMode] = useState('normal')
  const [open, setOpen] = useState(true)

  const push = useCallback((entry) => {
    setHistory(h => [{ id: `${Date.now()}-${Math.random()}`, ...entry }, ...h].slice(0, 20))
    setOpen(true)
  }, [])

  const rollCheck = useCallback((title, mod, opts = {}) => {
    const r = rollD20({ mod, mode: opts.mode || mode })
    push({ title, lines: [d20Line(opts.label || 'd20', r)] })
    return r
  }, [mode, push])

  const rollExpr = useCallback((title, expr, opts = {}) => {
    const r = rollDice(expr, opts)
    if (!r) return null
    push({ title, lines: [diceLine(opts.label || 'Roll', r, opts.type)] })
    return r
  }, [push])

  // Attack roll plus damage (dice double on a natural 20; a natural 1 skips damage)
  const rollAttack = useCallback((title, attackMod, damage, opts = {}) => {
    const atk = rollD20({ mod: attackMod, mode: opts.mode || mode })
    const lines = [d20Line('Attack', atk)]
    if (damage?.expr && !atk.nat1) {
      const dmg = rollDice(damage.expr, { crit: atk.nat20 })
      if (dmg) lines.push(diceLine('Damage', dmg, damage.type))
    }
    push({ title, subtitle: opts.subtitle, lines })
    return atk
  }, [mode, push])

  // Spell: optional attack roll, optional save DC note, damage and/or healing
  const rollSpell = useCallback((title, { attackMod, saveText, damage, heal, subtitle }, opts = {}) => {
    const lines = []
    let crit = false
    let dmgExpr = damage
    if (attackMod != null) {
      const atk = rollD20({ mod: attackMod, mode: opts.mode || mode })
      lines.push(d20Line('Spell attack', atk))
      crit = atk.nat20
      if (atk.nat1) dmgExpr = null
    }
    if (saveText) lines.push({ label: 'Saving throw', total: null, detail: saveText })
    if (dmgExpr?.expr) {
      const dmg = rollDice(dmgExpr.expr, { crit })
      if (dmg) lines.push(diceLine('Damage', dmg, dmgExpr.type))
    }
    if (heal) {
      const h = rollDice(heal)
      if (h) lines.push(diceLine('Healing', h))
    }
    push({ title, subtitle, lines })
  }, [mode, push])

  return { history, mode, setMode, open, setOpen, push, rollCheck, rollExpr, rollAttack, rollSpell, clear: () => setHistory([]) }
}

const toneColor = (tone) => (tone === 'crit' ? 'var(--green)' : tone === 'fumble' ? 'var(--red)' : 'var(--gold)')

export function RollPanel({ roller }) {
  const { history, mode, setMode, open, setOpen, clear } = roller
  const [first, ...rest] = history
  const modes = [['normal', 'Normal'], ['adv', 'Adv'], ['dis', 'Dis']]

  if (!open) {
    return (
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 900, boxShadow: 'var(--shadow-md)' }}>
        🎲 Rolls{history.length ? ` (${history.length})` : ''}
      </button>
    )
  }

  return (
    <div className="card" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 900, width: 300, maxWidth: 'calc(100vw - 32px)', padding: 12, boxShadow: 'var(--shadow-md)' }} role="log" aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {modes.map(([m, t]) => (
            <button key={m} onClick={() => setMode(m)} title={m === 'adv' ? 'Roll d20 twice, keep highest' : m === 'dis' ? 'Roll d20 twice, keep lowest' : 'Single d20'}
              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 999, cursor: 'pointer', border: `1px solid ${mode === m ? 'var(--gold-border)' : 'var(--border)'}`, background: mode === m ? 'var(--gold-bg)' : 'var(--surface2)', color: mode === m ? 'var(--gold)' : 'var(--text-2)' }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {history.length > 0 && <button onClick={clear} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-3)', cursor: 'pointer' }}>Clear</button>}
          <button onClick={() => setOpen(false)} aria-label="Hide rolls" style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--text-2)', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {!first && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '6px 0' }}>Roll something — checks, attacks and spells all land here.</div>}

      {first && (
        <div key={first.id} style={{ marginBottom: rest.length ? 10 : 0, animation: 'toastIn .2s ease' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{first.title}{first.subtitle ? <span style={{ fontWeight: 400, color: 'var(--text-3)' }}> · {first.subtitle}</span> : null}</div>
          {first.lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: l.total == null ? 14 : 28, fontWeight: 600, color: toneColor(l.tone), minWidth: 44 }}>{l.total == null ? '—' : l.total}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
                <div style={{ color: 'var(--text-2)', fontSize: 12 }}>{l.label}{l.note ? ` · ${l.note}` : ''}</div>
                <div>{l.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, maxHeight: 130, overflowY: 'auto' }}>
          {rest.map(h => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-3)', padding: '2px 0' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{h.lines.filter(l => l.total != null).map(l => l.total).join(' / ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
