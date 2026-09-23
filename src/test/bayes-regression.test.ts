import { describe, expect, it } from 'vitest'
import { credibleInterval, normalPosterior, probBelow } from '../lib/bayes'
import { simpleOls, sseForLine, twoPredictorOls } from '../lib/regression'
import { Rng } from '../lib/rng'
import { mean, sd, seBetweenMeans } from '../lib/stats'

describe('bayes — normal–normal conjugate update', () => {
  const se40 = seBetweenMeans(15, 40) // ≈ 3.354, the Module 4 trial

  it('matches the hand-computed Module 5 worked example (skeptical prior)', () => {
    const post = normalPosterior({ mean: 0, sd: 2 }, -4, se40)
    expect(post.mean).toBeCloseTo(-1.049, 2)
    expect(post.sd).toBeCloseTo(1.718, 2)
    expect(probBelow(post, 0)).toBeCloseTo(0.729, 2)
  })

  it('with a flat prior the posterior ≈ the likelihood', () => {
    const post = normalPosterior({ mean: 0, sd: 100 }, -4, se40)
    expect(post.mean).toBeCloseTo(-4, 1)
    expect(post.sd).toBeCloseTo(se40, 2)
    // flat-prior worked numbers from the draft: P(<0) ≈ 88%, P(≤ −5) ≈ 38%
    expect(probBelow(post, 0)).toBeGreaterThan(0.86)
    expect(probBelow(post, 0)).toBeLessThan(0.91)
    expect(probBelow(post, -5)).toBeGreaterThan(0.35)
    expect(probBelow(post, -5)).toBeLessThan(0.42)
  })

  it('credible interval with a flat prior ≈ the frequentist CI (−10.7 to +2.7)', () => {
    const post = normalPosterior({ mean: 0, sd: 100 }, -4, se40)
    const [lo, hi] = credibleInterval(post)
    expect(lo).toBeGreaterThan(-11)
    expect(lo).toBeLessThan(-9.5)
    expect(hi).toBeGreaterThan(2)
    expect(hi).toBeLessThan(3.1)
  })

  it('data overwhelm the prior as n grows', () => {
    const disagreementAt = (n: number) => {
      const se = seBetweenMeans(15, n)
      const skeptical = normalPosterior({ mean: 0, sd: 2 }, -4, se)
      const optimistic = normalPosterior({ mean: -5, sd: 3 }, -4, se)
      return Math.abs(skeptical.mean - optimistic.mean)
    }
    expect(disagreementAt(4000)).toBeLessThan(0.15)
    expect(disagreementAt(4000)).toBeLessThan(disagreementAt(40) / 10)
    expect(normalPosterior({ mean: 0, sd: 2 }, -4, seBetweenMeans(15, 4000)).mean).toBeCloseTo(-4, 0)
  })

  it('posterior is never wider than the prior', () => {
    const prior = { mean: 0, sd: 2 }
    const post = normalPosterior(prior, -4, 10)
    expect(post.sd).toBeLessThan(prior.sd)
  })
})

describe('regression — simple OLS', () => {
  it('recovers a noiseless line exactly', () => {
    const x = [1, 2, 3, 4, 5]
    const y = x.map((v) => 2 + 3 * v)
    const fit = simpleOls(x, y)
    expect(fit.intercept).toBeCloseTo(2, 8)
    expect(fit.slope).toBeCloseTo(3, 8)
    expect(fit.r2).toBeCloseTo(1, 8)
    expect(fit.sse).toBeCloseTo(0, 8)
  })

  it('with a binary predictor, the slope is the difference in means (the t-test reveal)', () => {
    const rng = new Rng(7)
    const x: number[] = []
    const y: number[] = []
    for (let i = 0; i < 40; i++) {
      x.push(0)
      y.push(rng.normal(120, 15))
      x.push(1)
      y.push(rng.normal(116, 15))
    }
    const fit = simpleOls(x, y)
    const meanControl = mean(y.filter((_, i) => x[i] === 0))
    const meanTreated = mean(y.filter((_, i) => x[i] === 1))
    expect(fit.slope).toBeCloseTo(meanTreated - meanControl, 8)
    expect(fit.intercept).toBeCloseTo(meanControl, 8)
  })

  it('no hand-dragged line beats least squares', () => {
    const rng = new Rng(11)
    const x = Array.from({ length: 25 }, () => 40 + rng.next() * 40)
    const y = x.map((xi) => 90 + 0.6 * xi + rng.normal(0, 10))
    const fit = simpleOls(x, y)
    for (const dIntercept of [-5, -1, 1, 5]) {
      for (const dSlope of [-0.3, -0.05, 0.05, 0.3]) {
        const sse = sseForLine(x, y, fit.intercept + dIntercept, fit.slope + dSlope)
        expect(sse).toBeGreaterThan(fit.sse)
      }
    }
  })

  it('slopeSe matches the spread of fitted slopes across repeated samples', () => {
    const slopes: number[] = []
    const ses: number[] = []
    for (let s = 0; s < 400; s++) {
      const rng = new Rng(1000 + s)
      const x = Array.from({ length: 25 }, () => 40 + rng.next() * 40)
      const y = x.map((xi) => 90 + 0.6 * xi + rng.normal(0, 10))
      const fit = simpleOls(x, y)
      slopes.push(fit.slope)
      ses.push(fit.slopeSe)
    }
    const empirical = sd(slopes)
    const claimed = mean(ses)
    expect(Math.abs(empirical - claimed) / empirical).toBeLessThan(0.15)
  })
})

describe('regression — two-predictor OLS (the adjustment demo)', () => {
  it('recovers noiseless coefficients exactly', () => {
    const x1 = [0, 1, 0, 1, 0, 1, 0, 1]
    const x2 = [1, 2, 3, 4, 5, 6, 7, 8]
    const y = x1.map((a, i) => 1 + 2 * a + 3 * x2[i])
    const fit = twoPredictorOls(x1, x2, y)
    expect(fit.intercept).toBeCloseTo(1, 6)
    expect(fit.b1).toBeCloseTo(2, 6)
    expect(fit.b2).toBeCloseTo(3, 6)
  })

  it('recovers the true drug effect under confounding by indication', () => {
    // The Module 6 R-snippet scenario: sicker patients preferentially treated.
    // A single sample has SE ≈ 0.24 on the adjusted estimate, so average over
    // seeds rather than gambling on one draw.
    const crudes: number[] = []
    const adjustedB1: number[] = []
    const adjustedB2: number[] = []
    for (let seed = 1; seed <= 10; seed++) {
      const rng = new Rng(seed)
      const n = 2000
      const severity: number[] = []
      const treated: number[] = []
      const bpChange: number[] = []
      for (let i = 0; i < n; i++) {
        const s = rng.next() * 10
        const pTreat = 1 / (1 + Math.exp(-(s - 5)))
        const t = rng.next() < pTreat ? 1 : 0
        severity.push(s)
        treated.push(t)
        bpChange.push(-4 * t + 1.5 * s + rng.normal(0, 4))
      }
      crudes.push(
        mean(bpChange.filter((_, i) => treated[i] === 1)) -
          mean(bpChange.filter((_, i) => treated[i] === 0)),
      )
      const fit = twoPredictorOls(treated, severity, bpChange)
      adjustedB1.push(fit.b1)
      adjustedB2.push(fit.b2)
    }
    // crude comparison is badly confounded (typically ≈ 0, nowhere near −4)…
    expect(mean(crudes)).toBeGreaterThan(-2)
    // …adjustment recovers the truth
    expect(mean(adjustedB1)).toBeGreaterThan(-4.25)
    expect(mean(adjustedB1)).toBeLessThan(-3.75)
    expect(mean(adjustedB2)).toBeGreaterThan(1.4)
    expect(mean(adjustedB2)).toBeLessThan(1.6)
  })
})
