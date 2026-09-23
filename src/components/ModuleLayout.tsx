/**
 * ModuleLayout — the shell every module renders inside.
 * Module title, learning-objectives block, the MDX content, a "mark complete"
 * tick persisted to localStorage, and prev/next navigation from the registry.
 */
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { neighbours, type ModuleMeta } from '../content/modules'

const STORE_KEY = 'csc-modules-done'

function loadDone(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function isModuleDone(slug: string): boolean {
  return !!loadDone()[slug]
}

export function ModuleLayout({ module: mod, children }: { module: ModuleMeta; children: ReactNode }) {
  const [done, setDone] = useState(() => isModuleDone(mod.slug))
  const { prev, next } = neighbours(mod.id)

  const toggleDone = (value: boolean) => {
    setDone(value)
    try {
      const all = loadDone()
      all[mod.slug] = value
      localStorage.setItem(STORE_KEY, JSON.stringify(all))
    } catch {
      /* private mode — fine */
    }
  }

  return (
    <article className="module">
      <header className="module__header">
        <span className="eyebrow">Module {String(mod.id).padStart(2, '0')}</span>
        <h1>{mod.title}</h1>
        {mod.objectives && (
          <section className="objectives" aria-label="Learning objectives">
            <h2>What you'll be able to do</h2>
            <ol>
              {mod.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ol>
          </section>
        )}
      </header>

      <div className="module__content module-prose">{children}</div>

      <footer className="module__footer">
        <label className="checkbox checkbox--complete">
          <input type="checkbox" checked={done} onChange={(e) => toggleDone(e.target.checked)} />
          Mark this module as complete
        </label>
        <nav className="module__nav" aria-label="Module navigation">
          {prev ? (
            <Link className="module__nav-link" to={`/module/${prev.slug}`}>
              ← Module {prev.id}: {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="module__nav-link module__nav-link--next" to={`/module/${next.slug}`}>
              Module {next.id}: {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </footer>
    </article>
  )
}
