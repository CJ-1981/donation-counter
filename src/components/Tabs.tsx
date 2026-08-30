import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurrencySymbol } from '../config/currencyDenominations'

interface TabsProps {
  activeTab: 'cash-counter' | 'donation-tracker'
  onTabChange: (tab: 'cash-counter' | 'donation-tracker') => void
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const { t } = useTranslation()
  const [cashTotal, setCashTotal] = useState<{ total: number, named: number, anonymous: number } | null>(null)
  const [trackerTotal, setTrackerTotal] = useState<number | null>(null)
  const [currencySymbol, setCurrencySymbol] = useState('€')

  useEffect(() => {
    const pollTotals = () => {
      try {
        const configStr = localStorage.getItem('cashcounter_config')
        let cur = 'EUR'
        if (configStr) {
          const config = JSON.parse(configStr)
          if (config.currency) cur = config.currency
        }
        setCurrencySymbol(getCurrencySymbol(cur))

        const cashStr = localStorage.getItem('cashcounter_standalone')
        if (cashStr) {
          const data = JSON.parse(cashStr)
          let nSum = 0, aSum = 0
          if (data.anonymous) {
            for (const [denom, count] of Object.entries(data.anonymous)) {
              aSum += parseFloat(denom) * (count as number)
            }
          }
          if (data.namedCounts) {
            for (const [denom, count] of Object.entries(data.namedCounts)) {
              nSum += parseFloat(denom) * (count as number)
            }
          }
          setCashTotal({ total: nSum + aSum, named: nSum, anonymous: aSum })
        } else {
          setCashTotal(null)
        }

        const trackerStr = localStorage.getItem('church_donation_logs')
        if (trackerStr) {
          const logs = JSON.parse(trackerStr)
          if (Array.isArray(logs)) {
            const sum = logs.reduce((acc, log) => acc + (log.amount || 0), 0)
            setTrackerTotal(sum)
          }
        } else {
          setTrackerTotal(null)
        }
      } catch {
        // ignore
      }
    }
    
    pollTotals()
    const interval = setInterval(pollTotals, 1000)
    return () => clearInterval(interval)
  }, [])

  const namedCashTotal = cashTotal ? cashTotal.named : 0
  const currentTrackerTotal = trackerTotal !== null ? trackerTotal : 0
  const isNamedMatched = Math.abs(currentTrackerTotal - namedCashTotal) < 0.01

  return (
    <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 z-50" role="tablist">
      <button
        id="tab-cash-counter"
        role="tab"
        aria-selected={activeTab === 'cash-counter'}
        aria-controls="panel-cash-counter"
        tabIndex={activeTab === 'cash-counter' ? 0 : -1}
        onClick={() => onTabChange('cash-counter')}
        className={`flex-1 py-3 text-center transition-colors ${
          activeTab === 'cash-counter'
            ? 'text-violet-600 dark:text-violet-400 border-b-4 border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-slate-800/50'
            : 'text-slate-500 dark:text-slate-400 border-b-4 border-transparent hover:text-violet-600 dark:hover:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <div className="font-bold">{t('tracker.tabCashCounter')}</div>
        {cashTotal && cashTotal.total > 0 && (
          <div className="text-[10px] sm:text-xs opacity-90 leading-tight block mt-0.5 font-normal">
            {t('cashCounter.totalCounted')}: {currencySymbol} {cashTotal.total.toLocaleString()}<br/>
            <span className="opacity-75 tracking-tight">{t('cashCounter.named')}: {currencySymbol} {cashTotal.named.toLocaleString()} | {t('cashCounter.anonymous')}: {currencySymbol} {cashTotal.anonymous.toLocaleString()}</span>
          </div>
        )}
      </button>
      <button
        id="tab-donation-tracker"
        role="tab"
        aria-selected={activeTab === 'donation-tracker'}
        aria-controls="panel-donation-tracker"
        tabIndex={activeTab === 'donation-tracker' ? 0 : -1}
        onClick={() => onTabChange('donation-tracker')}
        className={`flex-1 py-3 text-center transition-colors ${
          activeTab === 'donation-tracker'
            ? 'text-violet-600 dark:text-violet-400 border-b-4 border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-slate-800/50'
            : 'text-slate-500 dark:text-slate-400 border-b-4 border-transparent hover:text-violet-600 dark:hover:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <div className="font-bold">{t('tracker.tabDonationTracker')}</div>
        {trackerTotal !== null && (trackerTotal > 0 || namedCashTotal > 0) && (
          <div className="text-[10px] sm:text-xs opacity-90 leading-tight block mt-0.5 font-normal">
            {t('cashCounter.totalCounted')}: {currencySymbol} {currentTrackerTotal.toLocaleString()}<br/>
            <span className={isNamedMatched ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
              {isNamedMatched ? t('tracker.namedMatch') : t('tracker.namedMismatch')}
            </span>
          </div>
        )}
      </button>
    </div>
  )
}