import { useState, useEffect, useRef } from 'react'
import CryptoJS from 'crypto-js'
import { useTranslation } from 'react-i18next'

interface LogEntry {
  id: string
  name: string
  amount: number
  type: string
}

const DEFAULT_TYPES_KO = ["주일", "십일조", "감사", "선교/구제", "특별헌금", "주일학교"]

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
  const { t } = useTranslation()

  // Setup state
  const [members, setMembers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('church_members_db')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return []
  })
  const [donationTypes, setDonationTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('church_donation_types')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return DEFAULT_TYPES_KO.map(x => t(x))
  })
  
  const [selectedType, setSelectedType] = useState<string>(t('주일'))

  useEffect(() => {
    setDonationTypes(prev => {
      const newTypes = DEFAULT_TYPES_KO.map(x => t(x))
      setSelectedType(oldSelected => {
        const idx = prev.indexOf(oldSelected)
        if (idx !== -1 && idx < newTypes.length) {
          return newTypes[idx]
        }
        return newTypes[0] || oldSelected
      })
      return newTypes
    })
  }, [t])

  const [customType, setCustomType] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [nameInput, setNameInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [nameHistory, setNameHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('church_name_history')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return []
  })

  // Search auto-complete
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  
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
    confirmText: t('확인')
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
      const decrypted = CryptoJS.AES.decrypt(encrypted, keyInput).toString(CryptoJS.enc.Utf8)
      if (decrypted) {
        const parsed = JSON.parse(decrypted)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed)
          setIsUnlocked(true)
          setShowKeyModal(false)
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
      title: t('경고'),
      description: t('유효하지 않은 키입니다. 자동완성이 잠금 상태로 유지됩니다.'),
      isConfirm: false,
      onConfirm: null,
      confirmText: t('확인')
    })
  }

  const query = nameInput.trim()
  const searchResults = (() => {
    if (query === '' || query === t('무명')) {
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
      .slice(0, 5)
  })()

  // Keep dropdown state in sync if input is empty
  useEffect(() => {
    if (query === '' || query === t('무명')) {
      // Hide automatically when cleared. User can bring up history via arrow keys.
      setShowDropdown(false)
    } else if (searchResults.length > 0 && isUnlocked) {
      setShowDropdown(true)
      setFocusedSearchIndex(-1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isUnlocked])

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
      if (showDropdown && searchResults.length > 0 && focusedSearchIndex >= 0) {
        setNameInput(searchResults[focusedSearchIndex].name)
      } else if (showDropdown && searchResults.length > 0) {
        setNameInput(searchResults[0].name)
      } else if (!nameInput.trim()) {
        setNameInput(t('무명'))
      } else {
        setNameInput(nameInput.trim())
      }
      setShowDropdown(false)
      document.getElementById('donationAmount')?.focus()
    } else if (e.key === 'Tab') {
      if (!nameInput.trim()) {
        e.preventDefault()
        setNameInput(t('무명'))
        setShowDropdown(false)
        document.getElementById('donationAmount')?.focus()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleFormSubmit = (e?: React.FormEvent, customTypeOverride?: string) => {
    if (e) e.preventDefault()
    const name = nameInput.trim()
    const amountVal = parseFloat(amountInput)
    const finalType = customTypeOverride || customType.trim() || selectedType

    if (!name) {
      showModal(t('알림'), t('성명을 입력해 주십시오.'))
      return
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      showModal(t('알림'), t('금액을 올바르게 입력해 주십시오.'))
      return
    }
    if (!finalType) {
      showModal(t('알림'), t('헌금 종류를 입력해 주십시오.'))
      return
    }

    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      name,
      amount: amountVal,
      type: finalType
    }

    setLogs(prev => [...prev, newLog])
    
    if (name !== t('무명')) {
      const updatedHistory = [name, ...nameHistory.filter(n => n !== name)].slice(0, 10)
      setNameHistory(updatedHistory)
      localStorage.setItem('church_name_history', JSON.stringify(updatedHistory))
      
      if (!members.includes(name)) {
        const newMembers = [...members, name]
        setMembers(newMembers)
        localStorage.setItem('church_members_db', JSON.stringify(newMembers))
      }
    }

    setNameInput('')
    setAmountInput('')
    setShowDropdown(false)

    setToastMessage(name)
    setTimeout(() => setToastMessage(null), 2000)

    // Focus name input for continuous rapid entry
    document.getElementById('memberNameInput')?.focus()
  }

  const showModal = (title: string, description: React.ReactNode, isConfirm = false, onConfirm: (() => void) | null = null, confirmText = t('확인')) => {
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
    showModal(
      t('기록 삭제'),
      `"${record.name}"님의 €${record.amount.toFixed(2)} (${record.type}) 기록을 삭제하시겠습니까?`,
      true,
      () => {
        setLogs(prev => prev.filter(l => l.id !== id))
        closeModal()
      },
      t('삭제')
    )
  }

  const clearAllEntries = () => {
    showModal(
      t('전체 삭제'),
      t('기록된 모든 데이터가 삭제됩니다. 진행하시겠습니까?'),
      true,
      () => {
        setLogs([])
        closeModal()
      },
      t('삭제')
    )
  }

  const exportToCSV = () => {
    if (logs.length === 0) return
    const csvRows = [[t('이름'), t('금액'), t('종류')]]
    logs.forEach(log => {
      csvRows.push([log.name, log.amount.toFixed(2), log.type])
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
    const filename = `${t('헌금_집계표_')}${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = () => {
    if (logs.length === 0) return
    const headers = [t('이름'), t('금액'), t('종류')].join("\t")
    const rows = logs.map(log => [log.name, log.amount.toFixed(2), log.type].join("\t"))
    const tsvContent = [headers, ...rows].join("\n")

    navigator.clipboard.writeText(tsvContent).then(() => {
      showModal(t('복사 완료'), t('클립보드에 복사되었습니다. 엑셀 등 스프레드시트 프로그램의 원하는 셀을 선택하고 붙여넣기(Ctrl+V)를 하시면 됩니다.'))
    }).catch(err => {
      console.error('Copy failed:', err)
      showModal(t('복사 실패'), t('브라우저 정책상 복사가 차단되었습니다. 다운로드 기능을 이용해 주십시오.'))
    })
  }

  // Compute breakdown
  const typeSums: Record<string, number> = {}
  let totalAmount = 0
  
  donationTypes.forEach(t => typeSums[t] = 0)
  logs.forEach(log => {
    totalAmount += log.amount
    if (typeSums[log.type] === undefined) typeSums[log.type] = 0
    typeSums[log.type] += log.amount
  })

  return (
    <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: ADD FORM */}
      <section className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 space-y-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* NAME INPUT */}
            <div className="relative" ref={searchDropdownRef}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>{t('성명')}</span>
                  <button type="button" onClick={() => setShowKeyModal(true)} tabIndex={-1} className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 p-0.5 rounded transition-all hover:bg-violet-50 dark:hover:bg-violet-900/30">
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
                      {t('자동완성 ON')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded-full ml-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                      {t('자동완성 OFF')}
                    </span>
                  )}
                </label>
                <button type="button" onClick={() => { setNameInput(t('무명')); setShowDropdown(false) }} tabIndex={-1} className="bg-violet-100 dark:bg-violet-900/40 hover:bg-violet-200 dark:hover:bg-violet-900/60 active:scale-[0.97] text-violet-950 dark:text-violet-100 text-sm font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 touch-target">
                  <span>{t('👤 무명')}</span>
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  id="memberNameInput"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleSearchKeydown}
                  placeholder={t('성명')} 
                  className="w-full text-lg md:text-xl p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium dark:bg-slate-900 dark:text-slate-100"
                />
                <button type="button" onClick={() => { setNameInput(''); setShowDropdown(false) }} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              
              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-100">
                  {searchResults.map((result, idx) => (
                    <div
                      key={result.name}
                      onMouseDown={(e) => {
                        e.preventDefault()
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
                          최근
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>{t('금액')}</span> (<span className="currency-sym">€</span>)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">€</div>
                <input 
                  type="number" 
                  id="donationAmount"
                  inputMode="decimal" 
                  step="any" 
                  min="0.01" 
                  required 
                  placeholder="0.00" 
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  className="w-full text-2xl font-bold p-4 pl-11 pr-12 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all placeholder:text-slate-300 dark:bg-slate-900 dark:text-slate-100"
                />
                <button type="button" onClick={() => setAmountInput('')} tabIndex={-1} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* DONATION TYPES */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>{t('헌금 종류 선택 및 입력')}</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {donationTypes.map(type => {
                  const isActive = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedType(type)
                        setCustomType(type)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Spacebar') {
                          e.preventDefault()
                          setSelectedType(type)
                          setCustomType(type)
                        } else if (e.key === 'Enter') {
                          e.preventDefault()
                          setSelectedType(type)
                          setCustomType(type)
                          handleFormSubmit(undefined, type)
                          document.getElementById('memberNameInput')?.focus()
                        }
                      }}
                      className={`p-3.5 font-bold text-base md:text-lg rounded-xl border-2 transition-all touch-target flex justify-between items-center focus:outline-none focus:ring-4 focus:ring-violet-500/40 focus:border-violet-600 ${
                        isActive 
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100 ring-2 ring-violet-600/10' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{type}</span>
                      {isActive && <span className="text-violet-600 font-black text-lg ml-1 shrink-0">✓</span>}
                    </button>
                  )
                })}
              </div>

              <div className="pt-1">
                <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span>{t('직접 입력:')}</span>
                </label>
                <input 
                  type="text" 
                  value={customType}
                  onChange={e => {
                    setCustomType(e.target.value)
                    setSelectedType(e.target.value.trim())
                  }}
                  placeholder={t('종류 직접 입력')}
                  className="w-full text-lg p-3.5 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-600 outline-none transition-all font-semibold placeholder:text-slate-400 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <button type="submit" tabIndex={0} className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-extrabold text-xl py-4 rounded-xl shadow-lg shadow-violet-600/15 transition-all flex items-center justify-center gap-3 mt-4 focus:outline-none focus:ring-4 focus:ring-violet-500/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              <span>{t('입력 완료')}</span>
            </button>
          </form>
        </div>
      </section>

      {/* RIGHT COLUMN */}
      <section className="lg:col-span-5 space-y-6">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/35 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-400/25 rounded-full blur-lg pointer-events-none"></div>

          <span className="text-emerald-100 font-extrabold tracking-wider text-xs uppercase block">{t('계수 완료 총액')}</span>
          <div className="text-4xl md:text-5xl font-black mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold">€</span>
            <span>{totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-5 border-t border-emerald-500/50 text-sm">
            <div>
              <span className="text-emerald-100 font-medium">{t('총 건수')}</span>
              <p className="text-xl font-bold">{logs.length} {t('건')}</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-100 font-medium">{t('단위 화폐')}</span>
              <p className="text-xl font-bold">EUR (€)</p>
            </div>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-3">
            <span>{t('분류별 소계')}</span>
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
                    <span className="truncate">{type}</span>
                  </span>
                  <span className="shrink-0 text-right text-slate-900 dark:text-slate-100 font-bold">
                    €{subTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs text-slate-400 font-normal ml-1.5 w-10 inline-block text-right">{percentage}%</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-col" style={{minHeight: '400px'}}>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{t('금일 계수 명단')}</h3>
            <div className="flex gap-2">
              {logs.length > 0 && (
                <button onClick={clearAllEntries} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-bold px-3 py-1.5 rounded-lg text-sm transition">
                  {t('전체삭제')}
                </button>
              )}
            </div>
          </div>

          <div className="flex-grow overflow-x-auto w-full block">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="text-slate-400 font-bold text-sm border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-2 px-2 w-1/3">{t('이름')}</th>
                  <th className="pb-2 px-2 w-1/4">{t('구분')}</th>
                  <th className="pb-2 px-2 text-right">{t('금액')}</th>
                  <th className="pb-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm sm:text-base font-semibold">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                      {t('기록이 없습니다.')}
                    </td>
                  </tr>
                ) : (
                  [...logs].reverse().map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition border-b border-slate-100 dark:border-slate-700 group">
                      <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200 break-all">
                        <div className="truncate max-w-[120px] sm:max-w-none">{log.name}</div>
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold text-sm">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 inline-block max-w-[110px] truncate" title={log.type}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-slate-100 text-sm sm:text-lg">
                        €{log.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-1 text-center">
                        <button onClick={() => deleteRow(log.id)} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded-lg transition touch-target inline-flex items-center justify-center opacity-80 hover:opacity-100" title={t('기록 삭제')}>
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
              <span className="text-center leading-tight">{t('클립보드 복사')}<br/>
                <span className="text-xs font-normal opacity-90">{t('(엑셀 붙여넣기용)')}</span>
              </span>
            </button>
            <button onClick={exportToCSV} disabled={logs.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-lg py-4 rounded-xl shadow-lg hover:shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 touch-target">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              <span>{t('엑셀 다운로드')}</span>
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
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{t('액세스 키 필요')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span>{t('회원명 자동완성을 잠금 해제하려면 키를 입력하세요.')}</span><br/>
                <span>{t('키 없이도 일반 텍스트 입력을 사용할 수 있습니다.')}</span>
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
              <button onClick={() => setShowKeyModal(false)} className="px-5 py-3 rounded-xl border border-slate-600 font-bold hover:bg-slate-800">{t('취소')}</button>
              <button onClick={handleUnlock} className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-white">{t('잠금 해제')}</button>
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
                {t('취소')}
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
