// src/components/modals/ChangeClassModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, GraduationCap, AlertCircle } from 'lucide-react';

interface ChangeClassModalProps {
  isOpen: boolean;
  childId: string;
  childName: string;
  cbseClass: number;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function ChangeClassModal({
  isOpen,
  childId,
  childName,
  cbseClass,
  onClose,
  onSuccess
}: ChangeClassModalProps) {
  const [name, setName] = useState(childName);
  const [selectedClass, setSelectedClass] = useState(cbseClass);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always reset from saved child values when opened
  useEffect(() => {
    if (isOpen) {
      setName(childName);
      setSelectedClass(cbseClass);
      setError(null);
    }
  }, [isOpen, childId, childName, cbseClass]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/children', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          name: name.trim() || childName,
          cbse_class: selectedClass
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update class');
      }
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update class');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Change class</h3>
            <p className="text-xs text-[var(--text-muted)]">Update student name or CBSE class (1–12)</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[var(--error-red)]/10 border border-[var(--error-red)]/20 rounded-xl flex items-center gap-2 text-xs text-[var(--error-red)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Student name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              CBSE Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary text-xs px-4 flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
