// src/components/views/ProgressView.tsx
'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Target, Sparkles, BookOpen, ChevronRight, Check } from 'lucide-react';

export function ProgressView() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [practiceDispatched, setPracticeDispatched] = useState(false);

  // Weekly study minutes data M T W T F S S
  const weeklyData = [
    { day: 'M', minutes: 35 },
    { day: 'T', minutes: 42 },
    { day: 'W', minutes: 25 },
    { day: 'T', minutes: 30 },
    { day: 'F', minutes: 25 },
    { day: 'S', minutes: 33 },
    { day: 'S', minutes: 0 }
  ];

  const handleSetPractice = async () => {
    try {
      await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: '33333333-3333-3333-3333-333333333333',
          type: 'practice',
          arg: 'Give and Take (Ch 12): subtraction with borrowing'
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
        <h1 className="text-2xl font-bold text-[#1F2328]">Arjun’s progress</h1>
        <div className="bg-[#ECE7DE] p-1 rounded-xl flex items-center text-xs font-semibold">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg transition-all ${
              period === 'week' ? 'bg-white text-[#1F2328] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg transition-all ${
              period === 'month' ? 'bg-white text-[#1F2328] shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Study Minutes Chart */}
      <div className="card p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Study minutes
          </span>
          <div className="text-sm font-bold text-[#1F2328]">3h 10m this week</div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DE" />
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val} min`, 'Study Time']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #ECE7DE',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="minutes" fill="#1E6FE0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Subject: Mathematics */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#1F2328]">Mathematics</span>
          <span className="text-xs text-[#6B7280]">6 exams · avg 82%</span>
        </div>

        {/* Chapters */}
        <div className="space-y-3">
          {/* Chapter 12 */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
              <span>Give and Take (Ch 12)</span>
              <span>88%</span>
            </div>
            <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
              <div className="bg-[#17A34A] h-full rounded-full" style={{ width: '88%' }} />
            </div>
          </div>

          {/* Subtraction with borrowing */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
              <span>Give and Take: subtraction</span>
              <span className="text-[#D8262B]">55%</span>
            </div>
            <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
              <div className="bg-[#D8262B] h-full rounded-full" style={{ width: '55%' }} />
            </div>
          </div>

          {/* Chapter 10 */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
              <span>Fun at Class Party! (Ch 10)</span>
              <span>96%</span>
            </div>
            <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
              <div className="bg-[#17A34A] h-full rounded-full" style={{ width: '96%' }} />
            </div>
          </div>
        </div>

        {/* Weak-spot Insight Card */}
        <div className="bg-[#FFF5ED] border border-[#F26B1D]/30 rounded-2xl p-4 space-y-3 mt-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#F26B1D] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1F2328] font-medium leading-relaxed">
              Subtraction with borrowing (Give and Take) is the weak spot — 3 of 5 wrong answers were a borrowing slip.
            </p>
          </div>
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
      </div>

      {/* Environmental Studies */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#1F2328]">Environmental Studies</span>
          <span className="text-xs text-[#6B7280]">2 lessons · no exam yet</span>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Recent exams
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-2 border-b border-[#ECE7DE] text-xs">
            <div>
              <span className="font-semibold text-[#1F2328]">Tue · Give and Take (Ch 12)</span>
              <span className="text-[#6B7280] block text-[11px]">written on paper</span>
            </div>
            <span className="font-bold text-sm text-[#1F2328] bg-[#F6F3EE] px-2.5 py-1 rounded-lg">
              7 / 8
            </span>
          </div>

          <div className="flex items-center justify-between py-2 text-xs">
            <div>
              <span className="font-semibold text-[#1F2328]">Sun · Fun at Class Party!</span>
              <span className="text-[#6B7280] block text-[11px]">tapped on robot screen</span>
            </div>
            <span className="font-bold text-sm text-[#17A34A] bg-[#17A34A]/10 px-2.5 py-1 rounded-lg">
              10 / 10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
