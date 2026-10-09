import type { CSSProperties } from 'react'
import './LedgerBand.css'

export interface LedgerSegment {
  key: string
  label: string
  value: number
  /** Segment colour on the navy band. */
  color: string
}

export interface LedgerFlag {
  key: string
  label: string
  value: number
  active?: boolean
  onClick?: () => void
  /** 'alert' (default) turns crimson above zero; 'info' never does. */
  tone?: 'alert' | 'info'
}

interface LedgerBandProps {
  /** What the whole bar measures, e.g. "Units on hand". */
  caption: string
  total: number
  totalLabel?: string
  segments: LedgerSegment[]
  /** Alert counts shown after the legend; crimson when non-zero, clickable to filter. */
  flags?: LedgerFlag[]
  loading?: boolean
}

const TICKS = 60

/**
 * The page's summary drawn as one graduated scale on a navy band: the whole quantity is the
 * bar, its parts are the segments, and the legend carries the exact counts.
 */
function LedgerBand({ caption, total, totalLabel, segments, flags = [], loading = false }: LedgerBandProps) {
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0)
  const scale = Math.max(sum, 1)

  return (
    <section className={`ledger-band${loading ? ' ledger-band-loading' : ''}`} aria-label={caption}>
      <div className="ledger-head">
        <span className="ledger-caption">{caption}</span>
        <span className="ledger-total">
          {loading ? '—' : total.toLocaleString('en-US')}
          {totalLabel && <span className="ledger-total-label"> {totalLabel}</span>}
        </span>
      </div>

      <div className="ledger-ruler" aria-hidden="true">
        {Array.from({ length: TICKS + 1 }, (_, i) => (
          <span key={i} className={i % 10 === 0 ? 'major' : i % 5 === 0 ? 'mid' : ''} />
        ))}
      </div>

      <div className="ledger-bar" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}>
        {!loading &&
          segments
            .filter((segment) => segment.value > 0)
            .map((segment, index) => (
              <span
                key={segment.key}
                className="ledger-segment"
                style={
                  {
                    flexGrow: segment.value / scale,
                    background: segment.color,
                    '--ledger-i': index,
                  } as CSSProperties
                }
              />
            ))}
      </div>

      <div className="ledger-legend">
        {segments.map((segment) => (
          <span key={segment.key} className="ledger-item">
            <span className="ledger-swatch" style={{ background: segment.color }} />
            <span className="ledger-item-label">{segment.label}</span>
            <span className="ledger-item-value">{loading ? '—' : segment.value.toLocaleString('en-US')}</span>
          </span>
        ))}
        {flags.length > 0 && <span className="ledger-divider" aria-hidden="true" />}
        {flags.map((flag) => {
          const content = (
            <>
              <span className="ledger-item-label">{flag.label}</span>
              <span className="ledger-item-value">{loading ? '—' : flag.value.toLocaleString('en-US')}</span>
            </>
          )
          const alert = (flag.tone ?? 'alert') === 'alert' && flag.value > 0
          const className = `ledger-flag${alert ? ' ledger-flag-alert' : ''}${flag.active ? ' active' : ''}`
          return flag.onClick ? (
            <button
              key={flag.key}
              type="button"
              className={className}
              aria-pressed={flag.active ?? false}
              onClick={flag.onClick}
            >
              {content}
            </button>
          ) : (
            <span key={flag.key} className={className}>
              {content}
            </span>
          )
        })}
      </div>
    </section>
  )
}

export default LedgerBand
