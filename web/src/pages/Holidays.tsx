import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { IconSun } from '../components/icons'

interface Holiday {
  Date: string
  Class: string
  Remark: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(ds: string) {
  return new Date(ds + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Holidays() {
  const { klass } = useClassSelection()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [date, setDate] = useState(todayStr())
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (klass) load()
  }, [klass])

  async function load() {
    try {
      const list = (await api.getHolidays(klass)) as Holiday[]
      setHolidays(list.sort((a, b) => (a.Date < b.Date ? 1 : -1)))
    } catch {
      setError('Offline: cannot load holiday list.')
    }
  }

  async function submit() {
    setError('')
    try {
      await api.addHoliday(date, klass, remark || 'Holiday')
      setRemark('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed. Are you online?')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Holidays &amp; remarks</h2>
      {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{error}</p>}

      <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          type="date"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          placeholder="Remark (e.g. Independence Day)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
        <button onClick={submit} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white">
          Add holiday
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-gray-100">
          {holidays.map((h, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <IconSun className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{h.Remark}</p>
                <p className="text-xs text-gray-400">{formatDateLabel(h.Date)}</p>
              </div>
            </li>
          ))}
          {holidays.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No holidays added yet.</li>}
        </ul>
      </div>
    </div>
  )
}
