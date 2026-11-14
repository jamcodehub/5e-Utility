import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CharacterSheet } from '../components/CharacterSheet'
import { loadSrdMany } from '../utils/srd'

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

// Public, read-only view of a character shared by its owner (no login needed).
export default function SharedSheet() {
  const { token } = useParams()
  const [char, setChar] = useState(null)
  const [srd, setSrd] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    fetch(`${API}/shared/character/${encodeURIComponent(token)}`)
      .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Sheet not found'); return j })
      .then(c => live && setChar(c))
      .catch(e => live && setError(e.message))
    loadSrdMany('core', 'classes', 'races', 'traits', 'features', 'equipment', 'spells').then(d => live && setSrd(d))
    return () => { live = false }
  }, [token])

  const shell = { minHeight: '100vh', background: '#e9e6df' }
  if (error) return <div style={{ ...shell, display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', color: '#333' }}>{error}</div>
  if (!char || !srd) return <div style={{ ...shell, display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', color: '#666' }}>Loading sheet…</div>
  return (
    <div className="sheet-portal" style={shell}>
      <div className="no-print" style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', padding: 10, background: '#1c1a17', color: '#ddd', fontSize: 12 }}>
        <span>Shared character sheet (read-only)</span>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Print / save as PDF</button>
      </div>
      <CharacterSheet char={char} srd={srd} />
    </div>
  )
}
