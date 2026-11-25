// src/lib/dashboard-types.ts
export interface DashboardEvent {
  id: number;
  device_id: string;
  child_id?: string | null;
  session_id?: string | null;
  type: string;
  at: string;
  data: any;
}

export interface DashboardTurn {
  id: number;
  session_id: string;
  idx: number;
  speaker: 'child' | 'robot';
  text: string;
  off_topic: boolean;
  correct: boolean | null;
  at: string;
}

export interface DashboardSession {
  id: string;
  device_id: string;
  child_id: string;
  mode: 'learn' | 'qa' | 'fun' | 'exam' | 'scan';
  subject: string;
  chapter: string;
  started_at: string;
  ended_at: string;
  minutes: number;
  questions: number;
  answered_right: number;
  off_topic: number;
  camera_used: boolean;
  score_right: number | null;
  score_total: number | null;
  watch_checks: number;
  watch_moving: number;
  active_pct: number;
  sleepy_checks: number;
  sleepy_yes: number;
  sleepy_no_answer: number;
  distractions: number;
  created_at: string;
  turns: DashboardTurn[];
  events: DashboardEvent[];
}

export interface DashboardGrade {
  id: string;
  session_id: string;
  child_id: string;
  q_no: number;
  question: string;
  child_answer: string;
  correct_answer: string;
  marks_total: number;
  marks_awarded: number | null;
  confidence: number;
  reason: string;
  status: 'auto' | 'needs_review' | 'reviewed';
  photo_path: string | null;
  created_at: string;
}

export interface DashboardData {
  child: {
    id: string;
    name: string;
    cbse_class: number;
    avatar: string;
  };
  children: Array<{
    id: string;
    name: string;
    cbse_class: number;
    avatar: string;
  }>;
  settings: {
    child_id: string;
    subjects: string[];
    stay_on_syllabus: boolean;
    camera_exam: boolean;
    break_prompts: boolean;
    keep_photos: boolean;
    daily_limit_min: number;
    window_start: string;
    window_end: string;
    language: 'en' | 'hi' | 'ml';
    wake_sensitivity: number;
    theme?: 'light' | 'dark' | 'soft-blue' | 'warm-orange';
    robot_theme?: 'day' | 'night' | 'cosmic' | 'sunset';
    version: number;
  } | null;
  device: {
    id: string;
    device_uid: string;
    name: string;
    ip: string | null;
    rssi: number | null;
    firmware: string;
    last_seen: string | null;
    paired: boolean;
    online: boolean;
  } | null;
  todayLabel: string;
  today: {
    minutes: number;
    sessions: DashboardSession[];
    latestExam: DashboardSession | null;
    attention: {
      distractions: number;
      sleepyChecks: number;
      activePct: number;
      events: DashboardEvent[];
    };
  };
  week: {
    minutes: number;
    deltaMinutes: number;
    examsTaken: number;
    avgExamScore: number | null;
    distractions: number;
    distractionsDelta: number;
  };
  charts: {
    weekly: Array<{ date: string; day: string; minutes: number; distractions: number; active_pct: number | null }>;
    monthly: Array<{ date: string; day: string; minutes: number; distractions: number; active_pct: number | null }>;
  };
  subjectMastery: Array<{
    subject: string;
    sessionsCount: number;
    examsCount: number;
    avgPct: number | null;
    chapters: Array<{ chapter: string; pct: number }>;
  }>;
  attentionInsight: string | null;
  sessions: DashboardSession[];
  grades: DashboardGrade[];
  needsReviewGrades: DashboardGrade[];
}
