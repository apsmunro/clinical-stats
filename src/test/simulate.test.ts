import { describe, expect, it } from 'vitest'
import { Rng, mulberry32 } from '../lib/rng'
import { mean, normalCdf, normalQuantile, sd, seBetweenMeans, tCdf, tQuantile } from '../lib/stats'
import { runTrials } from '../lib/simulate'
import {
  mdesTwoMeans, mdesTwoProps,
  powerTwoMeans, powerTwoProps,
  sampleSizeTwoMeans, sampleSizeTwoProps,
} from '../lib/power'

describe('rng', () => {
  it('is deterministic given a seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })

  it('normal draws have roughly the right mean and SD', () => {
    const rng = new Rng(1)
    const xs = Array.from({ length: 50000 }, () => rng.normal(120, 15))
    expect(mean(xs)).toBeCloseTo(120, 0)
    expect(sd(xs)).toBeGreaterThan(14.5)
    expect(sd(xs)).toBeLessThan(15.5)
  })

  it('binomial draws have roughly the right mean (exact and approximate paths)', () => {
    const rng = new Rng(2)
    const small = Array.from({ length: 20000 }, () => rng.binomial(40, 0.4))
    expect(mean(small) / 40).toBeCloseTo(0.4, 1)
    const large = Array.from({ length: 5000 }, () => rng.binomial(5000, 0.4))
    expect(mean(large) / 5000).toBeCloseTo(0.4, 2)
  })
})

describe('stats distributions', () => {
  it('normalCdf matches known values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3)
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3)
  })

  it('normalQuantile inverts normalCdf', () => {
    expect(normalQuantile(0.975)).toBeCloseTo(1.95996, 3)
    expect(normalQuantile(0.8)).toBeCloseTo(0.84162, 3)
  })

  it('t distribution matches known values', () => {
    expect(tCdf(0, 10)).toBeCloseTo(0.5, 8)
    expect(tCdf(2.042, 30)).toBeCloseTo(0.975, 2) // t_{0.975,30} ≈ 2.042
    expect(tQuantile(0.975, 30)).toBeCloseTo(2.042, 2)
  })
})

describe('runTrials — continuous outcome', () => {
  it('is deterministic given a seed', () => {
    const a = runTrials({ trueDiff: 3, sd: 15, n: 40, nTrials: 200, seed: 7 })
    const b = runTrials({ trueDiff: 3, sd: 15, n: 40, nTrials: 200, seed: 7 })
    expect(a.estimates).toEqual(b.estimates)
    expect(a.pValues).toEqual(b.pValues)
  })

  it('under the null, mean of estimates ≈ 0 and empirical SE ≈ sd·√(2/n)', () => {
    const r = runTrials({ trueDiff: 0, sd: 15, n: 40, nTrials: 10000, seed: 123 })
    expect(Math.abs(mean(r.meanDiffs))).toBeLessThan(0.15)
    const theory = seBetweenMeans(15, 40) // ≈ 3.354
    expect(r.empiricalSe).toBeGreaterThan(theory * 0.95)
    expect(r.empiricalSe).toBeLessThan(theory * 1.05)
  })

  it('controls the false-positive rate at alpha under the null', () => {
    const r = runTrials({ trueDiff: 0, sd: 15, n: 40, nTrials: 8000, alpha: 0.05, seed: 11 })
    expect(r.power).toBeGreaterThan(0.035)
    expect(r.power).toBeLessThan(0.065)
  })

  it('95% CIs cover the true effect ~95% of the time', () => {
    const trueDiff = 5
    const r = runTrials({ trueDiff, sd: 15, n: 40, nTrials: 3000, seed: 99 })
    let covered = 0
    for (let i = 0; i < r.estimates.length; i++) {
      if (r.ciLow[i] <= trueDiff && trueDiff <= r.ciHigh[i]) covered++
    }
    const coverage = covered / r.estimates.length
    expect(coverage).toBeGreaterThan(0.93)
    expect(coverage).toBeLessThan(0.97)
  })

  it('matches analytic power across a grid (Module 8 acceptance)', () => {
    const grid: Array<[number, number, number]> = [
      [5, 15, 40],
      [5, 15, 142],
      [10, 20, 50],
      [3, 10, 100],
    ]
    for (const [delta, sdv, n] of grid) {
      const sim = runTrials({ trueDiff: delta, sd: sdv, n, nTrials: 4000, seed: 5 }).power
      const analytic = powerTwoMeans(delta, sdv, n, 0.05, 2)
      expect(Math.abs(sim - analytic)).toBeLessThan(0.04)
    }
  })

  it('headline numbers: effect 5 / SD 15 → ~35% power at n=40, ~80% at n=142', () => {
    const low = runTrials({ trueDiff: 5, sd: 15, n: 40, nTrials: 5000, seed: 21 }).power
    expect(low).toBeGreaterThan(0.28)
    expect(low).toBeLessThan(0.42)
    const high = runTrials({ trueDiff: 5, sd: 15, n: 142, nTrials: 5000, seed: 22 }).power
    expect(high).toBeGreaterThan(0.76)
    expect(high).toBeLessThan(0.85)
  })

  it("winner's curse: at low power, significant trials overstate the true effect", () => {
    const r = runTrials({ trueDiff: 5, sd: 15, n: 20, nTrials: 4000, seed: 31 })
    expect(r.winnersMeanEstimate).toBeGreaterThan(6.5) // truth is 5
    const big = runTrials({ trueDiff: 5, sd: 15, n: 400, nTrials: 4000, seed: 32 })
    expect(Math.abs(big.winnersMeanEstimate - 5)).toBeLessThan(0.5) // converges to truth
  })
})

describe('runTrials — binary outcome', () => {
  it('matches analytic power (Module 8 acceptance)', () => {
    const cases: Array<[number, number, number]> = [
      [0.4, 0.55, 170],
      [0.4, 0.55, 80],
      [0.05, 0.2, 100],
    ]
    for (const [p1, p2, n] of cases) {
      const sim = runTrials({ outcome: 'binary', p1, p2, n, nTrials: 4000, seed: 41 }).power
      const analytic = powerTwoProps(p1, p2, n, 0.05, 2)
      expect(Math.abs(sim - analytic)).toBeLessThan(0.05)
    }
  })

  it('controls the false-positive rate under the null', () => {
    const r = runTrials({ outcome: 'binary', p1: 0.4, p2: 0.4, n: 100, nTrials: 8000, seed: 43 })
    expect(r.power).toBeGreaterThan(0.03)
    expect(r.power).toBeLessThan(0.07)
  })
})

describe('analytic power & sample size', () => {
  it('continuous worked example: MCID 5, SD 15 → ~142 per arm', () => {
    const n = sampleSizeTwoMeans(5, 15, 0.05, 0.8, 2)
    expect(n).toBeGreaterThanOrEqual(141)
    expect(n).toBeLessThanOrEqual(143)
    expect(powerTwoMeans(5, 15, n, 0.05, 2)).toBeGreaterThanOrEqual(0.8)
  })

  it('binary worked example: 40% → 55% → ~170 per arm, and simulated power ≈ 80%', () => {
    const n = sampleSizeTwoProps(0.4, 0.55, 0.05, 0.8, 2)
    expect(n).toBeGreaterThanOrEqual(165)
    expect(n).toBeLessThanOrEqual(180)
    const sim = runTrials({ outcome: 'binary', p1: 0.4, p2: 0.55, n, nTrials: 5000, seed: 51 }).power
    expect(sim).toBeGreaterThan(0.75)
    expect(sim).toBeLessThan(0.86)
  })

  it('baseline rate matters: the same 15-point MCID costs different n at different baselines', () => {
    const nearHalf = sampleSizeTwoProps(0.4, 0.55, 0.05, 0.8, 2)
    const nearRare = sampleSizeTwoProps(0.05, 0.2, 0.05, 0.8, 2)
    expect(nearRare).toBeLessThan(nearHalf) // variance is largest near 50%
  })

  it('MDES inverts the sample-size calculation', () => {
    expect(mdesTwoMeans(15, 142, 0.05, 0.8, 2)).toBeCloseTo(5, 1)
    const p2 = mdesTwoProps(0.4, sampleSizeTwoProps(0.4, 0.55, 0.05, 0.8, 2), 0.05, 0.8, 2)
    expect(p2).toBeGreaterThan(0.53)
    expect(p2).toBeLessThan(0.57)
  })
})
