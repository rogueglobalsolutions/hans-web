import type { SyntheticEvent } from 'react'

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
