// src/app/api/cron/cleanup/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  let purgedCount = 0;

  try {
    // 1. Photos older than 30 days
    const { data: expiredPhotos } = await supabaseAdmin
      .from('photos')
      .select('id, path')
      .lt('created_at', thirtyDaysAgo);

    if (expiredPhotos && expiredPhotos.length > 0) {
      const paths = expiredPhotos.map((p) => p.path);
      await supabaseAdmin.storage.from('answer-photos').remove(paths);
      await supabaseAdmin.from('photos').delete().in('id', expiredPhotos.map((p) => p.id));
      purgedCount += expiredPhotos.length;
    }

    // 2. Photos of children whose keep_photos is false, EXCEPT those linked to a grade still in 'needs_review'
    const { data: noKeepSettings } = await supabaseAdmin
      .from('child_settings')
      .select('child_id')
      .eq('keep_photos', false);

    if (noKeepSettings && noKeepSettings.length > 0) {
      const childIds = noKeepSettings.map((s) => s.child_id);

      // Grades currently needing review
      const { data: pendingGrades } = await supabaseAdmin
        .from('grades')
        .select('photo_path')
        .eq('status', 'needs_review')
        .not('photo_path', 'is', null);

      const protectedPaths = new Set((pendingGrades || []).map((g) => g.photo_path));

      const { data: removablePhotos } = await supabaseAdmin
        .from('photos')
        .select('id, path')
        .in('child_id', childIds);

      const toDelete = (removablePhotos || []).filter((p) => !protectedPaths.has(p.path));

      if (toDelete.length > 0) {
        await supabaseAdmin.storage.from('answer-photos').remove(toDelete.map((p) => p.path));
        await supabaseAdmin.from('photos').delete().in('id', toDelete.map((p) => p.id));
        purgedCount += toDelete.length;
      }
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    purged_photos: purgedCount,
    timestamp: new Date().toISOString()
  });
}
