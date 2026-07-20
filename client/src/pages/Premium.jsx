import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../context/AuthContext'

const FEATURES = {
  free: [
    '1 campaign',
    '1 character sheet',
    'Journal entries',
    'Lore board',
    'Storyboard (5 scenes)',
  ],
  premium: [
    'Unlimited campaigns',
    'Unlimited characters',
    'Journal entries',
    'Lore board',
    'Unlimited storyboard scenes',
    'AI story assistant',
    'Priority support',
  ]
}

export default function Premium() {
  const { user, isPremium, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshUser()
      setBanner('🎉 Welcome to Premium! Your account has been upgraded.')
    }
    if (searchParams.get('cancelled') === 'true') {
      setBanner('Payment cancelled. You can upgrade anytime.')
    }
  }, [])

  const checkout = async () => {
    setLoading(true)
    try {
      const { url } = await api('/payments/checkout', { method: 'POST' })
      window.location.href = url
    } catch (e) { alert(e.message) }
    setLoading(false)
  }

  const portal = async () => {
    setPortalLoading(true)
    try {
      const { url } = await api('/payments/portal', { method: 'POST' })
      window.location.href = url
    } catch (e) { alert(e.message) }
    setPortalLoading(false)
  }

  return (
    <div className="page-content">
      {banner && (
        <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: 'var(--gold)' }}>
          {banner}
        </div>
      )}

      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Premium</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Unlock the full Lore &amp; Ledger experience for your campaigns.</p>
        </div>
      </div>

      <div className="page-panel">
        {/* Free */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, marginBottom: 4 }}>Free</div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 20 }}>$0 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>/month</span></div>
          {FEATURES.free.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--green)' }}>✓</span> {f}
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
            {isPremium ? 'Your previous plan' : 'Current plan'}
          </div>
        </div>

        {/* Premium */}
        <div className="card" style={{ padding: 24, border: '2px solid var(--gold-border)', background: 'var(--gold-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16 }}>Premium</div>
            <span style={{ background: 'var(--gold)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>✦ PRO</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>$5 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>/month</span></div>
          {FEATURES.premium.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--text)' }}>
              <span style={{ color: 'var(--gold)' }}>✦</span> {f}
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            {isPremium ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 500, marginBottom: 10 }}>✦ Active — you're on Premium</div>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={portal} disabled={portalLoading}>
                  {portalLoading ? 'Loading...' : 'Manage subscription'}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={checkout} disabled={loading}>
                {loading ? 'Loading...' : 'Upgrade now →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
