import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth, AuthProvider } from './auth/AuthContext'
import { ClassProvider, useClassSelection } from './auth/ClassContext'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import DailyEntry from './pages/DailyEntry'
import Report from './pages/Report'
import Students from './pages/Students'
import Holidays from './pages/Holidays'

function AppRoutes() {
  // Remounting each page fresh when the selected class/section changes
  // guarantees its state (and loading flags) reset to initial values
  // immediately, instead of briefly showing the previous class's data
  // while the new fetch is still in flight.
  const { selected } = useClassSelection()

  return (
    <Routes>
      <Route path="/" element={<DailyEntry key={selected} />} />
      <Route path="/weekly" element={<Report key={selected} period="weekly" />} />
      <Route path="/monthly" element={<Report key={selected} period="monthly" />} />
      <Route path="/students" element={<Students key={selected} />} />
      <Route path="/holidays" element={<Holidays key={selected} />} />
    </Routes>
  )
}

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
            <AppRoutes />
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
