import { useTranslation } from 'react-i18next'
import { getCurrencySymbol } from '../config/currencyDenominations'
import { useFontSize } from '../contexts/FontSizeContext'

export interface SettingsPanelProps {
  currency: string
  targetAmount: number
  onTargetAmountChange: (amount: number) => void
}

export function SettingsPanel({ currency, targetAmount, onTargetAmountChange }: SettingsPanelProps) {
  const { t } = useTranslation()
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('cashCounter.targetAmountLabel')}
        </label>
        <div className="flex gap-2 items-center">
          <span className="text-slate-500 dark:text-slate-400">{getCurrencySymbol(currency)}</span>
          <input
            id="target-amount"
            name="target-amount"
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            key={currency}
            value={targetAmount === 0 ? '' : targetAmount}
            onChange={(e) => {
              const value = e.target.value.trim()
              const numValue = value === '' ? 0 : parseFloat(value)
              onTargetAmountChange(isNaN(numValue) ? 0 : numValue)
            }}
          />
        </div>

        {/* Font Size Selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('common.fontSize')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['normal', 'large', 'extraLarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${fontSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
              >
                {size === 'normal' && t('common.fontSizeNormal')}
                {size === 'large' && t('common.fontSizeLarge')}
                {size === 'extraLarge' && t('common.fontSizeExtraLarge')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
