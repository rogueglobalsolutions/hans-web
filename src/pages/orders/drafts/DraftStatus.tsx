import GradScale from '../../../components/GradScale'
import { DRAFT_STATUS_LABEL, type DraftStatus } from './shared'

const STATIONS = ['Draft', 'Link sent', 'Paid']

function stationOf(status: DraftStatus) {
  if (status === 'paid') return 2
  if (status === 'link_sent' || status === 'link_expired') return 1
  return 0
}

/** A draft's progress on the same graduated scale as orders: draft → link sent → paid. */
function DraftStatusScale({
  status,
  index = 0,
  width = 96,
  showStations = false,
}: {
  status: DraftStatus
  index?: number
  width?: number
  showStations?: boolean
}) {
  const station = stationOf(status)
  const cancelled = status === 'cancelled'
  const alert = status === 'link_expired'

  return (
    <span className={`status-scale draft-status-${status}`}>
      {(!showStations || cancelled || alert) && <span className="status-scale-label">{DRAFT_STATUS_LABEL[status]}</span>}
      <GradScale
        fill={cancelled ? 0 : station / (STATIONS.length - 1)}
        majors={STATIONS.length - 1}
        minorsPerMajor={4}
        tone={alert ? 'crimson' : 'navy'}
        struck={cancelled}
        width={width}
        index={index}
        label={DRAFT_STATUS_LABEL[status]}
      />
      {showStations && (
        <span className="status-scale-stations" style={{ width }} aria-hidden="true">
          {STATIONS.map((label, i) => (
            <span key={label} className={!cancelled && i <= station ? 'reached' : ''}>
              {label}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

export default DraftStatusScale
