// src/app/api/devices/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/data-store';
import { resolveParentUser } from '@/lib/auth-helper';
import { guidSchema } from '@/lib/validators';

const assignSchema = z.object({
  device_id: guidSchema.optional().default('33333333-3333-3333-3333-333333333333'),
  child_id: guidSchema
});

export async function POST(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', message: parsed.error.issues.map((i) => i.message).join(', ') },
      { status: 400 }
    );
  }

  const owns = await DataStore.userOwnsChild(userId, parsed.data.child_id);
  if (!owns) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const device = await DataStore.assignDeviceChild(parsed.data.device_id, parsed.data.child_id);
  return NextResponse.json({ success: true, device });
}
