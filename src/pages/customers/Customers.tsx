import { useEffect, useState } from 'react'
import { API_BASE_URL, IconSearch, Pagination, authHeaders, usePagedSearch } from '../products/shared'
import Avatar from '../../components/Avatar'
import LedgerBand from '../../components/LedgerBand'
import '../products/Products.css'

interface CustomersProps {
  token: string
}

interface AdminCustomer {
  id: string
  name: string
  email: string
  orderCount: number
  amountSpent: number
  location: string | null
  profilePicturePath?: string | null
}

const PAGE_LIMIT = 20

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function Customers({ token }: CustomersProps) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch()
  const [roles, setRoles] = useState<{ med: number; user: number } | null>(null)

  // Customer mix for the band: one total per role.
  useEffect(() => {
    let cancelled = false
    const count = (role: string) =>
      fetch(`${API_BASE_URL}/api/admin/commerce/customers?limit=1&role=${role}`, { headers: authHeaders(token) })
        .then((res) => res.json())
        .then((json) => (json.success ? (json.data.total as number) : 0))
    Promise.all([count('medical_professional'), count('normal_user')])
      .then(([med, user]) => !cancelled && setRoles({ med, user }))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT), role: 'customers' })
    if (debouncedSearch) params.set('search', debouncedSearch)

    fetch(`${API_BASE_URL}/api/admin/commerce/customers?${params.toString()}`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load customers')
        }
        if (!cancelled) {
          setCustomers(json.data.items ?? [])
          setTotal(json.data.total ?? 0)
          setHasMore(json.data.hasMore ?? false)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load customers')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, page, debouncedSearch])

  return (
    <>
      <div className="dash-content-header">
        <h1>Customers</h1>
        {!loading && !error && (
          <span className="dash-count">
            {(total).toLocaleString('en-US')} {(total) === 1 ? 'customer' : 'customers'}
          </span>
        )}
      </div>

      <LedgerBand
        caption="Customer mix"
        total={roles ? roles.med + roles.user : 0}
        totalLabel="customers"
        loading={!roles}
        segments={[
          { key: 'med', label: 'Medical professionals', value: roles?.med ?? 0, color: '#ffffff' },
          { key: 'user', label: 'Other customers', value: roles?.user ?? 0, color: '#8ea7d6' },
        ]}
      />

      <div className="products-card products-list-card">
        <div className="products-toolbar">
          <div className="products-search">
            <IconSearch />
            <input
              type="text"
              placeholder="Search customers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="dash-filter-btn dash-filter-btn-primary">Add customer</button>
        </div>

        {loading ? (
          <div className="products-empty">Loading customers&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : customers.length === 0 ? (
          <div className="products-empty">No customers found.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Customer name</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Amount spent</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <span className="person-cell">
                        <Avatar name={customer.name} photoPath={customer.profilePicturePath} token={token} />
                        <span className="person-name">{customer.name}</span>
                      </span>
                    </td>
                    <td>{customer.email}</td>
                    <td>{customer.orderCount}</td>
                    <td className={customer.amountSpent > 0 ? 'customers-spent' : 'customers-spent-none'}>
                      {formatCurrency(customer.amountSpent)}
                    </td>
                    <td>{customer.location || '—'}</td>
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

export default Customers
