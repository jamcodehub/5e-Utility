// Visuals for the Premium slides on the landing page.
const THEME_SHOTS = [
  { id: 'monk', label: 'Monk' }, { id: 'sorcerer', label: 'Sorcerer' },
  { id: 'fighter', label: 'Fighter' }, { id: 'bloodhunter', label: 'Bloodhunter' },
]

// The same page in four class themes. Light and Dark stay free; the class themes come with Premium.
export function ThemeMontage() {
  return (
    <div className="theme-montage">
      {THEME_SHOTS.map(t => (
        <figure key={t.id}>
          <img src={`/showcase/theme-${t.id}.jpg`} alt={`The 5e rules reference in the ${t.label} class theme`} loading="lazy" />
          <figcaption>{t.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

// What the free plan includes and what Premium lifts, taken from the limits the app really enforces.
const ROWS = [
  ['Battle maps', '5 per campaign', 'Unlimited'],
  ['DM boards', '1 board', 'Unlimited, with folders'],
  ['Music tracks', '5 tracks', 'Unlimited'],
  ['Campaigns (players)', '1 campaign', 'Unlimited'],
  ['Journal entries', '15 entries', 'Unlimited'],
  ['Themes', 'Light and Dark', 'Every class theme'],
]

export function PlanTable() {
  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <thead><tr><th scope="col"><span className="sr-only">Feature</span></th><th scope="col">Free</th><th scope="col">Premium</th></tr></thead>
        <tbody>
          {ROWS.map(([name, free, premium]) => (
            <tr key={name}><th scope="row">{name}</th><td>{free}</td><td>{premium}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
