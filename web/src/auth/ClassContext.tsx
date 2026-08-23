import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

function parseClassOption(opt: string): { klass: string; section: string } {
  const [klass, section] = opt.split('-')
  return { klass, section: section || '' }
}

interface ClassState {
  options: string[]
  selected: string
  setSelected: (v: string) => void
  klass: string
  section: string
  needsSection: boolean
}

const ClassContext = createContext<ClassState>({
  options: [],
  selected: '',
  setSelected: () => {},
  klass: '',
  section: '',
  needsSection: false,
})

export function useClassSelection() {
  return useContext(ClassContext)
}

export function ClassProvider({ children }: { children: ReactNode }) {
  const { teacher } = useAuth()
  const options = teacher?.classes ?? []
  const [selected, setSelected] = useState(options[0] ?? '')
  const { klass, section } = parseClassOption(selected || options[0] || '')
  const needsSection = klass === '11' || klass === '12'

  return (
    <ClassContext.Provider value={{ options, selected: selected || options[0] || '', setSelected, klass, section, needsSection }}>
      {children}
    </ClassContext.Provider>
  )
}
