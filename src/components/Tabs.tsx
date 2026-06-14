import { useState, useEffect } from 'react'

interface TabsProps {
  activeTab: 'cash-counter' | 'donation-tracker'
  onTabChange: (tab: 'cash-counter' | 'donation-tracker') => void
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
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
        const map: Record<string, string> = { 'EUR': '€', 'USD': '$', 'GBP': '£', 'KRW': '₩', 'JPY': '¥' }
        setCurrencySymbol(map[cur] || cur)

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
      } catch (e) {
        // ignore
      }
    }
    
    pollTotals()
    const interval = setInterval(pollTotals, 1000)
    return () => clearInterval(interval)
  }, [])

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
        <div className="font-bold">Cash Counter</div>
        {cashTotal && cashTotal.total > 0 && (
          <div className="text-[10px] sm:text-xs opacity-90 leading-tight block mt-0.5 font-normal">
            Total: {currencySymbol} {cashTotal.total.toLocaleString()}<br/>
            <span className="opacity-75 tracking-tight">기명: {currencySymbol} {cashTotal.named.toLocaleString()} | 무명: {currencySymbol} {cashTotal.anonymous.toLocaleString()}</span>
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
        <div className="font-bold">Donation Tracker</div>
        {trackerTotal !== null && trackerTotal > 0 && (
          <div className="text-[10px] sm:text-xs opacity-90 leading-tight block mt-0.5 font-normal">
            Total: {currencySymbol} {trackerTotal.toLocaleString()}
          </div>
        )}
      </button>
    </div>
  )
}