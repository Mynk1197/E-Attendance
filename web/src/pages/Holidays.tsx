import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'

interface Holiday {
  Date: string
  Class: string
  Remark: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
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
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-2 font-semibold">Holidays / remarks</h2>
      {error && <p className="mb-2 text-sm text-amber-600">{error}</p>}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border p-3">
        <input type="date" className="rounded border px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          className="flex-1 rounded border px-2 py-1"
          placeholder="Remark (e.g. Public holiday - Independence Day)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
        <button onClick={submit} className="rounded bg-blue-600 px-3 py-1 text-white">
          Add
        </button>
      </div>
      <ul className="divide-y rounded border">
        {holidays.map((h, i) => (
          <li key={i} className="flex justify-between px-3 py-2 text-sm">
            <span>{h.Date}</span>
            <span className="text-gray-600">{h.Remark}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
