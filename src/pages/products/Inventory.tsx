import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconProductPlaceholder,
  IconSearch,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  type AdminInventoryRow,
} from './shared'
import './Products.css'

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
  const filtered = query ? rows.filter((r) => r.name.toLowerCase().includes(query)) : rows

  return (
    <>
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
          <div className="products-empty">No products found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unavailable</th>
                  <th>Committed</th>
                  <th>Available</th>
                  <th>On hand</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const image = resolveImageUrl(row.imageUrl)
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="products-cell-product">
                          <span className="products-thumb">
                            {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
                          </span>
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td>{row.unavailable}</td>
                      <td>{row.committed}</td>
                      <td>{row.available}</td>
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
