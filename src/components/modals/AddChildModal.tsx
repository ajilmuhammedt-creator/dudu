// src/components/modals/AddChildModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Check, UserPlus, AlertCircle } from 'lucide-react';
import { ALL_CBSE_SUBJECTS, AVATAR_EMOJIS, getSubjectsForClass } from '@/lib/cbse-subjects';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (child: { id: string; name: string; cbse_class: number; avatar: string }) => void;
}

export function AddChildModal({ isOpen, onClose, onSuccess }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [cbseClass, setCbseClass] = useState(3);
  const [avatar, setAvatar] = useState('👦');
  const [subjects, setSubjects] = useState<string[]>(getSubjectsForClass(3));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubjects(getSubjectsForClass(cbseClass));
  }, [cbseClass]);

  if (!isOpen) return null;

  const toggleSubject = (sub: string) => {
    setSubjects((prev) =>
      prev.includes(sub) ? (prev.length > 1 ? prev.filter((s) => s !== sub) : prev) : [...prev, sub]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the student’s first name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          cbse_class: cbseClass,
          avatar,
          subjects
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Could not add student.');
      }
      setName('');
      setCbseClass(3);
      setAvatar('👦');
      onSuccess(data.child);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Add a student</h3>
            <p className="text-xs text-[var(--text-muted)]">Create a profile in your family</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[var(--error-red)]/10 border border-[var(--error-red)]/20 rounded-xl flex items-center gap-2 text-xs text-[var(--error-red)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              First name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya"
              autoFocus
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
            />
          </div>

          {/* CBSE Class 1-12 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              CBSE Class *
            </label>
            <select
              value={cbseClass}
              onChange={(e) => setCbseClass(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-orange)]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar Emoji */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Avatar (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${
                    avatar === emoji
                      ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/15 scale-105'
                      : 'border-[var(--border-card)] bg-[var(--input-bg)]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Starting Subjects */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Subjects to start with (default: Class {cbseClass} subjects)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CBSE_SUBJECTS.map((sub) => {
                const selected = subjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
                      selected
                        ? 'bg-[var(--brand-orange)] text-white border-[var(--brand-orange)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-card)]'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary text-xs px-5 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
