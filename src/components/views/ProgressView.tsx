// src/components/views/ProgressView.tsx
'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Target, Sparkles, Check, Eye } from 'lucide-react';
import { DashboardData } from '@/lib/dashboard-types';

interface ProgressViewProps {
  dashboard: DashboardData | null;
}

export function ProgressView({ dashboard }: ProgressViewProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [practiceDispatched, setPracticeDispatched] = useState(false);

  const childName = dashboard?.child?.name || 'Arjun';
  const chartData =
    period === 'week' ? dashboard?.charts.weekly || [] : dashboard?.charts.monthly || [];
  const totalMinutes = chartData.reduce((acc, d) => acc + (d.minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const subjects = dashboard?.subjectMastery || [];
  const configuredSubjects = dashboard?.settings?.subjects || [];
  const attentionInsight = dashboard?.attentionInsight;

  const handleSetPractice = async () => {
    try {
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: dashboard?.device?.id || '33333333-3333-3333-3333-333333333333',
          type: 'practice',
          arg: configuredSubjects[0] || 'Revision practice'
        })
      });
      setPracticeDispatched(true);
      setTimeout(() => setPracticeDispatched(false), 4000);
    } catch {}
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{childName}’s progress</h1>
        <div className="bg-[var(--badge-bg)] p-1 rounded-xl flex items-center text-xs font-semibold">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg transition-all ${
              period === 'week'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg transition-all ${
              period === 'month'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Study Minutes Chart */}
      <div className="card p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Study minutes
          </span>
          <div className="text-sm font-bold text-[var(--text-primary)]">
            {totalFormatted} this {period}
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-card)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val} min`, 'Study Time']}
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="minutes" fill="var(--study-blue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attention Card: Active % Line Chart + Distractions Bar Chart */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[var(--warning-gold)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Attention &amp; focus ({period})
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Active % &amp; Distractions</span>
        </div>

        {/* Daily Active % Line Chart */}
        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mb-1">Daily Active %</div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-card)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [val !== null ? `${val}%` : '—', 'Active']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active_pct"
                  stroke="var(--success-green)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Distractions Bar Chart */}
        <div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mb-1">Distractions per day</div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-card)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [val, 'Distractions']}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="distractions" fill="var(--warning-gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl p-3 text-xs text-[var(--text-primary)] flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[var(--brand-orange)] shrink-0 mt-0.5" />
          <span>
            {attentionInsight ||
              'Attention insights will appear here once sessions with camera watch or sleepy checks are recorded.'}
          </span>
        </div>
      </div>

      {/* By Subject Breakdown */}
      {subjects.length === 0 ? (
        <div className="card p-6 text-center space-y-2">
          <div className="text-sm font-bold text-[var(--text-primary)]">
            Subjects: {configuredSubjects.join(', ') || 'None configured'}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            No completed sessions or exams yet. Chapter mastery will appear here as {childName} studies.
          </p>
        </div>
      ) : (
        subjects.map((sub) => (
          <div key={sub.subject} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[var(--text-primary)]">{sub.subject}</span>
              <span className="text-xs text-[var(--text-muted)]">
                {sub.examsCount > 0
                  ? `${sub.examsCount} exams · avg ${sub.avgPct ?? 0}%`
                  : `${sub.sessionsCount} sessions · no exam yet`}
              </span>
            </div>

            {sub.chapters.length > 0 && (
              <div className="space-y-3">
                {sub.chapters.map((ch) => (
                  <div key={ch.chapter}>
                    <div className="flex justify-between text-xs font-semibold text-[var(--text-primary)] mb-1">
                      <span>{ch.chapter}</span>
                      <span className={ch.pct < 65 ? 'text-[var(--error-red)]' : ''}>{ch.pct}%</span>
                    </div>
                    <div className="w-full bg-[var(--badge-bg)] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ch.pct < 65 ? 'bg-[var(--error-red)]' : 'bg-[var(--success-green)]'
                        }`}
                        style={{ width: `${ch.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSetPractice}
              className="btn btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
            >
              {practiceDispatched ? (
                <>
                  <Check className="w-4 h-4" /> Practice session scheduled on robot!
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" /> Set a practice session
                </>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
