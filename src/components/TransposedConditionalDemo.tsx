/**
 * TransposedConditionalDemo — Module 3 Sections 5–6.
 *
 * The same 1000 hypothetical drug trials, viewed two ways. Group them by TRUTH
 * and a block gives P(result | hypothesis) — the forward, frequentist
 * conditional the p-value reports. Regroup the very same trials by RESULT and a
 * block gives P(hypothesis | result) — what the clinician actually wants. Same
 * letters, opposite order, completely different numbers: the transposed
 * conditional made visible, and base-rate-driven so the divergence is felt.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { useChartTheme } from '../theme/chart'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

const N = 1000
const COLS = 50

type Cell = 'TP' | 'FP' | 'FN' | 'TN'
type View = 'truth' | 'result'

export function TransposedConditionalDemo() {
  const { viz } = useChartTheme()
  const [baseRate, setBaseRate] = useState(10) // % of tested drugs that truly work
  const [power, setPower] = useState(80) // P(significant | works)
  const [alpha, setAlpha] = useState(5) // P(significant | useless)
  const [view, setView] = useState<View>('truth')

  const c = useMemo(() => {
    const works = Math.round((N * baseRate) / 100)
    const useless = N - works
    const tp = Math.round((works * power) / 100)
    const fn = works - tp
    const fp = Math.round((useless * alpha) / 100)
    const tn = useless - fp
    return { works, useless, tp, fn, fp, tn, sig: tp + fp, notSig: fn + tn }
  }, [baseRate, power, alpha])

  // Order the 1000 cells so the active grouping's first block is contiguous and
  // its "numerator" colour leads. Toggling re-sorts the same trials.
  const cells = useMemo<Cell[]>(() => {
    const rep = (k: Cell, n: number) => Array<Cell>(Math.max(0, n)).fill(k)
    return view === 'truth'
      ? [...rep('TP', c.tp), ...rep('FN', c.fn), ...rep('FP', c.fp), ...rep('TN', c.tn)]
      : [...rep('TP', c.tp), ...rep('FP', c.fp), ...rep('FN', c.fn), ...rep('TN', c.tn)]
  }, [view, c])

  const color: Record<Cell, string> = {
    TP: viz.power, // works & significant
    FP: viz.alpha, // useless & significant (false positive)
    FN: viz.sky, // works & not significant
    TN: viz.null_, // useless & not significant
  }

  const split = view === 'truth' ? c.works : c.sig
  const g1Label = view === 'truth' ? `Drug truly works — ${c.works}` : `Significant result — ${c.sig}`
  const g2Label = view === 'truth' ? `Drug is useless — ${c.useless}` : `Not significant — ${c.notSig}`

  // layout
  const cell = 13
  const gap = 2
  const pad = 4
  const labelH = 22
  const groupGap = 14
  const g1Rows = Math.ceil(split / COLS)
  const g2Rows = Math.ceil((N - split) / COLS)
  const g1Top = pad + labelH
  const g2LabelTop = g1Top + g1Rows * (cell + gap) + groupGap
  const g2Top = g2LabelTop + labelH
  const wpx = COLS * (cell + gap) - gap + pad * 2
  const hpx = g2Top + g2Rows * (cell + gap) - gap + pad

  const pos = (i: number) => {
    const inG1 = i < split
    const j = inG1 ? i : i - split
    const row = Math.floor(j / COLS)
    const col = j % COLS
    return { x: pad + col * (cell + gap), y: (inG1 ? g1Top : g2Top) + row * (cell + gap) }
  }

  const pSigGivenUseless = alpha
  const pWorksGivenSig = c.sig > 0 ? Math.round((c.tp / c.sig) * 100) : 0

  return (
    <div className="widget" data-widget="transposed-conditional">
      <p className="widget__note">
        1000 hypothetical drugs are trialled. Each one truly works or is useless, and each trial
        comes back "significant" or not. Same 1000 trials, two completely different questions.
      </p>

      <div className="widget__controls">
        <ParameterSlider
          label="Drugs that truly work (base rate)"
          min={1} max={50} step={1} value={baseRate} onChange={setBaseRate} unit="%"
          help="The prior: among drugs worth trialling, how many genuinely work. Watch how hard it drives the reverse probability."
        />
        <ParameterSlider
          label="Power — P(significant | works)"
          min={50} max={99} step={1} value={power} onChange={setPower} unit="%"
        />
        <ParameterSlider
          label="False-positive rate α — P(significant | useless)"
          min={1} max={20} step={1} value={alpha} onChange={setAlpha} unit="%"
        />
      </div>

      <div className="widget__runbar widget__runbar--wrap">
        <div className="btn-group" role="group" aria-label="How to read the trials">
          <span className="btn-group__label">Group by:</span>
          <button
            type="button"
            className={`btn btn--toggle${view === 'truth' ? ' is-active' : ''}`}
            aria-pressed={view === 'truth'}
            onClick={() => setView('truth')}
          >
            Truth → P(result | truth)
          </button>
          <button
            type="button"
            className={`btn btn--toggle${view === 'result' ? ' is-active' : ''}`}
            aria-pressed={view === 'result'}
            onClick={() => setView('result')}
          >
            Result → P(truth | result)
          </button>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${wpx} ${hpx}`}
        width="100%"
        role="img"
        aria-label={`1000 trials grouped by ${view}. P(significant given the drug is useless) is ${pSigGivenUseless}%. P(the drug works given a significant result) is ${pWorksGivenSig}%.`}
        style={{ display: 'block' }}
      >
        <text x={pad} y={pad + 14} fontSize={13} fontWeight={600} fill="var(--text-muted)">
          {g1Label}
        </text>
        <text x={pad} y={g2LabelTop + 14} fontSize={13} fontWeight={600} fill="var(--text-muted)">
          {g2Label}
        </text>
        {cells.map((k, i) => {
          const { x, y } = pos(i)
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2.5}
              fill={color[k]}
              style={{ transition: 'fill 250ms' }}
            />
          )
        })}
      </svg>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.85em',
          color: 'var(--text-subtle)',
          margin: '0.6rem 0',
        }}
      >
        <Swatch c={viz.power}>works · significant</Swatch>
        <Swatch c={viz.alpha}>useless · significant (false positive)</Swatch>
        <Swatch c={viz.sky}>works · not significant</Swatch>
        <Swatch c={viz.null_}>useless · not significant</Swatch>
      </div>

      <div className="widget__readouts">
        <NumberReadout
          label="Frequentist — P(significant | drug is useless)"
          value={`${pSigGivenUseless}%`}
          sub="what α and the p-value actually report"
          tone="accent"
        />
        <NumberReadout
          label="What you want — P(drug works | significant)"
          value={`${pWorksGivenSig}%`}
          sub={`= ${c.tp} that work ÷ ${c.sig} significant`}
          tone="accent"
        />
        <NumberReadout
          label="The trap — reading α as its complement"
          value={`${100 - pSigGivenUseless}%`}
          sub="the transposed conditional: a different question entirely"
          tone="danger"
        />
      </div>

      <p className="widget__note">
        The two probabilities answer different questions and rarely match. The frequentist number
        ignores the base rate entirely; the one you actually want depends on it heavily. Drag the
        base rate and watch P(works | significant) swing while P(significant | useless) does not
        move at all.
      </p>
    </div>
  )
}

function Swatch({ c, children }: { c: string; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />
      {children}
    </span>
  )
}
