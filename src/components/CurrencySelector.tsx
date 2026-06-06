import { useState, useRef, useEffect } from 'react'
import { getCurrencyInfo, getSupportedCurrencies } from '../config/currencyDenominations'

interface CurrencySelectorProps {
  currency: string
  onCurrencyChange: (currency: string) => void
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  const [isCurrencyOpen, setCurrencyOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])
  
  const currencies = getSupportedCurrencies()

  useEffect(() => {
    if (isCurrencyOpen) {
      const idx = currencies.findIndex(c => c.code === currency)
      if (idx !== -1 && optionsRef.current[idx]) {
        optionsRef.current[idx]?.focus()
      } else if (optionsRef.current[0]) {
        optionsRef.current[0]?.focus()
      }
    }
  }, [isCurrencyOpen, currency, currencies])

  const toggleDropdown = () => setCurrencyOpen(!isCurrencyOpen)

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCurrencyOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isCurrencyOpen) setCurrencyOpen(true)
    }
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setCurrencyOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      const nextIndex = (currentIndex + 1) % currencies.length
      optionsRef.current[nextIndex]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      const nextIndex = (currentIndex - 1 + currencies.length) % currencies.length
      optionsRef.current[nextIndex]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const currentIndex = optionsRef.current.findIndex(ref => ref === document.activeElement)
      if (currentIndex !== -1) {
        onCurrencyChange(currencies[currentIndex].code)
        setCurrencyOpen(false)
        triggerRef.current?.focus()
      }
    }
  }

  const currentCurrency = getCurrencyInfo(currency)

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isCurrencyOpen}
        aria-haspopup="true"
      >
        <span className="text-xl">{currentCurrency.flag}</span>
        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">{currentCurrency.name}</span>
      </button>

      {isCurrencyOpen && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setCurrencyOpen(false)} aria-hidden="true" />
          <div 
            className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden max-h-60 overflow-y-auto"
            onKeyDown={handleDropdownKeyDown}
            role="menu"
          >
            {currencies.map((c, index) => (
              <button
                key={c.code}
                ref={el => { optionsRef.current[index] = el }}
                onClick={() => { onCurrencyChange(c.code); setCurrencyOpen(false); triggerRef.current?.focus() }}
                tabIndex={-1}
                role="menuitem"
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:bg-blue-100 dark:focus:bg-slate-700 ${currency === c.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                  }`}
              >
                <span className="text-xl">{c.flag}</span>
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">{c.code}</span>
                {currency === c.code && <span className="ml-2 text-blue-600 dark:text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
