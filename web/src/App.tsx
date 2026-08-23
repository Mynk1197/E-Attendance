import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth/AuthContext'
import { ClassProvider } from './auth/ClassContext'
import Nav from './components/Nav'
import Login from './pages/Login'
import DailyEntry from './pages/DailyEntry'
import Report from './pages/Report'
import Students from './pages/Students'
import Holidays from './pages/Holidays'

function Shell() {
  const { teacher, loading } = useAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>
  if (!teacher) return <Login />

  return (
    <ClassProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<DailyEntry />} />
          <Route path="/weekly" element={<Report period="weekly" />} />
          <Route path="/monthly" element={<Report period="monthly" />} />
          <Route path="/students" element={<Students />} />
          <Route path="/holidays" element={<Holidays />} />
        </Routes>
      </BrowserRouter>
    </ClassProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
