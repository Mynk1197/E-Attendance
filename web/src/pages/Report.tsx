import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db } from '../db/db'
import { todayStr } from '../lib/date'

interface DaySummary {
  date: string
  holiday: boolean
  remark?: string
  boysPresent?: number
  girlsPresent?: number
  totalPresent?: number
  totalAbsent?: number
}

interface Totals {
  totalStrength: number
  boysPresent: number
  girlsPresent: number
  totalPresent: number
  totalAbsent: number
  scPresent: number
  stPresent: number
  obcPresent: number
  genPresent: number
  daysCounted: number
}

interface ReportData {
  days: DaySummary[]
  totals: Totals
}

function formatDateLabel(ds: string) {
  return new Date(ds + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Report({ period }: { period: 'weekly' | 'monthly' }) {
  const { klass, section } = useClassSelection()
  const [date, setDate] = useState(todayStr())
  const [report, setReport] = useState<ReportData | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!klass) return
    load()
  }, [klass, section, date, period])

  async function load() {
    setLoading(true)
    setReport(null)
    const cacheKey = `${klass}|${section}|${period}|${date}`
    const cached = await db.reportsCache.get(cacheKey)
    if (cached) {
      setReport(cached.data as ReportData)
      setLastSynced(cached.fetchedAt)
    }
    try {
      const fresh = (await api.getReport(klass, section, period, date)) as ReportData
      setReport(fresh)
      const fetchedAt = new Date().toISOString()
      setLastSynced(fetchedAt)
      await db.reportsCache.put({ key: cacheKey, data: fresh, fetchedAt })
    } catch {
      // offline: keep cached value
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="text-sm font-medium text-gray-500">{period === 'weekly' ? 'Any day in week' : 'Any day in month'}</span>
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading && !report && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-6 text-sm text-gray-400 shadow-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading report…
        </div>
      )}

      {!loading && !report && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
          No data yet{navigator.onLine ? '' : ' (offline)'}.
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Total strength" value={report.totals.totalStrength} accent="text-indigo-600" />
            <Stat label="Days counted" value={report.totals.daysCounted} accent="text-gray-700" />
            <Stat label="Boys present" value={report.totals.boysPresent} accent="text-sky-600" />
            <Stat label="Girls present" value={report.totals.girlsPresent} accent="text-pink-600" />
            <Stat label="Total present" value={report.totals.totalPresent} accent="text-emerald-600" />
            <Stat label="Total absent" value={report.totals.totalAbsent} accent="text-rose-600" />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Category-wise present</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <CategoryPill label="SC" value={report.totals.scPresent} />
              <CategoryPill label="ST" value={report.totals.stPresent} />
              <CategoryPill label="OBC" value={report.totals.obcPresent} />
              <CategoryPill label="Gen" value={report.totals.genPresent} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <h3 className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Day-by-day
            </h3>
            <ul className="divide-y divide-gray-100">
              {report.days.map((d) => (
                <li key={d.date} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium text-gray-700">{formatDateLabel(d.date)}</span>
                  {d.holiday ? (
                    <span className="text-xs font-medium text-amber-600">{d.remark ?? 'Holiday'}</span>
                  ) : (
                    <span className="flex gap-3 text-xs text-gray-500">
                      <span className="font-semibold text-emerald-600">P {d.totalPresent}</span>
                      <span className="font-semibold text-rose-600">A {d.totalAbsent}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {lastSynced && (
            <p className="text-center text-xs text-gray-400">Last synced: {new Date(lastSynced).toLocaleString()}</p>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
    </div>
  )
}

function CategoryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 py-2">
      <div className="text-base font-bold text-gray-800">{value}</div>
      <div className="text-[10px] font-medium text-gray-400">{label}</div>
    </div>
  )
}
