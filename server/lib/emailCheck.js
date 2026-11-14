import dns from 'dns/promises'

// Placeholder / throwaway domains that can never receive mail.
const PLACEHOLDER_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'domain.com',
  'email.com', 'user.com', 'localhost', 'invalid',
])
// Well-known disposable / throwaway inbox providers.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  'throwawaymail.com', 'yopmail.com', 'yopmail.net', 'trashmail.com', 'getnada.com', 'nada.email',
  'maildrop.cc', 'dispostable.com', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'emailondeck.com', 'spamgourmet.com', 'tempail.com', 'burnermail.io', 'mailcatch.com',
  'discard.email', 'moakt.com', 'tempinbox.com', 'mytemp.email', 'inboxkitten.com',
])
const RESERVED_TLDS = new Set(['test', 'invalid', 'example', 'localhost', 'local'])

const isListed = (set, domain) => {
  const parts = domain.split('.')
  return parts.some((_, i) => set.has(parts.slice(i).join('.')))
}

// Offline checks only (no DNS): shape, placeholder and disposable domains.
export const emailFormatProblem = (email) => {
  if (typeof email !== 'string' || email.length > 254) return 'Invalid email address'
  const m = /^([^\s@]+)@([^\s@]+\.[^\s@]+)$/.exec(email.trim().toLowerCase())
  if (!m) return 'Invalid email address'
  const [, local, domain] = m
  if (local.length > 64) return 'Invalid email address'
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain.replace(/^xn--/, 'x'))) return 'Invalid email address'
  const tld = domain.split('.').pop()
  if (tld.length < 2) return 'Invalid email address'
  if (isListed(PLACEHOLDER_DOMAINS, domain) || RESERVED_TLDS.has(tld)) return 'Please use a real email address'
  if (isListed(DISPOSABLE_DOMAINS, domain)) return 'Disposable email addresses are not allowed. Please use your real email.'
  return null
}

const LOOKUP_TIMEOUT_MS = 3000

const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), LOOKUP_TIMEOUT_MS)),
])

// Returns an error message when the email's domain clearly cannot receive
// mail, or null when it looks real. Transient DNS failures never block a
// sign-up (fail open) — only a definitive "this domain does not exist".
export const emailDomainProblem = async (email) => {
  const formatProblem = emailFormatProblem(email)
  if (formatProblem) return formatProblem
  const domain = email.split('@')[1].toLowerCase()
  try {
    const mx = await withTimeout(dns.resolveMx(domain))
    if (mx.length) return null
  } catch (e) {
    if (e.code !== 'ENOTFOUND' && e.code !== 'ENODATA') return null
  }
  // No MX records: mail can still be delivered to the domain's A/AAAA host.
  try {
    await withTimeout(dns.lookup(domain))
    return null
  } catch (e) {
    return e.code === 'ENOTFOUND' || e.code === 'ENODATA' ? 'That email domain does not look real' : null
  }
}
