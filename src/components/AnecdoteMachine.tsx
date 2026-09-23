/**
 * AnecdoteMachine — Module 1 Section 1.
 *
 * 300 simulated patients who received NO treatment; their BP changes are
 * pure natural variation. "Find me a success story" picks a patient at
 * random from the impressive-looking tail and renders a glowing
 * testimonial — an inexhaustible supply of miracle anecdotes from pure
 * noise. The truthful summary (mean ≈ 0) sits underneath throughout.
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { mean } from '../lib/stats'
import { useChartTheme } from '../theme/chart'
import { LiveDistributionPlot } from './LiveDistributionPlot'
import { NumberReadout } from './NumberReadout'

const N_PATIENTS = 300
/** Drops at least this big (mmHg) are "story-worthy" for the marketing dept. */
const STORY_THRESHOLD = -8

const QUOTES = [
  (drop: string) => (
    <>
      “My blood pressure fell <strong>{drop} mmHg</strong> in two weeks on Snakeoilizumab. This
      drug changed my life!”
    </>
  ),
  (drop: string) => (
    <>
      “After years of struggling, Snakeoilizumab dropped my BP by <strong>{drop} mmHg</strong>.
      Why isn't everyone on this?”
    </>
  ),
  (drop: string) => (
    <>
      “My doctor couldn't believe it: <strong>{drop} mmHg</strong> down in a fortnight. Thank you,
      Snakeoilizumab!”
    </>
  ),
  (drop: string) => (
    <>
      “I was sceptical, but the numbers don't lie — <strong>{drop} mmHg</strong> off my systolic
      BP. Snakeoilizumab works.”
    </>
  ),
  (drop: string) => (
    <>
      “Two weeks on Snakeoilizumab and my BP is <strong>{drop} mmHg</strong> lower. I've told
      everyone at work.”
    </>
  ),
]

export function AnecdoteMachine({ seed = 1859 }: { seed?: number }) {
  const { viz } = useChartTheme()
  const [picked, setPicked] = useState<number[]>([])

  // BP changes under no treatment: Normal(0, 8) — honest natural variation.
  const { changes, candidates } = useMemo(() => {
    const rng = new Rng(seed)
    const changes = Array.from({ length: N_PATIENTS }, () => rng.normal(0, 8))
    // Anyone whose BP happened to drop noticeably is testimonial material.
    const candidates = changes
      .map((v, i) => ({ v, i }))
      .filter((o) => o.v <= STORY_THRESHOLD)
      .map((o) => o.i)
    return { changes, candidates }
  }, [seed])

  const pickedSet = new Set(picked)
  const remaining = candidates.filter((i) => !pickedSet.has(i))
  const exhausted = remaining.length === 0

  const findStory = () => {
    if (exhausted) return
    // Genuinely random each click — the machine grabs whichever impressive
    // responder it lands on, not a tidy worst-first parade.
    const choice = remaining[Math.floor(Math.random() * remaining.length)]
    setPicked((p) => [...p, choice])
  }

  const highlighted = changes.filter((_, i) => pickedSet.has(i))
  const rest = changes.filter((_, i) => !pickedSet.has(i))
  const latest = picked.length > 0 ? picked[picked.length - 1] : null
  const stories = picked.length

  return (
    <div className="widget" data-widget="anecdote-machine">
      <div className="widget__runbar">
        <button type="button" className="btn btn--primary" onClick={findStory} disabled={exhausted}>
          Find me a success story
        </button>
        <button type="button" className="btn" onClick={() => setPicked([])}>
          Reset
        </button>
        {stories > 0 && (
          <span className="widget__note" aria-live="polite">
            {exhausted
              ? `All ${stories} story-worthy patients used — the marketing department has run dry.`
              : `${stories} glowing testimonial${stories > 1 ? 's' : ''} found so far, all from pure noise.`}
          </span>
        )}
      </div>

      {latest !== null && (
        <blockquote className="testimonial" aria-live="polite">
          <p>{QUOTES[latest % QUOTES.length](Math.abs(changes[latest]).toFixed(0))}</p>
          <footer>— Patient #{latest + 1} (received no treatment whatsoever)</footer>
        </blockquote>
      )}

      <LiveDistributionPlot
        groups={[
          { values: rest, name: 'untreated patients', color: viz.null_ },
          ...(highlighted.length > 0
            ? [{ values: highlighted, name: 'your "success stories"', color: viz.beta }]
            : []),
        ]}
        vlines={[{ x: 0, label: 'no change', color: viz.muted, dash: 'dash' }]}
        xRange={[-30, 30]}
        bins={50}
        xLabel="Change in systolic BP over two weeks (mmHg), with no treatment given"
        yLabel="Patients"
        height={300}
        showLegend
        caption={`Histogram of BP changes for ${N_PATIENTS} untreated patients; ${stories} cherry-picked "success stories" highlighted in the left tail.`}
      />

      <div className="widget__readouts">
        <NumberReadout
          label={`The truth: mean change across all ${N_PATIENTS} patients`}
          value={`${mean(changes) >= 0 ? '+' : ''}${mean(changes).toFixed(1)} mmHg`}
          sub="nobody received anything; every 'success' above is natural variation"
          tone="ok"
        />
      </div>
    </div>
  )
}
