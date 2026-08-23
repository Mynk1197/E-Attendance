import { useEffect, useState, type ReactNode } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db, type CachedStudent } from '../db/db'

const emptyForm = { Name: '', Surname: '', DOB: '', ScholarNo: '', Category: '', Gender: '', Section: '' }

const REQUIRED_FIELDS: { key: keyof typeof emptyForm; label: string }[] = [
  { key: 'Name', label: 'Name' },
  { key: 'Surname', label: 'Surname' },
  { key: 'Category', label: 'Category' },
  { key: 'Gender', label: 'Gender' },
]

function initials(name: string, surname: string) {
  return `${name[0] ?? ''}${surname[0] ?? ''}`.toUpperCase()
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
const labelClass = 'mb-1 block text-xs font-medium text-gray-500'

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

export default function Students() {
  const { klass, section, needsSection } = useClassSelection()
  const [students, setStudents] = useState<CachedStudent[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (klass) load()
  }, [klass, section])

  async function load() {
    try {
      const fresh = (await api.getStudents(klass, section)) as CachedStudent[]
      setStudents(fresh)
      await db.students.bulkPut(fresh)
    } catch {
      const cached = await db.students.where('Class').equals(klass).toArray()
      setStudents(cached.filter((s) => !section || s.Section === section))
      setError('Offline: showing cached roster. Add/edit requires internet.')
    }
  }

  function startEdit(s: CachedStudent) {
    setEditingId(s.StudentID)
    setForm({ Name: s.Name, Surname: s.Surname, DOB: s.DOB, ScholarNo: s.ScholarNo, Category: s.Category, Gender: s.Gender, Section: s.Section })
    setShowForm(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, Section: needsSection ? section : '' })
    setShowForm(false)
  }

  async function submit() {
    setError('')
    const missing = REQUIRED_FIELDS.filter((f) => !form[f.key].trim())
    if (needsSection && !form.Section.trim()) missing.push({ key: 'Section', label: 'Section' })
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}.`)
      return
    }
    try {
      if (editingId) {
        await api.updateStudent(editingId, form)
      } else {
        await api.addStudent({ ...form, Class: klass })
      }
      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed. Are you online?')
    }
  }

  async function remove(studentId: string) {
    if (!confirm('Remove this student from the active roster?')) return
    try {
      await api.deleteStudent(studentId)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed. Are you online?')
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">Class {klass} roster</h2>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
        >
          {showForm ? 'Close' : '+ Add student'}
        </button>
      </div>

      {error && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{error}</p>}

      {showForm && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Field label="Name" required>
            <input className={inputClass} value={form.Name} onChange={(e) => setForm({ ...form, Name: e.target.value })} />
          </Field>
          <Field label="Surname" required>
            <input className={inputClass} value={form.Surname} onChange={(e) => setForm({ ...form, Surname: e.target.value })} />
          </Field>
          <Field label="DOB">
            <input className={inputClass} type="date" value={form.DOB} onChange={(e) => setForm({ ...form, DOB: e.target.value })} />
          </Field>
          <Field label="Roll No.">
            <input className={inputClass} value={form.ScholarNo} onChange={(e) => setForm({ ...form, ScholarNo: e.target.value })} />
          </Field>
          <Field label="Category" required>
            <select className={inputClass} value={form.Category} onChange={(e) => setForm({ ...form, Category: e.target.value })}>
              <option value="" disabled>
                Select category
              </option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </Field>
          <Field label="Gender" required>
            <select className={inputClass} value={form.Gender} onChange={(e) => setForm({ ...form, Gender: e.target.value })}>
              <option value="" disabled>
                Select gender
              </option>
              <option value="M">Boy</option>
              <option value="F">Girl</option>
            </select>
          </Field>
          {needsSection && (
            <div className="col-span-2">
              <Field label="Section (e.g. A)" required>
                <input className={inputClass} value={form.Section} onChange={(e) => setForm({ ...form, Section: e.target.value })} />
              </Field>
            </div>
          )}
          <button onClick={submit} className="col-span-2 mt-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white">
            {editingId ? 'Update student' : 'Add student'}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ul className="divide-y divide-gray-100">
          {students.map((s) => (
            <li key={s.StudentID} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials(s.Name, s.Surname)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {s.Name} {s.Surname}
                </p>
                <p className="text-xs text-gray-400">
                  {s.Category} &middot; {s.Gender === 'M' ? 'Boy' : 'Girl'}
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs font-semibold">
                <button onClick={() => startEdit(s)} className="text-indigo-600">
                  Edit
                </button>
                <button onClick={() => remove(s.StudentID)} className="text-rose-500">
                  Remove
                </button>
              </div>
            </li>
          ))}
          {students.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No students yet.</li>}
        </ul>
      </div>
    </div>
  )
}
