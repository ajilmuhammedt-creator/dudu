// src/app/api/device/status/route.ts
import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';

export async function GET() {
  const device =
    (await DataStore.getDeviceById('33333333-3333-3333-3333-333333333333')) ||
    (await DataStore.getDeviceByUid('DUDU-90932C9FC114'));

  if (!device) {
    return NextResponse.json({ paired: false, device: null });
  }

  const isPaired = Boolean(device.family_id && device.child_id);
  const child = isPaired && device.child_id ? await DataStore.getChildById(device.child_id) : null;

  return NextResponse.json({
    id: device.id,
    device_uid: device.device_uid,
    name: device.name,
    paired: isPaired,
    family_id: device.family_id,
    child_id: device.child_id,
    child_name: child?.name || (isPaired ? 'Arjun' : null),
    child_class: child?.cbse_class || 3,
    firmware: device.firmware,
    ip: device.ip,
    rssi: device.rssi,
    pairing_code: device.pairing_code,
    last_seen: device.last_seen
  });
}
