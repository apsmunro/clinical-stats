/**
 * CICoveragePlot — the classic "dance of the confidence intervals".
 *
 * Simulates ~100 trials at a KNOWN true effect; each trial's estimate and CI
 * is drawn as a horizontal line against a vertical line at the truth.
 * Intervals that miss the truth are coloured red (and dashed, so the
 * distinction doesn't rely on colour alone). Headline counter:
 * "X of 100 intervals contain the true value."
 */
import { useMemo, useState } from 'react'
import { Plot } from './Plot'
import { runTrials } from '../lib/simulate'
import { useChartTheme } from '../theme/chart'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export interface CICoveragePlotProps {
  trueDiff?: number // default 5
  sd?: number // default 15
  n?: number // default 40
  nIntervals?: number // default 100
  confidence?: number // default 0.95
  seed?: number
  /** Show n / SD sliders so the learner can watch intervals widen/narrow. */
  showSliders?: boolean
}

export function CICoveragePlot({
  trueDiff: trueDiffDefault = 5,
  sd: sdDefault = 15,
  n: nDefault = 40,
  nIntervals = 100,
  confidence = 0.95,
  seed = 777,
  showSliders = true,
}: CICoveragePlotProps) {
  const t = useChartTheme()
  const { viz } = t
  const [trueDiff, setTrueDiff] = useState(trueDiffDefault)
  const [sdArm, setSdArm] = useState(sdDefault)
  const [n, setN] = useState(nDefault)
  const [runId, setRunId] = useState(0)

  const result = useMemo(
    () => runTrials({ trueDiff, sd: sdArm, n, nTrials: nIntervals, confidence, seed: seed + runId * 1000 }),
    [trueDiff, sdArm, n, nIntervals, confidence, seed, runId],
  )

  const { data, covered } = useMemo(() => {
    const hitX: (number | null)[] = []
    const hitY: (number | null)[] = []
    const missX: (number | null)[] = []
    const missY: (number | null)[] = []
    const estX: number[] = []
    const estY: number[] = []
    const estColor: string[] = []
    let cov = 0
    for (let i = 0; i < nIntervals; i++) {
      const hit = result.ciLow[i] <= trueDiff && trueDiff <= result.ciHigh[i]
      if (hit) cov++
      const xs = hit ? hitX : missX
      const ys = hit ? hitY : missY
      xs.push(result.ciLow[i], result.ciHigh[i], null)
      ys.push(i + 1, i + 1, null)
      estX.push(result.estimates[i])
      estY.push(i + 1)
      estColor.push(hit ? viz.null_ : viz.alpha)
    }
    const traces: unknown[] = [
      {
        type: 'scatter', mode: 'lines', x: hitX, y: hitY, name: 'contains the truth',
        line: { color: viz.null_, width: 1.5 }, hoverinfo: 'skip',
      },
      {
        type: 'scatter', mode: 'lines', x: missX, y: missY, name: 'misses the truth',
        line: { color: viz.alpha, width: 2.4, dash: 'dot' }, hoverinfo: 'skip',
      },
      {
        type: 'scatter', mode: 'markers', x: estX, y: estY, name: 'estimate',
        marker: { color: estColor, size: 4 }, hoverinfo: 'x', showlegend: false,
      },
    ]
    return { data: traces, covered: cov }
  }, [result, trueDiff, nIntervals, viz])

  const xSpan = Math.max(20, 4 * sdArm * Math.sqrt(2 / 10))

  return (
    <div className="widget" data-widget="ci-coverage">
      {showSliders && (
        <div className="widget__controls">
          <ParameterSlider
            label="True effect (you choose it: godlike knowledge!)"
            min={-15} max={15} step={1} value={trueDiff} onChange={setTrueDiff} unit="mmHg"
          />
          <ParameterSlider label="Standard deviation (SD)" min={5} max={30} step={1} value={sdArm} onChange={setSdArm} unit="mmHg" />
          <ParameterSlider label="Patients per arm (n)" min={10} max={200} step={5} value={n} onChange={setN} />
        </div>
      )}
      <div className="widget__runbar">
        <button type="button" className="btn btn--primary" onClick={() => setRunId((r) => r + 1)}>
          Re-run {nIntervals} trials
        </button>
        <NumberReadout
          label={`${Math.round(confidence * 100)}% confidence intervals`}
          value={`${covered} of ${nIntervals} contain the true value`}
          tone={covered / nIntervals >= 0.9 ? 'ok' : 'danger'}
        />
      </div>
      <figure
        role="img"
        aria-label={`${nIntervals} simulated confidence intervals plotted against the true effect of ${trueDiff}; ${covered} contain the truth, ${nIntervals - covered} miss it.`}
      >
        <Plot
          data={data}
          layout={{
            ...t.base,
            margin: { l: 52, r: 16, t: 24, b: 92 },
            height: 480,
            xaxis: {
              ...(t.base as Record<string, object>).xaxis,
              title: { text: 'Difference in mean BP (mmHg)', font: t.font, standoff: 8 },
              range: [trueDiff - xSpan, trueDiff + xSpan],
            },
            yaxis: {
              ...(t.base as Record<string, object>).yaxis,
              title: { text: 'Simulated trial', font: t.font },
              range: [0, nIntervals + 1],
            },
            showlegend: true,
            // legend row sits 56px below the axis line, clear of ticks + title
            legend: { orientation: 'h', y: -(56 / (480 - 24 - 92)), yanchor: 'top', font: t.font },
            shapes: [
              {
                type: 'line', xref: 'x', yref: 'paper',
                x0: trueDiff, x1: trueDiff, y0: 0, y1: 1,
                line: { color: viz.signal, width: 2 },
              },
            ],
            annotations: [
              {
                x: trueDiff, y: 1.01, xref: 'x', yref: 'paper', yanchor: 'bottom',
                text: `true effect = ${trueDiff}`, showarrow: false,
                font: { ...t.font, size: 11.5, color: viz.signal },
              },
            ],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </figure>
    </div>
  )
}
