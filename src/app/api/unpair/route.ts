// src/app/api/unpair/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/data-store';

const unpairSchema = z.object({
  device_id: z.string().uuid()
});

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = unpairSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_device_id' }, { status: 400 });
  }

  const { device_id } = parsed.data;
  const device = await DataStore.getDeviceById(device_id);
  if (!device) {
    return NextResponse.json({ error: 'device_not_found' }, { status: 404 });
  }

  // Dispatch 'unpair' command to robot firmware
  await DataStore.createCommand(device.id, 'unpair', '');

  // Clear association
  await DataStore.unpairDevice(device.id);

  return NextResponse.json({ success: true, message: 'Device unpaired successfully.' });
}
