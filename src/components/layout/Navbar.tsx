// src/components/layout/Navbar.tsx
'use client';

import React, { useState } from 'react';
import { Bell, Sun, Moon, Sparkles, Flame, Monitor, Palette, LogOut } from 'lucide-react';
import { useTheme, ParentTheme } from '@/context/ThemeContext';
import Link from 'next/link';

interface NavbarProps {
  childName?: string;
  cbseClass?: number;
  isOnline?: boolean;
  reviewCount?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

export function Navbar({
  childName = 'Arjun',
  cbseClass = 3,
  isOnline = true,
  reviewCount = 0,
  onTabChange,
  onSignOut
}: NavbarProps) {
  const { parentTheme, setParentTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  const themeOptions: { id: ParentTheme; label: string; icon: any; color: string }[] = [
    { id: 'light', label: 'Classic Cream', icon: Sun, color: '#F6F3EE' },
    { id: 'dark', label: 'Midnight Dark', icon: Moon, color: '#0B111E' },
    { id: 'soft-blue', label: 'Sky Blue', icon: Sparkles, color: '#EDF3FC' },
    { id: 'warm-orange', label: 'Sunset Amber', icon: Flame, color: '#FFF7ED' }
  ];

  const currentThemeOpt = themeOptions.find((t) => t.id === parentTheme) || themeOptions[0];
  const CurrentIcon = currentThemeOpt.icon;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-page)]/90 backdrop-blur-md border-b border-[var(--border-card)] px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Child Profile & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--brand-orange)]/15 flex items-center justify-center text-xl font-bold text-[var(--brand-orange)] border border-[var(--brand-orange)]/30 shadow-sm">
            {childName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)] text-base">{childName}</span>
              <span className="text-xs bg-[var(--badge-bg)] text-[var(--text-muted)] px-2 py-0.5 rounded-full font-medium">
                Class {cbseClass}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isOnline ? 'bg-[#17A34A] animate-pulse' : 'bg-[#6B7280]'
                }`}
              />
              <span>{isOnline ? 'Robot online' : 'Robot offline'}</span>
            </div>
          </div>
        </div>

        {/* Brand & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Link to Robot Screen */}
          <Link
            href="/robot"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--brand-orange)]/50 transition-all shadow-sm"
            title="Open DuDu Robot Screen"
          >
            <Monitor className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
            <span className="hidden sm:inline font-medium">Robot Screen</span>
          </Link>

          {/* Quick Theme Picker */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--brand-orange)]/40 transition-colors shadow-sm text-[var(--text-primary)]"
              title={`Current Theme: ${currentThemeOpt.label}`}
            >
              <CurrentIcon className="w-4 h-4 text-[var(--brand-orange)]" />
              <Palette className="w-3 h-3 text-[var(--text-muted)] hidden sm:block" />
            </button>

            {showThemePicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemePicker(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1 mb-1">
                    App Theme
                  </div>
                  <div className="space-y-1">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = parentTheme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setParentTheme(opt.id);
                            setShowThemePicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[var(--brand-orange)] text-white'
                              : 'text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" />
                            <span>{opt.label}</span>
                          </div>
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onTabChange?.('review')}
            className="relative p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:bg-[var(--input-bg)] transition-colors text-[var(--text-primary)]"
            title="Review Queue"
          >
            <Bell className="w-5 h-5 text-[var(--text-primary)]" />
            {reviewCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F26B1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {reviewCount}
              </span>
            )}
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] hover:bg-[var(--input-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--error-red)]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
