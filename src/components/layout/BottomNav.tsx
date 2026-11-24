// src/components/layout/BottomNav.tsx
'use client';

import React from 'react';
import { Calendar, TrendingUp, CheckSquare, SlidersHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  reviewCount?: number;
}

export function BottomNav({ activeTab, onTabChange, reviewCount = 1 }: BottomNavProps) {
  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'review', label: 'Review', icon: CheckSquare, badge: reviewCount },
    { id: 'controls', label: 'Controls', icon: SlidersHorizontal }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-card)] px-3 py-2 shadow-lg transition-colors">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all ${
                isActive ? 'text-[var(--brand-orange)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[var(--brand-orange)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
