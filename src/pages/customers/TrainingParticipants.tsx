import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL, IconArrowLeft, authHeaders } from '../products/shared'
import Avatar from '../../components/Avatar'
import LedgerBand from '../../components/LedgerBand'
import '../products/Products.css'

interface TrainingParticipantsProps {
  token: string
}

interface TrainingSummary {
  id: string
  title: string
  level: string
  scheduledAt: string | null
  location?: string | null
  maxEnrollees?: number
  maxObservers?: number
}

interface Enrollee {
  id: string
  type: 'ENROLLEE' | 'OBSERVER'
  paymentStatus: string
  paidAmount: number | null
  user: { id: string; fullName: string; email: string; phoneNumber: string }
  salesRep: { id: string; fullName: string } | null
}

interface ParticipantRow extends Enrollee {
  orderCount: number | null
  amountSpent: number | null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function TrainingParticipants({ token }: TrainingParticipantsProps) {
  const { trainingId } = useParams<{ trainingId: string }>()
  const navigate = useNavigate()
  const [training, setTraining] = useState<TrainingSummary | null>(null)
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!trainingId) return
    let cancelled = false
    setLoading(true)
    setError('')

    async function load() {
      try {
        const [trainingRes, enrolleesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/trainings/${trainingId}`, { headers: authHeaders(token) }),
          fetch(`${API_BASE_URL}/api/admin/trainings/${trainingId}/enrollees`, { headers: authHeaders(token) }),
        ])
        const trainingJson = await trainingRes.json()
        const enrolleesJson = await enrolleesRes.json()
        if (!trainingRes.ok || !trainingJson.success) {
          throw new Error(trainingJson.message || 'Failed to load training program')
        }
        if (!enrolleesRes.ok || !enrolleesJson.success) {
          throw new Error(enrolleesJson.message || 'Failed to load participants')
        }

        const enrollees: Enrollee[] = enrolleesJson.data ?? []

        const customerDetails = await Promise.all(
          enrollees.map((enrollee) =>
            fetch(`${API_BASE_URL}/api/admin/commerce/customers/${enrollee.user.id}`, {
              headers: authHeaders(token),
            })
              .then((res) => res.json())
              .catch(() => null),
          ),
        )

        const rows: ParticipantRow[] = enrollees.map((enrollee, index) => {
          const detail = customerDetails[index]
          const ok = detail?.success
          return {
            ...enrollee,
            orderCount: ok ? detail.data.totalOrders : null,
            amountSpent: ok ? detail.data.totalSpent : null,
          }
        })

        if (!cancelled) {
          setTraining(trainingJson.data)
          setParticipants(rows)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load training program')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token, trainingId])

  return (
    <>
      <div className="dash-content-header">
        <div className="product-detail-heading">
          <button type="button" className="product-detail-back" onClick={() => navigate('/customers/segments')}>
            <IconArrowLeft />
            Segments
          </button>
          <h1>{training?.title ?? 'Training program'}</h1>
          {training && (
            <p className="training-meta">
              {[
                training.level,
                training.location,
                training.scheduledAt
                  ? new Date(training.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {!error && (
        <LedgerBand
          caption="Seats"
          total={(training?.maxEnrollees ?? 0) + (training?.maxObservers ?? 0)}
          totalLabel="seats"
          loading={loading}
          segments={[
            {
              key: 'enrollees',
              label: 'Enrollees',
              value: participants.filter((p) => p.type === 'ENROLLEE').length,
              color: '#ffffff',
            },
            {
              key: 'observers',
              label: 'Observers',
              value: participants.filter((p) => p.type === 'OBSERVER').length,
              color: '#8ea7d6',
            },
            {
              key: 'open',
              label: 'Open',
              value: Math.max((training?.maxEnrollees ?? 0) + (training?.maxObservers ?? 0) - participants.length, 0),
              color: 'rgba(255, 255, 255, 0.3)',
            },
          ]}
        />
      )}

      <div className="products-card products-list-card">
        {loading ? (
          <div className="products-empty">Loading participants&hellip;</div>
        ) : error ? (
          <div className="products-empty products-error">{error}</div>
        ) : participants.length === 0 ? (
          <div className="products-empty">No participants yet.</div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Sales rep</th>
                  <th>Orders</th>
                  <th>Amount spent</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="person-cell">
                        <Avatar name={p.user.fullName} />
                        <span className="person-name">{p.user.fullName}</span>
                      </span>
                    </td>
                    <td>{p.user.email}</td>
                    <td>
                      <span className={`participant-type participant-${p.type.toLowerCase()}`}>
                        {p.type === 'ENROLLEE' ? 'Enrollee' : 'Observer'}
                      </span>
                    </td>
                    <td>{p.salesRep?.fullName || '—'}</td>
                    <td>{p.orderCount ?? '—'}</td>
                    <td>{p.amountSpent != null ? formatCurrency(p.amountSpent) : '—'}</td>
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

export default TrainingParticipants
