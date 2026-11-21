// Instant, client-side email feedback for the register form. The server does
// the authoritative check (including DNS); this only mirrors the obvious cases
// so people get a clear message before submitting.
const PLACEHOLDER = ['example.com', 'example.org', 'example.net', 'test.com', 'domain.com', 'email.com', 'user.com', 'localhost']
const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'yopmail.com', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com', 'fakeinbox.com']

// Mirrors the server's allowlist (server/lib/emailCheck.js). The server is the authority.
const ALLOWED = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com']

const listed = (list, domain) => list.some(d => domain === d || domain.endsWith('.' + d))

export function emailHint(raw) {
  const email = (raw || '').trim().toLowerCase()
  if (!email) return ''
  const m = /^([^\s@]+)@([^\s@]+\.[^\s@]{2,})$/.exec(email)
  if (!m) return 'Enter a full email address, like name@gmail.com.'
  const domain = m[2]
  if (listed(PLACEHOLDER, domain)) return `“@${domain}” is a placeholder domain. Please use your real email address.`
  if (listed(DISPOSABLE, domain)) return 'Disposable email addresses aren’t allowed. Please use your real email address.'
  if (!ALLOWED.includes(domain)) return 'Please sign up with a Gmail, Outlook or iCloud address, or continue with Google.'
  return ''
}
