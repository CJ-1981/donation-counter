import { useState, useRef, useCallback } from 'react'
import CashCounterPage from './pages/CashCounterPage'
import DonationTrackerPage from './pages/DonationTrackerPage'
import { Tabs } from './components/Tabs'

const SWIPE_THRESHOLD = 50

function App() {
  const [activeTab, setActiveTab] = useState<'cash-counter' | 'donation-tracker'>('cash-counter')
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isSwiping = useRef(false)
  const touchStartCanScrollLeft = useRef(false)
  const touchStartCanScrollRight = useRef(false)
  const cashScrollRef = useRef<HTMLDivElement>(null)
  const donationScrollRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = false

    let el = e.target as HTMLElement | null
    let canLeft = false
    let canRight = false

    while (el && el !== e.currentTarget) {
      const isScrollableX = el.scrollWidth > el.clientWidth + 1
      const style = window.getComputedStyle(el)
      const overflowX = style.overflowX
      const permitsScroll = overflowX === 'auto' || overflowX === 'scroll' || isScrollableX

      if (isScrollableX && permitsScroll) {
        if (el.scrollLeft > 0) {
          canLeft = true
        }
        if (el.scrollLeft + el.clientWidth < el.scrollWidth - 1) {
          canRight = true
        }
      }
      el = el.parentElement
    }

    touchStartCanScrollLeft.current = canLeft
    touchStartCanScrollRight.current = canRight
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

    // Check if touch target or any ancestor is horizontally scrollable in swipe direction
    let el = e.target as HTMLElement | null
    let canScrollInSwipeDirection = deltaX > 0 ? touchStartCanScrollLeft.current : touchStartCanScrollRight.current

    while (!canScrollInSwipeDirection && el && el !== e.currentTarget) {
      const isScrollableX = el.scrollWidth > el.clientWidth + 1
      const style = window.getComputedStyle(el)
      const overflowX = style.overflowX
      const permitsScroll = overflowX === 'auto' || overflowX === 'scroll' || isScrollableX

      if (isScrollableX && permitsScroll) {
        if (deltaX > 0 && el.scrollLeft > 0) {
          canScrollInSwipeDirection = true
          break
        }
        if (deltaX < 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) {
          canScrollInSwipeDirection = true
          break
        }
      }
      el = el.parentElement
    }

    if (canScrollInSwipeDirection) return

    if (deltaX > 0) {
      // Swipe right → go to previous tab (Cash Counter)
      setActiveTab(prev => prev === 'donation-tracker' ? 'cash-counter' : prev)
    } else {
      // Swipe left → go to next tab (Donation Tracker)
      setActiveTab(prev => prev === 'cash-counter' ? 'donation-tracker' : prev)
    }
  }, [])

  const getActiveScrollRef = useCallback(() => {
    return activeTab === 'cash-counter' ? cashScrollRef : donationScrollRef
  }, [activeTab])

  const scrollToTop = useCallback(() => {
    getActiveScrollRef().current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [getActiveScrollRef])

  const scrollToBottom = useCallback(() => {
    const el = getActiveScrollRef().current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [getActiveScrollRef])

  return (
    <div
      className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 dark:text-slate-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Content Containers */}
      <div ref={cashScrollRef} id="panel-cash-counter" role="tabpanel" aria-labelledby="tab-cash-counter" className={`flex-1 overflow-y-auto w-full relative ${activeTab === 'cash-counter' ? 'block' : 'hidden'}`}>
        <CashCounterPage />
      </div>
      <div ref={donationScrollRef} id="panel-donation-tracker" role="tabpanel" aria-labelledby="tab-donation-tracker" className={`flex-1 overflow-y-auto w-full ${activeTab === 'donation-tracker' ? 'block' : 'hidden'}`}>
        <DonationTrackerPage />
      </div>
      
      {/* App Footer */}
      <div className="flex items-center justify-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={scrollToTop}
          className="p-1 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 active:scale-90 transition-all"
          aria-label="Scroll to top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"/></svg>
        </button>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          v{__APP_VERSION__} • {__BUILD_DATE__}
        </span>
        <button
          type="button"
          onClick={scrollToBottom}
          className="p-1 text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 active:scale-90 transition-all"
          aria-label="Scroll to bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>
    </div>
  )
}

export default App
