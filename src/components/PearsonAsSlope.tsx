/**
 * PearsonAsSlope — Module 7 (One Model, Many Tests), Section 2. Shows that
 * Pearson's r IS the regression slope once both axes are standardised. A scatter
 * of baseline BP vs age carries its least-squares line; the readouts show the
 * raw slope (mmHg/year) and r side by side, and a "standardise" toggle rescales
 * both axes to z-scores so the very same line now has slope = r (bounded ±1).
 * A noise slider lets the learner watch r and the slope move together.
 *
 * SVG + viz tokens + seeded Rng; reuses simpleOls from lib/regression.
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { simpleOls } from '../lib/regression'
import { NumberReadout } from './NumberReadout'
import { ParameterSlider } from './ParameterSlider'

const W = 460
const H = 380
const ML = 52
const MR = 18
const MT = 16
const MB = 46
const N = 40

function makeSample(seed: number, noise: number) {
  const rng = new Rng(seed)
  const age: number[] = []
  const bp: number[] = []
  for (let i = 0; i < N; i++) {
    const a = 40 + rng.next() * 40
    age.push(a)
    bp.push(96 + 0.5 * a + rng.normal(0, noise))
  }
  return { age, bp }
}

function standardise(v: number[]) {
  const m = v.reduce((s, x) => s + x, 0) / v.length
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1))
  return v.map((x) => (x - m) / sd)
}

export function PearsonAsSlope({ seed = 7101 }: { seed?: number }) {
  const [standardised, setStandardised] = useState(false)
  const [noise, setNoise] = useState(9)
  const [sampleIdx, setSampleIdx] = useState(0)

  const raw = useMemo(() => makeSample(seed + sampleIdx * 131, noise), [seed, sampleIdx, noise])

  // Pearson r is invariant to standardising; compute it once from the raw data.
  const fitRaw = useMemo(() => simpleOls(raw.age, raw.bp), [raw])
  const r = Math.sign(fitRaw.slope) * Math.sqrt(Math.max(0, fitRaw.r2))

  const x = standardised ? standardise(raw.age) : raw.age
  const y = standardised ? standardise(raw.bp) : raw.bp
  const fit = standardised ? simpleOls(x, y) : fitRaw

  // dynamic domains with padding
  const dom = (v: number[]): [number, number] => {
    const lo = Math.min(...v)
    const hi = Math.max(...v)
    const pad = (hi - lo) * 0.08 || 1
    return [lo - pad, hi + pad]
  }
  const XD = standardised ? ([-3, 3] as [number, number]) : dom(x)
  const YD = standardised ? ([-3, 3] as [number, number]) : dom(y)
  const sx = (v: number) => ML + ((v - XD[0]) / (XD[1] - XD[0])) * (W - ML - MR)
  const sy = (v: number) => MT + ((YD[1] - v) / (YD[1] - YD[0])) * (H - MT - MB)
  const predict = (v: number) => fit.intercept + fit.slope * v

  return (
    <div className="widget" data-widget="pearson-as-slope">
      <div className="widget__runbar">
        <button
          type="button"
          className={`btn btn--toggle${standardised ? ' is-active' : ''}`}
          aria-pressed={standardised}
          onClick={() => setStandardised((s) => !s)}
        >
          {standardised ? 'Standardised (z-scores)' : 'Standardise both axes'}
        </button>
        <button type="button" className="btn" onClick={() => setSampleIdx((i) => i + 1)}>Re-sample</button>
      </div>
      <div className="widget__controls">
        <ParameterSlider label="Scatter (noise)" min={2} max={20} step={1} value={noise} onChange={setNoise} unit="mmHg" help="More noise weakens the association: watch r shrink toward 0." />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: '100%', height: 'auto', maxWidth: 460 }}
        aria-label={`Scatter of ${standardised ? 'standardised ' : ''}baseline BP against age with a least-squares line; Pearson r = ${r.toFixed(2)}, ${standardised ? 'and the line slope equals r' : `raw slope ${fitRaw.slope.toFixed(2)} mmHg per year`}.`}>
        {/* axes */}
        <line x1={ML} x2={W - MR} y1={sy(YD[0])} y2={sy(YD[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
        <line x1={ML} x2={ML} y1={MT} y2={sy(YD[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
        {standardised && (
          <>
            <line x1={sx(0)} x2={sx(0)} y1={MT} y2={sy(YD[0])} stroke="var(--viz-grid)" strokeWidth={1} />
            <line x1={ML} x2={W - MR} y1={sy(0)} y2={sy(0)} stroke="var(--viz-grid)" strokeWidth={1} />
          </>
        )}
        <text x={(ML + W - MR) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
          {standardised ? 'Age (SDs from mean)' : 'Age (years)'}
        </text>
        <text x={14} y={(MT + sy(YD[0])) / 2} textAnchor="middle" fontSize={12} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + sy(YD[0])) / 2})`}>
          {standardised ? 'Baseline BP (SDs)' : 'Baseline BP (mmHg)'}
        </text>

        {/* the line */}
        <line x1={sx(XD[0])} y1={sy(predict(XD[0]))} x2={sx(XD[1])} y2={sy(predict(XD[1]))} stroke="var(--viz-signal)" strokeWidth={2.5} />

        {/* points */}
        {x.map((xi, i) => (
          <circle key={i} cx={sx(xi)} cy={sy(y[i])} r={5} fill="var(--viz-null)" opacity={0.85} />
        ))}
      </svg>

      <div className="widget__readouts">
        <NumberReadout label="Raw slope" value={`${fitRaw.slope.toFixed(2)} mmHg/yr`} sub="clinical units: BP change per year of age" />
        <NumberReadout label="Pearson r" value={r.toFixed(2)} sub="unit-free, bounded −1…+1" tone="accent" />
        <NumberReadout
          label={standardised ? 'Slope of the standardised line' : 'Slope once standardised'}
          value={standardised ? fit.slope.toFixed(2) : r.toFixed(2)}
          sub={standardised ? 'in SD-per-SD units — identical to r' : 'standardise to see the slope become r'}
          tone={standardised ? 'ok' : 'neutral'}
        />
      </div>
      <p className="widget__note" aria-live="polite">
        {standardised
          ? 'Both axes are now in standard-deviation units, so the slope is “SDs of BP per SD of age” — and that number is exactly Pearson’s r. Same line, units washed out.'
          : 'The line is in clinical units (mmHg per year). Hit “Standardise both axes” and watch its slope turn into r.'}
      </p>
    </div>
  )
}
