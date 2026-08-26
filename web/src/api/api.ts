const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

function getIdToken(): string | null {
  return localStorage.getItem('idToken')
}

// Google ID tokens expire ~1 hour after being issued, and the backend
// re-verifies the token on every call -- these are the errors it returns
// once that happens (or if the account was removed from the Teachers
// sheet mid-session). Distinct from business errors like "already saved"
// or "not found", which should just surface as-is.
function isAuthError(message: string): boolean {
  return (
    message.includes('Invalid Google token') ||
    message.includes('Missing idToken') ||
    message.includes('Not authorized') ||
    message.includes('Email not verified')
  )
}

function forceReauth() {
  localStorage.removeItem('idToken')
  localStorage.removeItem('teacher')
  window.location.reload()
}

async function call<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const idToken = getIdToken()
  if (!idToken) throw new Error('Not signed in')
  // Apps Script web app responses are served via a redirect to a
  // googleusercontent.com echo URL that only accepts GET; browsers
  // silently downgrade POST to GET (dropping the body) on that redirect,
  // so every call here uses GET with query params instead of a POST body.
  const query = new URLSearchParams({ action, idToken, ...params })
  const res = await fetch(`${APPS_SCRIPT_URL}?${query.toString()}`)
  const json = await res.json()
  if (!json.ok) {
    const message = json.error || 'Request failed'
    // A failed login attempt (e.g. an unauthorized Google account) is
    // handled inline on the login screen, not by force-reauthenticating.
    if (action !== 'login' && isAuthError(message)) {
      forceReauth()
    }
    throw new Error(message)
  }
  return json.data as T
}

export interface Teacher {
  name: string
  email: string
  classes: string[]
}

export const api = {
  login: (idToken: string) => {
    localStorage.setItem('idToken', idToken)
    return call<Teacher>('login')
  },
  getStudents: (klass: string, section = '') => call('getStudents', { class: klass, section }),
  addStudent: (student: Record<string, string>) => call('addStudent', { student: JSON.stringify(student) }),
  updateStudent: (studentId: string, fields: Record<string, string>) =>
    call('updateStudent', { studentId, fields: JSON.stringify(fields) }),
  deleteStudent: (studentId: string) => call('deleteStudent', { studentId }),
  saveAttendance: (
    klass: string,
    section: string,
    date: string,
    records: { studentId: string; present: 'Y' | 'N' | 'H' }[],
  ) => call('saveAttendance', { class: klass, section, date, records: JSON.stringify(records) }),
  getAttendance: (klass: string, section: string, date: string) =>
    call('getAttendance', { class: klass, section, date }),
  getDailyEntryData: (klass: string, section: string, date: string) =>
    call('getDailyEntryData', { class: klass, section, date }),
  getReport: (klass: string, section: string, period: 'daily' | 'weekly' | 'monthly', date: string) =>
    call('getReport', { class: klass, section, period, date }),
  getHolidays: (klass: string, dateFrom = '', dateTo = '') =>
    call('getHolidays', { class: klass, dateFrom, dateTo }),
  addHoliday: (date: string, klass: string, remark: string) => call('addHoliday', { date, class: klass, remark }),
  deleteHoliday: (id: string) => call('deleteHoliday', { id }),
}
