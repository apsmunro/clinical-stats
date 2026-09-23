/**
 * Analytic power & sample-size formulae (normal approximation) — the
 * closed-form companions to the simulation in simulate.ts. Unit tests verify
 * the two agree within tolerance.
 *
 * Two means (equal n per arm):  n = 2·(z_α + z_β)²·sd² / δ²
 * Two proportions (equal n):    n = (z_α·√(2·p̄·q̄) + z_β·√(p1·q1 + p2·q2))² / (p2 − p1)²
 * n is always rounded UP.
 */
import { normalCdf, normalQuantile, seBetweenMeans } from './stats'

function zAlpha(alpha: number, tails: 1 | 2): number {
  return normalQuantile(1 - alpha / tails)
}

// ---------- continuous outcome (difference in two means) ----------

/** Required n per arm to detect mean difference `delta` with given SD. */
export function sampleSizeTwoMeans(delta: number, sd: number, alpha = 0.05, power = 0.8, tails: 1 | 2 = 2): number {
  const za = zAlpha(alpha, tails)
  const zb = normalQuantile(power)
  return Math.ceil((2 * (za + zb) ** 2 * sd * sd) / (delta * delta))
}

/** Power to detect mean difference `delta` with n per arm. */
export function powerTwoMeans(delta: number, sd: number, n: number, alpha = 0.05, tails: 1 | 2 = 2): number {
  const za = zAlpha(alpha, tails)
  const se = seBetweenMeans(sd, n)
  const ncp = Math.abs(delta) / se
  let pow = 1 - normalCdf(za - ncp)
  if (tails === 2) pow += normalCdf(-za - ncp) // far-tail contribution (tiny)
  return Math.min(1, pow)
}

/** Minimum detectable effect (mean difference) for fixed n per arm. */
export function mdesTwoMeans(sd: number, n: number, alpha = 0.05, power = 0.8, tails: 1 | 2 = 2): number {
  const za = zAlpha(alpha, tails)
  const zb = normalQuantile(power)
  return (za + zb) * seBetweenMeans(sd, n)
}

// ---------- binary outcome (difference in two proportions) ----------

/** Required n per arm to detect a change from rate p1 to rate p2. */
export function sampleSizeTwoProps(p1: number, p2: number, alpha = 0.05, power = 0.8, tails: 1 | 2 = 2): number {
  const za = zAlpha(alpha, tails)
  const zb = normalQuantile(power)
  const pBar = (p1 + p2) / 2
  const qBar = 1 - pBar
  const num = (za * Math.sqrt(2 * pBar * qBar) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
  return Math.ceil(num / (p2 - p1) ** 2)
}

/** Power to detect the change p1 → p2 with n per arm. */
export function powerTwoProps(p1: number, p2: number, n: number, alpha = 0.05, tails: 1 | 2 = 2): number {
  const za = zAlpha(alpha, tails)
  const pBar = (p1 + p2) / 2
  const se0 = Math.sqrt((2 * pBar * (1 - pBar)) / n) // SE under H0 (pooled)
  const se1 = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n) // SE under H1
  const delta = Math.abs(p2 - p1)
  let pow = 1 - normalCdf((za * se0 - delta) / se1)
  if (tails === 2) pow += normalCdf((-za * se0 - delta) / se1)
  return Math.min(1, pow)
}

/**
 * Minimum detectable intervention rate p2 (> p1) for fixed n per arm.
 * Solved by bisection on powerTwoProps. Returns the detectable p2; the
 * corresponding risk difference is p2 − p1.
 */
export function mdesTwoProps(p1: number, n: number, alpha = 0.05, power = 0.8, tails: 1 | 2 = 2): number {
  let lo = p1
  let hi = 1 - 1e-9
  if (powerTwoProps(p1, hi, n, alpha, tails) < power) return NaN // not achievable
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (powerTwoProps(p1, mid, n, alpha, tails) < power) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
