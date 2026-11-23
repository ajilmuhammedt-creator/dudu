// src/components/views/OnboardingView.tsx
'use client';

import React, { useState } from 'react';
import { Cpu, Check, AlertCircle, ArrowRight, Shield, Plus } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(3); // Default to Step 3 for demonstration
  const [code, setCode] = useState('483921');
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePair = async () => {
    setErrorMsg(null);
    setIsPairing(true);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          child_id: '22222222-2222-2222-2222-222222222222'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Pairing failed');
      } else {
        setSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch {
      setErrorMsg('Network error connecting to cloud server');
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24 md:pb-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between text-xs font-semibold px-4">
        <span className={step === 1 ? 'text-[#F26B1D]' : 'text-[#6B7280]'}>1 Account</span>
        <span className="text-[#ECE7DE]">·</span>
        <span className={step === 2 ? 'text-[#F26B1D]' : 'text-[#6B7280]'}>2 Child</span>
        <span className="text-[#ECE7DE]">·</span>
        <span className={step === 3 ? 'text-[#F26B1D]' : 'text-[#6B7280]'}>3 Robot</span>
      </div>

      {step === 3 && (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-[#1F2328]">Pair Arjun’s EduBuddy</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Switch the robot on. It shows a 6-digit code on its screen. Type it here.
            </p>
          </div>

          {/* 6-digit Input */}
          <div className="card p-5 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] block text-center">
              Pairing Code
            </label>
            <div className="flex justify-center">
              <input
                type="text"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="483921"
                className="w-48 bg-[#F6F3EE] border-2 border-[#F26B1D]/40 focus:border-[#F26B1D] rounded-2xl py-3 text-center text-3xl font-mono tracking-widest font-extrabold text-[#1F2328] outline-none"
              />
            </div>
          </div>

          {/* Robot Screen Mockup Card */}
          <div className="card p-5 bg-gradient-to-b from-[#2D3139] to-[#1F2328] text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>What the robot’s screen looks like</span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#17A34A]" /> 192.168.1.107
              </span>
            </div>

            <div className="border border-white/20 rounded-xl p-4 bg-black/40 text-center space-y-2">
              <div className="text-[11px] text-white/60">Hi! Let&apos;s get set up.</div>
              <div className="text-xs text-white/80">
                Ask a parent to open the EduBuddy app and enter this code:
              </div>
              <div className="font-mono text-3xl font-extrabold tracking-widest text-[#F26B1D] py-1">
                483 921
              </div>
              <div className="text-[10px] text-white/50">Device EB-QAI96T · Wi-Fi connected</div>
            </div>
          </div>

          {/* Child Picker */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6B7280]">Pair to:</span>
              <div className="flex items-center gap-1.5 font-semibold text-sm text-[#1F2328]">
                <span>👦 Arjun · Class 3</span>
              </div>
            </div>
            <button className="text-xs text-[#F26B1D] font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add child
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 px-2 text-xs text-[#6B7280]">
            <Shield className="w-4 h-4 text-[#17A34A] shrink-0 mt-0.5" />
            <p>
              The robot keeps its own key. Pairing only tells it which family and child it belongs to; you can unpair any time.
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-[#D8262B]/10 border border-[#D8262B]/30 rounded-xl flex items-center gap-2 text-xs text-[#D8262B] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Notice */}
          {success && (
            <div className="p-3 bg-[#17A34A]/10 border border-[#17A34A]/30 rounded-xl flex items-center gap-2 text-xs text-[#17A34A] font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>EduBuddy paired successfully! Redirecting...</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handlePair}
            disabled={isPairing || code.length < 6}
            className="btn btn-primary w-full text-sm font-semibold shadow-md py-3 disabled:opacity-50"
          >
            {isPairing ? 'Pairing robot...' : 'Pair robot'}
          </button>
        </div>
      )}
    </div>
  );
}
