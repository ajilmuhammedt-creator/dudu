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
  Sparkles
} from 'lucide-react';

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
    <aside className="hidden md:flex flex-col w-64 border-r border-[#ECE7DE] bg-white min-h-screen p-5 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-8 cursor-pointer" onClick={() => onTabChange('overview')}>
        <div className="w-9 h-9 rounded-xl bg-[#F26B1D] flex items-center justify-center text-white font-bold shadow-md shadow-[#F26B1D]/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-[#1F2328] tracking-tight">EduBuddy</span>
          <span className="block text-[11px] text-[#6B7280] font-medium -mt-1">Parent Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1 mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] px-3 mb-2">Menu</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F26B1D]/10 text-[#F26B1D] font-semibold'
                  : 'text-[#1F2328] hover:bg-[#F6F3EE] hover:text-[#1F2328]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F26B1D]' : 'text-[#6B7280]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-[#F26B1D] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Children list */}
      <div className="mt-auto pt-4 border-t border-[#ECE7DE]">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Children</span>
          <button
            onClick={() => onTabChange('onboarding')}
            className="text-[#F26B1D] hover:underline flex items-center gap-1 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-[#F6F3EE] border border-[#ECE7DE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">👦</span>
            <div>
              <div className="text-sm font-semibold text-[#1F2328]">Arjun</div>
              <div className="text-[11px] text-[#6B7280]">CBSE Class 3</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#17A34A]" title="Robot connected" />
        </div>
      </div>
    </aside>
  );
}
