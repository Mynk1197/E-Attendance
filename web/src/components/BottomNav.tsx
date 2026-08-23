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
    <nav className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur-sm">
      <div className="flex">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
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
