import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  IconArrowLeft,
  IconClose,
  IconProductPlaceholder,
  IconSearch,
  IconTrash,
  hideBrokenImage,
  resolveImageUrl,
} from '../../products/shared'
import DraftStatusScale from './DraftStatus'
import { useDebounced, useRemote } from './useRemote'
import {
  SHIPPING_METHOD_LABEL,
  draftsRequest,
  formatUsd,
  initialsOf,
  type Address,
  type DraftCustomer,
  type DraftOrder,
  type DraftQuote,
  type DraftShippingMethod,
  type LookupProduct,
} from './shared'
import '../../products/Products.css'
import '../Orders.css'
import './Drafts.css'

interface DraftEditorProps {
  token: string
  canSeeOrders: boolean
}

interface Line {
  key: string
  productId: string
  variantId: string | null
  quantity: number
  name: string
  variantLabel: string | null
  sku: string | null
  unitPrice: number | null
  available: number
  imageUrl: string | null
}

interface AddressForm {
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  country: string
}

const EMPTY_ADDRESS: AddressForm = { address1: '', address2: '', city: '', state: '', zipCode: '', country: '' }

const toForm = (address: Address): AddressForm => ({
  address1: address.address1 ?? '',
  address2: address.address2 ?? '',
  city: address.city ?? '',
  state: address.state ?? '',
  zipCode: address.zipCode ?? '',
  country: address.country ?? '',
})

const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? ''}`

/* ── Customer picker ─────────────────────────────────────────── */

function CustomerPicker({ token, onPick }: { token: string; onPick: (customer: DraftCustomer) => void }) {
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)
  const path = `/lookup/customers?search=${encodeURIComponent(debounced)}`
  const lookup = useRemote(path, () => draftsRequest<DraftCustomer[]>(token, path))
  const results = (lookup.data ?? []).slice(0, 6)

  return (
    <div className="draft-picker">
      <div className="products-search draft-lookup-input">
        <IconSearch />
        <input
          type="text"
          placeholder="Search by name, practice, email, or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search medical professionals"
        />
      </div>
      <div className="draft-picker-list" role="listbox" aria-label="Medical professionals">
        {lookup.loading && !lookup.data ? (
          <p className="draft-lookup-note">Loading medical professionals&hellip;</p>
        ) : lookup.error ? (
          <p className="draft-lookup-note products-error">{lookup.error}</p>
        ) : results.length === 0 ? (
          <p className="draft-lookup-note">No active medical professionals match &ldquo;{query}&rdquo;.</p>
        ) : (
          results.map((customer) => {
            const place = [customer.practiceAddress.city, customer.practiceAddress.state].filter(Boolean).join(', ')
            return (
              <button
                key={customer.id}
                type="button"
                role="option"
                aria-selected={false}
                className="draft-picker-option"
                onClick={() => onPick(customer)}
              >
                <span className="drafts-avatar" aria-hidden="true">
                  {initialsOf(customer.name)}
                </span>
                <span className="draft-picker-copy">
                  <span className="draft-lookup-primary">{customer.name}</span>
                  <span className="draft-lookup-secondary">
                    {[customer.practiceName, place].filter(Boolean).join(' · ') || customer.email}
                  </span>
                </span>
                <span className="draft-picker-cta">Select</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ── Product adder: variants are listed as their own options ── */

type ProductOption = Omit<Line, 'quantity'>

function toOptions(products: LookupProduct[]): ProductOption[] {
  return products.flatMap((product): ProductOption[] =>
    product.variants.length > 0
      ? product.variants.map((variant) => ({
          key: lineKey(product.id, variant.id),
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantLabel: variant.label,
          sku: variant.sku,
          unitPrice: variant.price,
          available: variant.stockQty,
          imageUrl: product.imageUrl,
        }))
      : [
          {
            key: lineKey(product.id, null),
            productId: product.id,
            variantId: null,
            name: product.name,
            variantLabel: null,
            sku: product.sku,
            unitPrice: product.price,
            available: product.stockQty,
            imageUrl: product.imageUrl,
          },
        ],
  )
}

/** Shown while a draft has no lines: in-stock products to add with one click. */
function ProductQuickAdd({ token, onAdd }: { token: string; onAdd: (line: Omit<Line, 'key' | 'quantity'>) => void }) {
  const lookup = useRemote('/lookup/products?search=', () =>
    draftsRequest<LookupProduct[]>(token, '/lookup/products?search='),
  )
  const options = toOptions(lookup.data ?? [])
    .filter((option) => option.available > 0)
    .slice(0, 8)

  if (lookup.loading && !lookup.data) return <p className="draft-empty-lines">Loading products&hellip;</p>
  if (options.length === 0) return <p className="draft-empty-lines">No products in stock. Search above to add one.</p>

  return (
    <div className="draft-quick">
      <p className="draft-quick-title">In stock now</p>
      <div className="draft-quick-grid">
        {options.map(({ key, ...option }) => {
          const image = resolveImageUrl(option.imageUrl)
          return (
            <button key={key} type="button" className="draft-quick-item" onClick={() => onAdd(option)}>
              <span className="draft-quick-image">
                {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
              </span>
              <span className="draft-quick-copy">
                <span className="draft-quick-name">{option.name}</span>
                <span className="draft-quick-meta">
                  {option.variantLabel ? `${option.variantLabel} · ` : ''}
                  {option.available} in stock
                </span>
              </span>
              <span className="draft-quick-add" aria-hidden="true">
                +
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProductAdder({ token, onAdd }: { token: string; onAdd: (line: Omit<Line, 'key' | 'quantity'>) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounced(query)
  const path = `/lookup/products?search=${encodeURIComponent(debounced)}`
  const lookup = useRemote(open ? path : null, () => draftsRequest<LookupProduct[]>(token, path))
  const results = lookup.data ?? []
  const { loading, error } = lookup

  const options = toOptions(results)

  return (
    <div className="draft-lookup">
      <div className="products-search draft-lookup-input">
        <IconSearch />
        <input
          type="text"
          placeholder="Add a product by name, SKU, or category"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label="Search products"
        />
      </div>
      {open && (
        <div className="draft-lookup-menu" role="listbox">
          {loading && options.length === 0 ? (
            <p className="draft-lookup-note">Searching&hellip;</p>
          ) : error ? (
            <p className="draft-lookup-note products-error">{error}</p>
          ) : options.length === 0 ? (
            <p className="draft-lookup-note">No active products match.</p>
          ) : (
            options.map(({ key, ...option }) => (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={false}
                className="draft-lookup-option draft-lookup-product"
                disabled={option.available <= 0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAdd(option)}
              >
                <span className="draft-lookup-primary">
                  {option.name}
                  {option.variantLabel && <span className="draft-lookup-variant"> · {option.variantLabel}</span>}
                </span>
                {option.unitPrice != null && <span className="draft-lookup-meta num">{formatUsd(option.unitPrice)}</span>}
                <span className={`draft-lookup-secondary${option.available <= 0 ? ' draft-out' : ''}`}>
                  {option.available <= 0 ? 'Out of stock' : `${option.available} in stock`}
                  {option.sku ? ` · ${option.sku}` : ''}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ── Editor ─────────────────────────────────────────────────── */

function DraftEditor({ token, canSeeOrders }: DraftEditorProps) {
  const navigate = useNavigate()
  const { draftId } = useParams()
  const isNew = !draftId || draftId === 'new'

  const [draft, setDraft] = useState<DraftOrder | null>(null)

  const [customer, setCustomer] = useState<DraftCustomer | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS)
  const [shippingMethod, setShippingMethod] = useState<DraftShippingMethod>('GROUND')
  const [notes, setNotes] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState('')

  const [busy, setBusy] = useState<'' | 'save' | 'send' | 'resend' | 'cancel'>('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<'' | 'send' | 'cancel'>('')
  const [copied, setCopied] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editable = isNew || draft?.status === 'open'

  function applyDraft(next: DraftOrder) {
    setDraft(next)
    setCustomer(next.customer)
    setLines(
      next.items.map((item) => ({
        key: lineKey(item.productId, item.variantId),
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        name: item.productName,
        variantLabel: item.variantLabel,
        sku: item.sku,
        unitPrice: item.unitPrice,
        available: item.available,
        imageUrl: item.imageUrl,
      })),
    )
    const nextAddress = toForm(next.shippingAddress)
    setAddress(nextAddress)
    setShippingMethod(next.shippingMethod)
    setNotes(next.notes ?? '')
    setSavedSnapshot(
      JSON.stringify(
        buildPayload(next.customer, next.items.map((i) => ({ ...i })), nextAddress, next.shippingMethod, next.notes ?? ''),
      ),
    )
  }

  const loaded = useRemote(
    isNew ? null : `/${draftId}`,
    () => draftsRequest<DraftOrder>(token, `/${draftId}`),
    applyDraft,
  )
  const loading = loaded.loading && !draft
  const loadError = draft ? '' : (loaded.error ?? '')

  const payload = useMemo(
    () => buildPayload(customer, lines, address, shippingMethod, notes),
    [customer, lines, address, shippingMethod, notes],
  )
  const payloadJson = JSON.stringify(payload)
  const dirty = isNew ? Boolean(customer || lines.length) : payloadJson !== savedSnapshot
  const canPrice = editable && customer != null && lines.length > 0
  const debouncedPayload = useDebounced(payloadJson, 500)

  // Live pricing: the server prices the draft exactly as checkout would (Stripe price + UPS rate).
  const priced = useRemote(canPrice ? debouncedPayload : null, () =>
    draftsRequest<{ quote: DraftQuote | null; quoteError: string | null }>(token, '/quote', {
      method: 'POST',
      body: debouncedPayload,
    }),
  )
  const quoting = canPrice && (priced.loading || debouncedPayload !== payloadJson)
  const quote = canPrice && !quoting ? (priced.data?.quote ?? null) : null
  const quoteError = canPrice && !quoting ? (priced.error ?? priced.data?.quoteError ?? '') : ''

  // Prefer the price Stripe will charge (from the live quote) over the catalog price.
  const quotedPrices = new Map(
    (priced.data?.quote?.items ?? []).map((item) => [lineKey(item.productId, item.variantId), item.unitPriceUsd]),
  )
  const priceOf = (line: Line) => (editable ? (quotedPrices.get(line.key) ?? line.unitPrice) : line.unitPrice)
  const listedSubtotal = lines.reduce((sum, line) => sum + (priceOf(line) ?? 0) * line.quantity, 0)
  const stockProblem = lines.find((line) => line.quantity > line.available)
  const addressComplete = Boolean(address.address1 && address.city && address.state && address.zipCode && address.country)

  function pickCustomer(next: DraftCustomer) {
    setCustomer(next)
    setAddress(toForm(next.practiceAddress))
  }

  function addLine(option: Omit<Line, 'key' | 'quantity'>) {
    const key = lineKey(option.productId, option.variantId)
    setLines((prev) =>
      prev.some((line) => line.key === key)
        ? prev.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line))
        : [...prev, { ...option, key, quantity: 1 }],
    )
  }

  async function save(): Promise<DraftOrder | null> {
    setBusy('save')
    setActionError('')
    setNotice('')
    try {
      const saved = isNew
        ? await draftsRequest<DraftOrder>(token, '', { method: 'POST', body: payloadJson })
        : await draftsRequest<DraftOrder>(token, `/${draftId}`, { method: 'PATCH', body: payloadJson })
      applyDraft(saved)
      if (isNew) navigate(`/orders/drafts/${saved.id}`, { replace: true })
      else setNotice('Draft saved.')
      return saved
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save draft')
      return null
    } finally {
      setBusy('')
    }
  }

  async function send() {
    setConfirm('')
    let id = draftId
    if (isNew || dirty) {
      const saved = await save()
      if (!saved) return
      id = saved.id
    }
    setBusy('send')
    setActionError('')
    try {
      const sent = await draftsRequest<DraftOrder>(token, `/${id}/send`, { method: 'POST' })
      applyDraft(sent)
      setNotice(
        sent.emailSent
          ? `Payment link emailed to ${sent.customer.email}.`
          : 'The order was created, but the email could not be sent. Copy the link below and share it directly.',
      )
      if (isNew) navigate(`/orders/drafts/${sent.id}`, { replace: true })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send payment link')
    } finally {
      setBusy('')
    }
  }

  async function resend() {
    setBusy('resend')
    setActionError('')
    setNotice('')
    try {
      const sent = await draftsRequest<DraftOrder>(token, `/${draftId}/resend`, { method: 'POST' })
      applyDraft(sent)
      setNotice(
        sent.emailSent
          ? `A new payment link was emailed to ${sent.customer.email}. The previous link no longer works.`
          : 'A new link was created, but the email could not be sent. Copy it below.',
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send a new link')
    } finally {
      setBusy('')
    }
  }

  async function cancelDraft() {
    setConfirm('')
    setBusy('cancel')
    setActionError('')
    setNotice('')
    try {
      applyDraft(await draftsRequest<DraftOrder>(token, `/${draftId}/cancel`, { method: 'POST' }))
      setNotice('Draft cancelled.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel draft')
    } finally {
      setBusy('')
    }
  }

  async function copyLink() {
    if (!draft?.checkoutUrl) return
    try {
      await navigator.clipboard.writeText(draft.checkoutUrl)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setActionError('Copy failed. Select the link and copy it manually.')
    }
  }

  if (loading) return <div className="products-empty">Loading draft&hellip;</div>
  if (loadError) {
    return (
      <>
        <div className="dash-content-header">
          <div className="product-detail-heading">
            <button type="button" className="product-detail-back" onClick={() => navigate('/orders/drafts')}>
              <IconArrowLeft />
              Drafts
            </button>
          </div>
        </div>
        <div className="products-empty products-error">{loadError}</div>
      </>
    )
  }

  const status = draft?.status ?? 'open'
  const summary = editable
    ? quote
      ? { subtotal: quote.subtotalUsd, shipping: quote.shippingFeeUsd, total: quote.totalUsd }
      : null
    : draft && draft.totalAmount != null
      ? { subtotal: draft.subtotal, shipping: draft.shippingFee, total: draft.totalAmount }
      : null

  return (
    <>
      <div className="dash-content-header">
        <div className="product-detail-heading">
          <button type="button" className="product-detail-back" onClick={() => navigate('/orders/drafts')}>
            <IconArrowLeft />
            Drafts
          </button>
          <h1 className={draft ? 'num' : undefined}>{draft ? draft.draftNumber : 'New draft order'}</h1>
        </div>
        {draft && (
          <div className="orders-detail-header-scale">
            <DraftStatusScale status={status} width={220} showStations />
          </div>
        )}
      </div>

      {actionError && <div className="orders-banner-error">{actionError}</div>}
      {notice && <div className="draft-notice">{notice}</div>}

      <div className="product-detail-grid">
        <div className="product-detail-main">
          <section className="products-card product-detail-section">
            <h2 className="draft-section-title">Medical professional</h2>
            {customer ? (
              <div className="draft-customer">
                <span className="drafts-avatar draft-customer-avatar" aria-hidden="true">
                  {initialsOf(customer.name)}
                </span>
                <div className="draft-customer-copy">
                  <p className="draft-customer-name">{customer.name}</p>
                  {customer.practiceName && <p className="draft-customer-sub">{customer.practiceName}</p>}
                  <p className="draft-customer-sub">
                    {[customer.email, customer.phone].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {editable && (
                  <button type="button" className="dash-filter-btn" onClick={() => setCustomer(null)}>
                    Change
                  </button>
                )}
              </div>
            ) : (
              <CustomerPicker token={token} onPick={pickCustomer} />
            )}
          </section>

          <section className="products-card product-detail-section">
            <h2 className="draft-section-title">Products</h2>
            {editable && <ProductAdder token={token} onAdd={addLine} />}

            {lines.length === 0 ? (
              editable ? (
                <ProductQuickAdd token={token} onAdd={addLine} />
              ) : (
                <p className="draft-empty-lines">No products.</p>
              )
            ) : (
              <table className="products-table draft-lines">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="draft-col-qty">Qty</th>
                    <th className="draft-col-money">Price</th>
                    <th className="draft-col-money">Total</th>
                    {editable && <th className="draft-col-remove" aria-label="Remove" />}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const image = resolveImageUrl(line.imageUrl)
                    const short = line.quantity > line.available
                    return (
                      <tr key={line.key}>
                        <td>
                          <div className="products-cell-product">
                            <span className="products-thumb">
                              {image ? <img src={image} alt="" onError={hideBrokenImage} /> : <IconProductPlaceholder />}
                            </span>
                            <span className="draft-line-name">
                              <span>{line.name}</span>
                              <span className="products-cell-sub">
                                {[line.variantLabel, line.sku].filter(Boolean).join(' · ') || ' '}
                              </span>
                              {short && (
                                <span className="draft-line-warning">
                                  {line.available <= 0 ? 'Out of stock' : `Only ${line.available} in stock`}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="draft-col-qty">
                          {editable ? (
                            <input
                              type="number"
                              min={1}
                              max={999}
                              className="variant-stock-input draft-qty-input"
                              value={line.quantity}
                              aria-label={`Quantity of ${line.name}`}
                              onChange={(e) => {
                                const quantity = Math.max(1, Math.min(999, Math.floor(Number(e.target.value)) || 1))
                                setLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, quantity } : l)))
                              }}
                            />
                          ) : (
                            <span className="num">{line.quantity}</span>
                          )}
                        </td>
                        <td className="draft-col-money num">{formatUsd(priceOf(line))}</td>
                        <td className="draft-col-money num">
                          {priceOf(line) == null ? '—' : formatUsd(priceOf(line)! * line.quantity)}
                        </td>
                        {editable && (
                          <td className="draft-col-remove">
                            <button
                              type="button"
                              className="products-icon-btn products-icon-btn-danger"
                              aria-label={`Remove ${line.name}`}
                              onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                            >
                              <IconTrash />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="products-card product-detail-section">
            <label className="draft-section-title" htmlFor="draft-notes">
              Notes
            </label>
            <textarea
              id="draft-notes"
              rows={3}
              value={notes}
              readOnly={!editable}
              placeholder="Visible on the order. For example, the clinic's PO number."
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className="product-detail-side">
          <section className="products-card product-detail-section navy-panel" aria-label="Order total">
            <p className="navy-panel-caption">Order total</p>
            <p className="navy-panel-total" aria-live="polite">
              {summary ? formatUsd(summary.total) : quoting ? 'Pricing…' : <span className="navy-panel-empty">{formatUsd(0)}</span>}
            </p>
            <div className="navy-panel-ruler" aria-hidden="true">
              {Array.from({ length: 41 }, (_, i) => (
                <span key={i} className={i % 10 === 0 ? 'major' : i % 5 === 0 ? 'mid' : ''} />
              ))}
            </div>

            <dl className="navy-panel-lines">
              <dt>
                Subtotal
                {lines.length > 0 && (
                  <span className="navy-panel-sub">
                    {' '}
                    · {lines.reduce((n, l) => n + l.quantity, 0)} {lines.reduce((n, l) => n + l.quantity, 0) === 1 ? 'unit' : 'units'}
                  </span>
                )}
              </dt>
              <dd>{formatUsd(summary?.subtotal ?? (lines.length ? listedSubtotal : null))}</dd>
              <dt>
                <label htmlFor="draft-shipping-method">Shipping</label>
              </dt>
              <dd>{summary ? formatUsd(summary.shipping) : '—'}</dd>
            </dl>

            <select
              id="draft-shipping-method"
              className="navy-panel-select"
              value={shippingMethod}
              disabled={!editable}
              onChange={(e) => setShippingMethod(e.target.value as DraftShippingMethod)}
            >
              {Object.entries(SHIPPING_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {editable && (
              <>
                <p className={`navy-panel-note${quoteError ? ' navy-panel-error' : ''}`} aria-live="polite">
                  {!customer || lines.length === 0
                    ? 'Choose a medical professional and add products to see the total.'
                    : quoting
                      ? 'Updating total…'
                      : quoteError
                        ? quoteError
                        : 'Priced from Stripe with a live UPS rate. Credits are not applied.'}
                </p>
                <div className="navy-panel-actions">
                  <button
                    type="button"
                    className="dash-filter-btn dash-filter-btn-primary navy-panel-send"
                    onClick={() => setConfirm('send')}
                    disabled={busy !== '' || !customer || lines.length === 0 || !quote || Boolean(stockProblem)}
                  >
                    {busy === 'send' ? 'Sending…' : 'Send payment link'}
                  </button>
                  <button
                    type="button"
                    className="navy-panel-save"
                    onClick={() => void save()}
                    disabled={busy !== '' || !dirty || !customer || lines.length === 0}
                  >
                    {busy === 'save' ? 'Saving…' : dirty || isNew ? 'Save draft' : 'Saved'}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="products-card product-detail-section">
            <div className="draft-section-head">
              <h2 className="draft-section-title">Ship to</h2>
              {editable && customer && !editingAddress && (
                <button type="button" className="orders-label-link" onClick={() => setEditingAddress(true)}>
                  Edit
                </button>
              )}
            </div>
            {!customer ? (
              <p className="draft-hint">Filled in from the medical professional&rsquo;s practice address.</p>
            ) : editable && (editingAddress || !addressComplete) ? (
              <>
                {!addressComplete && (
                  <p className="draft-hint draft-hint-warn">Complete the address so shipping can be priced.</p>
                )}
                {(
                  [
                    ['address1', 'Address'],
                    ['address2', 'Suite, unit (optional)'],
                    ['city', 'City'],
                    ['state', 'State'],
                    ['zipCode', 'ZIP code'],
                    ['country', 'Country'],
                  ] as [keyof AddressForm, string][]
                ).map(([field, label]) => (
                  <div key={field} className="draft-field">
                    <label className="product-detail-label" htmlFor={`draft-${field}`}>
                      {label}
                    </label>
                    <input
                      id={`draft-${field}`}
                      type="text"
                      value={address[field]}
                      onChange={(e) => setAddress((prev) => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                {editingAddress && addressComplete && (
                  <button type="button" className="dash-filter-btn draft-address-done" onClick={() => setEditingAddress(false)}>
                    Done
                  </button>
                )}
              </>
            ) : (
              <address className="draft-address">
                <span className="draft-address-name">{customer.practiceName || customer.name}</span>
                <span>{[address.address1, address.address2].filter(Boolean).join(', ')}</span>
                <span>{[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}</span>
                <span>{address.country}</span>
              </address>
            )}
          </section>

          {draft && draft.status !== 'open' && (
            <section className="products-card product-detail-section">
              <h2 className="draft-section-title">Payment</h2>
              <dl className="orders-kv">
                <dt>Order</dt>
                <dd>
                  {draft.order ? (
                    canSeeOrders ? (
                      <button
                        type="button"
                        className="orders-label-link num"
                        onClick={() => navigate('/orders', { state: { orderId: draft.order!.id } })}
                      >
                        {draft.order.orderNumber}
                      </button>
                    ) : (
                      <span className="num">{draft.order.orderNumber}</span>
                    )
                  ) : (
                    '—'
                  )}
                </dd>
                <dt>Sent</dt>
                <dd>{draft.invoiceSentAt ? new Date(draft.invoiceSentAt).toLocaleString('en-US') : '—'}</dd>
                {draft.status === 'paid' && draft.order?.paidAt && (
                  <>
                    <dt>Paid</dt>
                    <dd>{new Date(draft.order.paidAt).toLocaleString('en-US')}</dd>
                  </>
                )}
                {(draft.status === 'link_sent' || draft.status === 'link_expired') && draft.checkoutExpiresAt && (
                  <>
                    <dt>{draft.status === 'link_expired' ? 'Expired' : 'Expires'}</dt>
                    <dd>{new Date(draft.checkoutExpiresAt).toLocaleString('en-US')}</dd>
                  </>
                )}
              </dl>

              {draft.checkoutUrl && (
                <div className="draft-link">
                  <input type="text" readOnly value={draft.checkoutUrl} aria-label="Payment link" onFocus={(e) => e.target.select()} />
                  <button type="button" className="dash-filter-btn" onClick={() => void copyLink()}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              {(draft.status === 'link_sent' || draft.status === 'link_expired') && (
                <div className="draft-payment-actions">
                  <button
                    type="button"
                    className={`dash-filter-btn${draft.status === 'link_expired' ? ' dash-filter-btn-primary' : ''}`}
                    onClick={() => void resend()}
                    disabled={busy !== ''}
                  >
                    {busy === 'resend' ? 'Sending…' : 'Send new link'}
                  </button>
                  <button
                    type="button"
                    className="dash-filter-btn orders-btn-danger"
                    onClick={() => setConfirm('cancel')}
                    disabled={busy !== ''}
                  >
                    Cancel order
                  </button>
                </div>
              )}
            </section>
          )}

          {draft && draft.status === 'open' && (
            <section className="products-card product-detail-section">
              <button
                type="button"
                className="dash-filter-btn orders-btn-danger draft-cancel-open"
                onClick={() => setConfirm('cancel')}
                disabled={busy !== ''}
              >
                Cancel draft
              </button>
            </section>
          )}
        </div>
      </div>

      {confirm && customer && (
        <div className="dialog-overlay" onClick={() => setConfirm('')}>
          <div
            className="dialog-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <h2 id="draft-confirm-title">{confirm === 'send' ? 'Send payment link?' : 'Cancel this draft?'}</h2>
              <button type="button" className="dialog-close" aria-label="Close" onClick={() => setConfirm('')}>
                <IconClose />
              </button>
            </div>
            <div className="dialog-body">
              {confirm === 'send' ? (
                <>
                  <p>
                    This creates an order for <strong>{customer.name}</strong> and emails a Stripe payment link to{' '}
                    <strong>{customer.email}</strong>.
                  </p>
                  <p className="dialog-hint">
                    Total {formatUsd(quote?.totalUsd)}. The link works for 23 hours; you can send a new one later.
                    Stock is taken only when the order is paid.
                  </p>
                </>
              ) : draft?.order ? (
                <p>
                  Order <span className="num">{draft.order.orderNumber}</span> will be cancelled and its payment link will stop
                  working.
                </p>
              ) : (
                <p>The draft will be kept for reference but can no longer be edited or sent.</p>
              )}
            </div>
            <div className="dialog-footer">
              <button type="button" className="dash-filter-btn" onClick={() => setConfirm('')}>
                Keep editing
              </button>
              <button
                type="button"
                className={`dash-filter-btn ${confirm === 'send' ? 'dash-filter-btn-primary' : 'orders-btn-danger'}`}
                onClick={() => void (confirm === 'send' ? send() : cancelDraft())}
              >
                {confirm === 'send' ? 'Send payment link' : draft?.order ? 'Cancel order' : 'Cancel draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function buildPayload(
  customer: DraftCustomer | null,
  lines: { productId: string; variantId: string | null; quantity: number }[],
  address: AddressForm,
  shippingMethod: DraftShippingMethod,
  notes: string,
) {
  return {
    customerId: customer?.id,
    items: lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
    shippingAddress1: address.address1,
    shippingAddress2: address.address2,
    shippingCity: address.city,
    shippingState: address.state,
    shippingZipCode: address.zipCode,
    shippingCountry: address.country,
    shippingMethod,
    notes,
  }
}

export default DraftEditor
