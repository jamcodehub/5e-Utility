// A profile photo must be an image this user uploaded to their own Cloudinary folder (see routes/upload.js, which signs
// uploads into `lore-ledger/<userId>`). Anything else, including other users' images or arbitrary URLs, is refused.
export const AVATAR_MAX_LENGTH = 500

export function validAvatarUrl(url, userId, cloudName = process.env.CLOUDINARY_CLOUD_NAME) {
  if (typeof url !== 'string' || !url || url.length > AVATAR_MAX_LENGTH || !/^[a-f0-9]{24}$/i.test(String(userId))) return false
  let u
  try { u = new URL(url) } catch { return false }
  if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com' || u.search || u.hash || u.username || u.password || u.port) return false
  const cloud = cloudName ? cloudName.replace(/[^A-Za-z0-9_-]/g, '') : '[A-Za-z0-9_-]+'
  return new RegExp(`^/${cloud}/image/upload/(v\\d+/)?lore-ledger/${userId}/[A-Za-z0-9_-]+\\.(jpg|jpeg|png|webp|gif)$`, 'i').test(u.pathname)
}
