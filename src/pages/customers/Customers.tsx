import { useEffect, useState } from 'react'
import { API_BASE_URL, IconSearch, authHeaders } from '../products/shared'
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
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function Customers({ token }: CustomersProps) {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/admin/commerce/customers?limit=50&role=customers`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load customers')
        }
        if (!cancelled) setCustomers(json.data.items ?? [])
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
  }, [token])

  const query = search.trim().toLowerCase()
  const filtered = query
    ? customers.filter((c) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
    : customers

  return (
    <>
      <div className="dash-content-header">
        <h1>Customers</h1>
        <div className="dash-filters">
          <button type="button" className="dash-filter-btn dash-filter-btn-primary">Add customer</button>
        </div>
      </div>

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
        </div>

        {loading ? (
          <div className="products-empty">Loading customers&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : filtered.length === 0 ? (
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
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.orderCount}</td>
                    <td>{formatCurrency(customer.amountSpent)}</td>
                    <td>{customer.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default Customers
