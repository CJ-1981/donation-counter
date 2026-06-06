import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
]

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isLanguageOpen, setLanguageOpen] = useState(false)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setLanguageOpen(false)
  }

  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'en'
    return lang.split('-')[0]
  }

  const currentLangCode = getCurrentLanguageCode()
  const currentLanguage = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0]

  const toggleDropdown = () => setLanguageOpen(!isLanguageOpen)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLanguageOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    }
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
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
          <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${currentLangCode === language.code ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'
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
