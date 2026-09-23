/**
 * Lightweight statistical helpers — no external dependencies.
 * Descriptives, the normal distribution (pdf / cdf / quantile), Student's t
 * (cdf / quantile via the incomplete beta function), two-sample tests, and a
 * histogram binning utility shared by the plotting components.
 */

// ---------- descriptives ----------

export function mean(xs: number[]): number {
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

/** Sample standard deviation (n − 1 denominator). */
export function sd(xs: number[]): number {
  const m = mean(xs)
  let s = 0
  for (const x of xs) s += (x - m) * (x - m)
  return Math.sqrt(s / (xs.length - 1))
}

/** Linear-interpolated quantile, q in [0, 1]. */
export function quantile(xs: number[], q: number): number {
  const sorted = [...xs].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** Theoretical SE of a difference in means, equal n and SD per arm. */
export function seBetweenMeans(sdArm: number, nPerArm: number): number {
  return sdArm * Math.sqrt(2 / nPerArm)
}

// ---------- normal distribution ----------

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

/** Abramowitz & Stegun 7.1.26 erf approximation (|error| < 1.5e-7). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax)
  return sign * y
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)))
}

/** Acklam's inverse-normal algorithm (relative error ~1e-9). */
export function normalQuantile(p: number): number {
  if (p <= 0 || p >= 1) throw new Error(`normalQuantile: p must be in (0,1), got ${p}`)
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const pLow = 0.02425
  let q: number, r: number
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= 1 - pLow) {
    q = p - 0.5
    r = q * q
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

// ---------- Student's t (via the regularised incomplete beta) ----------

/** Lanczos log-gamma. */
function lgamma(x: number): number {
  const g = 7
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  x -= 1
  let a = coef[0]
  const t = x + g + 0.5
  for (let i = 1; i < g + 2; i++) a += coef[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Continued fraction for the incomplete beta (Numerical Recipes). */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200
  const EPS = 3e-12
  const FPMIN = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

/** Regularised incomplete beta I_x(a, b). */
function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a
  return 1 - (bt * betacf(b, a, 1 - x)) / b
}

export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t)
  const p = 0.5 * ibeta(df / 2, 0.5, x)
  return t > 0 ? 1 - p : p
}

/** t quantile via bisection on tCdf (plenty fast for UI use). */
export function tQuantile(p: number, df: number): number {
  if (p <= 0 || p >= 1) throw new Error(`tQuantile: p must be in (0,1), got ${p}`)
  let lo = -100
  let hi = 100
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    if (tCdf(mid, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ---------- two-sample tests ----------

export interface TestResult {
  estimate: number // group2 − group1 (mean difference or risk difference)
  se: number
  p: number
  ciLow: number
  ciHigh: number
}

/**
 * Welch two-sample t-test from summary statistics.
 * tails=1 tests in the direction of the observed estimate.
 */
export function welchTest(
  m1: number, s1: number, n1: number,
  m2: number, s2: number, n2: number,
  tails: 1 | 2 = 2,
  confidence = 0.95,
): TestResult {
  const v1 = (s1 * s1) / n1
  const v2 = (s2 * s2) / n2
  const se = Math.sqrt(v1 + v2)
  const estimate = m2 - m1
  const df = ((v1 + v2) * (v1 + v2)) / ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1))
  const t = estimate / se
  const pOne = 1 - tCdf(Math.abs(t), df)
  const p = Math.min(1, tails === 2 ? 2 * pOne : pOne)
  const tcrit = tQuantile(1 - (1 - confidence) / 2, df)
  return { estimate, se, p, ciLow: estimate - tcrit * se, ciHigh: estimate + tcrit * se }
}

/**
 * Two-proportion z-test (pooled SE for the test, unpooled Wald CI).
 * tails=1 tests in the direction of the observed estimate.
 */
export function twoPropTest(
  x1: number, n1: number,
  x2: number, n2: number,
  tails: 1 | 2 = 2,
  confidence = 0.95,
): TestResult {
  const p1 = x1 / n1
  const p2 = x2 / n2
  const estimate = p2 - p1
  const pPool = (x1 + x2) / (n1 + n2)
  const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2))
  const seWald = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2)
  let p: number
  if (sePool === 0) {
    p = 1 // all events or no events in both arms — no evidence either way
  } else {
    const z = Math.abs(estimate) / sePool
    const pOne = 1 - normalCdf(z)
    p = Math.min(1, tails === 2 ? 2 * pOne : pOne)
  }
  const zcrit = normalQuantile(1 - (1 - confidence) / 2)
  return { estimate, se: seWald, p, ciLow: estimate - zcrit * seWald, ciHigh: estimate + zcrit * seWald }
}

// ---------- histogram binning (shared by plot components) ----------

export interface Histogram {
  centers: number[]
  counts: number[]
  binWidth: number
}

/** Bin values into a fixed-range histogram. Out-of-range values clamp to end bins. */
export function histogram(values: number[], min: number, max: number, bins: number): Histogram {
  const binWidth = (max - min) / bins
  const counts = new Array<number>(bins).fill(0)
  for (const v of values) {
    let i = Math.floor((v - min) / binWidth)
    if (i < 0) i = 0
    if (i >= bins) i = bins - 1
    counts[i]++
  }
  const centers = Array.from({ length: bins }, (_, i) => min + (i + 0.5) * binWidth)
  return { centers, counts, binWidth }
}
