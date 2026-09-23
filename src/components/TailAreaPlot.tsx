/**
 * TailAreaPlot — makes "p-value = tail area of the null distribution"
 * something the learner sees rather than memorises.
 *
 * Simulates the null sampling distribution (true difference fixed at 0) and
 * shades the tail(s) beyond the observed effect. The shaded proportion IS the
 * (empirical) p-value, updating live as the learner drags the observed
 * effect, n, or SD. One-/two-tailed toggle included.
 */
import { useMemo, useState } from 'react'
import { runTrials } from '../lib/simulate'
import { useChartTheme } from '../theme/chart'
import { LiveDistributionPlot, type VLine } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export interface TailAreaPlotProps {
  sd?: number // default 15
  n?: number // default 40
  observedEffect?: number // default −4
  tails?: 1 | 2 // default 2
  seed?: number
  nTrials?: number // null-distribution sample size, default 4000
}

export function TailAreaPlot({
  sd: sdDefault = 15,
  n: nDefault = 40,
  observedEffect: obsDefault = -4,
  tails: tailsDefault = 2,
  seed = 4242,
  nTrials = 4000,
}: TailAreaPlotProps) {
  const { viz } = useChartTheme()
  const [sdArm, setSdArm] = useState(sdDefault)
  const [n, setN] = useState(nDefault)
  const [obs, setObs] = useState(obsDefault)
  const [tails, setTails] = useState<1 | 2>(tailsDefault)

  // Null distribution: recomputed only when SD or n change.
  const nullDist = useMemo(
    () => runTrials({ trueDiff: 0, sd: sdArm, n, nTrials, seed }),
    [sdArm, n, nTrials, seed],
  )

  const { tailValues, bodyValues, p } = useMemo(() => {
    const inTail = (x: number) =>
      tails === 2 ? Math.abs(x) >= Math.abs(obs) : obs < 0 ? x <= obs : x >= obs
    const tail: number[] = []
    const body: number[] = []
    for (const x of nullDist.estimates) (inTail(x) ? tail : body).push(x)
    return { tailValues: tail, bodyValues: body, p: tail.length / nullDist.estimates.length }
  }, [nullDist, obs, tails])

  const vlines: VLine[] = [{ x: obs, label: `observed ${obs.toFixed(1)}`, color: viz.signal }]
  if (tails === 2 && obs !== 0) {
    vlines.push({ x: -obs, label: 'mirror', color: viz.signal, dash: 'dash' })
  }

  return (
    <div className="widget" data-widget="tail-area">
      <div className="widget__controls">
        <ParameterSlider
          label="Observed effect" min={-15} max={15} step={0.5}
          value={obs} onChange={setObs} unit="mmHg"
          help="The result your one real trial produced. Drag it and watch the p-value respond."
        />
        <ParameterSlider label="Standard deviation (SD)" min={5} max={30} step={1} value={sdArm} onChange={setSdArm} unit="mmHg" />
        <ParameterSlider label="Patients per arm (n)" min={10} max={500} step={5} value={n} onChange={setN} />
      </div>
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Number of tails">
          <span className="btn-group__label">Test:</span>
          <button
            type="button"
            className={`btn btn--toggle${tails === 2 ? ' is-active' : ''}`}
            aria-pressed={tails === 2}
            onClick={() => setTails(2)}
          >
            two-tailed
          </button>
          <button
            type="button"
            className={`btn btn--toggle${tails === 1 ? ' is-active' : ''}`}
            aria-pressed={tails === 1}
            onClick={() => setTails(1)}
          >
            one-tailed
          </button>
        </div>
        <NumberReadout
          label="Empirical p-value (shaded share of the null distribution)"
          value={`p ≈ ${p.toFixed(3)}`}
          sub={`${tailValues.length.toLocaleString()} of ${nullDist.estimates.length.toLocaleString()} null trials were at least as extreme as ${obs.toFixed(1)}`}
          tone="accent"
          size="lg"
        />
      </div>
      <LiveDistributionPlot
        groups={[
          { values: bodyValues, name: 'less extreme than observed', color: viz.null_ },
          { values: tailValues, name: 'as / more extreme (the p-value)', color: viz.alpha },
        ]}
        vlines={vlines}
        xRange={[-30, 30]}
        xLabel="Difference in mean BP under the null (mmHg)"
        yLabel="Number of simulated trials"
        showLegend
        caption={`Null sampling distribution with the tail area beyond ${obs.toFixed(1)} shaded; shaded proportion ${p.toFixed(3)}.`}
      />
    </div>
  )
}
