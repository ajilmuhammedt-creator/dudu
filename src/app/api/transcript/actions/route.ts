// src/app/api/transcript/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidSchema } from '@/lib/validators';
import { DataStore } from '@/lib/data-store';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('flag'),
    turn_id: z.number(),
    session_id: guidSchema.optional(),
    reason: z.string().min(2).max(500)
  }),
  z.object({
    action: z.literal('dismiss_flag'),
    turn_id: z.number(),
    session_id: guidSchema.optional()
  }),
  z.object({
    action: z.literal('delete'),
    session_id: guidSchema
  })
]);

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  if (data.action === 'flag') {
    await DataStore.flagTurn(data.turn_id, 'demo-user-id', data.reason, data.session_id);
    return NextResponse.json({ success: true, message: 'Turn flagged successfully for review.' });
  }

  if (data.action === 'dismiss_flag') {
    const removed = await DataStore.dismissFlag(data.turn_id, data.session_id);
    return NextResponse.json({ success: true, removed, message: 'Flag dismissed.' });
  }

  if (data.action === 'delete') {
    await DataStore.deleteTurns(data.session_id);
    return NextResponse.json({ success: true, message: 'Transcript deleted. Session summary retained.' });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
