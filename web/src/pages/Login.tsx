export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-800">E-Attendance</h1>
      <p className="text-gray-500">Sign in with your school Google account</p>
      <div id="google-signin-button" />
    </div>
  )
}
