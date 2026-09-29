/**
 * ModuleCheckIn — end-of-module card that opens the pilot check-in form
 * (Microsoft Forms) with the module, a first-try self-check summary and
 * technical details pre-filled.
 */
import type { ModuleMeta } from '../content/modules'
import { CHECKIN_FORM, openForm, prefilledUrl, technicalDetails } from '../lib/feedback'
import { useTheme } from '../theme/ThemeContext'
import { loadFirstTry } from './SelfCheckQuestion'

/**
 * e.g. "3 of 5 right first time · Missed first time: Q2 (m4-q2) · Not tried: Q5 (m4-q5)".
 * Q-numbers are the order the self-checks appear in the module; ids in brackets
 * are the stable question ids (in Modules 8–9 these still carry the old m7-/m8- prefixes).
 */
function selfCheckSummary(): string {
  const qids = Array.from(document.querySelectorAll<HTMLElement>('.module__content [data-qid]')).map(
    (el) => el.dataset.qid!,
  )
  if (qids.length === 0) return 'No self-checks in this module'
  const firstTry = loadFirstTry()
  const label = (qid: string) => `Q${qids.indexOf(qid) + 1} (${qid})`
  const correct = qids.filter((q) => firstTry[q] === true)
  const missed = qids.filter((q) => firstTry[q] === false)
  const notTried = qids.filter((q) => !(q in firstTry))

  const parts = [`${correct.length} of ${qids.length} right first time`]
  if (missed.length) parts.push(`Missed first time: ${missed.map(label).join(', ')}`)
  if (notTried.length) parts.push(`Not tried: ${notTried.map(label).join(', ')}`)
  return parts.join(' · ')
}

export function ModuleCheckIn({ module: mod }: { module: ModuleMeta }) {
  const { dark } = useTheme()

  const open = () =>
    openForm(
      prefilledUrl(CHECKIN_FORM, {
        module: `${mod.id} – ${mod.title}`,
        selfCheck: selfCheckSummary(),
        details: technicalDetails(dark),
      }),
    )

  return (
    <section className="checkin" aria-label="Module check-in">
      <div>
        <p className="checkin__title">Finished this module?</p>
        <p className="checkin__text">Tell us how it went. It takes about 2 minutes.</p>
      </div>
      <button type="button" className="btn btn--primary btn--small" onClick={open}>
        Give module feedback →
      </button>
    </section>
  )
}
