import { useRef, useState } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { uploadToCloudinary } from '../utils/uploadToCloudinary'
import { useToast } from '../hooks/useToast'

const CAMERA = 'https://res.cloudinary.com/crcbzpw6/image/upload/v1795091290/camera-regular-full.svg'

// Small, square-cropped (face-centred) copy of a Cloudinary photo; any other URL (e.g. a Google picture) is used as is.
export const avatarSrc = (url, px = 96) => (/^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//.test(url || '')
  ? url.replace('/image/upload/', `/image/upload/c_fill,g_face,w_${px},h_${px},f_auto,q_auto/`)
  : url)

// The account's profile photo (or its first letter). Click it to choose a new photo: it is uploaded to Cloudinary and the
// link is saved on the account. On hover a faint camera icon says it can be changed.
export default function ProfileAvatar({ size = 32, fontSize = 13, style }) {
  const { user, refreshUser } = useAuth()
  const { toast, ToastContainer } = useToast()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  const choose = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Please choose an image file.'); return }
    setBusy(true)
    try {
      const url = await uploadToCloudinary(file, 'lore-ledger/avatar')
      await api('/auth/avatar', { method: 'PUT', body: { avatar: url } })
      await refreshUser()
      toast('Profile photo updated')
    } catch (err) { toast(err.message || 'Could not update your photo') }
    setBusy(false)
  }

  return (
    <>
      <button
        type="button" onClick={() => !busy && input.current?.click()} disabled={busy}
        aria-label="Change profile photo" title="Change profile photo"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}
        style={{
          position: 'relative', width: size, height: size, padding: 0, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', cursor: busy ? 'wait' : 'pointer',
          background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)', fontFamily: 'var(--font-title)', fontSize,
          display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
        }}
      >
        {user?.avatar
          ? <img src={avatarSrc(user.avatar, size * 3)} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : user?.username?.[0]?.toUpperCase()}
        {(hover || busy) && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: user?.avatar ? 'rgba(255,255,255,0.25)' : 'transparent', fontSize: size * 0.4, fontFamily: 'var(--font-ui)' }}>
            {busy ? '…' : <img src={CAMERA} alt="" style={{ width: size * 0.5, height: size * 0.5, opacity: 0.3, filter: 'var(--logo-filter, none)', pointerEvents: 'none' }} />}
          </span>
        )}
      </button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={choose} style={{ display: 'none' }} />
      <ToastContainer />
    </>
  )
}
