import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
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

    const stats = {
      totalProducts,
      todaySales,
      todaySalesCount,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}