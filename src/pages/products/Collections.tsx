import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconSearch,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  type AdminCollection,
} from './shared'
import GradScale from '../../components/GradScale'
import LedgerBand, { type LedgerSegment } from '../../components/LedgerBand'
import './Products.css'

/* One navy shade per collection, shared by its band segment and its row tile. */
const SERIES = [
  { band: '#ffffff', tile: '#16305c', ink: '#ffffff' },
  { band: '#c5d3ee', tile: '#2f538f', ink: '#ffffff' },
  { band: '#8ea7d6', tile: '#5576b3', ink: '#ffffff' },
  { band: '#5f80c0', tile: '#a9bde3', ink: '#0e1a33' },
  { band: '#3d5f9e', tile: '#d6e0f2', ink: '#0e1a33' },
]
const OTHER = { band: 'rgba(255, 255, 255, 0.35)', tile: '#e1e5ec', ink: '#3f4b63' }
const seriesOf = (index: number) => SERIES[index] ?? OTHER

function initials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[1][0] : title.slice(0, 2)).toUpperCase()
}

interface CollectionsProps {
  token: string
}

function Collections({ token }: CollectionsProps) {
  const [collections, setCollections] = useState<AdminCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/admin/commerce/collections`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load collections')
        }
        if (!cancelled) setCollections(json.data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load collections')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const query = search.trim().toLowerCase()
  const filtered = query ? collections.filter((c) => c.title.toLowerCase().includes(query)) : collections
  const totalProducts = collections.reduce((sum, c) => sum + c.productCount, 0)
  const largest = Math.max(1, ...collections.map((c) => c.productCount))
  // The API returns collections largest first; colour follows that rank.
  const rank = new Map(collections.map((c, index) => [c.id, index]))
  const segments: LedgerSegment[] = collections.slice(0, SERIES.length).map((c, index) => ({
    key: c.id,
    label: c.title,
    value: c.productCount,
    color: seriesOf(index).band,
  }))
  const rest = collections.slice(SERIES.length).reduce((sum, c) => sum + c.productCount, 0)
  if (rest > 0) segments.push({ key: 'other', label: 'Other collections', value: rest, color: OTHER.band })

  return (
    <>
      <div className="dash-content-header">
        <h1>Collections</h1>
        {!loading && !error && (
          <span className="dash-count">
            {(collections.length).toLocaleString('en-US')} {(collections.length) === 1 ? 'collection' : 'collections'}
          </span>
        )}
      </div>

      {!error && (
        <LedgerBand
          caption="Products across collections"
          total={totalProducts}
          totalLabel="products"
          loading={loading}
          segments={segments}
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
          <button type="button" className="dash-filter-btn dash-filter-btn-primary">Add collection</button>
        </div>

        {loading ? (
          <div className="products-empty">Loading collections&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">No collections found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table collections-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Products</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((collection, index) => {
                  const image = resolveImageUrl(collection.imageUrl)
                  const tone = seriesOf(rank.get(collection.id) ?? SERIES.length)
                  return (
                    <tr key={collection.id}>
                      <td>
                        <div className="products-cell-product">
                          <span
                            className="collection-tile"
                            style={{ background: tone.tile, color: tone.ink }}
                            aria-hidden="true"
                          >
                            {initials(collection.title)}
                            {image && <img src={image} alt="" onError={hideBrokenImage} />}
                          </span>
                          <span className="collection-title">{collection.title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="collection-share">
                          <span className="collection-count">
                            {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
                            {totalProducts > 0 && (
                              <span className="collection-pct">
                                {Math.round((collection.productCount / totalProducts) * 100)}%
                              </span>
                            )}
                          </span>
                          <GradScale
                            fill={collection.productCount / largest}
                            majors={4}
                            minorsPerMajor={4}
                            width={120}
                            index={index}
                            label={`${collection.productCount} of ${totalProducts} products`}
                          />
                        </span>
                      </td>
                      <td>
                        <span className="collection-rule">{collection.condition}</span>
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

export default Collections
