/**
 * Pilot feedback forms (Microsoft Forms) and the pre-filled links into them.
 * Field ids come from each form's "Get pre-filled URL" link; editing those
 * questions in Forms can change the ids, so re-copy the link if pre-filling breaks.
 */

const FORMS_BASE = 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id='

/** "Report a problem / feedback" form: opened from the floating button. */
export const FEEDBACK_FORM = {
  id: '-XhTSvQpPk2-iWadA62p2K-OPFGp-YNCgcfgnInT9V1UQlo0NEhVMFg3QkdGTlY0RUVPNkZHTTdEVC4u',
  fields: {
    module: 'r90d808cdb508467f92aa594b498f3b92',
    section: 'r07ac987c46a543e88445896729b96d02',
    details: 'r7e12a9816ea54aeeaa3257f855b5e8cc',
  },
}

/** End-of-module check-in form: opened from the card in the module footer. */
export const CHECKIN_FORM = {
  id: '-XhTSvQpPk2-iWadA62p2K-OPFGp-YNCgcfgnInT9V1UNVdJQkpZQUZZTFVMTkpSUU1VTEk4RFJDMy4u',
  fields: {
    module: 'r20d9901a4b344f1e90918f1d5da8c98c',
    selfCheck: 'r673f4159384f453a90cf4ad90619841c',
    details: 'r70370f7501334c84905745a9eb0b74f1',
  },
}

/** Build a pre-filled link: `values` is keyed like `form.fields`. */
export function prefilledUrl<K extends string>(
  form: { id: string; fields: Record<K, string> },
  values: Record<K, string>,
): string {
  let url = FORMS_BASE + form.id
  for (const key of Object.keys(form.fields) as K[]) {
    url += `&${form.fields[key]}=${encodeURIComponent(values[key])}`
  }
  return url
}

export function openForm(url: string) {
  window.open(url, '_blank', 'noopener')
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

/** URL · browser · OS · viewport · theme · build version. */
export function technicalDetails(dark: boolean): string {
  const ua = navigator.userAgent
  return [
    window.location.href,
    browserName(ua),
    osName(ua),
    `${window.innerWidth}×${window.innerHeight}`,
    dark ? 'dark mode' : 'light mode',
    `v${__APP_VERSION__}`,
  ].join(' · ')
}
