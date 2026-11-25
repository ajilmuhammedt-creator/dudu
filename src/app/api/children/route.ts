// src/app/api/children/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/data-store';
import { resolveParentUser } from '@/lib/auth-helper';
import { guidSchema } from '@/lib/validators';

const DEMO_FAMILY_ID = '11111111-1111-1111-1111-111111111111';

const createChildSchema = z.object({
  name: z.string().trim().min(1, 'First name is required').max(60),
  cbse_class: z.coerce.number().int().min(1).max(12),
  avatar: z.string().max(8).optional(),
  subjects: z.array(z.string()).optional()
});

const updateChildSchema = z.object({
  child_id: guidSchema,
  name: z.string().trim().min(1).max(60).optional(),
  cbse_class: z.coerce.number().int().min(1).max(12).optional(),
  avatar: z.string().max(8).optional(),
  archived: z.boolean().optional()
});

export async function GET(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const children = await DataStore.getChildrenByFamily(DEMO_FAMILY_ID);
  return NextResponse.json({ children });
}

export async function POST(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = createChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_child',
        message: parsed.error.issues.map((i) => i.message).join(', ')
      },
      { status: 400 }
    );
  }

  try {
    const { child, settings } = await DataStore.createChild({
      family_id: DEMO_FAMILY_ID,
      name: parsed.data.name,
      cbse_class: parsed.data.cbse_class,
      avatar: parsed.data.avatar,
      subjects: parsed.data.subjects
    });

    return NextResponse.json({ success: true, child, settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'create_failed', message: err?.message || 'Failed to save student' },
      { status: 500 }
    );
  }
}

async function handleArchive(userId: string, childId: string) {
  const owns = await DataStore.userOwnsChild(userId, childId);
  if (!owns) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  try {
    const child = await DataStore.archiveChild(childId);
    return NextResponse.json({ success: true, child });
  } catch (err: any) {
    if (err.message === 'ROBOT_PAIRED_TO_CHILD') {
      return NextResponse.json(
        {
          error: 'robot_paired',
          message: 'A robot is paired to this student. Move the robot to another student on the Devices page first.'
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'archive_failed', message: err.message || 'Failed to remove student' },
      { status: err.message === 'Child not found' ? 404 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = updateChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_update',
        message: parsed.error.issues.map((i) => i.message).join(', ')
      },
      { status: 400 }
    );
  }

  if (parsed.data.archived === true) {
    return handleArchive(userId, parsed.data.child_id);
  }

  const owns = await DataStore.userOwnsChild(userId, parsed.data.child_id);
  if (!owns) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  try {
    const { child, settings } = await DataStore.updateChild(parsed.data.child_id, {
      name: parsed.data.name,
      cbse_class: parsed.data.cbse_class,
      avatar: parsed.data.avatar
    });

    return NextResponse.json({ success: true, child, settings });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'update_failed', message: err.message || 'Failed to update child' },
      { status: err.message === 'Child not found' ? 404 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let childId = searchParams.get('child_id') || '';
  if (!childId) {
    try {
      const body = await req.json();
      childId = body.child_id || '';
    } catch {}
  }

  const parsed = guidSchema.safeParse(childId);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_child_id' }, { status: 400 });
  }

  return handleArchive(userId, parsed.data);
}
