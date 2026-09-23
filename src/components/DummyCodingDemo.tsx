/**
 * DummyCodingDemo — Module 7 (One Model, Many Tests), Section 3. Shows that a
 * one-way ANOVA over three arms (placebo / low dose / high dose) is the linear
 * model with dummy (0/1) columns: the intercept sits on the reference-group
 * mean and each coefficient is a group difference. Click a group to light up its
 * design-matrix row and its coefficient arrow. The readout shows the ANOVA F,
 * which is identical to the linear model's F-test.
 *
 * SVG + viz tokens + seeded Rng; generalises Module 6's EquationAnatomy "step".
 */
import { useMemo, useState } from 'react'
import { Rng } from '../lib/rng'
import { NumberReadout } from './NumberReadout'

type Arm = 'placebo' | 'low' | 'high'
const ARMS: { id: Arm; label: string; colour: string; trueMean: number }[] = [
  { id: 'placebo', label: 'placebo', colour: 'var(--viz-null)', trueMean: 120 },
  { id: 'low', label: 'low dose', colour: 'var(--viz-signal)', trueMean: 116 },
  { id: 'high', label: 'high dose', colour: 'var(--viz-power)', trueMean: 112 },
]
const NPER = 14

const W = 560
const H = 340
const ML = 48
const MR = 16
const MT = 18
const MB = 54
const YD: [number, number] = [98, 134]
const sy = (v: number) => MT + ((YD[1] - v) / (YD[1] - YD[0])) * (H - MT - MB)
const colX = (i: number) => ML + (W - ML - MR) * (0.2 + 0.3 * i)

function makeData(seed: number) {
  const rng = new Rng(seed)
  return ARMS.map((arm) => {
    const ys: number[] = []
    for (let i = 0; i < NPER; i++) ys.push(arm.trueMean + rng.normal(0, 9))
    return { ...arm, ys, mean: ys.reduce((s, v) => s + v, 0) / NPER }
  })
}

export function DummyCodingDemo({ seed = 7301 }: { seed?: number }) {
  const [active, setActive] = useState<Arm>('placebo')
  const [sampleIdx, setSampleIdx] = useState(0)
  const data = useMemo(() => makeData(seed + sampleIdx * 53), [seed, sampleIdx])

  const ref = data[0].mean // placebo = intercept
  const b1 = data[1].mean - ref
  const b2 = data[2].mean - ref

  // one-way ANOVA F
  const all = data.flatMap((d) => d.ys)
  const grand = all.reduce((s, v) => s + v, 0) / all.length
  const k = data.length
  const Nn = all.length
  const ssB = data.reduce((s, d) => s + NPER * (d.mean - grand) ** 2, 0)
  const ssW = data.reduce((s, d) => s + d.ys.reduce((t, v) => t + (v - d.mean) ** 2, 0), 0)
  const F = (ssB / (k - 1)) / (ssW / (Nn - k))

  const rng2 = new Rng(seed * 7 + sampleIdx) // deterministic x-jitter
  const jitter = () => (rng2.next() - 0.5) * 34

  return (
    <div className="widget" data-widget="dummy-coding">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Highlight an arm">
          <span className="btn-group__label">Highlight:</span>
          {ARMS.map((a) => (
            <button key={a.id} type="button" className={`btn btn--toggle${active === a.id ? ' is-active' : ''}`} aria-pressed={active === a.id} onClick={() => setActive(a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setSampleIdx((i) => i + 1)}>Re-sample</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ flex: '2 1 340px', minWidth: 300, width: '100%', height: 'auto' }}
          aria-label={`Three arms with means; placebo ${ref.toFixed(0)} is the intercept, low dose differs by ${b1.toFixed(1)}, high dose by ${b2.toFixed(1)}. ANOVA F = ${F.toFixed(1)}.`}>
          {/* y axis */}
          <line x1={ML} x2={ML} y1={MT} y2={sy(YD[0])} stroke="var(--border-strong)" strokeWidth={1.5} />
          {[100, 110, 120, 130].map((t) => (
            <g key={t}>
              <line x1={ML} x2={W - MR} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth={1} />
              <text x={ML - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-subtle)">{t}</text>
            </g>
          ))}
          <text x={14} y={(MT + sy(YD[0])) / 2} textAnchor="middle" fontSize={12} fill="var(--text-muted)" transform={`rotate(-90 14 ${(MT + sy(YD[0])) / 2})`}>Final BP (mmHg)</text>

          {/* intercept line (reference = placebo mean) */}
          <line x1={ML} x2={W - MR} y1={sy(ref)} y2={sy(ref)} stroke="var(--viz-null)" strokeWidth={1.6} strokeDasharray="6 5" />
          <text x={W - MR} y={sy(ref) - 6} textAnchor="end" fontSize={11} fontWeight={600} fill="var(--viz-null)">intercept a = {ref.toFixed(0)} (placebo mean)</text>

          {data.map((d, gi) => (
            <g key={d.id} opacity={active === d.id || gi === 0 ? 1 : 0.85}>
              {/* points */}
              {d.ys.map((v, i) => (
                <circle key={i} cx={colX(gi) + jitter()} cy={sy(v)} r={4} fill={d.colour} opacity={0.55} />
              ))}
              {/* group mean tick */}
              <line x1={colX(gi) - 26} x2={colX(gi) + 26} y1={sy(d.mean)} y2={sy(d.mean)} stroke={d.colour} strokeWidth={3} />
              {/* coefficient arrow from reference to this group's mean */}
              {gi > 0 && (
                <g opacity={active === d.id ? 1 : 0.3}>
                  <line x1={colX(gi)} x2={colX(gi)} y1={sy(ref)} y2={sy(d.mean)} stroke={d.colour} strokeWidth={2} />
                  {(() => {
                    const yEnd = sy(d.mean)
                    const dir = Math.sign(yEnd - sy(ref)) || 1
                    return <path d={`M${colX(gi) - 4},${yEnd - dir * 6} L${colX(gi) + 4},${yEnd - dir * 6} L${colX(gi)},${yEnd} Z`} fill={d.colour} />
                  })()}
                  <text x={colX(gi) + 8} y={(sy(ref) + sy(d.mean)) / 2 + 4} fontSize={12} fontWeight={700} fill={d.colour}>
                    {gi === 1 ? 'b₁' : 'b₂'} = {(d.mean - ref >= 0 ? '+' : '') + (d.mean - ref).toFixed(1)}
                  </text>
                </g>
              )}
              {/* x label */}
              <text x={colX(gi)} y={H - MB + 22} textAnchor="middle" fontSize={12} fontWeight={active === d.id ? 700 : 400} fill={d.colour}>{d.label}</text>
            </g>
          ))}
        </svg>

        {/* design matrix */}
        <div style={{ flex: '1 1 180px', minWidth: 180 }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.9rem' }}>Design matrix (dummy coding)</p>
          <table className="dummy-table" style={{ borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', width: '100%' }}>
            <thead>
              <tr style={{ color: 'var(--text-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '2px 6px' }}>arm</th>
                <th style={{ padding: '2px 6px' }}>1 (a)</th>
                <th style={{ padding: '2px 6px' }}>low?</th>
                <th style={{ padding: '2px 6px' }}>high?</th>
              </tr>
            </thead>
            <tbody>
              {ARMS.map((a, i) => {
                const row = [1, i === 1 ? 1 : 0, i === 2 ? 1 : 0]
                const on = active === a.id
                return (
                  <tr key={a.id} style={{ background: on ? 'color-mix(in srgb, var(--surface-2, #8884) 60%, transparent)' : 'transparent', color: on ? a.colour : 'var(--text-muted)', fontWeight: on ? 700 : 400 }}>
                    <td style={{ textAlign: 'left', padding: '3px 6px' }}>{a.label}</td>
                    {row.map((c, j) => (
                      <td key={j} style={{ textAlign: 'center', padding: '3px 6px' }}>{c}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            The model reads each arm off its row: placebo = <em>a</em>, low = <em>a + b₁</em>, high = <em>a + b₂</em>.
          </p>
        </div>
      </div>

      <div className="widget__readouts">
        <NumberReadout label="Intercept a" value={ref.toFixed(1)} sub="the placebo (reference) mean" />
        <NumberReadout label="b₁ (low − placebo)" value={(b1 >= 0 ? '+' : '') + b1.toFixed(1)} sub="low-dose coefficient" tone="accent" />
        <NumberReadout label="b₂ (high − placebo)" value={(b2 >= 0 ? '+' : '') + b2.toFixed(1)} sub="high-dose coefficient" tone="accent" />
        <NumberReadout label="ANOVA F" value={F.toFixed(1)} sub={`df ${k - 1}, ${Nn - k} — identical to the lm F-test`} />
      </div>
      <p className="widget__note">
        The ANOVA F-test asks one thing: are <strong>b₁ and b₂ both zero</strong>? A large F says at least one arm
        differs from placebo — but only the coefficients tell you which, and by how much. Same model, two outputs.
      </p>
    </div>
  )
}
