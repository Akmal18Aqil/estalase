import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Type definitions
export interface User {
  id: string
  auth_id: string
  tenant_id: string
  name: string
  email: string
  phone?: string
  role: 'owner' | 'staff'
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  owner_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id?: string
  name: string
  description?: string
  buy_price: number
  sell_price: number
  stock: number
  min_stock: number
  sku?: string
  barcode?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  tenant_id: string
  invoice_number: string
  customer_name?: string
  customer_phone?: string
  total_amount: number
  discount_amount: number
  final_amount: number
  payment_method: 'cash' | 'transfer' | 'card' | 'ewallet'
  payment_status: 'paid' | 'pending' | 'cancelled'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: string
  tenant_id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

export interface Finance {
  id: string
  tenant_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category?: string
  reference_id?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// Auth helper functions
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user data:', JSON.stringify(error, null, 2))
    return null
  }

  return userData
}

export async function getUserTenant(): Promise<Tenant | null> {
  if (!supabase) return null

  const user = await getCurrentUser()

  if (!user) return null

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', user.tenant_id)
    .single()

  if (error) {
    console.error('Error fetching tenant data:', error)
    return null
  }

  return tenant
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating tenant:', error)
    return null
  }

  return data
}

// Product functions
export async function getProducts(): Promise<Product[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export async function createProduct(product: Omit<Product, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  if (!supabase) return null

  const user = await getCurrentUser()
  if (!user || !user.tenant_id) {
    console.error('Error creating product: User not authenticated or no tenant found')
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      tenant_id: user.tenant_id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!supabase) return false

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

// Category functions
export async function getCategories(): Promise<Category[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

// Sales functions
export async function createSale(sale: Omit<Sale, 'id' | 'tenant_id' | 'invoice_number' | 'created_at' | 'updated_at'>, items: Omit<SaleItem, 'id' | 'tenant_id' | 'sale_id' | 'created_at' | 'updated_at'>[]): Promise<{ sale: Sale; items: SaleItem[] } | null> {
  if (!supabase) return null

  const user = await getCurrentUser()
  if (!user || !user.tenant_id) {
    console.error('Error creating sale: User not authenticated or no tenant found')
    return null
  }

  // Start a transaction
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert({
      ...sale,
      tenant_id: user.tenant_id
    })
    .select()
    .single()

  if (saleError) {
    console.error('Error creating sale:', JSON.stringify(saleError, null, 2))
    return null
  }

  // Insert sale items
  const saleItems = items.map(item => ({
    ...item,
    sale_id: newSale.id,
    tenant_id: user.tenant_id
  }))

  const { data: newItems, error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)
    .select()

  if (itemsError) {
    console.error('Error creating sale items:', JSON.stringify(itemsError, null, 2))
    return null
  }

  // Auto-record to Finance
  const { error: financeError } = await supabase
    .from('finances')
    .insert({
      tenant_id: user.tenant_id,
      type: 'income',
      category: 'Penjualan',
      amount: newSale.final_amount,
      description: `Penjualan Invoice #${newSale.invoice_number}`,
      reference_id: newSale.id,
      created_by: user.id
    })

  if (financeError) {
    console.error('Error auto-creating finance record:', financeError)
    // We don't return null here because the sale itself was successful
  }

  return {
    sale: newSale,
    items: newItems || []
  }
}

export async function getSales(limit: number = 50): Promise<Sale[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (*)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }

  return data || []
}

// Finance functions
export async function getFinances(type?: 'income' | 'expense'): Promise<Finance[]> {
  if (!supabase) return []

  let query = supabase
    .from('finances')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching finances:', error)
    return []
  }

  return data || []
}

export async function createFinance(finance: Omit<Finance, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<Finance | null> {
  if (!supabase) return null

  const user = await getCurrentUser()
  if (!user || !user.tenant_id) {
    console.error('Error creating finance: User not authenticated or no tenant found')
    return null
  }

  const { data, error } = await supabase
    .from('finances')
    .insert({
      ...finance,
      tenant_id: user.tenant_id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating finance:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

// Dashboard statistics
export async function getDashboardStats() {
  if (!supabase) return {
    totalProducts: 0,
    todaySales: 0,
    todaySalesCount: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Get all data in parallel for better performance
    const [
      productsResult,
      todaySalesResult,
      monthlyFinancesResult
    ] = await Promise.all([
      // Total products
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('is_active', true),

      // Today's sales
      supabase
        .from('sales')
        .select('final_amount', { count: 'exact' })
        .eq('payment_status', 'paid')
        .gte('created_at', today.toISOString()),

      // This month's finances
      supabase
        .from('finances')
        .select('amount, type', { count: 'exact' })
        .gte('created_at', startOfMonth.toISOString())
    ])

    const totalProducts = productsResult.count || 0
    const todaySalesData = todaySalesResult.data || []
    const monthlyFinancesData = monthlyFinancesResult.data || []

    const todaySales = todaySalesData.reduce((sum, sale) => sum + sale.final_amount, 0)
    const todaySalesCount = todaySalesResult.count || 0

    const monthlyIncome = monthlyFinancesData
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0)

    const monthlyExpense = monthlyFinancesData
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0)

    return {
      totalProducts,
      todaySales,
      todaySalesCount,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)

    return {
      totalProducts: 0,
      todaySales: 0,
      todaySalesCount: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlyBalance: 0
    }
  }
}