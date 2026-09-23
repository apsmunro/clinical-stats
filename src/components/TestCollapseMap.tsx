/**
 * TestCollapseMap — Module 7 (One Model, Many Tests), Section 6. The capstone
 * summary: set the three dials (predictor type · data vs ranks · outcome type)
 * and watch the named classical test fall out, with its lm()/glm() equivalent.
 * Makes concrete that the test-selection flowchart was always just this one
 * model with three switches.
 *
 * Pure layout + logic, theme tokens; no SVG/Plotly.
 */
import { useState } from 'react'

type Pred = 'continuous' | 'two' | 'multi'
type Data = 'raw' | 'ranks'
type Out = 'normal' | 'binary' | 'count'

const PRED: { id: Pred; label: string }[] = [
  { id: 'continuous', label: 'continuous' },
  { id: 'two', label: '2 groups' },
  { id: 'multi', label: '3+ groups' },
]
const DATA: { id: Data; label: string }[] = [
  { id: 'raw', label: 'raw values' },
  { id: 'ranks', label: 'ranks' },
]
const OUT: { id: Out; label: string }[] = [
  { id: 'normal', label: 'normal' },
  { id: 'binary', label: 'binary (yes/no)' },
  { id: 'count', label: 'count' },
]

function resolve(pred: Pred, data: Data, out: Out): { name: string; code: string; link: string; note?: string } {
  if (out === 'binary') {
    return { name: 'Logistic regression', link: 'logit', code: 'glm(y ~ x, family = binomial)', note: data === 'ranks' ? 'With a binary outcome the link handles the scale — ranking the outcome isn’t used.' : undefined }
  }
  if (out === 'count') {
    return { name: 'Poisson regression', link: 'log', code: 'glm(y ~ x, family = poisson)', note: data === 'ranks' ? 'With a count outcome the log link handles the scale — ranking the outcome isn’t used.' : undefined }
  }
  // normal outcome → identity link
  if (data === 'raw') {
    if (pred === 'continuous') return { name: 'Pearson correlation / linear regression', link: 'identity', code: 'lm(y ~ x)' }
    if (pred === 'two') return { name: 't-test', link: 'identity', code: 'lm(y ~ group)' }
    return { name: 'One-way ANOVA', link: 'identity', code: 'lm(y ~ group)   # aov() gives the same F' }
  }
  // ranks
  if (pred === 'continuous') return { name: 'Spearman correlation', link: 'identity', code: 'lm(rank(y) ~ rank(x))' }
  if (pred === 'two') return { name: 'Mann–Whitney / Wilcoxon', link: 'identity', code: 'lm(rank(y) ~ group)', note: 'A very close approximation, not an exact identity.' }
  return { name: 'Kruskal–Wallis (ANOVA on ranks)', link: 'identity', code: 'lm(rank(y) ~ group)', note: 'The rank version of ANOVA — a natural bonus of the same idea.' }
}

function Dial<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="btn-group" role="group" aria-label={label} style={{ flexWrap: 'wrap' }}>
      <span className="btn-group__label">{label}:</span>
      {options.map((o) => (
        <button key={o.id} type="button" className={`btn btn--toggle${value === o.id ? ' is-active' : ''}`} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TestCollapseMap() {
  const [pred, setPred] = useState<Pred>('continuous')
  const [data, setData] = useState<Data>('raw')
  const [out, setOut] = useState<Out>('normal')
  const res = resolve(pred, data, out)

  return (
    <div className="widget" data-widget="test-collapse-map">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Dial label="Predictor" options={PRED} value={pred} onChange={setPred} />
        <Dial label="Data" options={DATA} value={data} onChange={setData} />
        <Dial label="Outcome" options={OUT} value={out} onChange={setOut} />
      </div>

      <div
        style={{
          marginTop: 16,
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--viz-signal)',
          borderRadius: 'var(--r-lg, 12px)',
          padding: '14px 16px',
          background: 'var(--surface)',
        }}
      >
        <p style={{ margin: '0 0 2px', fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
          The same model, set to:
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {PRED.find((p) => p.id === pred)!.label} predictor · {DATA.find((d) => d.id === data)!.label} · {res.link} link
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 700, color: 'var(--viz-signal)' }}>{res.name}</p>
        <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.86rem', background: 'var(--surface-2, rgba(127,127,127,0.08))', padding: '8px 10px', borderRadius: 8, overflowX: 'auto' }}>
          {res.code}
        </pre>
        {res.note && (
          <p style={{ margin: '10px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{res.note}</p>
        )}
      </div>

      <p className="widget__note">
        Three switches, one model. The test-selection flowcharts you were told to memorise are just this
        table read backwards — pick the dials that match your data and the named test is whatever the linear
        model happens to be called in that corner.
      </p>
    </div>
  )
}
