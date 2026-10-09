import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  API_BASE_URL,
  IconProductPlaceholder,
  IconSearch,
  StockLevel,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  type AdminInventoryRow,
} from './shared'
import LedgerBand from '../../components/LedgerBand'
import './Products.css'

type StockFilter = 'all' | 'low' | 'out'

const DEFAULT_LOW_STOCK = 5
const thresholdOf = (row: AdminInventoryRow) => row.lowStockThreshold ?? DEFAULT_LOW_STOCK
const isOut = (row: AdminInventoryRow) => row.available <= 0
const isLow = (row: AdminInventoryRow) => !isOut(row) && row.available <= thresholdOf(row)

interface InventoryProps {
  token: string
}

interface OnHandCellProps {
  token: string
  row: AdminInventoryRow
  onUpdated: (row: AdminInventoryRow) => void
}

function OnHandCell({ token, row, onUpdated }: OnHandCellProps) {
  const [input, setInput] = useState(String(row.onHand))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const dirty = (Number(input) || 0) !== row.onHand

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const nextOnHand = Number(input) || 0
      const res = await fetch(`${API_BASE_URL}/api/admin/commerce/products/${row.id}`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify({ stockQty: nextOnHand }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update stock')
      setSaved(true)
      onUpdated({ ...row, onHand: nextOnHand, available: nextOnHand - row.committed })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inventory-onhand-cell">
      <input
        type="number"
        min={0}
        className="variant-stock-input"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setSaved(false)
        }}
        onBlur={() => {
          if (input.trim() === '') setInput(String(row.onHand))
        }}
      />
      <button type="button" className="dash-filter-btn variant-save-btn" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
      </button>
      {error && <p className="variant-row-error">{error}</p>}
    </div>
  )
}

function Inventory({ token }: InventoryProps) {
  const [rows, setRows] = useState<AdminInventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const location = useLocation()
  const [stockFilter, setStockFilter] = useState<StockFilter>(
    () => (location.state as { stockFilter?: StockFilter } | null)?.stockFilter ?? 'all',
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/admin/commerce/inventory`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load inventory')
        }
        if (!cancelled) setRows(json.data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load inventory')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const query = search.trim().toLowerCase()
  const filtered = rows.filter(
    (r) =>
      (!query || r.name.toLowerCase().includes(query)) &&
      (stockFilter === 'all' || (stockFilter === 'low' ? isLow(r) : isOut(r))),
  )
  const totals = rows.reduce(
    (acc, r) => ({
      available: acc.available + Math.max(r.available, 0),
      committed: acc.committed + r.committed,
      onHand: acc.onHand + r.onHand,
      low: acc.low + (isLow(r) ? 1 : 0),
      out: acc.out + (isOut(r) ? 1 : 0),
    }),
    { available: 0, committed: 0, onHand: 0, low: 0, out: 0 },
  )
  const toggleFilter = (next: StockFilter) => setStockFilter((current) => (current === next ? 'all' : next))

  return (
    <>
      <div className="dash-content-header">
        <h1>Inventory</h1>
        {!loading && !error && (
          <span className="dash-count">
            {(rows.length).toLocaleString('en-US')} {(rows.length) === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      {!error && (
        <LedgerBand
          caption="Units on hand"
          total={totals.onHand}
          loading={loading}
          segments={[
            { key: 'available', label: 'Available', value: totals.available, color: '#ffffff' },
            { key: 'committed', label: 'Committed to paid orders', value: totals.committed, color: '#8ea7d6' },
          ]}
          flags={[
            { key: 'low', label: 'Low stock', value: totals.low, active: stockFilter === 'low', onClick: () => toggleFilter('low') },
            { key: 'out', label: 'Out of stock', value: totals.out, active: stockFilter === 'out', onClick: () => toggleFilter('out') },
          ]}
        />
      )}

      <div className="products-card products-list-card">
        <div className="products-toolbar">
          <div className="products-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search and filter"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="products-empty">Loading inventory&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">
            {stockFilter === 'all' ? 'No products found.' : `No ${stockFilter === 'low' ? 'low-stock' : 'out-of-stock'} products.`}
            {stockFilter !== 'all' && (
              <button type="button" className="orders-label-link inventory-clear-filter" onClick={() => setStockFilter('all')}>
                Show all products
              </button>
            )}
          </div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Committed</th>
                  <th>Unavailable</th>
                  <th>On hand</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => {
                  const image = resolveImageUrl(row.imageUrl)
                  return (
                    <tr key={row.id} className={isOut(row) ? 'inventory-row-out' : undefined}>
                      <td>
                        <div className="products-cell-product">
                          <span className="products-thumb">
                            {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
                          </span>
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td>
                        <StockLevel qty={row.available} threshold={thresholdOf(row)} index={index} />
                      </td>
                      <td className={`inventory-num${row.committed > 0 ? ' inventory-num-committed' : ''}`}>
                        {row.committed}
                      </td>
                      <td className="inventory-num">{row.unavailable}</td>
                      <td>
                        <OnHandCell
                          token={token}
                          row={row}
                          onUpdated={(updated) => {
                            setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default Inventory
