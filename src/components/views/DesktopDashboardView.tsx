// src/components/views/DesktopDashboardView.tsx
'use client';

import React, { useState } from 'react';
import {
  Download,
  Target,
  Sparkles,
  ChevronRight,
  Camera,
  CameraOff,
  Check,
  X,
  Cpu,
  Clock,
  Award,
  AlertCircle,
  Coffee,
  FileText
} from 'lucide-react';

interface DesktopDashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenSession: (sessionId: string) => void;
  onDownloadPdf: () => void;
}

export function DesktopDashboardView({
  onNavigateTab,
  onOpenSession,
  onDownloadPdf
}: DesktopDashboardViewProps) {
  const [practiceDispatched, setPracticeDispatched] = useState(false);
  const [reviewResolved, setReviewResolved] = useState(false);

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
      setTimeout(() => setPracticeDispatched(false), 3000);
    } catch {}
  };

  const handleInlineResolve = async (decision: 'correct' | 'wrong') => {
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: '55555555-5555-5555-5555-555555555555',
          decision
        })
      });
      setReviewResolved(true);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Header & Main Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2328] tracking-tight">Arjun — this week</h1>
          <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-2">
            <span>CBSE Class 3 · Mathematics, EVS</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-medium text-[#17A34A]">
              <span className="w-2 h-2 rounded-full bg-[#17A34A] animate-pulse" />
              EduBuddy “Study Room” online
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadPdf}
            className="btn btn-secondary text-xs font-semibold px-4 gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-[#6B7280]" />
            <span>Download report (PDF)</span>
          </button>

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

      {/* 4 KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study Time */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2 flex items-center justify-between">
            <span>Study time</span>
            <Clock className="w-4 h-4 text-[#1E6FE0]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">3h 10m</span>
          </div>
          <div className="text-xs text-[#17A34A] font-semibold mt-1">
            ▲ 40 min vs last week
          </div>
        </div>

        {/* Exams Taken */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2 flex items-center justify-between">
            <span>Exams taken</span>
            <Award className="w-4 h-4 text-[#F26B1D]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">6</span>
          </div>
          <div className="text-xs text-[#6B7280] font-medium mt-1">
            avg score <strong className="text-[#1F2328]">82%</strong>
          </div>
        </div>

        {/* Needs Your Check */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2 flex items-center justify-between">
            <span>Needs your check</span>
            <AlertCircle className="w-4 h-4 text-[#D8262B]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">
              {reviewResolved ? '0' : '1'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('review')}
            className="text-xs text-[#F26B1D] font-semibold mt-1 hover:underline text-left block"
          >
            {reviewResolved ? 'Review queue cleared' : 'Open review queue →'}
          </button>
        </div>

        {/* Break Prompts */}
        <div className="card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2 flex items-center justify-between">
            <span>Break prompts</span>
            <Coffee className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">2</span>
          </div>
          <div className="text-xs text-[#6B7280] mt-1">both after 6 pm</div>
        </div>
      </div>

      {/* Main Grid: Left 2 Cols (Mastery + Sessions) & Right Rail (Review Queue + Device) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chapter Mastery Table */}
          <div className="card p-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1F2328]">
                  Chapter mastery · Mathematics
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Maths Mela, Class 3 · from 6 exams, 41 questions
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* House of Hundreds */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
                  <span>House of Hundreds – II (Ch 9)</span>
                  <span className="font-bold">92%</span>
                </div>
                <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#17A34A] h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>

              {/* Give and Take */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
                  <span>Give and Take (Ch 12)</span>
                  <span className="font-bold">88%</span>
                </div>
                <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#17A34A] h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              {/* Subtraction with Borrowing */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
                  <span>Give and Take: subtraction with borrowing</span>
                  <span className="font-bold text-[#D8262B]">55%</span>
                </div>
                <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#D8262B] h-full rounded-full" style={{ width: '55%' }} />
                </div>
              </div>

              {/* Fun at Class Party */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1F2328] mb-1">
                  <span>Fun at Class Party! (Ch 10)</span>
                  <span className="font-bold">96%</span>
                </div>
                <div className="w-full bg-[#ECE7DE] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#17A34A] h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
            </div>

            {/* Weak-spot Insight Box */}
            <div className="bg-[#FFF5ED] border border-[#F26B1D]/30 rounded-2xl p-4 flex items-start gap-3 mt-4">
              <Sparkles className="w-4 h-4 text-[#F26B1D] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[#1F2328] font-medium leading-relaxed">
                  Subtraction with borrowing (Give and Take) is the weak spot — 3 of 5 wrong answers were a borrowing slip.
                </p>
              </div>
              <button
                onClick={handleSetPractice}
                className="btn btn-primary text-xs px-3 py-1.5 shrink-0"
              >
                Set practice
              </button>
            </div>
          </div>

          {/* Sessions This Week Table */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1F2328]">Sessions this week</h2>
              <span className="text-xs text-[#6B7280]">6 total sessions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECE7DE] text-[#6B7280] font-semibold">
                    <th className="pb-2.5">When</th>
                    <th className="pb-2.5">Mode</th>
                    <th className="pb-2.5">Topic</th>
                    <th className="pb-2.5">Length</th>
                    <th className="pb-2.5">Result</th>
                    <th className="pb-2.5">Camera</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE7DE]">
                  <tr className="hover:bg-[#F6F3EE]/50 transition-colors">
                    <td className="py-3 font-medium text-[#1F2328]">Today 5:32 pm</td>
                    <td className="py-3">
                      <span className="bg-[#F26B1D]/10 text-[#F26B1D] px-2 py-0.5 rounded font-semibold text-[11px]">
                        Exam
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#1F2328]">Give and Take</td>
                    <td className="py-3 text-[#6B7280]">16 min</td>
                    <td className="py-3 font-bold text-[#1F2328]">7 / 8</td>
                    <td className="py-3">
                      <Camera className="w-3.5 h-3.5 text-[#17A34A]" />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onOpenSession('44444444-4444-4444-4444-444444444442')}
                        className="text-[#1E6FE0] hover:underline font-semibold"
                      >
                        Transcript
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F6F3EE]/50 transition-colors">
                    <td className="py-3 font-medium text-[#1F2328]">Today 5:05 pm</td>
                    <td className="py-3">
                      <span className="bg-[#1E6FE0]/10 text-[#1E6FE0] px-2 py-0.5 rounded font-semibold text-[11px]">
                        Learn
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#1F2328]">Give and Take</td>
                    <td className="py-3 text-[#6B7280]">26 min</td>
                    <td className="py-3 text-[#6B7280]">14 questions</td>
                    <td className="py-3">
                      <CameraOff className="w-3.5 h-3.5 text-[#6B7280]" />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onOpenSession('44444444-4444-4444-4444-444444444441')}
                        className="text-[#1E6FE0] hover:underline font-semibold"
                      >
                        Transcript
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F6F3EE]/50 transition-colors">
                    <td className="py-3 font-medium text-[#1F2328]">Yesterday</td>
                    <td className="py-3">
                      <span className="bg-[#F26B1D]/10 text-[#F26B1D] px-2 py-0.5 rounded font-semibold text-[11px]">
                        Exam
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-[#1F2328]">Fun at Class Party!</td>
                    <td className="py-3 text-[#6B7280]">25 min</td>
                    <td className="py-3 font-bold text-[#17A34A]">10 / 10</td>
                    <td className="py-3">
                      <CameraOff className="w-3.5 h-3.5 text-[#6B7280]" />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onOpenSession('s-past-1')}
                        className="text-[#1E6FE0] hover:underline font-semibold"
                      >
                        Transcript
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Rail: Review Queue Preview + Device Status */}
        <div className="space-y-6">
          {/* Review Queue Preview */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F26B1D]" />
                <h2 className="text-base font-bold text-[#1F2328]">Review Queue</h2>
              </div>
              <span className="bg-[#F26B1D] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {reviewResolved ? '0' : '1'}
              </span>
            </div>

            {reviewResolved ? (
              <div className="text-center py-6 text-xs text-[#6B7280]">
                All pending items reviewed!
              </div>
            ) : (
              <div className="border border-[#ECE7DE] rounded-2xl p-4 bg-[#FBF9F6] space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Give and Take · Q3</span>
                  <span className="text-[#B7791F] font-bold">58% sure</span>
                </div>
                <p className="text-xs font-semibold text-[#1F2328]">
                  36 + 27 = 63 (or 03?)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInlineResolve('correct')}
                    className="btn btn-secondary text-xs flex-1 py-1.5 font-bold hover:text-[#17A34A]"
                  >
                    <Check className="w-3.5 h-3.5 text-[#17A34A]" /> Correct
                  </button>
                  <button
                    onClick={() => handleInlineResolve('wrong')}
                    className="btn btn-secondary text-xs flex-1 py-1.5 font-bold hover:text-[#D8262B]"
                  >
                    <X className="w-3.5 h-3.5 text-[#D8262B]" /> Wrong
                  </button>
                </div>
                <button
                  onClick={() => onNavigateTab('review')}
                  className="w-full text-center text-[11px] text-[#F26B1D] font-medium hover:underline block pt-1"
                >
                  Inspect photo & decide in full view →
                </button>
              </div>
            )}
          </div>

          {/* Device Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F26B1D]/15 text-[#F26B1D] flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2328]">Study Room</h3>
                  <span className="text-[11px] text-[#6B7280]">DuDu ESP32-S3</span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#17A34A] bg-[#17A34A]/10 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17A34A]" /> Online
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#6B7280] pt-1">
              <div className="flex justify-between">
                <span>Local IP</span>
                <span className="font-mono text-[#1F2328]">192.168.1.107</span>
              </div>
              <div className="flex justify-between">
                <span>Camera state</span>
                <span className="font-medium text-[#17A34A]">Armed (Exam mode)</span>
              </div>
              <div className="flex justify-between">
                <span>Wi-Fi Signal</span>
                <span className="font-medium text-[#1F2328]">-58 dBm</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('devices')}
              className="btn btn-secondary w-full text-xs py-2 font-semibold"
            >
              Manage Device & Speak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
