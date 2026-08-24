import { useAuth } from '../auth/AuthContext'
import { LogoMark } from '../components/icons'

export default function Login() {
  const { renderSignInButton } = useAuth()

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-indigo-700 px-6 text-center">
      {/* Decorative wallpaper: layered blurred blobs + a subtle dot grid, all CSS/SVG so it works fully offline */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-700 via-indigo-600 to-violet-700" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
        <LogoMark className="h-20 w-20 drop-shadow-lg" />
        <div>
          <h1 className="text-2xl font-extrabold text-white">E-Attendance</h1>
          <p className="mt-1 text-sm text-indigo-100">Daily attendance, made simple.</p>
        </div>
        <div className="mt-2 w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
          <p className="mb-4 text-sm font-medium text-gray-500">Sign in with your school Google account</p>
          <div className="flex justify-center">
            <div
              ref={(el) => {
                if (el) renderSignInButton(el)
              }}
            />
          </div>
        </div>
      </div>

      <p
        className="relative pb-[max(env(safe-area-inset-bottom),1rem)] pt-4 text-2xl text-indigo-100"
        style={{ fontFamily: "'Caveat', cursive" }}
      >
        Designed &amp; developed by Mayank Kushwah
      </p>
    </div>
  )
}
