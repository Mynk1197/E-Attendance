import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db, type CachedStudent } from '../db/db'

const emptyForm = { Name: '', Surname: '', DOB: '', ScholarNo: '', Category: 'Gen', Gender: 'M', Section: '' }

function initials(name: string, surname: string) {
  return `${name[0] ?? ''}${surname[0] ?? ''}`.toUpperCase()
}

const inputClass =
  'rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'

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
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <input className={inputClass} placeholder="Name" value={form.Name} onChange={(e) => setForm({ ...form, Name: e.target.value })} />
          <input className={inputClass} placeholder="Surname" value={form.Surname} onChange={(e) => setForm({ ...form, Surname: e.target.value })} />
          <input className={inputClass} type="date" placeholder="DOB" value={form.DOB} onChange={(e) => setForm({ ...form, DOB: e.target.value })} />
          <input className={inputClass} placeholder="Scholar No." value={form.ScholarNo} onChange={(e) => setForm({ ...form, ScholarNo: e.target.value })} />
          <select className={inputClass} value={form.Category} onChange={(e) => setForm({ ...form, Category: e.target.value })}>
            <option>Gen</option>
            <option>OBC</option>
            <option>SC</option>
            <option>ST</option>
          </select>
          <select className={inputClass} value={form.Gender} onChange={(e) => setForm({ ...form, Gender: e.target.value })}>
            <option value="M">Boy</option>
            <option value="F">Girl</option>
          </select>
          {needsSection && (
            <input
              className={`${inputClass} col-span-2`}
              placeholder="Section (e.g. A)"
              value={form.Section}
              onChange={(e) => setForm({ ...form, Section: e.target.value })}
            />
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
