import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../pages/products/shared'

// Profile pictures are private uploads: fetch them with the admin token and reuse the blob URL.
const photoCache = new Map<string, Promise<string | null>>()

function loadPhoto(path: string, token: string) {
  const key = `${token.slice(-12)}:${path}`
  let pending = photoCache.get(key)
  if (!pending) {
    pending = fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? URL.createObjectURL(await res.blob()) : null))
      .catch(() => null)
    photoCache.set(key, pending)
  }
  return pending
}

interface AvatarProps {
  name: string
  size?: number
  /** Private upload path, e.g. uploads/profile-pictures/x.jpg. Falls back to initials. */
  photoPath?: string | null
  token?: string
}

/** A person's profile picture, or their initials in a navy-tint circle. */
function Avatar({ name, size = 32, photoPath, token }: AvatarProps) {
  const [photo, setPhoto] = useState<{ path: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!photoPath || !token) return
    let cancelled = false
    loadPhoto(photoPath, token).then((url) => {
      if (!cancelled) setPhoto({ path: photoPath, url })
    })
    return () => {
      cancelled = true
    }
  }, [photoPath, token])

  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initials = ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
  const url = photo && photo.path === photoPath ? photo.url : null

  return (
    <span
      className={`avatar${url ? ' avatar-photo' : ''}`}
      style={size === 32 ? undefined : { width: size, height: size }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" /> : initials}
    </span>
  )
}

export default Avatar
