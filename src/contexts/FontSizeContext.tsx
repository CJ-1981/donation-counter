/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'

// @MX:NOTE Font size types for accessibility scaling
type FontSize = 'normal' | 'large' | 'extraLarge'

interface FontSizeContextType {
  fontSize: FontSize
  setFontSize: (fontSize: FontSize) => void
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

// @MX:ANCHOR Font scale multiplier mapping - central source of truth for font scaling
const FONT_SCALE_MAP: Record<FontSize, number> = {
  normal: 1,
  large: 1.2,
  extraLarge: 1.5,
}

// @MX:ANCHOR FontSizeProvider - manages font size state with localStorage persistence
export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage with validation
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const stored = localStorage.getItem('fontSize') as FontSize | null
    // Validate stored value, default to normal if invalid
    return stored && FONT_SCALE_MAP[stored] ? stored : 'normal'
  })

  // @MX:NOTE Apply font scale to CSS variable when fontSize changes
  useEffect(() => {
    const root = document.documentElement
    const scale = FONT_SCALE_MAP[fontSize]
    root.style.setProperty('--font-scale', scale.toString())
  }, [fontSize])

  const setFontSize = (newFontSize: FontSize) => {
    setFontSizeState(newFontSize)
    localStorage.setItem('fontSize', newFontSize)
  }

  return (
    <FontSizeContext value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext>
  )
}

// @MX:ANCHOR useFontSize hook - access font size context
export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}
