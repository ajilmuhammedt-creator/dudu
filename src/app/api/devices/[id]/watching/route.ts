// src/app/api/devices/[id]/watching/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { resolveParentUser } from '@/lib/auth-helper';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const device = await DataStore.getDeviceById(id);
  if (!device) {
    return NextResponse.json({ error: 'device_not_found' }, { status: 404 });
  }

  try {
    const watchingUntil = await DataStore.setDeviceWatching(device.id, 120);
    return NextResponse.json({
      success: true,
      watching_until: watchingUntil,
      fast_poll_s: 120
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'watching_failed', message: err?.message || 'Failed to update watching status' },
      { status: 500 }
    );
  }
}
