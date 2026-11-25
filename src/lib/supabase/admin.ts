// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

// Server-only admin client using service_role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yqviyubyjmwqtprywval.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_dummy_key_fallback';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
  },
});
