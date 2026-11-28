import { useState } from 'react'

// The "guide me" path for a homebrew campaign: one question at a time, each answer filling in a box of the Campaign Guide.
// Every question can be skipped, and nothing is sent anywhere until the DM presses Create.
const TONES = ['Heroic', 'Grim', 'Mysterious', 'Whimsical', 'Gritty', 'Epic', 'Spooky', 'Political']

const STEPS = [
  { id: 'world', title: 'What is your world like?', help: 'A sentence or two is plenty. Think of the place the story is set in.',
    fields: [{ key: 'world', label: 'Your world', rows: 3, placeholder: 'A drowned empire where lighthouses are holy and the tide keeps secrets.' }] },
  { id: 'tone', title: 'What should it feel like at the table?', help: 'Pick as many as fit, or write your own.',
    tones: true, fields: [{ key: 'toneNote', label: 'Anything else about the mood (optional)', rows: 2, placeholder: 'Mostly serious, with room for jokes between the scary parts.' }] },
  { id: 'trouble', title: 'What is going wrong?', help: 'The big problem hanging over the world. This is what the story is about.',
    fields: [{ key: 'trouble', label: 'The problem', rows: 3, placeholder: 'The lighthouses are going dark one by one, and every ship that sails past a dark one is lost.' }] },
  { id: 'villain', title: 'Who or what is behind it?', help: 'A villain, a faction or a force of nature, and what they want.',
    fields: [{ key: 'villain', label: 'The opposing force', rows: 3, placeholder: 'The Tide Choir, a cult that thinks the sea is a god and wants the coast returned to it.' }] },
  { id: 'start', title: 'Where does the first session begin?', help: 'The place and the moment the party first comes together.',
    fields: [{ key: 'start', label: 'The opening scene', rows: 3, placeholder: 'A storm drives the party into a harbour town the night its lighthouse fails.' }] },
  { id: 'npc', title: 'Who is the first important person they meet?', help: 'One character is enough to start. Add more later in the Lore page.',
    fields: [{ key: 'npcName', label: 'Name', rows: 1, placeholder: 'Harbour Master Oriel Vane' }, { key: 'npcAbout', label: 'Who they are and what they want', rows: 3, placeholder: 'Worn out and honest. Wants someone to find out why the light failed before the town panics.' }] },
  { id: 'quest', title: 'What is the first job?', help: 'The hook that sends the party on their way. It becomes the first main story quest.',
    fields: [{ key: 'questTitle', label: 'Quest title', rows: 1, placeholder: 'Relight the Gull Rock lighthouse' }, { key: 'questAbout', label: 'What needs doing', rows: 3, placeholder: 'Row out to the rock, find the keeper, and learn what put the lamp out.' }] },
]

// Turns the answers into the Campaign Guide boxes.
export function guideFromAnswers(a) {
  const clean = v => (v || '').trim()
  const tone = [...(a.tones || []), clean(a.toneNote)].filter(Boolean).join('. ')
  const story = [clean(a.trouble), clean(a.villain) && `Behind it: ${clean(a.villain)}`].filter(Boolean).join('\n\n')
  return {
    story,
    currentArc: clean(a.start),
    worldNotes: [clean(a.world), tone && `Tone: ${tone}`].filter(Boolean).join('\n\n'),
    npcs: clean(a.npcName) || clean(a.npcAbout) ? [{ name: clean(a.npcName), description: clean(a.npcAbout) }] : [],
    quests: clean(a.questTitle) || clean(a.questAbout) ? [{ title: clean(a.questTitle), description: clean(a.questAbout) }] : [],
  }
}

const chip = (on) => ({
  padding: '5px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`, background: on ? 'var(--gold-bg)' : 'var(--surface)', color: on ? 'var(--gold)' : 'var(--text-2)',
})

export default function HomebrewWizard({ name, busy, error, onBack, onFinish }) {
  const [step, setStep] = useState(0)
  const [a, setA] = useState({ tones: [] })
  const review = step === STEPS.length
  const cur = STEPS[step]
  const set = (k, v) => setA(p => ({ ...p, [k]: v }))
  const filled = STEPS.filter(s => s.tones ? (a.tones.length || (a.toneNote || '').trim()) : s.fields.some(f => (a[f.key] || '').trim())).length
  const guide = guideFromAnswers(a)

  return (
    <>
      <div style={{ padding: '18px 20px 6px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{name} · {review ? 'Review' : `Question ${step + 1} of ${STEPS.length}`}</div>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--surface2)', marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: `${(step / STEPS.length) * 100}%`, height: '100%', background: 'var(--gold)', transition: 'width .25s ease' }} />
        </div>
        <h2 style={{ fontSize: 20, margin: '14px 0 0' }}>{review ? 'Ready to create' : cur.title}</h2>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{review ? `You answered ${filled} of ${STEPS.length} questions. Everything below goes into your Campaign Guide, where you can keep editing it.` : cur.help}</div>
      </div>

      <div style={{ padding: '10px 20px', overflowY: 'auto', flex: 1 }}>
        {!review && (
          <>
            {cur.tones && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {TONES.map(t => { const on = a.tones.includes(t); return <button type="button" key={t} aria-pressed={on} style={chip(on)} onClick={() => setA(p => ({ ...p, tones: p.tones.includes(t) ? p.tones.filter(x => x !== t) : [...p.tones, t] }))}>{t}</button> })}
              </div>
            )}
            {cur.fields.map((f, i) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>{f.label}</label>
                {f.rows === 1
                  ? <input autoFocus={i === 0 && !cur.tones} className="input" style={{ width: '100%', boxSizing: 'border-box' }} maxLength={120} placeholder={f.placeholder} value={a[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                  : <textarea autoFocus={i === 0 && !cur.tones} className="input" rows={f.rows} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit' }} maxLength={1500} placeholder={f.placeholder} value={a[f.key] || ''} onChange={e => set(f.key, e.target.value)} />}
              </div>
            ))}
          </>
        )}
        {review && (
          <div style={{ display: 'grid', gap: 10 }}>
            {[['Story', guide.story], ['Opening scene', guide.currentArc], ['World notes', guide.worldNotes],
              ['First NPC', guide.npcs[0] && [guide.npcs[0].name, guide.npcs[0].description].filter(Boolean).join(': ')],
              ['First quest', guide.quests[0] && [guide.quests[0].title, guide.quests[0].description].filter(Boolean).join(': ')]].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{k}</div>
                <div style={{ fontSize: 13, color: v ? 'var(--text)' : 'var(--text-3)', marginTop: 3, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{v || 'Left blank. You can fill it in later.'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px 18px' }}>
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!review && <button type="button" className="btn btn-ghost" onClick={() => setStep(step + 1)}>Skip</button>}
            {!review && <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>{step === STEPS.length - 1 ? 'Review' : 'Next'}</button>}
            {review && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onFinish(guide)}>{busy ? 'Creating…' : 'Create campaign'}</button>}
          </div>
        </div>
      </div>
    </>
  )
}
