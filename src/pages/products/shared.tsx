import { useEffect, useState, type SyntheticEvent } from 'react'
import GradScale from '../../components/GradScale'

export const API_BASE_URL = 'http://localhost:5656'

export type ProductStatus = 'active' | 'hidden' | 'out_of_stock'
export type VisibilityStatus = 'active' | 'hidden'

export interface AdminProductVariant {
  id: string
  label: string | null
  sku: string | null
  price: number | null
  stockQty: number | null
}

export interface AdminProduct {
  id: string
  name: string
  description: string
  status: ProductStatus
  /** True admin-controlled status — unlike `status`, this never auto-changes based on stock count. */
  visibilityStatus: VisibilityStatus
  stockQty: number
  lowStockThreshold: number
  category: string | null
  vendor: string | null
  imageUrl: string | null
  variants?: AdminProductVariant[]
}

export const VISIBILITY_STATUS_LABEL: Record<VisibilityStatus, string> = {
  active: 'Active',
  hidden: 'Hidden',
}

export interface AdminCollection {
  id: string
  title: string
  productCount: number
  condition: string
  imageUrl: string | null
}

export interface AdminInventoryRow {
  id: string
  name: string
  sku: string | null
  imageUrl: string | null
  unavailable: number
  committed: number
  available: number
  onHand: number
  incoming: number
  lowStockThreshold?: number
}

export function resolveImageUrl(url: string | null) {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function hideBrokenImage(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

export function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="M17 17l-4.5-4.5" />
    </svg>
  )
}

export function IconChevron() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8l4 4 4-4" />
    </svg>
  )
}

export function IconProductPlaceholder() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 10 3h7v7l-7 7-7-7Z" />
    </svg>
  )
}

export function IconArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4 6 10l6 6" />
    </svg>
  )
}

export function IconClose() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  )
}

export function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12M8 6V4h4v2M6 6l.6 10a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6" />
    </svg>
  )
}

export function usePagedSearch(delayMs = 350) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [search, delayMs])

  return { search, setSearch, debouncedSearch, page, setPage }
}

export function Pagination({
  page,
  total,
  limit,
  hasMore,
  onPrev,
  onNext,
}: {
  page: number
  total: number
  limit: number
  hasMore: boolean
  onPrev: () => void
  onNext: () => void
}) {
  if (total === 0) return null
  const totalPages = Math.max(Math.ceil(total / limit), 1)

  return (
    <div className="products-pagination">
      <span className="products-pagination-label">
        {total} total &middot; page {page} of {totalPages}
      </span>
      <div className="products-pagination-controls">
        <button type="button" className="dash-filter-btn" onClick={onPrev} disabled={page <= 1}>
          Previous
        </button>
        <button type="button" className="dash-filter-btn" onClick={onNext} disabled={!hasMore}>
          Next
        </button>
      </div>
    </div>
  )
}

/** Stock read off a graduated scale; the crimson mark is the low-stock threshold. */
export function StockLevel({ qty, threshold, index = 0 }: { qty: number; threshold: number; index?: number }) {
  const safeThreshold = Math.max(threshold ?? 0, 0)
  const max = Math.max(safeThreshold * 4, 20)
  const low = qty <= safeThreshold
  const label = qty <= 0 ? 'Out of stock' : `${qty} in stock`

  return (
    <span className={`stock-level${low ? ' stock-level-low' : ''}`}>
      <span className="stock-level-label">{label}</span>
      <GradScale
        fill={qty / max}
        majors={4}
        minorsPerMajor={4}
        tone={low ? 'crimson' : 'navy'}
        marker={safeThreshold > 0 ? safeThreshold / max : undefined}
        width={96}
        index={index}
        label={`${label}${safeThreshold > 0 ? `, low-stock mark at ${safeThreshold}` : ''}`}
      />
    </span>
  )
}
