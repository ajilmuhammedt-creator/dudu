// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}

  const res = NextResponse.json({ success: true });
  res.cookies.set('dudu_demo_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return res;
}
