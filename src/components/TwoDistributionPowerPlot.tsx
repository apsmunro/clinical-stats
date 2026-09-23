/**
 * TwoDistributionPowerPlot — the signature power visual.
 *
 * Two analytic sampling distributions on one axis: the null (centred at 0)
 * and the alternative (centred at the true effect), with the critical values
 * marked and three shaded regions: α (null tail beyond the critical value),
 * β (alternative area on the wrong side), and power = 1 − β. Driven live by
 * four sliders. Dragging n up narrows both curves and visibly shrinks β.
 */
import { useMemo, useState } from 'react'
import { normalCdf, normalPdf, normalQuantile, seBetweenMeans } from '../lib/stats'
import { useChartTheme, withAlpha } from '../theme/chart'
import { LiveDistributionPlot, type DensityTrace } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export interface TwoDistributionPowerPlotProps {
  defaultEffect?: number // default 5
  defaultSd?: number // default 15
  defaultN?: number // default 40
  defaultAlpha?: number // default 0.05
}

const X_RANGE: [number, number] = [-15, 22]
const POINTS = 320

function linspace(a: number, b: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => a + ((b - a) * i) / (k - 1))
}

export function TwoDistributionPowerPlot({
  defaultEffect = 5,
  defaultSd = 15,
  defaultN = 40,
  defaultAlpha = 0.05,
}: TwoDistributionPowerPlotProps) {
  const { viz } = useChartTheme()
  const [effect, setEffect] = useState(defaultEffect)
  const [sdArm, setSdArm] = useState(defaultSd)
  const [n, setN] = useState(defaultN)
  const [alpha, setAlpha] = useState(defaultAlpha)

  const { densities, vlines, power, beta } = useMemo(() => {
    const se = seBetweenMeans(sdArm, n)
    const crit = normalQuantile(1 - alpha / 2) * se // two-tailed critical values ±crit
    const xs = linspace(X_RANGE[0], X_RANGE[1], POINTS)

    const nullY = xs.map((x) => normalPdf(x, 0, se))
    const altY = xs.map((x) => normalPdf(x, effect, se))

    const cut = (xsIn: number[], ysIn: number[], keep: (x: number) => boolean) => {
      const x: number[] = []
      const y: number[] = []
      for (let i = 0; i < xsIn.length; i++) {
        if (keep(xsIn[i])) {
          x.push(xsIn[i])
          y.push(ysIn[i])
        }
      }
      return { x, y }
    }

    // α: null tails beyond ±crit. β: alternative between the critical values
    // (i.e. on the "wrong side"). Power: alternative beyond the critical
    // value(s). Regions are exact even where curves overlap.
    const alphaHi = cut(xs, nullY, (x) => x >= crit)
    const alphaLo = cut(xs, nullY, (x) => x <= -crit)
    const betaRegion = cut(xs, altY, (x) => x > -crit && x < crit)
    const powerHi = cut(xs, altY, (x) => x >= crit)
    const powerLo = cut(xs, altY, (x) => x <= -crit)

    // §8: shaded regions at ~22% opacity with a solid 1.5px edge in full colour
    const ds: DensityTrace[] = [
      { x: alphaHi.x, y: alphaHi.y, fill: true, fillColor: withAlpha(viz.alpha, 0.22), color: viz.alpha, name: 'α (false positive)', showLegend: true },
      { x: alphaLo.x, y: alphaLo.y, fill: true, fillColor: withAlpha(viz.alpha, 0.22), color: viz.alpha, showLegend: false },
      { x: betaRegion.x, y: betaRegion.y, fill: true, fillColor: withAlpha(viz.beta, 0.22), color: viz.beta, name: 'β (missed effect)', showLegend: true },
      { x: powerHi.x, y: powerHi.y, fill: true, fillColor: withAlpha(viz.power, 0.22), color: viz.power, name: 'power (1 − β)', showLegend: true },
      { x: powerLo.x, y: powerLo.y, fill: true, fillColor: withAlpha(viz.power, 0.22), color: viz.power, showLegend: false },
      { x: xs, y: nullY, color: viz.null_, name: 'null: no effect', showLegend: true },
      { x: xs, y: altY, color: viz.signal, name: `alternative: effect = ${effect}`, showLegend: true },
    ]

    const pw =
      1 - normalCdf((crit - effect) / se) + normalCdf((-crit - effect) / se)

    return {
      densities: ds,
      vlines: [
        { x: crit, label: 'critical value', color: viz.muted, dash: 'dash' as const },
        { x: -crit, color: viz.muted, dash: 'dash' as const },
      ],
      power: Math.min(1, pw),
      beta: Math.max(0, 1 - Math.min(1, pw)),
    }
  }, [effect, sdArm, n, alpha, viz])

  return (
    <div className="widget" data-widget="two-distribution-power">
      <div className="widget__controls">
        <ParameterSlider label="True effect" min={0} max={15} step={0.5} value={effect} onChange={setEffect} unit="mmHg" />
        <ParameterSlider label="Standard deviation (SD)" min={5} max={30} step={1} value={sdArm} onChange={setSdArm} unit="mmHg" />
        <ParameterSlider label="Patients per arm (n)" min={10} max={500} step={5} value={n} onChange={setN} />
        <ParameterSlider label="Significance threshold (α)" min={0.01} max={0.2} step={0.01} value={alpha} onChange={setAlpha} />
      </div>
      <LiveDistributionPlot
        densities={densities}
        vlines={vlines}
        xRange={X_RANGE}
        xLabel="Difference in mean BP (mmHg)"
        yLabel="Density"
        height={380}
        showLegend
        caption={`Null and alternative sampling distributions with alpha, beta and power regions shaded. Current power ${(power * 100).toFixed(0)}%.`}
      />
      <div className="widget__readouts">
        <NumberReadout label="Power (1 − β)" value={`${(power * 100).toFixed(1)}%`} tone="ok" size="lg" />
        <NumberReadout label="β (chance of missing the real effect)" value={`${(beta * 100).toFixed(1)}%`} tone="danger" />
        <NumberReadout label="α (chance of a false positive under the null)" value={`${(alpha * 100).toFixed(0)}%`} />
      </div>
    </div>
  )
}
