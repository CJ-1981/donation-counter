import { useState } from 'react'
import CashCounterPage from './pages/CashCounterPage'
import DonationTrackerPage from './pages/DonationTrackerPage'
import { Tabs } from './components/Tabs'
import packageJson from '../package.json'

function App() {
  const [activeTab, setActiveTab] = useState<'cash-counter' | 'donation-tracker'>('cash-counter')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 dark:text-slate-100">
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
        v{packageJson.version} • 2026-06-06
      </div>
    </div>
  )
}

export default App
