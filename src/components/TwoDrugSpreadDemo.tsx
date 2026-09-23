/**
 * TwoDrugSpreadDemo — Module 2 Section 3: "variance is king", made clinical.
 *
 * Two drugs with the SAME mean effect (−8 mmHg) but different response SDs.
 * Drag each SD and watch the smooth response distributions: the tight drug
 * delivers a meaningful drop to nearly everyone, while the noisy drug leaves a
 * large share of patients at no benefit or worse — same average, clinically
 * different drugs. P(reach the 5 mmHg MCID) and P(no benefit or worse) are
 * computed analytically for each, and it foreshadows Module 8 (the noisier drug
 * needs a bigger trial for the same evidence).
 */
import { useMemo, useState } from 'react'
import { normalCdf, normalPdf } from '../lib/stats'
import { useChartTheme, withAlpha } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const MEAN_EFFECT = -8 // mmHg change, negative = improvement
const MCID = -5 // a 5 mmHg drop: the smallest difference worth caring about
const X_RANGE: [number, number] = [-40, 24]

function curve(mu: number, sigma: number): { x: number[]; y: number[] } {
  const x: number[] = []
  const y: number[] = []
  for (let v = X_RANGE[0]; v <= X_RANGE[1] + 1e-9; v += 0.4) {
    x.push(v)
    y.push(normalPdf(v, mu, sigma))
  }
  return { x, y }
}

/** P(reach the MCID) and P(no benefit or worse) for a given response SD. */
function drugStats(sigma: number) {
  return {
    mcid: normalCdf(MCID, MEAN_EFFECT, sigma), // P(change ≤ −5)
    noBenefit: 1 - normalCdf(0, MEAN_EFFECT, sigma), // P(change ≥ 0)
  }
}

const pct = (p: number) => `${(p * 100).toFixed(0)}%`

export function TwoDrugSpreadDemo() {
  const { viz } = useChartTheme()
  const [sdA, setSdA] = useState(4)
  const [sdB, setSdB] = useState(16)

  const a = useMemo(() => curve(MEAN_EFFECT, sdA), [sdA])
  const b = useMemo(() => curve(MEAN_EFFECT, sdB), [sdB])
  const A = useMemo(() => drugStats(sdA), [sdA])
  const B = useMemo(() => drugStats(sdB), [sdB])

  return (
    <div className="widget" data-widget="two-drug-spread">
      <p className="widget__note">
        Both drugs lower BP by <strong>8 mmHg on average</strong>. Drag each spread and watch how
        differently that identical average is delivered.
      </p>

      <div className="widget__controls">
        <ParameterSlider
          label="Drug A — spread of response (SD)"
          min={2} max={20} step={1} value={sdA} onChange={setSdA} unit="mmHg"
        />
        <ParameterSlider
          label="Drug B — spread of response (SD)"
          min={2} max={20} step={1} value={sdB} onChange={setSdB} unit="mmHg"
        />
      </div>

      <LiveDistributionPlot
        densities={[
          { x: a.x, y: a.y, name: `Drug A (SD ${sdA})`, color: viz.signal },
          { x: b.x, y: b.y, name: `Drug B (SD ${sdB})`, color: viz.purple },
        ]}
        vlines={[
          { x: MEAN_EFFECT, label: 'shared mean −8', color: viz.muted },
          { x: MCID, label: 'MCID −5', color: viz.power, dash: 'dash' },
        ]}
        shades={[{ from: 0, to: X_RANGE[1], color: withAlpha(viz.beta, 0.14) }]}
        xRange={X_RANGE}
        xLabel="Change in systolic BP (mmHg) — negative = improvement"
        yLabel="Relative frequency"
        height={340}
        showLegend
        caption={`Two response distributions sharing a mean of −8 mmHg. Drug A SD ${sdA}: ${pct(A.mcid)} reach the MCID, ${pct(A.noBenefit)} get no benefit or worse. Drug B SD ${sdB}: ${pct(B.mcid)} reach the MCID, ${pct(B.noBenefit)} get no benefit or worse. The shaded band is no benefit or worse.`}
      />

      <div className="widget__readouts">
        <NumberReadout label="Drug A: reach the 5 mmHg MCID" value={pct(A.mcid)} tone="ok" />
        <NumberReadout label="Drug A: no benefit or worse" value={pct(A.noBenefit)} tone="danger" />
        <NumberReadout label="Drug B: reach the 5 mmHg MCID" value={pct(B.mcid)} tone="ok" />
        <NumberReadout label="Drug B: no benefit or worse" value={pct(B.noBenefit)} tone="danger" />
      </div>

      <p className="widget__note">
        Same mean, different drugs: the noisy drug abandons a sizeable share of patients at zero
        benefit or worse. And as Module 8 will show, that same noise forces a far bigger trial to
        pin the effect down. Variance is king.
      </p>
    </div>
  )
}
