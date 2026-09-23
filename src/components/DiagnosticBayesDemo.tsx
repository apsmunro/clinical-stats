/**
 * DiagnosticBayesDemo — Module 5 Section 1.
 *
 * Pre-test probability × test characteristics → post-test probability,
 * with a 1,000-person breakdown bar so the learner sees WHY a positive
 * test for a rare disease is usually a false positive. Pure arithmetic,
 * no simulation.
 */
import { useState } from 'react'
import { ParameterSlider } from './ParameterSlider'
import { NumberReadout } from './NumberReadout'

export function DiagnosticBayesDemo({
  defaultPrevalence = 1, // percent
  defaultSensitivity = 90, // percent
  defaultSpecificity = 90, // percent
}: {
  defaultPrevalence?: number
  defaultSensitivity?: number
  defaultSpecificity?: number
}) {
  const [prev, setPrev] = useState(defaultPrevalence)
  const [sens, setSens] = useState(defaultSensitivity)
  const [spec, setSpec] = useState(defaultSpecificity)
  const [result, setResult] = useState<'positive' | 'negative'>('positive')

  const p = prev / 100
  const se = sens / 100
  const sp = spec / 100

  // among 1,000 people
  const diseased = 1000 * p
  const healthy = 1000 - diseased
  const tp = diseased * se
  const fn = diseased * (1 - se)
  const fp = healthy * (1 - sp)
  const tn = healthy * sp

  const postPositive = tp / (tp + fp)
  const postNegative = fn / (fn + tn) // P(disease | negative test)
  const post = result === 'positive' ? postPositive : postNegative

  const fmtCount = (x: number) => (x < 10 ? x.toFixed(1) : Math.round(x).toString())
  const pct = (x: number) => `${(x * 100).toFixed(x * 100 < 10 ? 1 : 0)}%`

  // breakdown bar: the people who got THIS test result
  const withDisease = result === 'positive' ? tp : fn
  const withoutDisease = result === 'positive' ? fp : tn
  const total = withDisease + withoutDisease

  return (
    <div className="widget" data-widget="diagnostic-bayes">
      <div className="widget__controls">
        <ParameterSlider
          label="Pre-test probability (prevalence)"
          min={0.5} max={50} step={0.5} value={prev} onChange={setPrev} unit="%"
          help="Your belief before the test: how common is the condition in patients like this one?"
        />
        <ParameterSlider label="Sensitivity" min={50} max={100} step={1} value={sens} onChange={setSens} unit="%"
          help="Of people WITH the disease, the share the test correctly flags positive." />
        <ParameterSlider label="Specificity" min={50} max={100} step={1} value={spec} onChange={setSpec} unit="%"
          help="Of people WITHOUT the disease, the share the test correctly calls negative." />
      </div>

      <div className="widget__runbar">
        <div className="btn-group" role="group" aria-label="Test result">
          <span className="btn-group__label">Test result:</span>
          <button
            type="button"
            className={`btn btn--toggle${result === 'positive' ? ' is-active' : ''}`}
            aria-pressed={result === 'positive'}
            onClick={() => setResult('positive')}
          >
            positive
          </button>
          <button
            type="button"
            className={`btn btn--toggle${result === 'negative' ? ' is-active' : ''}`}
            aria-pressed={result === 'negative'}
            onClick={() => setResult('negative')}
          >
            negative
          </button>
        </div>
      </div>

      <div className="widget__readouts">
        <NumberReadout label="Pre-test probability (your prior)" value={pct(p)} />
        <NumberReadout
          label={`Post-test probability after a ${result} test`}
          value={pct(post)}
          sub={
            result === 'positive'
              ? `of ${fmtCount(total)} people testing positive (per 1,000), ${fmtCount(withDisease)} truly have the disease`
              : `of ${fmtCount(total)} people testing negative (per 1,000), ${fmtCount(withDisease)} have the disease anyway`
          }
          tone="accent"
          size="lg"
        />
      </div>

      <div
        className="bayes-bar"
        role="img"
        aria-label={`Of 1,000 people, ${fmtCount(total)} get a ${result} result: ${fmtCount(withDisease)} with the disease and ${fmtCount(withoutDisease)} without.`}
      >
        <div className="bayes-bar__title">
          The {fmtCount(total)} of 1,000 people who test {result}:
        </div>
        <div className="bayes-bar__track">
          <div
            className="bayes-bar__seg bayes-bar__seg--disease"
            style={{ width: `${(withDisease / total) * 100}%` }}
          />
          <div
            className="bayes-bar__seg bayes-bar__seg--healthy"
            style={{ width: `${(withoutDisease / total) * 100}%` }}
          />
        </div>
        <div className="bayes-bar__legend">
          <span>
            <span className="bayes-bar__swatch bayes-bar__swatch--disease" /> truly diseased ({fmtCount(withDisease)})
          </span>
          <span>
            <span className="bayes-bar__swatch bayes-bar__swatch--healthy" /> disease-free ({fmtCount(withoutDisease)})
          </span>
        </div>
      </div>
    </div>
  )
}
