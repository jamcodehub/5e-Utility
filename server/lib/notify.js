// A way for the routes to push a message to one signed-in user's open pages, without importing the socket server itself.
// realtime.js registers the socket server here when it starts; every connection joins a private room named after its user.
let io = null

export function setNotifier(server) { io = server }

export const userRoom = (userId) => `user:${userId}`

export function notifyUser(userId, event, payload) {
  if (io) io.to(userRoom(userId)).emit(event, payload)
}
