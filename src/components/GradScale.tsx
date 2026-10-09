import type { CSSProperties } from 'react'
import './GradScale.css'

export type GradTone = 'navy' | 'crimson' | 'good' | 'warn' | 'muted'

interface GradScaleProps {
  /** Fill level, 0 to 1. */
  fill: number
  /** Number of major intervals; a 4-station lifecycle has 3. */
  majors: number
  minorsPerMajor?: number
  tone?: GradTone
  /** Optional 0–1 position of a threshold mark, drawn in crimson. */
  marker?: number
  /** Cancelled or void: the scale is struck through instead of filled. */
  struck?: boolean
  width?: number
  /** Stagger index for the fill animation. */
  index?: number
  label: string
}

const HEIGHT = 12
const TRACK_Y = 8
const TRACK_H = 3

function GradScale({
  fill,
  majors,
  minorsPerMajor = 3,
  tone = 'navy',
  marker,
  struck = false,
  width = 88,
  index = 0,
  label,
}: GradScaleProps) {
  const clamped = Math.min(Math.max(fill, 0), 1)
  const total = majors * (minorsPerMajor + 1)
  const ticks = Array.from({ length: total + 1 }, (_, i) => {
    const x = Math.round((i / total) * (width - 1)) + 0.5
    const isMajor = i % (minorsPerMajor + 1) === 0
    const reached = !struck && i / total <= clamped + 1e-6
    return { x, isMajor, reached }
  })

  return (
    <svg
      className={`grad-scale grad-${struck ? 'crimson' : tone}${struck ? ' grad-struck' : ''}`}
      width={width}
      height={HEIGHT}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ '--grad-i': index } as CSSProperties}
    >
      {ticks.map((t) => (
        <line
          key={t.x}
          className={`grad-tick${t.isMajor ? ' grad-tick-major' : ''}${t.reached ? ' grad-tick-reached' : ''}`}
          x1={t.x}
          x2={t.x}
          y1={t.isMajor ? 0 : 3}
          y2={6}
        />
      ))}
      <rect className="grad-track" x={0} y={TRACK_Y} width={width} height={TRACK_H} rx={TRACK_H / 2} />
      {struck ? (
        <line className="grad-strike" x1={0} x2={width} y1={TRACK_Y + TRACK_H / 2} y2={TRACK_Y + TRACK_H / 2} />
      ) : (
        clamped > 0 && (
          <rect
            className="grad-fill"
            x={0}
            y={TRACK_Y}
            width={Math.max(clamped * width, TRACK_H)}
            height={TRACK_H}
            rx={TRACK_H / 2}
          />
        )
      )}
      {marker != null && (
        <line
          className="grad-marker"
          x1={Math.round(marker * (width - 1)) + 0.5}
          x2={Math.round(marker * (width - 1)) + 0.5}
          y1={0}
          y2={HEIGHT}
        />
      )}
    </svg>
  )
}

export default GradScale
