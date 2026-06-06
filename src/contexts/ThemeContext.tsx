/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const getPreferredTheme = (t: Theme): 'light' | 'dark' => {
  if (t === 'light') return 'light'
  if (t === 'dark') return 'dark'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return 'system'
  })

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    return getPreferredTheme(theme)
  })

  useEffect(() => {
    const root = document.documentElement

    const updateTheme = () => {
      const resolved = getPreferredTheme(theme)
      setEffectiveTheme(resolved)
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    updateTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      if (theme === 'system') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleMediaChange)
    return () => mediaQuery.removeEventListener('change', handleMediaChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
