import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { IconSun } from '../components/icons'
import { todayStr } from '../lib/date'

interface Holiday {
  Date: string
  Class: string
  Remark: string
  ID: string
  CreatedBy: string
}

function formatDateLabel(ds: string) {
  // Defensive: some rows may still carry a full timestamp instead of a
  // plain yyyy-MM-dd, so only take the date portion before parsing.
  const dateOnly = ds.slice(0, 10)
  const parsed = new Date(dateOnly + 'T00:00:00')
  if (isNaN(parsed.getTime())) return ds
  return parsed.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Holidays() {
  const { teacher } = useAuth()
  const { klass } = useClassSelection()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [date, setDate] = useState(todayStr())
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (klass) load()
  }, [klass])

  async function load() {
    setLoading(true)
    try {
      const list = (await api.getHolidays(klass)) as Holiday[]
      setHolidays(list.sort((a, b) => (a.Date < b.Date ? 1 : -1)))
    } catch {
      setError('Offline: cannot load holiday list.')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    setError('')
    if (holidays.some((h) => h.Date === date)) {
      setError('A holiday is already added for this date. Delete it first to add a different one.')
      return
    }
    setSubmitting(true)
    try {
      await api.addHoliday(date, klass, remark || 'Holiday')
      setRemark('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed. Are you online?')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this holiday?')) return
    setDeletingId(id)
    try {
      await api.deleteHoliday(id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed. Are you online?')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Holidays &amp; remarks</h2>
      {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{error}</p>}

      <fieldset disabled={submitting} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm disabled:opacity-60">
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
        <button
          onClick={submit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? 'Saving…' : 'Add holiday'}
        </button>
      </fieldset>

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-6 text-sm text-gray-400 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading holidays…
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {holidays.map((h) => (
              <li key={h.ID} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <IconSun className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{h.Remark}</p>
                  <p className="text-xs text-gray-400">{formatDateLabel(h.Date)}</p>
                </div>
                {h.CreatedBy?.toLowerCase() === teacher?.email && (
                  <button
                    onClick={() => remove(h.ID)}
                    disabled={deletingId === h.ID}
                    className="shrink-0 text-xs font-semibold text-rose-500 disabled:opacity-50"
                  >
                    {deletingId === h.ID ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </li>
            ))}
            {holidays.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No holidays added yet.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
