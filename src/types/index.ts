// Chart preference types
export type ChartGroupByOption = 'category' | string // Allows custom field names
export type ChartMetricOption = 'amount' | 'count' | string // Allows custom field names

export interface ChartPreferences {
  group_by: ChartGroupByOption
  metric: ChartMetricOption
}

// Currency filtering types
// @MX:NOTE: CurrencyFilteredResult separates transactions into included/excluded based on currency match
export interface CurrencyFilteredResult<T = unknown> {
  included: T[]
  excluded: T[]
}

// @MX:NOTE: CurrencyMatchStatus indicates the currency matching state for a transaction
export type CurrencyMatchStatus = 'matched' | 'mismatched' | 'missing'

// Cash counter denomination types (SPEC-DENOM-001)
// @MX:NOTE: Denomination represents a single currency denomination with value, label, and type
export interface Denomination {
  value: number        // Numeric value for calculations
  label: string         // Display label (e.g., "200", "0.50")
  type: 'bill' | 'coin'  // Bill or coin classification
  currency?: string    // Associated currency code (optional for backwards compatibility)
}

// @MX:NOTE: CurrencyDenominations represents complete configuration for a currency including denominations, symbols, and metadata
export interface CurrencyDenominations {
  code: string          // ISO 4217 currency code
  name: string          // Full currency name
  symbol: string        // Currency symbol (, $, £, etc.)
  flag: string          // Flag emoji
  emojiBill: string     // Bill emoji
  emojiCoin: string     // Coin emoji
  denominations: Denomination[]  // List of denominations for this currency
}