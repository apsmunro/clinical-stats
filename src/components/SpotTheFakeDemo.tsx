/**
 * SpotTheFakeDemo — Module 3 Section 4.
 *
 * Two 10×10 grids of patient outcomes: one genuinely random (Bernoulli p=0.5),
 * one a human's idea of "random" (over-alternating, long streaks suppressed).
 * Guess which is the REAL random one — most people pick the smooth fake. The
 * reveal shows the longest streak and run count: real randomness is far clumpier
 * than intuition allows. Nails cluster blindness and the gambler's fallacy.
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { useChartTheme } from '../theme/chart'
import { NumberReadout } from './NumberReadout'

const N = 100
const COLS = 10

function longestStreak(seq: number[]): number {
  let best = 1
  let cur = 1
  for (let i = 1; i < seq.length; i++) {
    cur = seq[i] === seq[i - 1] ? cur + 1 : 1
    if (cur > best) best = cur
  }
  return best
}

function runCount(seq: number[]): number {
  let runs = 1
  for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) runs++
  return runs
}

/** Genuinely random Bernoulli(0.5). */
function realSeq(rng: Rng): number[] {
  return Array.from({ length: N }, () => (rng.next() < 0.5 ? 1 : 0))
}

/** Human-style "random": alternates too often and caps its runs at two. */
function fakeSeq(rng: Rng): number[] {
  const out: number[] = [rng.next() < 0.5 ? 1 : 0]
  for (let i = 1; i < N; i++) {
    const prev = out[i - 1]
    const runOfTwo = i >= 2 && out[i - 2] === prev
    const pSwitch = runOfTwo ? 0.97 : 0.72 // strong urge to alternate; forced flip after a pair
    out.push(rng.next() < pSwitch ? 1 - prev : prev)
  }
  return out
}

export function SpotTheFakeDemo({ seed = 909 }: { seed?: number }) {
  const { viz } = useChartTheme()
  const [round, setRound] = useState(0)
  const [guess, setGuess] = useState<0 | 1 | null>(null)
  const [score, setScore] = useState({ hits: 0, total: 0 })

  const { grids, realIdx } = useMemo(() => {
    const rng = new Rng(seed + round * 101)
    const real = realSeq(rng)
    const fake = fakeSeq(rng)
    const realOnLeft = rng.next() < 0.5
    return {
      grids: (realOnLeft ? [real, fake] : [fake, real]) as number[][],
      realIdx: (realOnLeft ? 0 : 1) as 0 | 1,
    }
  }, [seed, round])

  const reveal = guess !== null

  const onGuess = (side: 0 | 1) => {
    if (reveal) return
    setGuess(side)
    setScore((s) => ({ hits: s.hits + (side === realIdx ? 1 : 0), total: s.total + 1 }))
  }
  const next = () => {
    setGuess(null)
    setRound((r) => r + 1)
  }

  const cell = 22
  const gap = 3
  const pad = 6
  const rows = N / COLS
  const wpx = COLS * (cell + gap) - gap + pad * 2
  const hpx = rows * (cell + gap) - gap + pad * 2

  const renderGrid = (seq: number[], side: 0 | 1) => {
    const isReal = side === realIdx
    const border = reveal
      ? isReal
        ? 'var(--viz-power)'
        : 'var(--viz-alpha)'
      : guess === side
        ? 'var(--viz-signal)'
        : 'var(--border-strong)'
    return (
      <button
        key={side}
        type="button"
        onClick={() => onGuess(side)}
        aria-label={`Grid ${side + 1}${reveal ? (isReal ? ', the genuinely random one' : ', the human-made fake') : ', click to choose as the random one'}`}
        style={{
          cursor: reveal ? 'default' : 'pointer',
          background: 'transparent',
          padding: '0.4rem',
          border: `2px solid ${border}`,
          borderRadius: 12,
        }}
      >
        <svg
          viewBox={`0 0 ${wpx} ${hpx}`}
          width="100%"
          role="img"
          aria-hidden="true"
          style={{ display: 'block', maxWidth: wpx }}
        >
          {seq.map((v, i) => {
            const r = Math.floor(i / COLS)
            const c = i % COLS
            return (
              <rect
                key={i}
                x={pad + c * (cell + gap)}
                y={pad + r * (cell + gap)}
                width={cell}
                height={cell}
                rx={4}
                fill={v ? viz.signal : viz.null_}
                opacity={v ? 0.92 : 0.5}
              />
            )
          })}
        </svg>
        {reveal && (
          <div style={{ padding: '0.5rem 0.2rem 0.1rem', fontSize: '0.85em', color: 'var(--text-subtle)' }}>
            <strong style={{ color: isReal ? 'var(--viz-power)' : 'var(--viz-alpha)' }}>
              {isReal ? 'Real randomness' : 'Human-made'}
            </strong>
            <br />
            longest streak {longestStreak(seq)} · {runCount(seq)} runs
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="widget" data-widget="spot-the-fake">
      <p className="widget__note">
        One grid is 100 genuine coin-flip patients (responder = blue, non-responder = grey). The
        other, a human tried to make look random. <strong>Click the grid you think is genuinely
        random.</strong>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {grids.map((g, i) => renderGrid(g, i as 0 | 1))}
      </div>

      {reveal && (
        <p className="widget__note" style={{ marginTop: '0.9rem' }}>
          {guess === realIdx ? 'Correct. ' : 'Not this time. '}
          Real randomness is clumpier than it feels: it packs in long streaks (often six or more in a
          row), while the human version alternates too much and caps its runs. The eye cannot tell a
          real cluster from a coincidence; only counting can.
        </p>
      )}

      <div className="widget__runbar" style={{ marginTop: '0.5rem' }}>
        <button type="button" className="btn" onClick={next}>
          {reveal ? 'New pair ▸' : 'Skip ▸'}
        </button>
        <NumberReadout
          label="Spotted the real one"
          value={`${score.hits} / ${score.total}`}
          tone={score.total === 0 ? 'neutral' : 'accent'}
        />
      </div>
    </div>
  )
}
