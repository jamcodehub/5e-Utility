import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const pollinationsUrl = (prompt) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(`fantasy dnd scene, ${prompt}, detailed illustration, dramatic lighting, high quality`)}?width=640&height=400&nologo=true&seed=${Math.floor(Math.random()*9999)}`

export default function Storyboard() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [cards, setCards] = useState([])
  const [prompt, setPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [chat, setChat] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/storyboard/${activeCampaign._id}`)
    setCards(data)
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    if (!prompt.trim() || !activeCampaign) return
    setGenerating(true)
    const imageUrl = pollinationsUrl(prompt)
    // Preload the image
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

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim(); setChatInput('')
    setChat(p => [...p, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 400,
          system: `You are a creative D&D storytelling assistant. Help the user craft vivid scene descriptions for their campaign storyboard. Keep responses concise and evocative. When the user describes a scene, suggest a great image prompt for it too, formatted as: IMAGE PROMPT: <prompt>`,
          messages: [...chat.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: userMsg }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'No response'
      setChat(p => [...p, { role: 'assistant', text }])
      // Auto-fill prompt if AI suggested one
      const match = text.match(/IMAGE PROMPT:\s*(.+)/i)
      if (match) setPrompt(match[1].trim())
    } catch { setChat(p => [...p, { role: 'assistant', text: 'Failed to get a response.' }]) }
    setChatLoading(false)
  }

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select a campaign first.
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Gallery */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>Storyboard</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{cards.length} scenes</span>
        </div>

        {/* Generate form */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input className="input" placeholder="Scene title" value={title} onChange={e => setTitle(e.target.value)} style={{ width: 200 }} />
            <input className="input" placeholder="Describe the scene to generate an image..." value={prompt} onChange={e => setPrompt(e.target.value)} style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && generate()} />
            <button className="btn btn-gold" onClick={generate} disabled={generating || !prompt.trim()}>
              {generating ? '...' : '✦ Generate'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Tip: Use the AI chat → to describe your story and get image prompt suggestions.
          </div>
        </div>

        {/* Cards grid */}
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
      </div>

      {/* AI Chat sidebar */}
      <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600 }}>Story Assistant</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Describe your story — get image prompts</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!chat.length && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Tell me what happened in your last session. I'll help you write a scene description and suggest an image prompt.
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6,
              background: m.role === 'user' ? 'var(--gold-bg)' : 'var(--surface2)',
              color: 'var(--text)', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%', border: `1px solid ${m.role === 'user' ? 'var(--gold-border)' : 'var(--border)'}`,
            }}>{m.text}</div>
          ))}
          {chatLoading && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Writing...</div>}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <textarea
            className="input" rows={2}
            style={{ flex: 1, resize: 'none', fontSize: 12, padding: '7px 10px' }}
            placeholder="Describe your story..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
          />
          <button className="btn btn-primary btn-sm" onClick={sendChat} disabled={chatLoading} style={{ alignSelf: 'flex-end' }}>↑</button>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
