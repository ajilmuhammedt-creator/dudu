// src/components/layout/DesktopSidebar.tsx
'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  CheckSquare,
  ListOrdered,
  SlidersHorizontal,
  Cpu,
  Users,
  Plus,
  Sparkles,
  Monitor
} from 'lucide-react';
import Link from 'next/link';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  reviewCount?: number;
}

export function DesktopSidebar({ activeTab, onTabChange, reviewCount = 1 }: DesktopSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'review', label: 'Review queue', icon: CheckSquare, badge: reviewCount },
    { id: 'sessions', label: 'Sessions', icon: ListOrdered },
    { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
    { id: 'devices', label: 'Devices', icon: Cpu }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border-card)] bg-[var(--bg-card)] min-h-screen p-5 shrink-0 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-8 cursor-pointer" onClick={() => onTabChange('overview')}>
        <div className="w-9 h-9 rounded-xl bg-[var(--brand-orange)] flex items-center justify-center text-white font-bold shadow-md shadow-[var(--brand-orange)]/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">EduBuddy</span>
          <span className="block text-[11px] text-[var(--text-muted)] font-medium -mt-1">Parent Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-2">Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--brand-orange)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[var(--brand-orange)]' : 'bg-[var(--brand-orange)] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Direct Link to Robot Screen */}
        <Link
          href="/robot"
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)] transition-all"
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-[var(--brand-orange)]" />
            <span>Robot Screen</span>
          </div>
          <span className="text-[10px] bg-[var(--border-card)] px-1.5 py-0.5 rounded font-mono">Live</span>
        </Link>
      </div>

      {/* Children Section */}
      <div className="mt-auto pt-6 border-t border-[var(--border-card)]">
        <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Children</span>
          <Users className="w-3.5 h-3.5" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] font-bold text-xs flex items-center justify-center">
                A
              </div>
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">Arjun</span>
                <span className="text-[10px] text-[var(--text-muted)] block">CBSE Class 3</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#17A34A] animate-pulse" title="Robot online" />
          </div>

          <button
            onClick={() => onTabChange('onboarding')}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium text-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add child
          </button>
        </div>
      </div>
    </aside>
  );
}
