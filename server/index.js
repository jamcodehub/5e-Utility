import express from 'express'
import { createServer } from 'http'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import authRoutes, { authConfig } from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import journalRoutes from './routes/journal.js'
import loreRoutes from './routes/lore.js'
import storyboardRoutes from './routes/storyboard.js'
import dmboardRoutes from './routes/dmboard.js'
import battleRoutes from './routes/battle.js'
import aiRoutes from './routes/ai.js'
import paymentRoutes from './routes/payments.js'
import feedbackRoutes from './routes/feedback.js'
import dndBeyondRoutes from './routes/dndbeyond.js'
import levelRoutes from './routes/levels.js'
import inventoryRoutes from './routes/inventory.js'
import uploadRoutes from './routes/upload.js'
import musicRoutes from './routes/music.js'
import sessionsRoutes from './routes/sessions.js'
import sharedRoutes from './routes/shared.js'
import { attachRealtime } from './realtime.js'
import { clientOrigins } from './lib/clientUrl.js'
import { rejectOperatorKeys } from './lib/guards.js'
import { runGraceSweep } from './lib/grace.js'
import { Character, DMBoard, User } from './models/index.js'
import { stampLegacyPlans } from './lib/premium.js'

dotenv.config({ quiet: true })

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
// Each import asks D&D Beyond for a character, so keep it modest per person/IP.
const importLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many imports, please try again later.' } })
const feedbackLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many submissions, please try again later.' } })

app.use('/api/payments/webhook', express.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(cors({ origin: clientOrigins() }))
app.use('/api/dmboard', express.json({ limit: '8mb' }))
app.use(express.json({ limit: '1mb' }))
// Express 5 leaves req.body undefined for body-less requests; routes expect an object.
app.use((req, _res, next) => { req.body ??= {}; next() })
app.use('/api', rejectOperatorKeys)
app.use('/api', apiLimiter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Registered before authLimiter so merely loading the sign-in page can't
// burn the strict auth rate limit.
app.get('/api/auth/config', authConfig)
app.use('/api/auth',      authLimiter, authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/journal',   journalRoutes)
app.use('/api/lore',      loreRoutes)
app.use('/api/storyboard', storyboardRoutes)
app.use('/api/dmboard', dmboardRoutes)
app.use('/api/battle', battleRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/payments',  paymentRoutes)
app.use('/api/feedback',  feedbackLimiter, feedbackRoutes)
app.use('/api/dndbeyond', importLimiter, dndBeyondRoutes)
app.use('/api/levels',    levelRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/upload',    uploadRoutes)
app.use('/api/music',     musicRoutes)
app.use('/api/sessions',  sessionsRoutes)
app.use('/api/shared',    sharedRoutes)

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`)

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

  // A board used to be one-per-campaign (unique index on campaign). Campaigns can now
  // hold many boards, so drop the old unique index and let Mongoose rebuild it.
  try {
    const stale = (await DMBoard.collection.indexes()).find(i => i.name === 'campaign_1' && i.unique)
    if (stale) {
      await DMBoard.collection.dropIndex('campaign_1')
      await DMBoard.createIndexes()
      console.log('Dropped stale unique index campaign_1 on dmboards collection')
    }
  } catch (e) { if (e.codeName !== 'NamespaceNotFound') console.error('DM board index self-heal check failed:', e.message) }

  // Paying accounts from before there were two plans have no plan written down; stamp them Player Premium (what they have).
  try {
    const stamped = await stampLegacyPlans(User)
    if (stamped) console.log(`Stamped ${stamped} older premium account(s) as Player Premium`)
  } catch (e) { console.error('Premium plan stamp failed:', e.message) }

  // Premium grace periods: send the pre-expiry reminder and remove premium once
  // the 5 days run out. Runs once at boot, then hourly.
  const sweep = () => runGraceSweep().catch(e => console.error('[grace]', e))
  sweep()
  setInterval(sweep, 60 * 60 * 1000).unref()

  const httpServer = createServer(app)
  attachRealtime(httpServer)
  httpServer.listen(process.env.PORT || 4000, () => console.log(`Server on :${process.env.PORT || 4000}`))
}).catch(err => console.error(err))
