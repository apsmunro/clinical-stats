/**
 * ReRandomiseDemo — the Module 4 Section-1 hook.
 *
 * A fixed pool of patients (their BP values never change) is split into two
 * arms. Pressing "Re-randomise" reshuffles the SAME patients into new arms
 * and recomputes the difference in means — which visibly changes every click
 * even though nothing about the patients changed. Difference ≠ effect.
 */
import { useMemo, useRef, useState } from 'react'
import { Rng } from '../lib/rng'
import { mean } from '../lib/stats'

const POOL_SIZE = 16 // 8 per arm — small enough to see individuals

export function ReRandomiseDemo({ seed = 2024 }: { seed?: number }) {
  // The patient pool is created once and never changes.
  const patients = useMemo(() => {
    const rng = new Rng(seed)
    return Array.from({ length: POOL_SIZE }, () => Math.round(rng.normal(120, 15)))
  }, [seed])

  const shuffler = useRef(new Rng(seed + 1))
  const [assignment, setAssignment] = useState<number[]>(() =>
    Array.from({ length: POOL_SIZE }, (_, i) => i),
  )
  const [clicks, setClicks] = useState(0)

  const reRandomise = () => {
    const idx = [...assignment]
    const rng = shuffler.current
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    setAssignment(idx)
    setClicks((c) => c + 1)
  }

  const armA = assignment.slice(0, POOL_SIZE / 2).map((i) => patients[i])
  const armB = assignment.slice(POOL_SIZE / 2).map((i) => patients[i])
  const diff = mean(armB) - mean(armA)

  // layout: dots scaled by BP value within a fixed range
  const lo = 85
  const hi = 155
  const yFor = (bp: number) => 150 - ((bp - lo) / (hi - lo)) * 130

  const renderArm = (values: number[], x0: number, color: string, label: string) => (
    <g>
      <text x={x0 + 52} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
        {label}
      </text>
      <text x={x0 + 52} y={178} textAnchor="middle" fontSize={12.5} fill="var(--text-muted)">
        mean {mean(values).toFixed(1)}
      </text>
      {values.map((bp, i) => (
        <g key={i}>
          <circle cx={x0 + 18 + (i % 4) * 23} cy={yFor(bp) + 14} r={8} fill={color} opacity={0.9} />
          <text x={x0 + 18 + (i % 4) * 23} y={yFor(bp) + 18} textAnchor="middle" fontSize={7.5} fill="var(--bg)">
            {bp}
          </text>
        </g>
      ))}
    </g>
  )

  return (
    <div className="widget" data-widget="re-randomise">
      <svg
        viewBox="0 0 360 190"
        className="rerand__svg"
        role="img"
        aria-label={`The same ${POOL_SIZE} patients split into two arms of ${POOL_SIZE / 2}. Current difference in mean BP: ${diff.toFixed(1)} mmHg.`}
      >
        <rect x={8} y={4} width={150} height={182} rx={10} fill="var(--surface-2)" />
        <rect x={202} y={4} width={150} height={182} rx={10} fill="var(--primary-tint)" />
        {renderArm(armA, 30, 'var(--viz-null)', 'Arm A (placebo)')}
        {renderArm(armB, 224, 'var(--viz-signal)', 'Arm B (drug)')}
        <text x={180} y={100} textAnchor="middle" fontSize={20} fill="var(--text-subtle)">→</text>
      </svg>
      <div className="rerand__footer">
        <div>
          <div className="rerand__diff" aria-live="polite">
            Difference in means: <strong>{diff >= 0 ? '+' : ''}{diff.toFixed(1)} mmHg</strong>
          </div>
          <div className="rerand__note">
            Same {POOL_SIZE} patients every time; the “drug” does nothing.{' '}
            {clicks > 0 && `Re-randomised ${clicks}×.`}
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={reRandomise}>
          Re-randomise
        </button>
      </div>
    </div>
  )
}
