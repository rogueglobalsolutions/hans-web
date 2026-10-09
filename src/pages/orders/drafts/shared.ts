import { API_BASE_URL, authHeaders } from '../../products/shared'

export const DRAFTS_API = `${API_BASE_URL}/api/draft-orders`

export type DraftStatus = 'open' | 'link_sent' | 'link_expired' | 'paid' | 'cancelled'
export type DraftShippingMethod = 'GROUND' | 'SECOND_DAY_AIR'

export interface Address {
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
}

export interface DraftCustomer {
  id: string
  name: string
  email: string
  phone: string | null
  practiceName: string | null
  practiceAddress: Address
}

export interface DraftItem {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  productName: string
  variantLabel: string | null
  sku: string | null
  imageUrl: string | null
  unitPrice: number | null
  lineTotal: number | null
  available: number
  productActive: boolean
}

export interface DraftQuote {
  subtotalUsd: number
  shippingFeeUsd: number
  totalUsd: number
  serviceName: string
  /** Prices Stripe will actually charge, per line. */
  items?: { productId: string; variantId: string | null; unitPriceUsd: number; lineTotalUsd: number }[]
}

export interface DraftOrder {
  id: string
  draftNumber: string
  status: DraftStatus
  customer: DraftCustomer
  createdBy: { id: string; name: string; role: string }
  items: DraftItem[]
  itemCount: number
  shippingAddress: Address
  shippingMethod: DraftShippingMethod
  notes: string | null
  subtotal: number | null
  shippingFee: number | null
  totalAmount: number | null
  order: { id: string; orderNumber: string; status: string; paymentStatus: string; paidAt: string | null } | null
  checkoutUrl: string | null
  checkoutExpiresAt: string | null
  invoiceSentAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  quote?: DraftQuote | null
  quoteError?: string | null
  emailSent?: boolean
}

export interface LookupVariant {
  id: string
  label: string
  sku: string | null
  price: number | null
  stockQty: number
}

export interface LookupProduct {
  id: string
  name: string
  sku: string | null
  category: string | null
  imageUrl: string | null
  price: number | null
  stockQty: number
  variants: LookupVariant[]
}

export const DRAFT_STATUS_LABEL: Record<DraftStatus, string> = {
  open: 'Open',
  link_sent: 'Payment link sent',
  link_expired: 'Link expired',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

export const SHIPPING_METHOD_LABEL: Record<DraftShippingMethod, string> = {
  GROUND: 'UPS Ground',
  SECOND_DAY_AIR: 'UPS 2nd Day Air',
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export function formatUsd(value: number | null | undefined) {
  if (value == null) return '—'
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** Calls the draft-orders API and unwraps `{ success, data }`, throwing the server's message. */
export async function draftsRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${DRAFTS_API}${path}`, {
    ...init,
    headers: authHeaders(token, init.body != null),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.success) throw new Error(json.message || 'Request failed')
  return json.data as T
}
