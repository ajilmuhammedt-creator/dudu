// src/components/views/SessionsView.tsx
'use client';

import React, { useState } from 'react';
import { BookOpen, PenTool, Camera, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { DashboardData, DashboardSession } from '@/lib/dashboard-types';

interface SessionsViewProps {
  dashboard: DashboardData | null;
  onOpenSession: (sessionId: string) => void;
  modeFilter?: string;
  onModeFilterChange?: (mode: string) => void;
  subjectFilter?: string;
  onSubjectFilterChange?: (subject: string) => void;
}

function formatKolkataDayHeader(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function formatKolkataTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function SessionsView({
  dashboard,
  onOpenSession,
  modeFilter: controlledModeFilter,
  onModeFilterChange,
  subjectFilter: controlledSubjectFilter,
  onSubjectFilterChange
}: SessionsViewProps) {
  const [localModeFilter, setLocalModeFilter] = useState<string>('all');
  const [localSubjectFilter, setLocalSubjectFilter] = useState<string>('all');

  const modeFilter = controlledModeFilter ?? localModeFilter;
  const setModeFilter = onModeFilterChange ?? setLocalModeFilter;
  const subjectFilter = controlledSubjectFilter ?? localSubjectFilter;
  const setSubjectFilter = onSubjectFilterChange ?? setLocalSubjectFilter;

  const childName = dashboard?.child?.name || 'Arjun';
  const allSessions = dashboard?.sessions || [];

  const uniqueSubjects = Array.from(
    new Set(allSessions.map((s) => (s.subject || '').trim() || 'General'))
  );

  const filtered = allSessions.filter((s) => {
    if (modeFilter !== 'all' && s.mode !== modeFilter) return false;
    const subj = (s.subject || '').trim() || 'General';
    if (subjectFilter !== 'all' && subj !== subjectFilter) return false;
    return true;
  });

  // Group newest-first by Kolkata day
  const grouped = new Map<string, DashboardSession[]>();
  for (const s of filtered) {
    const dayLabel = formatKolkataDayHeader(s.started_at);
    const list = grouped.get(dayLabel) || [];
    list.push(s);
    grouped.set(dayLabel, list);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{childName}’s sessions</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {filtered.length} {filtered.length === 1 ? 'session' : 'sessions'} recorded
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
          >
            <option value="all">All modes</option>
            <option value="learn">Learn</option>
            <option value="qa">Q&amp;A</option>
            <option value="exam">Exam</option>
            <option value="scan">Scan</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
          >
            <option value="all">All subjects</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <Sparkles className="w-7 h-7 text-[var(--text-muted)] mx-auto opacity-60" />
          <div className="text-sm font-semibold text-[var(--text-primary)]">No sessions match</div>
          <p className="text-xs text-[var(--text-muted)]">
            When {childName} completes sessions on DuDu, they will appear here grouped by day.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dayLabel, daySessions]) => (
            <div key={dayLabel} className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-1">
                {dayLabel}
              </div>
              <div className="space-y-2.5">
                {daySessions.map((s) => {
                  const isExam = s.mode === 'exam' || s.mode === 'scan';
                  const dist = s.distractions ?? 0;
                  const subj = (s.subject || '').trim() || 'General';
                  const ch = (s.chapter || '').trim();
                  return (
                    <div
                      key={s.id}
                      onClick={() => onOpenSession(s.id)}
                      className="card p-4 hover:border-[var(--study-blue)]/40 cursor-pointer shadow-sm hover:shadow transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              isExam
                                ? 'bg-[var(--brand-orange)]/15 text-[var(--brand-orange)]'
                                : 'bg-[var(--study-blue)]/15 text-[var(--study-blue)]'
                            }`}
                          >
                            {isExam ? <PenTool className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                            {s.mode === 'scan' ? 'Scan' : s.mode === 'exam' ? 'Exam' : s.mode === 'qa' ? 'Q&A' : 'Learn'}
                          </span>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {subj}
                            {ch ? ` · ${ch}` : ''}
                          </span>
                          {s.camera_used && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded">
                              <Camera className="w-3 h-3 text-[var(--success-green)]" /> camera
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              dist === 0
                                ? 'bg-[var(--success-green)]/15 text-[var(--success-green)]'
                                : 'bg-[var(--warning-gold)]/15 text-[var(--warning-gold)]'
                            }`}
                          >
                            {dist === 0 ? '🙂 focused' : `⚠ ${dist} ${dist === 1 ? 'distraction' : 'distractions'}`}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--badge-bg)] px-2.5 py-1 rounded-lg">
                          {s.minutes} min
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span>
                          {formatKolkataTime(s.started_at)} – {formatKolkataTime(s.ended_at)}
                          {s.questions > 0 ? ` · ${s.questions} questions` : ''}
                          {s.score_total ? ` · Score: ${s.score_right ?? 0} / ${s.score_total}` : ''}
                          {s.active_pct >= 0 ? ` · Active ${s.active_pct}%` : ''}
                        </span>
                        <span className="text-[var(--study-blue)] font-medium group-hover:underline flex items-center gap-0.5">
                          Transcript <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
