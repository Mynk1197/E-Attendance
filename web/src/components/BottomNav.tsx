import { NavLink } from 'react-router-dom'
import { IconCalendarCheck, IconChartBar, IconCalendarRange, IconUsers, IconSun } from './icons'

const tabs = [
  { to: '/', label: 'Daily', Icon: IconCalendarCheck },
  { to: '/weekly', label: 'Weekly', Icon: IconChartBar },
  { to: '/monthly', label: 'Monthly', Icon: IconCalendarRange },
  { to: '/students', label: 'Students', Icon: IconUsers },
  { to: '/holidays', label: 'Holidays', Icon: IconSun },
]

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 rounded-t-2xl border-t border-gray-200 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className="flex px-1 pt-1">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `mx-0.5 flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
