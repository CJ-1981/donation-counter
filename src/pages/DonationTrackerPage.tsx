import { useState, useEffect, useRef, useMemo } from 'react'
import CryptoJS from 'crypto-js'
import { useTranslation } from 'react-i18next'
import { CURRENCY_DENOMINATIONS } from '../config/currencyDenominations'

interface LogEntry {
  id: string
  name: string
  amount: number
  type: string
}

const DEFAULT_TYPES_KEYS = ['tracker.sunday', 'tracker.tithe', 'tracker.thanksgiving', 'tracker.missions', 'tracker.special', 'tracker.sundaySchool']

// KOREAN CHOSUNG (INITIAL CONSONANT) EXTRACTION
function getChosung(str: string) {
  const CHOSUNG_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032
    if (code > -1 && code < 11172) {
      result += CHOSUNG_LIST[Math.floor(code / 588)]
    } else {
      result += str.charAt(i)
    }
  }
  return result
}

export default function DonationTrackerPage() {
  const { t, i18n } = useTranslation()

  const formatAmount = (val: number) => val.toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Setup state
  const [members, setMembers] = useState<string[]>([])
  
  const donationTypes = useMemo(() => {
    try {
      const stored = localStorage.getItem('church_donation_types')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return DEFAULT_TYPES_KEYS
  }, [])
  
  const getDisplayType = (typeKey: string) => {
    // If it's one of the default keys, translate it. Otherwise, it's a custom type, return as is.
    return DEFAULT_TYPES_KEYS.includes(typeKey) ? t(typeKey) : typeKey
  }
  
  const [selectedType, setSelectedType] = useState<string>(donationTypes[0] || DEFAULT_TYPES_KEYS[0])

  useEffect(() => {
    setSelectedType(prev => {
      if (donationTypes.includes(prev)) return prev
      return donationTypes[0] || prev
    })
  }, [donationTypes])



  const [currencyConfig, setCurrencyConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('cashcounter_config')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.currency && CURRENCY_DENOMINATIONS[parsed.currency]) {
          return CURRENCY_DENOMINATIONS[parsed.currency]
        }
      }
    } catch { /* ignore */ }
    return CURRENCY_DENOMINATIONS['EUR']
  })

  useEffect(() => {
    const handleConfigChange = () => {
      try {
        const stored = localStorage.getItem('cashcounter_config')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.currency && CURRENCY_DENOMINATIONS[parsed.currency]) {
            setCurrencyConfig(CURRENCY_DENOMINATIONS[parsed.currency])
          }
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('cashcounter_config_changed', handleConfigChange)
    return () => window.removeEventListener('cashcounter_config_changed', handleConfigChange)
  }, [])


  
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('church_donation_logs')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch { /* ignore */ }
    return []
  })

  useEffect(() => {
    localStorage.setItem('church_donation_logs', JSON.stringify(logs))
  }, [logs])

  const [nameInput, setNameInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [customType, setCustomType] = useState('')

  const finalType = customType.trim() || selectedType
  const currentDisplayType = getDisplayType(finalType)

  useEffect(() => {
    const anonSuffix = `-${t('tracker.anonymousRaw')}`
    setNameInput(prev => {
      if (prev.endsWith(anonSuffix) || prev === '__anonymous__') {
        return `${currentDisplayType}${anonSuffix}`
      }
      return prev
    })
  }, [currentDisplayType, t, nameInput])
  const [nameHistory, setNameHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('church_name_history')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.every((item: unknown) => typeof item === 'string')) {
          return parsed
        }
      }
    } catch { /* ignore */ }
    return []
  })

  // Search auto-complete
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')

  const PLACEHOLDER = '__ENCRYPTED_MEMBERS_PLACEHOLDER__'

  // Auto-unlock from cached key (PWA / returning user)
  useEffect(() => {
    try {
      const cachedKey = localStorage.getItem('church_member_key')
      // SECURITY NOTE: Cached key from previous session. See security note below on storage.
      if (cachedKey) {
        // @ts-expect-error window extension
        const encrypted = window.ENCRYPTED_MEMBERS
        if (!encrypted || encrypted === PLACEHOLDER) return
        const decrypted = CryptoJS.AES.decrypt(encrypted, cachedKey).toString(CryptoJS.enc.Utf8)
        if (decrypted) {
          const parsed = JSON.parse(decrypted)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => typeof item === 'string')) {
            setMembers(parsed)
            setIsUnlocked(true)
          } else {
            // Decrypted data is invalid — clear the bad key
            localStorage.removeItem('church_member_key')
          }
        } else {
          // Decryption returned empty — key is wrong, clear it
          localStorage.removeItem('church_member_key')
        }
      }
    } catch {
      // Cached key invalid, clear it
      localStorage.removeItem('church_member_key')
    }
  }, [])
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  const skipDropdownOpenRef = useRef(false)
  
  useEffect(() => {
    if (showKeyModal && keyInputRef.current) {
      // Small timeout ensures the modal is fully mounted and painted before focusing
      setTimeout(() => {
        keyInputRef.current?.focus()
      }, 50)
    }
  }, [showKeyModal])
  
  // Custom Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    description: React.ReactNode
    isConfirm: boolean
    onConfirm: (() => void) | null
    confirmText?: string
  }>({
    isOpen: false,
    title: '',
    description: '',
    isConfirm: false,
    onConfirm: null,
    confirmText: t('common.ok')
  })

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null)



  useEffect(() => {
    // Handle click outside dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUnlock = () => {
    try {
      // @ts-expect-error window extension
      // Read the global variable injected by build.cjs into index.html
      const encrypted = window.ENCRYPTED_MEMBERS
      if (!encrypted || encrypted === PLACEHOLDER) return
      const decrypted = CryptoJS.AES.decrypt(encrypted, keyInput).toString(CryptoJS.enc.Utf8)
      if (decrypted) {
        const parsed = JSON.parse(decrypted)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => typeof item === 'string')) {
          setMembers(parsed)
          setIsUnlocked(true)
          setShowKeyModal(false)
          // SECURITY NOTE: Key is cached in localStorage for PWA convenience (auto-unlock on relaunch).
          // Trade-off: localStorage is accessible to any JS on the same origin.
          // For higher security, use sessionStorage instead (clears on tab close).
          localStorage.setItem('church_member_key', keyInput)
          setKeyInput('')
          return
        }
      }
    } catch {
      // Invalid key
    }
    // Handle invalid key error
    setModalState({
      isOpen: true,
      title: t('tracker.warning'),
      description: t('tracker.invalidKey'),
      isConfirm: false,
      onConfirm: null,
      confirmText: t('common.ok')
    })
  }

  const query = nameInput.trim()
  const searchResults = useMemo(() => {
    if (query === '' || query === '__anonymous__' || query === t('tracker.anonymousRaw')) {
      return nameHistory.map(m => ({ name: m, matches: <>{m}</>, type: 'history' }))
    }
    if (!isUnlocked) return []

    const queryLower = query.toLowerCase()
    const queryChosung = getChosung(queryLower)

    return members
      .map((member): {name: string, matches: React.ReactNode, type: string} | null => {
        const memberLower = member.toLowerCase()
        const memberChosung = getChosung(memberLower)

        let matchIdx = -1
        let matchLen = 0

        if (memberLower.includes(queryLower)) {
          matchIdx = memberLower.indexOf(queryLower)
          matchLen = queryLower.length
        } else if (memberChosung.includes(queryChosung)) {
          matchIdx = memberChosung.indexOf(queryChosung)
          matchLen = queryChosung.length
        }

        if (matchIdx !== -1) {
          const highlighted = (
            <>
              {member.substring(0, matchIdx)}
              <mark className="bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100 rounded px-0.5">
                {member.substring(matchIdx, matchIdx + matchLen)}
              </mark>
              {member.substring(matchIdx + matchLen)}
            </>
          )
          return { name: member, matches: highlighted, type: 'member' }
        }
        return null
      })
      .filter((x): x is {name: string, matches: React.ReactNode, type: string} => x !== null)
      .slice(0, 50)
  }, [query, isUnlocked, members, nameHistory, t])

  // @MX:NOTE: Synchronize derived UI state (dropdown visibility) based on query and results.
  // We intentionally omit `setShowDropdown` and `setFocusedSearchIndex` from dependencies 
  // because this effect is strictly for responding to input changes, not reacting to its own state updates.
  useEffect(() => {
    // Skip reopening dropdown after Enter/Tab selection or dropdown item click
    if (skipDropdownOpenRef.current) {
      skipDropdownOpenRef.current = false
      return
    }
    if (query === '' || query === '__anonymous__' || query === t('tracker.anonymousRaw')) {
      // Hide automatically when cleared. User can bring up history via arrow keys.
      setShowDropdown(false)
    } else if (searchResults.length > 0 && isUnlocked) {
      setShowDropdown(true)
      setFocusedSearchIndex(-1)
    }
  }, [query, isUnlocked, searchResults, t])

  useEffect(() => {
    if (showDropdown && focusedSearchIndex >= 0) {
      const el = document.getElementById(`option-${focusedSearchIndex}`)
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [showDropdown, focusedSearchIndex])

  const handleSearchKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      if (!showDropdown) {
        if (nameHistory.length > 0) {
          setShowDropdown(true)
          setFocusedSearchIndex(0)
          e.preventDefault()
        }
        return
      }
      e.preventDefault()
      setFocusedSearchIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      if (!showDropdown) {
        if (nameHistory.length > 0) {
          setShowDropdown(true)
          setFocusedSearchIndex(nameHistory.length - 1)
          e.preventDefault()
        }
        return
      }
      e.preventDefault()
      setFocusedSearchIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      skipDropdownOpenRef.current = true
      if (showDropdown && searchResults.length > 0 && focusedSearchIndex >= 0) {
        setNameInput(searchResults[focusedSearchIndex].name)
      } else if (showDropdown && searchResults.length > 0) {
        setNameInput(searchResults[0].name)
      } else if (!nameInput.trim()) {
        setNameInput('__anonymous__')
      } else {
        setNameInput(nameInput.trim())
      }
      setShowDropdown(false)
      document.getElementById('donationAmount')?.focus()
    } else if (e.key === 'Tab') {
      if (!nameInput.trim()) {
        e.preventDefault()
        skipDropdownOpenRef.current = true
        setNameInput('__anonymous__')
        setShowDropdown(false)
        document.getElementById('donationAmount')?.focus()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleFormSubmit = (e?: React.FormEvent, customTypeOverride?: string) => {
    if (e) e.preventDefault()
    let name = nameInput.trim()
    const amountVal = parseFloat(amountInput)
    const finalSubmitType = customTypeOverride || finalType

    if (!name) {
      showModal(t('tracker.notification'), t('tracker.enterName'))
      return
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      showModal(t('tracker.notification'), t('tracker.enterAmount'))
      return
    }
    if (!finalType) {
      showModal(t('tracker.notification'), t('tracker.enterType'))
      return
    }

    const anonSuffix = `-${t('tracker.anonymousRaw')}`;
    const isAnonymousEntry = name === '__anonymous__' || name.endsWith(anonSuffix);
    
    let logName = name;
    if (!isAnonymousEntry && name && !members.includes(name)) {
      logName = `${name}${t('tracker.newMemberSuffix', ' (New Member)')}`;
    }

    const newLog: LogEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: logName,
      amount: amountVal,
      type: finalSubmitType
    }

    setLogs(prev => [...prev, newLog])
    
    if (!isAnonymousEntry) {
      const updatedHistory = [name, ...nameHistory.filter(n => n !== name)].slice(0, 10)
      setNameHistory(updatedHistory)
      localStorage.setItem('church_name_history', JSON.stringify(updatedHistory))
      
      if (!members.includes(name)) {
        const newMembers = [...members, name]
        setMembers(newMembers)
      }
    }

    setNameInput('')
    setAmountInput('')
    setShowDropdown(false)

    const displayName = logName === '__anonymous__' ? t('tracker.anonymousRaw') : logName
    const displayType = getDisplayType(finalSubmitType)
    const displayAmount = formatAmount(amountVal)
    setToastMessage(`${displayName} • ${displayType} • ${displayAmount}`)
    setTimeout(() => setToastMessage(null), 2000)

    // Focus name input for continuous rapid entry
    document.getElementById('memberNameInput')?.focus()
  }

  const showModal = (title: string, description: React.ReactNode, isConfirm = false, onConfirm: (() => void) | null = null, confirmText = t('common.ok')) => {
    setModalState({
      isOpen: true,
      title,
      description,
      isConfirm,
      onConfirm,
      confirmText
    })
  }

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }))

  const deleteRow = (id: string) => {
    const record = logs.find(l => l.id === id)
    if (!record) return
    const displayName = record.name === '__anonymous__' ? t('tracker.anonymousRaw') : record.name
    showModal(
      t('tracker.deleteRecord'),
      t('tracker.confirmDeleteRecord', { name: displayName, amount: formatAmount(record.amount), type: getDisplayType(record.type) }),
      true,
      () => {
        setLogs(prev => prev.filter(l => l.id !== id))
        closeModal()
      },
      t('common.delete')
    )
  }

  const clearAllEntries = () => {
    showModal(
      t('tracker.deleteAll'),
      t('tracker.confirmDeleteAll'),
      true,
      () => {
        setLogs([])
        closeModal()
      },
      t('common.delete')
    )
  }

  const escapeSpreadsheetCell = (val: string) => {
    if (/^[=+\-@]/.test(val)) {
      return `'${val}`
    }
    return val
  }

  const exportToCSV = () => {
    if (logs.length === 0) return
    const csvRows = [[t('tracker.name'), t('tracker.currency', 'Currency'), t('tracker.amount'), t('tracker.type')]]
    logs.forEach(log => {
      const displayName = log.name === '__anonymous__' ? t('tracker.anonymousRaw') : log.name
      csvRows.push([
        escapeSpreadsheetCell(displayName), 
        currencyConfig.code || 'EUR',
        log.amount.toFixed(2), 
        escapeSpreadsheetCell(getDisplayType(log.type))
      ])
    })
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const str = String(cell).replace(/"/g, '""')
        return /[",\n]/.test(str) ? `"${str}"` : str
      }).join(",")
    ).join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    
    const d = new Date()
    const filename = `${t('tracker.exportFilenamePrefix')}${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (logs.length === 0) return
    const headers = [t('tracker.name'), t('tracker.currency', 'Currency'), t('tracker.amount'), t('tracker.type')].join("\t")
    const rows = logs.map(log => {
      const displayName = log.name === '__anonymous__' ? t('tracker.anonymousRaw') : log.name
      return [
        escapeSpreadsheetCell(displayName), 
        currencyConfig.code || 'EUR',
        log.amount.toFixed(2), 
        escapeSpreadsheetCell(getDisplayType(log.type))
      ].join("\t")
    })
    const tsvContent = [headers, ...rows].join("\n")

    const copyWithFallback = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tsvContent).then(() => {
          showModal(t('tracker.copySuccess'), t('tracker.copySuccessDesc'))
        }).catch(err => {
          console.error('Copy failed:', err)
          showModal(t('tracker.copyFailed'), t('tracker.copyFailedDesc'))
        })
      } else {
        try {
          const textArea = document.createElement('textarea')
          textArea.value = tsvContent
          textArea.style.position = 'fixed'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          if (successful) {
            showModal(t('tracker.copySuccess'), t('tracker.copySuccessDesc'))
          } else {
            throw new Error('execCommand copy failed')
          }
        } catch (err) {
          console.error('Fallback copy failed:', err)
          showModal(t('tracker.copyFailed'), t('tracker.copyFailedDesc'))
        }
      }
    }
    copyWithFallback()
  }

  // Compute breakdown
  const { typeSums, totalAmount } = useMemo(() => {
    const sums: Record<string, number> = {}
    let total = 0
    donationTypes.forEach(dtype => { sums[dtype] = 0 })
    logs.forEach(log => {
      total += log.amount
      if (sums[log.type] === undefined) sums[log.type] = 0
      sums[log.type] += log.amount
    })
    return { typeSums: sums, totalAmount: total }
  }, [logs, donationTypes])

  return (
    <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 scalable-content">
      {/* LEFT COLUMN: ADD FORM */}
      <section className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 space-y-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* NAME INPUT */}
            <div className="relative" ref={searchDropdownRef}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>{t('tracker.name')}</span>
                  <button type="button" tabIndex={-1} onClick={() => setShowKeyModal(true)} className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 p-0.5 rounded transition-all hover:bg-violet-50 dark:hover:bg-violet-900/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isUnlocked ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      )}
                    </svg>
                  </button>
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full ml-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      {t('tracker.autoCompleteOn')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full ml-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                      {t('tracker.autoCompleteOff')}
                    </span>
                  )}
                </label>
                <button type="button" tabIndex={-1} onClick={() => { setNameInput('__anonymous__'); setShowDropdown(false); document.getElementById('donationAmount')?.focus() }} className="bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60 active:scale-[0.97] text-violet-950 dark:text-violet-100 text-sm font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 touch-target">
                  <span>{t('tracker.anonymous')}</span>
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  id="memberNameInput"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-controls="name-dropdown"
                  aria-autocomplete="list"
                  aria-activedescendant={showDropdown && focusedSearchIndex >= 0 && focusedSearchIndex < searchResults.length ? `option-${focusedSearchIndex}` : undefined}
                  tabIndex={1}
                  value={nameInput === '__anonymous__' ? t('tracker.anonymousRaw') : nameInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setNameInput(val === t('tracker.anonymousRaw') ? '__anonymous__' : val)
                    setShowDropdown(true)
                  }}
                  onKeyDown={handleSearchKeydown}
                  onBlur={() => setShowDropdown(false)}
                  placeholder={t('tracker.name')} 
                  className="w-full text-lg md:text-xl p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium dark:bg-slate-900 dark:text-slate-100"
                />
                <button type="button" tabIndex={-1} onClick={() => { setNameInput(''); setShowDropdown(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <ul id="name-dropdown" role="listbox" className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-100">
                  {searchResults.map((result, idx) => (
                    <li
                      key={result.name}
                      id={`option-${idx}`}
                      role="option"
                      aria-selected={focusedSearchIndex === idx}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        skipDropdownOpenRef.current = true
                        setNameInput(result.name)
                        setShowDropdown(false)
                        document.getElementById('donationAmount')?.focus()
                      }}
                      onMouseEnter={() => setFocusedSearchIndex(idx)}
                      className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between text-base md:text-lg text-slate-800 dark:text-slate-200 ${
                        focusedSearchIndex === idx ? 'bg-violet-50 dark:bg-violet-900/40 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'
                      }`}
                    >
                      <span>{result.matches}</span>
                      {result.type === 'history' && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                          {t('tracker.recent')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>{t('tracker.amount')}</span> (<span className="currency-sym">{currencyConfig.code} - {currencyConfig.name}</span>)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  id="donationAmount"
                  tabIndex={2}
                  inputMode="decimal" 
                  step="any" 
                  min="0.01" 
                  required 
                  placeholder="0.00" 
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleFormSubmit(undefined)
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      document.getElementById('typeBtn-0')?.focus()
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      document.getElementById('memberNameInput')?.focus()
                    }
                  }}
                  className="w-full text-2xl font-bold p-4 pr-12 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all placeholder:text-slate-300 dark:bg-slate-900 dark:text-slate-100"
                />
                <button type="button" tabIndex={-1} onClick={() => setAmountInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              {/* Quick Save — visible when amount has a value, for mobile numpad users without Return key */}
              {parseFloat(amountInput) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleFormSubmit(undefined)
                    document.getElementById('memberNameInput')?.focus()
                  }}
                  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold text-lg py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 md:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span>{t('tracker.quickSave')}</span>
                </button>
              )}
            </div>

            {/* DONATION TYPES */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>{t('tracker.selectDonationType')}</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {donationTypes.map((type, idx) => {
                  const isActive = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      id={`typeBtn-${idx}`}
                      tabIndex={10 + idx}
                      onClick={() => {
                        setSelectedType(type)
                        setCustomType('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Spacebar') {
                          e.preventDefault()
                          setSelectedType(type)
                          setCustomType('')
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          setSelectedType(type)
                          setCustomType('')
                          handleFormSubmit(undefined, type)
                          document.getElementById('memberNameInput')?.focus()
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          const next = document.getElementById(`typeBtn-${idx + 1}`)
                          if (next) next.focus()
                          else document.getElementById('customTypeInput')?.focus()
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          const prev = document.getElementById(`typeBtn-${idx - 1}`)
                          if (prev) prev.focus()
                          else document.getElementById('donationAmount')?.focus()
                        }
                      }}
                      className={`p-3.5 font-bold text-base md:text-lg rounded-xl border-2 transition-all touch-target flex justify-between items-center focus:outline-none focus:ring-4 focus:ring-violet-500/40 focus:border-violet-600 ${
                        isActive 
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100 ring-2 ring-violet-600/10' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{getDisplayType(type)}</span>
                      {isActive && <span className="text-violet-600 font-black text-lg ml-1 shrink-0">✓</span>}
                    </button>
                  )
                })}
              </div>

              <div className="pt-1">
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span>{t('tracker.customInput')}</span>
                </label>
                <input
                  type="text"
                  id="customTypeInput"
                  tabIndex={10 + donationTypes.length}
                  value={customType || getDisplayType(selectedType)}
                  onChange={e => {
                    setCustomType(e.target.value)
                    setSelectedType(e.target.value.trim())
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleFormSubmit(undefined)
                      document.getElementById('memberNameInput')?.focus()
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      document.getElementById('memberNameInput')?.focus()
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      document.getElementById('donationAmount')?.focus()
                    }
                  }}
                  placeholder={t('tracker.customInputPlaceholder')}
                  className="w-full text-lg p-3.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all font-semibold placeholder:text-slate-400 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button type="submit" tabIndex={-1} className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-extrabold text-xl py-4 rounded-xl shadow-lg shadow-violet-600/15 transition-all flex items-center justify-center gap-3 mt-4 focus:outline-none focus:ring-4 focus:ring-violet-500/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              <span>{t('tracker.submit')}</span>
            </button>
          </form>
        </div>
      </section>

      {/* RIGHT COLUMN */}
      <section className="lg:col-span-5 space-y-6">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/35 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-400/25 rounded-full blur-lg pointer-events-none"></div>

          <span className="text-emerald-100 font-extrabold tracking-wider text-xs uppercase block">{t('tracker.totalAmount')}</span>
          <div className="text-4xl md:text-5xl font-black mt-1 flex items-baseline gap-2">
            <span>{formatAmount(totalAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-5 border-t border-emerald-500/50 text-sm">
            <div>
              <span className="text-emerald-100 font-medium">{t('tracker.totalCount')}</span>
              <p className="text-xl font-bold">{logs.length} {t('tracker.countUnit')}</p>
            </div>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-3">
            <span>{t('tracker.subtotals')}</span>
          </h3>
          <div className="space-y-1">
            {Object.keys(typeSums).map(type => {
              const subTotal = typeSums[type] || 0
              if (!donationTypes.includes(type) && subTotal === 0) return null
              const percentage = totalAmount > 0 ? ((subTotal / totalAmount) * 100).toFixed(1) : '0.0'
              return (
                <div key={type} className="flex items-center justify-between text-sm font-semibold py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded px-1 transition duration-150">
                  <span className="truncate text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pr-2">
                    <span className={`w-2 h-2 rounded-full ${donationTypes.includes(type) ? 'bg-violet-600' : 'bg-amber-500'} shrink-0`}></span>
                    <span className="truncate">{getDisplayType(type)}</span>
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-black text-xl flex items-center justify-end">
                    <span>{formatAmount(subTotal)}</span>
                    <span className="text-xs text-slate-400 font-normal ml-2 min-w-[3.5rem] md:min-w-[4rem] text-right">{percentage}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col" style={{minHeight: '400px'}}>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{t('tracker.todayRecords')}</h3>
            <div className="flex gap-2">
              {logs.length > 0 && (
                <button onClick={clearAllEntries} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-bold px-3 py-1.5 rounded-lg text-sm transition">
                  {t('tracker.deleteAllShort')}
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-x-auto w-full block">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="text-slate-400 font-bold text-sm border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-2 px-2 w-1/3">{t('tracker.name')}</th>
                  <th className="pb-2 px-2">{t('tracker.currency', 'Currency')}</th>
                  <th className="pb-2 px-2 w-1/4">{t('tracker.type')}</th>
                  <th className="pb-2 px-2 text-right">{t('tracker.amount')}</th>
                  <th className="pb-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm sm:text-base font-semibold">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      {t('tracker.noRecords')}
                    </td>
                  </tr>
                ) : (
                  [...logs].reverse().map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition border-b border-slate-100 dark:border-slate-700 group">
                      <td className="py-3 px-2 font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-lg">
                        <div className="truncate max-w-[120px] sm:max-w-none">{log.name === '__anonymous__' ? t('tracker.anonymousRaw') : log.name}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
                        {currencyConfig.code || 'EUR'}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold text-sm">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 inline-block max-w-[110px] truncate" title={getDisplayType(log.type)}>
                          {getDisplayType(log.type)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-slate-100 text-sm sm:text-lg">
                        <span className="font-medium">
                          {formatAmount(log.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-1 text-center">
                        <button onClick={() => deleteRow(log.id)} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-lg transition touch-target inline-flex items-center justify-center opacity-80 hover:opacity-100" title={t('tracker.deleteRecord')}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3">
            <button onClick={copyToClipboard} disabled={logs.length === 0} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-lg py-4 rounded-xl shadow-lg hover:shadow-violet-600/10 transition-all flex items-center justify-center gap-2.5 touch-target">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
              <span className="text-center leading-tight">{t('tracker.copyClipboard')}<br/>
                <span className="text-xs font-normal opacity-90">{t('tracker.forExcelPaste')}</span>
              </span>
            </button>
            <button onClick={exportToCSV} disabled={logs.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-lg py-4 rounded-xl shadow-lg hover:shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 touch-target">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>{t('tracker.downloadExcel')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* TOAST AND MODALS */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-fade-in-out flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-700">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{t('tracker.accessKeyRequired')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span>{t('tracker.enterKeyToUnlock')}</span><br/>
                <span>{t('tracker.canUseWithoutKey')}</span>
              </p>
            </div>
            <input 
              ref={keyInputRef}
              autoFocus
              type="password" 
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              className="w-full p-3 border-2 border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none bg-slate-900 text-slate-100"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowKeyModal(false)} className="px-5 py-3 rounded-xl border border-slate-600 font-bold hover:bg-slate-800">{t('tracker.cancel')}</button>
              <button onClick={handleUnlock} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-white">{t('tracker.unlock')}</button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 bg-amber-50 text-amber-600">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-950 dark:text-slate-100">{modalState.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">{modalState.description}</p>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button onClick={() => setModalState(prev => ({...prev, isOpen: false}))} className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition touch-target">
                {modalState.isConfirm ? t('tracker.cancel') : t('tracker.ok')}
              </button>
              {modalState.isConfirm && (
                <button onClick={modalState.onConfirm!} className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-md transition touch-target">
                  {modalState.confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
