import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, context: any) {
  const { id } = await context.params;
  const { data: supplier, error } = await supabase
	.from('suppliers')
	.select('*')
	.eq('id', id)
	.single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(supplier);
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  const body = await request.json();
  const { name, contact, address } = body;
  const { data: supplier, error } = await supabase
	.from('suppliers')
	.update({
	  name,
	  contact,
	  address
	})
	.eq('id', id)
	.select('*')
	.single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(supplier);
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = await context.params;
  const { error } = await supabase
	.from('suppliers')
	.delete()
	.eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 