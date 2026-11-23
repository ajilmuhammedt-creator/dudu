// src/components/views/ReviewView.tsx
'use client';

import React, { useState } from 'react';
import { Check, X, RotateCcw, ZoomIn, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReviewViewProps {
  onSuccessReview?: () => void;
}

export function ReviewView({ onSuccessReview }: ReviewViewProps) {
  const [decision, setDecision] = useState<'correct' | 'half' | 'wrong' | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [rewriteStatus, setRewriteStatus] = useState<string | null>(null);

  const handleDecisionSubmit = async (selectedDecision: 'correct' | 'half' | 'wrong') => {
    setDecision(selectedDecision);
    setIsSubmitting(true);
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: '55555555-5555-5555-5555-555555555555',
          decision: selectedDecision
        })
      });
      setReviewed(true);
      onSuccessReview?.();
    } catch {
      setReviewed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskRewrite = async () => {
    setRewriteStatus('sending');
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade_id: '55555555-5555-5555-5555-555555555555',
          decision: 'rewrite'
        })
      });
      setRewriteStatus('sent');
      setTimeout(() => setRewriteStatus(null), 4000);
    } catch {
      setRewriteStatus('sent');
    }
  };

  if (reviewed) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-[#17A34A]/15 text-[#17A34A] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2328]">All caught up!</h2>
        <p className="text-sm text-[#6B7280] mt-2 mb-6">
          1 of 1 grade reviewed. Arjun’s chapter score has been updated.
        </p>
        <button
          onClick={() => setReviewed(false)}
          className="btn btn-secondary text-sm px-4"
        >
          Review again (Demo reset)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2328]">Check this grade</h1>
        <div className="text-xs text-[#6B7280] mt-1">
          Exam · Maths Mela Ch 12 Give and Take · Q3 · today 5:41 pm
        </div>
      </div>

      {/* Uncertainty Notice */}
      <div className="card p-4 bg-[#FFF8EC] border-[#B7791F]/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#B7791F] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[#1F2328] font-medium leading-relaxed">
            EduBuddy read the answer as <span className="font-bold underline">63</span> but was only{' '}
            <span className="font-bold text-[#B7791F]">58% sure</span> — the 6 could be a 0. Please decide.
          </p>
        </div>
      </div>

      {/* Question Card */}
      <div className="card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Question</div>
        <p className="text-base font-medium text-[#1F2328] leading-relaxed">
          Ravi has 36 marbles and his sister gives him 27 more. How many marbles does Ravi have now?
        </p>
        <div className="pt-2 border-t border-[#ECE7DE] flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            Correct answer: <strong className="text-[#1F2328]">63</strong>
          </span>
          <span className="bg-[#ECE7DE] px-2 py-0.5 rounded font-semibold text-[#1F2328]">2 marks</span>
        </div>
      </div>

      {/* Arjun's Page Photo Simulation */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Arjun’s page (photo)
          </span>
          <button
            onClick={() => setIsZoomed(true)}
            className="text-xs text-[#1E6FE0] font-medium hover:underline flex items-center gap-1"
          >
            <ZoomIn className="w-3.5 h-3.5" /> tap to zoom
          </button>
        </div>

        {/* Handwritten Mock Paper */}
        <div
          onClick={() => setIsZoomed(true)}
          className="relative bg-[#FFFDF9] border-2 border-dashed border-[#ECE7DE] rounded-2xl p-6 text-center cursor-pointer shadow-inner hover:border-[#1E6FE0]/40 transition-colors"
        >
          <div className="font-mono text-2xl font-bold tracking-widest text-[#1F2328] select-none">
            <div className="inline-block text-right pr-4">
              <div>36</div>
              <div className="border-b-2 border-black">+27</div>
              <div className="pt-1 text-[#F26B1D] font-extrabold text-3xl">63</div>
            </div>
          </div>
          <span className="block text-[11px] text-[#6B7280] mt-3">Camera capture · 160×128 ESP32-S3 lens</span>
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="card p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Your decision</div>
        <div className="grid grid-cols-3 gap-3">
          {/* Correct */}
          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('correct')}
            className={`btn flex-col py-3 px-2 rounded-xl border transition-all ${
              decision === 'correct'
                ? 'bg-[#17A34A] text-white border-[#17A34A]'
                : 'bg-white border-[#ECE7DE] text-[#1F2328] hover:border-[#17A34A] hover:bg-[#17A34A]/5'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-sm">
              <Check className="w-4 h-4 text-[#17A34A]" /> Correct
            </div>
            <span className="text-xs text-[#6B7280] mt-0.5">2 / 2</span>
          </button>

          {/* Half */}
          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('half')}
            className={`btn flex-col py-3 px-2 rounded-xl border transition-all ${
              decision === 'half'
                ? 'bg-[#B7791F] text-white border-[#B7791F]'
                : 'bg-white border-[#ECE7DE] text-[#1F2328] hover:border-[#B7791F] hover:bg-[#B7791F]/5'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-sm">Half</div>
            <span className="text-xs text-[#6B7280] mt-0.5">1 / 2</span>
          </button>

          {/* Wrong */}
          <button
            disabled={isSubmitting}
            onClick={() => handleDecisionSubmit('wrong')}
            className={`btn flex-col py-3 px-2 rounded-xl border transition-all ${
              decision === 'wrong'
                ? 'bg-[#D8262B] text-white border-[#D8262B]'
                : 'bg-white border-[#ECE7DE] text-[#1F2328] hover:border-[#D8262B] hover:bg-[#D8262B]/5'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-sm">
              <X className="w-4 h-4 text-[#D8262B]" /> Wrong
            </div>
            <span className="text-xs text-[#6B7280] mt-0.5">0 / 2</span>
          </button>
        </div>

        {/* Rewrite action on robot */}
        <div className="pt-2">
          <button
            onClick={handleAskRewrite}
            className="text-xs text-[#F26B1D] font-medium hover:underline flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ask Arjun to write it again on the robot</span>
          </button>
          {rewriteStatus === 'sent' && (
            <p className="text-xs text-[#17A34A] mt-1 font-medium">
              ✓ Sent command to robot! DuDu will ask Arjun on next sync.
            </p>
          )}
        </div>
      </div>

      {/* Footer Rule */}
      <p className="text-xs text-[#6B7280] text-center italic">
        Rule: Grades EduBuddy is sure about never land here.
      </p>

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#1F2328]">Arjun’s Page (Full Resolution)</h3>
            <div className="bg-[#FFFDF9] border border-[#ECE7DE] rounded-xl p-8 my-4 font-mono text-4xl font-bold tracking-widest text-[#1F2328]">
              <div>36</div>
              <div className="border-b-4 border-black">+27</div>
              <div className="pt-2 text-[#F26B1D] font-extrabold text-5xl">63</div>
            </div>
            <p className="text-xs text-[#6B7280]">
              Confidence: 58% (digit ‘6’ has an open top loop, potentially a ‘0’).
            </p>
            <button className="btn btn-secondary text-xs px-6">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
