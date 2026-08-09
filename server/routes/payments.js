import { Router } from 'express'
import Stripe from 'stripe'
import { User } from '../models/index.js'
import { auth } from './campaigns.js'

const router = Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Create a Stripe checkout session
router.post('/checkout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)

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
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/premium?success=true`,
      cancel_url:  `${process.env.CLIENT_URL}/premium?cancelled=true`,
      metadata: { userId: req.userId.toString() },
    })

    res.json({ url: session.url })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Create a billing portal session (manage/cancel subscription)
router.post('/portal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No subscription found' })

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/premium`,
    })
    res.json({ url: session.url })
  } catch (e) { res.status(500).json({ error: e.message }) }
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
          stripeSubId: session.subscription,
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await User.findOneAndUpdate({ stripeSubId: sub.id }, { isPremium: false, stripeSubId: '' })
      break
    }
  }

  res.json({ received: true })
})

export default router
