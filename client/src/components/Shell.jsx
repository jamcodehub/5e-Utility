import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useState } from 'react'

const NAV = [
  { to: '/journal',    label: 'Journal',       icon: '📖' },
  { to: '/storyboard', label: 'Storyboard',    icon: '🖼️' },
  { to: '/lore',       label: 'Lore',          icon: '🗺️' },
  { to: '/character',  label: 'Character',     icon: '⚔️' },
  { to: '/spells',     label: 'Spells',        icon: '✦' },
  { to: '/inventory',  label: 'Inventory',     icon: '🎒' },
]

export default function Shell({ children }) {
  const { user, logout } = useAuth()
  const { campaigns, activeCampaign, setActive, createCampaign } = useCampaign()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await createCampaign({ name: newName.trim(), description: '' })
    setNewName(''); setCreating(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>
            Lore &amp; Ledger
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>D&amp;D Companion</div>
        </div>

        {/* Campaign picker */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Campaign</div>
          {campaigns.map(c => (
            <button key={c._id} onClick={() => setActive(c)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent',
              color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)',
              fontSize: 13, fontWeight: activeCampaign?._id === c._id ? 500 : 400,
              cursor: 'pointer', marginBottom: 2,
              borderLeft: activeCampaign?._id === c._id ? '2px solid var(--gold)' : '2px solid transparent',
            }}>{c.name}</button>
          ))}
          {creating
            ? <form onSubmit={handleCreate} style={{ marginTop: 4 }}>
                <input autoFocus className="input" style={{ marginBottom: 4, padding: '6px 8px', fontSize: 12 }}
                  placeholder="Campaign name..." value={newName} onChange={e => setNewName(e.target.value)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Create</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>✕</button>
                </div>
              </form>
            : <button onClick={() => setCreating(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer',
                marginTop: 4,
              }}>+ New campaign</button>
          }
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              background: isActive ? 'var(--surface2)' : 'transparent',
              textDecoration: 'none', transition: 'all .12s',
              borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
            })}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--gold)', flexShrink: 0,
          }}>{user?.username?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>↩</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
