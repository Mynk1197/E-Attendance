import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db } from '../db/db'

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

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Report({ period }: { period: 'weekly' | 'monthly' }) {
  const { klass, section } = useClassSelection()
  const [date, setDate] = useState(todayStr())
  const [report, setReport] = useState<ReportData | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  useEffect(() => {
    if (!klass) return
    load()
  }, [klass, section, date, period])

  async function load() {
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
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">{period === 'weekly' ? 'Any day in week' : 'Any day in month'}</label>
        <input type="date" className="rounded border px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {!report && <p className="text-sm text-gray-500">No data yet{navigator.onLine ? '' : ' (offline)'}.</p>}

      {report && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total strength" value={report.totals.totalStrength} />
            <Stat label="Days counted" value={report.totals.daysCounted} />
            <Stat label="Boys present (sum)" value={report.totals.boysPresent} />
            <Stat label="Girls present (sum)" value={report.totals.girlsPresent} />
            <Stat label="Total present (sum)" value={report.totals.totalPresent} />
            <Stat label="Total absent (sum)" value={report.totals.totalAbsent} />
            <Stat label="SC present" value={report.totals.scPresent} />
            <Stat label="ST present" value={report.totals.stPresent} />
            <Stat label="OBC present" value={report.totals.obcPresent} />
            <Stat label="Gen present" value={report.totals.genPresent} />
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-1">Date</th>
                <th>Boys</th>
                <th>Girls</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {report.days.map((d) => (
                <tr key={d.date} className="border-b">
                  <td className="py-1">{d.date}</td>
                  {d.holiday ? (
                    <td colSpan={4} className="text-gray-500">
                      Holiday{d.remark ? `: ${d.remark}` : ''}
                    </td>
                  ) : (
                    <>
                      <td>{d.boysPresent}</td>
                      <td>{d.girlsPresent}</td>
                      <td>{d.totalPresent}</td>
                      <td>{d.totalAbsent}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {lastSynced && <p className="mt-3 text-xs text-gray-400">Last synced: {new Date(lastSynced).toLocaleString()}</p>}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-2">
      <div className="text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}
