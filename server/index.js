import express from 'express'
import { createServer } from 'http'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import journalRoutes from './routes/journal.js'
import loreRoutes from './routes/lore.js'
import storyboardRoutes from './routes/storyboard.js'
import paymentRoutes from './routes/payments.js'
import feedbackRoutes from './routes/feedback.js'
import levelRoutes from './routes/levels.js'
import inventoryRoutes from './routes/inventory.js'
import uploadRoutes from './routes/upload.js'
import musicRoutes from './routes/music.js'
import sessionsRoutes from './routes/sessions.js'
import sharedRoutes from './routes/shared.js'
import { attachRealtime } from './realtime.js'
import { Character } from './models/index.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1) // Required for Render — lets express-rate-limit read the real client IP

app.use(helmet())

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, please try again later.' } })

// General-purpose limiter for every other API route. Auth gets the much
// stricter limiter above; this one just guards against scripted abuse/DoS
// on the rest of the API (previously nothing outside /api/auth was limited
// at all).
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please slow down.' } })

// Feedback is intentionally open to logged-out visitors, which also makes
// it the easiest unauthenticated spam target — keep it tight.
const feedbackLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many submissions, please try again later.' } })

app.use('/api/payments/webhook', express.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', apiLimiter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth',      authLimiter, authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/journal',   journalRoutes)
app.use('/api/lore',      loreRoutes)
app.use('/api/storyboard', storyboardRoutes)
app.use('/api/payments',  paymentRoutes)
app.use('/api/feedback',  feedbackLimiter, feedbackRoutes)
app.use('/api/levels',    levelRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/upload',    uploadRoutes)
app.use('/api/music',     musicRoutes)
app.use('/api/sessions',  sessionsRoutes)
app.use('/api/shared',    sharedRoutes)

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB connected')

  // One-time self-heal: an older schema version had a UNIQUE index on
  // { campaign: 1, owner: 1 } in the characters collection. Multi-character
  // support (2 free / unlimited premium per campaign) needs that index to be
  // non-unique — the current schema already declares it that way, but Mongo
  // doesn't retroactively change an existing index's options, so the stale
  // unique index kept throwing E11000 duplicate key errors whenever a player
  // tried to create a 2nd character in the same campaign. Drop it if found;
  // Mongoose will recreate the correct non-unique version automatically.
  try {
    const indexes = await Character.collection.indexes()
    const stale = indexes.find(i => i.name === 'campaign_1_owner_1' && i.unique)
    if (stale) {
      await Character.collection.dropIndex('campaign_1_owner_1')
      console.log('Dropped stale unique index campaign_1_owner_1 on characters collection')
    }
  } catch (e) { console.error('Index self-heal check failed:', e.message) }

  const httpServer = createServer(app)
  attachRealtime(httpServer)
  httpServer.listen(process.env.PORT || 4000, () => console.log(`Server on :${process.env.PORT || 4000}`))
}).catch(err => console.error(err))
