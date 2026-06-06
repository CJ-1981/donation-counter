import { useState } from 'react'
import CashCounterPage from './pages/CashCounterPage'
import DonationTrackerPage from './pages/DonationTrackerPage'
import { Tabs } from './components/Tabs'

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
    </div>
  )
}

export default App
