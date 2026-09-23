/**
 * EquationAnatomy — Module 6, Section 1. Turns the wall of text that explains
 * "final BP = a + b × treated + noise" into a click-along dissector. Each term
 * of the equation is a chip; selecting it (a) shows a plain-language gloss plus
 * the textbook/Greek alias the prose introduces (y, α/β₀, β₁, x, ε), and (b)
 * highlights that term's role on a two-column dot-plot of the trial (placebo at
 * treated = 0, drug at treated = 1).
 *
 * Binary predictor only — it mirrors Section 1's equation exactly. SVG so it
 * stays crisp and themeable; colours resolve from viz tokens at render. The
 * sample is illustrative (drawn around the TRUE model: a = 120, b = −4) so the
 * intercept and step read cleanly.
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'

type TermId = 'outcome' | 'intercept' | 'coef' | 'predictor' | 'noise'

const A = 120 // placebo mean (intercept)
const B = -4 // treatment effect (coefficient)

const TERMS: {
  id: TermId
  symbol: string
  alias: string
  name: string
  colour: string
  gloss: string
  caption: string
}[] = [
  {
    id: 'outcome',
    symbol: 'final BP',
    alias: 'y',
    name: 'The outcome',
    colour: 'var(--viz-signal)',
    gloss:
      "The result we are trying to explain — each patient's final blood pressure. It sits on the left of the “=”, and the rest of the equation is the recipe for working it out. Plotted up the y-axis, so textbooks call it y.",
    caption: 'Each dot is one patient’s measured final BP — the thing the model predicts.',
  },
  {
    id: 'intercept',
    symbol: 'a',
    alias: 'α · β₀',
    name: 'The reference point (intercept)',
    colour: 'var(--viz-null)',
    gloss:
      'Where we begin: the predicted outcome when the predictor is zero. Here treated = 0 means the placebo group, so a is simply the placebo group’s mean BP. It’s where the line meets the y-axis. Written a, α, or β₀ — statisticians love Greek letters.',
    caption: 'a = 120 mmHg: the placebo group’s mean, the line’s starting height.',
  },
  {
    id: 'coef',
    symbol: 'b',
    alias: 'β₁',
    name: 'The effect size (coefficient)',
    colour: 'var(--primary)',
    gloss:
      'The magic ingredient: how much the outcome changes for a one-unit increase in the predictor — here, going from placebo to drug. For our trial b = −4 mmHg. This is the whole reason we ran the study. Written β₁.',
    caption: 'b = −4 mmHg: the drug arm’s prediction drops from 120 to 116.',
  },
  {
    id: 'predictor',
    symbol: 'treated',
    alias: 'x',
    name: 'The predictor',
    colour: 'var(--viz-power)',
    gloss:
      'What we vary. Here it’s a 0/1 switch: 0 for placebo, 1 for the drug. We multiply it by b, so the −4 mmHg counts only for treated patients (b × 0 = nothing for placebo). Plotted along the x-axis; written x.',
    caption: 'treated = 0 (placebo) on the left, treated = 1 (drug) on the right.',
  },
  {
    id: 'noise',
    symbol: 'noise',
    alias: 'e · ε',
    name: 'The noise',
    colour: 'var(--viz-alpha)',
    gloss:
      'Everything else. No predictor explains an outcome perfectly, so this term mops up the random, unmeasured variation that scatters patients around the line. Written e or ε.',
    caption: 'Each thin line is one patient’s residual — the noise the model can’t explain.',
  },
]

// plot geometry (viewBox units)
const W = 560
const H = 360
const ML = 48
const MR = 16
const MT = 18
const MB = 52
const Y_DOM: [number, number] = [88, 152]
const COL0 = ML + (W - ML - MR) * 0.32 // placebo column centre
const COL1 = ML + (W - ML - MR) * 0.72 // drug column centre

const sy = (y: number) => MT + ((Y_DOM[1] - y) / (Y_DOM[1] - Y_DOM[0])) * (H - MT - MB)

function makeSample(seed: number) {
  const rng = new Rng(seed)
  const pts: { x: number; y: number; treated: 0 | 1 }[] = []
  for (let i = 0; i < 15; i++) {
    pts.push({ x: COL0 + rng.normal(0, 14), y: A + rng.normal(0, 12), treated: 0 })
  }
  for (let i = 0; i < 15; i++) {
    pts.push({ x: COL1 + rng.normal(0, 14), y: A + B + rng.normal(0, 12), treated: 1 })
  }
  return pts
}

export function EquationAnatomy({ seed = 6001 }: { seed?: number }) {
  const [active, setActive] = useState<TermId>('outcome')
  const pts = useMemo(() => makeSample(seed), [seed])
  const term = TERMS.find((t) => t.id === active)!

  // emphasis helpers: full strength when this term is selected, dimmed otherwise
  const on = (id: TermId, hi: number, lo: number) => (active === id ? hi : lo)

  const yTicks = [90, 100, 110, 120, 130, 140, 150]

  return (
    <div className="widget" data-widget="equation-anatomy">
      {/* clickable equation */}
      <div className="equation" style={{ marginTop: 0 }}>
        <div className="equation__formula" style={{ flexWrap: 'wrap' }}>
          <Chip term={TERMS[0]} active={active} onClick={setActive} />
          <span className="equation__term">=</span>
          <Chip term={TERMS[1]} active={active} onClick={setActive} />
          <span className="equation__term">+</span>
          <Chip term={TERMS[2]} active={active} onClick={setActive} />
          <span className="equation__term">×</span>
          <Chip term={TERMS[3]} active={active} onClick={setActive} />
          <span className="equation__term">+</span>
          <Chip term={TERMS[4]} active={active} onClick={setActive} />
        </div>
      </div>

      <p className="widget__note" style={{ textAlign: 'center', marginTop: 8 }}>
        Tap any coloured part of the equation to see what it does.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'stretch',
          marginTop: 8,
        }}
      >
        {/* explanation panel */}
        <div
          style={{
            flex: '1 1 220px',
            minWidth: 220,
            borderLeft: `4px solid ${term.colour}`,
            paddingLeft: 14,
          }}
        >
          <p style={{ margin: '2px 0 4px', fontWeight: 700, color: term.colour }}>
            {term.symbol}
            <span style={{ color: 'var(--text-subtle)', fontWeight: 400, fontSize: '0.85em' }}>
              {'  —  also written '}
              {term.alias}
            </span>
          </p>
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{term.name}</p>
          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>{term.gloss}</p>
        </div>

        {/* synced plot */}
        <div style={{ flex: '2 1 320px', minWidth: 300 }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Two columns of patient dots: placebo at treated = 0 and drug at treated = 1, with the model lines a = 120 and a + b = 116. Currently highlighting: ${term.name}.`}
            style={{ width: '100%', height: 'auto' }}
          >
            {/* y gridlines + ticks */}
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={ML} x2={W - MR} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth={1} />
                <text x={ML - 8} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-subtle)">
                  {t}
                </text>
              </g>
            ))}
            {/* axes */}
            <line x1={ML} x2={W - MR} y1={sy(Y_DOM[0])} y2={sy(Y_DOM[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
            <line x1={ML} x2={ML} y1={MT} y2={sy(Y_DOM[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
            <text x={14} y={(MT + sy(Y_DOM[0])) / 2} textAnchor="middle" fontSize={12} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + sy(Y_DOM[0])) / 2})`}>
              Final BP (mmHg)
            </text>

            {/* x-axis category labels (predictor) */}
            {([[COL0, 'treated = 0', 'placebo'], [COL1, 'treated = 1', 'drug']] as const).map(([cx, l1, l2]) => (
              <g key={l1} opacity={on('predictor', 1, 0.65)}>
                <text x={cx} y={H - MB + 20} textAnchor="middle" fontSize={12.5} fontWeight={active === 'predictor' ? 700 : 400} fill={active === 'predictor' ? 'var(--viz-power)' : 'var(--text-muted)'}>
                  {l1}
                </text>
                <text x={cx} y={H - MB + 36} textAnchor="middle" fontSize={11} fill="var(--text-subtle)">
                  ({l2})
                </text>
              </g>
            ))}

            {/* residual segments (noise) */}
            {pts.map((p, i) => {
              const pred = p.treated === 0 ? A : A + B
              return (
                <line
                  key={`r${i}`}
                  x1={p.x}
                  x2={p.x}
                  y1={sy(p.y)}
                  y2={sy(pred)}
                  stroke="var(--viz-alpha)"
                  strokeWidth={on('noise', 1.6, 1)}
                  opacity={on('noise', 0.85, 0.12)}
                />
              )
            })}

            {/* intercept line a (full width) */}
            <line
              x1={ML}
              x2={W - MR}
              y1={sy(A)}
              y2={sy(A)}
              stroke="var(--viz-null)"
              strokeWidth={on('intercept', 2.5, 1.5)}
              strokeDasharray="6 5"
              opacity={on('intercept', 1, 0.45)}
            />
            {active === 'intercept' && (
              <text x={ML + 6} y={sy(A) - 6} fontSize={12} fontWeight={700} fill="var(--viz-null)">
                a = 120
              </text>
            )}

            {/* group prediction ticks */}
            <line x1={COL0 - 34} x2={COL0 + 34} y1={sy(A)} y2={sy(A)} stroke="var(--viz-null)" strokeWidth={3} opacity={on('intercept', 1, 0.6)} />
            <line
              x1={COL1 - 34}
              x2={COL1 + 34}
              y1={sy(A + B)}
              y2={sy(A + B)}
              stroke={active === 'coef' ? 'var(--primary)' : 'var(--viz-null)'}
              strokeWidth={3}
              opacity={on('coef', 1, 0.6)}
            />

            {/* the step: b = −4 from placebo prediction to drug prediction */}
            <g opacity={on('coef', 1, 0.18)}>
              <line x1={COL1} x2={COL1} y1={sy(A)} y2={sy(A + B)} stroke="var(--primary)" strokeWidth={2} markerEnd="url(#ea-arrow)" />
              <text x={COL1 + 10} y={(sy(A) + sy(A + B)) / 2 + 4} fontSize={12.5} fontWeight={700} fill="var(--primary)">
                b = −4
              </text>
            </g>
            <defs>
              <marker id="ea-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M1,1 L7,4 L1,7 Z" fill="var(--primary)" />
              </marker>
            </defs>

            {/* data points (outcome) */}
            {pts.map((p, i) => (
              <circle
                key={`p${i}`}
                cx={p.x}
                cy={sy(p.y)}
                r={active === 'outcome' ? 6 : 5}
                fill={active === 'outcome' ? 'var(--viz-signal)' : 'var(--viz-null)'}
                opacity={on('outcome', 0.95, 0.7)}
              />
            ))}
          </svg>
          <p className="widget__note" aria-live="polite" style={{ marginTop: 4, textAlign: 'center' }}>
            {term.caption}
          </p>
        </div>
      </div>
    </div>
  )
}

function Chip({
  term,
  active,
  onClick,
}: {
  term: (typeof TERMS)[number]
  active: TermId
  onClick: (id: TermId) => void
}) {
  const isActive = active === term.id
  return (
    <button
      type="button"
      className="equation__term"
      onClick={() => onClick(term.id)}
      aria-pressed={isActive}
      style={{
        cursor: 'pointer',
        border: `1.5px solid ${isActive ? term.colour : 'var(--border)'}`,
        borderRadius: 'var(--r-md, 8px)',
        background: isActive ? term.colour : 'transparent',
        color: isActive ? 'var(--surface)' : term.colour,
        padding: '4px 10px',
        font: 'inherit',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {term.symbol}
      <span
        className="equation__label"
        style={{ color: isActive ? 'var(--surface)' : 'var(--text-subtle)' }}
      >
        {term.alias}
      </span>
    </button>
  )
}
