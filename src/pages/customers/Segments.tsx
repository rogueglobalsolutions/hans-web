import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL, IconSearch, authHeaders } from '../products/shared'
import Contest, { type AdminContestEntry } from './Contest'
import GradScale from '../../components/GradScale'
import LedgerBand from '../../components/LedgerBand'
import '../products/Products.css'

interface SegmentsProps {
  token: string
}

interface AdminTraining {
  id: string
  title: string
  level: string
  location: string | null
  scheduledAt: string | null
  maxEnrollees: number
  maxObservers: number
  _count: { enrollments: number }
}

interface TrainingProgramsProps {
  trainings: AdminTraining[]
  loading: boolean
  error: string
  tabs: ReactNode
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function SeatScale({ filled, capacity }: { filled: number; capacity: number }) {
  const full = capacity > 0 && filled >= capacity
  return (
    <span className="seat-scale">
      <span className={`seat-scale-label${full ? ' seat-scale-full' : ''}`}>
        {filled} / {capacity} {full ? 'full' : 'seats'}
      </span>
      <GradScale
        fill={capacity > 0 ? filled / capacity : 0}
        majors={Math.max(1, Math.min(capacity, 8))}
        minorsPerMajor={0}
        tone={full ? 'good' : 'navy'}
        width={96}
        label={`${filled} of ${capacity} seats filled`}
      />
    </span>
  )
}

function TrainingPrograms({ trainings, loading, error, tabs }: TrainingProgramsProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const filtered = query ? trainings.filter((t) => t.title.toLowerCase().includes(query)) : trainings

  return (
    <>
      <div className="products-toolbar">
        <div className="products-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search training programs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {tabs}
      </div>

      {loading ? (
        <div className="products-empty">Loading training programs&hellip;</div>
      ) : error ? (
        <div className="products-empty products-error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="products-empty">
          {trainings.length === 0 ? 'No training programs found.' : 'No programs match your search.'}
        </div>
      ) : (
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Training program</th>
                <th>Level</th>
                <th>Location</th>
                <th>Scheduled</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((training) => (
                <tr
                  key={training.id}
                  className="products-row-clickable"
                  onClick={() => navigate(`/customers/segments/${training.id}`)}
                >
                  <td>{training.title}</td>
                  <td>{training.level}</td>
                  <td>{training.location || '—'}</td>
                  <td>{formatDate(training.scheduledAt)}</td>
                  <td>
                    <SeatScale
                      filled={training._count.enrollments}
                      capacity={training.maxEnrollees + training.maxObservers}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Segments({ token }: SegmentsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isContestTab = location.pathname === '/customers/segments/contest'

  const [trainings, setTrainings] = useState<AdminTraining[]>([])
  const [trainingsLoading, setTrainingsLoading] = useState(true)
  const [trainingsError, setTrainingsError] = useState('')

  const [contestEntries, setContestEntries] = useState<AdminContestEntry[]>([])
  const [contestLoading, setContestLoading] = useState(true)
  const [contestError, setContestError] = useState('')

  useEffect(() => {
    let cancelled = false
    setTrainingsLoading(true)
    setTrainingsError('')

    fetch(`${API_BASE_URL}/api/trainings`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load training programs')
        }
        if (!cancelled) setTrainings(json.data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setTrainingsError(err instanceof Error ? err.message : 'Could not load training programs')
      })
      .finally(() => {
        if (!cancelled) setTrainingsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    setContestLoading(true)
    setContestError('')

    fetch(`${API_BASE_URL}/api/admin/ba/contest`, {
      headers: authHeaders(token),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load contest entries')
        }
        if (!cancelled) setContestEntries(json.data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setContestError(err instanceof Error ? err.message : 'Could not load contest entries')
      })
      .finally(() => {
        if (!cancelled) setContestLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const tabs = (
    <div className="segments-tabs">
      <button
        type="button"
        className={`segments-tab${!isContestTab ? ' active' : ''}`}
        onClick={() => navigate('/customers/segments')}
      >
        Training Programs
        {!trainingsLoading && <span className="segments-tab-badge">{trainings.length}</span>}
      </button>
      <button
        type="button"
        className={`segments-tab${isContestTab ? ' active' : ''}`}
        onClick={() => navigate('/customers/segments/contest')}
      >
        Before & After Contest
        {!contestLoading && <span className="segments-tab-badge">{contestEntries.length}</span>}
      </button>
    </div>
  )

  return (
    <>
      <div className="dash-content-header">
        <h1>Segments</h1>
      </div>

      {!isContestTab && !trainingsError && (
        <LedgerBand
          caption="Seats across training programs"
          total={trainings.reduce((n, t) => n + t.maxEnrollees + t.maxObservers, 0)}
          totalLabel="seats"
          loading={trainingsLoading}
          segments={[
            {
              key: 'filled',
              label: 'Filled',
              value: trainings.reduce((n, t) => n + t._count.enrollments, 0),
              color: '#ffffff',
            },
            {
              key: 'open',
              label: 'Open',
              value: trainings.reduce(
                (n, t) => n + Math.max(t.maxEnrollees + t.maxObservers - t._count.enrollments, 0),
                0,
              ),
              color: 'rgba(255, 255, 255, 0.3)',
            },
          ]}
          flags={[
            {
              key: 'programs',
              label: 'Programs',
              value: trainings.length,
              tone: 'info',
            },
          ]}
        />
      )}

      <div className="products-card products-list-card">
        {isContestTab ? (
          <Contest entries={contestEntries} loading={contestLoading} error={contestError} tabs={tabs} />
        ) : (
          <TrainingPrograms trainings={trainings} loading={trainingsLoading} error={trainingsError} tabs={tabs} />
        )}
      </div>
    </>
  )
}

export default Segments
