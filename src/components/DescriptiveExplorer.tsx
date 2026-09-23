/**
 * DescriptiveExplorer — Module 2's flagship widget.
 *
 * Three dataset presets (bell-shaped clinic BP / right-skewed length of stay /
 * BP with data-entry outliers) with live mean, median, SD and IQR readouts,
 * mean & median markers on the histogram, and an optional mean ± 2 SD shade
 * with its live coverage percentage (≈95% for the bell; degrades elsewhere).
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { mean, quantile, sd } from '../lib/stats'
import { useChartTheme, withAlpha } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

type Preset = 'bp' | 'stay' | 'outliers'

const PRESETS: Record<Preset, { label: string; xLabel: string; xRange: [number, number]; unit: string }> = {
  bp: { label: 'Clinic BP (bell-shaped)', xLabel: 'Systolic BP (mmHg)', xRange: [60, 180], unit: 'mmHg' },
  stay: { label: 'Length of stay (skewed)', xLabel: 'Hospital stay (days)', xRange: [0, 25], unit: 'days' },
  outliers: { label: 'BP with data-entry errors', xLabel: 'Systolic BP (mmHg)', xRange: [60, 220], unit: 'mmHg' },
}

function makeData(preset: Preset, n: number, sdBp: number, seed: number): number[] {
  const rng = new Rng(seed)
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    if (preset === 'bp') {
      out[i] = rng.normal(120, sdBp)
    } else if (preset === 'stay') {
      out[i] = Math.exp(rng.normal(1.3, 0.6)) // lognormal-ish: median ~3.7 days, long right tail
    } else {
      // ~3% transcription errors landing near 195
      out[i] = rng.next() < 0.03 ? rng.normal(195, 8) : rng.normal(120, 12)
    }
  }
  return out
}

export function DescriptiveExplorer({ seed = 2024 }: { seed?: number }) {
  const { viz } = useChartTheme()
  const [preset, setPreset] = useState<Preset>('bp')
  const [n, setN] = useState(300)
  const [sdBp, setSdBp] = useState(15)
  const [shade, setShade] = useState(false)

  const values = useMemo(() => makeData(preset, n, sdBp, seed), [preset, n, sdBp, seed])

  const stats = useMemo(() => {
    const m = mean(values)
    const s = sd(values)
    const med = quantile(values, 0.5)
    const iqr = quantile(values, 0.75) - quantile(values, 0.25)
    const inside = values.filter((v) => Math.abs(v - m) < 2 * s).length / values.length
    return { m, s, med, iqr, inside }
  }, [values])

  const cfg = PRESETS[preset]
  const dp = 1 // one decimal place suits all three presets

  return (
    <div className="widget" data-widget="descriptive-explorer">
      <div className="widget__runbar widget__runbar--wrap">
        <div className="btn-group" role="group" aria-label="Dataset">
          <span className="btn-group__label">Dataset:</span>
          {(Object.keys(PRESETS) as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn--toggle${preset === p ? ' is-active' : ''}`}
              aria-pressed={preset === p}
              onClick={() => setPreset(p)}
            >
              {PRESETS[p].label}
            </button>
          ))}
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={shade} onChange={(e) => setShade(e.target.checked)} />
          Shade mean ± 2 SD
        </label>
      </div>

      <div className="widget__controls">
        <ParameterSlider label="Number of patients (n)" min={50} max={2000} step={50} value={n} onChange={setN} />
        {preset === 'bp' && (
          <ParameterSlider
            label="Standard deviation (SD)"
            min={5} max={30} step={1} value={sdBp} onChange={setSdBp} unit="mmHg"
            help="The same gesture that will widen Module 4's sampling distribution. Get the muscle memory in early."
          />
        )}
      </div>

      <LiveDistributionPlot
        groups={[{ values, color: viz.null_ }]}
        vlines={[
          { x: stats.m, label: `mean ${stats.m.toFixed(dp)}`, color: viz.signal },
          { x: stats.med, label: `median ${stats.med.toFixed(dp)}`, color: viz.power, dash: 'dash' },
        ]}
        shades={shade ? [{ from: stats.m - 2 * stats.s, to: stats.m + 2 * stats.s, color: withAlpha(viz.signal, 0.1) }] : []}
        xRange={cfg.xRange}
        bins={60}
        xLabel={cfg.xLabel}
        yLabel="Patients"
        height={320}
        caption={`Histogram of ${n} values (${cfg.label}); mean ${stats.m.toFixed(1)}, median ${stats.med.toFixed(1)}, SD ${stats.s.toFixed(1)}.`}
      />

      <div className="widget__readouts">
        <NumberReadout label="Mean" value={`${stats.m.toFixed(dp)} ${cfg.unit}`} tone="accent" />
        <NumberReadout label="Median" value={`${stats.med.toFixed(dp)} ${cfg.unit}`} />
        <NumberReadout label="SD (a typical distance from the mean)" value={`${stats.s.toFixed(dp)} ${cfg.unit}`} />
        <NumberReadout label="IQR (span of the middle half)" value={`${stats.iqr.toFixed(dp)} ${cfg.unit}`} />
        {shade && (
          <NumberReadout
            label="Patients inside mean ± 2 SD"
            value={`${(stats.inside * 100).toFixed(0)}%`}
            sub="a bell-curve promise; on the other presets, look at WHERE the shaded band sits, not just the %"
            tone={Math.abs(stats.inside - 0.95) < 0.02 ? 'ok' : 'danger'}
          />
        )}
      </div>
    </div>
  )
}
