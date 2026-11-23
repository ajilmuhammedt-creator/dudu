// src/app/api/review/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/data-store';

const reviewSchema = z.object({
  grade_id: z.string().uuid(),
  decision: z.enum(['correct', 'half', 'wrong', 'rewrite'])
});

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const { grade_id, decision } = parsed.data;

  // Find grade
  const grades = await DataStore.getGrades('22222222-2222-2222-2222-222222222222');
  const grade = grades.find((g) => g.id === grade_id);

  if (!grade) {
    return NextResponse.json({ error: 'grade_not_found' }, { status: 404 });
  }

  if (decision === 'rewrite') {
    // Find device for this child
    const device = await DataStore.getDeviceById('33333333-3333-3333-3333-333333333333');
    if (device) {
      await DataStore.createCommand(device.id, 'rewrite', `${grade.id}|${grade.question}`);
    }
    return NextResponse.json({
      success: true,
      action: 'rewrite_dispatched',
      message: 'EduBuddy will ask the child to rewrite their answer.'
    });
  }

  let marksAwarded = 0;
  if (decision === 'correct') {
    marksAwarded = grade.marks_total;
  } else if (decision === 'half') {
    marksAwarded = grade.marks_total / 2;
  } else if (decision === 'wrong') {
    marksAwarded = 0;
  }

  const updated = await DataStore.resolveGrade(grade.id, marksAwarded);

  return NextResponse.json({
    success: true,
    grade: updated
  });
}
