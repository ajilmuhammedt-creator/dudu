// src/app/robot/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Flame,
  Wifi,
  Settings,
  ChevronLeft,
  Volume2,
  Mic,
  Check,
  X,
  Camera,
  BookOpen,
  MessageSquare,
  FileText,
  ScanLine,
  Home,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useTheme, RobotTheme } from '@/context/ThemeContext';
import Link from 'next/link';

type RobotScreenMode =
  | 'standby'
  | 'menu'
  | 'learn'
  | 'exam_keypad'
  | 'exam_camera'
  | 'scan_check'
  | 'sleepy_prompt'
  | 'setup_pairing';

export default function RobotScreenPage() {
  const { robotTheme, setRobotTheme, toggleRobotDayNight } = useTheme();
  const [mode, setMode] = useState<RobotScreenMode>('menu');
  const [currentTime, setCurrentTime] = useState('17:05');
  const [blink, setBlink] = useState(false);
  const [keypadInput, setKeypadInput] = useState('63');
  const [pairingCode, setPairingCode] = useState('563 566');
  const [isPaired, setIsPaired] = useState(true);
  const [deviceIp, setDeviceIp] = useState<string>('—');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Watching heartbeat while Robot Screen is open
  useEffect(() => {
    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetch('/api/devices/33333333-3333-3333-3333-333333333333/watching', { method: 'POST' }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 60000);
    return () => clearInterval(timer);
  }, []);

  // Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Natural blinking effect for robot avatar face
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Fetch live robot pairing status & active pairing code
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/device/status');
        if (res.ok) {
          const data = await res.json();
          setIsPaired(data.paired);
          if (data.ip) setDeviceIp(data.ip);
        }
        // Also check sync for code if unpaired
        const syncRes = await fetch('/api/device/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer DUDU-90932C9FC114'
          },
          body: JSON.stringify({ firmware: '1.0' })
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.pairing_code) {
            const code = String(syncData.pairing_code);
            setPairingCode(`${code.slice(0, 3)} ${code.slice(3)}`);
          }
          if (syncData.robot_theme) {
            setRobotTheme(syncData.robot_theme);
          }
        }
      } catch {}
    }
    checkStatus();
  }, [setRobotTheme]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setKeypadInput('');
    } else if (val === 'back') {
      setKeypadInput((prev) => prev.slice(0, -1));
    } else if (keypadInput.length < 8) {
      setKeypadInput((prev) => prev + val);
    }
  };

  // Theme visual configurations
  const themeClasses: Record<RobotTheme, { container: string; card: string; text: string; subtext: string; faceBg: string }> = {
    day: {
      container: 'bg-gradient-to-br from-[#EFF4FE] via-[#FAF5FF] to-[#F3F0FF] text-[#1F2328]',
      card: 'bg-white/90 backdrop-blur-md border border-[#E5E7EB] shadow-lg shadow-blue-500/5',
      text: 'text-[#1F2328]',
      subtext: 'text-[#6B7280]',
      faceBg: 'bg-[#FFF6E3]'
    },
    night: {
      container: 'bg-gradient-to-br from-[#070A12] via-[#0D1322] to-[#121B30] text-[#F1F5F9]',
      card: 'bg-[#151E33]/90 backdrop-blur-md border border-[#233150] shadow-xl shadow-cyan-500/5',
      text: 'text-[#F8FAFC]',
      subtext: 'text-[#94A3B8]',
      faceBg: 'bg-[#F1F5F9]'
    },
    cosmic: {
      container: 'bg-gradient-to-br from-[#090416] via-[#160B30] to-[#260F40] text-[#FAF5FF]',
      card: 'bg-[#1F103A]/90 backdrop-blur-md border border-[#3C1A68] shadow-xl shadow-purple-500/10',
      text: 'text-[#FAF5FF]',
      subtext: 'text-[#C084FC]',
      faceBg: 'bg-[#F3E8FF]'
    },
    sunset: {
      container: 'bg-gradient-to-br from-[#FFF5EB] via-[#FED7AA] to-[#FDBA74] text-[#431407]',
      card: 'bg-white/90 backdrop-blur-md border border-[#FED7AA] shadow-xl shadow-orange-500/10',
      text: 'text-[#431407]',
      subtext: 'text-[#9A3412]',
      faceBg: 'bg-[#FFF7ED]'
    }
  };

  const currentThemeStyle = themeClasses[robotTheme] || themeClasses.day;

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 transition-colors duration-500 font-sans select-none ${currentThemeStyle.container}`}
    >
      {/* ESP32-S3 Physical Display Frame */}
      <div className="w-full max-w-4xl aspect-[16/10] sm:aspect-[16/9.5] rounded-3xl p-3 sm:p-6 flex flex-col justify-between relative shadow-2xl border-4 sm:border-8 border-[#2A2E39] bg-opacity-95 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* TOP STATUS BAR (Matching Page 9 in PDF) */}
        <div className="flex items-center justify-between z-20 pb-2 border-b border-black/5 dark:border-white/10">
          {/* Left: EduBuddy Avatar & Name */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode('standby')}>
            <div className="w-7 h-7 rounded-full bg-[#FFEAC1] flex items-center justify-center text-xs shadow-inner">
              <span className="text-[#3E2723] font-bold text-[10px]">^^</span>
            </div>
            <span className="font-bold text-sm tracking-tight">EduBuddy</span>
          </div>

          {/* Center: Mode Indicator or Child Class */}
          <div className="hidden sm:flex items-center gap-2 bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full text-xs font-semibold">
            <span>Arjun · Class 3</span>
          </div>

          {/* Right: Controls & Day/Night Toggle (Page 9 moon button) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wi-Fi Icon */}
            <div className="flex items-center gap-1 text-xs opacity-80" title="Wi-Fi connected">
              <Wifi className="w-4 h-4 text-emerald-500" />
            </div>

            {/* Time */}
            <span className="font-bold text-xs font-mono tracking-wider">{currentTime}</span>

            {/* Theme Toggle Button (Moon / Sun from Page 9) */}
            <button
              onClick={() => toggleRobotDayNight()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-md ${
                robotTheme === 'night'
                  ? 'bg-[#1E293B] text-amber-300 ring-2 ring-amber-300/40'
                  : 'bg-white text-indigo-900 border border-indigo-100 hover:bg-indigo-50'
              }`}
              title={`Switch Robot Day/Night Theme (Current: ${robotTheme})`}
            >
              {robotTheme === 'night' ? (
                <Moon className="w-4 h-4 fill-amber-300 stroke-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-700" />
              )}
            </button>

            {/* Theme Picker Palette Menu */}
            <button
              onClick={() => setShowThemeModal(!showThemeModal)}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Change Robot Theme"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* SCREEN CONTENTS BASED ON MODE */}

        {/* 1. STANDBY FACE MODE (Page 8 in PDF) */}
        {mode === 'standby' && (
          <div
            onClick={() => setMode('menu')}
            className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer p-4 group"
          >
            {/* Interactive Robot Face */}
            <div
              className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full ${currentThemeStyle.faceBg} shadow-2xl flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:scale-105 active:scale-95 border-4 border-white/40`}
            >
              {/* Eyes */}
              <div className="flex items-center gap-12 sm:gap-16 mb-2">
                {blink ? (
                  <>
                    <div className="w-8 h-1.5 bg-[#1F2328] rounded-full" />
                    <div className="w-8 h-1.5 bg-[#1F2328] rounded-full" />
                  </>
                ) : (
                  <>
                    <div className="w-9 h-7 sm:w-11 sm:h-8 border-t-4 border-l-4 border-r-4 border-[#1F2328] rounded-t-full" />
                    <div className="w-9 h-7 sm:w-11 sm:h-8 border-t-4 border-l-4 border-r-4 border-[#1F2328] rounded-t-full" />
                  </>
                )}
              </div>
              {/* Rosy Cheeks */}
              <div className="flex justify-between w-28 sm:w-36 px-2 mb-1">
                <div className="w-4 h-2 bg-pink-400/50 rounded-full blur-[1px]" />
                <div className="w-4 h-2 bg-pink-400/50 rounded-full blur-[1px]" />
              </div>
              {/* Mouth */}
              <div className="w-6 h-3 bg-[#E11D48] rounded-b-full shadow-inner" />
            </div>

            <div className="mt-6 sm:mt-8 space-y-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Hi Arjun!</h1>
              <p className={`text-xs sm:text-sm font-medium ${currentThemeStyle.subtext}`}>
                Tap me, or say &ldquo;Hey EduBuddy&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* 2. MAIN MENU (Page 9 in PDF) */}
        {mode === 'menu' && (
          <div className="flex-1 flex flex-col justify-center py-2 sm:py-4">
            {/* Speech Bubble from EduBuddy */}
            <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
              <div
                onClick={() => setMode('standby')}
                className={`w-12 h-12 rounded-full ${currentThemeStyle.faceBg} shadow-md flex flex-col items-center justify-center shrink-0 cursor-pointer border border-black/10`}
              >
                <div className="flex gap-2 mb-0.5">
                  <div className="w-2.5 h-1.5 border-t-2 border-[#1F2328] rounded-t-full" />
                  <div className="w-2.5 h-1.5 border-t-2 border-[#1F2328] rounded-t-full" />
                </div>
                <div className="w-2 h-1 bg-[#E11D48] rounded-b-full" />
              </div>
              <div className={`${currentThemeStyle.card} px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md`}>
                What shall we do today, Arjun?
              </div>
            </div>

            {/* 4 Big Neumorphic 3D Action Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 px-1">
              {/* Card 1: Learn */}
              <button
                onClick={() => setMode('learn')}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all text-center border-t-2 border-white/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="font-extrabold text-base sm:text-lg block">Learn</span>
                <span className="text-[10px] text-blue-100 opacity-90 mt-0.5 hidden sm:block">Learn a chapter</span>
              </button>

              {/* Card 2: Q&A */}
              <button
                onClick={() => setMode('learn')}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#F97316] to-[#EA580C] text-white shadow-lg shadow-orange-500/25 active:scale-95 transition-all text-center border-t-2 border-white/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <span className="font-extrabold text-base sm:text-lg block">Q&amp;A</span>
                <span className="text-[10px] text-orange-100 opacity-90 mt-0.5 hidden sm:block">Ask anything</span>
              </button>

              {/* Card 3: Exam */}
              <button
                onClick={() => setMode('exam_keypad')}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#A855F7] to-[#9333EA] text-white shadow-lg shadow-purple-500/25 active:scale-95 transition-all text-center border-t-2 border-white/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="font-extrabold text-base sm:text-lg block">Exam</span>
                <span className="text-[10px] text-purple-100 opacity-90 mt-0.5 hidden sm:block">Take a test</span>
              </button>

              {/* Card 4: Scan & Check */}
              <button
                onClick={() => setMode('scan_check')}
                className="group relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#10B981] to-[#059669] text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all text-center border-t-2 border-white/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="font-extrabold text-base sm:text-lg block">Scan &amp; Check</span>
                <span className="text-[10px] text-emerald-100 opacity-90 mt-0.5 hidden sm:block">Homework scan</span>
              </button>
            </div>

            {/* Footer Quick Switchers */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] opacity-75">
              <span>Quick tests:</span>
              <button onClick={() => setMode('exam_camera')} className="underline hover:opacity-100">
                Camera Exam
              </button>
              <span>·</span>
              <button onClick={() => setMode('sleepy_prompt')} className="underline hover:opacity-100">
                Sleepy Prompt
              </button>
              <span>·</span>
              <button onClick={() => setMode('setup_pairing')} className="underline hover:opacity-100">
                Pairing Screen
              </button>
            </div>
          </div>
        )}

        {/* 3. LEARN / VOICE INTERACTION (Page 11 in PDF) */}
        {mode === 'learn' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMode('menu')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                <Home className="w-3.5 h-3.5" /> Back
              </button>
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                Demo preview · Give and Take
              </span>
              <button
                onClick={() => setMode('exam_keypad')}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                Exam &rarr;
              </button>
            </div>

            {/* Center Area: Talking Face on Left, Conversation on Right */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center flex-1 my-2">
              {/* Left Column: Talking Avatar */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full ${currentThemeStyle.faceBg} shadow-xl flex flex-col items-center justify-center mb-3 border-2 border-white/50`}
                >
                  <div className="flex gap-8 mb-2">
                    <div className="w-6 h-4 border-t-4 border-[#1F2328] rounded-t-full" />
                    <div className="w-6 h-4 border-t-4 border-[#1F2328] rounded-t-full" />
                  </div>
                  <div className="w-5 h-2.5 bg-[#E11D48] rounded-b-full" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-md active:scale-95">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Tap to interrupt</span>
                </button>
              </div>

              {/* Right Columns: Dialogue Flow */}
              <div className="md:col-span-2 space-y-2.5">
                <div className={`${currentThemeStyle.card} p-3 rounded-2xl text-xs sm:text-sm font-medium`}>
                  Let&apos;s add 47 and 38. We start with the ones. What is 7 plus 8?
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#3B82F6] text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold shadow-md">
                    fifteen
                  </div>
                </div>
                <div className={`${currentThemeStyle.card} p-3 rounded-2xl text-xs sm:text-sm font-medium`}>
                  Yes, 15! So we write 5 and carry 1 to the tens. Now, what is 4 plus 3 plus the carried 1?
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. EXAM NUMERIC KEYPAD (Page 12 in PDF) */}
        {mode === 'exam_keypad' && (
          <div className="flex-1 flex flex-col justify-between py-1 sm:py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMode('menu')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                <Home className="w-3.5 h-3.5" /> Menu
              </button>
              <span className="text-xs font-bold opacity-80">Question 2 of 5 · Maths Mela</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="w-2 h-2 rounded-full bg-gray-400" />
              </div>
            </div>

            {/* Question Box */}
            <div className={`${currentThemeStyle.card} p-3 sm:p-4 rounded-2xl mt-1`}>
              <p className="text-xs sm:text-sm font-bold leading-relaxed">
                Ravi has 36 marbles and his sister gives him 27 more. How many marbles does Ravi have now?
              </p>
              <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 mt-1 hover:underline">
                <Volume2 className="w-3.5 h-3.5" /> Read again
              </button>
            </div>

            {/* Answer Display & Keypad */}
            <div className="grid grid-cols-12 gap-3 items-center mt-2">
              {/* Keypad 3x4 */}
              <div className="col-span-7 sm:col-span-8 grid grid-cols-3 gap-1.5 sm:gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeypadPress(key)}
                    className={`${currentThemeStyle.card} py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:opacity-80 active:scale-95 transition-all text-center flex items-center justify-center`}
                  >
                    {key === 'back' ? '⌫' : key}
                  </button>
                ))}
              </div>

              {/* Input & Check Submit */}
              <div className="col-span-5 sm:col-span-4 flex flex-col gap-2">
                <div
                  className={`p-3 rounded-2xl text-center font-mono font-extrabold text-xl sm:text-2xl border-2 ${
                    keypadInput ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300'
                  }`}
                >
                  {keypadInput || '—'}
                </div>
                <button
                  onClick={() => setMode('exam_camera')}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow-lg shadow-green-500/25 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Check ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. EXAM PAPER CAMERA SCAN (Page 13 in PDF) */}
        {mode === 'exam_camera' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMode('menu')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                <Home className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Camera on</span>
              </div>
              <button
                onClick={() => setMode('scan_check')}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                Scan &rarr;
              </button>
            </div>

            {/* Camera Viewfinder with Paper Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center flex-1 my-2">
              {/* Paper Box Viewfinder */}
              <div className="relative border-2 border-dashed border-blue-400 bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px]">
                <div className="bg-[#FAF8F5] text-[#1F2328] p-4 rounded-xl shadow-lg font-mono text-center w-44">
                  <div className="text-sm font-bold">72</div>
                  <div className="text-sm font-bold border-b border-black pb-0.5">− 45</div>
                  <div className="text-base font-extrabold text-emerald-600 pt-0.5">27</div>
                </div>
                <span className="text-[10px] font-semibold bg-black/60 text-white px-2.5 py-1 rounded-full mt-2">
                  Put the whole page inside the box
                </span>
              </div>

              {/* AI Recognition result */}
              <div className={`${currentThemeStyle.card} p-4 rounded-2xl space-y-3`}>
                <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-base">
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Correct! 1/1</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold">
                  Yes, that&apos;s right. Great work!
                </p>
                <div className="text-[11px] opacity-75 font-mono bg-black/5 dark:bg-white/10 p-2 rounded-xl">
                  I read: &ldquo;72 − 45 = 27&rdquo;
                </div>
                <button
                  onClick={() => setMode('menu')}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95"
                >
                  Next Question &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. SCAN & CHECK (Page 14 in PDF) */}
        {mode === 'scan_check' && (
          <div className="flex-1 flex flex-col justify-between py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMode('menu')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                <Home className="w-3.5 h-3.5" /> Back
              </button>
              <span className="text-xs font-bold">Scan &amp; Check Homework</span>
              <button
                onClick={() => setMode('sleepy_prompt')}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/10"
              >
                Sleepy Prompt &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center flex-1 my-1">
              {/* Paper scan representation */}
              <div className="bg-[#FAF8F5] text-[#1F2328] p-3 sm:p-4 rounded-2xl shadow-md font-mono text-xs sm:text-sm space-y-1.5 border border-amber-100">
                <div className="flex justify-between"><span>47 + 38 = 85</span><span className="text-emerald-600 font-bold">✓</span></div>
                <div className="flex justify-between"><span>56 + 29 = 85</span><span className="text-emerald-600 font-bold">✓</span></div>
                <div className="flex justify-between text-rose-600 font-bold"><span>72 − 45 = 37</span><span>✗</span></div>
                <div className="flex justify-between"><span>4 × 7 = 28</span><span className="text-emerald-600 font-bold">✓</span></div>
              </div>

              {/* Feedback */}
              <div className={`${currentThemeStyle.card} p-3 sm:p-4 rounded-2xl space-y-2`}>
                <div className="text-xs sm:text-sm font-bold">
                  I checked 4 sums. 3 are correct and 1 needs another look.
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  <span className="font-bold block">72 − 45 = 37 (Review required)</span>
                  <span className="text-[11px] block mt-0.5">
                    Check the ones column: can you take 5 away from 2 without borrowing?
                  </span>
                </div>
                <button
                  onClick={() => setMode('menu')}
                  className="w-full py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                >
                  Done Reviewing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. SLEEPY PROMPT BREAK (Page 15 in PDF) */}
        {mode === 'sleepy_prompt' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-14 h-14 rounded-full bg-amber-400/20 text-amber-500 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold">💤</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold mb-1">Feeling a bit sleepy?</h2>
            <p className={`text-xs sm:text-sm max-w-md ${currentThemeStyle.subtext} mb-6`}>
              Would you like a short break, or a quick stretch and then carry on?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="px-5 py-2.5 rounded-2xl bg-[#3B82F6] text-white font-bold text-xs shadow-md active:scale-95"
              >
                Stretch &amp; continue
              </button>
              <button
                onClick={() => setMode('standby')}
                className={`${currentThemeStyle.card} px-5 py-2.5 rounded-2xl font-bold text-xs active:scale-95`}
              >
                Take a break
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-6 max-w-sm">
              Only during a study session, only if a parent allowed the camera. Nothing from the camera leaves the device.
            </p>
          </div>
        )}

        {/* 8. PAIRING SETUP SCREEN (Page 16 in PDF) */}
        {mode === 'setup_pairing' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div
              className={`w-20 h-20 rounded-full ${currentThemeStyle.faceBg} shadow-md flex flex-col items-center justify-center mb-4`}
            >
              <div className="flex gap-4 mb-1">
                <div className="w-4 h-2.5 border-t-2 border-[#1F2328] rounded-t-full" />
                <div className="w-4 h-2.5 border-t-2 border-[#1F2328] rounded-t-full" />
              </div>
              <div className="w-3 h-1.5 bg-[#E11D48] rounded-b-full" />
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold mb-1">Hi! Let&apos;s get set up.</h2>
            <p className={`text-xs sm:text-sm ${currentThemeStyle.subtext} mb-4`}>
              Ask a parent to open the EduBuddy app and enter this code:
            </p>
            <div className="px-6 py-3 rounded-2xl bg-blue-500/10 border-2 border-blue-500 text-blue-500 font-mono font-extrabold text-3xl sm:text-5xl tracking-widest shadow-inner mb-4">
              {pairingCode}
            </div>
            <div className="text-[11px] opacity-75 font-mono">
              Device DUDU-90932C9FC114 · Wi-Fi connected
            </div>
            <button
              onClick={() => setMode('menu')}
              className="mt-4 text-xs underline opacity-80 hover:opacity-100"
            >
              Return to Menu
            </button>
          </div>
        )}

        {/* BOTTOM THEME PICKER MODAL */}
        {showThemeModal && (
          <div className="absolute inset-x-4 bottom-4 z-30 p-4 rounded-3xl bg-black/90 text-white backdrop-blur-xl border border-white/20 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-xs uppercase tracking-wider text-gray-300">
                Choose Robot Screen Theme
              </span>
              <button onClick={() => setShowThemeModal(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'day' as RobotTheme, name: 'Day Light', icon: Sun, color: 'from-[#EFF4FE] to-[#F3F0FF]' },
                { id: 'night' as RobotTheme, name: 'Night Moon', icon: Moon, color: 'from-[#070A12] to-[#121B30]' },
                { id: 'cosmic' as RobotTheme, name: 'Cosmic Space', icon: Sparkles, color: 'from-[#090416] to-[#260F40]' },
                { id: 'sunset' as RobotTheme, name: 'Sunset Glow', icon: Flame, color: 'from-[#FFF5EB] to-[#FDBA74]' }
              ].map((t) => {
                const isSelected = robotTheme === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setRobotTheme(t.id);
                      setShowThemeModal(false);
                    }}
                    className={`p-2.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-white/20 ring-2 ring-blue-400'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold">{t.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Helper Navigation Footer Outside Display Frame */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs opacity-75">
        <Link href="/" className="hover:underline flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Parent App
        </Link>
        <span>·</span>
        <span>Active Robot Theme: <strong className="capitalize">{robotTheme}</strong></span>
        <span>·</span>
        <span>Hardware: ESP32-S3 ({deviceIp})</span>
      </div>
    </div>
  );
}
