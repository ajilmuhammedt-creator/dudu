// src/app/api/report/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { DataStore } from '@/lib/data-store';
import { getKolkataMidnightToday } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function generateDynamicFallbackPdf(params: {
  childName: string;
  cbseClass: number;
  subjectsText: string;
  studyTime: string;
  sessionsCount: number;
  examsTaken: number;
  avgScore: string;
  activePctText: string;
  distractions: number;
  sleepyChecks: number;
  insight: string;
}): Buffer {
  const lines = [
    `BT`,
    `/F1 20 Tf`,
    `40 780 Td`,
    `(EduBuddy Parent - Weekly Progress Report) Tj`,
    `/F1 12 Tf`,
    `0 -30 Td`,
    `(Student: ${escapePdfText(params.childName)} | CBSE Class ${params.cbseClass} | ${escapePdfText(params.subjectsText)}) Tj`,
    `0 -24 Td`,
    `(Study Time: ${escapePdfText(params.studyTime)} | Sessions: ${params.sessionsCount} | Exams: ${params.examsTaken} | Avg Score: ${escapePdfText(params.avgScore)}) Tj`,
    `0 -24 Td`,
    `(Attention: Active ${escapePdfText(params.activePctText)} | Distractions: ${params.distractions} | Sleepy checks: ${params.sleepyChecks}) Tj`,
    `0 -30 Td`,
    `(Summary: ${escapePdfText(params.insight)}) Tj`,
    `ET`
  ].join('\n');

  const streamLen = Buffer.byteLength(lines, 'utf-8');
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${lines}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const header = `%PDF-1.4\n`;
  const off1 = Buffer.byteLength(header, 'utf-8');
  const off2 = off1 + Buffer.byteLength(obj1, 'utf-8');
  const off3 = off2 + Buffer.byteLength(obj2, 'utf-8');
  const off4 = off3 + Buffer.byteLength(obj3, 'utf-8');
  const off5 = off4 + Buffer.byteLength(obj4, 'utf-8');
  const xrefOff = off5 + Buffer.byteLength(obj5, 'utf-8');

  const pad = (n: number) => String(n).padStart(10, '0');
  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(off1)} 00000 n \n${pad(off2)} 00000 n \n${pad(off3)} 00000 n \n${pad(off4)} 00000 n \n${pad(off5)} 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF`;

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref, 'utf-8');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('child_id') || '22222222-2222-2222-2222-222222222222';

  const [child, settings, allSessions] = await Promise.all([
    DataStore.getChildById(childId),
    DataStore.getChildSettings(childId),
    DataStore.getSessions(childId)
  ]);

  const childName = child?.name || 'Arjun';
  const cbseClass = child?.cbse_class || 3;
  const subjectsText = (settings?.subjects || []).join(', ') || 'General';

  const kolkataMidnight = getKolkataMidnightToday();
  const sevenDaysAgo = new Date(kolkataMidnight.getTime() - 6 * 86400000);
  const weekSessions = allSessions.filter((s) => new Date(s.started_at) >= sevenDaysAgo);

  const weekMinutes = weekSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const hours = Math.floor(weekMinutes / 60);
  const mins = weekMinutes % 60;
  const studyTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const weekExams = weekSessions.filter((s) => s.score_total !== null && s.score_total > 0);
  const avgScore =
    weekExams.length > 0
      ? `${Math.round(
          (weekExams.reduce((acc, s) => acc + ((s.score_right || 0) / (s.score_total || 1)), 0) /
            weekExams.length) *
            100
        )}%`
      : '-';

  const distractions = weekSessions.reduce((acc, s) => acc + (s.distractions ?? s.off_topic ?? 0), 0);
  const sleepyChecks = weekSessions.reduce((acc, s) => acc + (s.sleepy_checks ?? 0), 0);
  const activeSessions = weekSessions.filter((s) => (s.active_pct ?? -1) >= 0);
  const activePctText =
    activeSessions.length > 0
      ? `${Math.round(
          activeSessions.reduce((acc, s) => acc + (s.active_pct ?? 0), 0) / activeSessions.length
        )}%`
      : '-';

  const insight =
    weekSessions.length === 0
      ? `No study sessions recorded for ${childName} this week yet.`
      : `${weekSessions.length} session(s) recorded this week | ${distractions} distraction(s) | ${sleepyChecks} sleepy check(s) | Active ${activePctText}.`;

  const safeSlug = childName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'student';

  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { ReportDocument } = await import('@/lib/pdf/report-document');

    const docElement = React.createElement(ReportDocument, {
      childName,
      cbseClass,
      subjectsText,
      studyTime,
      sessionsCount: weekSessions.length,
      examsTaken: weekExams.length,
      avgScore,
      activePctText,
      distractions,
      sleepyChecks,
      insight
    });

    const pdfBuffer = await renderToBuffer(docElement as any);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="edubuddy-${safeSlug}-weekly-report.pdf"`
      }
    });
  } catch (error: any) {
    console.warn('React-PDF serverless notice, returning resilient PDF:', error.message);
    const fallbackBuffer = generateDynamicFallbackPdf({
      childName,
      cbseClass,
      subjectsText,
      studyTime,
      sessionsCount: weekSessions.length,
      examsTaken: weekExams.length,
      avgScore,
      activePctText,
      distractions,
      sleepyChecks,
      insight
    });
    return new NextResponse(fallbackBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="edubuddy-${safeSlug}-weekly-report.pdf"`
      }
    });
  }
}
