import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function LevelBuilder() {
  const { activeCampaign } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()
  const [plans, setPlans] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setPlans(await api(`/levels/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!title.trim() || !activeCampaign) return
    setError('')
    try {
      const plan = await api(`/levels/${activeCampaign._id}`, { method: 'POST', body: { title, content } })
      setPlans(p => [...p, plan])
      setTitle(''); setContent('')
      toast('Level plan added')
    } catch (e) { setError(e.message || 'Failed to save') }
  }

  const remove = async (id) => {
    await api(`/levels/${id}`, { method: 'DELETE' })
    setPlans(p => p.filter(x => x._id !== id))
  }

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Level Builder</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
            Plan out encounters and milestones. {!isPremium && `(${plans.length}/5 free plans used)`}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20, maxWidth: 640 }}>
        <input className="input" placeholder="Level/encounter title" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8 }} />
        <textarea className="input" rows={4} placeholder="Encounter details, enemies, terrain, rewards..." value={content} onChange={e => setContent(e.target.value)} style={{ resize: 'vertical', marginBottom: 8 }} />
        {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{error}</div>}
        <button className="btn btn-primary btn-sm" onClick={add} disabled={!title.trim()}>+ Add plan</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
        {plans.map(p => (
          <div key={p._id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14 }}>{p.title}</div>
              <button onClick={() => remove(p._id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
            {p.content && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, whiteSpace: 'pre-wrap' }}>{p.content}</div>}
          </div>
        ))}
        {plans.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No level plans yet.</div>}
      </div>
      <ToastContainer />
    </div>
  )
}
