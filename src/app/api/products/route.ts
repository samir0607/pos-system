import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Join with categories and suppliers if possible
    const { data: products, error } = await supabase
      .from('products')
      .select('*, category:categories(*), supplier:suppliers(*)')
      .order('id', { ascending: false });

    if (error) throw error;
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          name: body.name,
          brand: body.brand,
          category_id: body.category_id,
          cost_price: body.cost_price,
          sell_price: body.sell_price,
          quantity: body.quantity,
          supplier_id: body.supplier_id,
        },
      ])
      .select('*, category:categories(*), supplier:suppliers(*)')
      .single();

    if (error) throw error;
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
  }
} 