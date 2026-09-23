/**
 * PriorPosteriorUpdater — Module 5's flagship widget.
 *
 * Choose a prior (flat / sceptical / optimistic / custom), set the data
 * (observed difference and n per arm → likelihood centre and width), and
 * watch the posterior form as a precision-weighted compromise. Readouts:
 * posterior mean, 95% credible interval, P(effect < 0), P(effect ≤ MCID).
 * Exact normal–normal conjugate update via lib/bayes — no simulation.
 */
import { useMemo, useState } from 'react'
import { credibleInterval, normalPosterior, probBelow } from '../lib/bayes'
import { normalPdf, seBetweenMeans } from '../lib/stats'
import { useChartTheme, withAlpha } from '../theme/chart'
import { LiveDistributionPlot, type DensityTrace } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

type Preset = 'flat' | 'sceptical' | 'optimistic' | 'custom'

const PRESETS: Record<Exclude<Preset, 'custom'>, { mean: number; sd: number; blurb: string }> = {
  flat: { mean: 0, sd: 100, blurb: 'no strong opinion: let the data speak' },
  sceptical: { mean: 0, sd: 2, blurb: 'most drugs like this do little or nothing' },
  optimistic: { mean: -5, sd: 3, blurb: 'mechanism and earlier studies look promising' },
}

const X_RANGE: [number, number] = [-15, 15]
const SD_BP = 15 // the course's fixed outcome SD

function linspace(a: number, b: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => a + ((b - a) * i) / (k - 1))
}

/** Curve normalised to max 1 — likelihoods are only defined up to scale,
 *  and unit-height curves keep all three shapes readable on one axis. */
function unitCurve(xs: number[], mu: number, sigma: number): number[] {
  const peak = normalPdf(mu, mu, sigma)
  return xs.map((x) => normalPdf(x, mu, sigma) / peak)
}

export function PriorPosteriorUpdater({
  defaultObserved = -4,
  defaultN = 40,
  mcid = -5, // P(effect ≤ mcid) readout; pays forward to Module 8
}: {
  defaultObserved?: number
  defaultN?: number
  mcid?: number
}) {
  const { viz } = useChartTheme()
  const [preset, setPreset] = useState<Preset>('flat')
  const [customMean, setCustomMean] = useState(0)
  const [customSd, setCustomSd] = useState(5)
  const [observed, setObserved] = useState(defaultObserved)
  const [n, setN] = useState(defaultN)

  const prior =
    preset === 'custom' ? { mean: customMean, sd: customSd } : PRESETS[preset]
  const se = seBetweenMeans(SD_BP, n)
  const posterior = useMemo(() => normalPosterior(prior, observed, se), [prior.mean, prior.sd, observed, se])
  const [criLo, criHi] = credibleInterval(posterior)
  const pBelow0 = probBelow(posterior, 0)
  const pBeyondMcid = probBelow(posterior, mcid)

  const densities = useMemo<DensityTrace[]>(() => {
    const xs = linspace(X_RANGE[0], X_RANGE[1], 300)
    return [
      {
        x: xs, y: unitCurve(xs, prior.mean, prior.sd),
        color: viz.null_, name: `prior (${preset})`, showLegend: true,
      },
      {
        x: xs, y: unitCurve(xs, observed, se),
        color: viz.signal, name: 'likelihood (the data)', showLegend: true,
      },
      {
        x: xs, y: unitCurve(xs, posterior.mean, posterior.sd),
        color: viz.power, name: 'posterior (updated belief)', fill: true,
        fillColor: withAlpha(viz.power, 0.22), showLegend: true,
      },
    ]
  }, [prior.mean, prior.sd, preset, observed, se, posterior, viz])

  const fmt = (x: number) => x.toFixed(1)

  return (
    <div className="widget" data-widget="prior-posterior">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Prior preset">
          <span className="btn-group__label">Prior:</span>
          {(['flat', 'sceptical', 'optimistic', 'custom'] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn--toggle${preset === p ? ' is-active' : ''}`}
              aria-pressed={preset === p}
              onClick={() => setPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="widget__note" aria-live="polite">
          {preset === 'custom'
            ? 'set your own prior below'
            : `“${PRESETS[preset as Exclude<Preset, 'custom'>].blurb}”`}
        </span>
      </div>

      <div className="widget__controls">
        {preset === 'custom' && (
          <>
            <ParameterSlider label="Prior mean" min={-10} max={10} step={0.5} value={customMean} onChange={setCustomMean} unit="mmHg" />
            <ParameterSlider label="Prior SD (how sure you are)" min={0.5} max={20} step={0.5} value={customSd} onChange={setCustomSd} unit="mmHg"
              help="Small SD = a confident prior that takes a lot of data to move." />
          </>
        )}
        <ParameterSlider
          label="Observed difference (the trial result)"
          min={-15} max={15} step={0.5} value={observed} onChange={setObserved} unit="mmHg"
        />
        <ParameterSlider
          label="Patients per arm (n)"
          min={10} max={1000} step={10} value={n} onChange={setN}
          help="More patients → a narrower likelihood → a louder voice for the data."
        />
      </div>

      <LiveDistributionPlot
        densities={densities}
        vlines={[{ x: 0, label: 'no effect', color: viz.muted, dash: 'dash' }]}
        xRange={X_RANGE}
        xLabel="True difference in mean BP (mmHg)"
        yLabel="Relative plausibility"
        height={340}
        showLegend
        caption={`Prior (${preset}), likelihood centred on ${fmt(observed)} with SE ${se.toFixed(2)}, and the resulting posterior centred on ${fmt(posterior.mean)}.`}
      />

      <div className="widget__readouts">
        <NumberReadout
          label="Posterior mean"
          value={`${fmt(posterior.mean)} mmHg`}
          sub={`a precision-weighted compromise between prior (${fmt(prior.mean)}) and data (${fmt(observed)})`}
        />
        <NumberReadout
          label="95% credible interval"
          value={`${fmt(criLo)} to ${fmt(criHi)}`}
          sub="95% probability the true effect is in this range (the licensed sentence)"
        />
        <NumberReadout
          label="P(drug lowers BP at all)"
          value={`${(pBelow0 * 100).toFixed(0)}%`}
          sub="P(true effect < 0 | data, prior)"
          tone="accent"
          size="lg"
        />
        <NumberReadout
          label={`P(effect reaches ${Math.abs(mcid)} mmHg)`}
          value={`${(pBeyondMcid * 100).toFixed(0)}%`}
          sub={`P(true effect ≤ ${mcid} | data, prior): the MCID question (Module 8)`}
        />
      </div>
    </div>
  )
}
