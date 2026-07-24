import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconArrowLeft,
  authHeaders,
  hideBrokenImage,
  resolveImageUrl,
  type AdminProduct,
  type AdminProductVariant,
} from './shared'
import './Products.css'

interface ProductDetailProps {
  id: string
  token: string
  onBack: () => void
  onSaved: (product: AdminProduct) => void
}

interface VariantRowProps {
  productId: string
  token: string
  variant: AdminProductVariant
  onUpdated: (product: AdminProduct) => void
}

function VariantRow({ productId, token, variant, onUpdated }: VariantRowProps) {
  const baseline = variant.stockQty ?? 0
  const [stockInput, setStockInput] = useState(String(baseline))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const dirty = (Number(stockInput) || 0) !== baseline

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/commerce/products/${productId}/variants/${variant.id}/stock`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify({ stockQty: Number(stockInput) || 0 }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update stock')
      setSaved(true)
      onUpdated(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr>
      <td>{variant.label || 'Default'}</td>
      <td>{variant.sku || '—'}</td>
      <td>{variant.price != null ? `$${variant.price.toFixed(2)}` : '—'}</td>
      <td>
        <input
          type="number"
          min={0}
          className="variant-stock-input"
          value={stockInput}
          onChange={(e) => {
            setStockInput(e.target.value)
            setSaved(false)
          }}
          onBlur={() => {
            if (stockInput.trim() === '') setStockInput(String(baseline))
          }}
        />
      </td>
      <td>
        <button type="button" className="dash-filter-btn variant-save-btn" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
        {error && <p className="variant-row-error">{error}</p>}
      </td>
    </tr>
  )
}

function ProductDetail({ id, token, onBack, onSaved }: ProductDetailProps) {
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'hidden'>('active')
  const [category, setCategory] = useState('')
  const [stockInput, setStockInput] = useState('0')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')

    fetch(`${API_BASE_URL}/api/admin/commerce/products/${id}`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load product')
        if (cancelled) return
        const p: AdminProduct = json.data
        setProduct(p)
        setName(p.name)
        setDescription(p.description)
        setStatus(p.visibilityStatus)
        setCategory(p.category ?? '')
        setStockInput(String(p.stockQty))
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load product')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, token])

  const applyUpdatedProduct = (updated: AdminProduct) => {
    setProduct(updated)
    onSaved(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setJustSaved(false)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/commerce/products/${id}`, {
        method: 'PATCH',
        headers: authHeaders(token, true),
        body: JSON.stringify({
          name,
          description,
          category: category.trim() ? category.trim() : null,
          status,
          stockQty: Number(stockInput) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save product')
      applyUpdatedProduct(json.data)
      setJustSaved(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="products-empty">Loading product&hellip;</div>
  }

  if (!product) {
    return <div className="products-empty products-error">{loadError || 'Product not found.'}</div>
  }

  const image = resolveImageUrl(product.imageUrl)

  return (
    <>
      <div className="dash-content-header">
        <div className="product-detail-heading">
          <button type="button" className="product-detail-back" onClick={onBack}>
            <IconArrowLeft />
            Products
          </button>
          <h1>{name || product.name}</h1>
        </div>
        <div className="dash-filters">
          {justSaved && <span className="product-detail-saved">Saved</span>}
          <button type="button" className="dash-filter-btn dash-filter-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && <div className="products-empty products-error">{saveError}</div>}

      <div className="product-detail-grid">
        <div className="product-detail-main">
          <div className="products-card product-detail-section">
            <label className="product-detail-label" htmlFor="product-title">Title</label>
            <input id="product-title" type="text" value={name} onChange={(e) => setName(e.target.value)} />

            <label className="product-detail-label" htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="products-card product-detail-section">
              <p className="product-detail-label">Variants</p>
              <p className="product-detail-hint">Update stock per variant. Each row saves independently.</p>
              <div className="products-table-wrap">
                <table className="products-table variant-table">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => (
                      <VariantRow
                        key={variant.id}
                        productId={product.id}
                        token={token}
                        variant={variant}
                        onUpdated={applyUpdatedProduct}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="products-card product-detail-section">
            <p className="product-detail-label">Media</p>
            <div className="product-detail-media">
              {image ? (
                <img src={image} alt={product.name} onError={hideBrokenImage} />
              ) : (
                <div className="product-detail-media-empty">No image</div>
              )}
            </div>
          </div>
        </div>

        <div className="product-detail-side">
          <div className="products-card product-detail-section">
            <label className="product-detail-label" htmlFor="product-status">Status</label>
            <select id="product-status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="products-card product-detail-section">
            <label className="product-detail-label" htmlFor="product-stock">Stock quantity</label>
            <input
              id="product-stock"
              type="number"
              min={0}
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              onBlur={() => {
                if (stockInput.trim() === '') setStockInput('0')
              }}
            />
          </div>

          <div className="products-card product-detail-section">
            <label className="product-detail-label" htmlFor="product-category">Category</label>
            <input id="product-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />

            <p className="product-detail-label">Vendor</p>
            <p className="product-detail-readonly">{product.vendor || '—'}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductDetail
