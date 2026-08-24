import { useAuth } from '../auth/AuthContext'
import { LogoMark } from '../components/icons'

export default function Login() {
  const { renderSignInButton } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-linear-to-b from-indigo-600 to-indigo-500 px-6 text-center">
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
  )
}
