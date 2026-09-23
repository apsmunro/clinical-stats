/**
 * AdjustmentDemo — Module 6 Section 4: confounding by indication, interactive.
 *
 * A simulated observational study where sicker patients preferentially get
 * the drug. The crude treated-vs-untreated comparison looks null (or
 * harmful); toggling "Adjust for severity" fits outcome ~ treated + severity
 * and recovers the true −4 mmHg benefit. A confounding-strength slider shows
 * that with no confounding (randomisation!) crude ≈ adjusted.
 */
import { useMemo, useState } from 'react'
import { Plot } from './Plot'
import { Rng } from '../lib/rng'
import { mean } from '../lib/stats'
import { twoPredictorOls } from '../lib/regression'
import { useChartTheme } from '../theme/chart'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const TRUE_EFFECT = -4 // mmHg — the built-in truth
const SEV_COEF = 1.5 // sicker patients' BP falls less / rises
const NOISE_SD = 4
const N = 120

interface Dataset {
  severity: number[]
  treated: number[]
  bpChange: number[]
}

function makeData(seed: number, strength: number): Dataset {
  const rng = new Rng(seed)
  const severity: number[] = []
  const treated: number[] = []
  const bpChange: number[] = []
  for (let i = 0; i < N; i++) {
    const s = rng.next() * 10
    const pTreat = 1 / (1 + Math.exp(-strength * (s - 5)))
    const t = rng.next() < pTreat ? 1 : 0
    severity.push(s)
    treated.push(t)
    bpChange.push(TRUE_EFFECT * t + SEV_COEF * s + rng.normal(0, NOISE_SD))
  }
  // guarantee both arms exist even at extreme strength (flip two if needed)
  if (!treated.includes(1)) treated[0] = 1
  if (!treated.includes(0)) treated[1] = 0
  return { severity, treated, bpChange }
}

export function AdjustmentDemo({ seed = 6006 }: { seed?: number }) {
  const t = useChartTheme()
  const { viz } = t
  const [adjust, setAdjust] = useState(false)
  const [strength, setStrength] = useState(1)
  const [runId, setRunId] = useState(0)

  const data = useMemo(() => makeData(seed + runId * 131, strength), [seed, runId, strength])

  const { crude, fit } = useMemo(() => {
    const treatedY = data.bpChange.filter((_, i) => data.treated[i] === 1)
    const controlY = data.bpChange.filter((_, i) => data.treated[i] === 0)
    return {
      crude: mean(treatedY) - mean(controlY),
      fit: twoPredictorOls(data.treated, data.severity, data.bpChange),
    }
  }, [data])

  const traces = useMemo(() => {
    const tx: number[] = []
    const ty: number[] = []
    const cx: number[] = []
    const cy: number[] = []
    for (let i = 0; i < N; i++) {
      if (data.treated[i] === 1) {
        tx.push(data.severity[i])
        ty.push(data.bpChange[i])
      } else {
        cx.push(data.severity[i])
        cy.push(data.bpChange[i])
      }
    }
    const out: unknown[] = [
      {
        type: 'scatter', mode: 'markers', x: cx, y: cy, name: 'untreated',
        marker: { color: viz.null_, symbol: 'square', size: 7, opacity: 0.8 },
        hoverinfo: 'skip',
      },
      {
        type: 'scatter', mode: 'markers', x: tx, y: ty, name: 'treated',
        marker: { color: viz.signal, symbol: 'circle', size: 7, opacity: 0.85 },
        hoverinfo: 'skip',
      },
    ]
    if (adjust) {
      // parallel fitted lines from outcome ~ treated + severity
      const xs = [0, 10]
      out.push(
        {
          type: 'scatter', mode: 'lines', x: xs, y: xs.map((x) => fit.intercept + fit.b2 * x),
          name: 'untreated (fitted)', line: { color: viz.null_, width: 2.5 }, hoverinfo: 'skip',
        },
        {
          type: 'scatter', mode: 'lines', x: xs, y: xs.map((x) => fit.intercept + fit.b1 + fit.b2 * x),
          name: 'treated (fitted)', line: { color: viz.signal, width: 2.5 }, hoverinfo: 'skip',
        },
      )
    } else {
      // crude group means as horizontal lines
      const meanT = mean(data.bpChange.filter((_, i) => data.treated[i] === 1))
      const meanC = mean(data.bpChange.filter((_, i) => data.treated[i] === 0))
      out.push(
        {
          type: 'scatter', mode: 'lines', x: [0, 10], y: [meanC, meanC],
          name: 'untreated mean (crude)', line: { color: viz.null_, width: 2.5, dash: 'dash' }, hoverinfo: 'skip',
        },
        {
          type: 'scatter', mode: 'lines', x: [0, 10], y: [meanT, meanT],
          name: 'treated mean (crude)', line: { color: viz.signal, width: 2.5, dash: 'dash' }, hoverinfo: 'skip',
        },
      )
    }
    return out
  }, [data, adjust, fit, viz])

  const estimate = adjust ? fit.b1 : crude
  const fmt = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(1)}`

  return (
    <div className="widget" data-widget="adjustment-demo">
      <div className="widget__runbar">
        <label className="checkbox">
          <input type="checkbox" checked={adjust} onChange={(e) => setAdjust(e.target.checked)} />
          <strong>Adjust for severity</strong>
        </label>
        <button type="button" className="btn" onClick={() => setRunId((r) => r + 1)}>
          New simulated study
        </button>
      </div>
      <div className="widget__controls">
        <ParameterSlider
          label="Confounding strength (how much severity drives prescribing)"
          min={0} max={2} step={0.1} value={strength} onChange={setStrength}
          help="At 0, treatment is assigned by coin flip (that's randomisation) and crude ≈ adjusted. Crank it up and watch the crude estimate drift from the truth."
        />
      </div>

      <figure
        role="img"
        aria-label={`Scatter of BP change against baseline severity, treated and untreated patients. ${adjust ? `Adjusted treatment effect ${fmt(fit.b1)}` : `Crude difference ${fmt(crude)}`} mmHg versus a true effect of ${TRUE_EFFECT}.`}
      >
        <Plot
          data={traces}
          layout={{
            ...t.base,
            margin: { l: 56, r: 16, t: 24, b: 92 },
            height: 380,
            xaxis: {
              ...(t.base as Record<string, object>).xaxis,
              title: { text: 'Baseline severity score (0–10)', font: t.font, standoff: 8 },
              range: [-0.3, 10.3],
            },
            yaxis: {
              ...(t.base as Record<string, object>).yaxis,
              title: { text: 'Change in BP at follow-up (mmHg, negative = improvement)', font: t.font },
              range: [-14, 22],
            },
            showlegend: true,
            // legend row sits 56px below the axis line, clear of ticks + title
            legend: { orientation: 'h', y: -(56 / (380 - 24 - 92)), yanchor: 'top', font: t.font },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </figure>

      <div className="widget__readouts">
        <NumberReadout
          label={adjust ? 'Adjusted treatment effect' : 'Crude treatment effect'}
          value={`${fmt(estimate)} mmHg`}
          sub={
            adjust
              ? 'among patients of the same severity: comparing like with like'
              : 'treated minus untreated, ignoring severity'
          }
          tone={Math.abs(estimate - TRUE_EFFECT) < 1.5 ? 'ok' : 'danger'}
          size="lg"
        />
        <NumberReadout
          label="The truth (built into the simulation)"
          value={`${TRUE_EFFECT.toFixed(1)} mmHg`}
          sub="godlike knowledge, as in the CI dance"
        />
        <NumberReadout
          label="Severity coefficient (adjusted model)"
          value={adjust ? `${fmt(fit.b2)} mmHg/pt` : '—'}
          sub="each severity point costs this much BP improvement"
        />
      </div>
    </div>
  )
}
