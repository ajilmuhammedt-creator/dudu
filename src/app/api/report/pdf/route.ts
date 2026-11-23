// src/app/api/report/pdf/route.ts
import { NextResponse } from 'next/server';
import React from 'react';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { ReportDocument } = await import('@/lib/pdf/report-document');

    const docElement = React.createElement(ReportDocument, {
      childName: 'Arjun',
      cbseClass: 3,
      studyTime: '3h 10m',
      examsTaken: 6,
      avgScore: '82%',
      insight:
        'Subtraction with borrowing (Give and Take) is the weak spot — 3 of 5 wrong answers were a borrowing slip.'
    });

    const pdfBuffer = await renderToBuffer(docElement as any);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="edubuddy-arjun-weekly-report.pdf"'
      }
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'pdf_generation_failed', message: error.message },
      { status: 500 }
    );
  }
}
