// src/components/HomeShell.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { SignInView } from '@/components/views/SignInView';
import { DashboardData } from '@/lib/dashboard-types';
import { Loader2 } from 'lucide-react';

interface HomeShellProps {
  initialTab?: string;
}

const VALID_TABS = new Set([
  'today',
  'overview',
  'progress',
  'review',
  'controls',
  'devices',
  'sessions',
  'onboarding',
  'transcript'
]);

export function HomeShell({ initialTab }: HomeShellProps) {
  const [activeTab, setActiveTabState] = useState<string>(initialTab || 'today');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Sync ?tab= query param on mount if no initialTab was passed
  useEffect(() => {
    if (!initialTab && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get('tab');
      if (qTab && VALID_TABS.has(qTab)) {
        setActiveTabState(qTab);
      }
    }
  }, [initialTab]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard?child_id=22222222-2222-2222-2222-222222222222', {
        cache: 'no-store'
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }
      if (res.ok) {
        const data: DashboardData = await res.json();
        setDashboard(data);
        setIsAuthenticated(true);
      }
    } catch {
      // Network error
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Poll dashboard every 30s while authenticated so live robot syncs/sessions appear automatically
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchDashboard]);

  const navigateTab = (tab: string) => {
    setSelectedSessionId(null);
    setActiveTabState(tab);
    if (typeof window !== 'undefined' && tab !== 'transcript') {
      const targetPath = tab === 'today' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const handleOpenSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTabState('transcript');
  };

  const handleDownloadPdf = () => {
    window.open('/api/report/pdf', '_blank');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('dudu_parent_session');
    setIsAuthenticated(false);
    setDashboard(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--brand-orange)]" />
        <span className="text-xs font-medium text-[var(--text-muted)]">Loading EduBuddy Parent...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <SignInView
        onSignInSuccess={() => {
          setIsAuthenticated(true);
          fetchDashboard();
        }}
      />
    );
  }

  const reviewCount = dashboard?.needsReviewGrades?.length ?? 0;
  const childName = dashboard?.child?.name || 'Arjun';
  const cbseClass = dashboard?.child?.cbse_class || 3;
  const isOnline = dashboard?.device?.online ?? false;
  const selectedSession =
    dashboard?.sessions?.find((s) => s.id === selectedSessionId) || null;

  const renderActiveView = () => {
    if (activeTab === 'transcript') {
      return (
        <SessionTranscriptView
          session={selectedSession}
          childName={childName}
          onBack={() => navigateTab('today')}
          onRefresh={fetchDashboard}
        />
      );
    }

    switch (activeTab) {
      case 'today':
        return (
          <TodayView
            dashboard={dashboard}
            onNavigateTab={navigateTab}
            onOpenSession={handleOpenSession}
            onRefresh={fetchDashboard}
          />
        );
      case 'overview':
      case 'sessions':
        return (
          <DesktopDashboardView
            dashboard={dashboard}
            onNavigateTab={navigateTab}
            onOpenSession={handleOpenSession}
            onDownloadPdf={handleDownloadPdf}
            onRefresh={fetchDashboard}
          />
        );
      case 'progress':
        return <ProgressView dashboard={dashboard} />;
      case 'review':
        return (
          <ReviewView
            grades={dashboard?.needsReviewGrades || []}
            childName={childName}
            onSuccessReview={fetchDashboard}
          />
        );
      case 'controls':
        return <ControlsView />;
      case 'devices':
        return <DevicesView />;
      case 'onboarding':
        return <OnboardingView onComplete={() => navigateTab('today')} />;
      default:
        return (
          <TodayView
            dashboard={dashboard}
            onNavigateTab={navigateTab}
            onOpenSession={handleOpenSession}
            onRefresh={fetchDashboard}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Desktop Sidebar (Left Rail) */}
      <DesktopSidebar
        activeTab={activeTab === 'today' ? 'overview' : activeTab}
        onTabChange={navigateTab}
        reviewCount={reviewCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          childName={childName}
          cbseClass={cbseClass}
          isOnline={isOnline}
          reviewCount={reviewCount}
          activeTab={activeTab}
          onTabChange={navigateTab}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={navigateTab}
          reviewCount={reviewCount}
        />
      </div>
    </div>
  );
}
