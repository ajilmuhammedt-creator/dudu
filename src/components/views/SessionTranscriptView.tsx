// src/components/views/SessionTranscriptView.tsx
'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Flag,
  Trash2,
  Camera,
  CameraOff,
  AlertCircle,
  Check,
  MessageSquare,
  Eye
} from 'lucide-react';
import { DashboardSession, DashboardEvent, DashboardTurn } from '@/lib/dashboard-types';

interface SessionTranscriptViewProps {
  session: DashboardSession | null;
  childName?: string;
  onBack: () => void;
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

function formatInlineEventText(ev: DashboardEvent, childName: string): string {
  switch (ev.type) {
    case 'sleepy_check':
      return '😴 DuDu asked: Feeling sleepy?';
    case 'sleepy_yes':
      return `😴 DuDu asked: Feeling sleepy? — ${childName} said yes`;
    case 'sleepy_no':
      return `🙂 DuDu asked: Feeling sleepy? — ${childName} said no`;
    case 'sleepy_no_answer':
      return '🚪 No answer to the sleepy check';
    case 'too_dark':
      return '💡 Room too dark';
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

export function SessionTranscriptView({
  session,
  childName = 'Arjun',
  onBack,
  onRefresh
}: SessionTranscriptViewProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flagTurnId, setFlagTurnId] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [deletedLocally, setDeletedLocally] = useState(false);

  if (!session) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="card p-8 text-center text-sm text-[var(--text-muted)]">
          Session not found.
        </div>
      </div>
    );
  }

  const turns = deletedLocally ? [] : session.turns || [];
  const events = session.events || [];

  // Merge turns and events chronologically for inline timeline
  type TimelineItem =
    | { kind: 'turn'; time: number; turn: DashboardTurn }
    | { kind: 'event'; time: number; event: DashboardEvent };

  const timeline: TimelineItem[] = [
    ...turns.map((t) => ({ kind: 'turn' as const, time: new Date(t.at).getTime(), turn: t })),
    ...events.map((e) => ({ kind: 'event' as const, time: new Date(e.at).getTime(), event: e }))
  ].sort((a, b) => a.time - b.time);

  const activePct = session.active_pct ?? -1;
  const distractions = session.distractions ?? 0;
  const sleepyChecks = session.sleepy_checks ?? 0;
  const sleepyYes = session.sleepy_yes ?? 0;
  const sleepyNoAnswer = session.sleepy_no_answer ?? 0;

  let sleepySummary = '—';
  if (sleepyChecks > 0) {
    if (sleepyNoAnswer > 0) {
      sleepySummary = 'no answer – may have dozed off or left the desk';
    } else if (sleepyYes > 0) {
      sleepySummary = 'said yes, took a break';
    } else {
      sleepySummary = 'said no';
    }
  }

  const handleFlagSubmit = async () => {
    if (!flagTurnId || !flagReason) return;
    try {
      await fetch('/api/transcript/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flag',
          turn_id: flagTurnId,
          reason: flagReason
        })
      });
      setFlagSuccess(true);
      setTimeout(() => {
        setFlagSuccess(false);
        setFlagTurnId(null);
        setFlagReason('');
      }, 2000);
    } catch {}
  };

  const handleDeleteTranscript = async () => {
    try {
      await fetch('/api/transcript/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          session_id: session.id
        })
      });
      setDeletedLocally(true);
      setShowDeleteModal(false);
      onRefresh?.();
    } catch {}
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-xs font-semibold text-[var(--error-red)] hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete transcript
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {session.mode.toUpperCase()} · {session.subject} ({session.chapter})
        </h1>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
          <span>
            {formatKolkataTime(session.started_at)} – {formatKolkataTime(session.ended_at)} · {session.minutes} min
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            {session.camera_used ? (
              <>
                <Camera className="w-3.5 h-3.5 text-[var(--success-green)]" /> camera used
              </>
            ) : (
              <>
                <CameraOff className="w-3.5 h-3.5" /> camera off
              </>
            )}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[var(--text-muted)] block">Questions</span>
          <span className="text-lg font-bold text-[var(--text-primary)]">{session.questions}</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[var(--text-muted)] block">Answered right</span>
          <span className="text-lg font-bold text-[var(--success-green)]">{session.answered_right}</span>
        </div>
        <div className="card p-3 text-center">
          <span className="text-[11px] text-[var(--text-muted)] block">Off-topic asks</span>
          <span className="text-lg font-bold text-[var(--warning-gold)]">{session.off_topic}</span>
        </div>
      </div>

      {/* Attention Strip */}
      <div className="card p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Eye className="w-4 h-4 text-[var(--warning-gold)]" />
            <span>Attention</span>
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Active: {activePct >= 0 ? `${activePct}%` : '—'}
          </span>
        </div>

        <div className="w-full bg-[var(--badge-bg)] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[var(--success-green)] h-full rounded-full transition-all"
            style={{ width: activePct >= 0 ? `${Math.min(100, activePct)}%` : '0%' }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] pt-1">
          <span>
            Distractions: <strong className="text-[var(--text-primary)]">{distractions}</strong>
          </span>
          <span>
            Sleepy checks: <strong className="text-[var(--text-primary)]">{sleepyChecks}</strong> ({sleepySummary})
          </span>
        </div>
      </div>

      {/* Chat Transcript & Inline Events */}
      <div className="card p-5 space-y-4">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            {deletedLocally
              ? 'Transcript has been deleted. Session statistics are retained.'
              : 'No conversation turns recorded for this session.'}
          </div>
        ) : (
          timeline.map((item, idx) => {
            if (item.kind === 'event') {
              return (
                <div
                  key={`ev-${item.event.id}-${idx}`}
                  className="flex items-center justify-center my-2"
                >
                  <div className="bg-[var(--input-bg)] border border-[var(--border-card)] text-[var(--text-muted)] text-[11px] px-3 py-1 rounded-full font-medium">
                    {formatInlineEventText(item.event, childName)} · {formatKolkataTime(item.event.at)}
                  </div>
                </div>
              );
            }

            const turn = item.turn;
            const isRobot = turn.speaker === 'robot';
            return (
              <div
                key={`turn-${turn.id}-${idx}`}
                className={`flex flex-col ${isRobot ? 'items-start' : 'items-end'}`}
              >
                <div className="text-[10px] text-[var(--text-muted)] mb-1 px-1">
                  {isRobot ? 'EduBuddy' : childName}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isRobot
                      ? 'bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-card)]'
                      : 'bg-[var(--study-blue)] text-white'
                  }`}
                >
                  {turn.text}
                </div>

                {turn.off_topic && (
                  <div className="text-[11px] text-[var(--warning-gold)] font-medium mt-1 px-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Off-topic · stayed on syllabus
                  </div>
                )}

                {isRobot && (
                  <button
                    onClick={() => setFlagTurnId(turn.id)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--error-red)] mt-1 px-1 flex items-center gap-1"
                  >
                    <Flag className="w-2.5 h-2.5" /> Flag reply
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Flag Modal */}
      {flagTurnId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Flag EduBuddy reply</h3>
            {flagSuccess ? (
              <div className="p-4 bg-[var(--success-green)]/10 text-[var(--success-green)] rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Reply flagged for review. Thank you!
              </div>
            ) : (
              <>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="What was wrong with this reply?"
                  rows={3}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setFlagTurnId(null)}
                    className="btn btn-secondary text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagSubmit}
                    disabled={!flagReason.trim()}
                    className="btn btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                  >
                    Submit Flag
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Delete transcript?</h3>
            <p className="text-xs text-[var(--text-muted)]">
              This permanently removes the chat messages from this session while keeping study minutes and exam scores.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTranscript}
                className="btn bg-[var(--error-red)] text-white text-xs px-3 py-1.5"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
