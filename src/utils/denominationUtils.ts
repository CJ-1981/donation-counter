/**
 * @MX:NOTE: Utility functions for denomination calculations (SPEC-DENOM-001)
 *
 * Provides pure functions for working with currency-specific denominations
 * All functions are currency-aware and handle denomination state management
 */
import type { Denomination } from '../types'
import { getDenominations, getCurrencyInfo } from '../config/currencyDenominations'

/**
 * Create empty state for all denominations of a currency
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Record with all denomination values initialized to 0
 */
export function createEmptyDenominationState(currencyCode: string): Record<number, number> {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (acc, denom) => ({ ...acc, [denom.value]: 0 }),
    {} as Record<number, number>
  )
}

/**
 * Format currency amount using Intl.NumberFormat for proper decimal places
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @returns Formatted string with currency symbol and correct decimal places
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  // JPY and KRW have zero decimal places (integers)
  // Other currencies have 2 decimal places (EUR, USD, GBP, INR) or more
  const zeroDecimalCurrencies = ['JPY', 'KRW']
  const maximumFractionDigits = zeroDecimalCurrencies.includes(currencyCode) ? 0 : 2

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: maximumFractionDigits,
  }).format(amount)
}

/**
 * Calculate total amount from denomination counts
 * @param counts - Record of denomination values to counts
 * @param currencyCode - ISO 4217 currency code for denomination values
 * @returns Total amount calculated from denomination counts
 */
export function calculateDenominationTotal(
  counts: Record<number, number>,
  currencyCode: string
): number {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (sum, denom) => sum + (counts[denom.value] || 0) * denom.value,
    0
  )
}

/**
 * Calculate bills and coins breakdown from denomination counts
 * @param counts - Record of denomination values to counts
 * @param currencyCode - ISO 4217 currency code for denomination values
 * @returns Object with separate totals for bills and coins
 */
export function calculateDenominationBreakdown(
  counts: Record<number, number>,
  currencyCode: string
): { bills: number; coins: number } {
  const denominations = getDenominations(currencyCode)
  return denominations.reduce(
    (acc, denom) => {
      const amount = (counts[denom.value] || 0) * denom.value
      if (denom.type === 'bill') {
        acc.bills += amount
      } else {
        acc.coins += amount
      }
      return acc
    },
    { bills: 0, coins: 0 }
  )
}

/**
 * Get currency symbol with fallback
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol or currency code as fallback
 */
export function getDisplaySymbol(currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode)
  return info?.symbol || currencyCode
}

/**
 * Filter denominations by type
 * @param denominations - Array of denomination objects
 * @param type - 'bill' or 'coin' to filter by
 * @returns Filtered array of denominations matching the type
 */
export function filterDenominationsByType(
  denominations: Denomination[],
  type: 'bill' | 'coin'
): Denomination[] {
  return denominations.filter(denom => denom.type === type)
}

/**
 * Get denominations with data (count > 0 for either anonymous or named)
 * @param denominations - Array of denomination objects
 * @param anonymousCounts - Anonymous denomination counts
 * @param namedCounts - Named denomination counts
 * @returns Array of denominations with non-zero counts
 */
export function getDenominationsWithData(
  denominations: Denomination[],
  anonymousCounts: Record<number, number>,
  namedCounts: Record<number, number>
): Denomination[] {
  return denominations.filter(
    d => (namedCounts[d.value] || 0) > 0 || (anonymousCounts[d.value] || 0) > 0
  )
}

