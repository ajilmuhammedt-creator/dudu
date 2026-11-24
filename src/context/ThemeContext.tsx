'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ParentTheme = 'light' | 'dark' | 'soft-blue' | 'warm-orange';
export type RobotTheme = 'day' | 'night' | 'cosmic' | 'sunset';

interface ThemeContextType {
  parentTheme: ParentTheme;
  setParentTheme: (theme: ParentTheme) => void;
  robotTheme: RobotTheme;
  setRobotTheme: (theme: RobotTheme) => void;
  toggleRobotDayNight: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [parentTheme, setParentThemeState] = useState<ParentTheme>('light');
  const [robotTheme, setRobotThemeState] = useState<RobotTheme>('day');

  // Load initial themes from localStorage and API
  useEffect(() => {
    // 1. Check localStorage first
    const savedParent = localStorage.getItem('edubuddy_parent_theme') as ParentTheme;
    if (savedParent && ['light', 'dark', 'soft-blue', 'warm-orange'].includes(savedParent)) {
      setParentThemeState(savedParent);
      document.documentElement.setAttribute('data-theme', savedParent);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const savedRobot = localStorage.getItem('edubuddy_robot_theme') as RobotTheme;
    if (savedRobot && ['day', 'night', 'cosmic', 'sunset'].includes(savedRobot)) {
      setRobotThemeState(savedRobot);
    }

    // 2. Fetch server settings
    async function fetchServerTheme() {
      try {
        const res = await fetch('/api/controls?child_id=22222222-2222-2222-2222-222222222222');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.theme && ['light', 'dark', 'soft-blue', 'warm-orange'].includes(data.settings.theme)) {
              setParentThemeState(data.settings.theme);
              document.documentElement.setAttribute('data-theme', data.settings.theme);
              localStorage.setItem('edubuddy_parent_theme', data.settings.theme);
            }
            if (data.settings.robot_theme && ['day', 'night', 'cosmic', 'sunset'].includes(data.settings.robot_theme)) {
              setRobotThemeState(data.settings.robot_theme);
              localStorage.setItem('edubuddy_robot_theme', data.settings.robot_theme);
            }
          }
        }
      } catch {}
    }
    fetchServerTheme();
  }, []);

  const setParentTheme = async (theme: ParentTheme) => {
    setParentThemeState(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edubuddy_parent_theme', theme);

    try {
      await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: '22222222-2222-2222-2222-222222222222',
          theme
        })
      });
    } catch {}
  };

  const setRobotTheme = async (theme: RobotTheme) => {
    setRobotThemeState(theme);
    localStorage.setItem('edubuddy_robot_theme', theme);

    try {
      await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: '22222222-2222-2222-2222-222222222222',
          robot_theme: theme
        })
      });
    } catch {}
  };

  const toggleRobotDayNight = () => {
    const nextTheme: RobotTheme = robotTheme === 'night' ? 'day' : 'night';
    setRobotTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        parentTheme,
        setParentTheme,
        robotTheme,
        setRobotTheme,
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
