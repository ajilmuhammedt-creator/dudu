// src/app/api/device/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateDevice } from '@/lib/device-auth';
import { DataStore } from '@/lib/data-store';
import { getNowUnixSeconds } from '@/lib/date-utils';

const sessionSchema = z.object({
  mode: z.enum(['learn', 'qa', 'fun', 'exam', 'scan']).default('learn'),
  subject: z.string().default('Mathematics'),
  chapter: z.string().default('General'),
  started_at: z.number().default(0),
  ended_at: z.number().default(0),
  minutes: z.number().default(0),
  questions: z.number().default(0),
  answered_right: z.number().default(0),
  off_topic: z.number().default(0),
  camera_used: z.boolean().default(false),
  turns: z
    .array(
      z.object({
        s: z.string().default('robot'),
        t: z.string().max(1000).default(''),
        at: z.number().optional(),
        off: z.boolean().optional(),
        correct: z.boolean().nullable().optional()
      })
    )
    .max(200)
    .default([]),
  events: z
    .array(
      z.object({
        type: z.string(),
        at: z.number().optional(),
        data: z.any().optional()
      })
    )
    .default([]),
  scans: z
    .array(
      z.object({
        photo_id: z.string().optional(),
        at: z.number().optional(),
        result: z
          .object({
            summary: z.string().optional(),
            right: z.number().optional(),
            total: z.number().optional(),
            confidence: z.number().optional(),
            items: z
              .array(
                z.object({
                  q: z.string().optional(),
                  child_answer: z.string().optional(),
                  correct_answer: z.string().optional(),
                  correct: z.boolean().optional(),
                  confidence: z.number().optional(),
                  tip: z.string().optional(),
                  reason: z.string().optional()
                })
              )
              .optional()
          })
          .optional()
      })
    )
    .default([])
});

export async function POST(req: NextRequest) {
  const auth = await authenticateDevice(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { device } = auth;
  if (!device.child_id) {
    return NextResponse.json({ error: 'device_not_paired' }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = sessionSchema.safeParse(body);
  const data = parsed.success ? parsed.data : sessionSchema.parse({});

  const nowSec = getNowUnixSeconds();
  const startSec = data.started_at > 0 ? data.started_at : (data.ended_at > 0 ? data.ended_at - data.minutes * 60 : nowSec);
  const endSec = data.ended_at > 0 ? data.ended_at : nowSec;

  const startedAtIso = new Date(startSec * 1000).toISOString();
  const endedAtIso = new Date(endSec * 1000).toISOString();

  // Determine score if scans exist
  let scoreRight: number | null = null;
  let scoreTotal: number | null = null;
  let hasCamera = data.camera_used;

  if (data.scans && data.scans.length > 0) {
    hasCamera = true;
    for (const scan of data.scans) {
      if (scan.result?.right !== undefined && scan.result?.total !== undefined) {
        scoreRight = (scoreRight || 0) + scan.result.right;
        scoreTotal = (scoreTotal || 0) + scan.result.total;
      }
    }
  }

  const { sessionId, needsReviewCount } = await DataStore.createSession(
    {
      device_id: device.id,
      child_id: device.child_id,
      mode: data.mode,
      subject: data.subject,
      chapter: data.chapter,
      started_at: startedAtIso,
      ended_at: endedAtIso,
      minutes: data.minutes || Math.max(1, Math.round((endSec - startSec) / 60)),
      questions: data.questions,
      answered_right: data.answered_right,
      off_topic: data.off_topic,
      camera_used: hasCamera,
      score_right: scoreRight,
      score_total: scoreTotal
    },
    data.turns,
    data.events,
    data.scans
  );

  return NextResponse.json({
    session_id: sessionId,
    needs_review: needsReviewCount
  });
}
