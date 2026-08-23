import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type Teacher } from '../api/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

interface AuthState {
  teacher: Teacher | null
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthState>({ teacher: null, loading: true, signOut: () => {} })

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
      const el = document.getElementById('google-signin-button')
      if (el) {
        window.google?.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 280 })
      }
      setLoading(false)
    }
    document.body.appendChild(script)
  }, [])

  const signOut = () => {
    localStorage.removeItem('idToken')
    localStorage.removeItem('teacher')
    setTeacher(null)
  }

  return <AuthContext.Provider value={{ teacher, loading, signOut }}>{children}</AuthContext.Provider>
}
