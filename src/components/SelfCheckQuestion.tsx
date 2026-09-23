/**
 * SelfCheckQuestion — single-best-answer MCQ with per-option feedback.
 * No scoring or login; a correct answer is remembered in localStorage so
 * learners can see which self-checks they have already done.
 */
import { useMemo, useState } from 'react'

export interface SelfCheckOption {
  text: string
  correct: boolean
  /** Explains WHY this option is right or wrong (always shown on selection). */
  feedback: string
}

export interface SelfCheckQuestionProps {
  prompt: string
  options: SelfCheckOption[]
  /** Stable id for localStorage persistence (falls back to a prompt hash). */
  id?: string
}

function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `q${(h >>> 0).toString(36)}`
}

const STORE_KEY = 'csc-selfcheck-done'

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function SelfCheckQuestion({ prompt, options, id }: SelfCheckQuestionProps) {
  const qid = useMemo(() => id ?? hash(prompt), [id, prompt])
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState<boolean>(() => !!loadDone()[qid])

  const choose = (i: number) => {
    setSelected(i)
    if (options[i].correct) {
      setDone(true)
      try {
        const all = loadDone()
        all[qid] = true
        localStorage.setItem(STORE_KEY, JSON.stringify(all))
      } catch {
        /* private mode — fine */
      }
    }
  }

  const letters = 'ABCDEFGH'

  return (
    <div className="self-check">
      <div className="self-check__prompt">
        <span className="self-check__tag">Self-check{done ? ' ✓' : ''}</span>
        <p>{prompt}</p>
      </div>
      <div className="self-check__options" role="group" aria-label="Answer options">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const state = isSelected ? (opt.correct ? 'correct' : 'incorrect') : 'idle'
          return (
            <div key={i}>
              <button
                type="button"
                className={`self-check__option self-check__option--${state}`}
                aria-pressed={isSelected}
                onClick={() => choose(i)}
              >
                <span className="self-check__letter">{letters[i]}</span>
                <span>{opt.text}</span>
              </button>
              {isSelected && (
                <div
                  className={`self-check__feedback self-check__feedback--${opt.correct ? 'correct' : 'incorrect'}`}
                  role="status"
                >
                  <strong>{opt.correct ? 'Correct. ' : 'Not quite. '}</strong>
                  {opt.feedback}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
