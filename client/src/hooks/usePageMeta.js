import { useEffect } from 'react'

export const SITE_URL = 'https://5eutility.com'

// Gives a public page its own title, description and canonical address (Google's SEO guide: unique, accurate titles and
// descriptions, one preferred URL per page). The page's values are put back when it unmounts. `noindex` keeps a page,
// such as a password reset, out of search results.
export function usePageMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    const head = document.head
    const find = (sel) => head.querySelector(sel)
    const make = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); head.appendChild(el); return el }
    const undo = []

    const prevTitle = document.title
    if (title) { document.title = title; undo.push(() => { document.title = prevTitle }) }

    const setMeta = (sel, attrs, value) => {
      let el = find(sel), created = false
      if (!el) { el = make('meta', attrs); created = true }
      const prev = el.getAttribute('content')
      el.setAttribute('content', value)
      undo.push(() => { if (created) el.remove(); else el.setAttribute('content', prev ?? '') })
    }
    if (description) setMeta('meta[name="description"]', { name: 'description' }, description)
    if (title) setMeta('meta[property="og:title"]', { property: 'og:title' }, title)
    if (description) setMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    if (path) {
      const url = SITE_URL + path
      setMeta('meta[property="og:url"]', { property: 'og:url' }, url)
      let link = find('link[rel="canonical"]'), created = false
      if (!link) { link = make('link', { rel: 'canonical' }); created = true }
      const prev = link.getAttribute('href')
      link.setAttribute('href', url)
      undo.push(() => { if (created) link.remove(); else link.setAttribute('href', prev ?? '') })
    }
    if (noindex) setMeta('meta[name="robots"]', { name: 'robots' }, 'noindex')

    return () => undo.reverse().forEach(fn => fn())
  }, [title, description, path, noindex])
}
