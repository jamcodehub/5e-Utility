// uploadToCloudinary(file, folder?)
// 1. Asks our server for a signed upload token (secret stays server-side)
// 2. POSTs the file directly to Cloudinary from the browser
// 3. Returns the secure_url string to store in MongoDB
import { api } from '../context/AuthContext'

export async function uploadToCloudinary(file, folder = 'lore-ledger') {
  // Get signed params from our server
  const sign = await api('/upload/sign', { method: 'POST', body: { folder } })

  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', sign.api_key)
  fd.append('timestamp', sign.timestamp)
  fd.append('signature', sign.signature)
  fd.append('folder', sign.folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloud_name}/image/upload`,
    { method: 'POST', body: fd }
  )
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error?.message || 'Upload failed')
  return data.secure_url   // e.g. https://res.cloudinary.com/crcbzpw6/image/upload/...
}
