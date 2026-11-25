// src/components/views/ControlsView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Check,
  Bell,
  Lock,
  AlertTriangle,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Monitor,
  ExternalLink
} from 'lucide-react';
import { useTheme, ParentTheme, RobotTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { ALL_CBSE_SUBJECTS } from '@/lib/cbse-subjects';

interface ControlsViewProps {
  childId?: string;
  childName?: string;
  cbseClass?: number;
  onChildUpdated?: () => void;
}

export function ControlsView({
  childId = '22222222-2222-2222-2222-222222222222',
  childName = 'Arjun',
  cbseClass = 3,
  onChildUpdated
}: ControlsViewProps) {
  const { parentTheme, setParentTheme, robotTheme, setRobotTheme } = useTheme();

  const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'EVS']);
  const [stayOnSyllabus, setStayOnSyllabus] = useState(true);
  const [cameraExam, setCameraExam] = useState(true);
  const [breakPrompts, setBreakPrompts] = useState(true);
  const [keepPhotos, setKeepPhotos] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(60);
  const [windowStart, setWindowStart] = useState('16:30');
  const [windowEnd, setWindowEnd] = useState('19:30');
  const [language, setLanguage] = useState<'en' | 'hi' | 'ml'>('en');
  const [sensitivity, setSensitivity] = useState(4);
  const [pin, setPin] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Change class / name inline editor
  const [showClassEditor, setShowClassEditor] = useState(false);
  const [editName, setEditName] = useState(childName);
  const [editClass, setEditClass] = useState(cbseClass);

  useEffect(() => {
    setEditName(childName);
    setEditClass(cbseClass);
  }, [childName, cbseClass]);

  const allSubjects = ALL_CBSE_SUBJECTS;

  // Fetch current controls on mount or when childId changes
  useEffect(() => {
    let active = true;
    async function fetchControls() {
      try {
        const res = await fetch(`/api/controls?child_id=${encodeURIComponent(childId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings && active) {
            if (data.settings.subjects) setSubjects(data.settings.subjects);
            if (data.settings.stay_on_syllabus !== undefined) setStayOnSyllabus(data.settings.stay_on_syllabus);
            if (data.settings.camera_exam !== undefined) setCameraExam(data.settings.camera_exam);
            if (data.settings.break_prompts !== undefined) setBreakPrompts(data.settings.break_prompts);
            if (data.settings.keep_photos !== undefined) setKeepPhotos(data.settings.keep_photos);
            if (data.settings.daily_limit_min !== undefined) setDailyLimit(data.settings.daily_limit_min);
            if (data.settings.window_start) setWindowStart(data.settings.window_start);
            if (data.settings.window_end) setWindowEnd(data.settings.window_end);
            if (data.settings.language) setLanguage(data.settings.language);
            if (data.settings.wake_sensitivity !== undefined) setSensitivity(data.settings.wake_sensitivity);
            if (data.settings.theme) setParentTheme(data.settings.theme);
            if (data.settings.robot_theme) setRobotTheme(data.settings.robot_theme);
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
  }, [childId, setParentTheme, setRobotTheme]);

  const handleToggleSubject = (sub: string) => {
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

  const triggerAutoSave = async (override?: any) => {
    setIsSaving(true);
    try {
      const payload = {
        child_id: childId,
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
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to save changes. Please try again.' });
      setTimeout(() => setToast((prev) => (prev?.type === 'error' ? null : prev)), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleParentThemeChange = (newTheme: ParentTheme) => {
    setParentTheme(newTheme);
    triggerAutoSave({ theme: newTheme });
  };

  const handleRobotThemeChange = (newTheme: RobotTheme) => {
    setRobotTheme(newTheme);
    triggerAutoSave({ robot_theme: newTheme });
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">What EduBuddy may do</h1>
        <div className="flex items-center justify-between mt-1 text-sm text-[var(--text-muted)]">
          <span>{childName} · CBSE Class {cbseClass}</span>
          <button
            onClick={() => setShowClassEditor(!showClassEditor)}
            className="text-[var(--brand-orange)] font-medium hover:underline text-xs"
          >
            {showClassEditor ? 'Close' : 'Change class'}
          </button>
        </div>

        {showClassEditor && (
          <div className="card p-4 mt-3 space-y-3 border-[var(--brand-orange)]/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">Student name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">CBSE Class (1–12)</label>
                <select
                  value={editClass}
                  onChange={(e) => setEditClass(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-semibold"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClassEditor(false)}
                className="btn btn-secondary text-xs px-3 py-1.5 min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const res = await fetch('/api/children', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        child_id: childId,
                        name: editName.trim() || childName,
                        cbse_class: editClass
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Failed to update class');
                    if (data.settings?.subjects) setSubjects(data.settings.subjects);
                    setShowClassEditor(false);
                    setToast({ type: 'success', message: 'Class updated & synced to robot ✓' });
                    setTimeout(() => setToast(null), 3000);
                    onChildUpdated?.();
                  } catch (err: any) {
                    setToast({ type: 'error', message: err.message || 'Failed to update class' });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="btn btn-primary text-xs px-4 py-1.5 min-h-[36px]"
              >
                Save class
              </button>
            </div>
          </div>
        )}
      </div>

      {/* THEMES & APPEARANCE CARD */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--brand-orange)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Themes & Appearance
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
          {allSubjects.map((sub) => {
            const isSelected = subjects.includes(sub);
            return (
              <button
                key={sub}
                onClick={() => handleToggleSubject(sub)}
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
        {/* Syllabus */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Stay on the syllabus</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Off-topic questions get a gentle “let’s get back to maths”.
            </p>
          </div>
          <input
            type="checkbox"
            checked={stayOnSyllabus}
            onChange={(e) => {
              setStayOnSyllabus(e.target.checked);
              triggerAutoSave({ stay_on_syllabus: e.target.checked });
            }}
            className="w-5 h-5 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        {/* Camera */}
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
            className="w-5 h-5 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        {/* Break prompts */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Break prompts</div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              “Feeling sleepy?” if Arjun goes very still. No scoring.
            </p>
          </div>
          <input
            type="checkbox"
            checked={breakPrompts}
            onChange={(e) => {
              setBreakPrompts(e.target.checked);
              triggerAutoSave({ break_prompts: e.target.checked });
            }}
            className="w-5 h-5 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[var(--border-card)]" />

        {/* Keep Photos */}
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
            className="w-5 h-5 accent-[var(--brand-orange)] rounded cursor-pointer mt-0.5"
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
            disabled={pin.length !== 4}
            className="btn btn-secondary text-xs px-4 disabled:opacity-50"
          >
            Save PIN
          </button>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Placeholder for firmware parental lock features.
        </p>
      </div>
    </div>
  );
}
