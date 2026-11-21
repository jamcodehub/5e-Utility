import { User } from '../models/index.js'
import { sendMail } from './mailer.js'
import { primaryClientUrl } from './clientUrl.js'

export const GRACE_MS = 5 * 24 * 60 * 60 * 1000
export const REMINDER_BEFORE_MS = 24 * 60 * 60 * 1000

// Start a grace period for the user on this subscription. Idempotent: if one
// is already running it is left alone and null is returned (no repeat email).
export const startGrace = async (stripeSubId) => {
  const now = Date.now()
  return User.findOneAndUpdate(
    { stripeSubId, $or: [{ graceEndsAt: null }, { graceEndsAt: { $exists: false } }] },
    { graceEndsAt: new Date(now + GRACE_MS), graceReminderSent: false, isPremium: true },
    { returnDocument: 'after' },
  )
}

export const clearGrace = (filter) =>
  User.findOneAndUpdate(filter, { graceEndsAt: null, graceReminderSent: false, isPremium: true })

const fmt = (d) => new Date(d).toUTCString().replace(/ GMT$/, ' UTC')

export const sendGraceEmail = async (user, kind) => {
  const when = fmt(user.graceEndsAt)
  const link = `${primaryClientUrl()}/premium`
  const msg = kind === 'failed'
    ? { subject: 'Your 5e Utility payment failed',
        text: `We couldn't process your latest premium payment. You keep premium until ${when}. Update your payment method before then to avoid losing it: ${link}` }
    : { subject: 'Your 5e Utility premium ends soon',
        text: `Your premium grace period ends on ${when}, and your payment still hasn't gone through. Update your payment method to keep premium: ${link}` }
  try { await sendMail({ to: user.email, ...msg }) } catch (e) { console.error('[grace] email failed', e.message) }
}

// Send the "ends soon" reminder and expire finished grace periods.
export const runGraceSweep = async (now = Date.now()) => {
  const soon = await User.find({
    graceEndsAt: { $gt: new Date(now), $lte: new Date(now + REMINDER_BEFORE_MS) },
    graceReminderSent: { $ne: true },
  })
  for (const user of soon) {
    await sendGraceEmail(user, 'ending')
    await User.updateOne({ _id: user._id }, { graceReminderSent: true })
  }
  await User.updateMany(
    { graceEndsAt: { $ne: null, $lte: new Date(now) } },
    { isPremium: false, graceEndsAt: null, graceReminderSent: false },
  )
}
