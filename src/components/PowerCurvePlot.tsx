/**
 * PowerCurvePlot — power (y) vs n per arm (x).
 *
 * Dashed horizontal reference at the target power (default 80%), a vertical
 * reference line at the MCID-driven required n, and an optional marker at the
 * learner's current n. Continuous and binary variants via lib/power.
 */
import { useMemo } from 'react'
import { Plot } from './Plot'
import {
  powerTwoMeans, powerTwoProps,
  sampleSizeTwoMeans, sampleSizeTwoProps,
} from '../lib/power'
import { useChartTheme } from '../theme/chart'

export interface PowerCurvePlotProps {
  outcome?: 'continuous' | 'binary'
  /** Continuous: the MCID (mean difference). */
  effect?: number
  sd?: number
  /** Binary: control and intervention event rates. */
  p1?: number
  p2?: number
  alpha?: number
  targetPower?: number // default 0.8
  /** Highlight the learner's current/feasible n, if any. */
  currentN?: number
}

export function PowerCurvePlot({
  outcome = 'continuous',
  effect = 5,
  sd = 15,
  p1 = 0.4,
  p2 = 0.55,
  alpha = 0.05,
  targetPower = 0.8,
  currentN,
}: PowerCurvePlotProps) {
  const t = useChartTheme()
  const { viz } = t
  const { ns, powers, requiredN } = useMemo(() => {
    // No effect → required n is infinite; render nothing rather than loop forever.
    if (outcome === 'continuous' ? effect === 0 : p1 === p2) {
      return { ns: [], powers: [], requiredN: null as number | null }
    }
    const powerAt = (n: number) =>
      outcome === 'continuous'
        ? powerTwoMeans(effect, sd, n, alpha, 2)
        : powerTwoProps(p1, p2, n, alpha, 2)
    const req =
      outcome === 'continuous'
        ? sampleSizeTwoMeans(effect, sd, alpha, targetPower, 2)
        : sampleSizeTwoProps(p1, p2, alpha, targetPower, 2)
    if (!Number.isFinite(req)) {
      return { ns: [], powers: [], requiredN: null as number | null }
    }
    // Cap the x-range: beyond ~5,000/arm the curve adds nothing pedagogically.
    const maxN = Math.min(
      5000,
      Math.max(Math.ceil(req * 1.8), currentN ? Math.ceil(currentN * 1.3) : 0, 60),
    )
    const ns: number[] = []
    const powers: number[] = []
    const step = Math.max(1, Math.round(maxN / 160))
    for (let n = 4; n <= maxN; n += step) {
      ns.push(n)
      powers.push(powerAt(n))
    }
    return { ns, powers, requiredN: req as number | null }
  }, [outcome, effect, sd, p1, p2, alpha, targetPower, currentN])

  if (requiredN === null) {
    return (
      <p className="widget__note" role="status">
        Set the treatment rate different from the control rate to see the power curve. With no
        effect to detect, no sample size is large enough.
      </p>
    )
  }

  const data: unknown[] = [
    {
      type: 'scatter', mode: 'lines', x: ns, y: powers, name: 'power',
      line: { color: viz.signal, width: 2.5 }, hoverinfo: 'x+y',
    },
  ]
  if (currentN) {
    const pw =
      outcome === 'continuous'
        ? powerTwoMeans(effect, sd, currentN, alpha, 2)
        : powerTwoProps(p1, p2, currentN, alpha, 2)
    data.push({
      type: 'scatter', mode: 'markers+text', x: [currentN], y: [pw],
      text: [`your n (${(pw * 100).toFixed(0)}%)`], textposition: 'bottom right',
      marker: { color: viz.beta, size: 10 }, showlegend: false, hoverinfo: 'x+y',
    })
  }

  return (
    <figure
      role="img"
      aria-label={`Power curve: power rises with n per arm, crossing ${Math.round(targetPower * 100)}% at about n = ${requiredN}.`}
    >
      <Plot
        data={data}
        layout={{
          ...t.base,
          margin: { l: 56, r: 16, t: 28, b: 44 },
          height: 330,
          xaxis: {
            ...(t.base as Record<string, object>).xaxis,
            title: { text: 'Patients per arm (n)', font: t.font },
            rangemode: 'tozero',
          },
          yaxis: {
            ...(t.base as Record<string, object>).yaxis,
            title: { text: 'Power', font: t.font },
            range: [0, 1.02], tickformat: '.0%',
          },
          shapes: [
            {
              type: 'line', xref: 'paper', yref: 'y', x0: 0, x1: 1,
              y0: targetPower, y1: targetPower,
              line: { color: viz.muted, width: 1.5, dash: 'dash' },
            },
            {
              type: 'line', xref: 'x', yref: 'paper', x0: requiredN, x1: requiredN, y0: 0, y1: 1,
              line: { color: viz.power, width: 1.5, dash: 'dot' },
            },
          ],
          annotations: [
            {
              x: 1, xref: 'paper', y: targetPower, yref: 'y', xanchor: 'right', yanchor: 'bottom',
              text: `target ${(targetPower * 100).toFixed(0)}%`, showarrow: false,
              font: { ...t.font, size: 11.5, color: viz.muted },
            },
            {
              x: requiredN, xref: 'x', y: 0.06, yref: 'paper', xanchor: 'left',
              text: ` required n ≈ ${requiredN}`, showarrow: false,
              font: { ...t.font, size: 11.5, color: viz.power },
            },
          ],
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </figure>
  )
}
