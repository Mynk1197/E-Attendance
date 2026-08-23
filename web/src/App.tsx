import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth/AuthContext'
import { ClassProvider } from './auth/ClassContext'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import DailyEntry from './pages/DailyEntry'
import Report from './pages/Report'
import Students from './pages/Students'
import Holidays from './pages/Holidays'

function Shell() {
  const { teacher, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (!teacher) return <Login />

  return (
    <ClassProvider>
      <BrowserRouter>
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-gray-100">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-4">
            <Routes>
              <Route path="/" element={<DailyEntry />} />
              <Route path="/weekly" element={<Report period="weekly" />} />
              <Route path="/monthly" element={<Report period="monthly" />} />
              <Route path="/students" element={<Students />} />
              <Route path="/holidays" element={<Holidays />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
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
