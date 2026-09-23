/**
 * Simulation core — pure, deterministic given a seed, no React.
 *
 * Runs many simulated two-arm trials and records, per trial: the effect
 * estimate (difference in means, or risk difference for binary outcomes),
 * the p-value, and the significance decision at alpha. `power` is the
 * proportion of trials reaching significance — Module 8's headline number.
 * `winnersMeanEstimate` (mean estimate among significant trials only)
 * powers the winner's-curse demo.
 */
import { Rng } from './rng'
import { mean, sd, welchTest, twoPropTest } from './stats'

export type Outcome = 'continuous' | 'binary'

export interface TrialParams {
  outcome?: Outcome // default 'continuous'
  // continuous outcome:
  trueDiff?: number // true mean difference (intervention − control), default 0
  sd?: number // SD of the outcome in each arm, default 15
  baselineMean?: number // control-arm mean, default 120 (systolic BP)
  // binary outcome:
  p1?: number // control event rate
  p2?: number // intervention event rate
  // shared:
  n: number // patients per arm
  nTrials: number // number of simulated trials
  alpha?: number // significance threshold, default 0.05
  tails?: 1 | 2 // default 2
  confidence?: number // CI level, default 0.95
  seed?: number
}

export interface TrialResult {
  estimates: number[] // per-trial effect estimate
  meanDiffs: number[] // alias of estimates (Module 4 naming)
  pValues: number[]
  significant: boolean[]
  ciLow: number[]
  ciHigh: number[]
  power: number // proportion of trials significant at alpha
  empiricalSe: number // SD of the estimates
  winnersMeanEstimate: number // mean estimate among significant trials (NaN if none)
  significantEstimates: number[] // estimates of significant trials only
}

export function runTrials(params: TrialParams): TrialResult {
  const {
    outcome = 'continuous',
    trueDiff = 0,
    sd: sdArm = 15,
    baselineMean = 120,
    p1 = 0.4,
    p2 = 0.55,
    n,
    nTrials,
    alpha = 0.05,
    tails = 2,
    confidence = 0.95,
    seed,
  } = params

  if (n < 2) throw new Error('runTrials: n per arm must be at least 2')
  const rng = new Rng(seed)

  const estimates = new Array<number>(nTrials)
  const pValues = new Array<number>(nTrials)
  const significant = new Array<boolean>(nTrials)
  const ciLow = new Array<number>(nTrials)
  const ciHigh = new Array<number>(nTrials)

  const control = new Array<number>(n)
  const intervention = new Array<number>(n)

  for (let t = 0; t < nTrials; t++) {
    let res
    if (outcome === 'continuous') {
      for (let i = 0; i < n; i++) {
        control[i] = rng.normal(baselineMean, sdArm)
        intervention[i] = rng.normal(baselineMean + trueDiff, sdArm)
      }
      res = welchTest(mean(control), sd(control), n, mean(intervention), sd(intervention), n, tails, confidence)
    } else {
      const x1 = rng.binomial(n, p1)
      const x2 = rng.binomial(n, p2)
      res = twoPropTest(x1, n, x2, n, tails, confidence)
    }
    estimates[t] = res.estimate
    pValues[t] = res.p
    significant[t] = res.p < alpha
    ciLow[t] = res.ciLow
    ciHigh[t] = res.ciHigh
  }

  const significantEstimates = estimates.filter((_, i) => significant[i])
  const nSig = significantEstimates.length

  return {
    estimates,
    meanDiffs: estimates,
    pValues,
    significant,
    ciLow,
    ciHigh,
    power: nSig / nTrials,
    empiricalSe: nTrials > 1 ? sd(estimates) : 0,
    winnersMeanEstimate: nSig > 0 ? mean(significantEstimates) : NaN,
    significantEstimates,
  }
}
