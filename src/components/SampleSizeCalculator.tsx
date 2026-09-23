/**
 * SampleSizeCalculator — Module 8 Section 5.
 *
 * Two outcome types (continuous means / binary proportions) × two modes:
 *  - Solve for n: MCID (+ SD or the two rates), alpha, target power →
 *    required n per arm, with a PowerCurvePlot beneath.
 *  - Solve for MDES: n (+ SD or p1), alpha, power → minimum detectable
 *    effect, shown next to the user's MCID with a plain-language verdict.
 * Binary mode interconverts risk difference / risk ratio / rates live.
 */
import { useState } from 'react'
import {
  mdesTwoMeans, mdesTwoProps,
  sampleSizeTwoMeans, sampleSizeTwoProps,
} from '../lib/power'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'
import { PowerCurvePlot } from './PowerCurvePlot'

type OutcomeType = 'continuous' | 'binary'
type Mode = 'n' | 'mdes'

const ALPHAS = [0.01, 0.05, 0.1]
const POWERS = [0.8, 0.9]

function Toggle<T extends string | number>({
  label, value, options, format, onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  format: (v: T) => string
  onChange: (v: T) => void
}) {
  return (
    <div className="btn-group" role="group" aria-label={label}>
      <span className="btn-group__label">{label}</span>
      {options.map((opt) => (
        <button
          key={String(opt)}
          type="button"
          className={`btn btn--toggle${value === opt ? ' is-active' : ''}`}
          aria-pressed={value === opt}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  )
}

export function SampleSizeCalculator({
  defaultOutcome = 'continuous',
}: {
  defaultOutcome?: OutcomeType
}) {
  const [outcome, setOutcome] = useState<OutcomeType>(defaultOutcome)
  const [mode, setMode] = useState<Mode>('n')
  const [alpha, setAlpha] = useState(0.05)
  const [power, setPower] = useState(0.8)
  // continuous inputs
  const [mcid, setMcid] = useState(5)
  const [sdArm, setSdArm] = useState(15)
  // binary inputs
  const [p1, setP1] = useState(0.4)
  const [p2, setP2] = useState(0.55)
  const [mcidP2, setMcidP2] = useState(0.55) // the rate that defines the binary MCID (MDES mode)
  // MDES-mode input
  const [nFixed, setNFixed] = useState(40)

  const pct = (x: number) => `${Math.round(x * 100)}%`

  // ----- results -----
  let requiredN: number | null = null
  let mdes: number | null = null
  let mdesP2: number | null = null

  if (mode === 'n') {
    requiredN =
      outcome === 'continuous'
        ? sampleSizeTwoMeans(mcid, sdArm, alpha, power, 2)
        : p2 !== p1
          ? sampleSizeTwoProps(p1, p2, alpha, power, 2)
          : null
  } else {
    if (outcome === 'continuous') {
      mdes = mdesTwoMeans(sdArm, nFixed, alpha, power, 2)
    } else {
      mdesP2 = mdesTwoProps(p1, nFixed, alpha, power, 2)
      mdes = mdesP2 !== null && !Number.isNaN(mdesP2) ? mdesP2 - p1 : null
    }
  }

  const mcidValue = outcome === 'continuous' ? mcid : mcidP2 - p1
  const canDetect = mode === 'mdes' && mdes !== null && !Number.isNaN(mdes) ? mdes <= mcidValue : null

  const riskInfo = (a: number, b: number) =>
    `risk difference ${((b - a) * 100).toFixed(0)} points · risk ratio ${(b / a).toFixed(2)} (${pct(a)} → ${pct(b)})`

  return (
    <div className="widget" data-widget="sample-size-calculator">
      <div className="widget__runbar widget__runbar--wrap">
        <Toggle
          label="Outcome:"
          value={outcome}
          options={['continuous', 'binary'] as const}
          format={(v) => (v === 'continuous' ? 'continuous means' : 'binary proportions')}
          onChange={setOutcome}
        />
        <Toggle
          label="Mode:"
          value={mode}
          options={['n', 'mdes'] as const}
          format={(v) => (v === 'n' ? 'solve for n' : 'solve for detectable effect')}
          onChange={setMode}
        />
        <Toggle label="α:" value={alpha} options={ALPHAS} format={String} onChange={setAlpha} />
        <Toggle label="Power:" value={power} options={POWERS} format={pct} onChange={setPower} />
      </div>

      <div className="widget__controls">
        {outcome === 'continuous' ? (
          <>
            {mode === 'n' ? (
              <ParameterSlider
                label="MCID (smallest difference worth detecting)"
                min={0.5} max={20} step={0.5} value={mcid} onChange={setMcid} unit="mmHg"
                help="Power on the MCID: the smallest effect you would not want to miss."
              />
            ) : (
              <>
                <ParameterSlider label="Patients per arm you can recruit (n)" min={10} max={1000} step={5} value={nFixed} onChange={setNFixed} />
                <ParameterSlider label="Your MCID (for the verdict)" min={0.5} max={20} step={0.5} value={mcid} onChange={setMcid} unit="mmHg" />
              </>
            )}
            <ParameterSlider label="Expected SD of the outcome" min={5} max={30} step={1} value={sdArm} onChange={setSdArm} unit="mmHg" />
          </>
        ) : (
          <>
            <ParameterSlider
              label="Control event rate (p₁)" min={0.05} max={0.95} step={0.01}
              value={p1} onChange={setP1} format={pct}
            />
            {mode === 'n' ? (
              <ParameterSlider
                label="Treatment rate worth detecting (p₂, your MCID)" min={0.05} max={0.95} step={0.01}
                value={p2} onChange={setP2} format={pct}
              />
            ) : (
              <>
                <ParameterSlider label="Patients per arm you can recruit (n)" min={10} max={1000} step={5} value={nFixed} onChange={setNFixed} />
                <ParameterSlider
                  label="Treatment rate that defines your MCID (p₂)" min={0.05} max={0.95} step={0.01}
                  value={mcidP2} onChange={setMcidP2} format={pct}
                />
              </>
            )}
          </>
        )}
      </div>

      {outcome === 'binary' && (
        <p className="widget__note" aria-live="polite">
          {mode === 'n'
            ? p2 === p1
              ? 'Set the treatment rate different from the control rate to define an effect.'
              : `Your MCID expressed three ways: ${riskInfo(p1, p2)}.`
            : `Your MCID expressed three ways: ${riskInfo(p1, mcidP2)}.`}
        </p>
      )}

      <div className="widget__readouts">
        {mode === 'n' ? (
          <NumberReadout
            label="Required sample size"
            value={requiredN !== null ? `${requiredN} per arm` : '—'}
            sub={requiredN !== null ? `${requiredN * 2} patients in total, before allowing for dropout` : undefined}
            tone="accent"
            size="lg"
          />
        ) : (
          <>
            <NumberReadout
              label="Minimum detectable effect at this n"
              value={
                mdes !== null && !Number.isNaN(mdes)
                  ? outcome === 'continuous'
                    ? `${mdes.toFixed(1)} mmHg`
                    : `${(mdes * 100).toFixed(0)} points (${pct(p1)} → ${pct(mdesP2!)})`
                  : 'not achievable'
              }
              sub={`the smallest true effect this study would detect with ${pct(power)} power`}
              tone="accent"
              size="lg"
            />
            <NumberReadout
              label="Your MCID"
              value={outcome === 'continuous' ? `${mcid} mmHg` : `${((mcidP2 - p1) * 100).toFixed(0)} points`}
            />
          </>
        )}
      </div>

      {canDetect !== null && (
        <p className={`verdict verdict--${canDetect ? 'ok' : 'danger'}`} role="status">
          {canDetect
            ? '✓ Your study CAN reliably detect the smallest difference that matters. The minimum detectable effect is at or below your MCID.'
            : '✗ Your study CANNOT reliably detect the smallest difference that matters. Real, clinically worthwhile effects between your MCID and the detectable effect would likely be missed. This design is underpowered for its clinical purpose.'}
        </p>
      )}

      {mode === 'n' && requiredN !== null && (
        <PowerCurvePlot
          outcome={outcome}
          effect={mcid}
          sd={sdArm}
          p1={p1}
          p2={p2}
          alpha={alpha}
          targetPower={power}
        />
      )}
      {mode === 'mdes' && (
        <PowerCurvePlot
          outcome={outcome}
          effect={mcid}
          sd={sdArm}
          p1={p1}
          p2={mcidP2}
          alpha={alpha}
          targetPower={power}
          currentN={nFixed}
        />
      )}
    </div>
  )
}
