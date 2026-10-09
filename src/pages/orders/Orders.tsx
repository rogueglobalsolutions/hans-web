import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import OrderDetail from './OrderDetail'
import {
  API_BASE_URL,
  IconSearch,
  Pagination,
  StatusScale,
  authHeaders,
  formatCurrency,
  formatDate,
  usePagedSearch,
  type AdminOrderSummary,
  type OrderStatus,
} from './shared'
import { useOrderChangeMarks } from './useOrderChangeMarks'
import LedgerBand from '../../components/LedgerBand'
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

function PaymentState({ status }: { status: string }) {
  return <span className={`orders-payment orders-payment-${status}`}>{status.replace('_', ' ')}</span>
}

function Orders({ token }: OrdersProps) {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (location.state as { orderId?: string } | null)?.orderId ?? null,
  )
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'cancellation_requested'>('all')
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()
  const { markFor, markSeen } = useOrderChangeMarks(orders)
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({})

  // Each tab's total, read with a one-row request per status.
  useEffect(() => {
    let cancelled = false
    Promise.all(
      STATUS_TABS.map(async (tab) => {
        const params = new URLSearchParams({ page: '1', limit: '1' })
        if (tab.key !== 'all') params.set('status', tab.key)
        const res = await fetch(`${API_BASE_URL}/api/admin/commerce/orders?${params.toString()}`, {
          headers: authHeaders(token),
        })
        const json = await res.json()
        return [tab.key, res.ok && json.success ? (json.data.total ?? 0) : null] as const
      }),
    )
      .then((entries) => {
        if (cancelled) return
        const next: Record<string, number> = {}
        for (const [key, count] of entries) if (count != null) next[key] = count
        setTabCounts(next)
      })
      .catch(() => {
        // Counts are a convenience; the tabs still work without them.
      })
    return () => {
      cancelled = true
    }
  }, [token, selectedId])

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
        {!loading && !error && (
          <span className="dash-count">
            {total.toLocaleString('en-US')} {total === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      <LedgerBand
        caption="Orders by status"
        total={tabCounts.all ?? 0}
        totalLabel={(tabCounts.all ?? 0) === 1 ? 'order' : 'orders'}
        loading={!('all' in tabCounts)}
        segments={[
          { key: 'pending', label: 'Pending payment', value: tabCounts.pending ?? 0, color: '#f3c77a' },
          { key: 'processing', label: 'Processing', value: tabCounts.processing ?? 0, color: '#8ea7d6' },
          { key: 'shipped', label: 'Shipped', value: tabCounts.shipped ?? 0, color: '#c5d3ee' },
          { key: 'delivered', label: 'Delivered', value: tabCounts.delivered ?? 0, color: '#7fd1a8' },
          { key: 'cancelled', label: 'Cancelled', value: tabCounts.cancelled ?? 0, color: 'rgba(255, 255, 255, 0.3)' },
        ]}
        flags={[
          {
            key: 'cancellation',
            label: 'Cancellation requests',
            value: tabCounts.cancellation_requested ?? 0,
            active: statusFilter === 'cancellation_requested',
            onClick: () => {
              setStatusFilter(statusFilter === 'cancellation_requested' ? 'all' : 'cancellation_requested')
              setPage(1)
            },
          },
        ]}
      />

      <div className="products-card products-list-card">
        <div className="orders-tabs-wrap">
          <div className="orders-tabs" role="tablist" aria-label="Filter by status">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.key}
                className={`orders-tab ${statusFilter === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(tab.key)
                  setPage(1)
                }}
              >
                {tab.label}
                {tabCounts[tab.key] != null && (
                  <span className="orders-tab-count">{tabCounts[tab.key].toLocaleString('en-US')}</span>
                )}
              </button>
            ))}
          </div>
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
            <table className="products-table orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="orders-cell-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const mark = markFor(order)
                  return (
                    <tr
                      key={order.id}
                      className={`products-row-clickable${mark ? ' orders-row-marked' : ''}`}
                      onClick={() => {
                        markSeen(order)
                        setSelectedId(order.id)
                      }}
                    >
                    <td>
                      <div className="orders-cell-order">
                        <span className="orders-number num">
                          {order.orderNumber}
                          {mark && (
                            <span className="orders-change-mark" title="Changed since you last opened this order">
                              {mark === 'new' ? 'New' : 'Updated'}
                            </span>
                          )}
                        </span>
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
                    <td className="orders-cell-date">{formatDate(order.createdAt)}</td>
                    <td>
                      <StatusScale
                        status={order.status}
                        cancellationRequested={order.cancellationRequested}
                        index={index}
                      />
                    </td>
                    <td>
                      <PaymentState status={order.paymentStatus} />
                    </td>
                    <td className="orders-cell-total num">{formatCurrency(order.totalAmount, order.currency)}</td>
                    </tr>
                  )
                })}
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
