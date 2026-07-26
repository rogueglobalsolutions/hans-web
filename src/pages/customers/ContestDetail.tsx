import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL, IconArrowLeft, authHeaders, resolveImageUrl } from '../products/shared'
import '../products/Products.css'

interface ContestDetailProps {
  token: string
}

interface ContestMedia {
  id: string
  section: 'BEFORE' | 'AFTER'
  filePath: string
  fileType: string
}

interface AdminContestEntryDetail {
  id: string
  title: string
  description: string
  createdAt: string
  media: ContestMedia[]
  user: { id: string; fullName: string; email: string }
  heartCount: number
  hearted: boolean
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function IconClose() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 6 10l6 6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4l6 6-6 6" />
    </svg>
  )
}

function MediaModal({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: ContestMedia[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const item = items[index]
  const url = resolveImageUrl(item.filePath)
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && index < items.length - 1) onNavigate(index + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate, index, items.length])

  return (
    <div className="contest-modal-overlay" onClick={onClose}>
      <div className="contest-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="contest-modal-close" aria-label="Close" onClick={onClose}>
          <IconClose />
        </button>

        {hasPrev && (
          <button
            type="button"
            className="contest-modal-nav contest-modal-nav-prev"
            aria-label="Previous"
            onClick={() => onNavigate(index - 1)}
          >
            <IconChevronLeft />
          </button>
        )}

        {item.fileType === 'video' ? (
          <video key={item.id} src={url ?? undefined} controls autoPlay />
        ) : (
          <img key={item.id} src={url ?? undefined} alt="" />
        )}

        {hasNext && (
          <button
            type="button"
            className="contest-modal-nav contest-modal-nav-next"
            aria-label="Next"
            onClick={() => onNavigate(index + 1)}
          >
            <IconChevronRight />
          </button>
        )}

        <p className="contest-modal-counter">
          {index + 1} / {items.length}
        </p>
      </div>
    </div>
  )
}

function MediaGrid({
  title,
  items,
  onSelect,
}: {
  title: string
  items: ContestMedia[]
  onSelect: (item: ContestMedia) => void
}) {
  if (items.length === 0) {
    return (
      <div className="product-detail-section">
        <p className="product-detail-label">{title}</p>
        <p className="product-detail-readonly">No {title.toLowerCase()} media uploaded.</p>
      </div>
    )
  }

  return (
    <div className="product-detail-section">
      <p className="product-detail-label">{title}</p>
      <div className="contest-media-grid">
        {items.map((item) => {
          const url = resolveImageUrl(item.filePath)
          return (
            <button
              key={item.id}
              type="button"
              className="contest-media-item"
              onClick={() => onSelect(item)}
            >
              {item.fileType === 'video' ? <video src={url ?? undefined} /> : <img src={url ?? undefined} alt="" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ContestDetail({ token }: ContestDetailProps) {
  const { entryId } = useParams<{ entryId: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<AdminContestEntryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!entryId) return
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/admin/ba/contest/${entryId}`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load contest entry')
        }
        if (!cancelled) setEntry(json.data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load contest entry')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, entryId])

  return (
    <>
      <div className="dash-content-header">
        <div className="product-detail-heading">
          <button
            type="button"
            className="product-detail-back"
            onClick={() => navigate('/customers/segments/contest')}
          >
            <IconArrowLeft />
            Before &amp; After Contest
          </button>
          <h1>{entry?.title ?? 'Contest entry'}</h1>
        </div>
      </div>

      {loading ? (
        <div className="products-card products-empty">Loading contest entry&hellip;</div>
      ) : error ? (
        <div className="products-card products-empty products-error">{error}</div>
      ) : entry ? (
        <div className="product-detail-grid">
          <div className="product-detail-main">
            <div className="products-card">
              <MediaGrid
                title="Before"
                items={entry.media.filter((m) => m.section === 'BEFORE')}
                onSelect={(item) => setActiveMediaIndex(entry.media.findIndex((m) => m.id === item.id))}
              />
            </div>
            <div className="products-card">
              <MediaGrid
                title="After"
                items={entry.media.filter((m) => m.section === 'AFTER')}
                onSelect={(item) => setActiveMediaIndex(entry.media.findIndex((m) => m.id === item.id))}
              />
            </div>
          </div>

          <div className="product-detail-side">
            <div className="products-card product-detail-section">
              <p className="product-detail-label">Description</p>
              <p className="product-detail-readonly">{entry.description || 'No description provided.'}</p>
            </div>

            <div className="products-card product-detail-section">
              <p className="product-detail-label">Submitted by</p>
              <p className="product-detail-readonly">{entry.user.fullName}</p>
              <p className="product-detail-readonly">{entry.user.email}</p>

              <p className="product-detail-label">Submitted on</p>
              <p className="product-detail-readonly">{formatDateTime(entry.createdAt)}</p>

              <p className="product-detail-label">Likes</p>
              <p className="product-detail-readonly">{entry.heartCount}</p>
            </div>
          </div>
        </div>
      ) : null}

      {entry && activeMediaIndex !== null && (
        <MediaModal
          items={entry.media}
          index={activeMediaIndex}
          onClose={() => setActiveMediaIndex(null)}
          onNavigate={setActiveMediaIndex}
        />
      )}
    </>
  )
}

export default ContestDetail
