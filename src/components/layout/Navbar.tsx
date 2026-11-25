// src/components/layout/Navbar.tsx
'use client';

import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Monitor,
  Palette,
  LogOut,
  ChevronDown,
  Plus,
  GraduationCap,
  Check
} from 'lucide-react';
import { useTheme, ParentTheme } from '@/context/ThemeContext';
import Link from 'next/link';

interface ChildSummary {
  id: string;
  name: string;
  cbse_class: number;
  avatar: string;
}

interface NavbarProps {
  childId?: string;
  childName?: string;
  cbseClass?: number;
  childrenList?: ChildSummary[];
  hasRobot?: boolean;
  isOnline?: boolean;
  reviewCount?: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSelectChild?: (childId: string) => void;
  onOpenAddChild?: () => void;
  onOpenChangeClass?: () => void;
  onSignOut?: () => void;
}

export function Navbar({
  childId = '22222222-2222-2222-2222-222222222222',
  childName = 'Arjun',
  cbseClass = 3,
  childrenList = [],
  hasRobot = true,
  isOnline = true,
  reviewCount = 0,
  onTabChange,
  onSelectChild,
  onOpenAddChild,
  onOpenChangeClass,
  onSignOut
}: NavbarProps) {
  const { parentTheme, saveParentTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showChildMenu, setShowChildMenu] = useState(false);

  const themeOptions: { id: ParentTheme; label: string; icon: any; color: string }[] = [
    { id: 'light', label: 'Classic Cream', icon: Sun, color: '#F6F3EE' },
    { id: 'dark', label: 'Midnight Dark', icon: Moon, color: '#0B111E' },
    { id: 'soft-blue', label: 'Sky Blue', icon: Sparkles, color: '#EDF3FC' },
    { id: 'warm-orange', label: 'Sunset Amber', icon: Flame, color: '#FFF7ED' }
  ];

  const currentThemeOpt = themeOptions.find((t) => t.id === parentTheme) || themeOptions[0];
  const CurrentIcon = currentThemeOpt.icon;

  const displayChildren: ChildSummary[] =
    childrenList.length > 0
      ? childrenList
      : [{ id: childId, name: childName, cbse_class: cbseClass, avatar: '👦' }];

  const currentChild = displayChildren.find((c) => c.id === childId) || displayChildren[0];

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-page)]/90 backdrop-blur-md border-b border-[var(--border-card)] px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Child Profile Switcher & Status */}
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setShowChildMenu(!showChildMenu)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-card)] transition-all text-left"
            title="Switch student or change class"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--brand-orange)]/15 flex items-center justify-center text-lg font-bold text-[var(--brand-orange)] border border-[var(--brand-orange)]/30 shadow-sm shrink-0">
              {currentChild?.avatar || childName[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base">
                  {childName}
                </span>
                <span className="text-xs bg-[var(--badge-bg)] text-[var(--text-muted)] px-2 py-0.5 rounded-full font-medium">
                  Class {cbseClass}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                {!hasRobot ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#6B7280]" />
                    <span>No robot</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange?.('devices');
                      }}
                      className="text-[var(--brand-orange)] font-semibold hover:underline ml-0.5"
                    >
                      · Pair a robot
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isOnline ? 'bg-[#17A34A] animate-pulse' : 'bg-[#6B7280]'
                      }`}
                    />
                    <span>{isOnline ? 'Robot online' : 'Robot offline'}</span>
                  </>
                )}
              </div>
            </div>
          </button>

          {showChildMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowChildMenu(false)} />
              <div className="absolute left-0 top-full mt-2 w-60 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1">
                  Students
                </div>
                <div className="space-y-1 mt-1">
                  {displayChildren.map((c) => {
                    const isSelected = c.id === childId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setShowChildMenu(false);
                          onSelectChild?.(c.id);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-[var(--brand-orange)]/15 text-[var(--brand-orange)]'
                            : 'text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.avatar || c.name[0]}</span>
                          <span>
                            {c.name} · Class {c.cbse_class}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--border-card)] my-2" />

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowChildMenu(false);
                      onOpenChangeClass?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[var(--study-blue)]" />
                    <span>Change class for {childName}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowChildMenu(false);
                      onOpenAddChild?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add student</span>
                  </button>
                </div>
              </div>
            </>
          )}
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
                            saveParentTheme(opt.id, childId);
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
