import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../../hooks/usePageMeta'

export const SITE_NAME = '5e Utility'
export const SITE_URL = 'https://5eutility.com'
// Must be an inbox that is actually monitored; it is shown on both legal pages.
export const CONTACT_EMAIL = 'support@5eutility.com'
export const LAST_UPDATED = '7 November 2026'

const LOGO_URL = 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794483597/5E_UTILITY_Pure_Black_2000.png'
const linkStyle = { color: 'var(--gold)', textDecoration: 'underline' }
const bodyText = { fontSize: 14, lineHeight: 1.75, color: 'var(--text-2)' }

export function Section({ title, children }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 10px' }}>{title}</h2>
      {children}
    </section>
  )
}

export const P = ({ children }) => <p style={{ ...bodyText, margin: '0 0 12px' }}>{children}</p>
export const List = ({ children }) => <ul style={{ ...bodyText, margin: '0 0 12px', paddingLeft: 22 }}>{children}</ul>
export const ExtLink = ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{children}</a>
export const ContactEmail = () => <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>
export const PageLink = ({ to, children }) => <Link to={to} style={linkStyle}>{children}</Link>

// Public, standalone page shell (works logged in or out) for the legal pages.
export default function LegalLayout({ title, children }) {
  usePageMeta({ title: `${title} – ${SITE_NAME}`, description: `${title} for ${SITE_NAME}, the D&D 5e campaign companion.`, path: window.location.pathname })
  useEffect(() => { window.scrollTo(0, 0) }, [title])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link to="/" aria-label={`${SITE_NAME} home`} style={{ display: 'flex' }}>
            <img src={LOGO_URL} alt={SITE_NAME} style={{ height: 44, width: 'auto', filter: 'var(--logo-filter, none)' }} />
          </Link>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>← Back to {SITE_NAME}</Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '36px 20px 24px' }}>
        <h1 style={{ fontSize: 30, color: 'var(--gold)', margin: '0 0 6px' }}>{title}</h1>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Last updated: {LAST_UPDATED}</div>
        <div style={{ marginTop: 22 }}>{children}</div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', marginTop: 24 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 20px 32px', display: 'flex', flexWrap: 'wrap', gap: '8px 18px', fontSize: 12, color: 'var(--text-3)' }}>
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <Link to="/privacy" style={{ color: 'var(--text-2)' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'var(--text-2)' }}>Terms of Service</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--text-2)' }}>{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  )
}
