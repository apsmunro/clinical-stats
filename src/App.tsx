import { Suspense, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { ModuleLayout, isModuleDone } from './components/ModuleLayout'
import { moduleBySlug, modules } from './content/modules'
import { useTheme } from './theme/ThemeContext'

/** Ghosted bell-curve + plot-grid motif for the ink hero (≤6% opacity). */
function HeroMotif() {
  return (
    <svg className="hero__motif" viewBox="0 0 900 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g stroke="#FFFFFF" strokeWidth="1" opacity="0.05">
        {[60, 120, 180, 240, 300].map((y) => (
          <line key={y} x1="0" x2="900" y1={y} y2={y} />
        ))}
        {[150, 300, 450, 600, 750].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="360" />
        ))}
      </g>
      <path
        d="M40,340 C240,340 300,330 380,180 C430,80 440,40 450,40 C460,40 470,80 520,180 C600,330 660,340 860,340"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        opacity="0.07"
      />
    </svg>
  )
}

/** Live mini-distribution: a bell of bars gently "filling in" (§11). */
function HeroLiveDist() {
  const heights = useMemo(() => {
    // bell-shaped bar heights with slight noise; staggered animation delays
    const k = 28
    return Array.from({ length: k }, (_, i) => {
      const z = (i - (k - 1) / 2) / (k / 5)
      const h = Math.exp(-0.5 * z * z)
      return { h: Math.max(0.06, h * (0.9 + 0.2 * Math.sin(i * 7.3))), d: (i % 9) * 0.21 }
    })
  }, [])
  return (
    <div className="hero__live" aria-hidden="true">
      <div className="hero-dist">
        {heights.map((b, i) => (
          <span key={i} style={{ height: `${b.h * 100}%`, animationDelay: `${b.d}s` }} />
        ))}
      </div>
    </div>
  )
}

function Home() {
  const doneCount = modules.filter((m) => m.status === 'available' && isModuleDone(m.slug)).length
  const nextModule = modules.find((m) => m.status === 'available' && !isModuleDone(m.slug))
  const ctaTarget = nextModule ?? modules[0]
  const ctaLabel =
    doneCount === 0
      ? 'Start with Module 1 →'
      : nextModule
        ? `Continue with Module ${nextModule.id} →`
        : 'Revisit the course →'

  return (
    <div className="home">
      <section className="hero">
        <HeroMotif />
        <HeroLiveDist />
        <div className="hero__content">
          <span className="eyebrow">Clinical Statistics · Interactive Course</span>
          <h1 className="hero__title">Understand the numbers behind the evidence.</h1>
          <p className="hero__sub">
            A self-paced companion for clinicians and researchers who find statistics intimidating.
            Every key idea is something you play with (sliders, simulations, live plots) before any
            formula appears. R code optional throughout.
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary" to={`/module/${ctaTarget.slug}`}>
              {ctaLabel}
            </Link>
            {/* Plain #anchor links fight the hash router (it would route to a
                blank /curriculum page), so scroll programmatically instead. */}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                document.getElementById('curriculum')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Browse the curriculum
            </button>
          </div>
        </div>
      </section>

      <div className="how">
        <div className="how__step">
          <span className="how__num">1</span>
          <h3>Meet the idea</h3>
          <p>Plain language first, one concept per screen. Notation only after the intuition.</p>
        </div>
        <div className="how__step">
          <span className="how__num">2</span>
          <h3>Interact with it</h3>
          <p>Drag the sliders, run 10,000 trials, watch the distribution respond. The chart is the teacher.</p>
        </div>
        <div className="how__step">
          <span className="how__num">3</span>
          <h3>Check yourself</h3>
          <p>Self-checks with per-option feedback that explains the reasoning, not just right or wrong.</p>
        </div>
      </div>

      <div className="home__section-head">
        <h2 className="home__section-title" id="curriculum">
          The curriculum
        </h2>
        {doneCount > 0 && (
          <div className="home__progress" role="status">
            <span className="home__progress-track" aria-hidden="true">
              <span
                className="home__progress-fill"
                style={{ width: `${(doneCount / modules.length) * 100}%` }}
              />
            </span>
            {doneCount} of {modules.length} modules completed
          </div>
        )}
      </div>
      <div className="home__grid">
        {modules.map((m) => {
          const done = m.status === 'available' && isModuleDone(m.slug)
          return (
            <div
              key={m.id}
              className={`module-card${m.status === 'coming-soon' ? ' module-card--soon' : ''}`}
            >
              <span className="eyebrow">Module {String(m.id).padStart(2, '0')}</span>
              <h2>
                {m.status === 'available' ? <Link to={`/module/${m.slug}`}>{m.title}</Link> : m.title}
              </h2>
              <p>{m.blurb}</p>
              <div className="module-card__foot">
                {m.status === 'available' ? (
                  <>
                    <span className={`pill ${done ? 'pill--done' : 'pill--available'}`}>
                      {done ? '✓ Completed' : 'Available'}
                    </span>
                    <Link className="module-card__go" to={`/module/${m.slug}`}>
                      {done ? 'Revisit →' : 'Start →'}
                    </Link>
                  </>
                ) : (
                  <span className="pill pill--soon">Coming soon</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Catch-all so an unrecognised hash never renders an empty page. */
function NotFound() {
  return (
    <div className="home">
      <h1>Page not found</h1>
      <p className="home__lead">That link doesn't match anything in the course.</p>
      <p>
        <Link className="btn btn--primary" to="/">
          Back to the course outline
        </Link>
      </p>
    </div>
  )
}

function ModulePage() {
  const { slug } = useParams()
  const mod = slug ? moduleBySlug(slug) : undefined

  if (!mod) {
    return (
      <div className="home">
        <h1>Module not found</h1>
        <p>
          <Link to="/">Back to the course outline</Link>
        </p>
      </div>
    )
  }

  if (mod.status === 'coming-soon' || !mod.Component) {
    return (
      <div className="home">
        <span className="eyebrow">Module {String(mod.id).padStart(2, '0')}</span>
        <h1>{mod.title}</h1>
        <p className="home__lead">{mod.blurb}</p>
        <p>
          This module is <strong>coming soon</strong>. In the meantime, the available modules are
          ready to explore from the course outline.
        </p>
        <p>
          <Link className="btn btn--primary" to="/">
            Back to the course outline
          </Link>
        </p>
      </div>
    )
  }

  const Content = mod.Component
  return (
    <ModuleLayout module={mod}>
      <Suspense fallback={<div className="widget__placeholder">Loading module…</div>}>
        <Content />
      </Suspense>
    </ModuleLayout>
  )
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false)
  const { dark, toggle } = useTheme()

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app__header">
        <Link to="/" className="app__brand" aria-label="REP Clinical Statistics — home">
          <img className="app__brand-logo" src="./brand/glyph.svg" alt="" aria-hidden="true" />
          <span className="app__brand-name">REP</span>
          <span className="app__brand-desc">Clinical Statistics</span>
        </Link>
        <div className="app__header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? '☀' : '☾'}
          </button>
          <button
            type="button"
            className="app__nav-toggle btn"
            aria-expanded={navOpen}
            aria-controls="module-nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            Modules {navOpen ? '▲' : '▼'}
          </button>
        </div>
      </header>
      <div className="app__body">
        <nav id="module-nav" className={`app__nav${navOpen ? ' is-open' : ''}`} aria-label="Course modules">
          <ul>
            {modules.map((m) => (
              <li key={m.id}>
                {m.status === 'available' ? (
                  <NavLink to={`/module/${m.slug}`} onClick={() => setNavOpen(false)}>
                    <span className="app__nav-num">{m.id}</span> {m.title}
                  </NavLink>
                ) : (
                  <span className="app__nav-soon">
                    <span className="app__nav-num">{m.id}</span> {m.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" className="app__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/module/:slug" element={<ModulePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <footer className="app__footer">
        REP · Research Education Program — Clinical Statistics. Concept-first, code-optional. All
        trials simulated; no actual Snakeoilizumab was harmed.
      </footer>
    </div>
  )
}
