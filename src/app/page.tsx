// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { TodayView } from '@/components/views/TodayView';
import { ReviewView } from '@/components/views/ReviewView';
import { ControlsView } from '@/components/views/ControlsView';
import { ProgressView } from '@/components/views/ProgressView';
import { SessionTranscriptView } from '@/components/views/SessionTranscriptView';
import { DevicesView } from '@/components/views/DevicesView';
import { OnboardingView } from '@/components/views/OnboardingView';
import { DesktopDashboardView } from '@/components/views/DesktopDashboardView';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(1);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize Supabase realtime listeners if configured
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel('edubuddy-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, () => {
          // Refresh review queue count
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload: any) => {
          if (payload.new?.last_seen) {
            const diff = (Date.now() - new Date(payload.new.last_seen).getTime()) / 1000;
            setIsOnline(diff <= 180);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {}
  }, []);

  const handleOpenSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('transcript');
  };

  const handleDownloadPdf = () => {
    window.open('/api/report/pdf', '_blank');
  };

  const renderActiveView = () => {
    // If viewing a transcript
    if (activeTab === 'transcript') {
      return (
        <SessionTranscriptView
          onBack={() => {
            setSelectedSessionId(null);
            setActiveTab('today');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'today':
        return (
          <TodayView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSession={handleOpenSession}
          />
        );
      case 'overview':
        return (
          <DesktopDashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSession={handleOpenSession}
            onDownloadPdf={handleDownloadPdf}
          />
        );
      case 'progress':
        return <ProgressView />;
      case 'review':
        return <ReviewView onSuccessReview={() => setReviewCount(0)} />;
      case 'controls':
        return <ControlsView />;
      case 'devices':
        return <DevicesView />;
      case 'sessions':
        return (
          <DesktopDashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSession={handleOpenSession}
            onDownloadPdf={handleDownloadPdf}
          />
        );
      case 'onboarding':
        return <OnboardingView onComplete={() => setActiveTab('today')} />;
      default:
        return (
          <TodayView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSession={handleOpenSession}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F6F3EE] text-[#1F2328]">
      {/* Desktop Sidebar (Left Rail) */}
      <DesktopSidebar
        activeTab={activeTab === 'today' ? 'overview' : activeTab}
        onTabChange={(tab) => {
          setSelectedSessionId(null);
          setActiveTab(tab);
        }}
        reviewCount={reviewCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          childName="Arjun"
          cbseClass={3}
          isOnline={isOnline}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedSessionId(null);
            setActiveTab(tab);
          }}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedSessionId(null);
            setActiveTab(tab);
          }}
          reviewCount={reviewCount}
        />
      </div>
    </div>
  );
}
