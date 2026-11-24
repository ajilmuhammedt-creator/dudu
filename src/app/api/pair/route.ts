// src/app/api/pair/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidSchema } from '@/lib/validators';
import { checkRateLimit } from '@/lib/rate-limit';
import { DataStore } from '@/lib/data-store';

const pairSchema = z.object({
  code: z.string().transform((v) => v.replace(/\s+/g, '')),
  child_id: guidSchema
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // Rate limit: 5 tries per 10 minutes per IP/user
  const rateLimit = checkRateLimit(`pair:${ip}`, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'too_many_attempts', message: 'Too many pairing attempts. Please wait 10 minutes.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSec) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = pairSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', message: 'Please enter a valid 6-digit code.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { code, child_id } = parsed.data;

  // 1. Verify child exists
  const child = await DataStore.getChildById(child_id);
  if (!child) {
    return NextResponse.json(
      { error: 'child_not_found', message: 'Child profile not found.' },
      { status: 404 }
    );
  }

  // 2. Find device with this active pairing code
  const device = await DataStore.getDeviceByPairingCode(code);
  if (!device) {
    return NextResponse.json(
      { error: 'invalid_code', message: 'Wrong or expired 6-digit code. Check the robot screen.' },
      { status: 400 }
    );
  }

  // 3. Check if robot is already paired to another family
  if (device.family_id && device.family_id !== child.family_id) {
    return NextResponse.json(
      {
        error: 'already_paired',
        message: 'This robot is already paired to another family. It must be unpaired from that account first.'
      },
      { status: 409 }
    );
  }

  // 4. Pair device to family and child
  const updatedDevice = await DataStore.pairDevice(device.id, child.family_id, child.id);

  return NextResponse.json({
    success: true,
    device: {
      id: updatedDevice.id,
      name: updatedDevice.name,
      device_uid: updatedDevice.device_uid,
      child_id: updatedDevice.child_id
    }
  });
}
