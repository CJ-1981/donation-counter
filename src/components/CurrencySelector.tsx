import { useState } from 'react'
import { getCurrencyInfo, getSupportedCurrencies } from '../config/currencyDenominations'

interface CurrencySelectorProps {
  currency: string
  onCurrencyChange: (currency: string) => void
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  const [isCurrencyOpen, setCurrencyOpen] = useState(false)

  const toggleDropdown = () => setCurrencyOpen(!isCurrencyOpen)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCurrencyOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    }
  }

  const currentCurrency = getCurrencyInfo(currency)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isCurrencyOpen}
        aria-haspopup="true"
      >
        <span className="text-xl">{currentCurrency.flag}</span>
        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap">{currentCurrency.name}</span>
      </button>

      {isCurrencyOpen && (
        <>
          <div className="fixed inset-0 z-[199]" onClick={() => setCurrencyOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 min-w-max bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden max-h-60 overflow-y-auto">
            {getSupportedCurrencies().map((c) => (
              <button
                key={c.code}
                onClick={() => { onCurrencyChange(c.code); setCurrencyOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${currency === c.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
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
