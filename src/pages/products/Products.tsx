import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductDetail from './ProductDetail'
import LedgerBand from '../../components/LedgerBand'
import {
  API_BASE_URL,
  IconClose,
  IconProductPlaceholder,
  IconSearch,
  IconTrash,
  Pagination,
  StockLevel,
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

interface VariantForm {
  label: string
  price: string
  sku: string
  stripePriceId: string
}

const EMPTY_VARIANT: VariantForm = { label: '', price: '', sku: '', stripePriceId: '' }

interface ProductFormState {
  name: string
  description: string
  vendor: string
  category: string
  status: 'active' | 'hidden'
  price: string
  compareAtPrice: string
  stockQty: string
  sku: string
  stripeProductId: string
  stripeDefaultPriceId: string
  shippingInfo: string
  returnAndExchange: string
  shelfLife: string
  disclaimer: string
  usedWith: string
  fdaCleared: boolean
  securePackaging: boolean
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  vendor: '',
  category: '',
  status: 'hidden',
  price: '',
  compareAtPrice: '',
  stockQty: '0',
  sku: '',
  stripeProductId: '',
  stripeDefaultPriceId: '',
  shippingInfo: '',
  returnAndExchange: '',
  shelfLife: '',
  disclaimer: '',
  usedWith: '',
  fdaCleared: false,
  securePackaging: false,
}

function CreateProductDialog({
  token,
  onClose,
  onCreated,
}: {
  token: string
  onClose: () => void
  onCreated: (product: AdminProduct) => void
}) {
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [variants, setVariants] = useState<VariantForm[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const handleSubmit = async () => {
    setError('')

    if (!form.name.trim()) {
      setError('Product name is required.')
      return
    }
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    if (!form.vendor.trim()) {
      setError('Vendor is required.')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('vendor', form.vendor.trim())
      formData.append('status', form.status)
      formData.append('stockQty', form.stockQty || '0')
      if (form.category.trim()) formData.append('category', form.category.trim())
      if (form.price.trim()) formData.append('price', form.price.trim())
      if (form.compareAtPrice.trim()) formData.append('compareAtPrice', form.compareAtPrice.trim())
      if (form.sku.trim()) formData.append('sku', form.sku.trim())
      if (form.stripeProductId.trim()) formData.append('stripeProductId', form.stripeProductId.trim())
      if (form.stripeDefaultPriceId.trim()) formData.append('stripeDefaultPriceId', form.stripeDefaultPriceId.trim())
      if (form.shippingInfo.trim()) formData.append('shippingInfo', form.shippingInfo.trim())
      if (form.returnAndExchange.trim()) formData.append('returnAndExchange', form.returnAndExchange.trim())
      if (form.shelfLife.trim()) formData.append('shelfLife', form.shelfLife.trim())
      if (form.disclaimer.trim()) formData.append('disclaimer', form.disclaimer.trim())
      if (form.usedWith.trim()) formData.append('usedWith', form.usedWith.trim())
      formData.append('fdaCleared', String(form.fdaCleared))
      formData.append('securePackaging', String(form.securePackaging))
      if (imageFile) formData.append('image', imageFile)

      const validVariants = variants.filter((v) => v.label.trim())
      if (validVariants.length) {
        formData.append(
          'variants',
          JSON.stringify(
            validVariants.map((v) => ({
              label: v.label.trim(),
              price: v.price.trim() ? Number(v.price) : null,
              sku: v.sku.trim() || null,
              stripePriceId: v.stripePriceId.trim() || null,
            })),
          ),
        )
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/commerce/products`, {
        method: 'POST',
        headers: authHeaders(token),
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create product')
      onCreated(json.data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content dialog-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Add product</h2>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-field">
            <label htmlFor="product-name">Title</label>
            <input
              id="product-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="dialog-field">
            <label htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="product-vendor">Vendor</label>
              <input
                id="product-vendor"
                type="text"
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              />
              <p className="dialog-hint">Cannot be changed after the product is created.</p>
            </div>
            <div className="dialog-field">
              <label htmlFor="product-category">Category</label>
              <input
                id="product-category"
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="product-status">Status</label>
              <select
                id="product-status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'hidden' }))}
              >
                <option value="hidden">Hidden</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="dialog-field">
              <label htmlFor="product-stock">Stock quantity</label>
              <input
                id="product-stock"
                type="number"
                min={0}
                value={form.stockQty}
                onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))}
              />
            </div>
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="product-price">Price (USD)</label>
              <input
                id="product-price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="dialog-field">
              <label htmlFor="product-compare-price">Compare-at price (optional)</label>
              <input
                id="product-compare-price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.compareAtPrice}
                onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
              />
            </div>
          </div>

          <div className="dialog-field">
            <label htmlFor="product-sku">SKU (optional)</label>
            <input
              id="product-sku"
              type="text"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            />
          </div>

          <div className="dialog-field">
            <label htmlFor="product-image">Image</label>
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="dialog-field">
            <label htmlFor="product-shipping">Shipping info (optional)</label>
            <textarea
              id="product-shipping"
              rows={2}
              value={form.shippingInfo}
              onChange={(e) => setForm((f) => ({ ...f, shippingInfo: e.target.value }))}
            />
          </div>

          <div className="dialog-field">
            <label htmlFor="product-return">Return &amp; exchange (optional)</label>
            <textarea
              id="product-return"
              rows={2}
              value={form.returnAndExchange}
              onChange={(e) => setForm((f) => ({ ...f, returnAndExchange: e.target.value }))}
            />
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="product-shelf-life">Shelf life (optional)</label>
              <input
                id="product-shelf-life"
                type="text"
                value={form.shelfLife}
                onChange={(e) => setForm((f) => ({ ...f, shelfLife: e.target.value }))}
              />
            </div>
            <div className="dialog-field">
              <label htmlFor="product-used-with">Used with (optional)</label>
              <input
                id="product-used-with"
                type="text"
                value={form.usedWith}
                onChange={(e) => setForm((f) => ({ ...f, usedWith: e.target.value }))}
              />
            </div>
          </div>

          <div className="dialog-field">
            <label htmlFor="product-disclaimer">Disclaimer (optional)</label>
            <textarea
              id="product-disclaimer"
              rows={2}
              value={form.disclaimer}
              onChange={(e) => setForm((f) => ({ ...f, disclaimer: e.target.value }))}
            />
          </div>

          <div className="dialog-checkbox-row">
            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={form.fdaCleared}
                onChange={(e) => setForm((f) => ({ ...f, fdaCleared: e.target.checked }))}
              />
              FDA cleared
            </label>
            <label className="dialog-checkbox">
              <input
                type="checkbox"
                checked={form.securePackaging}
                onChange={(e) => setForm((f) => ({ ...f, securePackaging: e.target.checked }))}
              />
              Secure packaging
            </label>
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="product-stripe-product">Stripe product ID (optional)</label>
              <input
                id="product-stripe-product"
                type="text"
                placeholder="prod_..."
                value={form.stripeProductId}
                onChange={(e) => setForm((f) => ({ ...f, stripeProductId: e.target.value }))}
              />
              <p className="dialog-hint">Informational only — not used at checkout.</p>
            </div>
            <div className="dialog-field">
              <label htmlFor="product-stripe-price">Stripe default price ID (optional)</label>
              <input
                id="product-stripe-price"
                type="text"
                placeholder="price_..."
                value={form.stripeDefaultPriceId}
                onChange={(e) => setForm((f) => ({ ...f, stripeDefaultPriceId: e.target.value }))}
              />
              <p className="dialog-hint">Must be a real, active Stripe Price — checkout charges this, not the price above.</p>
            </div>
          </div>

          <div className="dialog-field">
            <div className="dialog-section-label">
              <span>Variants (optional)</span>
              <button
                type="button"
                className="dash-filter-btn"
                onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
              >
                Add variant
              </button>
            </div>

            {variants.map((variant, index) => (
              <div className="dialog-variant-row" key={index}>
                <div className="dialog-field">
                  <label>Label</label>
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(e) => updateVariant(index, { label: e.target.value })}
                  />
                </div>
                <div className="dialog-field">
                  <label>Price</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, { price: e.target.value })}
                  />
                </div>
                <div className="dialog-field">
                  <label>SKU</label>
                  <input type="text" value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                </div>
                <div className="dialog-field">
                  <label>Stripe price ID</label>
                  <input
                    type="text"
                    value={variant.stripePriceId}
                    onChange={(e) => updateVariant(index, { stripePriceId: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="dialog-variant-remove"
                  aria-label="Remove variant"
                  onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          {error && <p className="dialog-error">{error}</p>}
        </div>

        <div className="dialog-footer">
          <button type="button" className="dash-filter-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="dash-filter-btn dash-filter-btn-primary"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Creating…' : 'Create product'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Products({ token }: ProductsProps) {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()
  const navigate = useNavigate()
  const [health, setHealth] = useState<{ healthy: number; low: number; out: number } | null>(null)

  // Stock health for the band comes from the inventory feed, which covers every product.
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/admin/commerce/inventory`, { headers: authHeaders(token) })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return
        const rows: { available: number; lowStockThreshold?: number }[] = json.data ?? []
        const out = rows.filter((r) => r.available <= 0).length
        const low = rows.filter((r) => r.available > 0 && r.available <= (r.lowStockThreshold ?? 5)).length
        setHealth({ healthy: rows.length - out - low, low, out })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [token])

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
      <div className="dash-content-header">
        <h1>Products</h1>
        {!loading && !error && (
          <span className="dash-count">
            {total.toLocaleString('en-US')} {total === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      <LedgerBand
        caption="Stock health"
        total={health ? health.healthy + health.low + health.out : 0}
        totalLabel="products"
        loading={!health}
        segments={[
          { key: 'healthy', label: 'In stock', value: health?.healthy ?? 0, color: '#ffffff' },
          { key: 'low', label: 'Low stock', value: health?.low ?? 0, color: '#f3c77a' },
          { key: 'out', label: 'Out of stock', value: health?.out ?? 0, color: '#e8566d' },
        ]}
        flags={[
          {
            key: 'review',
            label: 'Review in Inventory',
            value: (health?.low ?? 0) + (health?.out ?? 0),
            onClick: () => navigate('/products/inventory', { state: { stockFilter: (health?.out ?? 0) > 0 ? 'out' : 'low' } }),
          },
        ]}
      />

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
          <button type="button" className="dash-filter-btn dash-filter-btn-primary" onClick={() => setDialogOpen(true)}>
            Add product
          </button>
        </div>

        {loading ? (
          <div className="products-empty">Loading products&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : products.length === 0 ? (
          <div className="products-empty">No products found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table products-list-table">
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
                {products.map((product, index) => {
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
                      <td>
                        <StockLevel qty={product.stockQty} threshold={product.lowStockThreshold} index={index} />
                      </td>
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

      {dialogOpen && (
        <CreateProductDialog
          token={token}
          onClose={() => setDialogOpen(false)}
          onCreated={(product) => setProducts((prev) => [product, ...prev])}
        />
      )}
    </>
  )
}

export default Products
