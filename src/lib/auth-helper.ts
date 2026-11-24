// src/lib/auth-helper.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Resolves the currently authenticated parent user ID from:
 * 1. Supabase Auth session cookie
 * 2. Demo parent session cookie (`dudu_demo_session`)
 * 3. Bearer token in `Authorization` header (for automated tests / API clients)
 *
 * Returns null if unauthenticated.
 */
export async function resolveParentUser(req: NextRequest): Promise<string | null> {
  // 1. Try Supabase authenticated user session
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {}

  // 2. Try demo parent session cookie
  const demoCookie = req.cookies.get('dudu_demo_session')?.value;
  if (demoCookie && demoCookie.trim().length > 0) {
    return demoCookie.trim();
  }

  // 3. Try Authorization header
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  return null;
}
