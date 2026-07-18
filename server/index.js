import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import journalRoutes from './routes/journal.js'
import loreRoutes from './routes/lore.js'
import storyboardRoutes from './routes/storyboard.js'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/lore', loreRoutes)
app.use('/api/storyboard', storyboardRoutes)

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected')
  app.listen(process.env.PORT || 4000, () => console.log('Server on :4000'))
}).catch(err => console.error(err))
