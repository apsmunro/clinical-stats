/**
 * SameStatsDemo — Module 2 Section 1: "plot first".
 *
 * Five datasets engineered to share the SAME mean, median and SD (to one
 * decimal place) while looking completely different as histograms. The three
 * readouts stay frozen as you flip between shapes; only the histogram moves.
 * The univariate cousin of the Datasaurus (which is bivariate and would drag
 * in correlation, a concept this module never teaches): it makes the Section 4
 * warning visceral and hammers the chapter thesis that no summary replaces a
 * plot.
 *
 * Construction: each dataset is built as mirrored ± pairs around the centre, so
 * the mean and median are EXACTLY the centre; the spread is then rescaled so
 * the sample SD is exactly the target. Different "half-shapes" give wildly
 * different histograms with identical summaries.
 */
import { useEffect, useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { mean, quantile, sd } from '../lib/stats'
import { useChartTheme } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { NumberReadout } from './NumberReadout'

type Shape = 'bell' | 'uniform' | 'bimodal' | 'spiky' | 'castle'

const SHAPES: { key: Shape; label: string }[] = [
  { key: 'bell', label: 'Bell' },
  { key: 'uniform', label: 'Flat' },
  { key: 'bimodal', label: 'Two humps' },
  { key: 'spiky', label: 'Spike + tails' },
  { key: 'castle', label: 'Plateau' },
]

const CENTER = 120
const TARGET_SD = 15
const N_PAIRS = 150 // 300 patients once mirrored

/** One non-negative deviation magnitude from the chosen half-shape. */
function halfDraw(shape: Shape, rng: Rng): number {
  switch (shape) {
    case 'bell':
      return Math.abs(rng.normal(0, 1)) // ±|N| reproduces a normal
    case 'uniform':
      return rng.next() // ±U(0,1) reproduces a flat U(−1,1)
    case 'bimodal':
      return 1.3 + rng.normal(0, 0.18) // two tight humps either side of centre
    case 'spiky':
      return rng.next() < 0.72 ? Math.abs(rng.normal(0, 0.35)) : 2.2 + rng.normal(0, 0.18)
    case 'castle':
      return Math.sqrt(rng.next()) // weighted toward the edge → plateau with shoulders
  }
}

/**
 * Build a symmetric dataset around CENTER, then rescale spread so the sample SD
 * is exactly TARGET_SD. Symmetry keeps mean AND median exactly at CENTER.
 */
function makeDataset(shape: Shape, seed: number): number[] {
  const rng = new Rng(seed)
  const devs: number[] = []
  for (let i = 0; i < N_PAIRS; i++) {
    const r = halfDraw(shape, rng)
    devs.push(r, -r)
  }
  const k = TARGET_SD / sd(devs.map((d) => CENTER + d))
  return devs.map((d) => CENTER + d * k)
}

export function SameStatsDemo({ seed = 314 }: { seed?: number }) {
  const { viz } = useChartTheme()
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setIdx((i) => (i + 1) % SHAPES.length), 2200)
    return () => clearInterval(id)
  }, [playing])

  const shape = SHAPES[idx].key
  const values = useMemo(() => makeDataset(shape, seed + idx), [shape, seed, idx])
  const stats = useMemo(
    () => ({ m: mean(values), med: quantile(values, 0.5), s: sd(values) }),
    [values],
  )

  return (
    <div className="widget" data-widget="same-stats">
      <div className="widget__runbar widget__runbar--wrap">
        <div className="btn-group" role="group" aria-label="Distribution shape">
          <span className="btn-group__label">Shape:</span>
          {SHAPES.map((sh, i) => (
            <button
              key={sh.key}
              type="button"
              className={`btn btn--toggle${i === idx ? ' is-active' : ''}`}
              aria-pressed={i === idx}
              onClick={() => {
                setPlaying(false)
                setIdx(i)
              }}
            >
              {sh.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Cycle ▸'}
        </button>
      </div>

      <LiveDistributionPlot
        groups={[{ values, color: viz.null_ }]}
        vlines={[
          { x: stats.m, label: `mean ${stats.m.toFixed(1)}`, color: viz.signal },
          { x: stats.med, label: `median ${stats.med.toFixed(1)}`, color: viz.power, dash: 'dash' },
        ]}
        xRange={[60, 180]}
        bins={48}
        xLabel="Systolic BP (mmHg)"
        yLabel="Patients"
        height={320}
        caption={`Histogram of 300 values shaped as "${SHAPES[idx].label}"; mean ${stats.m.toFixed(1)}, median ${stats.med.toFixed(1)}, SD ${stats.s.toFixed(1)} — identical across every shape.`}
      />

      <p className="widget__note">
        Same three numbers every time; only the histogram moves. This is why the first step of any
        analysis is to <strong>plot the data</strong>, never to trust the summary alone.
      </p>

      <div className="widget__readouts">
        <NumberReadout label="Mean" value={`${stats.m.toFixed(1)} mmHg`} tone="accent" />
        <NumberReadout label="Median" value={`${stats.med.toFixed(1)} mmHg`} tone="accent" />
        <NumberReadout label="SD" value={`${stats.s.toFixed(1)} mmHg`} tone="accent" />
      </div>
    </div>
  )
}
