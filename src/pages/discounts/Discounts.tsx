import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  IconClose,
  IconSearch,
  IconTrash,
  authHeaders,
} from '../products/shared'
import GradScale from '../../components/GradScale'
import LedgerBand from '../../components/LedgerBand'
import '../products/Products.css'

interface DiscountsProps {
  token: string
}

type DiscountType = 'FIXED' | 'PERCENTAGE'
type DiscountApplicableTo = 'TRAINING' | 'PRODUCTS' | 'BOTH'

interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  applicableTo: DiscountApplicableTo
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

const APPLICABLE_LABEL: Record<DiscountApplicableTo, string> = {
  TRAINING: 'Training programs',
  PRODUCTS: 'Products',
  BOTH: 'Both',
}

function formatValue(discount: Pick<DiscountCode, 'type' | 'value'>) {
  return discount.type === 'PERCENTAGE' ? `${discount.value}% off` : `$${discount.value} off`
}

function formatDate(value: string | null) {
  if (!value) return 'No expiration'
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isExpired(value: string | null) {
  return value ? new Date(value) < new Date() : false
}

interface FormState {
  code: string
  type: DiscountType
  value: string
  applicableTo: DiscountApplicableTo
  maxUses: string
  expiresAt: string
}

const EMPTY_FORM: FormState = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  applicableTo: 'BOTH',
  maxUses: '',
  expiresAt: '',
}

function CreateDiscountDialog({
  token,
  onClose,
  onCreated,
}: {
  token: string
  onClose: () => void
  onCreated: (discount: DiscountCode) => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')

    const code = form.code.trim().toUpperCase()
    if (code.length !== 6) {
      setError('Code must be exactly 6 characters.')
      return
    }
    const value = Number(form.value)
    if (!form.value || isNaN(value) || value <= 0) {
      setError('Value must be a positive number.')
      return
    }
    if (form.type === 'PERCENTAGE' && value > 100) {
      setError('Percentage cannot exceed 100.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/discounts`, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify({
          code,
          type: form.type,
          value,
          applicableTo: form.applicableTo,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create discount code')
      onCreated(json.data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create discount code')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Create discount code</h2>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <div className="dialog-body">
          <div className="dialog-field">
            <label htmlFor="discount-code">Code</label>
            <input
              id="discount-code"
              type="text"
              maxLength={6}
              placeholder="e.g. SAVE10"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
            <p className="dialog-hint">Exactly 6 characters. Will be uppercased.</p>
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="discount-type">Type</label>
              <select
                id="discount-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DiscountType }))}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </div>
            <div className="dialog-field">
              <label htmlFor="discount-value">Value</label>
              <input
                id="discount-value"
                type="number"
                min={0}
                max={form.type === 'PERCENTAGE' ? 100 : undefined}
                placeholder={form.type === 'PERCENTAGE' ? '20' : '10'}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
          </div>

          <div className="dialog-field">
            <label htmlFor="discount-applicable">Applies to</label>
            <select
              id="discount-applicable"
              value={form.applicableTo}
              onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value as DiscountApplicableTo }))}
            >
              <option value="BOTH">Both</option>
              <option value="TRAINING">Training programs</option>
              <option value="PRODUCTS">Products</option>
            </select>
          </div>

          <div className="dialog-field-row">
            <div className="dialog-field">
              <label htmlFor="discount-max-uses">Max uses (optional)</label>
              <input
                id="discount-max-uses"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              />
            </div>
            <div className="dialog-field">
              <label htmlFor="discount-expires">Expires (optional)</label>
              <input
                id="discount-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
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
            {saving ? 'Creating…' : 'Create code'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Discounts({ token }: DiscountsProps) {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/discounts`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load discount codes')
        }
        if (!cancelled) setDiscounts(json.data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load discount codes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleToggle = async (discount: DiscountCode) => {
    setBusyId(discount.id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/discounts/${discount.id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(token),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update discount code')
      setDiscounts((prev) => prev.map((d) => (d.id === discount.id ? json.data : d)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update discount code')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (discount: DiscountCode) => {
    if (!window.confirm(`Delete discount code ${discount.code}? This cannot be undone.`)) return
    setBusyId(discount.id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/discounts/${discount.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete discount code')
      setDiscounts((prev) => prev.filter((d) => d.id !== discount.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete discount code')
    } finally {
      setBusyId(null)
    }
  }

  const query = search.trim().toLowerCase()
  const filtered = query ? discounts.filter((d) => d.code.toLowerCase().includes(query)) : discounts
  const expiredCount = discounts.filter((d) => isExpired(d.expiresAt)).length
  const activeCount = discounts.filter((d) => d.isActive && !isExpired(d.expiresAt)).length
  const redemptions = discounts.reduce((n, d) => n + d.usedCount, 0)

  return (
    <>
      <div className="dash-content-header">
        <h1>Discounts</h1>
        {!loading && !error && (
          <span className="dash-count">
            {(discounts.length).toLocaleString('en-US')} {(discounts.length) === 1 ? 'code' : 'codes'}
          </span>
        )}
      </div>

      {!error && (
        <LedgerBand
          caption="Discount codes"
          total={discounts.length}
          totalLabel={discounts.length === 1 ? 'code' : 'codes'}
          loading={loading}
          segments={[
            { key: 'active', label: 'Active', value: activeCount, color: '#7fd1a8' },
            { key: 'inactive', label: 'Paused', value: discounts.length - activeCount - expiredCount, color: '#8ea7d6' },
            { key: 'expired', label: 'Expired', value: expiredCount, color: 'rgba(255, 255, 255, 0.3)' },
          ]}
          flags={[{ key: 'redemptions', label: 'Times redeemed', value: redemptions, tone: 'info' }]}
        />
      )}

      <div className="products-card products-list-card">
        <div className="products-toolbar">
          <div className="products-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search by code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="dash-filter-btn dash-filter-btn-primary" onClick={() => setDialogOpen(true)}>
            Create discount code
          </button>
        </div>

        {loading ? (
          <div className="products-empty">Loading discount codes&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="products-empty">
            {discounts.length === 0 ? 'No discount codes yet.' : 'No codes match your search.'}
          </div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Value</th>
                  <th>Applies to</th>
                  <th>Expires</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((discount) => {
                  const expired = isExpired(discount.expiresAt)
                  return (
                    <tr key={discount.id}>
                      <td>
                        <span className="discount-code-chip">{discount.code}</span>
                      </td>
                      <td>{formatValue(discount)}</td>
                      <td>{APPLICABLE_LABEL[discount.applicableTo]}</td>
                      <td>
                        {formatDate(discount.expiresAt)}
                        {expired && <span className="products-cell-sub">Expired</span>}
                      </td>
                      <td>
                        <span className="seat-scale">
                          <span className="seat-scale-label">
                            {discount.usedCount}
                            {discount.maxUses ? ` / ${discount.maxUses}` : ' used'}
                          </span>
                          {discount.maxUses ? (
                            <GradScale
                              fill={discount.usedCount / discount.maxUses}
                              majors={4}
                              minorsPerMajor={2}
                              tone={discount.usedCount >= discount.maxUses ? 'crimson' : 'navy'}
                              width={88}
                              label={`${discount.usedCount} of ${discount.maxUses} uses`}
                            />
                          ) : (
                            <span className="products-cell-sub">No limit</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`products-status ${discount.isActive && !expired ? 'products-status-active' : 'products-status-hidden'}`}
                        >
                          {discount.isActive && !expired ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="products-row-actions">
                          <button
                            type="button"
                            className="dash-filter-btn"
                            disabled={busyId === discount.id}
                            onClick={() => handleToggle(discount)}
                          >
                            {discount.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="products-icon-btn products-icon-btn-danger"
                            aria-label="Delete"
                            disabled={busyId === discount.id}
                            onClick={() => handleDelete(discount)}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialogOpen && (
        <CreateDiscountDialog
          token={token}
          onClose={() => setDialogOpen(false)}
          onCreated={(discount) => setDiscounts((prev) => [discount, ...prev])}
        />
      )}
    </>
  )
}

export default Discounts
