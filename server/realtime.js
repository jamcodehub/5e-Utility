import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { LevelPlan, User } from './models/index.js'
import { isMember } from './routes/campaigns.js'
import { clientOrigins } from './lib/clientUrl.js'
import { applyPlayerTokenUpdate, mapDims, sameTokens } from './lib/tokenRules.js'
import { groundOf, isLocked, withLock, canKnock } from './lib/doors.js'
import { setNotifier, userRoom } from './lib/notify.js'

// Real-time collaborative Level Builder "Play mode" board — everyone viewing
// the same map (DM + players) sees token moves live and the board persists
// to the LevelPlan.tokens field so it survives reloads.
export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: clientOrigins() },
  })

  setNotifier(io)

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

  const doorKnocks = new Map() // recent door requests, so a player cannot flood the DM

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.userId))   // private messages for this user (e.g. a join request was approved)
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
        socket.emit('level:door-locks', plan.doorLocks || [])
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
        const isOwner = String(plan.owner) === socket.userId
        // The map's owner (the DM) controls the whole board. Everyone else can only move their own character's token.
        if (!isOwner) next = applyPlayerTokenUpdate(plan.tokens, next, socket.userId, mapDims(plan.content))
        plan.tokens = next
        plan.markModified('tokens')
        await plan.save()
        socket.to(`level:${planId}`).emit('level:tokens', plan.tokens)
        // A player who tried to move someone else's token (or edit one) is sent the real board, so their screen snaps back.
        if (!isOwner && !sameTokens(plan.tokens, tokens)) socket.emit('level:tokens', plan.tokens)
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

    // Open or close a door. Anyone on the map can, except that a locked door stays shut until the DM unlocks it.
    socket.on('level:door', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, row, col, open } = payload
      if (typeof planId !== 'string' || !planId
        || !Number.isInteger(row) || row < 0
        || !Number.isInteger(col) || col < 0
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
        const ground = groundOf(plan.content)
        if (ground?.[row]?.[col] !== 'door') {
          respond({ ok: false, error: 'There is no door at that location' })
          return
        }
        if (open && isLocked(plan.doorLocks, row, col) && String(plan.owner) !== socket.userId) {
          respond({ ok: false, locked: true, error: 'The door is locked' })
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

    // The DM locks or unlocks a door. Locking an open door closes it.
    socket.on('level:door-lock', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, row, col, locked } = payload
      if (typeof planId !== 'string' || !planId || !Number.isInteger(row) || row < 0 || !Number.isInteger(col) || col < 0 || typeof locked !== 'boolean') {
        respond({ ok: false, error: 'Invalid door update' })
        return
      }
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || String(plan.owner) !== socket.userId || !await isMember(plan.campaign, socket.userId)) {
          respond({ ok: false, error: 'Only the DM can lock or unlock doors' })
          return
        }
        if (groundOf(plan.content)?.[row]?.[col] !== 'door') {
          respond({ ok: false, error: 'There is no door at that location' })
          return
        }
        plan.doorLocks = withLock(plan.doorLocks, row, col, locked)
        const wasOpen = locked && plan.doorStates?.[row]?.[col] === true
        if (wasOpen) {
          const doorStates = plan.doorStates.map(cells => Array.isArray(cells) ? cells.slice() : [])
          doorStates[row][col] = false
          plan.doorStates = doorStates
        }
        await plan.save()
        io.to(`level:${planId}`).emit('level:door-lock', { row, col, locked })
        if (wasOpen) io.to(`level:${planId}`).emit('level:door', { row, col, open: false })
        respond({ ok: true, row, col, locked })
      } catch (error) {
        console.error('Failed to lock or unlock a battle map door:', error)
        respond({ ok: false, error: 'Could not update the door' })
      }
    })

    // A player tries a locked door. The DM is asked whether to let them through (one request per door every few seconds).
    socket.on('level:door-knock', async (payload = {}, acknowledge) => {
      const respond = typeof acknowledge === 'function' ? acknowledge : () => {}
      const { planId, row, col } = payload
      if (typeof planId !== 'string' || !planId || !Number.isInteger(row) || row < 0 || !Number.isInteger(col) || col < 0) {
        respond({ ok: false, error: 'Invalid door' })
        return
      }
      try {
        const plan = await LevelPlan.findById(planId)
        if (!plan || !await isMember(plan.campaign, socket.userId)) {
          respond({ ok: false, error: 'You cannot interact with this map' })
          return
        }
        if (groundOf(plan.content)?.[row]?.[col] !== 'door' || !isLocked(plan.doorLocks, row, col)) {
          respond({ ok: false, error: 'That door is not locked' })
          return
        }
        if (!canKnock(doorKnocks, `${planId}:${row}:${col}:${socket.userId}`, Date.now())) {
          respond({ ok: true, waiting: true })
          return
        }
        const mine = (Array.isArray(plan.tokens) ? plan.tokens : []).find(t => t?.id === `char-${socket.userId}`)
        const user = mine?.name ? null : await User.findById(socket.userId).select('username')
        const name = String(mine?.name || user?.username || 'A player').slice(0, 60)
        const sockets = await io.in(`level:${planId}`).fetchSockets()
        for (const s of sockets) if (s.userId === String(plan.owner)) s.emit('level:door-knock', { row, col, userId: socket.userId, name })
        respond({ ok: true, waiting: true })
      } catch (error) {
        console.error('Failed to send a door request to the DM:', error)
        respond({ ok: false, error: 'Could not ask the DM' })
      }
    })

    // The DM says a door stays locked: the player who asked is told.
    socket.on('level:door-deny', async (payload = {}) => {
      const { planId, row, col, userId } = payload
      if (typeof planId !== 'string' || !planId || !Number.isInteger(row) || !Number.isInteger(col) || typeof userId !== 'string') return
      try {
        const plan = await LevelPlan.findById(planId).select('owner')
        if (!plan || String(plan.owner) !== socket.userId) return
        const sockets = await io.in(`level:${planId}`).fetchSockets()
        for (const s of sockets) if (s.userId === userId) s.emit('level:door-denied', { row, col })
      } catch { /* the player just keeps waiting */ }
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
            doorLocks: destination.doorLocks || [],
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
