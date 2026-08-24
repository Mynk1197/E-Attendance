import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { LogoMark } from '../components/icons'

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

export default function Login() {
  const { renderSignInButton, loginError } = useAuth()
  const online = useOnlineStatus()

  return (
    <div className="relative flex h-[100dvh] flex-col items-center overflow-hidden bg-slate-900 px-6 text-center">
      {/* Decorative wallpaper: deep gradient base, a soft glow, faint ledger-line
          texture, and a curved band near the bottom -- all CSS/SVG so it
          renders reliably offline (no external image dependency). */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-indigo-950 to-indigo-900" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 40px)',
          }}
        />
        <svg className="absolute bottom-0 left-0 w-full text-indigo-500/10" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path d="M0,60 C100,110 300,10 400,60 L400,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
        <LogoMark className="h-16 w-16 drop-shadow-lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-white">E-Attendance</h1>
          <p className="mt-1 text-sm text-indigo-200">Daily attendance, made simple.</p>
        </div>
        <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
          {!online && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              You're offline. Connect to the internet to sign in.
            </p>
          )}
          <p className="mb-3 text-sm font-medium text-gray-500">Sign in with your school Google account</p>
          <div className="flex justify-center">
            <div
              ref={(el) => {
                if (el) renderSignInButton(el)
              }}
            />
          </div>
          {loginError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{loginError}</p>}
        </div>
      </div>

      <div className="relative pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
        <p className="leading-tight text-indigo-200" style={{ fontFamily: "'Caveat', cursive" }}>
          <span className="block text-lg">Designed and Developed By</span>
          <span className="block text-2xl font-bold text-white">Mayank Kushwah</span>
        </p>
        <p className="mt-1 text-[11px] text-indigo-300/70">&copy; 2026</p>
      </div>
    </div>
  )
}
