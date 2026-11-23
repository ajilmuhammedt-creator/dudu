// src/components/layout/Navbar.tsx
'use client';

import React from 'react';
import { Wifi, Cpu, Bell, ChevronDown } from 'lucide-react';

interface NavbarProps {
  childName?: string;
  cbseClass?: number;
  isOnline?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Navbar({
  childName = 'Arjun',
  cbseClass = 3,
  isOnline = true,
  activeTab,
  onTabChange
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F6F3EE]/90 backdrop-blur-md border-b border-[#ECE7DE] px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Child Profile & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F26B1D]/15 flex items-center justify-center text-xl font-bold text-[#F26B1D] border border-[#F26B1D]/30 shadow-sm">
            {childName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1F2328] text-base">{childName}</span>
              <span className="text-xs bg-[#ECE7DE] text-[#6B7280] px-2 py-0.5 rounded-full font-medium">
                Class {cbseClass}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
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
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-white border border-[#ECE7DE] px-3 py-1.5 rounded-full text-[#6B7280]">
            <Cpu className="w-3.5 h-3.5 text-[#F26B1D]" />
            <span>DuDu ESP32-S3</span>
            <span className="text-[#1F2328] font-mono">192.168.1.107</span>
          </div>

          <button
            onClick={() => onTabChange?.('review')}
            className="relative p-2 rounded-xl bg-white border border-[#ECE7DE] hover:bg-[#FBF9F6] transition-colors"
            title="Review Queue"
          >
            <Bell className="w-5 h-5 text-[#1F2328]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F26B1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              1
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
