/**
 * EffectSizeIllustrator — Module 8 Section 2.
 *
 * Two overlapping bell curves (control vs intervention BP) driven by sliders
 * for the mean difference and SD, plus an MCID marker on a dedicated
 * difference axis underneath. Readout: the standardised effect
 * (difference ÷ SD) at the MCID. As the difference grows or SD shrinks, the
 * curves visibly separate — separation is detectability.
 */
import { useMemo, useState } from 'react'
import { normalPdf } from '../lib/stats'
import { useChartTheme, withAlpha } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const BASELINE = 120
const X_RANGE: [number, number] = [60, 180]

function linspace(a: number, b: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => a + ((b - a) * i) / (k - 1))
}

export function EffectSizeIllustrator({
  defaultDiff = 5,
  defaultSd = 15,
  defaultMcid = 5,
}: {
  defaultDiff?: number
  defaultSd?: number
  defaultMcid?: number
}) {
  const { viz } = useChartTheme()
  const [diff, setDiff] = useState(defaultDiff)
  const [sdArm, setSdArm] = useState(defaultSd)
  const [mcid, setMcid] = useState(defaultMcid)

  const densities = useMemo(() => {
    const xs = linspace(X_RANGE[0], X_RANGE[1], 280)
    return [
      {
        x: xs, y: xs.map((x) => normalPdf(x, BASELINE, sdArm)),
        color: viz.null_, name: 'control (placebo)', fill: true,
        fillColor: withAlpha(viz.null_, 0.18), showLegend: true,
      },
      {
        x: xs, y: xs.map((x) => normalPdf(x, BASELINE - diff, sdArm)),
        color: viz.signal, name: 'intervention (drug)', fill: true,
        fillColor: withAlpha(viz.signal, 0.18), showLegend: true,
      },
    ]
  }, [diff, sdArm, viz])

  // difference-axis strip geometry (0–15 mmHg reduction)
  const axMin = 0
  const axMax = 15
  const toPct = (v: number) => ((v - axMin) / (axMax - axMin)) * 100

  return (
    <div className="widget" data-widget="effect-size">
      <div className="widget__controls">
        <ParameterSlider label="True mean difference (BP reduction)" min={0} max={15} step={0.5} value={diff} onChange={setDiff} unit="mmHg" />
        <ParameterSlider label="Standard deviation (SD)" min={5} max={30} step={1} value={sdArm} onChange={setSdArm} unit="mmHg" />
        <ParameterSlider
          label="Your MCID (the smallest difference that matters)"
          min={0.5} max={15} step={0.5} value={mcid} onChange={setMcid} unit="mmHg"
          help="A clinical judgement, not a statistical one. Drag the marker on the difference axis below."
        />
      </div>
      <LiveDistributionPlot
        densities={densities}
        vlines={[
          { x: BASELINE, color: viz.null_, dash: 'dot' },
          { x: BASELINE - diff, color: viz.signal, dash: 'dot' },
        ]}
        xRange={X_RANGE}
        xLabel="Systolic BP of individual patients (mmHg)"
        yLabel="Density"
        height={300}
        showLegend
        caption={`Two overlapping BP distributions ${diff} mmHg apart with SD ${sdArm}; standardised separation ${(diff / sdArm).toFixed(2)} SD.`}
      />
      {/* difference axis with the MCID marker and the current true difference */}
      <div className="diff-axis" aria-hidden="true">
        <div className="diff-axis__track">
          <div className="diff-axis__marker diff-axis__marker--mcid" style={{ left: `${toPct(Math.min(axMax, mcid))}%` }}>
            <span>MCID {mcid}</span>
          </div>
          <div className="diff-axis__marker diff-axis__marker--diff" style={{ left: `${toPct(Math.min(axMax, diff))}%` }}>
            <span>true diff {diff}</span>
          </div>
        </div>
        <div className="diff-axis__labels">
          <span>0</span>
          <span>difference between arms (mmHg)</span>
          <span>{axMax}</span>
        </div>
      </div>
      <div className="widget__readouts">
        <NumberReadout
          label="Standardised effect at your MCID"
          value={`${(mcid / sdArm).toFixed(2)} SD`}
          sub={`MCID ÷ SD = ${mcid} ÷ ${sdArm} (a Cohen's-d-style effect size)`}
          tone="accent"
        />
        <NumberReadout
          label="Standardised separation of the curves right now"
          value={`${(diff / sdArm).toFixed(2)} SD`}
          sub="true difference ÷ SD"
        />
      </div>
    </div>
  )
}
