/**
 * LinkFunctionExplorer — Module 7 (One Model, Many Tests), Section 5. The GLM
 * idea in one picture: the linear predictor a + b·x is the SAME straight line in
 * "link space" (left panel); the link function maps it back onto the outcome
 * scale (right panel), where it bends into the shape each outcome type needs.
 *
 *  • identity → ordinary linear regression (the line stays a line)
 *  • logit    → logistic regression (sigmoid, penned in 0–1)
 *  • log      → Poisson regression (positive, exponential growth)
 *
 * One slope slider drives both panels. SVG + viz tokens; reuses the sigmoid idea
 * from LogOddsTransform.
 */
import { useState } from 'react'

type Link = 'identity' | 'logit' | 'log'
const TABS: { id: Link; label: string; test: string; invLabel: string }[] = [
  { id: 'identity', label: 'identity', test: 'linear regression', invLabel: 'outcome' },
  { id: 'logit', label: 'logit', test: 'logistic regression', invLabel: 'probability' },
  { id: 'log', label: 'log', test: 'Poisson regression', invLabel: 'expected count' },
]

const PW = 290
const PH = 250
const ML = 44
const MR = 14
const MT = 16
const MB = 40
const XMIN = -3
const XMAX = 3

const inv = (link: Link, eta: number) => (link === 'identity' ? eta : link === 'logit' ? 1 / (1 + Math.exp(-eta)) : Math.exp(eta))

export function LinkFunctionExplorer() {
  const [link, setLink] = useState<Link>('logit')
  const [b, setB] = useState(0.9)
  const a = 0
  const tab = TABS.find((t) => t.id === link)!

  const xs: number[] = []
  for (let x = XMIN; x <= XMAX + 1e-9; x += 0.1) xs.push(x)
  const eta = (x: number) => a + b * x

  // link-space panel (left): y = eta, domain symmetric
  const ETA_LIM = 5
  const lx = (x: number) => ML + ((x - XMIN) / (XMAX - XMIN)) * (PW - ML - MR)
  const ly = (e: number) => MT + ((ETA_LIM - Math.max(-ETA_LIM, Math.min(ETA_LIM, e))) / (2 * ETA_LIM)) * (PH - MT - MB)

  // outcome-space panel (right): domain depends on link
  const outDom: [number, number] = link === 'identity' ? [-ETA_LIM, ETA_LIM] : link === 'logit' ? [0, 1] : [0, Math.exp(b > 0 ? b * XMAX : -b * XMIN) * 1.05]
  const ox = lx
  const oy = (v: number) => MT + ((outDom[1] - Math.max(outDom[0], Math.min(outDom[1], v))) / (outDom[1] - outDom[0])) * (PH - MT - MB)

  const linePath = (yfn: (x: number) => number, ymap: (v: number) => number) =>
    'M' + xs.map((x) => `${ox(x).toFixed(1)},${ymap(yfn(x)).toFixed(1)}`).join(' L')

  const Panel = ({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) => (
    <div style={{ flex: '1 1 280px', minWidth: 250 }}>
      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem' }}>{title}</p>
      <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{sub}</p>
      {children}
    </div>
  )

  const axes = (ymid: number, ymap: (v: number) => number, label: string) => (
    <>
      <line x1={ML} x2={PW - MR} y1={ymap(ymid)} y2={ymap(ymid)} stroke="var(--viz-grid)" strokeWidth={1} />
      <line x1={ML} x2={PW - MR} y1={PH - MB} y2={PH - MB} stroke="var(--border-strong)" strokeWidth={1.4} />
      <line x1={ML} x2={ML} y1={MT} y2={PH - MB} stroke="var(--border-strong)" strokeWidth={1.4} />
      <text x={(ML + PW - MR) / 2} y={PH - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">predictor x</text>
      <text x={12} y={(MT + PH - MB) / 2} textAnchor="middle" fontSize={11} fill="var(--text-muted)" transform={`rotate(-90 12 ${(MT + PH - MB) / 2})`}>{label}</text>
    </>
  )

  return (
    <div className="widget" data-widget="link-function">
      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Link function">
          <span className="btn-group__label">Link:</span>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`btn btn--toggle${link === t.id ? ' is-active' : ''}`} aria-pressed={link === t.id} onClick={() => setLink(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="widget__tag" style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          → <strong>{tab.test}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        <Panel title="Link space — the linear predictor" sub="a + b × x: a straight line, every time">
          <svg viewBox={`0 0 ${PW} ${PH}`} role="img" style={{ width: '100%', height: 'auto' }} aria-label="The linear predictor as a straight line on the link scale.">
            {axes(0, ly, 'link( outcome )')}
            <path d={linePath((x) => eta(x), ly)} fill="none" stroke="var(--viz-signal)" strokeWidth={2.5} />
          </svg>
        </Panel>
        <Panel title={`Outcome space — after the ${tab.label} link`} sub={`the same line, mapped to ${tab.invLabel}`}>
          <svg viewBox={`0 0 ${PW} ${PH}`} role="img" style={{ width: '100%', height: 'auto' }} aria-label={`The same predictor mapped through the ${tab.label} link onto the ${tab.invLabel} scale.`}>
            {/* outcome walls for logit */}
            {link === 'logit' && [0, 1].map((w) => (
              <line key={w} x1={ML} x2={PW - MR} y1={oy(w)} y2={oy(w)} stroke="var(--viz-alpha)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.7} />
            ))}
            {link === 'log' && (
              <line x1={ML} x2={PW - MR} y1={oy(0)} y2={oy(0)} stroke="var(--viz-alpha)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.7} />
            )}
            {axes(link === 'logit' ? 0.5 : link === 'log' ? outDom[1] / 2 : 0, oy, tab.invLabel)}
            <path d={linePath((x) => inv(link, eta(x)), oy)} fill="none" stroke="var(--viz-power)" strokeWidth={2.5} />
          </svg>
        </Panel>
      </div>

      <div className="widget__controls">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
          <span style={{ minWidth: 96 }}>Slope b = {b.toFixed(1)}</span>
          <input type="range" min={-1.5} max={1.5} step={0.1} value={b} onChange={(e) => setB(+e.target.value)} style={{ flex: 1 }} aria-label="slope b" />
        </label>
      </div>
      <p className="widget__note">
        The left line never changes shape — it's always the straight linear predictor. The{' '}
        <strong>{tab.label}</strong> link is what bends it on the right: {link === 'identity' ? 'nothing happens, so ordinary regression is just the identity-link GLM.' : link === 'logit' ? 'squashed between 0 and 1, so predictions stay valid probabilities (logistic regression).' : 'forced positive and growing, so predictions stay valid counts (Poisson regression).'}
      </p>
    </div>
  )
}
