import GradScale from '../../components/GradScale'

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

const LIFECYCLE: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

/** Order lifecycle read off a graduated scale: one major mark per station. */
export function StatusScale({
  status,
  cancellationRequested = false,
  index = 0,
  width = 96,
  showStations = false,
}: {
  status: OrderStatus
  cancellationRequested?: boolean
  index?: number
  width?: number
  showStations?: boolean
}) {
  const station = LIFECYCLE.indexOf(status)
  const cancelled = status === 'cancelled'
  const label = cancellationRequested ? 'Cancellation requested' : (STATUS_LABEL[status] ?? status)
  const tone = cancellationRequested ? 'crimson' : 'navy'

  return (
    <span className={`status-scale status-scale-${cancellationRequested ? 'alert' : status}`}>
      {(!showStations || cancelled || cancellationRequested) && <span className="status-scale-label">{label}</span>}
      <GradScale
        fill={cancelled ? 0 : Math.max(station, 0) / (LIFECYCLE.length - 1)}
        majors={LIFECYCLE.length - 1}
        minorsPerMajor={3}
        tone={tone}
        struck={cancelled}
        width={width}
        index={index}
        label={cancelled ? 'Cancelled' : `Step ${station + 1} of ${LIFECYCLE.length}: ${label}`}
      />
      {showStations && (
        <span className="status-scale-stations" style={{ width }} aria-hidden="true">
          {LIFECYCLE.map((step, i) => (
            <span key={step} className={!cancelled && i <= station ? 'reached' : ''}>
              {STATUS_LABEL[step].replace(' Payment', '')}
            </span>
          ))}
        </span>
      )}
    </span>
  )
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
