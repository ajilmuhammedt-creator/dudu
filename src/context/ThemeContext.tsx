'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ParentTheme = 'light' | 'dark' | 'soft-blue' | 'warm-orange';
export type RobotTheme = 'day' | 'night' | 'cosmic' | 'sunset';

interface ThemeContextType {
  parentTheme: ParentTheme;
  robotTheme: RobotTheme;
  /** Pure UI state update (never writes to backend). Use when loading/switching child. */
  applyParentTheme: (theme: ParentTheme) => void;
  /** Pure UI state update (never writes to backend). Use when loading/switching child. */
  applyRobotTheme: (theme: RobotTheme) => void;
  /** Explicit user action: applies UI state AND persists to backend for the given childId. */
  saveParentTheme: (theme: ParentTheme, childId: string) => Promise<void>;
  /** Explicit user action: applies UI state AND persists to backend for the given childId. */
  saveRobotTheme: (theme: RobotTheme, childId: string) => Promise<void>;
  /** Backwards-compatible aliases (apply only, do NOT post to backend). */
  setParentTheme: (theme: ParentTheme) => void;
  setRobotTheme: (theme: RobotTheme) => void;
  toggleRobotDayNight: (childId?: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_PARENT_THEMES: ParentTheme[] = ['light', 'dark', 'soft-blue', 'warm-orange'];
const VALID_ROBOT_THEMES: RobotTheme[] = ['day', 'night', 'cosmic', 'sunset'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [parentTheme, setParentThemeState] = useState<ParentTheme>('light');
  const [robotTheme, setRobotThemeState] = useState<RobotTheme>('day');

  const applyParentTheme = useCallback((theme: ParentTheme) => {
    if (!VALID_PARENT_THEMES.includes(theme)) return;
    setParentThemeState(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('edubuddy_parent_theme', theme);
    }
  }, []);

  const applyRobotTheme = useCallback((theme: RobotTheme) => {
    if (!VALID_ROBOT_THEMES.includes(theme)) return;
    setRobotThemeState(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('edubuddy_robot_theme', theme);
    }
  }, []);

  // Load initial themes from localStorage and selected child's server settings (read-only)
  useEffect(() => {
    const savedParent = localStorage.getItem('edubuddy_parent_theme') as ParentTheme;
    if (savedParent && VALID_PARENT_THEMES.includes(savedParent)) {
      applyParentTheme(savedParent);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const savedRobot = localStorage.getItem('edubuddy_robot_theme') as RobotTheme;
    if (savedRobot && VALID_ROBOT_THEMES.includes(savedRobot)) {
      applyRobotTheme(savedRobot);
    }

    const activeChildId =
      localStorage.getItem('dudu_selected_child_id') || '22222222-2222-2222-2222-222222222222';

    async function fetchServerTheme() {
      try {
        const res = await fetch(`/api/controls?child_id=${encodeURIComponent(activeChildId)}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.theme) applyParentTheme(data.settings.theme);
            if (data.settings.robot_theme) applyRobotTheme(data.settings.robot_theme);
          }
        }
      } catch {}
    }
    fetchServerTheme();
  }, [applyParentTheme, applyRobotTheme]);

  const saveParentTheme = useCallback(
    async (theme: ParentTheme, childId: string) => {
      applyParentTheme(theme);
      try {
        await fetch('/api/controls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            child_id: childId,
            theme
          })
        });
      } catch {}
    },
    [applyParentTheme]
  );

  const saveRobotTheme = useCallback(
    async (theme: RobotTheme, childId: string) => {
      applyRobotTheme(theme);
      try {
        await fetch('/api/controls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            child_id: childId,
            robot_theme: theme
          })
        });
      } catch {}
    },
    [applyRobotTheme]
  );

  const toggleRobotDayNight = useCallback(
    (childId?: string) => {
      const nextTheme: RobotTheme = robotTheme === 'night' ? 'day' : 'night';
      const targetChild =
        childId ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('dudu_selected_child_id') : null) ||
        '22222222-2222-2222-2222-222222222222';
      saveRobotTheme(nextTheme, targetChild);
    },
    [robotTheme, saveRobotTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        parentTheme,
        robotTheme,
        applyParentTheme,
        applyRobotTheme,
        saveParentTheme,
        saveRobotTheme,
        setParentTheme: applyParentTheme,
        setRobotTheme: applyRobotTheme,
        toggleRobotDayNight
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
