/**
 * Light/dark theme state. Defaults to the system preference, persists a
 * manual override to localStorage, and exposes the flag so charts can
 * re-resolve their CSS-token colours when the theme flips.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ThemeState {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeState>({ dark: false, toggle: () => {} })

const STORE_KEY = 'csc-theme'

function initialDark(): boolean {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {
    /* private mode */
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(initialDark)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const toggle = () => {
    setDark((d) => {
      try {
        localStorage.setItem(STORE_KEY, d ? 'light' : 'dark')
      } catch {
        /* private mode */
      }
      return !d
    })
  }

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext)
}
