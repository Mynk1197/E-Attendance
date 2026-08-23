import Dexie, { type Table } from 'dexie'

export interface CachedStudent {
  StudentID: string
  Class: string
  Section: string
  Name: string
  Surname: string
  DOB: string
  ScholarNo: string
  Category: string
  Gender: string
  Active: string
}

export interface QueuedAttendance {
  id?: number
  class: string
  section: string
  date: string
  records: { studentId: string; present: 'Y' | 'N' | 'H' }[]
  createdAt: string
}

export interface CachedReport {
  key: string // `${class}|${section}|${period}|${date}`
  data: unknown
  fetchedAt: string
}

class AttendanceDB extends Dexie {
  students!: Table<CachedStudent, string>
  attendanceQueue!: Table<QueuedAttendance, number>
  reportsCache!: Table<CachedReport, string>

  constructor() {
    super('e-attendance')
    this.version(1).stores({
      students: 'StudentID, Class, Section',
      attendanceQueue: '++id, date',
      reportsCache: 'key',
    })
  }
}

export const db = new AttendanceDB()
