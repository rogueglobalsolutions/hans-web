import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconProductPlaceholder,
  IconSearch,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  type AdminCollection,
} from './shared'
import './Products.css'

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

  return (
    <>
      <div className="dash-content-header">
        <h1>Collections</h1>
        <div className="dash-filters">
          <button type="button" className="dash-filter-btn dash-filter-btn-primary">Add collection</button>
        </div>
      </div>

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
          <div className="products-empty">Loading collections&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">No collections found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Products</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((collection) => {
                  const image = resolveImageUrl(collection.imageUrl)
                  return (
                    <tr key={collection.id}>
                      <td>
                        <div className="products-cell-product">
                          <span className="products-thumb">
                            {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
                          </span>
                          <span>{collection.title}</span>
                        </div>
                      </td>
                      <td>{collection.productCount}</td>
                      <td>{collection.condition}</td>
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
