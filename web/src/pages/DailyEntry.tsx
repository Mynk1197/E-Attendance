import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db, type CachedStudent } from '../db/db'
import { flushQueue } from '../db/sync'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function isSunday(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDay() === 0
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

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">Date</label>
        <input type="date" className="rounded border px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input type="checkbox" checked={markAsHoliday} onChange={(e) => setMarkAsHoliday(e.target.checked)} />
        <label className="text-sm">Mark whole day as holiday</label>
        {markAsHoliday && (
          <input
            className="ml-2 flex-1 rounded border px-2 py-1 text-sm"
            placeholder="Remark (e.g. Public holiday)"
            value={holidayRemark}
            onChange={(e) => setHolidayRemark(e.target.value)}
          />
        )}
      </div>

      {!markAsHoliday && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Total strength: {students.length}</div>
            <div>Present: {presentCount}</div>
          </div>
          <ul className="divide-y rounded border">
            {students.map((s) => (
              <li key={s.StudentID} className="flex items-center justify-between px-3 py-2">
                <span>
                  {s.Name} {s.Surname}
                </span>
                <button
                  onClick={() => toggle(s.StudentID)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    marks[s.StudentID] === 'N' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {marks[s.StudentID] === 'N' ? 'Absent' : 'Present'}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-gray-500">
            Boys: {boys.length}, Girls: {girls.length}
          </div>
        </>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Attendance'}
      </button>
      {status && <p className="mt-2 text-sm text-gray-600">{status}</p>}
    </div>
  )
}
