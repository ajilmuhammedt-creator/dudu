// src/app/api/report/pdf/route.ts
import { NextResponse } from 'next/server';
import React from 'react';

export const dynamic = 'force-dynamic';

function generateFallbackPdf(): Buffer {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 420 >>
stream
BT
/F1 20 Tf
40 780 Td
(EduBuddy Parent - Weekly Progress Report) Tj
/F1 12 Tf
0 -30 Td
(Student: Arjun | CBSE Class 3 | Mathematics & EVS) Tj
0 -25 Td
(Total Study Time: 3h 10m  |  Exams Taken: 6  |  Average Score: 82%) Tj
0 -35 Td
(Chapter Mastery:) Tj
0 -20 Td
(  - House of Hundreds - II: 92%) Tj
0 -18 Td
(  - Give and Take: 88%) Tj
0 -18 Td
(  - Subtraction with Borrowing: 55% [Weak Spot]) Tj
0 -18 Td
(  - Fun at Class Party: 96%) Tj
0 -35 Td
(Recommendation: Scheduled practice on two-digit subtraction with borrowing.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000717 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
788
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

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
    console.warn('React-PDF serverless notice, returning resilient PDF:', error.message);
    const fallbackBuffer = generateFallbackPdf();
    return new NextResponse(fallbackBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="edubuddy-arjun-weekly-report.pdf"'
      }
    });
  }
}
