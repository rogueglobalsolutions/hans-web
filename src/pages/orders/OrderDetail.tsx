import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconArrowLeft,
  STATUS_COLORS,
  STATUS_LABEL,
  authHeaders,
  formatCurrency,
  formatDate,
  titleCase,
  type AdminOrderDetail,
  type OrderStatus,
} from './shared'
import '../products/Products.css'
import './Orders.css'

interface OrderDetailProps {
  id: string
  token: string
  onBack: () => void
  onChanged: (order: AdminOrderDetail) => void
}

function addressLines(order: AdminOrderDetail) {
  const { address1, address2, city, state, zipCode, country } = order.shippingAddress
  const lines = [address1, address2, [city, state, zipCode].filter(Boolean).join(', '), country].filter(
    (line): line is string => Boolean(line && line.trim()),
  )
  return lines.length ? lines : ['No shipping address on file']
}

function ManualTrackingForm({
  token,
  orderId,
  onSaved,
}: {
  token: string
  orderId: string
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierName, setCourierName] = useState('UPS')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <button type="button" className="dash-filter-btn" onClick={() => setOpen(true)}>
        Enter tracking manually
      </button>
    )
  }

  const handleSave = async () => {
    if (!trackingNumber.trim()) {
      setError('Tracking number is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/commerce/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          courierName: courierName.trim() || 'UPS',
          trackingUrl: trackingUrl.trim() || undefined,
          note: 'Tracking added manually from Hans Web',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save tracking')
      onSaved()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save tracking')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="orders-manual-tracking">
      <div className="orders-manual-tracking-row">
        <input
          type="text"
          placeholder="Tracking number"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Carrier (e.g. UPS)"
          value={courierName}
          onChange={(e) => setCourierName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tracking URL (optional)"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
        />
      </div>
      {error && <p className="orders-error-text">{error}</p>}
      <div className="orders-manual-tracking-actions">
        <button type="button" className="dash-filter-btn" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="dash-filter-btn dash-filter-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save tracking'}
        </button>
      </div>
    </div>
  )
}

function OrderDetail({ id, token, onBack, onChanged }: OrderDetailProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const loadOrder = () => {
    setLoading(true)
    setLoadError('')
    fetch(`${API_BASE_URL}/api/admin/commerce/orders/${id}`, { headers: authHeaders(token) })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load order')
        setOrder(json.data)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  // Every mutating endpoint here (verify/status/cancel/refund/ups-label)
  // returns only a lightweight order summary or a label record - never the
  // full detail shape this page needs (items, shippingAddress, shippingLabels).
  // So after any action succeeds, reload the full order instead of trying to
  // patch state from that response.
  const reloadOrder = async (): Promise<AdminOrderDetail> => {
    const res = await fetch(`${API_BASE_URL}/api/admin/commerce/orders/${id}`, { headers: authHeaders(token) })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Failed to reload order')
    return json.data as AdminOrderDetail
  }

  const runAction = async (key: string, request: () => Promise<unknown>) => {
    setActionLoading(key)
    setActionError('')
    try {
      await request()
      const refreshed = await reloadOrder()
      setOrder(refreshed)
      onChanged(refreshed)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const postJson = async (path: string, body?: unknown) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Request failed')
    return json.data
  }

  const patchJson = async (path: string, body: unknown) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: authHeaders(token, true),
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Request failed')
    return json.data
  }

  const handleVerify = () =>
    runAction('verify', () => postJson(`/api/admin/commerce/orders/${id}/verify`, { note: 'Verified from Hans Web' }))

  const handleSetStatus = (status: OrderStatus) => {
    const body: Record<string, unknown> =
      status === 'shipped'
        ? { status, fulfillmentStatus: 'FULFILLED', deliveryStatus: 'IN_TRANSIT', note: 'Marked shipped from Hans Web' }
        : status === 'delivered'
        ? { status, fulfillmentStatus: 'FULFILLED', deliveryStatus: 'DELIVERED', note: 'Marked delivered from Hans Web' }
        : { status, note: `Marked ${status} from Hans Web` }
    return runAction(`status-${status}`, () => patchJson(`/api/admin/commerce/orders/${id}/status`, body))
  }

  const handleCancel = () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return
    runAction('cancel', () =>
      postJson(`/api/admin/commerce/orders/${id}/cancel`, { reason: 'Admin cancellation', note: 'Cancelled from Hans Web' }),
    )
  }

  const handleRefund = () => {
    if (!window.confirm('Refund the full remaining amount for this order via Stripe?')) return
    runAction('refund', () => postJson(`/api/admin/commerce/orders/${id}/refund`, { reason: 'Admin refund' }))
  }

  const handleApproveCancellation = () => {
    if (!window.confirm('Approve this cancellation request? The order will be cancelled and refunded via Stripe.')) return
    runAction('cancellation-approve', () =>
      postJson(`/api/admin/commerce/orders/${id}/cancellation/approve`, { note: 'Approved from Hans Web' }),
    )
  }

  const handleDeclineCancellation = () => {
    if (!window.confirm('Decline this cancellation request? The order will continue as normal.')) return
    runAction('cancellation-decline', () =>
      postJson(`/api/admin/commerce/orders/${id}/cancellation/decline`, { note: 'Declined from Hans Web' }),
    )
  }

  const handleGenerateUpsLabel = () => {
    runAction('ups-label', () => postJson(`/api/admin/commerce/orders/${id}/shipping-labels/ups`))
  }

  const handleViewLabel = async (labelUrl: string) => {
    const path = labelUrl.replace(/^\/+/, '')
    if (!/^uploads\/shipping-labels\/[A-Za-z0-9._-]+$/.test(path)) {
      setActionError('This shipping label cannot be opened.')
      return
    }
    const preview = window.open('', '_blank')
    if (!preview) {
      setActionError('Allow pop-ups to view the shipping label.')
      return
    }
    preview.opener = null
    setActionLoading('view-label')
    setActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/${path}`, { headers: authHeaders(token) })
      if (!response.ok) throw new Error('Could not load the shipping label.')
      const objectUrl = URL.createObjectURL(await response.blob())
      preview.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000)
    } catch (error) {
      preview.close()
      setActionError(error instanceof Error ? error.message : 'Could not load the shipping label.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <>
        <div className="dash-content-header">
          <div className="product-detail-heading">
            <button type="button" className="product-detail-back" onClick={onBack}>
              <IconArrowLeft />
              Orders
            </button>
          </div>
        </div>
        <div className="products-empty">Loading order&hellip;</div>
      </>
    )
  }

  if (loadError || !order) {
    return (
      <>
        <div className="dash-content-header">
          <div className="product-detail-heading">
            <button type="button" className="product-detail-back" onClick={onBack}>
              <IconArrowLeft />
              Orders
            </button>
          </div>
        </div>
        <div className="products-empty products-error">{loadError || 'Order not found'}</div>
      </>
    )
  }

  const statusColors = STATUS_COLORS[order.status] ?? { bg: '#eef0f2', color: '#525b68' }
  const canRefund = ['paid', 'partially_refunded'].includes(order.paymentStatus)
  const canCancel = order.status !== 'cancelled' && order.status !== 'delivered'
  const latestLabel = order.shippingLabels[0]

  return (
    <>
      <div className="dash-content-header">
        <div className="product-detail-heading">
          <button type="button" className="product-detail-back" onClick={onBack}>
            <IconArrowLeft />
            Orders
          </button>
          <h1>{order.orderNumber}</h1>
        </div>
        <span className="orders-status" style={{ background: statusColors.bg, color: statusColors.color }}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {actionError && <div className="orders-banner-error">{actionError}</div>}

      {order.cancellationRequested && (
        <div className="orders-banner-warning">
          <strong>Cancellation Requested</strong>
          {order.cancellationRequestReason ? `Reason: "${order.cancellationRequestReason}"` : 'No reason provided.'}
          {order.cancellationRequestedAt ? ` · Requested ${formatDate(order.cancellationRequestedAt)}` : ''}
          <div className="orders-banner-warning-actions">
            <button
              type="button"
              className="dash-filter-btn dash-filter-btn-primary"
              onClick={handleApproveCancellation}
              disabled={actionLoading === 'cancellation-approve'}
            >
              {actionLoading === 'cancellation-approve' ? 'Approving…' : 'Approve & Refund'}
            </button>
            <button
              type="button"
              className="dash-filter-btn"
              onClick={handleDeclineCancellation}
              disabled={actionLoading === 'cancellation-decline'}
            >
              {actionLoading === 'cancellation-decline' ? 'Declining…' : 'Decline'}
            </button>
          </div>
        </div>
      )}

      <div className="orders-detail-grid">
        <div className="products-card orders-detail-card">
          <h2>Customer</h2>
          <dl className="orders-kv">
            <dt>Name</dt>
            <dd>{order.customer.name}</dd>
            <dt>Email</dt>
            <dd>{order.customer.email}</dd>
            <dt>Phone</dt>
            <dd>{order.customerPhone || 'N/A'}</dd>
          </dl>
        </div>

        <div className="products-card orders-detail-card">
          <h2>Shipping Address</h2>
          {addressLines(order).map((line) => (
            <p key={line} className="orders-address-line">{line}</p>
          ))}
          <dl className="orders-kv">
            <dt>Method</dt>
            <dd>{order.shippingMethod ? titleCase(order.shippingMethod) : '—'}</dd>
            <dt>Tracking</dt>
            <dd>
              {order.trackingNumber ? (
                order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer">{order.trackingNumber}</a>
                ) : (
                  order.trackingNumber
                )
              ) : (
                'Not added'
              )}
            </dd>
          </dl>
        </div>

        <div className="products-card orders-detail-card orders-detail-card-wide">
          <h2>Items</h2>
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.productName}
                    {item.variantLabel ? <span className="orders-variant-label"> · {item.variantLabel}</span> : null}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.lineTotal, order.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="products-card orders-detail-card">
          <h2>Payment Summary</h2>
          <dl className="orders-kv">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(order.subtotal, order.currency)}</dd>
            <dt>Shipping</dt>
            <dd>{formatCurrency(order.shippingFee, order.currency)}</dd>
            <dt>Tax</dt>
            <dd>{formatCurrency(order.tax, order.currency)}</dd>
            <dt>Total</dt>
            <dd><strong>{formatCurrency(order.totalAmount, order.currency)}</strong></dd>
            <dt>Verification</dt>
            <dd>{titleCase(order.verificationStatus)}</dd>
            <dt>Fulfillment</dt>
            <dd>{titleCase(order.fulfillmentStatus)}</dd>
            <dt>Delivery</dt>
            <dd>{titleCase(order.deliveryStatus)}</dd>
          </dl>
        </div>

        <div className="products-card orders-detail-card orders-detail-card-wide">
          <h2>Shipping Label</h2>
          {latestLabel ? (
            <dl className="orders-kv">
              <dt>Carrier</dt>
              <dd>{latestLabel.carrier || '—'}</dd>
              <dt>Tracking</dt>
              <dd>
                {latestLabel.trackingUrl ? (
                  <a href={latestLabel.trackingUrl} target="_blank" rel="noreferrer">{latestLabel.trackingNumber}</a>
                ) : (
                  latestLabel.trackingNumber || '—'
                )}
              </dd>
              <dt>Label</dt>
              <dd>
                {latestLabel.labelUrl ? (
                  <button
                    type="button"
                    className="orders-label-link"
                    disabled={actionLoading === 'view-label'}
                    onClick={() => handleViewLabel(latestLabel.labelUrl!)}
                  >
                    {actionLoading === 'view-label' ? 'Opening label...' : 'View / print label'}
                  </button>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Cost</dt>
              <dd>{latestLabel.costCents != null ? formatCurrency(latestLabel.costCents / 100, order.currency) : '—'}</dd>
              <dt>Status</dt>
              <dd>{titleCase(latestLabel.status)}</dd>
            </dl>
          ) : (
            <p className="orders-empty-hint">No shipping label yet.</p>
          )}

          <div className="orders-label-actions">
            <button
              type="button"
              className="dash-filter-btn dash-filter-btn-primary"
              onClick={handleGenerateUpsLabel}
              disabled={actionLoading === 'ups-label' || order.status === 'cancelled'}
            >
              {actionLoading === 'ups-label' ? 'Generating…' : 'Generate UPS label'}
            </button>
            <ManualTrackingForm
              token={token}
              orderId={id}
              onSaved={() => {
                reloadOrder().then((refreshed) => {
                  setOrder(refreshed)
                  onChanged(refreshed)
                })
              }}
            />
          </div>
          <p className="orders-hint">
            "Generate UPS label" books a real UPS Ground shipment and fills in the tracking number + printable label automatically.
          </p>
        </div>

        <div className="products-card orders-detail-card orders-detail-card-wide">
          <h2>Admin Actions</h2>
          <div className="orders-actions-grid">
            <button
              type="button"
              className="dash-filter-btn"
              onClick={handleVerify}
              disabled={actionLoading === 'verify' || order.verificationStatus === 'verified'}
            >
              {actionLoading === 'verify' ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              className="dash-filter-btn"
              onClick={() => handleSetStatus('processing')}
              disabled={actionLoading === 'status-processing' || order.status === 'processing' || order.status === 'cancelled'}
            >
              Mark Processing
            </button>
            <button
              type="button"
              className="dash-filter-btn"
              onClick={() => handleSetStatus('shipped')}
              disabled={actionLoading === 'status-shipped' || order.status === 'shipped' || order.status === 'cancelled'}
            >
              Mark Shipped
            </button>
            <button
              type="button"
              className="dash-filter-btn"
              onClick={() => handleSetStatus('delivered')}
              disabled={actionLoading === 'status-delivered' || order.status === 'delivered' || order.status === 'cancelled'}
            >
              Mark Delivered
            </button>
            <button
              type="button"
              className="dash-filter-btn orders-btn-danger"
              onClick={handleRefund}
              disabled={actionLoading === 'refund' || !canRefund}
            >
              Refund
            </button>
            <button
              type="button"
              className="dash-filter-btn orders-btn-danger"
              onClick={handleCancel}
              disabled={actionLoading === 'cancel' || !canCancel}
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderDetail
