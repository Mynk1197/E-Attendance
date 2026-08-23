import { useEffect, useState } from 'react'
import { useClassSelection } from '../auth/ClassContext'
import { api } from '../api/api'
import { db, type CachedStudent } from '../db/db'

const emptyForm = { Name: '', Surname: '', DOB: '', ScholarNo: '', Category: 'Gen', Gender: 'M', Section: '' }

export default function Students() {
  const { klass, section, needsSection } = useClassSelection()
  const [students, setStudents] = useState<CachedStudent[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

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
  }

  function resetForm() {
    setEditingId(null)
    setForm({ ...emptyForm, Section: needsSection ? section : '' })
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
    <div className="mx-auto max-w-2xl p-4">
      <h2 className="mb-2 font-semibold">Class {klass} roster</h2>
      {error && <p className="mb-2 text-sm text-amber-600">{error}</p>}

      <div className="mb-4 grid grid-cols-2 gap-2 rounded border p-3">
        <input className="rounded border px-2 py-1" placeholder="Name" value={form.Name} onChange={(e) => setForm({ ...form, Name: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="Surname" value={form.Surname} onChange={(e) => setForm({ ...form, Surname: e.target.value })} />
        <input className="rounded border px-2 py-1" type="date" placeholder="DOB" value={form.DOB} onChange={(e) => setForm({ ...form, DOB: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="Scholar No." value={form.ScholarNo} onChange={(e) => setForm({ ...form, ScholarNo: e.target.value })} />
        <select className="rounded border px-2 py-1" value={form.Category} onChange={(e) => setForm({ ...form, Category: e.target.value })}>
          <option>Gen</option>
          <option>OBC</option>
          <option>SC</option>
          <option>ST</option>
        </select>
        <select className="rounded border px-2 py-1" value={form.Gender} onChange={(e) => setForm({ ...form, Gender: e.target.value })}>
          <option value="M">Boy</option>
          <option value="F">Girl</option>
        </select>
        {needsSection && (
          <input className="rounded border px-2 py-1" placeholder="Section (e.g. A)" value={form.Section} onChange={(e) => setForm({ ...form, Section: e.target.value })} />
        )}
        <div className="col-span-2 flex gap-2">
          <button onClick={submit} className="rounded bg-blue-600 px-3 py-1 text-white">
            {editingId ? 'Update student' : 'Add student'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded border px-3 py-1">
              Cancel
            </button>
          )}
        </div>
      </div>

      <ul className="divide-y rounded border">
        {students.map((s) => (
          <li key={s.StudentID} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              {s.Name} {s.Surname}{' '}
              <span className="text-xs text-gray-400">
                ({s.Category}, {s.Gender === 'M' ? 'Boy' : 'Girl'})
              </span>
            </span>
            <span className="flex gap-2">
              <button onClick={() => startEdit(s)} className="text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={() => remove(s.StudentID)} className="text-red-600 hover:underline">
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
