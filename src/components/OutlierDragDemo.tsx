/**
 * OutlierDragDemo — Module 2 Section 2: the mean/median tug-of-war.
 *
 * Nine patient dots on a BP number line, each draggable left–right
 * (keyboard: focus + arrow keys). Live mean and median markers underneath.
 * Drag one dot to 210 and watch the mean chase it while the median barely
 * steps — leverage, felt by hand.
 */
import { useRef, useState } from 'react'
import { mean, quantile } from '../lib/stats'
import { NumberReadout } from './NumberReadout'

const INITIAL = [112, 115, 118, 120, 121, 124, 126, 128, 130]

const W = 640
const H = 150
const ML = 24
const MR = 24
const X_DOM: [number, number] = [60, 220]
const LINE_Y = 70

const sx = (v: number) => ML + ((v - X_DOM[0]) / (X_DOM[1] - X_DOM[0])) * (W - ML - MR)
const invX = (px: number) => X_DOM[0] + ((px - ML) / (W - ML - MR)) * (X_DOM[1] - X_DOM[0])

export function OutlierDragDemo() {
  const [values, setValues] = useState<number[]>(INITIAL)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<number | null>(null)

  const m = mean(values)
  const med = quantile(values, 0.5)

  const clamp = (v: number) => Math.min(X_DOM[1], Math.max(X_DOM[0], Math.round(v)))

  const pointerX = (e: React.PointerEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect()
    return invX(((e.clientX - rect.left) / rect.width) * W)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current === null) return
    const idx = dragging.current
    const v = clamp(pointerX(e))
    setValues((vs) => vs.map((old, i) => (i === idx ? v : old)))
  }

  const nudge = (idx: number) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2
    let delta = 0
    if (e.key === 'ArrowRight') delta = step
    if (e.key === 'ArrowLeft') delta = -step
    if (!delta) return
    e.preventDefault()
    setValues((vs) => vs.map((old, i) => (i === idx ? clamp(old + delta) : old)))
  }

  const ticks = [60, 100, 140, 180, 220]

  return (
    <div className="widget" data-widget="outlier-drag">
      <p className="widget__note">
        Drag any patient (or focus one and use ←/→, Shift for bigger steps). Try hauling the
        right-most patient out to 210 (a single transcription error) and watch which marker chases
        it.
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="dragreg__svg"
        role="img"
        aria-label={`Nine BP values on a number line. Current mean ${m.toFixed(1)}, median ${med.toFixed(1)}.`}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = null)}
        onPointerLeave={() => (dragging.current = null)}
      >
        <line x1={ML} x2={W - MR} y1={LINE_Y} y2={LINE_Y} stroke="var(--border-strong)" strokeWidth={1.5} />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={LINE_Y - 4} y2={LINE_Y + 4} stroke="var(--border-strong)" />
            <text x={sx(t)} y={LINE_Y + 20} textAnchor="middle" fontSize={12} fill="var(--text-subtle)">
              {t}
            </text>
          </g>
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">
          Systolic BP (mmHg)
        </text>

        {/* mean & median markers (triangles above the line) */}
        <g aria-hidden="true">
          <polygon
            points={`${sx(m) - 8},${LINE_Y - 26} ${sx(m) + 8},${LINE_Y - 26} ${sx(m)},${LINE_Y - 12}`}
            fill="var(--viz-signal)"
          />
          <text x={sx(m)} y={LINE_Y - 32} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--viz-signal)">
            mean {m.toFixed(1)}
          </text>
          <polygon
            points={`${sx(med) - 8},${LINE_Y - 52} ${sx(med) + 8},${LINE_Y - 52} ${sx(med)},${LINE_Y - 38}`}
            fill="var(--viz-power)"
          />
          <text x={sx(med)} y={LINE_Y - 58} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--viz-power)">
            median {med.toFixed(1)}
          </text>
        </g>

        {/* patient dots */}
        {values.map((v, i) => (
          <circle
            key={i}
            cx={sx(v)}
            cy={LINE_Y}
            r={9}
            fill="var(--viz-null)"
            stroke="var(--surface)"
            strokeWidth={1.5}
            opacity={0.9}
            style={{ cursor: 'ew-resize' }}
            tabIndex={0}
            role="slider"
            aria-label={`Patient ${i + 1}, BP ${v}. Arrow keys to move.`}
            aria-valuenow={v}
            aria-valuemin={X_DOM[0]}
            aria-valuemax={X_DOM[1]}
            onPointerDown={(e) => {
              dragging.current = i
              ;(e.target as Element).setPointerCapture(e.pointerId)
            }}
            onKeyDown={nudge(i)}
          />
        ))}
      </svg>
      <div className="widget__runbar">
        <button type="button" className="btn" onClick={() => setValues(INITIAL)}>
          Reset
        </button>
        <NumberReadout label="Mean (centre of mass)" value={m.toFixed(1)} tone="accent" />
        <NumberReadout label="Median (middle patient)" value={med.toFixed(1)} />
      </div>
    </div>
  )
}
