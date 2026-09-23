/**
 * NumberReadout — a large labelled number with an optional formula caption.
 * Used for live SE displays, "Power ≈ XX%" headlines, required-n results, etc.
 */
export interface NumberReadoutProps {
  label: string
  value: string | number
  /** Small caption underneath, e.g. the theoretical formula. */
  sub?: string
  /** Visual emphasis: default neutral, 'accent' for headline results,
   *  'ok' / 'danger' for verdicts. */
  tone?: 'neutral' | 'accent' | 'ok' | 'danger'
  size?: 'md' | 'lg'
}

export function NumberReadout({ label, value, sub, tone = 'neutral', size = 'md' }: NumberReadoutProps) {
  return (
    <div className={`number-readout number-readout--${tone} number-readout--${size}`}>
      <div className="number-readout__label">{label}</div>
      <div className="number-readout__value" aria-live="polite">{value}</div>
      {sub && <div className="number-readout__sub">{sub}</div>}
    </div>
  )
}
