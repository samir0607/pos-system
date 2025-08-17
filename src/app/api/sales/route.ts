import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      items, 
      subtotal,
      discount_amount,
      total_amount, 
      customer_name, 
      customer_phone, 
      customer_address 
    } = body;

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

    // Create sale with customer information
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          customer_name,
          customer_phone,
          customer_address,
          subtotal,
          discount_amount,
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
      sell_price: item.sell_price,
      unit_discount: item.unit_discount,
      net_price: item.net_price,
      quantity_sold: item.quantity_sold,
      total_price: item.amount,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // Update product quantities
    for (const item of items) {
      // First get current quantity
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', item.product_id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Then update with new quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          quantity: product.quantity - item.quantity_sold 
        })
        .eq('id', item.product_id);

      if (updateError) throw updateError;
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ 
      error: 'Error creating sale', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: sale, error } = await supabase
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
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
  }
} 