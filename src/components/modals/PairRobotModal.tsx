'use client';

import React, { useState } from 'react';
import { Cpu, X, Check, Loader2, AlertCircle } from 'lucide-react';

interface PairRobotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (childName: string) => void;
}

export function PairRobotModal({ isOpen, onClose, onSuccess }: PairRobotModalProps) {
  const [code, setCode] = useState('');
  const [childId, setChildId] = useState('22222222-2222-2222-2222-222222222222');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          child_id: childId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to pair device.');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess(data.child_name || 'Arjun');
      }
      setTimeout(() => {
        setSuccess(false);
        setCode('');
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Pairing failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6B7280] hover:text-[#1F2328]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F26B1D]/15 text-[#F26B1D] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F2328]">Pair a Robot</h3>
            <p className="text-xs text-[#6B7280]">Connect DuDu desk robot to your child</p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#17A34A]/15 text-[#17A34A] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1F2328]">Paired Successfully!</h4>
            <p className="text-xs text-[#6B7280]">DuDu is now linked to Arjun's profile.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[#D8262B]/10 border border-[#D8262B]/20 rounded-xl flex items-center gap-2 text-xs text-[#D8262B]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1F2328] mb-1">
                6-Digit Pairing Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 483921"
                autoFocus
                className="w-full text-center tracking-[0.3em] font-mono text-xl font-bold bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl py-3 text-[#1F2328] focus:outline-none focus:border-[#F26B1D]"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Check the 6 digits shown on DuDu's screen
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2328] mb-1">
                Assign to Child
              </label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full bg-[#F6F3EE] border border-[#ECE7DE] rounded-xl p-2.5 text-xs text-[#1F2328] font-medium focus:outline-none focus:border-[#F26B1D]"
              >
                <option value="22222222-2222-2222-2222-222222222222">👦 Arjun (Class 3)</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn btn-primary text-xs px-5 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Pair Robot
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
