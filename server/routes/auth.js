import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

const router = Router()

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' })
    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) return res.status(400).json({ error: 'Email or username already taken' })
    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ username, email, password: hashed })
    res.json({ token: sign(user._id), user: { id: user._id, username: user.username, email: user.email } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' })
    res.json({ token: sign(user._id), user: { id: user._id, username: user.username, email: user.email } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(id).select('-password')
    res.json(user)
  } catch (e) { res.status(401).json({ error: 'Invalid token' }) }
})

export default router
