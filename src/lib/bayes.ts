/**
 * Bayesian helpers — normal–normal conjugate updating, used by Module 5's
 * PriorPosteriorUpdater. Pure functions, unit-tested against hand-computed
 * values (see the Module 5 draft's R snippet).
 */
import { normalCdf } from './stats'

export interface NormalDist {
  mean: number
  sd: number
}

/**
 * Posterior for a normal mean with known-variance likelihood:
 * prior Normal(m0, s0) combined with an estimate ± standard error.
 * Posterior precision = prior precision + data precision;
 * posterior mean = precision-weighted average.
 */
export function normalPosterior(prior: NormalDist, estimate: number, se: number): NormalDist {
  const priorPrec = 1 / (prior.sd * prior.sd)
  const dataPrec = 1 / (se * se)
  const postPrec = priorPrec + dataPrec
  return {
    mean: (prior.mean * priorPrec + estimate * dataPrec) / postPrec,
    sd: Math.sqrt(1 / postPrec),
  }
}

/** P(true value < threshold) under a normal posterior. */
export function probBelow(dist: NormalDist, threshold: number): number {
  return normalCdf(threshold, dist.mean, dist.sd)
}

/** Central credible interval (default 95%). */
export function credibleInterval(dist: NormalDist, level = 0.95): [number, number] {
  // z for the central interval; 1.959964 at 95%
  const z = level === 0.95 ? 1.959964 : Math.abs(inverseCdf((1 - level) / 2))
  return [dist.mean - z * dist.sd, dist.mean + z * dist.sd]
}

// local import-free inverse normal for non-95% levels (rarely used)
function inverseCdf(p: number): number {
  // bisection on normalCdf — fine for UI use
  let lo = -10
  let hi = 10
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (normalCdf(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
