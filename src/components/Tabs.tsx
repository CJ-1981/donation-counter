interface TabsProps {
  activeTab: 'cash-counter' | 'donation-tracker'
  onTabChange: (tab: 'cash-counter' | 'donation-tracker') => void
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0 z-50" role="tablist">
      <button
        id="tab-cash-counter"
        role="tab"
        aria-selected={activeTab === 'cash-counter'}
        aria-controls="panel-cash-counter"
        tabIndex={activeTab === 'cash-counter' ? 0 : -1}
        onClick={() => onTabChange('cash-counter')}
        className={`flex-1 py-4 text-center transition-colors ${
          activeTab === 'cash-counter'
            ? 'font-bold text-violet-600 dark:text-violet-400 border-b-4 border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-slate-800/50'
            : 'font-semibold text-slate-500 dark:text-slate-400 border-b-4 border-transparent hover:text-violet-600 dark:hover:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        Cash Counter
      </button>
      <button
        id="tab-donation-tracker"
        role="tab"
        aria-selected={activeTab === 'donation-tracker'}
        aria-controls="panel-donation-tracker"
        tabIndex={activeTab === 'donation-tracker' ? 0 : -1}
        onClick={() => onTabChange('donation-tracker')}
        className={`flex-1 py-4 text-center transition-colors ${
          activeTab === 'donation-tracker'
            ? 'font-bold text-violet-600 dark:text-violet-400 border-b-4 border-violet-600 dark:border-violet-500 bg-violet-50 dark:bg-slate-800/50'
            : 'font-semibold text-slate-500 dark:text-slate-400 border-b-4 border-transparent hover:text-violet-600 dark:hover:text-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        Donation Tracker
      </button>
    </div>
  )
}