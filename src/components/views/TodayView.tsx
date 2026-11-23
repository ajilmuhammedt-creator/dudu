// src/components/views/TodayView.tsx
'use client';

import React, { useState } from 'react';
import { Clock, Award, Coffee, AlertCircle, ChevronRight, Camera, BookOpen, PenTool, Cpu } from 'lucide-react';
import { PairRobotModal } from '../modals/PairRobotModal';

interface TodayViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenSession: (sessionId: string) => void;
}

export function TodayView({ onNavigateTab, onOpenSession }: TodayViewProps) {
  const [showPairModal, setShowPairModal] = useState(false);
  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2328]">Today, Tuesday</h1>
          <p className="text-sm text-[#6B7280]">CBSE Class 3 · Mathematics, EVS</p>
        </div>
        <button
          onClick={() => setShowPairModal(true)}
          className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-sm border-[#ECE7DE] hover:border-[#F26B1D]/40 text-[#1F2328]"
        >
          <Cpu className="w-3.5 h-3.5 text-[#F26B1D]" /> Pair a robot
        </button>
      </div>

      {/* 3 Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Study Time */}
        <div className="card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study time</span>
            <Clock className="w-4 h-4 text-[#1E6FE0]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">42</span>
            <span className="text-sm font-semibold text-[#6B7280]">min</span>
          </div>
          <div className="text-xs text-[#6B7280] mt-1">of 60 min daily limit</div>
          <div className="w-full bg-[#ECE7DE] h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#1E6FE0] h-full rounded-full" style={{ width: '70%' }} />
          </div>
        </div>

        {/* Exam Score */}
        <div className="card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Exam score</span>
            <Award className="w-4 h-4 text-[#F26B1D]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">7 / 8</span>
          </div>
          <div className="text-xs font-medium text-[#1F2328] mt-1 truncate">Give and Take (Ch 12)</div>
          <div className="text-xs text-[#17A34A] font-medium mt-1">88% · Above syllabus average</div>
        </div>

        {/* Breaks */}
        <div className="card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Breaks</span>
            <Coffee className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[#1F2328]">1</span>
            <span className="text-sm font-semibold text-[#6B7280]">break</span>
          </div>
          <div className="text-xs text-[#6B7280] mt-1">sleepy prompt at 5:40 pm</div>
          <div className="text-xs text-[#6B7280] mt-1">Robot offered stretch & break</div>
        </div>
      </div>

      {/* Needs Review Banner */}
      <div
        onClick={() => onNavigateTab('review')}
        className="card p-4 sm:p-5 bg-gradient-to-r from-[#FFF5ED] to-[#FFFFFF] border-[#F26B1D]/30 flex items-center justify-between cursor-pointer shadow-sm hover:shadow transition-all group"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#F26B1D]/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-[#F26B1D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-[#F26B1D] text-white text-xs font-bold rounded-full">
                1
              </span>
              <h2 className="text-base font-bold text-[#1F2328]">Grade needs your check</h2>
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              EduBuddy wasn’t sure what Arjun wrote for Q3 in Give and Take (Ch 12).
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#F26B1D] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
      </div>

      {/* Today's Sessions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#1F2328]">Sessions</h2>
          <span className="text-xs text-[#6B7280]">2 sessions today</span>
        </div>

        <div className="space-y-3">
          {/* Learn Session */}
          <div
            onClick={() => onOpenSession('44444444-4444-4444-4444-444444444441')}
            className="card p-4.5 hover:border-[#1E6FE0]/40 cursor-pointer shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1E6FE0]/10 text-[#1E6FE0]">
                  <BookOpen className="w-3.5 h-3.5" /> Learn
                </span>
                <span className="text-sm font-semibold text-[#1F2328]">Give and Take</span>
              </div>
              <span className="text-xs font-bold text-[#1F2328] bg-[#ECE7DE] px-2.5 py-1 rounded-lg">
                26 min
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>5:05 – 5:31 pm · 14 questions asked · 1 off-topic</span>
              <span className="text-[#1E6FE0] font-medium group-hover:underline flex items-center gap-0.5">
                Transcript <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Exam Session */}
          <div
            onClick={() => onOpenSession('44444444-4444-4444-4444-444444444442')}
            className="card p-4.5 hover:border-[#F26B1D]/40 cursor-pointer shadow-sm hover:shadow transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F26B1D]/10 text-[#F26B1D]">
                  <PenTool className="w-3.5 h-3.5" /> Exam
                </span>
                <span className="text-sm font-semibold text-[#1F2328]">written on paper</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280] bg-[#F6F3EE] px-2 py-0.5 rounded">
                  <Camera className="w-3 h-3 text-[#17A34A]" /> camera used
                </span>
              </div>
              <span className="text-xs font-bold text-[#1F2328] bg-[#ECE7DE] px-2.5 py-1 rounded-lg">
                16 min
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>5:32 – 5:48 pm · Score: 7 / 8</span>
              <span className="text-[#F26B1D] font-medium group-hover:underline flex items-center gap-0.5">
                Check scan <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pair Robot Modal */}
      <PairRobotModal
        isOpen={showPairModal}
        onClose={() => setShowPairModal(false)}
      />
    </div>
  );
}
