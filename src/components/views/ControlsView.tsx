// src/components/views/ControlsView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, ShieldCheck, Check, Bell, Lock, AlertTriangle } from 'lucide-react';

export function ControlsView() {
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

  const allSubjects = [
    'Mathematics',
    'EVS',
    'English',
    'Hindi',
    'Science',
    'Social Science',
    'Malayalam',
    'Computer'
  ];

  // Fetch current controls on mount
  useEffect(() => {
    let active = true;
    async function fetchControls() {
      try {
        const res = await fetch('/api/controls?child_id=22222222-2222-2222-2222-222222222222');
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
  }, []);

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
        child_id: '22222222-2222-2222-2222-222222222222',
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
        <h1 className="text-2xl font-bold text-[#1F2328]">What EduBuddy may do</h1>
        <div className="flex items-center justify-between mt-1 text-sm text-[#6B7280]">
          <span>Arjun · CBSE Class 3</span>
          <button className="text-[#F26B1D] font-medium hover:underline text-xs">
            Change class
          </button>
        </div>
      </div>

      {/* Subjects */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
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
                    ? 'bg-[#F26B1D] text-white border-[#F26B1D]'
                    : 'bg-white text-[#1F2328] border-[#ECE7DE] hover:border-[#F26B1D]/40'
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
            <div className="text-sm font-semibold text-[#1F2328]">Stay on the syllabus</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
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
            className="w-5 h-5 accent-[#F26B1D] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[#ECE7DE]" />

        {/* Camera */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#1F2328]">Camera for written exams</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Only during Exam and Scan & Check. Light shows when on.
            </p>
          </div>
          <input
            type="checkbox"
            checked={cameraExam}
            onChange={(e) => {
              setCameraExam(e.target.checked);
              triggerAutoSave({ camera_exam: e.target.checked });
            }}
            className="w-5 h-5 accent-[#F26B1D] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[#ECE7DE]" />

        {/* Break prompts */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#1F2328]">Break prompts</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
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
            className="w-5 h-5 accent-[#F26B1D] rounded cursor-pointer mt-0.5"
          />
        </div>

        <div className="border-t border-[#ECE7DE]" />

        {/* Keep Photos */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#1F2328]">Keep answer photos</div>
            <p className="text-xs text-[#6B7280] mt-0.5">
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
            className="w-5 h-5 accent-[#F26B1D] rounded cursor-pointer mt-0.5"
          />
        </div>
      </div>

      {/* Daily Study Limit */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Daily study limit
          </span>
          <span className="text-sm font-bold text-[#1F2328]">{dailyLimit} min</span>
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
          className="w-full accent-[#F26B1D] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[#6B7280]">
          <span>15 min</span>
          <span>1 hour</span>
          <span>3 hours</span>
        </div>
      </div>

      {/* Study Window */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Study window
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-[#6B7280] block mb-1">Start time</label>
            <input
              type="time"
              value={windowStart}
              onChange={(e) => {
                setWindowStart(e.target.value);
                triggerAutoSave({ window_start: e.target.value });
              }}
              className="w-full bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl px-3 py-2 text-sm text-[#1F2328] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#6B7280] block mb-1">End time</label>
            <input
              type="time"
              value={windowEnd}
              onChange={(e) => {
                setWindowEnd(e.target.value);
                triggerAutoSave({ window_end: e.target.value });
              }}
              className="w-full bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl px-3 py-2 text-sm text-[#1F2328] font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Robot Language */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
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
                  : 'bg-white border-[#ECE7DE] text-[#1F2328] hover:bg-[#F6F3EE]'
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
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            “Hey DuDu” sensitivity
          </span>
          <span className="text-sm font-bold text-[#1F2328]">{sensitivity} / 10</span>
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
          className="w-full accent-[#F26B1D] cursor-pointer"
        />
        <p className="text-[11px] text-[#6B7280]">
          Higher = wakes more easily, but may wake by itself.
        </p>
      </div>

      {/* Parent PIN on Robot */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#6B7280]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Parent PIN on the robot
            </span>
          </div>
          <span className="text-[11px] text-[#6B7280]">4 digits</span>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-32 bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl px-3 py-2 text-center text-base tracking-widest font-mono"
          />
          <button
            onClick={() => triggerAutoSave({ parent_pin: pin })}
            disabled={pin.length !== 4}
            className="btn btn-secondary text-xs px-4 disabled:opacity-50"
          >
            Save PIN
          </button>
        </div>
        <p className="text-[11px] text-[#6B7280]">
          Placeholder for firmware parental lock features.
        </p>
      </div>
    </div>
  );
}
