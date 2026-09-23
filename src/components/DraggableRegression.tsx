/**
 * DraggableRegression — Module 6's flagship widget. The learner IS the
 * fitting algorithm: drag the line's two handles to chase a small SSE, then
 * press "Show least-squares fit" to see how close they got. A "drag points"
 * mode lets them pull individual patients and watch the best-fit line chase
 * (outlier leverage), and "re-sample" draws a fresh sample so the fitted
 * slope's wobble — its sampling distribution — is tangible.
 *
 * SVG-based for smooth dragging; handles are keyboard-accessible
 * (arrow keys nudge, shift for bigger steps). Backed by lib/regression.
 */
import { useMemo, useRef, useState } from 'react'
import { Rng } from '../lib/rng'
import { simpleOls, sseForLine } from '../lib/regression'
import { NumberReadout } from './NumberReadout'

// plot geometry (viewBox units)
const W = 640
const H = 420
const ML = 52
const MR = 16
const MT = 14
const MB = 44
const X_DOM: [number, number] = [35, 85] // age
const Y_DOM: [number, number] = [90, 170] // systolic BP

const sx = (x: number) => ML + ((x - X_DOM[0]) / (X_DOM[1] - X_DOM[0])) * (W - ML - MR)
const sy = (y: number) => MT + ((Y_DOM[1] - y) / (Y_DOM[1] - Y_DOM[0])) * (H - MT - MB)
const invY = (py: number) => Y_DOM[1] - ((py - MT) / (H - MT - MB)) * (Y_DOM[1] - Y_DOM[0])

const XH1 = 42 // handle x positions (age)
const XH2 = 78

function makeSample(seed: number): { x: number[]; y: number[] } {
  const rng = new Rng(seed)
  const x: number[] = []
  const y: number[] = []
  for (let i = 0; i < 25; i++) {
    const age = 40 + rng.next() * 40
    x.push(age)
    y.push(90 + 0.6 * age + rng.normal(0, 10))
  }
  return { x, y }
}

export function DraggableRegression({ seed = 3001 }: { seed?: number }) {
  const [sampleIdx, setSampleIdx] = useState(0)
  const [pointEdits, setPointEdits] = useState<Record<number, number>>({})
  const [handleY, setHandleY] = useState<[number, number]>([127, 127]) // learner's line (flat start)
  const [mode, setMode] = useState<'line' | 'points'>('line')
  const [fitShown, setFitShown] = useState(false)
  const [slopeHistory, setSlopeHistory] = useState<number[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<{ kind: 'handle' | 'point'; idx: number } | null>(null)

  const base = useMemo(() => makeSample(seed + sampleIdx * 97), [seed, sampleIdx])
  const data = useMemo(
    () => ({ x: base.x, y: base.y.map((v, i) => pointEdits[i] ?? v) }),
    [base, pointEdits],
  )

  const ols = useMemo(() => simpleOls(data.x, data.y), [data])

  // learner's line from the two handles
  const userSlope = (handleY[1] - handleY[0]) / (XH2 - XH1)
  const userIntercept = handleY[0] - userSlope * XH1
  const userSse = sseForLine(data.x, data.y, userIntercept, userSlope)

  // in points mode the displayed line is always the live OLS fit
  const line =
    mode === 'points'
      ? { intercept: ols.intercept, slope: ols.slope }
      : { intercept: userIntercept, slope: userSlope }
  const shownSse = mode === 'points' ? ols.sse : userSse

  const predict = (x: number) => line.intercept + line.slope * x

  const clampY = (v: number) => Math.min(Y_DOM[1], Math.max(Y_DOM[0], v))

  const pointerY = (e: React.PointerEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect()
    return invY(((e.clientY - rect.top) / rect.height) * H)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current
    if (!d) return
    const yVal = clampY(pointerY(e))
    if (d.kind === 'handle') {
      setHandleY((h) => (d.idx === 0 ? [yVal, h[1]] : [h[0], yVal]))
    } else {
      setPointEdits((p) => ({ ...p, [d.idx]: yVal }))
    }
  }

  const startDrag = (kind: 'handle' | 'point', idx: number) => (e: React.PointerEvent) => {
    dragging.current = { kind, idx }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const endDrag = () => {
    dragging.current = null
  }

  const nudgeHandle = (idx: number) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1
    let delta = 0
    if (e.key === 'ArrowUp') delta = step
    if (e.key === 'ArrowDown') delta = -step
    if (!delta) return
    e.preventDefault()
    setHandleY((h) => {
      const next: [number, number] = [...h]
      next[idx] = clampY(next[idx] + delta)
      return next
    })
  }

  const showBestFit = () => {
    setHandleY([ols.intercept + ols.slope * XH1, ols.intercept + ols.slope * XH2])
    if (!fitShown) {
      setFitShown(true)
      setSlopeHistory((s) => [...s, ols.slope])
    }
  }

  const reSample = () => {
    const nextIdx = sampleIdx + 1
    setSampleIdx(nextIdx)
    setPointEdits({})
    if (fitShown || mode === 'points') {
      const fresh = makeSample(seed + nextIdx * 97)
      const fit = simpleOls(fresh.x, fresh.y)
      setHandleY([fit.intercept + fit.slope * XH1, fit.intercept + fit.slope * XH2])
      setSlopeHistory((s) => [...s.slice(-7), fit.slope])
    }
  }

  const reset = () => {
    setSampleIdx(0)
    setPointEdits({})
    setHandleY([127, 127])
    setFitShown(false)
    setSlopeHistory([])
    setMode('line')
  }

  const xTicks = [40, 50, 60, 70, 80]
  const yTicks = [100, 120, 140, 160]

  return (
    <div className="widget" data-widget="draggable-regression">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Interaction mode">
          <span className="btn-group__label">Mode:</span>
          <button
            type="button"
            className={`btn btn--toggle${mode === 'line' ? ' is-active' : ''}`}
            aria-pressed={mode === 'line'}
            onClick={() => setMode('line')}
          >
            drag the line
          </button>
          <button
            type="button"
            className={`btn btn--toggle${mode === 'points' ? ' is-active' : ''}`}
            aria-pressed={mode === 'points'}
            onClick={() => setMode('points')}
          >
            drag points
          </button>
        </div>
        <button type="button" className="btn btn--primary" onClick={showBestFit} disabled={mode === 'points'}>
          Show least-squares fit
        </button>
        <button type="button" className="btn" onClick={reSample}>
          Re-sample 25 patients
        </button>
        <button type="button" className="btn" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="widget__note">
        {mode === 'line'
          ? 'Drag the two square handles (or focus them and use ↑/↓, Shift for bigger steps) to make the squared misses as small as you can. Then check yourself against the least-squares button.'
          : 'Drag any patient up or down and watch the best-fit line chase it. Try an extreme-age patient: points far from the middle have leverage.'}
      </p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="dragreg__svg"
        role="img"
        aria-label={`Scatter of systolic BP against age for 25 patients with a ${mode === 'points' ? 'least-squares' : 'learner-positioned'} line; current slope ${line.slope.toFixed(2)} mmHg per year, sum of squared residuals ${Math.round(shownSse)}.`}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* gridlines + axes */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={ML} x2={W - MR} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth={1} />
            <text x={ML - 8} y={sy(t) + 4} textAnchor="end" fontSize={12} fill="var(--text-subtle)">{t}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={sx(t)} y={H - MB + 18} textAnchor="middle" fontSize={12} fill="var(--text-subtle)">{t}</text>
        ))}
        <line x1={ML} x2={W - MR} y1={sy(Y_DOM[0])} y2={sy(Y_DOM[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
        <line x1={ML} x2={ML} y1={MT} y2={sy(Y_DOM[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
        <text x={(ML + W - MR) / 2} y={H - 6} textAnchor="middle" fontSize={13} fill="var(--text-muted)">Age (years)</text>
        <text x={14} y={(MT + H - MB) / 2} textAnchor="middle" fontSize={13} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + H - MB) / 2})`}>
          Systolic BP (mmHg)
        </text>

        {/* residual segments */}
        {data.x.map((xi, i) => (
          <line
            key={`r${i}`}
            x1={sx(xi)} x2={sx(xi)}
            y1={sy(data.y[i])} y2={sy(Math.min(Y_DOM[1], Math.max(Y_DOM[0], predict(xi))))}
            stroke="var(--viz-alpha)" strokeWidth={1.2} opacity={0.55}
          />
        ))}

        {/* the line */}
        <line
          x1={sx(X_DOM[0])} x2={sx(X_DOM[1])}
          y1={sy(Math.min(Y_DOM[1], Math.max(Y_DOM[0], predict(X_DOM[0]))))}
          y2={sy(Math.min(Y_DOM[1], Math.max(Y_DOM[0], predict(X_DOM[1]))))}
          stroke={mode === 'points' ? 'var(--viz-signal)' : 'var(--viz-beta)'} strokeWidth={2.5}
        />

        {/* data points */}
        {data.x.map((xi, i) => (
          <circle
            key={`p${i}`}
            cx={sx(xi)} cy={sy(data.y[i])} r={6}
            fill="var(--viz-null)" opacity={0.9}
            style={{ cursor: mode === 'points' ? 'ns-resize' : 'default' }}
            onPointerDown={mode === 'points' ? startDrag('point', i) : undefined}
          />
        ))}

        {/* drag handles (line mode) */}
        {mode === 'line' &&
          ([0, 1] as const).map((idx) => (
            <rect
              key={`h${idx}`}
              x={sx(idx === 0 ? XH1 : XH2) - 9}
              y={sy(handleY[idx]) - 9}
              width={18} height={18} rx={4}
              fill="var(--viz-beta)" stroke="var(--surface)" strokeWidth={2}
              style={{ cursor: 'ns-resize' }}
              tabIndex={0}
              role="slider"
              aria-label={`Line handle at age ${idx === 0 ? XH1 : XH2}; BP value ${handleY[idx].toFixed(0)}. Use arrow keys to move.`}
              aria-valuenow={Math.round(handleY[idx])}
              aria-valuemin={Y_DOM[0]}
              aria-valuemax={Y_DOM[1]}
              onPointerDown={startDrag('handle', idx)}
              onKeyDown={nudgeHandle(idx)}
            />
          ))}
      </svg>

      <div className="widget__readouts">
        <NumberReadout label="Intercept (a)" value={line.intercept.toFixed(1)} sub="predicted BP at age 0: a mathematical anchor, not a clinical claim" />
        <NumberReadout label="Slope (b)" value={`${line.slope.toFixed(2)} mmHg/yr`} sub="the coefficient: average BP difference per year of age" tone="accent" />
        <NumberReadout
          label={mode === 'points' ? 'SSE of the least-squares fit' : 'Your sum of squared residuals (SSE)'}
          value={Math.round(shownSse).toLocaleString()}
          sub={mode === 'line' && fitShown ? `best possible: ${Math.round(ols.sse).toLocaleString()}` : 'smaller = better fit'}
          tone={mode === 'line' && fitShown && userSse <= ols.sse * 1.02 ? 'ok' : 'neutral'}
        />
        {fitShown && mode === 'line' && (
          <NumberReadout label="R² of the least-squares fit" value={ols.r2.toFixed(2)} sub="share of BP variance explained by age in this sample" />
        )}
      </div>

      {slopeHistory.length > 1 && (
        <p className="widget__note" aria-live="polite">
          Fitted slopes across your re-samples:{' '}
          <strong>{slopeHistory.map((s) => s.toFixed(2)).join(' · ')}</strong>. The same population,
          a different 25 patients each time. That wobble is the sampling distribution of a
          coefficient (Module 4's idea, alive and well).
        </p>
      )}
    </div>
  )
}
