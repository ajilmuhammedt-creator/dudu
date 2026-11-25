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
import { DesktopDashboardView } from '@/components/views/DesktopDashboardView';
import { SignInView } from '@/components/views/SignInView';
import { AddChildModal } from '@/components/modals/AddChildModal';
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
  'transcript'
]);

const REQUIRE_LOGIN = process.env.NEXT_PUBLIC_REQUIRE_LOGIN === 'true';
const DEFAULT_CHILD_ID = '22222222-2222-2222-2222-222222222222';

export function HomeShell({ initialTab }: HomeShellProps) {
  const [activeTab, setActiveTabState] = useState<string>(initialTab || 'today');
  const [selectedChildId, setSelectedChildId] = useState<string>(DEFAULT_CHILD_ID);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(!REQUIRE_LOGIN);
  const [isAuthenticated, setIsAuthenticated] = useState(!REQUIRE_LOGIN);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // Restore ?tab= and saved selectedChildId on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!initialTab) {
        const params = new URLSearchParams(window.location.search);
        const qTab = params.get('tab');
        if (qTab && VALID_TABS.has(qTab)) {
          setActiveTabState(qTab);
        }
      }
      const savedChild = localStorage.getItem('dudu_selected_child_id');
      if (savedChild) {
        setSelectedChildId(savedChild);
      }
    }
  }, [initialTab]);

  const fetchDashboard = useCallback(
    async (overrideChildId?: string) => {
      const targetChild = overrideChildId || selectedChildId;
      try {
        const res = await fetch(
          `/api/dashboard?child_id=${encodeURIComponent(targetChild)}`,
          { cache: 'no-store' }
        );
        if (res.status === 401 && REQUIRE_LOGIN) {
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
    },
    [selectedChildId]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Poll dashboard every 30s while active so live robot syncs/sessions appear automatically
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchDashboard(), 30000);
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

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    setSelectedSessionId(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dudu_selected_child_id', childId);
    }
    fetchDashboard(childId);
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

  if (REQUIRE_LOGIN && !authChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--brand-orange)]" />
        <span className="text-xs font-medium text-[var(--text-muted)]">Loading EduBuddy Parent...</span>
      </div>
    );
  }

  if (REQUIRE_LOGIN && !isAuthenticated) {
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
  const childrenList = dashboard?.children || [];
  const isOnline = dashboard?.device?.online ?? false;
  const pairedChildId = dashboard?.device?.paired ? (dashboard.device as any).child_id ?? null : null;
  const selectedSession =
    dashboard?.sessions?.find((s) => s.id === selectedSessionId) || null;

  const renderActiveView = () => {
    if (activeTab === 'transcript') {
      return (
        <SessionTranscriptView
          session={selectedSession}
          childName={childName}
          onBack={() => navigateTab('today')}
          onRefresh={() => fetchDashboard()}
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
            onRefresh={() => fetchDashboard()}
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
            onRefresh={() => fetchDashboard()}
          />
        );
      case 'progress':
        return <ProgressView dashboard={dashboard} />;
      case 'review':
        return (
          <ReviewView
            grades={dashboard?.needsReviewGrades || []}
            childName={childName}
            onSuccessReview={() => fetchDashboard()}
          />
        );
      case 'controls':
        return (
          <ControlsView
            childId={selectedChildId}
            childName={childName}
            cbseClass={cbseClass}
            onChildUpdated={() => fetchDashboard()}
          />
        );
      case 'devices':
        return (
          <DevicesView
            childrenList={childrenList}
            onRefresh={() => fetchDashboard()}
          />
        );
      default:
        return (
          <TodayView
            dashboard={dashboard}
            onNavigateTab={navigateTab}
            onOpenSession={handleOpenSession}
            onRefresh={() => fetchDashboard()}
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
        childrenList={childrenList}
        selectedChildId={selectedChildId}
        onSelectChild={handleSelectChild}
        onOpenAddChild={() => setShowAddChildModal(true)}
        pairedChildId={pairedChildId}
        isOnline={isOnline}
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
          onSignOut={REQUIRE_LOGIN ? handleSignOut : undefined}
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

      {/* Add Student Modal */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSuccess={(newChild) => {
          handleSelectChild(newChild.id);
        }}
      />
    </div>
  );
}
