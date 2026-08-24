import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db, type CachedStudent } from '../db/db'
import { flushQueue } from '../db/sync'
import { todayStr } from '../lib/date'

function isSunday(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDay() === 0
}

function initials(name: string, surname: string) {
  return `${name[0] ?? ''}${surname[0] ?? ''}`.toUpperCase()
}

function sortByName(list: CachedStudent[]) {
  return [...list].sort((a, b) => `${a.Name} ${a.Surname}`.localeCompare(`${b.Name} ${b.Surname}`))
}

interface Holiday {
  Date: string
  Class: string
  Remark: string
}

interface AttendanceRecord {
  Date: string
  StudentID: string
  Present: 'Y' | 'N' | 'H'
}

export default function DailyEntry() {
  const { klass, section } = useClassSelection()
  const [date, setDate] = useState(todayStr())
  const [students, setStudents] = useState<CachedStudent[]>([])
  const [marks, setMarks] = useState<Record<string, 'Y' | 'N'>>({})
  const [holidayRemark, setHolidayRemark] = useState('')
  const [markAsHoliday, setMarkAsHoliday] = useState(false)
  const [lockedHoliday, setLockedHoliday] = useState<string | null>(null)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checkingDate, setCheckingDate] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!klass) return
    loadStudents()
  }, [klass, section])

  useEffect(() => {
    if (!klass) return
    setStatus('')
    checkDateState()
  }, [klass, section, date])

  async function checkDateState() {
    setCheckingDate(true)
    setMarkAsHoliday(isSunday(date))
    setHolidayRemark(isSunday(date) ? 'Sunday' : '')
    setLockedHoliday(null)
    setAlreadySaved(false)
    // Reset to defaults first so a previous date's marks never carry over
    // onto a newly selected date before that date's own data is known.
    const defaults: Record<string, 'Y' | 'N'> = {}
    students.forEach((s) => (defaults[s.StudentID] = 'Y'))
    setMarks(defaults)

    try {
      let holidayFound = false
      try {
        const holidays = (await api.getHolidays(klass, date, date)) as Holiday[]
        const holiday = holidays.find((h) => h.Date === date)
        if (holiday) {
          holidayFound = true
          setLockedHoliday(holiday.Remark)
          setMarkAsHoliday(true)
          setHolidayRemark(holiday.Remark)
        }
      } catch {
        // offline: fall back to Sunday-only detection
      }
      if (holidayFound) return

      try {
        const existing = (await api.getAttendance(klass, section, date)) as AttendanceRecord[]
        if (existing.length > 0) {
          setAlreadySaved(true)
          const existingMarks: Record<string, 'Y' | 'N'> = {}
          existing.forEach((r) => {
            if (r.Present === 'Y' || r.Present === 'N') existingMarks[r.StudentID] = r.Present
          })
          setMarks(existingMarks)
        }
      } catch {
        // offline: cannot verify, allow entry
      }
    } finally {
      setCheckingDate(false)
    }
  }

  async function loadStudents() {
    setLoadingStudents(true)
    const cached = await db.students.where('Class').equals(klass).toArray()
    setStudents(sortByName(cached.filter((s) => !section || s.Section === section)))
    try {
      const fresh = (await api.getStudents(klass, section)) as CachedStudent[]
      await db.students.bulkPut(fresh)
      setStudents(sortByName(fresh))
      const initial: Record<string, 'Y' | 'N'> = {}
      fresh.forEach((s) => (initial[s.StudentID] = 'Y'))
      setMarks((prev) => ({ ...initial, ...prev }))
    } catch {
      // offline: rely on cache
    } finally {
      setLoadingStudents(false)
    }
  }

  function setMark(studentId: string, present: 'Y' | 'N') {
    if (alreadySaved || lockedHoliday) return
    setMarks((m) => ({ ...m, [studentId]: present }))
  }

  async function save() {
    if (alreadySaved || lockedHoliday) return
    setSaving(true)
    setStatus('')

    if (markAsHoliday) {
      // A holiday record in the Holidays sheet is the single source of
      // truth for "this date is a holiday" (it's what both the Holidays
      // page and saveAttendance's own holiday check rely on), so create
      // that instead of writing 'H' attendance rows. Requires internet.
      try {
        await api.addHoliday(date, klass, holidayRemark || 'Holiday')
        setStatus('Marked as holiday.')
        await checkDateState()
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Failed. Are you online?')
      } finally {
        setSaving(false)
      }
      return
    }

    const records = students.map((s) => ({ studentId: s.StudentID, present: marks[s.StudentID] ?? 'N' }))
    await db.attendanceQueue.add({ class: klass, section, date, records, createdAt: new Date().toISOString() })
    const result = await flushQueue()
    setSaving(false)
    setAlreadySaved(true)
    setStatus(result.synced > 0 ? 'Saved and synced.' : 'Saved locally, will sync when online.')
  }

  const boys = students.filter((s) => s.Gender === 'M')
  const girls = students.filter((s) => s.Gender === 'F')
  const presentCount = Object.values(marks).filter((v) => v === 'Y').length
  const absentCount = students.length - presentCount
  const locked = alreadySaved || !!lockedHoliday
  const pageLoading = loadingStudents || checkingDate

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
          Attendance for
          {pageLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />}
        </span>
        <div className="flex items-center gap-2">
          {date !== todayStr() && (
            <button
              onClick={() => setDate(todayStr())}
              disabled={pageLoading}
              className="text-xs font-semibold text-indigo-600 disabled:opacity-50"
            >
              Today
            </button>
          )}
          <input
            type="date"
            disabled={pageLoading}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 disabled:opacity-50"
            value={date}
            onChange={(e) => setDate(e.target.value || todayStr())}
          />
        </div>
      </div>

      {pageLoading && (
        <div className="rounded-2xl bg-white p-4 text-center text-sm text-gray-400 shadow-sm">
          {loadingStudents ? 'Loading students…' : 'Checking this date…'}
        </div>
      )}

      {!pageLoading && (
        <>
          {lockedHoliday && (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-700 shadow-sm">
              This day is marked as a holiday: {lockedHoliday}. Attendance can't be recorded for it.
            </div>
          )}

          {alreadySaved && !lockedHoliday && (
            <div className="rounded-2xl bg-indigo-50 p-4 text-sm font-medium text-indigo-700 shadow-sm">
              Attendance for this date is already saved and can't be changed here.
            </div>
          )}

          {!lockedHoliday && (
            <label className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${locked ? 'opacity-60' : ''}`}>
              <input
                type="checkbox"
                checked={markAsHoliday}
                disabled={locked}
                onChange={(e) => setMarkAsHoliday(e.target.checked)}
                className="h-5 w-5 rounded accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-700">Mark whole day as holiday</span>
            </label>
          )}

          {markAsHoliday && !lockedHoliday && (
            <input
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400 disabled:opacity-60"
              placeholder="Remark (e.g. Public holiday)"
              value={holidayRemark}
              disabled={locked}
              onChange={(e) => setHolidayRemark(e.target.value)}
            />
          )}

          {!markAsHoliday && (
            <>
              <div className="grid grid-cols-4 gap-2">
                <StatChip label="Strength" value={students.length} color="bg-indigo-50 text-indigo-700" />
                <StatChip label="Present" value={presentCount} color="bg-emerald-50 text-emerald-700" />
                <StatChip label="Absent" value={absentCount} color="bg-rose-50 text-rose-700" />
                <StatChip label="Boys/Girls" value={`${boys.length}/${girls.length}`} color="bg-amber-50 text-amber-700" />
              </div>

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <ul className="divide-y divide-gray-100">
                  {students.map((s) => {
                    const present = marks[s.StudentID] !== 'N'
                    return (
                      <li key={s.StudentID} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {initials(s.Name, s.Surname)}
                        </div>
                        <span className="flex-1 truncate text-sm font-medium text-gray-800">
                          {s.Name} {s.Surname}
                        </span>
                        <div className="flex shrink-0 overflow-hidden rounded-full border border-gray-200">
                          <button
                            onClick={() => setMark(s.StudentID, 'Y')}
                            disabled={locked}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                              present ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setMark(s.StudentID, 'N')}
                            disabled={locked}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                              !present ? 'bg-rose-500 text-white' : 'bg-white text-gray-400'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </li>
                    )
                  })}
                  {students.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No students found.</li>}
                </ul>
              </div>
            </>
          )}

          {!locked && (
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? 'Saving…' : markAsHoliday ? 'Mark as Holiday' : 'Save Attendance'}
            </button>
          )}
          {status && <p className="text-center text-xs font-medium text-gray-500">{status}</p>}
        </>
      )}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl px-2 py-2.5 text-center ${color}`}>
      <div className="text-base font-bold">{value}</div>
      <div className="text-[10px] font-medium opacity-80">{label}</div>
    </div>
  )
}
