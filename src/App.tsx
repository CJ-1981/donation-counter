import { useState, useRef, useCallback } from 'react'
import CashCounterPage from './pages/CashCounterPage'
import DonationTrackerPage from './pages/DonationTrackerPage'
import { Tabs } from './components/Tabs'
import packageJson from '../package.json'

const SWIPE_THRESHOLD = 50

function App() {
  const [activeTab, setActiveTab] = useState<'cash-counter' | 'donation-tracker'>('cash-counter')
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isSwiping = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    // Only treat as horizontal swipe if horizontal movement dominates
    if (!isSwiping.current && Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
      isSwiping.current = true
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null) {
      touchStartX.current = null
      touchStartY.current = null
      return
    }

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

    if (deltaX > 0) {
      // Swipe right → go to previous tab (Cash Counter)
      setActiveTab(prev => prev === 'donation-tracker' ? 'cash-counter' : prev)
    } else {
      // Swipe left → go to next tab (Donation Tracker)
      setActiveTab(prev => prev === 'cash-counter' ? 'donation-tracker' : prev)
    }
  }, [])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 dark:text-slate-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Content Containers */}
      <div className={`flex-1 overflow-y-auto w-full relative ${activeTab === 'cash-counter' ? 'block' : 'hidden'}`}>
        <CashCounterPage />
      </div>
      <div className={`flex-1 overflow-y-auto w-full ${activeTab === 'donation-tracker' ? 'block' : 'hidden'}`}>
        <DonationTrackerPage />
      </div>
      
      {/* App Footer */}
      <div className="text-center py-2 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        v{packageJson.version} • 2026-06-07
      </div>
    </div>
  )
}

export default App
