import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useClassSelection } from '../auth/ClassContext'

const tabs = [
  { to: '/', label: 'Daily' },
  { to: '/weekly', label: 'Weekly' },
  { to: '/monthly', label: 'Monthly' },
  { to: '/students', label: 'Students' },
  { to: '/holidays', label: 'Holidays' },
]

export default function Nav() {
  const { teacher, signOut } = useAuth()
  const { options, selected, setSelected } = useClassSelection()

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-blue-700">E-Attendance</span>
          {options.length > 1 && (
            <select
              className="rounded border px-2 py-1 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {options.map((o) => (
                <option key={o} value={o}>
                  Class {o}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{teacher?.name}</span>
          <button onClick={signOut} className="text-blue-600 hover:underline">
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-3 py-1 text-sm ${
                isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
