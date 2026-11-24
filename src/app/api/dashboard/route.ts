// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { resolveParentUser } from '@/lib/auth-helper';
import { getKolkataMidnightToday } from '@/lib/date-utils';

const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

function formatKolkataDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function formatKolkataShortDay(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short'
  }).format(date).slice(0, 1);
}

export async function GET(req: NextRequest) {
  const userId = await resolveParentUser(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'unauthenticated', message: 'Please sign in to view the dashboard.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('child_id') || '22222222-2222-2222-2222-222222222222';

  const ownsChild = await DataStore.userOwnsChild(userId, childId);
  if (!ownsChild) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'You do not have permission to view this child.' },
      { status: 403 }
    );
  }

  const [child, settings, rawDevice, sessions, grades, events] = await Promise.all([
    DataStore.getChildById(childId),
    DataStore.getChildSettings(childId),
    DataStore.getDeviceByUid('DUDU-90932C9FC114'),
    DataStore.getSessions(childId),
    DataStore.getGrades(childId),
    DataStore.getEvents(childId)
  ]);

  const device = rawDevice
    ? {
        id: rawDevice.id,
        device_uid: rawDevice.device_uid,
        name: rawDevice.name,
        ip: rawDevice.ip,
        rssi: rawDevice.rssi,
        firmware: rawDevice.firmware,
        last_seen: rawDevice.last_seen,
        paired: Boolean(rawDevice.family_id && rawDevice.child_id),
        online: rawDevice.last_seen
          ? (Date.now() - new Date(rawDevice.last_seen).getTime()) / 1000 <= 180
          : false
      }
    : null;

  const now = new Date();
  const todayWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long'
  }).format(now);
  const todayLabel = `Today, ${todayWeekday}`;

  const kolkataMidnight = getKolkataMidnightToday();
  const todayKey = formatKolkataDayKey(now);

  // Enrich sessions with turns and events
  const enrichedSessions = await Promise.all(
    sessions.map(async (s) => {
      const turns = await DataStore.getTurns(s.id);
      const sessionEvents = events.filter((e) => e.session_id === s.id);
      return {
        ...s,
        watch_checks: s.watch_checks ?? 0,
        watch_moving: s.watch_moving ?? 0,
        active_pct: s.active_pct ?? -1,
        sleepy_checks: s.sleepy_checks ?? 0,
        sleepy_yes: s.sleepy_yes ?? 0,
        sleepy_no_answer: s.sleepy_no_answer ?? 0,
        distractions: s.distractions ?? s.off_topic ?? 0,
        turns,
        events: sessionEvents
      };
    })
  );

  const todaySessions = enrichedSessions.filter(
    (s) => new Date(s.started_at) >= kolkataMidnight || formatKolkataDayKey(new Date(s.started_at)) === todayKey
  );

  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const todayExams = todaySessions.filter((s) => s.score_total !== null && s.score_total > 0);
  const latestTodayExam = todayExams[0] || null;

  // Today's attention aggregation
  const todayDistractions = todaySessions.reduce((acc, s) => acc + (s.distractions ?? 0), 0);
  const todaySleepyChecks = todaySessions.reduce((acc, s) => acc + (s.sleepy_checks ?? 0), 0);
  const todayActiveSessions = todaySessions.filter((s) => (s.active_pct ?? -1) >= 0);
  const todayActivePct =
    todayActiveSessions.length > 0
      ? Math.round(todayActiveSessions.reduce((acc, s) => acc + (s.active_pct ?? 0), 0) / todayActiveSessions.length)
      : -1;

  const todayEvents = events.filter(
    (e) => new Date(e.at) >= kolkataMidnight || formatKolkataDayKey(new Date(e.at)) === todayKey
  );

  // Week & Last Week windows (7 days)
  const sevenDaysAgo = new Date(kolkataMidnight.getTime() - 6 * 86400000);
  const fourteenDaysAgo = new Date(kolkataMidnight.getTime() - 13 * 86400000);

  const weekSessions = enrichedSessions.filter((s) => new Date(s.started_at) >= sevenDaysAgo);
  const lastWeekSessions = enrichedSessions.filter(
    (s) => new Date(s.started_at) >= fourteenDaysAgo && new Date(s.started_at) < sevenDaysAgo
  );

  const weekMinutes = weekSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
  const lastWeekMinutes = lastWeekSessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  const weekExams = weekSessions.filter((s) => s.score_total !== null && s.score_total > 0);
  const avgExamScore =
    weekExams.length > 0
      ? Math.round(
          (weekExams.reduce((acc, s) => acc + ((s.score_right || 0) / (s.score_total || 1)), 0) /
            weekExams.length) *
            100
        )
      : null;

  const weekDistractions = weekSessions.reduce((acc, s) => acc + (s.distractions ?? 0), 0);
  const lastWeekDistractions = lastWeekSessions.reduce((acc, s) => acc + (s.distractions ?? 0), 0);

  // Build 7-day chart (oldest to newest ending today)
  const buildDailySeries = (daysCount: number) => {
    const series = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(kolkataMidnight.getTime() - i * 86400000);
      const key = formatKolkataDayKey(d);
      const daySessions = enrichedSessions.filter(
        (s) => formatKolkataDayKey(new Date(s.started_at)) === key
      );
      const mins = daySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
      const dist = daySessions.reduce((acc, s) => acc + (s.distractions ?? 0), 0);
      const activeList = daySessions.filter((s) => (s.active_pct ?? -1) >= 0);
      const activePct =
        activeList.length > 0
          ? Math.round(activeList.reduce((acc, s) => acc + (s.active_pct ?? 0), 0) / activeList.length)
          : null;

      series.push({
        date: key,
        day: daysCount <= 7 ? formatKolkataShortDay(d) : key.slice(5),
        minutes: mins,
        distractions: dist,
        active_pct: activePct
      });
    }
    return series;
  };

  // Subject & Chapter mastery from real sessions + grades
  const subjectMap = new Map<
    string,
    {
      subject: string;
      sessionsCount: number;
      examsCount: number;
      chapters: Map<string, { chapter: string; right: number; total: number }>;
    }
  >();

  for (const s of enrichedSessions) {
    if (!subjectMap.has(s.subject)) {
      subjectMap.set(s.subject, {
        subject: s.subject,
        sessionsCount: 0,
        examsCount: 0,
        chapters: new Map()
      });
    }
    const entry = subjectMap.get(s.subject)!;
    entry.sessionsCount += 1;
    if (s.score_total !== null && s.score_total > 0) {
      entry.examsCount += 1;
      const ch = entry.chapters.get(s.chapter) || { chapter: s.chapter, right: 0, total: 0 };
      ch.right += s.score_right || 0;
      ch.total += s.score_total;
      entry.chapters.set(s.chapter, ch);
    }
  }

  const subjectMastery = Array.from(subjectMap.values()).map((sub) => {
    const chapters = Array.from(sub.chapters.values()).map((c) => ({
      chapter: c.chapter,
      pct: c.total > 0 ? Math.round((c.right / c.total) * 100) : 0
    }));
    const avgPct =
      chapters.length > 0
        ? Math.round(chapters.reduce((acc, c) => acc + c.pct, 0) / chapters.length)
        : null;
    return {
      subject: sub.subject,
      sessionsCount: sub.sessionsCount,
      examsCount: sub.examsCount,
      avgPct,
      chapters
    };
  });

  // Attention insight
  const sleepyEvents = events.filter((e) => e.type === 'sleepy_check' || e.type === 'sleepy_yes');
  let attentionInsight: string | null = null;
  if (sleepyEvents.length > 0) {
    const eveningCount = sleepyEvents.filter((e) => {
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: TZ,
          hour: 'numeric',
          hour12: false
        }).format(new Date(e.at))
      );
      return hour >= 18;
    }).length;
    if (eveningCount >= Math.ceil(sleepyEvents.length / 2)) {
      attentionInsight = 'Most sleepy checks happen after 6 pm — try studying earlier.';
    } else {
      attentionInsight = `${sleepyEvents.length} sleepy check${sleepyEvents.length > 1 ? 's' : ''} recorded — short stretch breaks help keep focus high.`;
    }
  } else if (weekDistractions > 0) {
    attentionInsight = `${weekDistractions} distraction${weekDistractions > 1 ? 's' : ''} recorded this week across ${weekSessions.length} session${weekSessions.length === 1 ? '' : 's'}.`;
  }

  const needsReviewGrades = grades.filter((g) => g.status === 'needs_review');

  return NextResponse.json({
    child: child || {
      id: childId,
      name: 'Arjun',
      cbse_class: 3,
      avatar: '👦'
    },
    settings,
    device,
    todayLabel,
    today: {
      minutes: todayMinutes,
      sessions: todaySessions,
      latestExam: latestTodayExam,
      attention: {
        distractions: todayDistractions,
        sleepyChecks: todaySleepyChecks,
        activePct: todayActivePct,
        events: todayEvents
      }
    },
    week: {
      minutes: weekMinutes,
      deltaMinutes: weekMinutes - lastWeekMinutes,
      examsTaken: weekExams.length,
      avgExamScore,
      distractions: weekDistractions,
      distractionsDelta: weekDistractions - lastWeekDistractions
    },
    charts: {
      weekly: buildDailySeries(7),
      monthly: buildDailySeries(30)
    },
    subjectMastery,
    attentionInsight,
    sessions: enrichedSessions,
    grades,
    needsReviewGrades
  });
}
