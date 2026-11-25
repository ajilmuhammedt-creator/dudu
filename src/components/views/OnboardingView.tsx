// src/components/views/OnboardingView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Shield, Plus } from 'lucide-react';

interface ChildItem {
  id: string;
  name: string;
  cbse_class: number;
  avatar: string;
}

interface OnboardingViewProps {
  childrenList?: ChildItem[];
  onOpenAddChild?: () => void;
  onComplete: () => void;
}

export function OnboardingView({ childrenList = [], onOpenAddChild, onComplete }: OnboardingViewProps) {
  const [code, setCode] = useState('');
  const [children, setChildren] = useState<ChildItem[]>(childrenList);
  const [selectedChildId, setSelectedChildId] = useState(
    childrenList[0]?.id || '22222222-2222-2222-2222-222222222222'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (childrenList.length > 0) {
      setChildren(childrenList);
    } else {
      fetch('/api/children')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.children?.length) {
            setChildren(d.children);
            setSelectedChildId(d.children[0].id);
          }
        })
        .catch(() => {});
    }
  }, [childrenList]);

  const handlePair = async () => {
    setErrorMsg(null);
    setIsPairing(true);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          child_id: selectedChildId
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
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pair EduBuddy</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Switch the robot on. It shows a 6-digit code on its screen. Type that code here.
        </p>
      </div>

      {/* 6-digit Input */}
      <div className="card p-5 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block text-center">
          Pairing Code
        </label>
        <div className="flex justify-center">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-48 bg-[var(--input-bg)] border-2 border-[var(--brand-orange)]/40 focus:border-[var(--brand-orange)] rounded-2xl py-3 text-center text-3xl font-mono tracking-widest font-extrabold text-[var(--text-primary)] outline-none"
          />
        </div>
      </div>

      {/* Child Picker */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Pair to:</span>
          <button
            type="button"
            onClick={() => onOpenAddChild?.()}
            className="text-xs text-[var(--brand-orange)] font-medium hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add child
          </button>
        </div>

        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl p-2.5 text-sm font-semibold text-[var(--text-primary)]"
        >
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.avatar || '👦'} {c.name} · Class {c.cbse_class}
            </option>
          ))}
        </select>
      </div>

      {/* Privacy Note */}
      <div className="flex items-start gap-2.5 px-2 text-xs text-[var(--text-muted)]">
        <Shield className="w-4 h-4 text-[var(--success-green)] shrink-0 mt-0.5" />
        <p>
          The robot keeps its own key. Pairing only tells it which family and child it belongs to; you can unpair any time.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[var(--error-red)]/10 border border-[var(--error-red)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--error-red)] font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-xl flex items-center gap-2 text-xs text-[var(--success-green)] font-semibold">
          <Check className="w-4 h-4 shrink-0" />
          <span>EduBuddy paired successfully! Redirecting...</span>
        </div>
      )}

      <button
        onClick={handlePair}
        disabled={isPairing || code.length < 6}
        className="btn btn-primary w-full text-sm font-semibold shadow-md py-3 disabled:opacity-50"
      >
        {isPairing ? 'Pairing robot...' : 'Pair robot'}
      </button>
    </div>
  );
}
