import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface Product {
  id: number
  shopify_product_id: string
  title: string
  price: number
  bidit_enabled: boolean
  min_discount_percent: number
  max_discount_percent: number
  created_at: string
}

export interface Bid {
  id: number
  bid_session_id: number
  user_id: number
  product_id: number
  shopify_variant_id?: number
  amount: number
  status: 'pending' | 'rejected' | 'accepted' | 'countered'
  counter_offer?: number
  created_at: string
  responded_at?: string
}

export interface BidLog {
  id: number
  bid_id?: number
  bid_session_id?: number
  shopify_variant_id?: number
  event_type: string
  event_data?: any
  created_at: string
}

export interface User {
  id: number
  auth_user_id: string
  created_at: string
} 