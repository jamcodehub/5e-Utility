import nodemailer from 'nodemailer'

// Shared SMTP transport (same SMTP_* env vars as the auth routes). Returns
// null when SMTP isn't configured; callers then log instead of sending.
let transport = null
export const getTransport = () => {
  if (transport) return transport
  if (!process.env.SMTP_HOST) return null
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
  return transport
}

export const sendMail = async ({ to, subject, text }) => {
  const t = getTransport()
  if (!t) { console.log(`[mail] (SMTP not configured) to ${to}: ${subject}`); return false }
  await t.sendMail({ from: process.env.SMTP_FROM || '5e Utility <no-reply@5eutility.com>', to, subject, text })
  return true
}
