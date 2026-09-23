/**
 * FlavourClassifier — Module 3 Section 2.
 *
 * The module's core skill is telling, on sight, whether a probability statement
 * is frequentist (a long-run frequency in the world) or Bayesian (a degree of
 * belief about a one-off fact). This drills it: tag each statement, get instant
 * feedback with a one-line why, and keep score.
 */
import { useState } from 'react'
import { NumberReadout } from './NumberReadout'

type Flavour = 'freq' | 'bayes'
interface Item {
  text: string
  answer: Flavour
  why: string
}

const ITEMS: Item[] = [
  {
    text: 'This coin has a 50% probability of landing heads.',
    answer: 'freq',
    why: 'A repeatable process: flip it many times and 50% is just the proportion you would count.',
  },
  {
    text: "There's a 30% probability this patient's chest pain is cardiac.",
    answer: 'bayes',
    why: 'A one-off fact: this pain is cardiac or it is not. The 30% is calibrated belief, not a countable frequency.',
  },
  {
    text: 'In this screening programme, 8% of positive tests are true positives.',
    answer: 'freq',
    why: 'A screening programme is a repetition machine: count true positives among positives over many screens.',
  },
  {
    text: "I'm 70% sure this new drug will beat placebo.",
    answer: 'bayes',
    why: 'A degree of belief about a single unknown fact, the kind of statement only the Bayesian meaning licenses.',
  },
  {
    text: 'The 95% confidence interval for the effect is 2 to 8 mmHg.',
    answer: 'freq',
    why: 'Confidence is a property of the procedure over many repeated studies, not of this one interval.',
  },
  {
    text: 'Given the trial, there is a 90% probability the true effect exceeds 5 mmHg.',
    answer: 'bayes',
    why: 'A direct probability about the unknown effect itself: a credible interval (Module 5), not a confidence interval.',
  },
]

const LABEL: Record<Flavour, string> = { freq: 'Frequentist', bayes: 'Bayesian' }

export function FlavourClassifier() {
  const [picks, setPicks] = useState<Record<number, Flavour>>({})
  const answered = Object.keys(picks).length
  const correct = ITEMS.filter((it, i) => picks[i] === it.answer).length

  return (
    <div className="widget" data-widget="flavour-classifier">
      <p className="widget__note">
        Which meaning of "probability" is each statement using? Tag every one; the colour and note
        reveal whether you spotted it.
      </p>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
        {ITEMS.map((it, i) => {
          const pick = picks[i]
          const done = pick !== undefined
          const right = pick === it.answer
          const edge = done ? (right ? 'var(--viz-power)' : 'var(--viz-alpha)') : 'var(--border-strong)'
          return (
            <li
              key={i}
              style={{
                border: '1px solid var(--border-strong)',
                borderLeft: `4px solid ${edge}`,
                borderRadius: 10,
                padding: '0.85rem 1rem',
              }}
            >
              <div style={{ marginBottom: '0.6rem' }}>{it.text}</div>
              <div className="btn-group" role="group" aria-label="Classify this statement">
                {(['freq', 'bayes'] as Flavour[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`btn btn--toggle${pick === f ? ' is-active' : ''}`}
                    aria-pressed={pick === f}
                    disabled={done}
                    onClick={() => setPicks((p) => ({ ...p, [i]: f }))}
                  >
                    {LABEL[f]}
                  </button>
                ))}
              </div>
              {done && (
                <p style={{ margin: '0.6rem 0 0', color: 'var(--text-subtle)', fontSize: '0.92em' }}>
                  <strong style={{ color: edge }}>
                    {right ? '✓ ' : '✗ '}
                    {LABEL[it.answer]}.
                  </strong>{' '}
                  {it.why}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      <div className="widget__runbar" style={{ marginTop: '1rem' }}>
        <button type="button" className="btn" onClick={() => setPicks({})}>
          Reset
        </button>
        <NumberReadout
          label="Tagged correctly"
          value={`${correct} / ${ITEMS.length}`}
          tone={answered < ITEMS.length ? 'neutral' : correct === ITEMS.length ? 'ok' : 'accent'}
        />
      </div>
    </div>
  )
}
