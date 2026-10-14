import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { LevelPlan, User } from './models/index.js'
import { isMember } from './routes/campaigns.js'

// Real-time collaborative Level Builder "Play mode" board — everyone viewing
// the same map (DM + players) sees token moves live and the board persists
// to the LevelPlan.tokens field so it survives reloads.
export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' },
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = payload.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  // Broadcast the list of everyone currently viewing a given map — used for
  // the small "peeking" avatar indicators on the board.
  const broadcastPresence = async (planId) => {
    const room = io.sockets.adapter.rooms.get(`level:${planId}`)
    if (!room) return
    const sockets = await io.in(`level:${planId}`).fetchSockets()
    const userIds = [...new Set(sockets.map(s => s.userId))]
    const users = await User.find({ _id: { $in: userIds } }, 'username avatar')
    io.to(`level:${planId}`).emit('level:presence', users.map(u => ({ userId: u._id, username: u.username, avatar: u.avatar })))
  }

  io.on('connection', (socket) => {
    socket.on('level:join', async (planId) => {
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || !await isMember(plan.campaign, socket.userId)) return
        socket.join(`level:${planId}`)
        socket.data.planId = planId
        socket.emit('level:tokens', plan.tokens || [])
        broadcastPresence(planId)
      } catch { /* ignore bad room join */ }
    })

    socket.on('level:leave', (planId) => {
      socket.leave(`level:${planId}`)
      socket.data.planId = null
      broadcastPresence(planId)
    })

    socket.on('disconnect', () => {
      if (socket.data.planId) broadcastPresence(socket.data.planId)
    })

    // A client changed the token layout (moved/added/removed/HP change) —
    // persist it and broadcast to everyone else looking at this map.
    socket.on('level:tokens', async ({ planId, tokens }) => {
      if (!planId) return
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || !await isMember(plan.campaign, socket.userId)) return
        plan.tokens = tokens || []
        await plan.save()
        socket.to(`level:${planId}`).emit('level:tokens', plan.tokens)
      } catch { /* ignore persist failure, clients stay locally in sync */ }
    })
  })

  return io
}

