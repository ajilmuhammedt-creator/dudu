// src/app/api/auth/link-demo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DataStore } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      userEmail = user.email || null;
    }
  } catch {}

  try {
    const body = await req.json();
    if (body.user_id && !userId) {
      userId = body.user_id;
    }
    if (body.email && !userEmail) {
      userEmail = body.email;
    }
  } catch {}

  const finalUserId = userId || 'demo-parent-sharma';
  await DataStore.linkUserToFamily(finalUserId, '11111111-1111-1111-1111-111111111111', 'parent');

  return NextResponse.json({
    success: true,
    user_id: finalUserId,
    email: userEmail || 'parent@sharma.demo',
    family_id: '11111111-1111-1111-1111-111111111111',
    child_id: '22222222-2222-2222-2222-222222222222',
    linked: true
  });
}
