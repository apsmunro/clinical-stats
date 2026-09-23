/**
 * Small seedable PRNG (mulberry32) plus distribution helpers.
 * All randomness in the app flows through this module so every demo is
 * deterministic and reproducible given a seed.
 */

/** mulberry32 — fast 32-bit seedable PRNG returning uniforms in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stateful RNG wrapper with normal and binomial draws. */
export class Rng {
  private uniform: () => number
  private spare: number | null = null

  constructor(seed: number = Date.now() % 2 ** 31) {
    this.uniform = mulberry32(seed)
  }

  /** Uniform in [0, 1). */
  next(): number {
    return this.uniform()
  }

  /** Standard-normal draw via Box–Muller (with cached spare). */
  normal(mean = 0, sd = 1): number {
    if (this.spare !== null) {
      const z = this.spare
      this.spare = null
      return mean + sd * z
    }
    let u = 0
    while (u === 0) u = this.uniform() // avoid log(0)
    const v = this.uniform()
    const r = Math.sqrt(-2 * Math.log(u))
    const theta = 2 * Math.PI * v
    this.spare = r * Math.sin(theta)
    return mean + sd * r * Math.cos(theta)
  }

  /**
   * Binomial draw: number of events in n Bernoulli(p) trials.
   * Exact summation for small n; normal approximation (with continuity
   * correction, clamped to [0, n]) for large n where it is accurate.
   */
  binomial(n: number, p: number): number {
    if (p <= 0) return 0
    if (p >= 1) return n
    if (n <= 1024) {
      let k = 0
      for (let i = 0; i < n; i++) if (this.uniform() < p) k++
      return k
    }
    const mu = n * p
    const sigma = Math.sqrt(n * p * (1 - p))
    const k = Math.round(this.normal(mu, sigma))
    return Math.min(n, Math.max(0, k))
  }
}
