// src/app/api/controls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidSchema } from '@/lib/validators';
import { DataStore } from '@/lib/data-store';
import { hashPin } from '@/lib/crypto';
import { resolveParentUser } from '@/lib/auth-helper';

const controlsSchema = z.object({
  child_id: guidSchema.default('22222222-2222-2222-2222-222222222222'),
  subjects: z.array(z.string()).optional(),
  stay_on_syllabus: z.boolean().optional(),
  camera_exam: z.boolean().optional(),
  break_prompts: z.boolean().optional(),
  keep_photos: z.boolean().optional(),
  daily_limit_min: z.number().min(15).max(180).optional(),
  window_start: z.string().optional(),
  window_end: z.string().optional(),
  language: z.enum(['en', 'hi', 'ml']).optional(),
  wake_sensitivity: z.number().min(1).max(10).optional(),
  parent_pin: z.string().length(4).optional(),
  theme: z.enum(['light', 'dark', 'soft-blue', 'warm-orange']).optional(),
  robot_theme: z.enum(['day', 'night', 'cosmic', 'sunset']).optional()
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('child_id') || '22222222-2222-2222-2222-222222222222';

  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthenticated', message: 'Please sign in to view child settings.' },
      { status: 401 }
    );
  }

  const ownsChild = await DataStore.userOwnsChild(userId, childId);
  if (!ownsChild) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'You do not have permission to view controls for this child.' },
      { status: 403 }
    );
  }

  const settings = await DataStore.getChildSettings(childId);
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthenticated', message: 'Please sign in to save settings.' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsed = controlsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_controls',
        message: 'Invalid controls format: ' + parsed.error.issues.map((i) => i.message).join(', '),
        details: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const { child_id, parent_pin, ...rest } = parsed.data;

  // Authorization check: parent must own the child
  const ownsChild = await DataStore.userOwnsChild(userId, child_id);
  if (!ownsChild) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'You do not have permission to manage this child.' },
      { status: 403 }
    );
  }

  const updates: any = { ...rest };
  if (parent_pin) {
    updates.parent_pin_hash = hashPin(parent_pin);
  }

  const updatedSettings = await DataStore.updateChildSettings(child_id, updates);

  return NextResponse.json({
    success: true,
    settings: updatedSettings
  });
}
