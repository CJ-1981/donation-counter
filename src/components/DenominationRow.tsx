
import { getCurrencyEmoji } from '../config/currencyDenominations'
import { formatCurrencyAmount } from '../utils/denominationUtils'

interface DenominationControlsProps {
  count: number
  onChange: (delta: number) => void
  onInput: (value: number) => void
  color: 'teal' | 'blue'
  denomination: number
  tabIndex: number
  fieldIds: string[]
  onFocusField: (id: string) => void
}

function DenominationControls({ count, onChange, onInput, color, denomination, tabIndex, fieldIds, onFocusField }: DenominationControlsProps) {
  const colorClasses = {
    teal: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      container: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-teal-500 dark:bg-slate-700 dark:text-white transition-all duration-75',
    },
    blue: {
      minus: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300',
      plus: 'bg-green-500 hover:bg-green-600',
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
      input: 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700 dark:text-white transition-all duration-75',
    },
  }

  const fieldId = `denomination-${denomination}-${color}`

  const navigateField = (direction: 'next' | 'prev') => {
    const currentIdx = fieldIds.indexOf(fieldId)
    if (currentIdx === -1) return
    let nextIdx: number
    if (direction === 'next') {
      nextIdx = (currentIdx + 1) % fieldIds.length
    } else {
      nextIdx = (currentIdx - 1 + fieldIds.length) % fieldIds.length
    }
    onFocusField(fieldIds[nextIdx])
  }

  return (
    <div className="flex flex-col gap-1 items-center">
      <div className={`p-1 rounded-md border ${colorClasses[color].container} w-full`}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          id={fieldId}
          name={fieldId}
          tabIndex={tabIndex}
          className={`text-center font-semibold w-full border rounded focus:outline-none focus:ring-2 py-1 px-2 ${colorClasses[color].input}`}
          key={count} // Force re-render on external update
          defaultValue={count === 0 ? '' : count}
          placeholder="0"
          onBlur={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '')
            onInput(Math.max(0, Math.min(999, parseInt(val, 10) || 0)))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const val = e.currentTarget.value.replace(/[^0-9]/g, '')
              onInput(Math.max(0, Math.min(999, parseInt(val, 10) || 0)))
              navigateField('next')
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              const val = e.currentTarget.value.replace(/[^0-9]/g, '')
              onInput(Math.max(0, Math.min(999, parseInt(val, 10) || 0)))
              navigateField('next')
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              const val = e.currentTarget.value.replace(/[^0-9]/g, '')
              onInput(Math.max(0, Math.min(999, parseInt(val, 10) || 0)))
              navigateField('prev')
            } else if (e.key === 'Tab') {
              const val = e.currentTarget.value.replace(/[^0-9]/g, '')
              onInput(Math.max(0, Math.min(999, parseInt(val, 10) || 0)))
            }
          }}
        />
      </div>
      <div className="flex gap-1 items-center w-full justify-center">
        <button
          type="button"
          tabIndex={-1}
          className={`w-8 h-8 rounded ${colorClasses[color].minus} text-white font-bold text-xs disabled:opacity-30 flex items-center justify-center`}
          onClick={() => {
            onChange(-1)
            // Re-focus the input so Safari mobile keyboard stays open
            onFocusField(fieldId)
          }}
          disabled={count === 0}
        >
          −
        </button>
        <button
          type="button"
          tabIndex={-1}
          className={`w-8 h-8 rounded ${colorClasses[color].plus} text-white font-bold text-xs flex items-center justify-center`}
          onClick={() => {
            onChange(1)
            // Re-focus the input so Safari mobile keyboard stays open
            onFocusField(fieldId)
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export interface DenominationRowProps {
  denomination: { value: number; label: string; type: 'bill' | 'coin' }
  currency: string
  namedCount: number
  anonymousCount: number
  onNamedChange: (delta: number) => void
  onNamedInput: (value: number) => void
  onAnonymousChange: (delta: number) => void
  onAnonymousInput: (value: number) => void
  /** Sequential tabIndex for the named input */
  namedTabIndex: number
  /** Sequential tabIndex for the anonymous input */
  anonymousTabIndex: number
  /** Ordered list of all field IDs for keyboard loop navigation */
  allFieldIds: string[]
  /** Callback to programmatically focus a field by ID */
  onFocusField: (id: string) => void
}

export function DenominationRow({
  denomination,
  currency,
  namedCount,
  anonymousCount,
  onNamedChange,
  onNamedInput,
  onAnonymousChange,
  onAnonymousInput,
  namedTabIndex,
  anonymousTabIndex,
  allFieldIds,
  onFocusField
}: DenominationRowProps) {
  const emoji = getCurrencyEmoji(currency, denomination.type)

  return (
    <div className="mb-4">
      <div className="text-xs sm:text-sm font-black text-center mb-2">
        {emoji} {denomination.label}
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-2 mb-1">
        <DenominationControls
          count={namedCount}
          onChange={onNamedChange}
          onInput={onNamedInput}
          color="blue"
          denomination={denomination.value}
          tabIndex={namedTabIndex}
          fieldIds={allFieldIds}
          onFocusField={onFocusField}
        />
        <DenominationControls
          count={anonymousCount}
          onChange={onAnonymousChange}
          onInput={onAnonymousInput}
          color="teal"
          denomination={denomination.value}
          tabIndex={anonymousTabIndex}
          fieldIds={allFieldIds}
          onFocusField={onFocusField}
        />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-2 mt-1">
        <div className="text-[9px] font-medium text-blue-600 dark:text-blue-400 text-center">
          {formatCurrencyAmount(namedCount * denomination.value, currency)}
        </div>
        <div className="text-[9px] font-medium text-teal-600 dark:text-teal-400 text-center">
          {formatCurrencyAmount(anonymousCount * denomination.value, currency)}
        </div>
      </div>
    </div>
  )
}
