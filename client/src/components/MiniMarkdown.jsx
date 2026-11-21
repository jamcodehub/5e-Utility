import { Fragment } from 'react'

// Minimal, dependency-free Markdown renderer for SRD text: headings, bullet
// lists, tables, paragraphs, **bold** and *italic*. Renders React nodes only
// (never raw HTML), so content cannot inject markup.

function inline(text) {
  const parts = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g
  let last = 0, m, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) parts.push(<strong key={i++}>{tok.slice(2, -2)}</strong>)
    else parts.push(<em key={i++}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

export default function MiniMarkdown({ text, compact }) {
  const src = Array.isArray(text) ? text.join('\n\n') : (text || '')
  const lines = src.split('\n')
  const out = []
  let i = 0, key = 0
  const body = { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: compact ? '0 0 6px' : '0 0 10px' }

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      const size = h[1].length <= 2 ? 15 : 13
      out.push(<div key={key++} style={{ fontFamily: 'var(--font-title)', fontSize: size, color: 'var(--gold)', margin: '14px 0 6px' }}>{h[2]}</div>)
      i++; continue
    }

    if (line.trim().startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i++ }
      const data = rows.filter(r => !/^[\s|:-]+$/.test(r)).map(cells)
      const [head, ...rest] = data
      out.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '6px 0 12px' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-2)' }}>
            <thead><tr>{head.map((c, j) => <th key={j} style={{ textAlign: 'left', padding: '4px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontWeight: 600 }}>{inline(c)}</th>)}</tr></thead>
            <tbody>{rest.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} style={{ padding: '4px 10px', borderBottom: '1px solid var(--border)' }}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }
      out.push(<ul key={key++} style={{ ...body, paddingLeft: 20 }}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
      continue
    }

    const para = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*[-*]\s+|\s*\|)/.test(lines[i])) { para.push(lines[i]); i++ }
    out.push(<p key={key++} style={body}>{inline(para.join(' '))}</p>)
  }

  return <Fragment>{out}</Fragment>
}
