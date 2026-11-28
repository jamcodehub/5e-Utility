import { useNavigate } from 'react-router-dom'
import { backdropClose } from '../utils/backdrop'

export default function UpgradeModal({ onClose, message }) {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(onClose)}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 22 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Upgrade required</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ marginBottom: 18, color: 'var(--text-2)' }}>{message || 'Free accounts are limited. Upgrade to Premium for unlimited journal entries.'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/premium')}>Upgrade now</button>
          <button className="btn btn-ghost" onClick={onClose}>Maybe later</button>
        </div>
      </div>
    </div>
  )
}
