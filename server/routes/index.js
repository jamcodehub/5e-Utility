import express from 'express'
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

dotenv.config()

const app = express()

app.use(helmet())

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, please try again later.' } })

app.use('/api/payments/webhook', express.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf } }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth',      authLimiter, authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/journal',   journalRoutes)
app.use('/api/lore',      loreRoutes)
app.use('/api/storyboard', storyboardRoutes)
app.use('/api/payments',  paymentRoutes)
app.use('/api/feedback',  feedbackRoutes)
app.use('/api/levels',    levelRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/upload',    uploadRoutes)
app.use('/api/music',     musicRoutes)
app.use('/api/sessions',  sessionsRoutes)

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected')
  app.listen(process.env.PORT || 4000, () => console.log(`Server on :${process.env.PORT || 4000}`))
}).catch(err => console.error(err))
