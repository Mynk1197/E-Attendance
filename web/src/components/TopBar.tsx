import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useClassSelection } from '../auth/ClassContext'
import { IconChevronDown } from './icons'

export default function TopBar() {
  const { teacher, signOut } = useAuth()
  const { options, selected, setSelected } = useClassSelection()
  const [menuOpen, setMenuOpen] = useState(false)

  const initial = teacher?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-20 bg-linear-to-b from-slate-900 via-indigo-950 to-indigo-800 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-300">E-Attendance</p>
          <div className="mt-0.5 flex items-center gap-1">
            {options.length > 1 ? (
              <div className="relative">
                <select
                  className="appearance-none rounded-lg border border-white/30 bg-white/15 py-1 pl-2.5 pr-7 text-lg font-bold outline-none"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {options.map((o) => (
                    <option key={o} value={o} className="text-gray-900">
                      Class {o}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
              </div>
            ) : (
              <span className="text-lg font-bold">Class {selected}</span>
            )}
          </div>
          {options.length > 1 && <p className="mt-0.5 text-[10px] text-indigo-100">Tap to switch class</p>}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur-sm"
          >
            {initial}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl bg-white text-gray-800 shadow-lg ring-1 ring-black/5">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold">{teacher?.name}</p>
                  <p className="truncate text-xs text-gray-400">{teacher?.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-1 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
