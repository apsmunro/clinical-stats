/**
 * FeedbackButton — floating "Feedback" pill that opens the pilot feedback
 * form (Microsoft Forms) in a new tab with three answers pre-filled: the
 * module, the section the reader is currently looking at, and technical
 * details (URL, browser, OS, viewport, theme, build version) so bug reports
 * arrive reproducible without the reader having to describe their setup.
 */
import { useLocation } from 'react-router-dom'
import { moduleBySlug } from '../content/modules'
import { FEEDBACK_FORM, openForm, prefilledUrl, technicalDetails } from '../lib/feedback'
import { useTheme } from '../theme/ThemeContext'

/** The last section heading scrolled past the upper part of the screen. */
function currentSection(): string {
  const headings = Array.from(document.querySelectorAll<HTMLElement>('.module__content h2'))
  const line = window.innerHeight * 0.4
  let found = ''
  for (const h of headings) {
    if (h.getBoundingClientRect().top < line) found = h.textContent?.trim() ?? ''
    else break
  }
  return found || 'Introduction / learning objectives'
}

export function FeedbackButton() {
  const { pathname } = useLocation()
  const { dark } = useTheme()

  const open = () => {
    const slug = pathname.match(/^\/module\/([^/]+)/)?.[1]
    const mod = slug ? moduleBySlug(slug) : undefined
    openForm(
      prefilledUrl(FEEDBACK_FORM, {
        module: mod ? `${mod.id} – ${mod.title}` : pathname === '/' ? 'Home page' : pathname,
        section: mod ? currentSection() : '',
        details: technicalDetails(dark),
      }),
    )
  }

  return (
    <button
      type="button"
      className="feedback-fab"
      onClick={open}
      title="Report a problem or leave feedback on this section (opens a form in a new tab)"
    >
      <span aria-hidden="true">✎</span> Feedback
    </button>
  )
}
