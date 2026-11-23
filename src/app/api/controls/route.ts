// src/app/api/controls/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/data-store';
import { hashPin } from '@/lib/crypto';

const controlsSchema = z.object({
  child_id: z.string().uuid(),
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
  parent_pin: z.string().length(4).optional()
});

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = controlsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_controls', details: parsed.error.issues }, { status: 400 });
  }

  const { child_id, parent_pin, ...rest } = parsed.data;

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
