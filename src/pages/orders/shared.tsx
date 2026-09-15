export { API_BASE_URL, authHeaders, resolveImageUrl, usePagedSearch, Pagination, IconSearch, IconArrowLeft } from '../products/shared'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed'

export interface AdminOrderItem {
  id: string
  productId: string | null
  variantId: string | null
  productName: string
  variantLabel: string | null
  sku: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface AdminShippingLabel {
  id: string
  status: string
  carrier: string | null
  serviceCode: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  labelUrl: string | null
  labelFormat: string | null
  costCents: number | null
  createdAt: string
}

export interface AdminOrderSummary {
  id: string
  orderNumber: string
  customer: { name: string; email: string }
  productName: string
  itemCount: number
  totalAmount: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  verificationStatus: string
  fulfillmentStatus: string
  deliveryStatus: string
  trackingNumber: string | null
  trackingUrl: string | null
  createdAt: string
  paidAt: string | null
  cancellationRequested: boolean
  cancellationRequestedAt: string | null
  cancellationRequestReason: string | null
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerPhone: string | null
  shippingAddress: {
    address1: string | null
    address2: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    country: string | null
  }
  subtotal: number
  shippingFee: number
  tax: number
  notes: string | null
  shippingMethod: string | null
  courierName: string | null
  items: AdminOrderItem[]
  shippingLabels: AdminShippingLabel[]
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef3c7', color: '#b45309' },
  processing: { bg: '#dbeafe', color: '#1d4ed8' },
  shipped: { bg: '#e0f2fe', color: '#0369a1' },
  delivered: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c' },
  refunded: { bg: '#ede9fe', color: '#6d28d9' },
  partially_refunded: { bg: '#ede9fe', color: '#6d28d9' },
}

export function formatCurrency(value: number, currency = 'USD') {
  return value.toLocaleString('en-US', { style: 'currency', currency })
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function titleCase(value: string) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
