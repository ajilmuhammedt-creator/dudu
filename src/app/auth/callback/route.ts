// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DataStore } from '@/lib/data-store';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        // Link authenticated parent to demo family
        await DataStore.linkUserToFamily(data.user.id, '11111111-1111-1111-1111-111111111111', 'parent');
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {}
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
