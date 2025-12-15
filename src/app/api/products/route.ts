import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (*)
      `)
      .eq('is_active', true)

    if (category) {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query.order('name')

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
    const productData = await request.json()

    // Validation
    if (!productData.name || productData.sell_price < 0) {
      return NextResponse.json(
        { error: 'Product name and valid sell price are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name.trim(),
        description: productData.description?.trim() || null,
        buy_price: productData.buy_price || 0,
        sell_price: productData.sell_price,
        stock: productData.stock || 0,
        min_stock: productData.min_stock || 0,
        sku: productData.sku?.trim() || null,
        barcode: productData.barcode?.trim() || null,
        category_id: productData.category_id || null,
        is_active: productData.is_active !== false,
        // tenant_id will be automatically set by RLS policy
      })
      .select()
      .single()

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