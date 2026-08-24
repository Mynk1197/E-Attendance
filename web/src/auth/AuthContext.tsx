import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, type Teacher } from '../api/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

interface AuthState {
  teacher: Teacher | null
  loading: boolean
  signOut: () => void
  renderSignInButton: (el: HTMLElement) => void
}

const AuthContext = createContext<AuthState>({
  teacher: null,
  loading: true,
  signOut: () => {},
  renderSignInButton: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)

  useEffect(() => {
    const cachedTeacher = localStorage.getItem('teacher')
    const idToken = localStorage.getItem('idToken')
    if (cachedTeacher && idToken) {
      setTeacher(JSON.parse(cachedTeacher))
      setLoading(false)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const result = await api.login(response.credential)
            localStorage.setItem('teacher', JSON.stringify(result))
            setTeacher(result)
          } catch (err) {
            console.error(err)
            localStorage.removeItem('idToken')
            alert('Sign-in failed: not an authorized teacher account.')
          } finally {
            setLoading(false)
          }
        },
      })
      initializedRef.current = true
      setLoading(false)
    }
    document.body.appendChild(script)
  }, [])

  const signOut = () => {
    localStorage.removeItem('idToken')
    localStorage.removeItem('teacher')
    // Google's Identity Services button ties its internal state to the
    // credential already used in this page load, so re-rendering it into
    // a fresh div after sign-out often stays blank. A full reload gives
    // it a clean slate, same as a first visit.
    window.location.reload()
  }

  const renderSignInButton = (el: HTMLElement) => {
    if (initializedRef.current && window.google) {
      window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 280 })
    }
  }

  return (
    <AuthContext.Provider value={{ teacher, loading, signOut, renderSignInButton }}>{children}</AuthContext.Provider>
  )
}
