// Converts between the Markdown text the journal is stored as (**bold**, *italic*, "- " bullets) and the live,
// formatted text the editor shows. The saved text stays plain Markdown, so older entries open correctly.
const BLOCK = /^(DIV|P|UL|OL|LI|H[1-6])$/
const TOKEN = /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*|(?<!\w)_[^_\n]+_(?!\w))/g

// Text is flattened into runs of one look (bold / italic / both) and each run gets its own marks, so mixed formatting
// always saves unambiguously: **bold**, *italic* and ***both***. Marks wrap the words, never the spaces around them.
const mark = (s, b, i) => {
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/)
  if (!m[2] || (!b && !i)) return s
  const q = b && i ? '***' : b ? '**' : '*'
  return `${m[1]}${q}${m[2]}${q}${m[3]}`
}

const runs = (n, b = false, i = false, out = []) => {
  if (n.nodeType === 3) { out.push({ t: n.nodeValue.replace(/\u00a0/g, ' '), b, i }); return out }
  if (n.nodeType !== 1) return out
  if (n.nodeName === 'BR') { out.push({ t: '\n', b: false, i: false }); return out }
  const st = n.style || {}
  const weight = parseInt(st.fontWeight, 10)
  const nb = b || /^(B|STRONG)$/.test(n.nodeName) || st.fontWeight === 'bold' || weight >= 600
  const ni = i || /^(I|EM)$/.test(n.nodeName) || st.fontStyle === 'italic'
  for (const c of n.childNodes) runs(c, nb, ni, out)
  return out
}

const inline = (n) => {
  const merged = []
  for (const r of runs(n)) {
    const last = merged[merged.length - 1]
    if (last && last.b === r.b && last.i === r.i) last.t += r.t; else merged.push({ ...r })
  }
  return merged.map(r => mark(r.t, r.b, r.i)).join('')
}

export function toMarkdown(root) {
  const lines = []
  let cur = null
  const push = () => { if (cur !== null) { lines.push(cur); cur = null } }
  const walk = (parent) => {
    for (const n of parent.childNodes) {
      if (n.nodeType === 1 && BLOCK.test(n.nodeName)) {
        push()
        if (n.nodeName === 'UL' || n.nodeName === 'OL') for (const li of n.children) lines.push(`- ${inline(li).replace(/\n$/, '')}`)
        else if ([...n.childNodes].some(c => c.nodeType === 1 && BLOCK.test(c.nodeName))) walk(n)
        else lines.push(inline(n).replace(/\n$/, ''))
      } else if (n.nodeName === 'BR') {
        lines.push(cur ?? ''); cur = null
      } else cur = (cur ?? '') + inline(n)
    }
    push()
  }
  walk(root)
  return lines.join('\n')
}

const addInline = (parent, text) => {
  let last = 0, m
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)))
    const tok = m[0]
    const both = tok.startsWith('***'), strong = !both && tok.startsWith('**')
    const el = document.createElement(both || strong ? 'b' : 'i')
    const word = both ? tok.slice(3, -3) : strong ? tok.slice(2, -2) : tok.slice(1, -1)
    if (both) { const inner = document.createElement('i'); inner.textContent = word; el.appendChild(inner) } else el.textContent = word
    parent.appendChild(el)
    last = m.index + tok.length
  }
  if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)))
}

export function fillFromMarkdown(root, md) {
  root.textContent = ''
  const lines = String(md || '').split('\n')
  let list = null
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      if (!list) { list = document.createElement('ul'); root.appendChild(list) }
      const li = document.createElement('li'); addInline(li, bullet[1]); list.appendChild(li)
      continue
    }
    list = null
    const div = document.createElement('div')
    if (line) addInline(div, line); else div.appendChild(document.createElement('br'))
    root.appendChild(div)
  }
}
