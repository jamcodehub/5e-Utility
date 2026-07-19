import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const pollinationsUrl = (prompt) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(`fantasy dnd scene, ${prompt}, detailed illustration, dramatic lighting, high quality`)}?width=640&height=400&nologo=true&seed=${Math.floor(Math.random() * 9999)}`

export default function Storyboard() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [cards, setCards]           = useState([])
  const [prompt, setPrompt]         = useState('')
  const [title, setTitle]           = useState('')
  const [generating, setGenerating] = useState(false)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setCards(await api(`/storyboard/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    if (!prompt.trim() || !activeCampaign) return
    setGenerating(true)
    const imageUrl = pollinationsUrl(prompt)
    await new Promise(resolve => { const img = new Image(); img.onload = img.onerror = resolve; img.src = imageUrl })
    try {
      const card = await api(`/storyboard/${activeCampaign._id}`, {
        method: 'POST',
        body: { title: title || 'Scene', description: prompt, prompt, imageUrl }
      })
      setCards(p => [card, ...p])
      setPrompt(''); setTitle('')
      toast('Scene generated')
    } catch { toast('Failed to save scene') }
    setGenerating(false)
  }

  const deleteCard = async (id) => {
    await api(`/storyboard/${id}`, { method: 'DELETE' })
    setCards(p => p.filter(c => c._id !== id))
    toast('Removed')
  }

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select a campaign first.
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18 }}>Storyboard</h2>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{cards.length} scenes</span>
      </div>

      {/* Generate form */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <input className="input" placeholder="Scene title" value={title} onChange={e => setTitle(e.target.value)} style={{ width: 180 }} />
          <input
            className="input" placeholder="Describe the scene to generate an image..."
            value={prompt} onChange={e => setPrompt(e.target.value)}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
          <button className="btn btn-gold" onClick={generate} disabled={generating || !prompt.trim()}>
            {generating ? 'Generating...' : '✦ Generate'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          Describe a moment from your campaign — a location, battle, or story beat.
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {cards.map(card => (
          <div key={card._id} className="card" style={{ overflow: 'hidden' }}>
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.title}
                style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }}
                onError={e => e.target.style.display = 'none'} />
            )}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600 }}>{card.title}</div>
                <button onClick={() => deleteCard(card._id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.5 }}>{card.description}</div>
            </div>
          </div>
        ))}
        {!cards.length && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)', padding: 40, fontSize: 13 }}>
            No scenes yet. Describe a moment above to generate the first one.
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}
