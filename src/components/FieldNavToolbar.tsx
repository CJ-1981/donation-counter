import { useState, useEffect, useCallback } from 'react'

interface FieldNavToolbarProps {
  /** Ordered list of all focusable field IDs */
  fieldIds: string[]
  /** Callback to programmatically focus a field by ID */
  onFocusField: (id: string) => void
}

/**
 * Mobile-only floating toolbar that appears above the keyboard
 * when an input is focused. Provides Previous/Next/Done buttons
 * to navigate between denomination fields — works around iOS Safari's
 * native chevron limitation of ~4 fields.
 */
export function FieldNavToolbar({ fieldIds, onFocusField }: FieldNavToolbarProps) {
  const [activeFieldIdx, setActiveFieldIdx] = useState(-1)
  const [visible, setVisible] = useState(false)

  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      const idx = fieldIds.indexOf(target.id)
      if (idx !== -1) {
        setActiveFieldIdx(idx)
        setVisible(true)
      }
    }
  }, [fieldIds])

  const handleFocusOut = useCallback((e: FocusEvent) => {
    // Only hide if focus is leaving all inputs in our field list
    const related = e.relatedTarget as HTMLElement | null
    if (related && fieldIds.includes(related.id)) {
      const idx = fieldIds.indexOf(related.id)
      setActiveFieldIdx(idx)
      return // Still focused on one of our fields
    }
    // Small delay to avoid flash when moving between fields
    setTimeout(() => {
      setVisible(false)
      setActiveFieldIdx(-1)
    }, 100)
  }, [fieldIds])

  useEffect(() => {
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [handleFocusIn, handleFocusOut])

  const goToPrev = () => {
    if (activeFieldIdx <= 0) return
    const prevIdx = activeFieldIdx - 1
    setActiveFieldIdx(prevIdx)
    onFocusField(fieldIds[prevIdx])
  }

  const goToNext = () => {
    if (activeFieldIdx < 0 || activeFieldIdx >= fieldIds.length - 1) return
    const nextIdx = activeFieldIdx + 1
    setActiveFieldIdx(nextIdx)
    onFocusField(fieldIds[nextIdx])
  }

  const goToEnd = () => {
    // Jump to last field
    const lastIdx = fieldIds.length - 1
    setActiveFieldIdx(lastIdx)
    onFocusField(fieldIds[lastIdx])
  }

  const done = () => {
    // Blur the active field to dismiss keyboard
    const el = document.getElementById(fieldIds[activeFieldIdx])
    if (el) el.blur()
    setVisible(false)
    setActiveFieldIdx(-1)
  }

  if (!visible || fieldIds.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[400] bg-white dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] px-3 py-2 flex items-center justify-between gap-2 md:hidden">
      {/* Field counter */}
      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums min-w-[3rem] text-center">
        {activeFieldIdx + 1}/{fieldIds.length}
      </span>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        {/* |< (skip to start) */}
        <button
          type="button"
          onClick={() => {
            setActiveFieldIdx(0)
            onFocusField(fieldIds[0])
          }}
          disabled={activeFieldIdx <= 0}
          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center disabled:opacity-25 active:scale-95 transition-all"
          aria-label="First field"
        >
          ⟨⟨
        </button>

        {/* < (previous) */}
        <button
          type="button"
          onClick={goToPrev}
          disabled={activeFieldIdx <= 0}
          className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-lg flex items-center justify-center disabled:opacity-25 active:scale-95 transition-all"
          aria-label="Previous field"
        >
          ‹
        </button>

        {/* > (next) */}
        <button
          type="button"
          onClick={goToNext}
          disabled={activeFieldIdx >= fieldIds.length - 1}
          className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-lg flex items-center justify-center disabled:opacity-25 active:scale-95 transition-all"
          aria-label="Next field"
        >
          ›
        </button>

        {/* >| (skip to end) */}
        <button
          type="button"
          onClick={goToEnd}
          disabled={activeFieldIdx >= fieldIds.length - 1}
          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center disabled:opacity-25 active:scale-95 transition-all"
          aria-label="Last field"
        >
          ⟩⟩
        </button>
      </div>

      {/* Done */}
      <button
        type="button"
        onClick={done}
        className="px-5 h-10 rounded-lg bg-violet-600 text-white font-bold text-sm active:scale-95 transition-all"
      >
        Done
      </button>
    </div>
  )
}
