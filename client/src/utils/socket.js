import { io } from 'socket.io-client'

// Same-origin in production (Render serves API + socket from the same host);
// in dev, Vite proxies /socket.io to the local API server (see vite.config.js).
const SOCKET_URL = import.meta.env.VITE_API_URL || undefined

// One shared socket connection for the whole app — components join/leave
// specific rooms (e.g. a level plan's board) as needed.
let socket = null
export function getSocket() {
  if (socket) return socket
  const token = localStorage.getItem('ll_token')
  socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] })
  return socket
}
