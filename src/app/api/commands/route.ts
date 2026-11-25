// src/app/api/commands/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidSchema } from '@/lib/validators';
import { DataStore } from '@/lib/data-store';

const commandSchema = z.object({
  device_id: guidSchema,
  type: z.enum(['say', 'practice', 'rewrite', 'music', 'unpair', 'refresh']),
  arg: z.string().max(250).default('')
});

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_command', details: parsed.error.issues }, { status: 400 });
  }

  const { device_id, type, arg } = parsed.data;

  // Max 120 chars for 'say'
  if (type === 'say' && arg.length > 120) {
    return NextResponse.json({ error: 'say_too_long', message: 'Say messages are limited to 120 characters.' }, { status: 400 });
  }

  const device = await DataStore.getDeviceById(device_id);
  if (!device) {
    return NextResponse.json({ error: 'device_not_found' }, { status: 404 });
  }

  const cmd = await DataStore.createCommand(device.id, type, arg);

  return NextResponse.json({
    success: true,
    command: cmd
  });
}
