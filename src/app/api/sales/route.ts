import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sale, items } = await request.json()

    // Validation
    if (!sale || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Sale data and items are required' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { error: 'Each item must have product_id, quantity, and unit_price' },
          { status: 400 }
        )
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Item quantity must be greater than 0' },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    )
    
    const discountAmount = sale.discount_amount || 0
    const finalAmount = totalAmount - discountAmount

    // Create sale
    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_name: sale.customer_name?.trim() || null,
        customer_phone: sale.customer_phone?.trim() || null,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_method: sale.payment_method || 'cash',
        payment_status: sale.payment_status || 'paid',
        notes: sale.notes?.trim() || null,
        // tenant_id will be automatically set by RLS policy
      })
      .select()
      .single()

    if (saleError) {
      return NextResponse.json(
        { error: saleError.message },
        { status: 400 }
      )
    }

    // Create sale items
    const saleItems = items.map((item: any) => ({
      sale_id: newSale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
      // tenant_id will be automatically set by RLS policy
    }))

    const { data: newItems, error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)
      .select(`
        *,
        products (*)
      `)

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 400 }
      )
    }

    // Create finance record for income
    const { error: financeError } = await supabase
      .from('finances')
      .insert({
        type: 'income',
        amount: finalAmount,
        description: `Penjualan - ${newSale.invoice_number}`,
        category: 'Sales',
        reference_id: newSale.id,
        // tenant_id will be automatically set by RLS policy
      })

    if (financeError) {
      console.error('Error creating finance record:', financeError)
      // Don't fail the sale if finance record creation fails
    }

    return NextResponse.json({ 
      data: {
        sale: newSale,
        items: newItems
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}