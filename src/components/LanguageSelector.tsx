import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isLanguageOpen, setLanguageOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setLanguageOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    document.documentElement.lang = (i18n.language || 'en').split('-')[0]
  }, [i18n.language])

  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'en'
    return lang.split('-')[0]
  }

  const currentLangCode = getCurrentLanguageCode()
  const currentLanguage = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0]

  const toggleDropdown = () => setLanguageOpen(!isLanguageOpen)

  useEffect(() => {
    if (isLanguageOpen) {
      const idx = LANGUAGES.findIndex(l => l.code === currentLangCode)
      if (idx !== -1 && optionsRef.current[idx]) {
        optionsRef.current[idx]?.focus()
      } else if (optionsRef.current[0]) {
        optionsRef.current[0]?.focus()
      }
    }
  }, [isLanguageOpen, currentLangCode])

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLanguageOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isLanguageOpen) setLanguageOpen(true)
    }
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setLanguageOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      const nextIndex = (currentIndex + 1) % LANGUAGES.length
      optionsRef.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      const nextIndex = (currentIndex - 1 + LANGUAGES.length) % LANGUAGES.length
      optionsRef.current[nextIndex]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      if (currentIndex !== -1) {
        changeLanguage(LANGUAGES[currentIndex].code)
      }
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isLanguageOpen}
        aria-haspopup="true"
      >
        <span className="text-xl leading-none">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {currentLanguage.name}
        </span>
      </button>

      {isLanguageOpen && (
        <>
          <div
            className="fixed inset-0 z-[199]"
            onClick={() => setLanguageOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden"
            onKeyDown={handleDropdownKeyDown}
            role="menu"
          >
            {LANGUAGES.map((language, index) => (
              <button
                key={language.code}
                ref={el => { optionsRef.current[index] = el }}
                onClick={() => changeLanguage(language.code)}
                tabIndex={-1}
                role="menuitem"
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700 ${currentLangCode === language.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                <span className="text-xl leading-none">{language.flag}</span>
                <span className="font-medium whitespace-nowrap">{language.name}</span>
                {currentLangCode === language.code && (
                  <span className="ml-4 text-violet-600 dark:text-violet-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
