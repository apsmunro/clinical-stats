/**
 * SimulationEngine — the flagship interactive, reused across Modules 4–8.
 *
 * Wraps lib/simulate.runTrials with sliders (true difference, SD, n),
 * stepped trial-count buttons, Run/Reset, and an optional progressive
 * "animate" mode. Output is a live histogram of the simulated effect
 * estimates via LiveDistributionPlot.
 *
 * Module 8 seam: pass `decisionRule` to apply a significance test to each
 * trial — significant trials are coloured in the accent colour, the critical
 * values are marked, and a "Power ≈ XX%" readout appears. PowerSimulator is
 * just this component with that flag on.
 */
import { useEffect, useRef, useState } from 'react'
import { runTrials, type TrialResult } from '../lib/simulate'
import { seBetweenMeans, tQuantile } from '../lib/stats'
import { useChartTheme } from '../theme/chart'
import { LiveDistributionPlot, type VLine } from './LiveDistributionPlot'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export interface SimulationEngineProps {
  defaultTrueDiff?: number // default 0
  defaultSd?: number // default 15
  defaultN?: number // default 40
  /** Draws a labelled marker at the observed result (e.g. −4 mmHg). */
  observedEffect?: number
  /** Show empirical SE next to the theoretical formula sd·√(2/n). */
  showSeReadout?: boolean
  /** Fix the true difference at its default (null-only demos). */
  lockTrueDiff?: boolean
  seed?: number
  nTrialsOptions?: number[] // default [1, 50, 100, 1000, 10000]
  /** Module 8: apply a per-trial significance decision and show power. */
  decisionRule?: boolean
  defaultAlpha?: number // default 0.05 (only used with decisionRule)
  /** Label for the true-difference slider (e.g. "True effect (MCID)"). */
  trueDiffLabel?: string
}

const fmt = (x: number, dp = 2) => x.toFixed(dp)

export function SimulationEngine({
  defaultTrueDiff = 0,
  defaultSd = 15,
  defaultN = 40,
  observedEffect,
  showSeReadout = false,
  lockTrueDiff = false,
  seed = 12345,
  nTrialsOptions = [1, 50, 100, 1000, 10000],
  decisionRule = false,
  defaultAlpha = 0.05,
  trueDiffLabel,
}: SimulationEngineProps) {
  const { viz } = useChartTheme()
  const [trueDiff, setTrueDiff] = useState(defaultTrueDiff)
  const [sdArm, setSdArm] = useState(defaultSd)
  const [n, setN] = useState(defaultN)
  const [alpha, setAlpha] = useState(defaultAlpha)
  const [nTrials, setNTrials] = useState(nTrialsOptions[Math.min(3, nTrialsOptions.length - 1)])
  const [animate, setAnimate] = useState(false)
  const [result, setResult] = useState<TrialResult | null>(null)
  const [shown, setShown] = useState(0) // how many trials are revealed (animate mode)
  const [running, setRunning] = useState(false)
  const runCount = useRef(0)
  const timer = useRef<number | null>(null)

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const stopTimer = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }
  useEffect(() => stopTimer, [])

  const run = () => {
    stopTimer()
    setRunning(true)
    // defer so the button state paints before the (synchronous) simulation
    window.setTimeout(() => {
      const res = runTrials({
        trueDiff, sd: sdArm, n, nTrials, alpha,
        seed: seed + runCount.current++,
      })
      setResult(res)
      setRunning(false)
      if (animate && !reducedMotion && nTrials > 1) {
        setShown(0)
        const stepSize = Math.max(1, Math.round(nTrials / 60))
        timer.current = window.setInterval(() => {
          setShown((s) => {
            const next = s + stepSize
            if (next >= nTrials) stopTimer()
            return Math.min(next, nTrials)
          })
        }, 30)
      } else {
        setShown(nTrials)
      }
    }, 10)
  }

  const reset = () => {
    stopTimer()
    setResult(null)
    setShown(0)
    setTrueDiff(defaultTrueDiff)
    setSdArm(defaultSd)
    setN(defaultN)
    setAlpha(defaultAlpha)
  }

  // visible slice (animate mode reveals progressively)
  const visible = result ? result.estimates.slice(0, shown) : []
  const visibleSig = result ? result.significant.slice(0, shown) : []
  const sigValues: number[] = []
  const nonSigValues: number[] = []
  if (decisionRule) {
    for (let i = 0; i < visible.length; i++) {
      ;(visibleSig[i] ? sigValues : nonSigValues).push(visible[i])
    }
  }
  const shownPower = decisionRule && visible.length > 0 ? sigValues.length / visible.length : null

  const theorySe = seBetweenMeans(sdArm, n)
  const empiricalSe = result && shown > 1 ? sdSlice(visible) : null

  const xRange: [number, number] = [Math.min(-30, trueDiff - 15), Math.max(30, trueDiff + 15)]

  const vlines: VLine[] = []
  if (observedEffect !== undefined) {
    vlines.push({ x: observedEffect, label: `observed ${fmt(observedEffect, 0)}`, color: viz.alpha })
  }
  if (decisionRule) {
    const tcrit = tQuantile(1 - alpha / 2, 2 * n - 2)
    vlines.push(
      { x: -tcrit * theorySe, label: 'critical value', color: viz.muted, dash: 'dash' },
      { x: tcrit * theorySe, label: 'critical value', color: viz.muted, dash: 'dash' },
    )
    if (trueDiff !== 0) vlines.push({ x: trueDiff, label: 'true effect', color: viz.signal, dash: 'dot' })
  }

  return (
    <div className="widget" data-widget={decisionRule ? 'power-simulator' : 'simulation-engine'}>
      <div className="widget__controls">
        <ParameterSlider
          label={trueDiffLabel ?? 'True difference between arms'}
          min={-15} max={15} step={0.5}
          value={trueDiff} onChange={setTrueDiff} unit="mmHg"
          disabled={lockTrueDiff}
          help={lockTrueDiff ? 'Fixed at the null (no effect) for this demo.' : 'The real effect of the drug in the simulated world: something you never know in real life, but control here.'}
        />
        <ParameterSlider
          label="Standard deviation (SD)"
          min={5} max={30} step={1}
          value={sdArm} onChange={setSdArm} unit="mmHg"
          help="How spread out patients' BP values are. Variance is king."
        />
        <ParameterSlider
          label="Patients per arm (n)"
          min={10} max={500} step={5}
          value={n} onChange={setN}
          help="Sample size of each arm in every simulated trial."
        />
        {decisionRule && (
          <ParameterSlider
            label="Significance threshold (α)"
            min={0.01} max={0.2} step={0.01}
            value={alpha} onChange={setAlpha}
            help="The p-value cut-off for calling a trial 'significant'. 0.05 is convention, not law."
          />
        )}
      </div>

      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Number of simulated trials">
          <span className="btn-group__label">Trials:</span>
          {nTrialsOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`btn btn--toggle${nTrials === opt ? ' is-active' : ''}`}
              aria-pressed={nTrials === opt}
              onClick={() => setNTrials(opt)}
            >
              {opt.toLocaleString()}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--primary" onClick={run} disabled={running}>
          {running ? 'Running…' : result ? 'Run again' : 'Run'}
        </button>
        <button type="button" className="btn" onClick={reset}>Reset</button>
        <label className="checkbox">
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
          Animate
        </label>
      </div>

      {result ? (
        <LiveDistributionPlot
          groups={
            decisionRule
              ? [
                  { values: nonSigValues, name: 'not significant', color: viz.null_ },
                  { values: sigValues, name: `significant (p < ${alpha})`, color: viz.power },
                ]
              : // semantic colour: slate while simulating the null, Inference Blue
                // the moment the learner switches a real effect on
                [{ values: visible, color: trueDiff === 0 ? viz.null_ : viz.signal }]
          }
          vlines={vlines}
          xRange={xRange}
          xLabel="Difference in mean BP, intervention − control (mmHg)"
          yLabel="Number of simulated trials"
          showLegend={decisionRule}
          caption={
            decisionRule
              ? `Histogram of ${visible.length} simulated trial results; ${sigValues.length} were statistically significant.`
              : `Histogram of ${visible.length} simulated differences in means.`
          }
        />
      ) : (
        <div className="widget__placeholder">
          Set the sliders, choose a number of trials, then press <strong>Run</strong> to simulate.
        </div>
      )}

      <div className="widget__readouts">
        {decisionRule && shownPower !== null && (
          <NumberReadout
            label="Power (share of trials reaching significance)"
            value={`≈ ${(shownPower * 100).toFixed(0)}%`}
            sub={`${sigValues.length.toLocaleString()} of ${visible.length.toLocaleString()} simulated trials had p < ${alpha}`}
            tone="accent"
            size="lg"
          />
        )}
        {showSeReadout && (
          <>
            <NumberReadout
              label="Empirical SE (SD of the simulated differences)"
              value={empiricalSe !== null ? `${fmt(empiricalSe)} mmHg` : '—'}
              sub="computed from the histogram above"
            />
            <NumberReadout
              label="Theoretical SE"
              value={`${fmt(theorySe)} mmHg`}
              sub="SD × √(2/n), updating with the sliders"
            />
          </>
        )}
      </div>
    </div>
  )
}

function sdSlice(xs: number[]): number {
  if (xs.length < 2) return 0
  let m = 0
  for (const x of xs) m += x
  m /= xs.length
  let s = 0
  for (const x of xs) s += (x - m) * (x - m)
  return Math.sqrt(s / (xs.length - 1))
}
