// Database Types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

// Chart preference types
export type ChartGroupByOption = 'category' | string // Allows custom field names
export type ChartMetricOption = 'amount' | 'count' | string // Allows custom field names

export interface ChartPreferences {
  group_by: ChartGroupByOption
  metric: ChartMetricOption
}

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  template_id?: string
  settings?: {
    currency: string
    date_format: string
    notifications_enabled: boolean
    custom_fields?: Array<{
      name: string
      type: 'text' | 'number' | 'date' | 'select'
      options?: string[] // For select type
    }>
    custom_field_values?: Record<string, string[]>
    default_date_period?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all'
    // Chart preferences with proper types
    category_chart_group_by?: ChartGroupByOption
    category_chart_metric?: ChartMetricOption
    time_chart_group_by?: ChartGroupByOption
    time_chart_metric?: ChartMetricOption
    chart_mode?: 'cumulative' | 'absolute'
  }
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
}

export interface Category {
  id: string
  project_id: string
  name: string
  color: string
  parent_id?: string
  order: number
  created_at: string
}

export interface Transaction {
  id: string
  project_id: string
  amount: number
  currency_code: string
  category_id: string
  date: string
  description?: string
  receipt_url?: string
  created_by: string
  status: 'pending' | 'approved' | 'rejected'
  custom_data?: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface Invitation {
  id: string
  project_id: string
  email: string
  role: 'member' | 'viewer'
  invited_by: string
  token: string
  expires_at: string
  accepted: boolean
  created_at: string
}

export interface Template {
  id: string
  name: string
  description?: string
  schema: Category[]
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// App Types
export interface SupabaseConfig {
  url: string
  anonKey: string
}

export type AuthState = {
  user: User | null
  session: unknown | null
  loading: boolean
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer'

export interface ProjectWithMemberInfo extends Project {
  member_count?: number
  user_role?: Role
}

// Currency filtering types
// @MX:NOTE: CurrencyFilteredResult separates transactions into included/excluded based on currency match
export interface CurrencyFilteredResult<T = Transaction> {
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
