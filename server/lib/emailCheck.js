import dns from 'dns/promises'

// Placeholder / throwaway domains that can never receive mail.
const PLACEHOLDER_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'domain.com',
  'email.com', 'user.com', 'localhost', 'invalid',
])
const RESERVED_TLDS = new Set(['test', 'invalid', 'example', 'localhost', 'local'])

const LOOKUP_TIMEOUT_MS = 3000

const withTimeout = (promise) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), LOOKUP_TIMEOUT_MS)),
])

// Returns an error message when the email's domain clearly cannot receive
// mail, or null when it looks real. Transient DNS failures never block a
// sign-up (fail open) — only a definitive "this domain does not exist".
export const emailDomainProblem = async (email) => {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return 'Invalid email address'
  const tld = domain.split('.').pop()
  if (PLACEHOLDER_DOMAINS.has(domain) || RESERVED_TLDS.has(tld)) return 'Please use a real email address'
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
