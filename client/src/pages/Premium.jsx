import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../context/AuthContext'
import { AI_ENABLED } from '../utils/features'
import { FREE_JOURNAL_ENTRIES, FREE_MAPS_PER_CAMPAIGN, FREE_CAMPAIGNS } from '../utils/limits'

const label = f => (AI_ENABLED || !/storyboard generation/i.test(f) ? f : `${f} (coming soon)`)

const FEATURES = {
  dm: {
    free: [
      'NPC / World Lore ledger',
      'Character Builder x20',
      'Storyboard generation x10',
      'Idea generator',
      'HP tracker',
      `${FREE_CAMPAIGNS} campaigns, ${FREE_MAPS_PER_CAMPAIGN} battle maps each`,
      'Ready-made campaign: The Salt Road',
    ],
    premium: [
      'Everything in Player Premium',
      'NPC / World Lore ledger',
      'Character Builder — unlimited',
      'Idea generator',
      'HP tracker',
      '5e rules & misc reference page',
      'Unlimited battle maps and campaigns',
      '4 more ready-made campaigns, each with a full session-by-session plan, lore cards and puzzles',
      'Unlimited level building editor',
      'Unlimited storyboard generations',
      '11 exclusive class themes',
    ],
    price: 5,
  },
  player: {
    free: [
      `${FREE_CAMPAIGNS} campaigns`,
      '1 character sheet',
      `${FREE_JOURNAL_ENTRIES} Journal / Session Planner entries per campaign`,
      'Lore board',
    ],
    premium: [
      'Unlimited campaigns',
      'Unlimited characters',
      'Unlimited journal entries',
      'Lore board',
      'Unlimited Roleplay Assistant session plans',
      'Level-up plan regeneration — fresh checklist every time you level',
      'Roleplay plan syncs with DM Campaign Guide',
      '11 exclusive class themes — Bard, Cleric, Fighter, Monk, Ranger, Sorcerer, Warlock, Gunslinger, Artificer, Bloodhunter & Wizard',
    ],
    price: 2,
  },
}

export default function Premium() {
  const { user, isPremium, refreshUser } = useAuth()
  const isDM = user?.role === 'dm'
  const tier = FEATURES[isDM ? 'dm' : 'player']
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [banner, setBanner] = useState('')

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshUser()
      setBanner('Welcome to Premium! Your account has been upgraded.')
    }
    if (searchParams.get('cancelled') === 'true') {
      setBanner('Payment cancelled. You can upgrade anytime.')
    }
  }, [])

  // plan: 'player' or 'dm'. A Player subscriber choosing DM has their subscription switched in place (no Stripe page).
  const checkout = async (plan) => {
    setLoading(true)
    try {
      const r = await api('/payments/checkout', { method: 'POST', body: { plan } })
      if (r.upgraded) { await refreshUser(); setBanner('You are now on DM Premium, which includes Player Premium. The price difference is prorated on your next invoice.') }
      else window.location.href = r.url
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
        <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 3, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: 'var(--gold)' }}>
          {banner}
        </div>
      )}

      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Premium</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Unlock the full &amp; Utility experience for your campaigns.</p>
        </div>
      </div>

      <div className="page-panel">
        {/* Premium */}
        <div className="card" style={{ padding: 24, border: '2px solid var(--gold-border)', background: 'var(--gold-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16 }}>{isDM ? 'Ultimate DM Toolkit' : 'Premium'}</div>
            <span style={{ background: 'var(--gold)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>✦ PRO</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 20, color: 'var(--gold)' }}>${tier.price} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>/month</span></div>
          {tier.premium.map(label).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--text)' }}>
              <span style={{ color: 'var(--gold)' }}>✦</span> {f}
            </div>
          ))}
          <div style={{ marginTop: 20 }}>
            {isPremium ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 500, marginBottom: 10 }}>✦ Active — you're on {user?.premiumRole === 'dm' ? 'DM Premium (includes Player Premium)' : 'Player Premium'}
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={portal} disabled={portalLoading}>
                  {portalLoading ? 'Loading...' : 'Manage subscription'}
                </button>
              </div>
            ) : user?.hasSubscription ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>
                  You have Player Premium, which covers your player account. DM Premium includes it, so upgrading switches your subscription to ${FEATURES.dm.price}/month and only charges the difference.
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }} onClick={() => checkout('dm')} disabled={loading}>
                  {loading ? 'Loading...' : 'Upgrade to DM Premium →'}
                </button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={portal} disabled={portalLoading}>
                  {portalLoading ? 'Loading...' : 'Manage subscription'}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => checkout(isDM ? 'dm' : 'player')} disabled={loading}>
                {loading ? 'Loading...' : 'Upgrade now →'}
              </button>
            )}
          </div>
          {!isDM && user?.premiumRole !== 'dm' && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--gold-border)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Run campaigns too? DM Premium (${FEATURES.dm.price}/month) includes everything in Player Premium. Switch to DM mode in Settings to see it.
            </div>
          )}
        </div>

        {/* Free */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, marginBottom: 4 }}>{isDM ? 'Standard DM Toolkit' : 'Free'}</div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 20 }}>$0 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>/month</span></div>
          {tier.free.map(label).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--green)' }}>✓</span> {f}
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>
            {isPremium ? 'Your previous plan' : 'Current plan'}
          </div>
        </div>
      </div>
    </div>
  )
}
