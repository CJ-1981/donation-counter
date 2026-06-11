/**
 * @MX:NOTE: Currency-specific denomination configurations for cash counter feature (SPEC-DENOM-001)
 *
 * Provides denomination data for 7 currencies (EUR, USD, GBP, JPY, KRW, CNY, INR)
 * Each currency has bills and coins with real-world denomination values
 */
import type { Denomination, CurrencyDenominations } from '../types'

/**
 * Currency denomination configurations for all supported currencies
 */
export const CURRENCY_DENOMINATIONS: Record<string, CurrencyDenominations> = {
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '',
    flag: '🇪🇺',
    emojiBill: '💶',
    emojiCoin: '⚪',
    denominations: [
      { value: 200, label: '200', type: 'bill' },
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.20, label: '0.20', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
      { value: 0.02, label: '0.02', type: 'coin' },
      { value: 0.01, label: '0.01', type: 'coin' },
    ],
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    emojiBill: '💵',
    emojiCoin: '⚪',
    denominations: [
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'bill' },
      { value: 1, label: '1', type: 'bill' },
      { value: 0.25, label: '0.25', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
      { value: 0.01, label: '0.01', type: 'coin' },
    ],
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    emojiBill: '💷',
    emojiCoin: '⚪',
    denominations: [
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.20, label: '0.20', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
      { value: 0.02, label: '0.02', type: 'coin' },
      { value: 0.01, label: '0.01', type: 'coin' },
    ],
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    emojiBill: '💴',
    emojiCoin: '⚪',
    denominations: [
      { value: 10000, label: '10000', type: 'bill' },
      { value: 5000, label: '5000', type: 'bill' },
      { value: 2000, label: '2000', type: 'bill' },
      { value: 1000, label: '1000', type: 'bill' },
      { value: 500, label: '500', type: 'coin' },
      { value: 100, label: '100', type: 'coin' },
      { value: 50, label: '50', type: 'coin' },
      { value: 10, label: '10', type: 'coin' },
      { value: 5, label: '5', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
    ],
  },
  KRW: {
    code: 'KRW',
    name: 'Korean Won',
    symbol: '원',
    flag: '🇰🇷',
    emojiBill: '💵',
    emojiCoin: '⚪',
    denominations: [
      { value: 50000, label: '50000', type: 'bill' },
      { value: 10000, label: '10000', type: 'bill' },
      { value: 5000, label: '5000', type: 'bill' },
      { value: 1000, label: '1000', type: 'bill' },
      { value: 500, label: '500', type: 'coin' },
      { value: 100, label: '100', type: 'coin' },
      { value: 50, label: '50', type: 'coin' },
      { value: 10, label: '10', type: 'coin' },
    ],
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    flag: '🇨🇳',
    emojiBill: '💴',
    emojiCoin: '⚪',
    denominations: [
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
    ],
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    emojiBill: '💵',
    emojiCoin: '⚪',
    denominations: [
      { value: 2000, label: '2000', type: 'bill' },
      { value: 500, label: '500', type: 'bill' },
      { value: 200, label: '200', type: 'bill' },
      { value: 100, label: '100', type: 'bill' },
      { value: 50, label: '50', type: 'bill' },
      { value: 20, label: '20', type: 'bill' },
      { value: 10, label: '10', type: 'bill' },
      { value: 5, label: '5', type: 'bill' },
      { value: 2, label: '2', type: 'coin' },
      { value: 1, label: '1', type: 'coin' },
      { value: 0.50, label: '0.50', type: 'coin' },
      { value: 0.25, label: '0.25', type: 'coin' },
      { value: 0.10, label: '0.10', type: 'coin' },
      { value: 0.05, label: '0.05', type: 'coin' },
    ],
  },
}

/**
 * Get denominations for a specific currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Array of denomination objects for the currency, or EUR denominations as fallback
 */
export function getDenominations(currencyCode: string): Denomination[] {
  return CURRENCY_DENOMINATIONS[currencyCode]?.denominations || CURRENCY_DENOMINATIONS.EUR.denominations
}

/**
 * Get currency configuration for a specific currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency configuration object, or EUR configuration as fallback
 */
export function getCurrencyInfo(currencyCode: string): CurrencyDenominations {
  return CURRENCY_DENOMINATIONS[currencyCode] || CURRENCY_DENOMINATIONS.EUR
}

/**
 * Get currency symbol for a specific currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '', '£')
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_DENOMINATIONS[currencyCode]?.symbol ?? currencyCode
}

/**
 * Get currency emoji for bill or coin
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @param type - 'bill' or 'coin' to get specific emoji
 * @returns Currency emoji (e.g., '💵', '⚪')
 */
export function getCurrencyEmoji(currencyCode: string, type: 'bill' | 'coin'): string {
  const currencyInfo = CURRENCY_DENOMINATIONS[currencyCode] || CURRENCY_DENOMINATIONS.EUR
  return type === 'bill' ? currencyInfo.emojiBill : currencyInfo.emojiCoin
}

/**
 * Get all supported currencies
 * @returns Array of all currency configuration objects
 */
export function getSupportedCurrencies(): CurrencyDenominations[] {
  return Object.values(CURRENCY_DENOMINATIONS)
}
