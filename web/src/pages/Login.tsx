import { useAuth } from '../auth/AuthContext'
import { IconCalendarCheck } from '../components/icons'

export default function Login() {
  const { renderSignInButton } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-linear-to-b from-indigo-600 to-indigo-500 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
        <IconCalendarCheck className="h-8 w-8 text-white" />
      </div>
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
  )
}
