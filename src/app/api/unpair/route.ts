// src/app/api/unpair/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidSchema } from '@/lib/validators';
import { DataStore } from '@/lib/data-store';

const unpairSchema = z.object({
  device_id: guidSchema.optional().default('33333333-3333-3333-3333-333333333333')
});

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }

  const parsed = unpairSchema.safeParse(body);
  const deviceId = parsed.success && parsed.data.device_id
    ? parsed.data.device_id
    : '33333333-3333-3333-3333-333333333333';

  const device = (await DataStore.getDeviceById(deviceId)) || (await DataStore.getDeviceByUid('DUDU-90932C9FC114'));
  if (!device) {
    return NextResponse.json({ error: 'device_not_found' }, { status: 404 });
  }

  // 1. Dispatch 'unpair' command to robot firmware
  await DataStore.createCommand(device.id, 'unpair', '');

  // 2. Clear association in Supabase and DataStore
  await DataStore.unpairDevice(device.id);

  return NextResponse.json({ success: true, message: 'Device unpaired successfully.' });
}
