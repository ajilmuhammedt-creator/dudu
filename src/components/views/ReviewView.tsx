// src/components/views/ReviewView.tsx
'use client';

import React, { useState } from 'react';
import { Check, X, RotateCcw, ZoomIn, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DashboardGrade } from '@/lib/dashboard-types';

interface ReviewViewProps {
  grades?: DashboardGrade[];
  childName?: string;
  onSuccessReview?: () => void;
}

export function ReviewView({ grades = [], childName = 'Arjun', onSuccessReview }: ReviewViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewriteStatus, setRewriteStatus] = useState<string | null>(null);

  const pendingGrades = grades.filter((g) => g.status === 'needs_review');
  const activeGrade = pendingGrades[currentIdx] || pendingGrades[0] || null;

  const handleDecisionSubmit = async (selectedDecision: 'correct' | 'half' | 'wrong') => {
    if (!activeGrade) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: activeGrade.id,
          decision: selectedDecision
        })
      });
      onSuccessReview?.();
    } catch {}
    finally {
      setIsSubmitting(false);
    }
  };

  const handleAskRewrite = async () => {
    if (!activeGrade) return;
    setRewriteStatus('sending');
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: activeGrade.id,
          decision: 'rewrite'
        })
      });
      setRewriteStatus('sent');
      setTimeout(() => setRewriteStatus(null), 4000);
    } catch {
      setRewriteStatus('sent');
    }
  };

  if (!activeGrade) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-[var(--success-green)]/15 text-[var(--success-green)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">All caught up!</h2>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          No grades waiting for review. Grades EduBuddy is confident about are scored automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Check this grade</h1>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            Q{activeGrade.q_no} · {pendingGrades.length} waiting for review
          </div>
        </div>
        {pendingGrades.length > 1 && (
          <div className="flex gap-1.5">
            {pendingGrades.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-7 h-7 rounded-full text-xs font-bold ${
                  i === currentIdx
                    ? 'bg-[var(--brand-orange)] text-white'
                    : 'bg-[var(--badge-bg)] text-[var(--text-muted)]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Uncertainty Notice */}
      <div className="card p-4 bg-[var(--warning-gold)]/10 border-[var(--warning-gold)]/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[var(--warning-gold)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
            EduBuddy read the answer as <span className="font-bold underline">{activeGrade.child_answer || '—'}</span>{' '}
            but was only{' '}
            <span className="font-bold text-[var(--warning-gold)]">
              {Math.round((activeGrade.confidence || 0) * 100)}% sure
            </span>{' '}
            {activeGrade.reason ? `— ${activeGrade.reason}.` : '.'} Please decide.
          </p>
        </div>
      </div>

      {/* Question Card */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Question</div>
        <p className="text-base font-medium text-[var(--text-primary)] leading-relaxed">
          {activeGrade.question}
        </p>
        <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Correct answer: <strong className="text-[var(--text-primary)]">{activeGrade.correct_answer}</strong>
          </span>
          <span className="bg-[var(--badge-bg)] px-2 py-0.5 rounded font-semibold text-[var(--text-primary)]">
            {activeGrade.marks_total} {activeGrade.marks_total === 1 ? 'mark' : 'marks'}
          </span>
        </div>
      </div>

      {/* Page Photo */}
      {activeGrade.photo_path && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {childName}’s page (photo)
            </span>
            <button
              onClick={() => setIsZoomed(true)}
              className="text-xs text-[var(--study-blue)] font-medium hover:underline flex items-center gap-1"
            >
              <ZoomIn className="w-3.5 h-3.5" /> Tap to zoom
            </button>
          </div>
          <div
            onClick={() => setIsZoomed(true)}
            className="bg-[var(--input-bg)] border border-[var(--border-card)] rounded-2xl p-6 text-center cursor-zoom-in"
          >
            <div className="font-mono text-lg font-bold text-[var(--text-primary)]">
              {activeGrade.question} = {activeGrade.child_answer}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{activeGrade.photo_path}</div>
          </div>
        </div>
      )}

      {/* Decision Buttons */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Your decision</div>
        <div className="grid grid-cols-3 gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('correct')}
            className="btn bg-[var(--success-green)] text-white flex-col py-3 h-auto shadow-sm"
          >
            <Check className="w-5 h-5 mb-1" />
            <span className="text-sm font-bold">Correct</span>
            <span className="text-[11px] opacity-90">
              {activeGrade.marks_total} / {activeGrade.marks_total}
            </span>
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('half')}
            className="btn bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)] flex-col py-3 h-auto"
          >
            <span className="text-base font-bold mb-1">½</span>
            <span className="text-sm font-bold">Half</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {activeGrade.marks_total / 2} / {activeGrade.marks_total}
            </span>
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('wrong')}
            className="btn bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--error-red)] flex-col py-3 h-auto"
          >
            <X className="w-5 h-5 mb-1" />
            <span className="text-sm font-bold">Wrong</span>
            <span className="text-[11px] opacity-75">0 / {activeGrade.marks_total}</span>
          </button>
        </div>

        <button
          onClick={handleAskRewrite}
          disabled={rewriteStatus === 'sending'}
          className="btn btn-secondary w-full py-3 text-xs gap-2"
        >
          <RotateCcw className="w-4 h-4 text-[var(--brand-orange)]" />
          {rewriteStatus === 'sent'
            ? `Sent to robot! DuDu will ask ${childName} to rewrite.`
            : `Ask ${childName} to write it again on the robot`}
        </button>
      </div>

      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div className="card max-w-lg w-full p-6 text-center space-y-3">
            <div className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {activeGrade.question} = {activeGrade.child_answer}
            </div>
            <p className="text-xs text-[var(--text-muted)]">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
