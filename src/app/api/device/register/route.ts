// src/app/api/device/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateDeviceToken, generatePairingCode, sha256 } from '@/lib/crypto';
import { DataStore } from '@/lib/data-store';

const registerSchema = z.object({
  device_uid: z.string().min(3).max(64),
  firmware: z.string().default('1.0')
});

export async function POST(req: NextRequest) {
  // Rate-limit register to 60 per hour per IP for development
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const rateLimit = checkRateLimit(`register:${ip}`, 60, 3600 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSec) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', details: parsed.error.issues }, { status: 400 });
  }

  const { device_uid, firmware } = parsed.data;
  const rawToken = generateDeviceToken();
  const tokenHash = sha256(rawToken);
  const pairingCode = generatePairingCode();

  const { device } = await DataStore.registerDevice(device_uid, firmware, tokenHash, pairingCode);
  const isPaired = Boolean(device.family_id && device.child_id);

  // Return strictly flat JSON
  return NextResponse.json({
    device_token: rawToken,
    paired: isPaired,
    pairing_code: isPaired ? '' : (device.pairing_code || pairingCode)
  });
}
