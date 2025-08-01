import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if users table exists and get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      userCount: users?.length || 0,
      users: users?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        // Don't include password in response for security
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 