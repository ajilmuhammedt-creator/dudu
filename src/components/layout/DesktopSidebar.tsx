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

interface ChildSummary {
  id: string;
  name: string;
  cbse_class: number;
  avatar: string;
}

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  reviewCount?: number;
  childrenList?: ChildSummary[];
  selectedChildId?: string;
  onSelectChild?: (childId: string) => void;
  onOpenAddChild?: () => void;
  pairedChildId?: string | null;
  isOnline?: boolean;
}

export function DesktopSidebar({
  activeTab,
  onTabChange,
  reviewCount = 0,
  childrenList = [],
  selectedChildId,
  onSelectChild,
  onOpenAddChild,
  pairedChildId,
  isOnline = false
}: DesktopSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'review', label: 'Review queue', icon: CheckSquare, badge: reviewCount },
    { id: 'sessions', label: 'Sessions', icon: ListOrdered },
    { id: 'controls', label: 'Controls', icon: SlidersHorizontal },
    { id: 'devices', label: 'Devices', icon: Cpu }
  ];

  const displayChildren: ChildSummary[] =
    childrenList.length > 0
      ? childrenList
      : [{ id: '22222222-2222-2222-2222-222222222222', name: 'Arjun', cbse_class: 3, avatar: '👦' }];

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

        <div className="space-y-1.5">
          {displayChildren.map((child) => {
            const isSelected = child.id === selectedChildId;
            const hasRobot = pairedChildId === child.id;
            return (
              <button
                key={child.id}
                onClick={() => onSelectChild?.(child.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[var(--brand-orange)]/10 border-[var(--brand-orange)]/40'
                    : 'bg-[var(--input-bg)] border-[var(--border-card)] hover:border-[var(--brand-orange)]/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] font-bold text-sm flex items-center justify-center shrink-0">
                    {child.avatar || child.name[0]}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                      {child.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      CBSE Class {child.cbse_class}
                    </span>
                  </div>
                </div>
                {hasRobot && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isOnline ? 'bg-[#17A34A] animate-pulse' : 'bg-[#6B7280]'
                    }`}
                    title={isOnline ? 'Robot online' : 'Robot offline'}
                  />
                )}
              </button>
            );
          })}

          <button
            onClick={() => onOpenAddChild?.()}
            className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium text-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add child
          </button>
        </div>
      </div>
    </aside>
  );
}
