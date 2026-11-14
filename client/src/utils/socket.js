import { io } from 'socket.io-client'
import { findDemoLevel, isPublicDemoPath, updateDemoLevelState } from './demoRuntime'

// Same-origin in production (Render serves API + socket from the same host);
// in dev, Vite proxies /socket.io to the local API server (see vite.config.js).
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined

// One shared socket connection for the whole app — components join/leave
// specific rooms (e.g. a level plan's board) as needed.
let socket = null
const demoListeners = new Map()
const notifyDemoListeners = (event, payload) => {
  demoListeners.get(event)?.forEach(listener => listener(payload))
}
const demoSocket = {
  on(event, listener) {
    if (!demoListeners.has(event)) demoListeners.set(event, new Set())
    demoListeners.get(event).add(listener)
    return this
  },
  off(event, listener) {
    demoListeners.get(event)?.delete(listener)
    return this
  },
  timeout() { return this },
  emit(event, payload, callback) {
    let response = { ok: true }
    if (event === 'level:tokens') {
      updateDemoLevelState(payload?.planId, { tokens: payload?.tokens || [] })
    } else if (event === 'level:dark-mode') {
      const darkMode = Boolean(payload?.darkMode)
      const found = updateDemoLevelState(payload?.planId, { darkMode })
      response = found ? { ok: true, darkMode } : { ok: false, error: 'Map no longer available' }
    } else if (event === 'level:door') {
      const plan = findDemoLevel(payload?.planId)
      if (plan && Number.isInteger(payload?.row) && Number.isInteger(payload?.col)) {
        const doorStates = Array.isArray(plan.doorStates) ? plan.doorStates.map(row => row.slice()) : []
        if (doorStates[payload.row]?.[payload.col] !== undefined) {
          doorStates[payload.row][payload.col] = Boolean(payload.open)
          updateDemoLevelState(payload.planId, { doorStates })
          notifyDemoListeners('level:door', payload)
        } else {
          response = { ok: false, error: 'Door no longer available' }
        }
      } else {
        response = { ok: false, error: 'Map no longer available' }
      }
    } else if (event === 'level:travel') {
      const source = findDemoLevel(payload?.planId)
      const map = source?.content ? JSON.parse(source.content) : null
      const destinationId = map?.stairLinks?.[payload?.row]?.[payload?.col]
      const destinationPlan = destinationId ? findDemoLevel(destinationId) : null
      if (destinationPlan) {
        notifyDemoListeners('level:travel', { destinationId, destinationPlan })
      } else {
        response = { ok: false, error: 'The linked map is not available in this preview' }
      }
    }
    if (typeof callback === 'function') callback(null, response)
    return this
  },
}

export function getSocket() {
  if (isPublicDemoPath()) return demoSocket
  if (socket) return socket
  const token = localStorage.getItem('ll_token')
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}
