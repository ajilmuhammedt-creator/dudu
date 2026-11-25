// src/components/views/TodayView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Award,
  Eye,
  AlertCircle,
  ChevronRight,
  Camera,
  BookOpen,
  PenTool,
  Cpu,
  X,
  Sparkles
} from 'lucide-react';
import { PairRobotModal } from '../modals/PairRobotModal';
import { DashboardData, DashboardEvent } from '@/lib/dashboard-types';

interface TodayViewProps {
  dashboard: DashboardData | null;
  onNavigateTab: (tab: string) => void;
  onOpenSession: (sessionId: string) => void;
  onRefresh?: () => void;
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

function formatEventLabel(ev: DashboardEvent): string {
  switch (ev.type) {
    case 'sleepy_check':
      return '😴 DuDu asked: Feeling sleepy?';
    case 'sleepy_yes':
      return '😴 Arjun said yes — took a break';
    case 'sleepy_no':
      return '🙂 Arjun said no — continued studying';
    case 'sleepy_no_answer':
      return '🚪 No answer to the sleepy check';
    case 'too_dark':
      return '💡 Room too dark to read';
    case 'subject_switch':
      return `📚 Switched subject by voice${ev.data?.subject ? ` (${ev.data.subject})` : ''}`;
    case 'lang_hi':
      return '🌐 Switched language to Hindi by voice';
    case 'lang_ml':
      return '🌐 Switched language to Malayalam by voice';
    case 'lang_en':
      return '🌐 Switched language to English by voice';
    case 'off_topic':
      return '↪ Off-topic question';
    case 'break_prompt':
      return '☕ Break prompt offered';
    case 'limit_reached':
      return '⏱ Daily study limit reached';
    default:
      return ev.type.replace(/_/g, ' ');
  }
}

export function TodayView({ dashboard, onNavigateTab, onOpenSession }: TodayViewProps) {
  const [showPairModal, setShowPairModal] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);

  useEffect(() => {
    if (!showAttentionModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAttentionModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showAttentionModal]);

  const child = dashboard?.child || { name: 'Arjun', cbse_class: 3 };
  const subjects = dashboard?.settings?.subjects?.join(', ') || 'No subjects selected';
  const dailyLimit = dashboard?.settings?.daily_limit_min ?? 60;
  const todayMinutes = dashboard?.today.minutes ?? 0;
  const progressPct = Math.min(100, Math.round((todayMinutes / Math.max(1, dailyLimit)) * 100));

  const latestExam = dashboard?.today.latestExam;
  const attention = dashboard?.today.attention || {
    distractions: 0,
    sleepyChecks: 0,
    activePct: -1,
    events: []
  };
  const todaySessions = dashboard?.today.sessions || [];
  const needsReviewCount = dashboard?.needsReviewGrades?.length ?? 0;
  const firstReview = dashboard?.needsReviewGrades?.[0];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {dashboard?.todayLabel || 'Today'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            CBSE Class {child.cbse_class} · {subjects}
          </p>
        </div>
        <button
          onClick={() => setShowPairModal(true)}
          className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm hover:border-[var(--brand-orange)]/40"
        >
          <Cpu className="w-3.5 h-3.5 text-[var(--brand-orange)]" /> Pair a robot
        </button>
      </div>

      {/* 3 Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Study Time */}
        <div className="card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study time</span>
            <Clock className="w-4 h-4 text-[var(--study-blue)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{todayMinutes}</span>
            <span className="text-sm font-semibold text-[var(--text-muted)]">min</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">of {dailyLimit} min daily limit</div>
          <div className="w-full bg-[var(--badge-bg)] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[var(--study-blue)] h-full rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Exam Score */}
        <div className="card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exam score</span>
            <Award className="w-4 h-4 text-[var(--brand-orange)]" />
          </div>
          {latestExam ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                  {latestExam.score_right ?? 0} / {latestExam.score_total ?? 0}
                </span>
              </div>
              <div className="text-xs font-medium text-[var(--text-primary)] mt-1 truncate">
                {latestExam.chapter || latestExam.subject}
              </div>
              <div className="text-xs text-[var(--success-green)] font-medium mt-1">
                {latestExam.score_total
                  ? `${Math.round(((latestExam.score_right || 0) / latestExam.score_total) * 100)}%`
                  : '—'}{' '}
                · Latest today
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">—</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">No exams taken today</div>
            </>
          )}
        </div>

        {/* Attention Tile (Replaces Breaks) */}
        <div
          onClick={() => setShowAttentionModal(true)}
          className="card p-5 shadow-sm hover:shadow-md hover:border-[var(--brand-orange)]/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Attention</span>
            <Eye className="w-4 h-4 text-[var(--warning-gold)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">
              {attention.activePct >= 0 ? `${attention.activePct}%` : '—'}
            </span>
            <span className="text-sm font-semibold text-[var(--text-muted)]">active</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Distracted {attention.distractions} {attention.distractions === 1 ? 'time' : 'times'} · Sleepy checks{' '}
            {attention.sleepyChecks}
          </div>
          <div className="text-[11px] text-[var(--brand-orange)] font-medium mt-1.5">
            Tap to view attention timeline &rarr;
          </div>
        </div>
      </div>

      {/* Needs Review Banner */}
      {needsReviewCount > 0 && (
        <div
          onClick={() => onNavigateTab('review')}
          className="card p-4 sm:p-5 bg-[var(--brand-orange)]/10 border-[var(--brand-orange)]/30 flex items-center justify-between cursor-pointer shadow-sm hover:shadow transition-all group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-orange)]/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-[var(--brand-orange)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-[var(--brand-orange)] text-white text-xs font-bold rounded-full">
                  {needsReviewCount}
                </span>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {needsReviewCount === 1 ? 'Grade needs your check' : 'Grades need your check'}
                </h2>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {firstReview
                  ? `EduBuddy wasn’t sure about ${child.name}’s answer for Q${firstReview.q_no} (${Math.round(
                      (firstReview.confidence || 0) * 100
                    )}% sure).`
                  : 'Tap to review flagged handwritten answers.'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--brand-orange)] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </div>
      )}

      {/* Today's Sessions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Sessions</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'} today
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="card p-8 text-center space-y-2">
            <Sparkles className="w-7 h-7 text-[var(--text-muted)] mx-auto opacity-60" />
            <div className="text-sm font-semibold text-[var(--text-primary)]">No sessions recorded today yet</div>
            <p className="text-xs text-[var(--text-muted)]">
              When {child.name} studies on DuDu, each session and its attention report will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((s) => {
              const isExam = s.mode === 'exam' || s.mode === 'scan';
              const dist = s.distractions ?? 0;
              return (
                <div
                  key={s.id}
                  onClick={() => onOpenSession(s.id)}
                  className="card p-4.5 hover:border-[var(--study-blue)]/40 cursor-pointer shadow-sm hover:shadow transition-all group"
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
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
                        {s.subject || 'General'}
                        {s.chapter ? ` · ${s.chapter}` : ''}
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
        )}
      </div>

      {/* Attention Timeline Modal */}
      {showAttentionModal && (
        <div
          onClick={() => setShowAttentionModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Today’s Attention Timeline</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Distracted {attention.distractions} times · Sleepy checks {attention.sleepyChecks} · Active{' '}
                  {attention.activePct >= 0 ? `${attention.activePct}%` : '—'}
                </p>
              </div>
              <button
                onClick={() => setShowAttentionModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {attention.events.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  No attention or sleepy check events recorded today.
                </div>
              ) : (
                attention.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--input-bg)] text-xs"
                  >
                    <span className="text-[var(--text-primary)] font-medium">{formatEventLabel(ev)}</span>
                    <span className="text-[var(--text-muted)] font-mono shrink-0 ml-2">
                      {formatKolkataTime(ev.at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <PairRobotModal
        isOpen={showPairModal}
        childrenList={dashboard?.children || []}
        onClose={() => setShowPairModal(false)}
        onSuccess={() => {
          setShowPairModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
