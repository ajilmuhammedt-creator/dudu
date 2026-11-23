// src/app/api/device/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateDevice } from '@/lib/device-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DataStore } from '@/lib/data-store';

export async function POST(req: NextRequest) {
  const auth = await authenticateDevice(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { device } = auth;

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('image/jpeg')) {
    return NextResponse.json({ error: 'invalid_content_type', expected: 'image/jpeg' }, { status: 400 });
  }

  // Max 1MB
  const arrayBuffer = await req.arrayBuffer();
  if (arrayBuffer.byteLength > 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large', max_bytes: 1048576 }, { status: 413 });
  }

  const photoId = crypto.randomUUID();
  const familyId = device.family_id || 'unpaired';
  const childId = device.child_id || 'unpaired';
  const storagePath = `answer-photos/${familyId}/${childId}/${photoId}.jpg`;

  try {
    await supabaseAdmin.storage
      .from('answer-photos')
      .upload(`${familyId}/${childId}/${photoId}.jpg`, Buffer.from(arrayBuffer), {
        contentType: 'image/jpeg',
        upsert: true
      });
  } catch {
    // Tolerant storage upload in dev
  }

  if (device.child_id) {
    await DataStore.savePhotoRecord(device.id, device.child_id, storagePath);
  }

  return NextResponse.json({
    photo_id: photoId
  });
}
