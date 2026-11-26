// src/app/api/devices/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { resolveParentUser } from '@/lib/auth-helper';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_FAMILY_ID = '11111111-1111-1111-1111-111111111111';

async function authorizeDeviceAccess(req: NextRequest, deviceId: string) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return { error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  }

  const device = await DataStore.getDeviceById(deviceId);
  if (!device) {
    return { error: NextResponse.json({ error: 'device_not_found' }, { status: 404 }) };
  }

  const familyId = device.family_id || DEMO_FAMILY_ID;
  const inFamily = await DataStore.isUserInFamily(userId, familyId);
  if (!inFamily && userId !== 'demo-parent-sharma') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { userId, device };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await authorizeDeviceAccess(req, id);
  if ('error' in auth) return auth.error;

  const { device } = auth;
  const cmdIdParam = req.nextUrl.searchParams.get('cmd_id');
  const cmdId = cmdIdParam ? Number(cmdIdParam) : 0;

  const photos = await DataStore.getCameraPhotos(device.id, 6);
  const hasRealSupabase = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const enriched = await Promise.all(
    photos.map(async (p) => {
      let signedUrl = '';
      if (hasRealSupabase) {
        try {
          const { data } = await supabaseAdmin.storage
            .from(p.storage_bucket)
            .createSignedUrl(p.storage_path, 600);
          if (data?.signedUrl) signedUrl = data.signedUrl;
        } catch {}
      }
      return {
        id: p.id,
        device_id: p.device_id,
        child_id: p.child_id,
        cmd_id: p.cmd_id,
        created_at: p.created_at,
        signed_url: signedUrl
      };
    })
  );

  const cmdStatus =
    cmdId > 0 ? await DataStore.getPhotoCommandStatus(device.id, cmdId) : null;

  return NextResponse.json({
    photos: enriched,
    cmd_status: cmdStatus
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await authorizeDeviceAccess(req, id);
  if ('error' in auth) return auth.error;

  const { device } = auth;
  let photoId = req.nextUrl.searchParams.get('photo_id') || '';
  if (!photoId) {
    try {
      const body = await req.json();
      photoId = body.photo_id || '';
    } catch {}
  }

  if (!photoId) {
    return NextResponse.json({ error: 'missing_photo_id' }, { status: 400 });
  }

  const removed = await DataStore.deleteCameraPhoto(device.id, photoId);
  if (!removed) {
    return NextResponse.json({ error: 'photo_not_found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, deleted_id: removed.id });
}
