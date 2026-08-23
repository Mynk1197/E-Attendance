function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Date.toISOString() reports in UTC, which rolls over to the previous
// calendar day for any timezone ahead of UTC (e.g. IST, UTC+5:30) between
// midnight and the offset time. Build the string from local components
// instead so "today" always matches the device's local date.
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
