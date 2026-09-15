import { useEffect, useState } from 'react'
import OrderDetail from './OrderDetail'
import {
  API_BASE_URL,
  IconSearch,
  Pagination,
  STATUS_LABEL,
  STATUS_COLORS,
  authHeaders,
  formatCurrency,
  formatDate,
  usePagedSearch,
  type AdminOrderSummary,
  type OrderStatus,
} from './shared'
import './Orders.css'

interface OrdersProps {
  token: string
}

const PAGE_LIMIT = 20

const STATUS_TABS: { key: OrderStatus | 'all' | 'cancellation_requested'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cancellation_requested', label: 'Cancellation Requested' },
  { key: 'pending', label: 'Pending Payment' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#eef0f2', color: '#525b68' }
  return (
    <span className="orders-status" style={{ background: colors.bg, color: colors.color }}>
      {label}
    </span>
  )
}

function Orders({ token }: OrdersProps) {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'cancellation_requested'>('all')
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter !== 'all') params.set('status', statusFilter)

    fetch(`${API_BASE_URL}/api/admin/commerce/orders?${params.toString()}`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load orders')
        if (!cancelled) {
          setOrders(json.data.items ?? [])
          setTotal(json.data.total ?? 0)
          setHasMore(json.data.hasMore ?? false)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load orders')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, page, debouncedSearch, statusFilter])

  if (selectedId) {
    return (
      <OrderDetail
        id={selectedId}
        token={token}
        onBack={() => setSelectedId(null)}
        onChanged={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
        }}
      />
    )
  }

  return (
    <>
      <div className="dash-content-header">
        <h1>Orders</h1>
      </div>

      <div className="products-card products-list-card">
        <div className="orders-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`orders-tab ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="products-toolbar">
          <div className="products-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search order #, customer name, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="products-empty">Loading orders&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="products-empty">No orders found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="products-row-clickable" onClick={() => setSelectedId(order.id)}>
                    <td>
                      <div className="orders-cell-order">
                        <span className="orders-number">{order.orderNumber}</span>
                        <span className="orders-product-name">
                          {order.productName}
                          {order.itemCount > 1 ? ` +${order.itemCount - 1} more` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="orders-cell-customer">
                        <span>{order.customer.name}</span>
                        <span className="orders-customer-email">{order.customer.email}</span>
                      </div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {order.cancellationRequested ? (
                        <StatusBadge status="pending" label="Cancellation Requested" />
                      ) : (
                        <StatusBadge status={order.status} label={STATUS_LABEL[order.status] ?? order.status} />
                      )}
                    </td>
                    <td>
                      <StatusBadge status={order.paymentStatus} label={order.paymentStatus.replace('_', ' ')} />
                    </td>
                    <td>{formatCurrency(order.totalAmount, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          limit={PAGE_LIMIT}
          hasMore={hasMore}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </>
  )
}

export default Orders
