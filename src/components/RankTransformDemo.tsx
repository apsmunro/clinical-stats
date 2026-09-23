/**
 * RankTransformDemo — Module 7 (One Model, Many Tests), Section 4. The
 * centrepiece: the "non-parametric" tests are the linear models you already
 * know, run on the ranks of the data.
 *
 *  • Continuous mode: a curved, monotonic cloud where Pearson's r underdoes the
 *    association. Hit "rank-transform" and the points slide to their
 *    (rank x, rank y) positions; the relationship straightens and Pearson-on-
 *    ranks (= Spearman) jumps toward 1.
 *  • Two-group mode: skewed length-of-stay for two arms. Rank-transform and the
 *    outlier-driven mess becomes an even spread; the difference in mean rank is
 *    the comparison Mann–Whitney makes (a t-test on ranks).
 *
 * Positions tween between raw and ranked layouts via requestAnimationFrame.
 * SVG + viz tokens + seeded Rng.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Rng } from '../lib/rng'
import { NumberReadout } from './NumberReadout'

const W = 480
const H = 380
const ML = 50
const MR = 18
const MT = 18
const MB = 46

function ranks(v: number[]): number[] {
  const order = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0])
  const r = new Array(v.length)
  order.forEach(([, idx], pos) => (r[idx] = pos + 1))
  return r
}
function pearson(x: number[], y: number[]): number {
  const n = x.length
  const mx = x.reduce((s, v) => s + v, 0) / n
  const my = y.reduce((s, v) => s + v, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my)
    sxx += (x[i] - mx) ** 2
    syy += (y[i] - my) ** 2
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0
}
const norm = (v: number[]) => {
  const lo = Math.min(...v), hi = Math.max(...v)
  return v.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0.5))
}

function useTween(target: number, ms = 480): number {
  const [v, setV] = useState(target)
  const ref = useRef(target)
  useEffect(() => {
    const from = ref.current
    const delta = target - from
    if (delta === 0) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms)
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
      ref.current = from + delta * e
      setV(ref.current)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

type Mode = 'continuous' | 'twogroup'

export function RankTransformDemo({ seed = 7401 }: { seed?: number }) {
  const [mode, setMode] = useState<Mode>('continuous')
  const [ranked, setRanked] = useState(false)
  const t = useTween(ranked ? 1 : 0)

  // reset to raw when switching mode
  const setModeReset = (m: Mode) => { setMode(m); setRanked(false) }

  const cont = useMemo(() => {
    const rng = new Rng(seed)
    const n = 24
    const x: number[] = [], y: number[] = []
    for (let i = 0; i < n; i++) {
      const xi = rng.next()
      x.push(xi)
      // strongly convex + constant *relative* noise: Pearson underdoes it, ranks (Spearman) reveal it
      y.push(Math.exp(4 * xi) * (1 + 0.1 * rng.normal(0, 1)))
    }
    return { x, y }
  }, [seed])

  const two = useMemo(() => {
    const rng = new Rng(seed + 9)
    const nA = 16, nB = 16
    const exp = (mean: number) => -mean * Math.log(1 - rng.next())
    const a = Array.from({ length: nA }, () => exp(4))
    const b = Array.from({ length: nB }, () => exp(8))
    return { a, b }
  }, [seed])

  // ---- continuous render ----
  const px = (f: number) => ML + f * (W - ML - MR)
  const py = (f: number) => MT + (1 - f) * (H - MT - MB)

  let body: JSX.Element
  let readouts: JSX.Element

  if (mode === 'continuous') {
    const { x, y } = cont
    const rx = ranks(x), ry = ranks(y)
    const nx0 = norm(x), ny0 = norm(y)
    const nx1 = rx.map((r) => (r - 1) / (x.length - 1))
    const ny1 = ry.map((r) => (r - 1) / (y.length - 1))
    const fx = nx0.map((v, i) => v * (1 - t) + nx1[i] * t)
    const fy = ny0.map((v, i) => v * (1 - t) + ny1[i] * t)
    // fit line on tweened coords
    const b = pearson(fx, fy) * (stdev(fy) / (stdev(fx) || 1))
    const a = mean(fy) - b * mean(fx)
    const rRaw = pearson(x, y)
    const rRank = pearson(rx, ry) // = Spearman

    body = (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: '100%', height: 'auto', maxWidth: 480 }}
        aria-label={`Scatter that is ${t > 0.5 ? 'rank-transformed' : 'raw'}; Pearson on raw ${rRaw.toFixed(2)}, Pearson on ranks (Spearman) ${rRank.toFixed(2)}.`}>
        <line x1={ML} x2={W - MR} y1={py(0)} y2={py(0)} stroke="var(--border-strong)" strokeWidth={1.5} />
        <line x1={ML} x2={ML} y1={MT} y2={py(0)} stroke="var(--border-strong)" strokeWidth={1.5} />
        <text x={(ML + W - MR) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{t > 0.5 ? 'rank of biomarker' : 'biomarker'}</text>
        <text x={14} y={(MT + py(0)) / 2} textAnchor="middle" fontSize={12} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + py(0)) / 2})`}>{t > 0.5 ? 'rank of outcome' : 'outcome'}</text>
        <line x1={px(0)} y1={py(a)} x2={px(1)} y2={py(a + b)} stroke="var(--viz-signal)" strokeWidth={2.5} opacity={0.9} />
        {fx.map((vx, i) => (
          <circle key={i} cx={px(vx)} cy={py(fy[i])} r={5} fill="var(--viz-null)" opacity={0.85} />
        ))}
      </svg>
    )
    readouts = (
      <div className="widget__readouts">
        <NumberReadout label="Pearson on raw data" value={rRaw.toFixed(2)} sub="straight-line fit — held back by the curve" />
        <NumberReadout label="Pearson on ranks = Spearman" value={rRank.toFixed(2)} sub="monotonic association — shrugs off the curve" tone="accent" />
      </div>
    )
  } else {
    const { a, b } = two
    const all = [...a, ...b]
    const rAll = ranks(all)
    const ra = rAll.slice(0, a.length), rb = rAll.slice(a.length)
    const n0 = norm(all)
    const n1 = rAll.map((r) => (r - 1) / (all.length - 1))
    const f = n0.map((v, i) => v * (1 - t) + n1[i] * t)
    const colA = ML + (W - ML - MR) * 0.32
    const colB = ML + (W - ML - MR) * 0.68
    const jit = new Rng(seed + 3)
    const meanRankA = ra.reduce((s, v) => s + v, 0) / ra.length
    const meanRankB = rb.reduce((s, v) => s + v, 0) / rb.length

    body = (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: '100%', height: 'auto', maxWidth: 480 }}
        aria-label={`Two arms of skewed length-of-stay, ${t > 0.5 ? 'rank-transformed' : 'raw'}; mean rank placebo ${meanRankA.toFixed(0)}, drug ${meanRankB.toFixed(0)}.`}>
        <line x1={ML} x2={ML} y1={MT} y2={py(0)} stroke="var(--border-strong)" strokeWidth={1.5} />
        <line x1={ML} x2={W - MR} y1={py(0)} y2={py(0)} stroke="var(--border-strong)" strokeWidth={1.5} />
        <text x={14} y={(MT + py(0)) / 2} textAnchor="middle" fontSize={12} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + py(0)) / 2})`}>{t > 0.5 ? 'rank of stay' : 'length of stay (days)'}</text>
        {[[colA, 'placebo'], [colB, 'drug']].map(([cx, lab]) => (
          <text key={lab as string} x={cx as number} y={H - MB + 22} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{lab}</text>
        ))}
        {/* mean-rank ticks (only meaningful in rank space, fade in with t) */}
        <line x1={colA - 30} x2={colA + 30} y1={py((meanRankA - 1) / (all.length - 1))} y2={py((meanRankA - 1) / (all.length - 1))} stroke="var(--viz-null)" strokeWidth={3} opacity={t} />
        <line x1={colB - 30} x2={colB + 30} y1={py((meanRankB - 1) / (all.length - 1))} y2={py((meanRankB - 1) / (all.length - 1))} stroke="var(--viz-signal)" strokeWidth={3} opacity={t} />
        {a.map((_, i) => (
          <circle key={`a${i}`} cx={colA + (jit.next() - 0.5) * 40} cy={py(f[i])} r={4.5} fill="var(--viz-null)" opacity={0.6} />
        ))}
        {b.map((_, i) => (
          <circle key={`b${i}`} cx={colB + (jit.next() - 0.5) * 40} cy={py(f[a.length + i])} r={4.5} fill="var(--viz-signal)" opacity={0.6} />
        ))}
      </svg>
    )
    readouts = (
      <div className="widget__readouts">
        <NumberReadout label="Mean rank — placebo" value={meanRankA.toFixed(1)} sub="average position in the pooled ranking" />
        <NumberReadout label="Mean rank — drug" value={meanRankB.toFixed(1)} sub="higher ranks = longer stays" tone="accent" />
        <NumberReadout label="Rank gap" value={(meanRankB - meanRankA >= 0 ? '+' : '') + (meanRankB - meanRankA).toFixed(1)} sub="what Mann–Whitney tests: a t-test on ranks" />
      </div>
    )
  }

  return (
    <div className="widget" data-widget="rank-transform">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Mode">
          <span className="btn-group__label">Test:</span>
          <button type="button" className={`btn btn--toggle${mode === 'continuous' ? ' is-active' : ''}`} aria-pressed={mode === 'continuous'} onClick={() => setModeReset('continuous')}>Spearman (continuous)</button>
          <button type="button" className={`btn btn--toggle${mode === 'twogroup' ? ' is-active' : ''}`} aria-pressed={mode === 'twogroup'} onClick={() => setModeReset('twogroup')}>Mann–Whitney (2 groups)</button>
        </div>
        <button type="button" className={`btn btn--primary`} onClick={() => setRanked((r) => !r)} aria-pressed={ranked}>
          {ranked ? 'Back to raw data' : 'Rank-transform →'}
        </button>
      </div>
      {body}
      {readouts}
      <p className="widget__note" aria-live="polite">
        {mode === 'continuous'
          ? 'Ranking keeps the order but discards the spacing, so the curve straightens and Pearson-on-ranks (Spearman) reads the association the raw fit was missing. Same linear model, ranked inputs.'
          : 'Pool everyone, rank their length of stay, and compare the arms’ average ranks. That difference is exactly what Mann–Whitney tests — a two-group linear model run on ranks.'}
      </p>
    </div>
  )
}

function mean(v: number[]) { return v.reduce((s, x) => s + x, 0) / v.length }
function stdev(v: number[]) {
  const m = mean(v)
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length)
}
