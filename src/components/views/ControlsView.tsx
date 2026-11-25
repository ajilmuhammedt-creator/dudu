// src/components/views/ControlsView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Lock,
  AlertTriangle,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Monitor,
  ExternalLink,
  GraduationCap,
  Trash2
} from 'lucide-react';
import { useTheme, ParentTheme, RobotTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { ALL_CBSE_SUBJECTS } from '@/lib/cbse-subjects';
import { DashboardData } from '@/lib/dashboard-types';

interface ControlsViewProps {
  childId?: string;
  childName?: string;
  cbseClass?: number;
  initialSettings?: DashboardData['settings'];
  canRemoveStudent?: boolean;
  onOpenChangeClass?: () => void;
  onChildUpdated?: () => Promise<void> | void;
  onChildRemoved?: () => Promise<void> | void;
}

export function ControlsView({
  childId = '22222222-2222-2222-2222-222222222222',
  childName = 'Arjun',
  cbseClass = 3,
  initialSettings,
  canRemoveStudent = true,
  onOpenChangeClass,
  onChildUpdated,
  onChildRemoved
}: ControlsViewProps) {
  const { parentTheme, applyParentTheme, robotTheme, applyRobotTheme } = useTheme();

  const [subjects, setSubjects] = useState<string[]>(initialSettings?.subjects || []);
  const [stayOnSyllabus, setStayOnSyllabus] = useState(initialSettings?.stay_on_syllabus ?? true);
  const [cameraExam, setCameraExam] = useState(initialSettings?.camera_exam ?? true);
  const [breakPrompts, setBreakPrompts] = useState(initialSettings?.break_prompts ?? true);
  const [keepPhotos, setKeepPhotos] = useState(initialSettings?.keep_photos ?? false);
  const [dailyLimit, setDailyLimit] = useState(initialSettings?.daily_limit_min ?? 60);
  const [windowStart, setWindowStart] = useState(initialSettings?.window_start || '07:00');
  const [windowEnd, setWindowEnd] = useState(initialSettings?.window_end || '20:00');
  const [language, setLanguage] = useState<'en' | 'hi' | 'ml'>(initialSettings?.language || 'en');
  const [sensitivity, setSensitivity] = useState(initialSettings?.wake_sensitivity ?? 4);
  const [pin, setPin] = useState('');
  const [loadedChildId, setLoadedChildId] = useState<string | null>(
    initialSettings?.child_id || null
  );
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);

  const applyLoadedSettings = useCallback(
    (s: NonNullable<DashboardData['settings']>) => {
      if (Array.isArray(s.subjects)) setSubjects(s.subjects);
      if (s.stay_on_syllabus !== undefined) setStayOnSyllabus(s.stay_on_syllabus);
      if (s.camera_exam !== undefined) setCameraExam(s.camera_exam);
      if (s.break_prompts !== undefined) setBreakPrompts(s.break_prompts);
      if (s.keep_photos !== undefined) setKeepPhotos(s.keep_photos);
      if (s.daily_limit_min !== undefined) setDailyLimit(s.daily_limit_min);
      if (s.window_start) setWindowStart(s.window_start);
      if (s.window_end) setWindowEnd(s.window_end);
      if (s.language) setLanguage(s.language);
      if (s.wake_sensitivity !== undefined) setSensitivity(s.wake_sensitivity);
      // Pure UI apply only — NEVER POST on load/switch
      if (s.theme) applyParentTheme(s.theme);
      if (s.robot_theme) applyRobotTheme(s.robot_theme);
      setLoadedChildId(s.child_id);
    },
    [applyParentTheme, applyRobotTheme]
  );

  // Sync immediately whenever parent dashboard settings prop changes for the selected child
  useEffect(() => {
    if (initialSettings && initialSettings.child_id === childId) {
      applyLoadedSettings(initialSettings);
    }
  }, [childId, initialSettings, applyLoadedSettings]);

  // Also fetch fresh controls from server on mount or childId change
  useEffect(() => {
    let active = true;
    async function fetchControls() {
      try {
        const res = await fetch(`/api/controls?child_id=${encodeURIComponent(childId)}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings && active) {
            applyLoadedSettings(data.settings);
          }
        }
      } catch (err) {
        console.error('Failed to load controls:', err);
      }
    }
    fetchControls();
    return () => {
      active = false;
    };
  }, [childId, applyLoadedSettings]);

  const triggerAutoSave = async (override?: any) => {
    const targetChildId = childId;
    setIsSaving(true);
    try {
      const payload = {
        child_id: targetChildId,
        subjects,
        stay_on_syllabus: stayOnSyllabus,
        camera_exam: cameraExam,
        break_prompts: breakPrompts,
        keep_photos: keepPhotos,
        daily_limit_min: dailyLimit,
        window_start: windowStart,
        window_end: windowEnd,
        language,
        wake_sensitivity: sensitivity,
        parent_pin: pin.length === 4 ? pin : undefined,
        theme: parentTheme,
        robot_theme: robotTheme,
        ...override
      };

      const res = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update settings');
      }

      setToast({ type: 'success', message: 'Settings saved & synced to robot ✓' });
      setTimeout(() => setToast((prev) => (prev?.type === 'success' ? null : prev)), 3000);
      await onChildUpdated?.();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save changes. Please try again.' });
      setTimeout(() => setToast((prev) => (prev?.type === 'error' ? null : prev)), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSubject = (sub: string) => {
    if (loadedChildId !== childId) return;
    let next: string[];
    if (subjects.includes(sub)) {
      if (subjects.length === 1) return; // keep at least one
      next = subjects.filter((s) => s !== sub);
    } else {
      next = [...subjects, sub];
    }
    setSubjects(next);
    triggerAutoSave({ subjects: next });
  };

  const handleParentThemeChange = (newTheme: ParentTheme) => {
    applyParentTheme(newTheme);
    triggerAutoSave({ theme: newTheme });
  };

  const handleRobotThemeChange = (newTheme: RobotTheme) => {
    applyRobotTheme(newTheme);
    triggerAutoSave({ robot_theme: newTheme });
  };

  const handleRemoveStudent = async () => {
    setRemoving(true);
    try {
      const res = await fetch('/api/children', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          archived: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not remove student');
      }
      setShowRemoveModal(false);
      await onChildRemoved?.();
    } catch (err: any) {
      setShowRemoveModal(false);
      setToast({ type: 'error', message: err.message || 'Could not remove student' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-[#EF4444] text-white border border-red-600'
              : 'bg-[#17A34A] text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">What EduBuddy may do</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {childName} · CBSE Class {cbseClass}
          </p>
        </div>
        <button
          onClick={() => onOpenChangeClass?.()}
          className="btn btn-secondary text-xs px-3.5 py-2 min-h-[38px] gap-1.5 self-start sm:self-auto"
        >
          <GraduationCap className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
          <span>Change class</span>
        </button>
      </div>

      {/* THEMES & APPEARANCE CARD */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--brand-orange)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Themes &amp; Appearance
            </span>
          </div>
          <Link
            href="/robot"
            className="flex items-center gap-1 text-xs text-[var(--brand-orange)] font-semibold hover:underline"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Open Robot Screen</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* 1. Parent App Theme Selector */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-primary)] block mb-2">
            Parent App Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'light' as ParentTheme, name: 'Classic Cream', desc: 'Warm ivory & clean paper', bg: '#F6F3EE', text: '#1F2328' },
              { id: 'dark' as ParentTheme, name: 'Midnight', desc: 'Dark slate neumorphic', bg: '#0B111E', text: '#F8FAFC' },
              { id: 'soft-blue' as ParentTheme, name: 'Sky Blue', desc: 'Calm clouds & sky', bg: '#EDF3FC', text: '#0F294D' },
              { id: 'warm-orange' as ParentTheme, name: 'Sunset', desc: 'Warm cozy terracotta', bg: '#FFF7ED', text: '#431407' }
            ].map((t) => {
              const isSelected = parentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleParentThemeChange(t.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-[var(--brand-orange)] ring-2 ring-[var(--brand-orange)]/30 shadow-md'
                      : 'border-[var(--border-card)] hover:border-[var(--brand-orange)]/40 bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      ✓
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[var(--brand-orange)] bg-[var(--brand-orange)]/10 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-primary)]">{t.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[var(--border-card)]" />

        {/* 2. Robot Screen Theme Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] block">
                Robot Screen Theme (ESP32-S3)
              </label>
              <p className="text-[11px] text-[var(--text-muted)]">
                Syncs directly to DuDu’s display. Can also be previewed and toggled on the web Robot Screen.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'day' as RobotTheme, name: 'Day Light', icon: Sun, desc: 'Soft sunny clouds', bg: '#F0F4FF', border: '#D0E0FF' },
              { id: 'night' as RobotTheme, name: 'Night Moon', icon: Moon, desc: 'Low blue light star sky', bg: '#0B101D', border: '#1E293B' },
              { id: 'cosmic' as RobotTheme, name: 'Cosmic Violet', icon: Sparkles, desc: 'Galaxy space nebula', bg: '#180B2E', border: '#3B1E63' },
              { id: 'sunset' as RobotTheme, name: 'Golden Hour', icon: Flame, desc: 'Warm peach glow', bg: '#FFF1EB', border: '#FED7AA' }
            ].map((t) => {
              const isSelected = robotTheme === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleRobotThemeChange(t.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-[var(--brand-orange)] ring-2 ring-[var(--brand-orange)]/30 shadow-md'
                      : 'border-[var(--border-card)] hover:border-[var(--brand-orange)]/40 bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-sm"
                      style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}
                    >
                      <Icon className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[var(--brand-orange)] bg-[var(--brand-orange)]/10 px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-[var(--text-primary)]">{t.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Subjects the tutor may teach
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_CBSE_SUBJECTS.map((sub) => {
            const isSelected = subjects.includes(sub);
            return (
              <button
                key={sub}
                onClick={() => handleToggleSubject(sub)}
                disabled={loadedChildId !== childId}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--brand-orange)] text-white border-[var(--brand-orange)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-card)] hover:border-[var(--brand-orange)]/40'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Stay on the syllabus</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Off-topic questions get a gentle “let’s get back to {(subjects[0] || 'your lesson').toLowerCase()}”.
            </p>
          </div>
          <input
            type="checkbox"
            checked={stayOnSyllabus}
            onChange={(e) => {
              setStayOnSyllabus(e.target.checked);
              triggerAutoSave({ stay_on_syllabus: e.target.checked });
            }}
            className="w-5 h-5 shrink-0 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Camera for written exams</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              During Study mode, if the camera and break prompts are on, EduBuddy checks every 15 seconds whether your child is moving, to ask if they feel sleepy. Pictures stay on the robot and are deleted immediately; only counts are shared with you.
            </p>
          </div>
          <input
            type="checkbox"
            checked={cameraExam}
            onChange={(e) => {
              setCameraExam(e.target.checked);
              triggerAutoSave({ camera_exam: e.target.checked });
            }}
            className="w-5 h-5 shrink-0 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Break prompts</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              “Feeling sleepy?” if {childName} goes very still. No scoring.
            </p>
          </div>
          <input
            type="checkbox"
            checked={breakPrompts}
            onChange={(e) => {
              setBreakPrompts(e.target.checked);
              triggerAutoSave({ break_prompts: e.target.checked });
            }}
            className="w-5 h-5 shrink-0 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Keep answer photos</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Deleted after 30 days. Off = graded, then discarded.
            </p>
          </div>
          <input
            type="checkbox"
            checked={keepPhotos}
            onChange={(e) => {
              setKeepPhotos(e.target.checked);
              triggerAutoSave({ keep_photos: e.target.checked });
            }}
            className="w-5 h-5 shrink-0 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>
      </div>

      {/* Daily Study Limit */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Daily study limit
          </span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{dailyLimit} min</span>
        </div>
        <input
          type="range"
          min={15}
          max={180}
          step={5}
          value={dailyLimit}
          onChange={(e) => setDailyLimit(Number(e.target.value))}
          onMouseUp={() => triggerAutoSave({ daily_limit_min: dailyLimit })}
          onTouchEnd={() => triggerAutoSave({ daily_limit_min: dailyLimit })}
          className="w-full accent-[var(--brand-orange)] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
          <span>15 min</span>
          <span>1 hour</span>
          <span>3 hours</span>
        </div>
      </div>

      {/* Study Window */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Study window
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[var(--text-muted)] block mb-1">Start time</label>
            <input
              type="time"
              value={windowStart}
              onChange={(e) => {
                setWindowStart(e.target.value);
                triggerAutoSave({ window_start: e.target.value });
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] text-[var(--text-muted)] block mb-1">End time</label>
            <input
              type="time"
              value={windowEnd}
              onChange={(e) => {
                setWindowEnd(e.target.value);
                triggerAutoSave({ window_end: e.target.value });
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Robot Language */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Robot language
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'en', label: 'English' },
            { id: 'hi', label: 'हिंदी' },
            { id: 'ml', label: 'മലയാളം' }
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                setLanguage(lang.id as any);
                triggerAutoSave({ language: lang.id });
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                language === lang.id
                  ? 'bg-[#1E6FE0] text-white border-[#1E6FE0]'
                  : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sensitivity */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            “Hey DuDu” sensitivity
          </span>
          <span className="text-sm font-bold text-[var(--text-primary)]">{sensitivity} / 10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={sensitivity}
          onChange={(e) => setSensitivity(Number(e.target.value))}
          onMouseUp={() => triggerAutoSave({ wake_sensitivity: sensitivity })}
          onTouchEnd={() => triggerAutoSave({ wake_sensitivity: sensitivity })}
          className="w-full accent-[var(--brand-orange)] cursor-pointer"
        />
        <p className="text-[11px] text-[var(--text-muted)]">
          Higher = wakes more easily, but may wake by itself.
        </p>
      </div>

      {/* Parent PIN on Robot */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Parent PIN on the robot
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">4 digits</span>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-32 bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-center text-base tracking-widest font-mono"
          />
          <button
            onClick={() => triggerAutoSave({ parent_pin: pin })}
            disabled={pin.length !== 4 || isSaving}
            className="btn btn-secondary text-xs px-4 disabled:opacity-50"
          >
            Save PIN
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Placeholder for firmware parental lock features.
        </p>
      </div>

      {/* Remove Student */}
      {canRemoveStudent && (
        <div className="card p-5 flex items-center justify-between gap-4 border-[var(--error-red)]/20">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Remove student</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Archive {childName}’s profile and hide it from student lists.
            </p>
          </div>
          <button
            onClick={() => setShowRemoveModal(true)}
            className="btn btn-secondary text-xs text-[var(--error-red)] border-[var(--error-red)]/30 hover:bg-[var(--error-red)]/10 px-3.5 py-2 min-h-[38px] gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove student</span>
          </button>
        </div>
      )}

      {/* Confirm Remove Student Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Remove {childName}?
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              This archives {childName} and hides them from all student lists. If a robot is currently paired to {childName}, you’ll need to move the robot to another student on Devices first.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="btn btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveStudent}
                disabled={removing}
                className="btn bg-[var(--error-red)] text-white text-xs px-4 disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Remove student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
