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
    socket.on('campaign:join', async (campaignId, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      if (typeof campaignId !== 'string' || !campaignId) {
        respond({ ok: false, error: 'Invalid campaign' })
        return
      }
      try {
        if (!await isMember(campaignId, socket.userId)) {
          respond({ ok: false, error: 'You cannot join this campaign' })
          return
        }
        socket.join(`campaign:${campaignId}`)
        respond({ ok: true })
      } catch (error) {
        console.error('Failed to join campaign realtime room:', error)
        respond({ ok: false, error: 'Could not join campaign updates' })
      }
    })

    socket.on('campaign:leave', (campaignId) => {
      if (typeof campaignId === 'string' && campaignId) socket.leave(`campaign:${campaignId}`)
    })

    socket.on('level:show', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { campaignId, planId } = payload
      if (typeof campaignId !== 'string' || !campaignId || typeof planId !== 'string' || !planId) {
        respond({ ok: false, error: 'Invalid map selection' })
        return
      }
      try {
        const [user, plan] = await Promise.all([
          User.findById(socket.userId).select('role'),
          LevelPlan.findOne({ _id: planId, campaign: campaignId }).select('_id'),
        ])
        if (user?.role !== 'dm' || !plan || !await isMember(campaignId, socket.userId)) {
          respond({ ok: false, error: 'Only a campaign DM can show this map' })
          return
        }
        socket.to(`campaign:${campaignId}`).emit('level:show', { campaignId, planId })
        respond({ ok: true })
      } catch (error) {
        console.error('Failed to show battle map to campaign:', error)
        respond({ ok: false, error: 'Could not show the map to players' })
      }
    })

    socket.on('level:join', async (planId) => {
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || !await isMember(plan.campaign, socket.userId)) return
        socket.join(`level:${planId}`)
        socket.data.planId = planId
        socket.emit('level:tokens', plan.tokens || [])
        socket.emit('level:dark-mode', Boolean(plan.darkMode))
        socket.emit('level:doors', plan.doorStates || [])
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
        let next = Array.isArray(tokens) ? tokens : []
        if (String(plan.owner) !== socket.userId) {
          // Non-DMs may only move existing tokens; hp and membership are DM-controlled.
          const existing = new Map((plan.tokens || []).map(t => [t.id, t]))
          next = next.filter(t => existing.has(t.id)).map(t => {
            const prev = existing.get(t.id)
            return { ...t, hp: prev.hp, maxHp: prev.maxHp }
          })
          if (next.length !== existing.size) next = (plan.tokens || []).map(prev => next.find(t => t.id === prev.id) || prev)
        }
        plan.tokens = next
        await plan.save()
        socket.to(`level:${planId}`).emit('level:tokens', plan.tokens)
      } catch { /* ignore persist failure, clients stay locally in sync */ }
    })

    socket.on('level:dark-mode', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, darkMode } = payload
      if (typeof planId !== 'string' || !planId) {
        respond({ ok: false, error: 'Invalid map' })
        return
      }
      if (typeof darkMode !== 'boolean') {
        respond({ ok: false, error: 'Invalid map lighting setting' })
        return
      }
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || String(plan.owner) !== socket.userId || !await isMember(plan.campaign, socket.userId)) {
          respond({ ok: false, error: 'Only the map owner can change lighting' })
          return
        }
        plan.darkMode = darkMode
        await plan.save()
        io.to(`level:${planId}`).emit('level:dark-mode', darkMode)
        respond({ ok: true, darkMode })
      } catch (error) {
        console.error('Failed to update battle map lighting:', error)
        respond({ ok: false, error: 'Could not update map lighting' })
      }
    })

    socket.on('level:door', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, row, col, open } = payload
      if (typeof planId !== 'string' || !planId
        || !Number.isInteger(row) || row < 0 || row >= 22
        || !Number.isInteger(col) || col < 0 || col >= 32
        || typeof open !== 'boolean') {
        respond({ ok: false, error: 'Invalid door update' })
        return
      }
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || !await isMember(plan.campaign, socket.userId)) {
          respond({ ok: false, error: 'You cannot interact with this map' })
          return
        }
        let map
        try { map = JSON.parse(plan.content) } catch { map = null }
        const ground = Array.isArray(map) ? map : map?.ground
        if (ground?.[row]?.[col] !== 'door') {
          respond({ ok: false, error: 'There is no door at that location' })
          return
        }
        const doorStates = Array.isArray(plan.doorStates)
          ? plan.doorStates.map(cells => Array.isArray(cells) ? cells.slice() : [])
          : []
        doorStates[row] ||= []
        doorStates[row][col] = open
        plan.doorStates = doorStates
        await plan.save()
        io.to(`level:${planId}`).emit('level:door', { row, col, open })
        respond({ ok: true, row, col, open })
      } catch (error) {
        console.error('Failed to update battle map door:', error)
        respond({ ok: false, error: 'Could not update the door' })
      }
    })

    socket.on('level:travel', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, row, col } = payload
      if (typeof planId !== 'string' || !planId
        || !Number.isInteger(row) || row < 0 || row >= 22
        || !Number.isInteger(col) || col < 0 || col >= 32) {
        respond({ ok: false, error: 'Invalid stair location' })
        return
      }
      try {
        const source = await LevelPlan.findById(planId)
        if (!source || !await isMember(source.campaign, socket.userId)) {
          respond({ ok: false, error: 'You cannot travel from this map' })
          return
        }
        if (!socket.rooms.has(`level:${planId}`)) {
          respond({ ok: false, error: 'Join the map before using its stairs' })
          return
        }
        let map
        try { map = JSON.parse(source.content) } catch { map = null }
        if (!map || Array.isArray(map) || !['stairs', 'stairs-down'].includes(map.ground?.[row]?.[col])) {
          respond({ ok: false, error: 'There are no stairs at that location' })
          return
        }
        const destinationId = map.stairLinks?.[row]?.[col]
        if (typeof destinationId !== 'string') {
          respond({ ok: false, error: 'These stairs are not linked to another map' })
          return
        }
        const destination = await LevelPlan.findOne({ _id: destinationId, campaign: source.campaign })
        if (!destination) {
          respond({ ok: false, error: 'The linked map is not available in this campaign' })
          return
        }
        if (String(destination._id) === String(source._id)) {
          respond({ ok: false, error: 'Stairs must lead to a different map' })
          return
        }

        let destinationMap
        try { destinationMap = JSON.parse(destination.content) } catch { destinationMap = null }
        const destinationGround = Array.isArray(destinationMap) ? destinationMap : destinationMap?.ground
        const exitTile = map.ground[row][col] === 'stairs' ? 'stairs-down' : 'stairs'
        let landing = { row, col }
        if (Array.isArray(destinationGround)) {
          let foundLanding = false
          for (let landingRow = 0; landingRow < Math.min(destinationGround.length, 22) && !foundLanding; landingRow++) {
            const landingCol = destinationGround[landingRow]?.slice(0, 32).indexOf(exitTile) ?? -1
            if (landingCol >= 0) {
              landing = { row: landingRow, col: landingCol }
              foundLanding = true
            }
          }
        }
        const travellers = (Array.isArray(source.tokens) ? source.tokens : [])
          .filter(token => token?.type === 'player')
          .map(token => ({
            ...token,
            row: Number.isInteger(token.row) ? Math.max(0, Math.min(21, landing.row + token.row - row)) : landing.row,
            col: Number.isInteger(token.col) ? Math.max(0, Math.min(31, landing.col + token.col - col)) : landing.col,
          }))
        const travellerIds = new Set(travellers.map(token => token.id))
        const destinationTokens = (Array.isArray(destination.tokens) ? destination.tokens : [])
          .filter(token => !travellerIds.has(token.id))
          .concat(travellers)
        destination.tokens = destinationTokens
        await destination.save()
        io.to(`level:${destinationId}`).emit('level:tokens', destinationTokens)

        io.to(`level:${planId}`).emit('level:travel', {
          destinationId: String(destination._id),
          destinationPlan: {
            _id: String(destination._id),
            title: destination.title,
            content: destination.content,
            tokens: destinationTokens,
            darkMode: Boolean(destination.darkMode),
            doorStates: destination.doorStates || [],
          },
        })
        respond({ ok: true })
      } catch (error) {
        console.error('Failed to travel between battle map floors:', error)
        respond({ ok: false, error: 'Could not travel to the linked map' })
      }
    })
  })

  return io
}
