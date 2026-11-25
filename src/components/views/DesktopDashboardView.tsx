// src/components/views/DesktopDashboardView.tsx
'use client';

import React, { useState } from 'react';
import {
  Download,
  Target,
  Sparkles,
  Camera,
  CameraOff,
  Check,
  X,
  Cpu,
  Clock,
  Award,
  AlertCircle,
  Eye
} from 'lucide-react';
import { DashboardData } from '@/lib/dashboard-types';

interface DesktopDashboardViewProps {
  dashboard: DashboardData | null;
  onNavigateTab: (tab: string) => void;
  onOpenSession: (sessionId: string) => void;
  onDownloadPdf: () => void;
  onRefresh?: () => void;
}

function formatKolkataDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function DesktopDashboardView({
  dashboard,
  onNavigateTab,
  onOpenSession,
  onDownloadPdf,
  onRefresh
}: DesktopDashboardViewProps) {
  const [practiceDispatched, setPracticeDispatched] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const child = dashboard?.child || { id: '22222222-2222-2222-2222-222222222222', name: 'Arjun', cbse_class: 3 };
  const subjects = dashboard?.settings?.subjects?.join(', ') || 'No subjects configured';
  const device = dashboard?.device;
  const week = dashboard?.week || {
    minutes: 0,
    deltaMinutes: 0,
    examsTaken: 0,
    avgExamScore: null,
    distractions: 0,
    distractionsDelta: 0
  };
  const sessions = dashboard?.sessions || [];
  const needsReviewGrades = dashboard?.needsReviewGrades || [];
  const firstReview = needsReviewGrades[0] || null;
  const subjectMastery = dashboard?.subjectMastery || [];

  const hours = Math.floor(week.minutes / 60);
  const mins = week.minutes % 60;
  const weekTimeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const handleSetPractice = async () => {
    setPracticeError(null);
    if (!device?.id) {
      setPracticeError(`No robot paired to ${child.name}. Assign a robot on Devices first.`);
      setTimeout(() => setPracticeError(null), 4000);
      return;
    }
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: device.id,
          type: 'practice',
          arg: dashboard?.settings?.subjects?.[0] || 'General'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not schedule practice');
      setPracticeDispatched(true);
      setTimeout(() => setPracticeDispatched(false), 3000);
    } catch (err: any) {
      setPracticeError(err.message || 'Failed to schedule practice');
      setTimeout(() => setPracticeError(null), 4000);
    }
  };

  const handleInlineResolve = async (gradeId: string, decision: 'correct' | 'wrong') => {
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: gradeId,
          decision
        })
      });
      onRefresh?.();
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Header & Main Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {child.name} — this week
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
            <span>
              CBSE Class {child.cbse_class} · {subjects}
            </span>
            <span>·</span>
            <span
              className={`flex items-center gap-1.5 font-medium ${
                device?.online ? 'text-[var(--success-green)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  device?.online ? 'bg-[var(--success-green)] animate-pulse' : 'bg-[var(--text-muted)]'
                }`}
              />
              {device
                ? `${device.name || 'DuDu'} (${device.device_uid}) ${
                    device.online ? 'online' : 'offline'
                  }${device.ip ? ` · ${device.ip}` : ''}`
                : 'No robot paired'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/report/pdf?child_id=${encodeURIComponent(child.id)}`}
            download={`edubuddy-${child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-weekly-report.pdf`}
            className="btn btn-secondary text-xs font-semibold px-4 gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-[var(--text-muted)]" />
            <span>Download report (PDF)</span>
          </a>

          <button
            onClick={handleSetPractice}
            className="btn btn-primary text-xs font-semibold px-4 gap-2 shadow-sm"
          >
            {practiceDispatched ? (
              <>
                <Check className="w-4 h-4" /> Practice Sent to Robot
              </>
            ) : (
              <>
                <Target className="w-4 h-4" /> Set a practice session
              </>
            )}
          </button>
        </div>
      </div>

      {practiceError && (
        <div className="p-3 rounded-xl bg-[var(--error-red)]/10 border border-[var(--error-red)]/30 text-xs text-[var(--error-red)] font-medium">
          {practiceError}
        </div>
      )}

      {/* 4 KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Time */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Study time</span>
            <Clock className="w-4 h-4 text-[var(--study-blue)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{weekTimeLabel}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">
            {week.deltaMinutes >= 0
              ? `▲ ${week.deltaMinutes} min vs last week`
              : `▼ ${Math.abs(week.deltaMinutes)} min vs last week`}
          </div>
        </div>

        {/* Exams Taken */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Exams taken</span>
            <Award className="w-4 h-4 text-[var(--brand-orange)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{week.examsTaken}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">
            {week.avgExamScore !== null ? (
              <>
                avg score <strong className="text-[var(--text-primary)]">{week.avgExamScore}%</strong>
              </>
            ) : (
              'No exams yet this week'
            )}
          </div>
        </div>

        {/* Needs Your Check */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Needs your check</span>
            <AlertCircle className="w-4 h-4 text-[var(--error-red)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">
              {needsReviewGrades.length}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('review')}
            className="text-xs text-[var(--brand-orange)] font-semibold mt-1 hover:underline text-left block"
          >
            {needsReviewGrades.length === 0 ? 'Review queue clear' : 'Open review queue →'}
          </button>
        </div>

        {/* Distractions this week */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Distractions this week</span>
            <Eye className="w-4 h-4 text-[var(--warning-gold)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{week.distractions}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-medium mt-1">
            {week.distractionsDelta >= 0
              ? `▲ ${week.distractionsDelta} vs last week`
              : `▼ ${Math.abs(week.distractionsDelta)} vs last week`}
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Chapter Mastery */}
        <div className="lg:col-span-2 card p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Chapter mastery · {subjects} (Class {child.cbse_class})
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                from {sessions.length} recorded {sessions.length === 1 ? 'session' : 'sessions'}
              </span>
            </div>
          </div>

          {subjectMastery.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-card)] text-center space-y-1">
              <div className="text-sm font-semibold text-[var(--text-primary)]">No mastery data yet</div>
              <p className="text-xs text-[var(--text-muted)]">
                Chapter mastery bars will appear once {child.name} completes an exam or scan session on DuDu.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectMastery.map((sub) => (
                <div key={sub.subject} className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {sub.subject}
                  </div>
                  {sub.chapters.length === 0 ? (
                    <div className="text-xs text-[var(--text-muted)]">
                      {sub.sessionsCount} study sessions · no graded exams yet
                    </div>
                  ) : (
                    sub.chapters.map((ch) => (
                      <div key={ch.chapter}>
                        <div className="flex justify-between text-xs font-semibold text-[var(--text-primary)] mb-1">
                          <span>{ch.chapter}</span>
                          <span className={ch.pct < 65 ? 'text-[var(--error-red)] font-bold' : ''}>{ch.pct}%</span>
                        </div>
                        <div className="w-full bg-[var(--badge-bg)] h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ch.pct < 65 ? 'bg-[var(--error-red)]' : 'bg-[var(--success-green)]'
                            }`}
                            style={{ width: `${ch.pct}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {dashboard?.attentionInsight && (
            <div className="bg-[var(--brand-orange)]/10 border border-[var(--brand-orange)]/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--brand-orange)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                  {dashboard.attentionInsight}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Rail (1/3): Review Queue & Device */}
        <div className="space-y-6">
          {/* Review Queue Card */}
          <div className="card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Review queue</h3>
              <span className="text-xs text-[var(--brand-orange)] font-semibold">
                {needsReviewGrades.length} pending
              </span>
            </div>

            {firstReview ? (
              <div className="p-3.5 rounded-2xl bg-[var(--warning-gold)]/10 border border-[var(--warning-gold)]/30 space-y-3">
                <div className="text-xs text-[var(--text-muted)]">
                  Q{firstReview.q_no} · {Math.round((firstReview.confidence || 0) * 100)}% sure
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {firstReview.question} — read as &ldquo;{firstReview.child_answer}&rdquo;
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInlineResolve(firstReview.id, 'correct')}
                    className="btn bg-[var(--success-green)] text-white text-xs py-1.5 min-h-[36px]"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Correct
                  </button>
                  <button
                    onClick={() => handleInlineResolve(firstReview.id, 'wrong')}
                    className="btn bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--error-red)] text-xs py-1.5 min-h-[36px]"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Wrong
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[var(--success-green)]/10 text-[var(--success-green)] text-xs font-semibold text-center">
                All caught up! No grades waiting for review.
              </div>
            )}
          </div>

          {/* Device Card */}
          <div className="card p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Device</h3>
              <button
                onClick={() => onNavigateTab('devices')}
                className="text-xs text-[var(--study-blue)] font-semibold hover:underline"
              >
                Manage
              </button>
            </div>
            {device ? (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      device.online ? 'bg-[var(--success-green)] animate-pulse' : 'bg-[var(--text-muted)]'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">
                      {device.name} · {device.online ? 'online' : 'offline'}
                    </div>
                    <div className="text-[var(--text-muted)] font-mono">
                      {device.device_uid} · {device.ip || 'No IP'}
                      {device.rssi !== null ? ` · ${device.rssi} dBm` : ''}
                    </div>
                  </div>
                </div>
                <Cpu className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)]">No device paired yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Sessions</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {sessions.length} total {sessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">No sessions recorded yet</div>
            <p className="text-xs text-[var(--text-muted)]">
              Once {child.name} completes a Learn, Q&amp;A, Exam, or Scan session on DuDu, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-2.5 font-semibold">When</th>
                  <th className="py-2.5 font-semibold">Mode</th>
                  <th className="py-2.5 font-semibold">Subject / Topic</th>
                  <th className="py-2.5 font-semibold">Length</th>
                  <th className="py-2.5 font-semibold">Attention</th>
                  <th className="py-2.5 font-semibold">Result</th>
                  <th className="py-2.5 font-semibold">Camera</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)] text-xs">
                {sessions.map((s) => {
                  const dist = s.distractions ?? 0;
                  return (
                    <tr key={s.id} className="hover:bg-[var(--input-bg)] transition-colors">
                      <td className="py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                        {formatKolkataDateTime(s.started_at)}
                      </td>
                      <td className="py-3 text-[var(--text-muted)] capitalize">{s.mode}</td>
                      <td className="py-3 font-medium text-[var(--text-primary)]">
                        {s.subject || 'General'}
                        {s.chapter ? ` · ${s.chapter}` : ''}
                      </td>
                      <td className="py-3 text-[var(--text-muted)]">{s.minutes} min</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                            dist === 0
                              ? 'bg-[var(--success-green)]/15 text-[var(--success-green)]'
                              : 'bg-[var(--warning-gold)]/15 text-[var(--warning-gold)]'
                          }`}
                        >
                          {dist === 0 ? '🙂 focused' : `⚠ ${dist}`}
                        </span>
                        {s.active_pct >= 0 && (
                          <span className="ml-1.5 text-[var(--text-muted)]">{s.active_pct}%</span>
                        )}
                      </td>
                      <td className="py-3 font-bold text-[var(--text-primary)]">
                        {s.score_total
                          ? `${s.score_right ?? 0} / ${s.score_total}`
                          : `${s.questions} Q`}
                      </td>
                      <td className="py-3">
                        {s.camera_used ? (
                          <span className="inline-flex items-center gap-1 text-[var(--success-green)] font-medium">
                            <Camera className="w-3.5 h-3.5" /> on
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                            <CameraOff className="w-3.5 h-3.5" /> off
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onOpenSession(s.id)}
                          className="text-[var(--study-blue)] font-semibold hover:underline"
                        >
                          Transcript
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
