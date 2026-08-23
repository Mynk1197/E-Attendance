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

export default function DailyEntry() {
  const { klass, section } = useClassSelection()
  const [date, setDate] = useState(todayStr())
  const [students, setStudents] = useState<CachedStudent[]>([])
  const [marks, setMarks] = useState<Record<string, 'Y' | 'N'>>({})
  const [holidayRemark, setHolidayRemark] = useState('')
  const [markAsHoliday, setMarkAsHoliday] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!klass) return
    loadStudents()
  }, [klass, section])

  useEffect(() => {
    setMarkAsHoliday(isSunday(date))
    setHolidayRemark(isSunday(date) ? 'Sunday' : '')
  }, [date])

  async function loadStudents() {
    const cached = await db.students.where('Class').equals(klass).toArray()
    setStudents(cached.filter((s) => !section || s.Section === section))
    try {
      const fresh = (await api.getStudents(klass, section)) as CachedStudent[]
      await db.students.bulkPut(fresh)
      setStudents(fresh)
      const initial: Record<string, 'Y' | 'N'> = {}
      fresh.forEach((s) => (initial[s.StudentID] = 'Y'))
      setMarks((prev) => ({ ...initial, ...prev }))
    } catch {
      // offline: rely on cache
    }
  }

  function toggle(studentId: string) {
    setMarks((m) => ({ ...m, [studentId]: m[studentId] === 'Y' ? 'N' : 'Y' }))
  }

  async function save() {
    setSaving(true)
    setStatus('')
    const records = markAsHoliday
      ? students.map((s) => ({ studentId: s.StudentID, present: 'H' as const }))
      : students.map((s) => ({ studentId: s.StudentID, present: marks[s.StudentID] ?? 'N' }))

    await db.attendanceQueue.add({ class: klass, section, date, records, createdAt: new Date().toISOString() })
    const result = await flushQueue()
    setSaving(false)
    setStatus(result.synced > 0 ? 'Saved and synced.' : 'Saved locally, will sync when online.')
  }

  const boys = students.filter((s) => s.Gender === 'M')
  const girls = students.filter((s) => s.Gender === 'F')
  const presentCount = Object.values(marks).filter((v) => v === 'Y').length
  const absentCount = students.length - presentCount

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="text-sm font-medium text-gray-500">Attendance for</span>
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          type="checkbox"
          checked={markAsHoliday}
          onChange={(e) => setMarkAsHoliday(e.target.checked)}
          className="h-5 w-5 rounded accent-indigo-600"
        />
        <span className="text-sm font-medium text-gray-700">Mark whole day as holiday</span>
      </label>

      {markAsHoliday && (
        <input
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400"
          placeholder="Remark (e.g. Public holiday)"
          value={holidayRemark}
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
                    <button
                      onClick={() => toggle(s.StudentID)}
                      aria-pressed={present}
                      className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${
                        present ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          present ? 'translate-x-7' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </li>
                )
              })}
              {students.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No students found.</li>}
            </ul>
          </div>
        </>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.99] disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Attendance'}
      </button>
      {status && <p className="text-center text-xs font-medium text-gray-500">{status}</p>}
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
