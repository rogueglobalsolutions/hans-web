import { useEffect, useState } from 'react'
import ProductDetail from './ProductDetail'
import {
  API_BASE_URL,
  IconProductPlaceholder,
  IconSearch,
  Pagination,
  VISIBILITY_STATUS_LABEL,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  usePagedSearch,
  type AdminProduct,
} from './shared'
import './Products.css'

interface ProductsProps {
  token: string
}

const PAGE_LIMIT = 20

function Products({ token }: ProductsProps) {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) })
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`${API_BASE_URL}/api/admin/commerce/products?${params.toString()}`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load products')
        }
        if (!cancelled) {
          setProducts(json.data.items ?? [])
          setTotal(json.data.total ?? 0)
          setHasMore(json.data.hasMore ?? false)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load products')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, page, debouncedSearch])

  if (selectedId) {
    return (
      <ProductDetail
        id={selectedId}
        token={token}
        onBack={() => setSelectedId(null)}
        onSaved={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
        }}
      />
    )
  }

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
          <button type="button" className="dash-filter-btn dash-filter-btn-primary">Add product</button>
        </div>

        {loading ? (
          <div className="products-empty">Loading products&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="products-empty">No products found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Inventory</th>
                  <th>Category</th>
                  <th>Vendor</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const image = resolveImageUrl(product.imageUrl)
                  return (
                    <tr key={product.id} className="products-row-clickable" onClick={() => setSelectedId(product.id)}>
                      <td>
                        <div className="products-cell-product">
                          <span className="products-thumb">
                            {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
                          </span>
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`products-status products-status-${product.visibilityStatus}`}>
                          {VISIBILITY_STATUS_LABEL[product.visibilityStatus]}
                        </span>
                      </td>
                      <td>{product.stockQty} in stock</td>
                      <td>{product.category || '—'}</td>
                      <td>{product.vendor || '—'}</td>
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

export default Products
