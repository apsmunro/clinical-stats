/**
 * FeedbackButton — floating "Feedback" pill that opens the pilot feedback
 * form (Microsoft Forms) in a new tab with three answers pre-filled: the
 * module, the section the reader is currently looking at, and technical
 * details (URL, browser, OS, viewport, theme, build version) so bug reports
 * arrive reproducible without the reader having to describe their setup.
 */
import { useLocation } from 'react-router-dom'
import { moduleBySlug } from '../content/modules'
import { useTheme } from '../theme/ThemeContext'

const FORM_URL =
  'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=-XhTSvQpPk2-iWadA62p2K-OPFGp-YNCgcfgnInT9V1UQlo0NEhVMFg3QkdGTlY0RUVPNkZHTTdEVC4u'

// Question ids from the form's pre-filled link (Module, Section, Technical details).
const FIELD = {
  module: 'r90d808cdb508467f92aa594b498f3b92',
  section: 'r07ac987c46a543e88445896729b96d02',
  details: 'r7e12a9816ea54aeeaa3257f855b5e8cc',
}

// Order matters: Edge's UA also says Chrome, and Chrome's also says Safari.
const BROWSERS: [string, RegExp][] = [
  ['Edge', /Edg\/(\d+)/],
  ['Firefox', /Firefox\/(\d+)/],
  ['Chrome', /Chrome\/(\d+)/],
  ['Safari', /Version\/(\d+).*Safari/],
]

function browserName(ua: string): string {
  for (const [name, re] of BROWSERS) {
    const m = ua.match(re)
    if (m) return `${name} ${m[1]}`
  }
  return 'Unknown browser'
}

function osName(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown OS'
}

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
    const moduleLabel = mod ? `${mod.id} – ${mod.title}` : pathname === '/' ? 'Home page' : pathname
    const section = mod ? currentSection() : ''
    const ua = navigator.userAgent
    const details = [
      window.location.href,
      browserName(ua),
      osName(ua),
      `${window.innerWidth}×${window.innerHeight}`,
      dark ? 'dark mode' : 'light mode',
      `v${__APP_VERSION__}`,
    ].join(' · ')

    const url =
      `${FORM_URL}&${FIELD.module}=${encodeURIComponent(moduleLabel)}` +
      `&${FIELD.section}=${encodeURIComponent(section)}` +
      `&${FIELD.details}=${encodeURIComponent(details)}`
    window.open(url, '_blank', 'noopener')
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
