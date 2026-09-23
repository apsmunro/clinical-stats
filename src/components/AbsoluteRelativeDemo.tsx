/**
 * AbsoluteRelativeDemo — Module 9 Section 6: the spin amplifier.
 *
 * "Halves your risk" can describe a triumph or a rounding error — the
 * baseline risk decides which. Sliders for baseline risk and relative risk;
 * twin bars plus ARR and NNT readouts state the same intervention two ways.
 */
import { useState } from 'react'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const BAR_MAX = 60 // % — fixed scale so bars compare honestly across slider moves

export function AbsoluteRelativeDemo({
  defaultBaseline = 2, // %
  defaultRr = 0.5,
}: {
  defaultBaseline?: number
  defaultRr?: number
}) {
  const [baseline, setBaseline] = useState(defaultBaseline)
  const [rr, setRr] = useState(defaultRr)

  const treated = baseline * rr
  const arr = baseline - treated // percentage points
  const nnt = arr > 0 ? Math.ceil(100 / arr) : Infinity
  const relReduction = Math.round((1 - rr) * 100)

  const bar = (label: string, value: number, cls: string) => (
    <div className="risk-bar">
      <span className="risk-bar__label">{label}</span>
      <div className="risk-bar__track">
        <div
          className={`risk-bar__fill ${cls}`}
          style={{ width: `${Math.min(100, (value / BAR_MAX) * 100)}%` }}
        />
      </div>
      <span className="risk-bar__value">{value.toFixed(1)}%</span>
    </div>
  )

  return (
    <div className="widget" data-widget="absolute-relative">
      <div className="widget__controls">
        <ParameterSlider
          label="Baseline risk (the number headlines omit)"
          min={1} max={60} step={1} value={baseline} onChange={setBaseline} unit="%"
          help="How common the outcome is without treatment. The same relative claim means utterly different medicine at 2% vs 40%."
        />
        <ParameterSlider
          label="Relative risk (the number headlines lead with)"
          min={0.3} max={1} step={0.05} value={rr} onChange={setRr}
          format={(v) => v.toFixed(2)}
        />
      </div>

      <div className="risk-bars" role="img" aria-label={`Baseline risk ${baseline}%, treated risk ${treated.toFixed(1)}%.`}>
        {bar('Without treatment', baseline, 'risk-bar__fill--control')}
        {bar('With treatment', treated, 'risk-bar__fill--treated')}
      </div>

      <div className="widget__readouts">
        <NumberReadout
          label="The relative version (the headline)"
          value={`${relReduction}% risk reduction`}
          sub="true at every baseline, and silent about all of them"
        />
        <NumberReadout
          label="Absolute risk reduction (ARR)"
          value={`${arr.toFixed(1)} points`}
          sub={`${baseline}% → ${treated.toFixed(1)}%`}
          tone="accent"
        />
        <NumberReadout
          label="Number needed to treat (NNT)"
          value={nnt === Infinity ? '—' : String(nnt)}
          sub={
            nnt === Infinity
              ? 'no risk reduction'
              : `treat ${nnt} ${nnt === 1 ? 'patient' : 'patients'} for one to benefit`
          }
          tone={nnt <= 20 ? 'ok' : 'neutral'}
          size="lg"
        />
      </div>
      {rr < 1 && (
        <p className="widget__note">
          Same headline, different medicine: at a 2% baseline, “{relReduction}% reduction” buys an
          NNT of {Math.ceil(100 / (2 * (1 - rr)))}; at 40%, the identical sentence buys an NNT of{' '}
          {Math.ceil(100 / (40 * (1 - rr)))}. ARR = baseline × (1 − RR); NNT = 100 ÷ ARR.
        </p>
      )}
    </div>
  )
}
