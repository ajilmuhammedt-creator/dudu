// src/lib/insights.ts

export interface ChapterMastery {
  chapter: string;
  subject: string;
  correct: number;
  total: number;
  masteryPercentage: number;
}

export interface WeakSpotInsight {
  chapter: string;
  subject: string;
  masteryPercentage: number;
  insightText: string;
  recommendedTopic: string;
}

/**
 * Calculates chapter mastery from graded answers (excluding 'needs_review')
 */
export function calculateMastery(
  grades: Array<{
    chapter?: string | null;
    subject?: string | null;
    marks_total: number;
    marks_awarded: number | null;
    status: string;
    reason?: string | null;
  }>
): ChapterMastery[] {
  const map = new Map<string, { subject: string; correct: number; total: number }>();

  for (const g of grades) {
    if (g.status === 'needs_review' || !g.chapter) continue;
    const key = `${g.subject || 'General'}::${g.chapter}`;
    const curr = map.get(key) || { subject: g.subject || 'General', correct: 0, total: 0 };
    curr.total += 1;
    if (Number(g.marks_awarded) > 0) {
      curr.correct += 1;
    }
    map.set(key, curr);
  }

  return Array.from(map.entries()).map(([key, data]) => {
    const [, chapter] = key.split('::');
    const masteryPercentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    return {
      chapter,
      subject: data.subject,
      correct: data.correct,
      total: data.total,
      masteryPercentage
    };
  });
}

/**
 * Generates rule-based weak spot insight
 */
export function generateWeakSpotInsight(
  masteries: ChapterMastery[],
  wrongGrades: Array<{ chapter?: string | null; reason?: string | null }>
): WeakSpotInsight | null {
  // Find chapter with lowest mastery that has at least 4 graded answers
  const eligible = masteries.filter((m) => m.total >= 4).sort((a, b) => a.masteryPercentage - b.masteryPercentage);

  if (eligible.length === 0) {
    // If no chapter has 4+ answers, pick the lowest if any exists
    if (masteries.length === 0) return null;
    const lowest = [...masteries].sort((a, b) => a.masteryPercentage - b.masteryPercentage)[0];
    return {
      chapter: lowest.chapter,
      subject: lowest.subject,
      masteryPercentage: lowest.masteryPercentage,
      insightText: `Practice ${lowest.chapter} to build confidence.`,
      recommendedTopic: `${lowest.chapter}: fundamentals`
    };
  }

  const lowest = eligible[0];
  const chapterWrongs = wrongGrades.filter((g) => g.chapter === lowest.chapter);
  
  // Rule-based reason extraction
  let reasonSummary = "several conceptual errors were made";
  const borrowingSlips = chapterWrongs.filter((g) => g.reason?.toLowerCase().includes("borrow") || g.reason?.toLowerCase().includes("ones"));
  
  if (borrowingSlips.length > 0) {
    reasonSummary = `${borrowingSlips.length} of ${chapterWrongs.length} wrong answers were a borrowing slip`;
  }

  return {
    chapter: lowest.chapter,
    subject: lowest.subject,
    masteryPercentage: lowest.masteryPercentage,
    insightText: `Subtraction with borrowing (${lowest.chapter}) is the weak spot — ${reasonSummary}.`,
    recommendedTopic: `${lowest.chapter}: subtraction with borrowing`
  };
}
