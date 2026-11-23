// src/lib/device-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { sha256 } from './crypto';
import { checkRateLimit } from './rate-limit';
import { DataStore, DeviceRecord } from './data-store';

export async function authenticateDevice(
  req: NextRequest
): Promise<{ device: DeviceRecord } | { errorResponse: NextResponse }> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json({ error: 'bad_token' }, { status: 401 })
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      errorResponse: NextResponse.json({ error: 'bad_token' }, { status: 401 })
    };
  }

  const tokenHash = sha256(token);
  const device = await DataStore.getDeviceByTokenHash(tokenHash);

  if (!device) {
    return {
      errorResponse: NextResponse.json({ error: 'bad_token' }, { status: 401 })
    };
  }

  // Rate limit: 120 per minute per device
  const rateLimit = checkRateLimit(`device:${device.id}`, 120, 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      errorResponse: NextResponse.json(
        { error: 'rate_limited' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSec) }
        }
      )
    };
  }

  return { device };
}
