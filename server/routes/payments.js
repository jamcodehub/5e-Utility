import { Router } from 'express'
import Stripe from 'stripe'
import { User } from '../models/index.js'
import { auth } from './campaigns.js'
import { primaryClientUrl } from '../lib/clientUrl.js'
import { startGrace, clearGrace, sendGraceEmail } from '../lib/grace.js'
import { premiumRoleOf, priceFor, planForPrice } from '../lib/premium.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create a Stripe checkout session
router.post('/checkout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    // Which plan: asked for explicitly, otherwise the one that matches the role they are acting as.
    const plan = req.body?.plan === 'dm' || req.body?.plan === 'player' ? req.body.plan : (user.role === 'dm' ? 'dm' : 'player')
    // One subscription per account. DM Premium includes Player Premium, so a Player subscriber who wants the DM tools has
    // their existing subscription switched to the DM price (the difference is prorated); nothing else can start a second one.
    if (user.isPremium) {
      const have = premiumRoleOf(user)
      if (have === 'dm' || plan === 'player') {
        const name = have === 'dm' ? 'DM Premium, which includes Player Premium' : 'Player Premium'
        return res.status(400).json({ error: `You already have ${name}. Manage or cancel it from your billing page.` })
      }
      if (!user.stripeSubId) return res.status(400).json({ error: 'We could not find your subscription. Please use your billing page to change plan.' })
      const sub = await stripe.subscriptions.retrieve(user.stripeSubId)
      const item = sub.items?.data?.[0]
      if (!item) return res.status(400).json({ error: 'We could not find your subscription. Please use your billing page to change plan.' })
      await stripe.subscriptions.update(user.stripeSubId, { items: [{ id: item.id, price: priceFor('dm') }], proration_behavior: 'create_prorations', metadata: { userId: req.userId.toString(), role: 'dm' } })
      await User.findByIdAndUpdate(req.userId, { premiumRole: 'dm' })
      return res.json({ upgraded: true })
    }

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.username })
      customerId = customer.id
      await User.findByIdAndUpdate(req.userId, { stripeCustomerId: customerId })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceFor(plan),
        quantity: 1,
      }],
      success_url: `${primaryClientUrl()}/premium?success=true`,
      cancel_url:  `${primaryClientUrl()}/premium?cancelled=true`,
      metadata: { userId: req.userId.toString(), role: plan },
    })

    res.json({ url: session.url })
  } catch (e) { console.error('[payments]', e); res.status(500).json({ error: 'Internal server error' }) }
})

// Create a billing portal session (manage/cancel subscription)
router.post('/portal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No subscription found' })

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${primaryClientUrl()}/premium`,
    })
    res.json({ url: session.url })
  } catch (e) { console.error('[payments]', e); res.status(500).json({ error: 'Internal server error' }) }
})

// Stripe webhook — must be raw body
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isPremium: true,
          premiumRole: session.metadata?.role === 'dm' ? 'dm' : 'player',
          stripeSubId: session.subscription,
          graceEndsAt: null,
          graceReminderSent: false,
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await User.findOneAndUpdate({ stripeSubId: sub.id }, { isPremium: false, premiumRole: '', stripeSubId: '', graceEndsAt: null, graceReminderSent: false })
      break
    }
    // A renewal went through: premium stays/returns and any grace period ends.
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const subId = event.data.object?.subscription
      if (subId) await clearGrace({ stripeSubId: subId })
      break
    }
    // Payment failed: keep premium for the 5-day grace period and email the user.
    case 'invoice.payment_failed': {
      const subId = event.data.object?.subscription
      if (subId) {
        const user = await startGrace(subId)
        if (user) await sendGraceEmail(user, 'failed')
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object
      if (sub.status === 'active' || sub.status === 'trialing') {
        await clearGrace({ stripeSubId: sub.id })
        // A plan change made in Stripe's billing page: follow the price the subscription is on now.
        const plan = planForPrice(sub.items?.data?.[0]?.price?.id)
        if (plan) await User.findOneAndUpdate({ stripeSubId: sub.id }, { premiumRole: plan })
      } else if (sub.status === 'past_due') {
        const user = await startGrace(sub.id)
        if (user) await sendGraceEmail(user, 'failed')
      } else if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
        await User.findOneAndUpdate({ stripeSubId: sub.id }, { isPremium: false, premiumRole: '', graceEndsAt: null, graceReminderSent: false })
      }
      break
    }
  }

  res.json({ received: true })
})

export default router
