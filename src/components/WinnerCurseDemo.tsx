/**
 * WinnerCurseDemo — Module 8 Section 6.
 *
 * Runs the power simulation and shows a second panel: the distribution of
 * effect estimates among SIGNIFICANT trials only, with markers at the true
 * effect and the winners' mean. At low n the winners' mean sits well above
 * the truth (and a few estimates are wrong-signed); raising n collapses the
 * inflation toward the true value.
 */
import { useMemo, useState } from 'react'
import { runTrials } from '../lib/simulate'
import { useChartTheme } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export interface WinnerCurseDemoProps {
  trueEffect?: number // default 5
  sd?: number // default 15
  defaultN?: number // default 30
  alpha?: number // default 0.05
  nTrials?: number // default 3000
  seed?: number
}

export function WinnerCurseDemo({
  trueEffect = 5,
  sd = 15,
  defaultN = 30,
  alpha = 0.05,
  nTrials = 3000,
  seed = 1859,
}: WinnerCurseDemoProps) {
  const { viz } = useChartTheme()
  const [n, setN] = useState(defaultN)

  const result = useMemo(
    () => runTrials({ trueDiff: trueEffect, sd, n, nTrials, alpha, seed }),
    [trueEffect, sd, n, nTrials, alpha, seed],
  )

  const winners = result.significantEstimates
  const losers = result.estimates.filter((_, i) => !result.significant[i])
  const wrongSign = winners.filter((e) => e < 0).length
  const inflation = result.winnersMeanEstimate / trueEffect

  const xRange: [number, number] = [-15, 25]

  return (
    <div className="widget" data-widget="winner-curse">
      <div className="widget__controls">
        <ParameterSlider
          label="Patients per arm (n)"
          min={10} max={200} step={5} value={n} onChange={setN}
          help={`The true effect is fixed at ${trueEffect} mmHg (SD ${sd}). Drag n and watch the winners' estimates.`}
        />
      </div>
      <div className="widget__readouts">
        <NumberReadout
          label="Power at this n"
          value={`≈ ${(result.power * 100).toFixed(0)}%`}
          sub={`${winners.length.toLocaleString()} of ${nTrials.toLocaleString()} simulated trials significant`}
        />
        <NumberReadout
          label="Mean estimate among significant trials"
          value={Number.isNaN(result.winnersMeanEstimate) ? '—' : `${result.winnersMeanEstimate.toFixed(1)} mmHg`}
          sub={`true effect: ${trueEffect.toFixed(1)} mmHg → inflation ×${Number.isNaN(inflation) ? '—' : inflation.toFixed(2)}`}
          tone={Number.isNaN(inflation) ? 'neutral' : inflation > 1.15 ? 'danger' : 'ok'}
          size="lg"
        />
        <NumberReadout
          label="Significant with the WRONG sign"
          value={`${wrongSign}`}
          sub="“the drug raises BP”: significant, and backwards"
          tone={wrongSign > 0 ? 'danger' : 'neutral'}
        />
      </div>
      <div className="widget__duo">
        <div>
          <h4 className="widget__panel-title">All {nTrials.toLocaleString()} simulated trials</h4>
          <LiveDistributionPlot
            groups={[
              { values: losers, name: 'not significant', color: viz.null_ },
              { values: winners, name: 'significant', color: viz.power },
            ]}
            vlines={[{ x: trueEffect, label: `truth ${trueEffect}`, color: viz.signal }]}
            xRange={xRange}
            xLabel="Estimated effect (mmHg)"
            yLabel="Trials"
            height={280}
            bins={50}
            showLegend
            caption={`All simulated effect estimates; ${(result.power * 100).toFixed(0)}% reached significance.`}
          />
        </div>
        <div>
          <h4 className="widget__panel-title">Significant (“published”) trials only</h4>
          <LiveDistributionPlot
            groups={[{ values: winners, name: 'significant', color: viz.power }]}
            vlines={[
              { x: trueEffect, label: `truth ${trueEffect}`, color: viz.signal },
              ...(Number.isNaN(result.winnersMeanEstimate)
                ? []
                : [{ x: result.winnersMeanEstimate, label: `winners' mean ${result.winnersMeanEstimate.toFixed(1)}`, color: viz.alpha }]),
            ]}
            xRange={xRange}
            xLabel="Estimated effect (mmHg)"
            yLabel="Trials"
            height={280}
            bins={50}
            caption={`Estimates among significant trials only; their mean is ${Number.isNaN(result.winnersMeanEstimate) ? 'undefined' : result.winnersMeanEstimate.toFixed(1)} versus a true effect of ${trueEffect}.`}
          />
        </div>
      </div>
    </div>
  )
}
