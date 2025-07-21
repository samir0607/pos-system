import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total_amount } = body;

    // Inventory validation: check if requested quantity is available for each item
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();
      if (productError) throw productError;
      if (!product || product.quantity < item.quantity_sold) {
        return NextResponse.json({ error: `Insufficient inventory for product.` }, { status: 400 });
      }
    }

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          total_amount,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // Insert sale items
    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity_sold: item.quantity_sold,
      sell_price: item.sell_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // Update product quantities
    for (const item of items) {
      const { error: updateError } = await supabase.rpc('decrement_product_quantity', {
        product_id: item.product_id,
        amount: item.quantity_sold,
      });

      if (updateError) throw updateError;
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items (
          *,
          product:products (*)
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
} 