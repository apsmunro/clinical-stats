/**
 * ParameterSlider — labelled slider with a prominent live value.
 * Keyboard-accessible (native range input: arrow keys work out of the box),
 * large touch target, optional unit and help tooltip.
 */
import { useId } from 'react'

export interface ParameterSliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  unit?: string
  help?: string
  disabled?: boolean
  /** Format the displayed value (default: as-is). */
  format?: (value: number) => string
}

export function ParameterSlider({
  label, min, max, step, value, onChange, unit, help, disabled, format,
}: ParameterSliderProps) {
  const id = useId()
  const shown = format ? format(value) : String(value)
  return (
    <div className={`param-slider${disabled ? ' is-disabled' : ''}`}>
      <div className="param-slider__head">
        <label htmlFor={id}>
          {label}
          {help && (
            <span className="param-slider__help" tabIndex={0} role="note" aria-label={help} title={help}>
              ?
            </span>
          )}
        </label>
        <output htmlFor={id} className="param-slider__value">
          {shown}
          {unit && <span className="param-slider__unit"> {unit}</span>}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}${unit ? ` (${unit})` : ''}`}
      />
    </div>
  )
}
