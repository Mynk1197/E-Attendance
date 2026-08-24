type IconProps = { className?: string }

export function IconCalendarCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 2.5v3M16 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.5 13.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconChartBar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.5 20.5h19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconCalendarRange({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 2.5v3M16 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="7" y="12" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  )
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function IconSun({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LogoMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#logoBg)" />
      {/* clipboard */}
      <rect x="13" y="10" width="22" height="28" rx="3" fill="white" fillOpacity="0.95" />
      <rect x="19" y="7.5" width="10" height="5" rx="2" fill="white" />
      {/* attendee rows */}
      <circle cx="18.5" cy="19" r="1.6" fill="#4f46e5" />
      <rect x="22" y="17.8" width="9" height="2.4" rx="1.2" fill="#c7d2fe" />
      <circle cx="18.5" cy="25" r="1.6" fill="#4f46e5" />
      <rect x="22" y="23.8" width="9" height="2.4" rx="1.2" fill="#c7d2fe" />
      {/* checkmark badge over third row */}
      <circle cx="18.5" cy="31" r="3.4" fill="#22c55e" />
      <path d="M16.9 31l1.1 1.1 2-2.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
