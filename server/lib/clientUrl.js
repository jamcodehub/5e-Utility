// CLIENT_URL may hold several comma-separated site addresses, e.g.
//   https://www.5eutility.com,https://5eutility.com,https://5e-utility.netlify.app
// Every one of them may call the API from a browser (CORS). The FIRST is the
// canonical address used when we build links (password-reset emails, Stripe
// redirects). Entries are trimmed and a trailing slash is ignored, since
// browsers send origins without one.
//
// Read at call time on purpose: dotenv.config() runs after modules are imported.
const parse = () =>
  (process.env.CLIENT_URL || 'https://www.5eutility.com , https://5eutility.com , https://5e-utility.netlify.app')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)

export const clientOrigins = () => parse()
export const primaryClientUrl = () => parse()[0]
