/**
 * @MX:NOTE: Standalone Cash Counter Page (public route, no auth required)
 *
 * Features:
 * - Accessible without authentication at /cashcounter route
 * - Language selector included
 * - Cash counter as main content (not modal)
 * - LocalStorage persistence
 * - Configurable currency
 */
// @MX:TODO: No test file exists - CashCounterPage.test.tsx or CashCounterPage.spec.tsx needed
// @MX:PRIORITY: High - Public route component requires test coverage

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'


// ==================== TYPES & INTERFACES ====================

interface StoredCashData {
  version: number
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
  lastDate: string
  currency: string
}

interface CashCounterState {
  anonymous: Record<number, number>
  namedCounts: Record<number, number>
}

interface Config {
  currency: string
  targetAmount: number
}

interface CurrencyChangeState {
  showCurrencyConfirm: boolean
  pendingCurrency: string | null
}

// ==================== IMPORTS ====================

import {
  getDenominations,
} from '../config/currencyDenominations'
import {
  createEmptyDenominationState,
  calculateDenominationTotal,
  calculateDenominationBreakdown,
  filterDenominationsByType,
  getDenominationsWithData,
  formatCurrencyAmount,
} from '../utils/denominationUtils'



import { LanguageSelector } from '../components/LanguageSelector'
import { CurrencySelector } from '../components/CurrencySelector'
import { DenominationRow } from '../components/DenominationRow'
import { SettingsPanel } from '../components/SettingsPanel'

// ==================== UTILITY FUNCTIONS ====================

const getLocalDateString = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createEmptyState = (currency: string): CashCounterState => ({
  anonymous: createEmptyDenominationState(currency),
  namedCounts: createEmptyDenominationState(currency),
})


// ==================== MAIN PAGE COMPONENT ====================

export default function CashCounterPage() {
  const { t, i18n } = useTranslation()

  // State with lazy initialization from localStorage
  const [config, setConfig] = useState<Config>(() => {
    const storedConfig = localStorage.getItem('cashcounter_config')
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig)
        if (parsed && typeof parsed.currency === 'string') {
          return parsed
        }
      } catch (err) {
        console.error('Error loading config:', err)
      }
    }
    return { currency: 'EUR', targetAmount: 0 }
  })

  const [state, setState] = useState<CashCounterState>(() => {
    const storageKey = 'cashcounter_standalone'
    let initialCurrency = config.currency

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data: StoredCashData = JSON.parse(stored)
        const today = getLocalDateString()

        // Remove stale data from previous day
        if (data.lastDate !== today) {
          localStorage.removeItem(storageKey)
          return createEmptyState(initialCurrency)
        }

        // Handle version migration
        if (data.version === 3) {
          if (typeof data.anonymous === 'object' && data.anonymous !== null &&
            typeof data.namedCounts === 'object' && data.namedCounts !== null) {
            return {
              anonymous: data.anonymous,
              namedCounts: data.namedCounts,
            }
          }
          // Invalid V3 payload
          console.error('Invalid V3 payload structure, resetting to empty state')
          return createEmptyState(data.currency || initialCurrency)
        } else if (data.version === 2) {
          // Migrate V2 to V3
          console.log('Migrating V2 to V3 format')
          const v3Data: StoredCashData = {
            version: 3,
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
            lastDate: data.lastDate,
            currency: 'EUR',
          }
          localStorage.setItem(storageKey, JSON.stringify(v3Data))
          return {
            anonymous: data.anonymous,
            namedCounts: data.namedCounts,
          }
        }
      }
    } catch (err) {
      console.error('Error loading cash counter data:', err)
    }

    return createEmptyState(initialCurrency)
  })

  const [currencyChange, setCurrencyChange] = useState<CurrencyChangeState>({
    showCurrencyConfirm: false,
    pendingCurrency: null
  })
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const settingsPanelRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Close settings when clicking outside
  useEffect(() => {
    if (!showConfig) return
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as Node)) {
        setShowConfig(false)
      }
    }
    // Use mousedown for immediate response (before focus changes)
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showConfig])

  const handleGearClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfig(prev => !prev)
  }, [])

  // Refs for localStorage save optimization
  const isInitialRender = useRef(true)
  const previousStateRef = useRef<CashCounterState>(state)
  const configRef = useRef<Config>(config)

  // Keep configRef in sync with config for use in cleanup closures
  useEffect(() => {
    configRef.current = config
  }, [config])

  // @MX:ANCHOR: Config state management with localStorage persistence
  // @MX:REASON: Called from 8+ locations - critical config management across component lifecycle
  const saveConfig = useCallback((newConfig: Config | ((prev: Config) => Config)) => {
    setConfig(prevConfig => {
      const updatedConfig = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig
      localStorage.setItem('cashcounter_config', JSON.stringify(updatedConfig))
      window.dispatchEvent(new Event('cashcounter_config_changed'))
      return updatedConfig
    })
  }, [])

  // Handle currency change - reset denomination state when currency changes
  useEffect(() => {
    const currentConfigCurrency = config.currency
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(prev => {
      // Only reset if currency actually changed
      const denominations = getDenominations(currentConfigCurrency)
      const currentDenominationValues = Object.keys(prev.anonymous).map(Number)

      // Check if denomination SETS match - catches all currency changes including subset changes
      const newDenominationValues = denominations.map(d => d.value)
      const needsReset = JSON.stringify([...newDenominationValues].sort()) !== JSON.stringify([...currentDenominationValues].sort())

      if (needsReset) {
        return createEmptyState(currentConfigCurrency)
      }
      return prev
    })
  }, [config.currency])

  // Save state changes to localStorage (debounced)
  const saveToLocalStorage = useCallback((currentState: CashCounterState, currentCurrency: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // @MX:NOTE: 500ms debounce timeout prevents excessive localStorage writes
    saveTimeoutRef.current = setTimeout(() => {
      const storageKey = 'cashcounter_standalone'
      try {
        const data: StoredCashData = {
          version: 3,
          anonymous: currentState.anonymous,
          namedCounts: currentState.namedCounts,
          lastDate: getLocalDateString(),
          currency: currentCurrency,
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch (err) {
        console.error('Error saving cash counter data:', err)
      }
    }, 500)
  }, [])

  // Only save when state actually changes (prevent excessive saves)
  useEffect(() => {
    // Skip initial render to prevent unnecessary save on mount
    if (isInitialRender.current) {
      isInitialRender.current = false
      previousStateRef.current = state
      return
    }

    // Check if state actually changed
    const hasStateChanged = JSON.stringify(state) !== JSON.stringify(previousStateRef.current)
    if (hasStateChanged) {
      saveToLocalStorage(state, config.currency)
      previousStateRef.current = state
    }
  }, [state, config.currency, saveToLocalStorage])

  // Cleanup on unmount - ensure pending saves are completed
  useEffect(() => {
    return () => {
      // @MX:NOTE: Flush pending save on component unmount to prevent data loss
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        // Save the most recent state immediately
        const storageKey = 'cashcounter_standalone'
        try {
          const data: StoredCashData = {
            version: 3,
            anonymous: previousStateRef.current.anonymous,
            namedCounts: previousStateRef.current.namedCounts,
            lastDate: getLocalDateString(),
            currency: configRef.current.currency,
          }
          localStorage.setItem(storageKey, JSON.stringify(data))
        } catch (err) {
          console.error('Error flushing cash counter data on unmount:', err)
        }
        saveTimeoutRef.current = undefined
      }
    }
  }, [config.currency])

  // Handlers
  const handleAnonymousCountChange = useCallback((denomination: number, delta: number) => {
    setState(prev => ({
      ...prev,
      anonymous: {
        ...prev.anonymous,
        [denomination]: Math.max(0, (prev.anonymous[denomination] || 0) + delta),
      },
    }))
  }, [])

  const handleAnonymousDirectInput = useCallback((denomination: number, value: number) => {
    setState(prev => ({
      ...prev,
      anonymous: {
        ...prev.anonymous,
        [denomination]: Math.max(0, value),
      },
    }))
  }, [])

  const handleNamedCountChange = useCallback((denomination: number, delta: number) => {
    setState(prev => ({
      ...prev,
      namedCounts: {
        ...prev.namedCounts,
        [denomination]: Math.max(0, (prev.namedCounts[denomination] || 0) + delta),
      },
    }))
  }, [])

  const handleNamedDirectInput = useCallback((denomination: number, value: number) => {
    setState(prev => ({
      ...prev,
      namedCounts: {
        ...prev.namedCounts,
        [denomination]: Math.max(0, value),
      },
    }))
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirm(t('cashCounter.confirmClearAll'))) {
      setState(createEmptyState(config.currency))
      localStorage.removeItem('cashcounter_standalone')
      saveConfig({ ...config, targetAmount: 0 })
    }
  }, [t, config, saveConfig])

  const isStateEmpty = useCallback((stateToCheck: CashCounterState): boolean => {
    const totalAnonymous = Object.values(stateToCheck.anonymous).reduce((sum, count) => sum + count, 0)
    const totalNamed = Object.values(stateToCheck.namedCounts).reduce((sum, count) => sum + count, 0)
    return totalAnonymous === 0 && totalNamed === 0
  }, [])

  // @MX:ANCHOR: Public API for currency changes with confirmation dialog
  // @MX:REASON: Called from CurrencySelector - user-facing critical functionality
  const handleCurrencyChangeRequest = useCallback((newCurrency: string) => {
    if (isStateEmpty(state)) {
      // State is empty, proceed with currency change
      saveConfig({ ...config, currency: newCurrency })
    } else {
      // State has data, show confirmation dialog
      setCurrencyChange({
        showCurrencyConfirm: true,
        pendingCurrency: newCurrency
      })
    }
  }, [state, config, saveConfig, isStateEmpty])

  const handleCurrencyChangeConfirm = useCallback(() => {
    if (currencyChange.pendingCurrency) {
      saveConfig({ ...config, currency: currencyChange.pendingCurrency })
      setCurrencyChange({
        showCurrencyConfirm: false,
        pendingCurrency: null
      })
    }
  }, [config, currencyChange.pendingCurrency, saveConfig])

  const handleCurrencyChangeCancel = useCallback(() => {
    setCurrencyChange({
      showCurrencyConfirm: false,
      pendingCurrency: null
    })
  }, [])

  // @MX:ANCHOR: Public API for exporting cash counter data as markdown
  // @MX:REASON: User-facing functionality for sharing counts via clipboard
  const handleShare = useCallback(() => {
    const currency = config.currency
    const today = getLocalDateString()

    const lines: string[] = []
    lines.push(`## 🧮 ${t('cashCounter.title')} — ${today}`)
    lines.push('')

    const namedTotalLocal = calculateDenominationTotal(state.namedCounts, config.currency)
    const namedBreakdownLocal = calculateDenominationBreakdown(state.namedCounts, config.currency)
    const namedHasData = namedTotalLocal > 0

    const anonymousTotalLocal = calculateDenominationTotal(state.anonymous, config.currency)
    const anonymousBreakdownLocal = calculateDenominationBreakdown(state.anonymous, config.currency)
    const anonymousHasData = anonymousTotalLocal > 0

    if (namedHasData || anonymousHasData) {
      const denominations = getDenominations(config.currency)
      const billsWithData = getDenominationsWithData(
        filterDenominationsByType(denominations, 'bill'),
        state.anonymous,
        state.namedCounts
      )
      if (billsWithData.length > 0) {
        lines.push(`### 💵 ${t('cashCounter.bills')}`)
        lines.push(`| ${t('cashCounter.denomination')} | ${t('cashCounter.named')} | ${t('cashCounter.anonymous')} |`)
        lines.push('|---|---|---|')
        for (const d of billsWithData) {
          const nc = state.namedCounts[d.value] || 0
          const ac = state.anonymous[d.value] || 0
          lines.push(`| ${d.label} | ${nc > 0 ? nc : '—'} | ${ac > 0 ? ac : '—'} |`)
        }
        lines.push('')
      }

      const coinsWithData = getDenominationsWithData(
        filterDenominationsByType(denominations, 'coin'),
        state.anonymous,
        state.namedCounts
      )
      if (coinsWithData.length > 0) {
        lines.push(`### ⚪ ${t('cashCounter.coins')}`)
        lines.push(`| ${t('cashCounter.denomination')} | ${t('cashCounter.named')} | ${t('cashCounter.anonymous')} |`)
        lines.push('|---|---|---|')
        for (const d of coinsWithData) {
          const nc = state.namedCounts[d.value] || 0
          const ac = state.anonymous[d.value] || 0
          lines.push(`| ${d.label} | ${nc > 0 ? nc : '—'} | ${ac > 0 ? ac : '—'} |`)
        }
        lines.push('')
      }
    }

    lines.push('---')
    lines.push(`### ${t('cashCounter.excelExport')}`)
    
    // Generate TSV for all denominations
    const allDenominations = getDenominations(config.currency)
    const tsvHeader = [t('cashCounter.denomination'), ...allDenominations.map(d => d.label)].join('\t')
    const tsvCounts = [t('cashCounter.counts'), ...allDenominations.map(d => {
      const nc = state.namedCounts[d.value] || 0
      const ac = state.anonymous[d.value] || 0
      return nc + ac
    })].join('\t')

    lines.push(tsvHeader)
    lines.push(tsvCounts)
    lines.push('')

    const { language } = i18n

    lines.push('---')
    lines.push(`**${t('cashCounter.namedTotal')}:** ${formatCurrencyAmount(namedTotalLocal, currency, language)} (${t('cashCounter.bills')}: ${formatCurrencyAmount(namedBreakdownLocal.bills, currency, language)}, ${t('cashCounter.coins')}: ${formatCurrencyAmount(namedBreakdownLocal.coins, currency, language)})`)
    lines.push('')
    lines.push(`**${t('cashCounter.anonymousTotal')}:** ${formatCurrencyAmount(anonymousTotalLocal, currency, language)} (${t('cashCounter.bills')}: ${formatCurrencyAmount(anonymousBreakdownLocal.bills, currency, language)}, ${t('cashCounter.coins')}: ${formatCurrencyAmount(anonymousBreakdownLocal.coins, currency, language)})`)
    lines.push('')

    const grandTotalLocal = namedTotalLocal + anonymousTotalLocal
    const grandBreakdownLocal = {
      bills: namedBreakdownLocal.bills + anonymousBreakdownLocal.bills,
      coins: namedBreakdownLocal.coins + anonymousBreakdownLocal.coins,
    }

    lines.push(`**${t('cashCounter.grandTotal')}:** ${formatCurrencyAmount(grandTotalLocal, currency, language)} (${t('cashCounter.bills')}: ${formatCurrencyAmount(grandBreakdownLocal.bills, currency, language)}, ${t('cashCounter.coins')}: ${formatCurrencyAmount(grandBreakdownLocal.coins, currency, language)})`)
    lines.push('')

    if (config.targetAmount > 0) {
      lines.push(`**${t('cashCounter.transactionsTotal')}:** ${formatCurrencyAmount(config.targetAmount, currency, language)}`)
      lines.push('')

      const diff = grandTotalLocal - config.targetAmount
      const absDiff = Math.abs(diff)
      // @MX:NOTE: 0.01 tolerance accounts for floating point precision in currency calculations
      const tolerance = 0.01
      if (absDiff <= tolerance) {
        lines.push(`✅ **${t('cashCounter.match')}** — ${formatCurrencyAmount(absDiff, currency, language)}`)
      } else if (diff > 0) {
        lines.push(`⬆️ **${t('cashCounter.excess')}** — ${formatCurrencyAmount(absDiff, currency, language)}`)
      } else {
        lines.push(`⬇️ **${t('cashCounter.shortage')}** — ${formatCurrencyAmount(absDiff, currency, language)}`)
      }
    }

    const markdown = lines.join('\n')

    const copyWithFallback = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(markdown).then(() => {
          setCopyError(false)
          setCopySuccess(true)
          // @MX:NOTE: 2000ms success feedback timeout for user visibility
          setTimeout(() => setCopySuccess(false), 2000)
        }).catch(err => {
          console.error('Copy failed:', err)
          setCopySuccess(false)
          setCopyError(true)
          setTimeout(() => setCopyError(false), 3000)
        })
      } else {
        try {
          const textArea = document.createElement('textarea')
          textArea.value = markdown
          textArea.style.position = 'fixed'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          if (successful) {
            setCopyError(false)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
          } else {
            throw new Error('execCommand copy failed')
          }
        } catch (err) {
          console.error('Fallback copy failed:', err)
          setCopySuccess(false)
          setCopyError(true)
          setTimeout(() => setCopyError(false), 3000)
        }
      }
    }
    copyWithFallback()
  }, [state, config, t, i18n.language])

  // Calculations
  const { anonymousTotal, namedTotal, grandTotal, grandBreakdown } = useMemo(() => {
    const aTotal = calculateDenominationTotal(state.anonymous, config.currency)
    const aBreakdown = calculateDenominationBreakdown(state.anonymous, config.currency)
    const nTotal = calculateDenominationTotal(state.namedCounts, config.currency)
    const nBreakdown = calculateDenominationBreakdown(state.namedCounts, config.currency)
    const gTotal = aTotal + nTotal
    const gBreakdown = {
      bills: aBreakdown.bills + nBreakdown.bills,
      coins: aBreakdown.coins + nBreakdown.coins,
    }
    return {
      anonymousTotal: aTotal,
      namedTotal: nTotal,
      grandTotal: gTotal,
      grandBreakdown: gBreakdown,
    }
  }, [state.anonymous, state.namedCounts, config.currency])

  const getMatchStatus = (): 'match' | 'excess' | 'shortage' | 'none' => {
    if (config.targetAmount === 0) return 'none'
    const difference = Math.abs(grandTotal - config.targetAmount)
    // @MX:NOTE: 0.01 tolerance accounts for floating point precision in currency calculations
    const tolerance = 0.01
    if (difference <= tolerance) return 'match'
    if (grandTotal > config.targetAmount) return 'excess'
    return 'shortage'
  }

  const denominations = getDenominations(config.currency)
  const bills = filterDenominationsByType(denominations, 'bill')
  const coins = filterDenominationsByType(denominations, 'coin')
  const currency = config.currency
  const matchStatus = getMatchStatus()

  // Build ordered list: column-first — all Named (blue) top-to-bottom, then all Anonymous (teal) top-to-bottom
  const allFieldIds = useMemo(() => {
    const allDenoms = [...bills, ...coins]
    const named = allDenoms.map(d => `denomination-${d.value}-blue`)
    const anonymous = allDenoms.map(d => `denomination-${d.value}-teal`)
    return [...named, ...anonymous]
  }, [bills, coins])
  const totalDenomCount = bills.length + coins.length

  const onFocusField = useCallback((fieldId: string) => {
    document.getElementById(fieldId)?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header ref={settingsPanelRef} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 no-scale">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-2xl">🧮</span>
              <span className="hidden sm:inline">{t('cashCounter.title')}</span>
            </h1>
            <CurrencySelector
              currency={currency}
              onCurrencyChange={handleCurrencyChangeRequest}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGearClick}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={t('common.settings')}
            >
              <span className="text-2xl">⚙️</span>
            </button>
            <LanguageSelector />
          </div>
        </div>

        {/* Settings Panel */}
        {showConfig && (
          <SettingsPanel 
            currency={currency} 
            targetAmount={config.targetAmount} 
            onTargetAmountChange={(amount) => saveConfig(prev => ({ ...prev, targetAmount: amount }))} 
          />
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 scalable-content">
        <form onSubmit={e => e.preventDefault()}>
        {/* Column Headers */}
        <div className="mb-4">
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50">
              <div className="text-[10px] font-medium text-blue-700 dark:text-blue-400 text-center">
                {t('cashCounter.named')}
              </div>
            </div>
            <div className="px-2 py-1 bg-teal-50 dark:bg-teal-900/20 rounded-md border border-teal-200 dark:border-teal-800/50">
              <div className="text-[10px] font-medium text-teal-700 dark:text-teal-400 text-center">
                {t('cashCounter.anonymous')}
              </div>
            </div>
          </div>
        </div>

        {/* Bills Section */}
        <div className="mb-6">
          {bills.map((denom, idx) => (
            <DenominationRow 
              key={denom.value} 
              denomination={denom} 
              currency={config.currency}
              namedCount={state.namedCounts[denom.value] || 0}
              anonymousCount={state.anonymous[denom.value] || 0}
              onNamedChange={(delta) => handleNamedCountChange(denom.value, delta)}
              onNamedInput={(value) => handleNamedDirectInput(denom.value, value)}
              onAnonymousChange={(delta) => handleAnonymousCountChange(denom.value, delta)}
              onAnonymousInput={(value) => handleAnonymousDirectInput(denom.value, value)}
              namedTabIndex={idx + 1}
              anonymousTabIndex={totalDenomCount + idx + 1}
              allFieldIds={allFieldIds}
              onFocusField={onFocusField}
            />
          ))}
        </div>

        {/* Coins Section */}
        <div className="mb-6">
          {coins.map((denom, idx) => (
            <DenominationRow 
              key={denom.value} 
              denomination={denom} 
              currency={config.currency}
              namedCount={state.namedCounts[denom.value] || 0}
              anonymousCount={state.anonymous[denom.value] || 0}
              onNamedChange={(delta) => handleNamedCountChange(denom.value, delta)}
              onNamedInput={(value) => handleNamedDirectInput(denom.value, value)}
              onAnonymousChange={(delta) => handleAnonymousCountChange(denom.value, delta)}
              onAnonymousInput={(value) => handleAnonymousDirectInput(denom.value, value)}
              namedTabIndex={bills.length + idx + 1}
              anonymousTabIndex={totalDenomCount + bills.length + idx + 1}
              allFieldIds={allFieldIds}
              onFocusField={onFocusField}
            />
          ))}
        </div>
        </form>

        {/* Section Totals */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50 text-center">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
              {t('cashCounter.namedTotal')}
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100 text-center">
              {formatCurrencyAmount(namedTotal, currency)}
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800/50 text-center">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400 mb-1">
              {t('cashCounter.anonymousTotal')}
            </div>
            <div className="text-xl font-bold text-teal-900 dark:text-teal-100 text-center">
              {formatCurrencyAmount(anonymousTotal, currency)}
            </div>
          </div>
        </div>

        {/* Grand Total & Match Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 reduced-scale">
          {/* Grand Total Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50 text-center">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                💵 {t('cashCounter.bills')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {formatCurrencyAmount(grandBreakdown.bills, currency)}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-slate-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 text-center">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ⚪ {t('cashCounter.coins')}
              </div>
              <div className="text-lg font-bold dark:text-white">
                {formatCurrencyAmount(grandBreakdown.coins, currency)}
              </div>
            </div>
          </div>

          <div className="text-right mb-6">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {t('cashCounter.grandTotal')}:
            </div>
            <div
              className={`text-4xl font-black dark:text-white ${matchStatus === 'match'
                  ? 'text-green-600 dark:text-green-400'
                  : matchStatus === 'excess'
                    ? 'text-blue-600 dark:text-blue-400'
                    : matchStatus === 'shortage'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-slate-100'
                }`}
            >
              {formatCurrencyAmount(grandTotal, currency)}
            </div>
          </div>

          {/* Target Amount */}
          {config.targetAmount > 0 && (
            <div
              className={`text-right p-4 rounded-lg ${matchStatus === 'match'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                  : matchStatus === 'excess'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                }`}
            >
              <div className="text-lg font-bold mb-2">
                Target: {formatCurrencyAmount(config.targetAmount, currency)}
              </div>
              <div className="border-t border-black/20 dark:border-white/20 my-2"></div>
              <div className="font-semibold mb-1">
                {matchStatus === 'match'
                  ? '✓ ' + t('cashCounter.match')
                  : matchStatus === 'excess'
                    ? '↑ ' + t('cashCounter.excess')
                    : '↓ ' + t('cashCounter.shortage')}
              </div>
              <div className="font-bold text-xl">
                {formatCurrencyAmount(Math.abs(grandTotal - config.targetAmount), currency)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 reduced-scale">
            <button
              type="button"
              onClick={handleClearAll}
              className="min-w-[100px] px-6 py-2 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-nowrap"
            >
              {t('cashCounter.clearAll')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={`min-w-[100px] px-6 py-2 rounded-lg flex items-center justify-center transition-colors font-medium text-nowrap ${copyError 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : copySuccess
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/30'
                }`}
            >
              {copyError ? (
                <span>{t('cashCounter.copyError') || 'Failed to copy'}</span>
              ) : copySuccess ? (
                <span>{t('cashCounter.copied')}</span>
              ) : (
                <span>{t('cashCounter.share')}</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Currency Change Confirmation Modal */}
      {currencyChange.showCurrencyConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[298]"
            onClick={handleCurrencyChangeCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[299] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>{t('cashCounter.confirmCurrencyChange')}</span>
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                {t('cashCounter.currencyChangeWarning')}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCurrencyChangeCancel}
                  className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCurrencyChangeConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white transition-colors font-medium"
                >
                  {t('cashCounter.changeCurrencyAndReset')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
