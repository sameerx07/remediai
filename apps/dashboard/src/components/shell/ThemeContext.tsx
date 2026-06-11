import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'ocean' | 'docker-dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
})

const STORAGE_KEY = 'remediai.theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const persisted = localStorage.getItem(STORAGE_KEY)
    if (persisted === 'light' || persisted === 'ocean' || persisted === 'docker-dark')
      return persisted
    if (persisted === 'dark') return 'ocean'  // migrate legacy value
    return 'docker-dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setThemeState((prev) => {
      if (prev === 'light') return 'ocean'
      if (prev === 'ocean') return 'docker-dark'
      return 'light'
    })
  }

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
