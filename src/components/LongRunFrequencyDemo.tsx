/**
 * LongRunFrequencyDemo — Module 3's one widget.
 *
 * A patient either responds or doesn't; the true response probability is set
 * by a slider. Observe patients 1 / 10 / 100 / 1,000 at a time and watch the
 * running proportion: wild early, settling onto the dashed truth line as the
 * law of large numbers does its slow work. The last-10 chips keep the raw
 * randomness tangible, and the longest-streak readout shows that streaks are
 * what fair chance looks like.
 */
import { useRef, useState } from 'react'
import { Plot } from './Plot'
import { Rng } from '../lib/rng'
import { useChartTheme } from '../theme/chart'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const MAX_PATIENTS = 20000

export function LongRunFrequencyDemo({ seed = 333, defaultP = 0.5 }: { seed?: number; defaultP?: number }) {
  const t = useChartTheme()
  const { viz } = t
  const [p, setP] = useState(defaultP)
  const [outcomes, setOutcomes] = useState<number[]>([])
  const rng = useRef(new Rng(seed))

  const observe = (k: number) => {
    setOutcomes((prev) => {
      const next = [...prev]
      for (let i = 0; i < k && next.length < MAX_PATIENTS; i++) {
        next.push(rng.current.next() < p ? 1 : 0)
      }
      return next
    })
  }

  const reset = () => {
    rng.current = new Rng(seed + Math.floor(Math.random() * 1e6)) // fresh run each reset
    setOutcomes([])
  }

  // running proportion + longest streak
  const running: number[] = []
  let sum = 0
  let longest = 0
  let current = 0
  let last = -1
  for (let i = 0; i < outcomes.length; i++) {
    sum += outcomes[i]
    running.push(sum / (i + 1))
    if (outcomes[i] === last) current += 1
    else {
      current = 1
      last = outcomes[i]
    }
    if (current > longest) longest = current
  }
  const nObs = outcomes.length
  const rate = nObs > 0 ? sum / nObs : null
  const last10 = outcomes.slice(-10)

  const xMax = Math.max(100, nObs)

  return (
    <div className="widget" data-widget="long-run-frequency">
      <div className="widget__controls">
        <ParameterSlider
          label="True response probability (the truth, unknowable in real life)"
          min={0.05} max={0.95} step={0.05} value={p} onChange={setP}
          help="Changing it mid-run is allowed; future patients follow the new truth."
        />
      </div>
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Observe patients">
          <span className="btn-group__label">Observe:</span>
          {[1, 10, 100, 1000].map((k) => (
            <button key={k} type="button" className="btn btn--toggle" onClick={() => observe(k)}>
              +{k.toLocaleString()}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={reset}>
          Reset
        </button>
        {last10.length > 0 && (
          <span className="chips" aria-label={`Last ${last10.length} outcomes`}>
            {last10.map((o, i) => (
              <span key={i} className={`chip ${o ? 'chip--yes' : 'chip--no'}`} aria-hidden="true">
                {o ? '✓' : '✗'}
              </span>
            ))}
          </span>
        )}
      </div>

      {nObs > 0 ? (
        <figure
          role="img"
          aria-label={`Running observed response rate over ${nObs} patients, converging toward the true probability ${p}.`}
        >
          <Plot
            data={[
              {
                type: 'scatter',
                mode: 'lines',
                x: running.map((_, i) => i + 1),
                y: running,
                line: { color: viz.signal, width: 2.5 },
                hoverinfo: 'x+y',
                name: 'observed rate',
              },
            ]}
            layout={{
              ...t.base,
              margin: { l: 56, r: 16, t: 20, b: 44 },
              height: 300,
              xaxis: {
                ...(t.base as Record<string, object>).xaxis,
                title: { text: 'Patients observed so far', font: t.font },
                range: [0, xMax * 1.02],
              },
              yaxis: {
                ...(t.base as Record<string, object>).yaxis,
                title: { text: 'Observed response rate', font: t.font },
                range: [0, 1], tickformat: '.0%',
              },
              shapes: [
                {
                  type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1, y0: p, y1: p,
                  line: { color: viz.power, width: 1.5, dash: 'dash' },
                },
              ],
              annotations: [
                {
                  x: 1, xref: 'paper', y: p, yref: 'y', xanchor: 'right', yanchor: 'bottom',
                  text: `the truth (${(p * 100).toFixed(0)}%)`, showarrow: false,
                  font: { ...t.font, size: 11.5, color: viz.power },
                },
              ],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </figure>
      ) : (
        <div className="widget__placeholder">
          Press <strong>+10</strong> a few times and watch the observed rate lurch around. Then add
          +1,000 and watch the long run arrive.
        </div>
      )}

      <div className="widget__readouts">
        <NumberReadout label="Patients observed" value={nObs.toLocaleString()} />
        <NumberReadout
          label="Observed response rate"
          value={rate === null ? '—' : `${(rate * 100).toFixed(1)}%`}
          sub={rate === null ? undefined : `truth: ${(p * 100).toFixed(0)}%; gap: ${Math.abs(rate - p) > 0.0005 ? ((rate - p) * 100).toFixed(1) : '0.0'} points`}
          tone="accent"
          size="lg"
        />
        <NumberReadout
          label="Longest streak of identical outcomes"
          value={nObs > 0 ? `${longest}` : '—'}
          sub="streaks this long are what fair randomness looks like"
          tone={longest >= 5 ? 'danger' : 'neutral'}
        />
      </div>
    </div>
  )
}
