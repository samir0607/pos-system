import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, context: any) {
  const { id } = await context.params;
  const { data: product, error } = await supabase
    .from('products')
    .select('*, category:categories(*), supplier:suppliers(*)')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  const body = await request.json();
  const { name, brand, cost_price, sell_price, quantity, category_id, supplier_id } = body;
  const { data: product, error } = await supabase
    .from('products')
    .update({
      name,
      brand,
      cost_price,
      sell_price,
      quantity,
      category_id,
      supplier_id,
    })
    .eq('id', id)
    .select('*, category:categories(*), supplier:suppliers(*)')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = await context.params;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 