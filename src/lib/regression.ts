/**
 * Ordinary least squares — simple (one predictor) and two-predictor —
 * backing Module 6's DraggableRegression and AdjustmentDemo.
 * Pure functions, unit-tested.
 */
import { mean } from './stats'

export interface SimpleOls {
  intercept: number
  slope: number
  slopeSe: number
  residuals: number[]
  residualSd: number
  sse: number
  r2: number
}

/** Simple linear regression y = intercept + slope·x by least squares. */
export function simpleOls(x: number[], y: number[]): SimpleOls {
  const n = x.length
  if (n < 3 || y.length !== n) throw new Error('simpleOls: need ≥3 paired observations')
  const mx = mean(x)
  const my = mean(y)
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) * (x[i] - mx)
    sxy += (x[i] - mx) * (y[i] - my)
  }
  const slope = sxy / sxx
  const intercept = my - slope * mx
  const residuals = x.map((xi, i) => y[i] - (intercept + slope * xi))
  const sse = residuals.reduce((s, r) => s + r * r, 0)
  let syy = 0
  for (let i = 0; i < n; i++) syy += (y[i] - my) * (y[i] - my)
  const residualSd = Math.sqrt(sse / (n - 2))
  return {
    intercept,
    slope,
    slopeSe: residualSd / Math.sqrt(sxx),
    residuals,
    residualSd,
    sse,
    r2: syy === 0 ? 1 : 1 - sse / syy,
  }
}

/** Sum of squared residuals for an arbitrary candidate line (learner's drag). */
export function sseForLine(x: number[], y: number[], intercept: number, slope: number): number {
  let s = 0
  for (let i = 0; i < x.length; i++) {
    const r = y[i] - (intercept + slope * x[i])
    s += r * r
  }
  return s
}

export interface TwoPredictorOls {
  intercept: number
  b1: number // coefficient of x1 (e.g. treatment)
  b2: number // coefficient of x2 (e.g. severity)
}

/**
 * Two-predictor least squares y = a + b1·x1 + b2·x2 via the normal
 * equations (3×3 Gaussian elimination). Enough for the adjustment demo;
 * not a general regression package.
 */
export function twoPredictorOls(x1: number[], x2: number[], y: number[]): TwoPredictorOls {
  const n = y.length
  if (n < 4 || x1.length !== n || x2.length !== n) {
    throw new Error('twoPredictorOls: need ≥4 complete observations')
  }
  // Build X'X (symmetric 3×3) and X'y for X = [1, x1, x2]
  let s1 = 0, s2 = 0, s11 = 0, s22 = 0, s12 = 0, sy = 0, s1y = 0, s2y = 0
  for (let i = 0; i < n; i++) {
    s1 += x1[i]
    s2 += x2[i]
    s11 += x1[i] * x1[i]
    s22 += x2[i] * x2[i]
    s12 += x1[i] * x2[i]
    sy += y[i]
    s1y += x1[i] * y[i]
    s2y += x2[i] * y[i]
  }
  const A: number[][] = [
    [n, s1, s2, sy],
    [s1, s11, s12, s1y],
    [s2, s12, s22, s2y],
  ]
  // Gaussian elimination with partial pivoting
  for (let col = 0; col < 3; col++) {
    let pivot = col
    for (let r = col + 1; r < 3; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
    ;[A[col], A[pivot]] = [A[pivot], A[col]]
    if (Math.abs(A[col][col]) < 1e-12) throw new Error('twoPredictorOls: singular design (collinear predictors)')
    for (let r = 0; r < 3; r++) {
      if (r === col) continue
      const f = A[r][col] / A[col][col]
      for (let c = col; c < 4; c++) A[r][c] -= f * A[col][c]
    }
  }
  return { intercept: A[0][3] / A[0][0], b1: A[1][3] / A[1][1], b2: A[2][3] / A[2][2] }
}
