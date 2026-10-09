import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, Pagination, usePagedSearch } from '../../products/shared'
import { formatDate } from '../shared'
import LedgerBand from '../../../components/LedgerBand'
import DraftStatusScale from './DraftStatus'
import { draftsRequest, formatUsd, initialsOf, type DraftOrder, type DraftStatus } from './shared'
import { useRemote } from './useRemote'
import '../../products/Products.css'
import '../Orders.css'
import './Drafts.css'

interface DraftsProps {
  token: string
  canSeeAll: boolean
}

const PAGE_LIMIT = 20

type CountKey = 'all' | 'open' | 'link_sent' | 'paid' | 'cancelled'
const COUNT_KEYS: CountKey[] = ['all', 'open', 'link_sent', 'paid', 'cancelled']

const FILTERS: { key: DraftStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'link_sent', label: 'Awaiting payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
]

function Drafts({ token, canSeeAll }: DraftsProps) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<DraftStatus | 'all'>('all')
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (filter !== 'all') params.set('status', filter)
  const query = `?${params.toString()}`
  const list = useRemote(query, () =>
    draftsRequest<{ items: DraftOrder[]; total: number; hasMore: boolean }>(token, query),
  )
  const { loading, error } = list

  // Each status's total, read with a one-row request per status (also shown on the tabs).
  const counts = useRemote(`counts:${token}`, async () => {
    const entries = await Promise.all(
      COUNT_KEYS.map(async (key) => {
        const query = key === 'all' ? '?limit=1' : `?limit=1&status=${key}`
        const data = await draftsRequest<{ total: number }>(token, query)
        return [key, data.total] as const
      }),
    )
    return Object.fromEntries(entries) as Record<CountKey, number>
  })
  const count = (key: CountKey) => counts.data?.[key] ?? 0
  const drafts = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const hasMore = list.data?.hasMore ?? false

  return (
    <>
      <div className="dash-content-header">
        <h1>Drafts</h1>
        {!loading && !error && (
          <span className="dash-count">
            {total.toLocaleString('en-US')} {total === 1 ? 'draft' : 'drafts'}
          </span>
        )}
        <button
          type="button"
          className="dash-filter-btn dash-filter-btn-primary"
          onClick={() => navigate('/orders/drafts/new')}
        >
          Create draft order
        </button>
      </div>

      <LedgerBand
        caption="Draft pipeline"
        total={count('all')}
        totalLabel={count('all') === 1 ? 'draft' : 'drafts'}
        loading={counts.loading && !counts.data}
        segments={[
          { key: 'open', label: 'Open', value: count('open'), color: '#c5d3ee' },
          { key: 'link_sent', label: 'Awaiting payment', value: count('link_sent'), color: '#ffffff' },
          { key: 'paid', label: 'Paid', value: count('paid'), color: '#7fd1a8' },
          { key: 'cancelled', label: 'Cancelled', value: count('cancelled'), color: 'rgba(255, 255, 255, 0.3)' },
        ]}
      />

      <div className="products-card products-list-card">
        <div className="orders-tabs-wrap">
          <div className="orders-tabs" role="tablist" aria-label="Filter drafts">
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={filter === tab.key}
                className={`orders-tab ${filter === tab.key ? 'active' : ''}`}
                onClick={() => {
                  setFilter(tab.key)
                  setPage(1)
                }}
              >
                {tab.label}
                {counts.data && <span className="orders-tab-count">{count(tab.key as CountKey)}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="products-toolbar">
          <div className="products-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search draft #, order #, or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="products-empty">Loading drafts&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : drafts.length === 0 ? (
          <div className="products-empty drafts-empty">
            {debouncedSearch || filter !== 'all' ? (
              'No drafts match this filter.'
            ) : (
              <>
                <p className="drafts-empty-title">No draft orders yet</p>
                <p>Prepare an order for a medical professional, then send them a payment link.</p>
                <button
                  type="button"
                  className="dash-filter-btn dash-filter-btn-primary"
                  onClick={() => navigate('/orders/drafts/new')}
                >
                  Create draft order
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="products-table-wrap">
            <table className={`products-table drafts-table${canSeeAll ? ' drafts-table-admin' : ''}`}>
              <thead>
                <tr>
                  <th>Draft</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  {canSeeAll && <th>Created by</th>}
                  <th>Updated</th>
                  <th className="orders-cell-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft, index) => (
                  <tr
                    key={draft.id}
                    className="products-row-clickable"
                    onClick={() => navigate(`/orders/drafts/${draft.id}`)}
                  >
                    <td>
                      <div className="orders-cell-order">
                        <span className="orders-number num">{draft.draftNumber}</span>
                        <span className="orders-product-name">
                          {draft.order ? `Order ${draft.order.orderNumber}` : 'Not sent'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="drafts-customer">
                        <span className="drafts-avatar" aria-hidden="true">
                          {initialsOf(draft.customer.name)}
                        </span>
                        <div className="orders-cell-customer">
                          <span>{draft.customer.name}</span>
                          <span className="orders-customer-email">
                            {draft.customer.practiceName || draft.customer.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="drafts-cell-items">
                      {draft.itemCount} {draft.itemCount === 1 ? 'item' : 'items'}
                    </td>
                    <td>
                      <DraftStatusScale status={draft.status} index={index} />
                    </td>
                    {canSeeAll && <td className="drafts-cell-creator">{draft.createdBy.name}</td>}
                    <td className="orders-cell-date">{formatDate(draft.updatedAt)}</td>
                    <td className="orders-cell-total num">{formatUsd(draft.totalAmount)}</td>
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

export default Drafts
