import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('id', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, contact, address } = body;
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert([{ name, contact, address }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(supplier);
} 