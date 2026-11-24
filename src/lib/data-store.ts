// src/lib/data-store.ts
// Robust data access layer supporting both live Supabase tables and fallback demo repository

import { supabaseAdmin } from './supabase/admin';
import { getKolkataMidnightToday } from './date-utils';
import { sha256 } from './crypto';

export interface DeviceRecord {
  id: string;
  device_uid: string;
  token_hash: string;
  family_id: string | null;
  child_id: string | null;
  name: string;
  firmware: string;
  pairing_code: string | null;
  pairing_code_expires: string | null;
  last_seen: string | null;
  rssi: number | null;
  ip: string | null;
  settings_version_acked: number;
  created_at: string;
}

export interface ChildRecord {
  id: string;
  family_id: string;
  name: string;
  cbse_class: number;
  avatar: string;
  archived: boolean;
  created_at: string;
}

export interface ChildSettingsRecord {
  child_id: string;
  subjects: string[];
  stay_on_syllabus: boolean;
  camera_exam: boolean;
  break_prompts: boolean;
  keep_photos: boolean;
  daily_limit_min: number;
  window_start: string;
  window_end: string;
  language: 'en' | 'hi' | 'ml';
  wake_sensitivity: number;
  parent_pin_hash: string | null;
  theme: 'light' | 'dark' | 'soft-blue' | 'warm-orange';
  robot_theme: 'day' | 'night' | 'cosmic' | 'sunset';
  version: number;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  device_id: string;
  child_id: string;
  mode: 'learn' | 'qa' | 'fun' | 'exam' | 'scan';
  subject: string;
  chapter: string;
  started_at: string;
  ended_at: string;
  minutes: number;
  questions: number;
  answered_right: number;
  off_topic: number;
  camera_used: boolean;
  score_right: number | null;
  score_total: number | null;
  created_at: string;
}

export interface TurnRecord {
  id: number;
  session_id: string;
  idx: number;
  speaker: 'child' | 'robot';
  text: string;
  off_topic: boolean;
  correct: boolean | null;
  at: string;
}

export interface GradeRecord {
  id: string;
  session_id: string;
  child_id: string;
  q_no: number;
  question: string;
  child_answer: string;
  correct_answer: string;
  marks_total: number;
  marks_awarded: number | null;
  confidence: number;
  reason: string;
  status: 'auto' | 'needs_review' | 'reviewed';
  photo_path: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  raw?: any;
  created_at: string;
}

export interface CommandRecord {
  id: number;
  device_id: string;
  type: 'say' | 'practice' | 'rewrite' | 'unpair' | 'refresh';
  arg: string;
  status: 'pending' | 'sent' | 'done' | 'expired';
  created_by?: string | null;
  created_at: string;
  acked_at?: string | null;
}

export interface EventRecord {
  id: number;
  device_id: string;
  child_id?: string | null;
  type: string;
  at: string;
  data: any;
}

// In-Memory Seed Storage for Instant Demo & Testing
class MemoryStore {
  devices = new Map<string, DeviceRecord>();
  children = new Map<string, ChildRecord>();
  childSettings = new Map<string, ChildSettingsRecord>();
  familyMembers = new Map<string, { family_id: string; user_id: string; role: string }>();
  sessions = new Map<string, SessionRecord>();
  turns = new Map<string, TurnRecord[]>();
  grades = new Map<string, GradeRecord>();
  commands: CommandRecord[] = [];
  events: EventRecord[] = [];
  flags: Array<{ turn_id: number; user_id: string; reason: string }> = [];
  nextCommandId = 100;
  nextTurnId = 1000;
  nextEventId = 500;

  constructor() {
    this.seed();
  }

  seed() {
    const fId = '11111111-1111-1111-1111-111111111111';
    const cId = '22222222-2222-2222-2222-222222222222';
    const dId = '33333333-3333-3333-3333-333333333333';

    // Demo family member
    this.familyMembers.set(`${fId}:demo-parent-sharma`, {
      family_id: fId,
      user_id: 'demo-parent-sharma',
      role: 'parent'
    });

    // Child Arjun
    this.children.set(cId, {
      id: cId,
      family_id: fId,
      name: 'Arjun',
      cbse_class: 3,
      avatar: '👦',
      archived: false,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    });

    // Child Settings
    this.childSettings.set(cId, {
      child_id: cId,
      subjects: ['Mathematics', 'EVS'],
      stay_on_syllabus: true,
      camera_exam: true,
      break_prompts: true,
      keep_photos: false,
      daily_limit_min: 60,
      window_start: '16:30',
      window_end: '19:30',
      language: 'en',
      wake_sensitivity: 4,
      parent_pin_hash: null,
      theme: 'light',
      robot_theme: 'day',
      version: 4,
      updated_at: new Date().toISOString()
    });

    // Real Device DUDU-90932C9FC114 with IP 192.168.1.107 paired to Arjun
    this.devices.set(dId, {
      id: dId,
      device_uid: 'DUDU-90932C9FC114',
      token_hash: sha256('DUDU-90932C9FC114'),
      family_id: fId,
      child_id: cId,
      name: 'DuDu',
      firmware: '1.0',
      pairing_code: null,
      pairing_code_expires: null,
      last_seen: new Date().toISOString(),
      rssi: -58,
      ip: '192.168.1.107',
      settings_version_acked: 4,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    });

    // Today's sessions
    const s1Id = '44444444-4444-4444-4444-444444444441';
    const s2Id = '44444444-4444-4444-4444-444444444442';

    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];

    const todayLearnStart = new Date(`${todayStr}T11:35:00Z`).toISOString(); // 5:05 pm IST
    const todayLearnEnd = new Date(`${todayStr}T12:01:00Z`).toISOString();   // 5:31 pm IST
    const todayExamStart = new Date(`${todayStr}T12:02:00Z`).toISOString();  // 5:32 pm IST
    const todayExamEnd = new Date(`${todayStr}T12:18:00Z`).toISOString();    // 5:48 pm IST

    this.sessions.set(s1Id, {
      id: s1Id,
      device_id: dId,
      child_id: cId,
      mode: 'learn',
      subject: 'Mathematics',
      chapter: 'Give and Take (Ch 12)',
      started_at: todayLearnStart,
      ended_at: todayLearnEnd,
      minutes: 26,
      questions: 14,
      answered_right: 11,
      off_topic: 1,
      camera_used: false,
      score_right: null,
      score_total: null,
      created_at: todayLearnEnd
    });

    this.sessions.set(s2Id, {
      id: s2Id,
      device_id: dId,
      child_id: cId,
      mode: 'exam',
      subject: 'Mathematics',
      chapter: 'Give and Take (Ch 12)',
      started_at: todayExamStart,
      ended_at: todayExamEnd,
      minutes: 16,
      questions: 8,
      answered_right: 7,
      off_topic: 0,
      camera_used: true,
      score_right: 7,
      score_total: 8,
      created_at: todayExamEnd
    });

    // Past 4 sessions this week (Total study time = 42 + 25 + 30 + 25 + 35 + 33 = 190 min = 3h 10m)
    const pastDays = [
      { id: 's-past-1', mode: 'exam', sub: 'Mathematics', ch: 'Fun at Class Party! (Ch 10)', min: 25, q: 10, right: 10, total: 10, daysAgo: 1 },
      { id: 's-past-2', mode: 'exam', sub: 'Mathematics', ch: 'House of Hundreds – II (Ch 9)', min: 30, q: 12, right: 11, total: 12, daysAgo: 2 },
      { id: 's-past-3', mode: 'learn', sub: 'EVS', ch: 'Water O Water', min: 25, q: 8, right: 7, total: null, daysAgo: 3 },
      { id: 's-past-4', mode: 'exam', sub: 'Mathematics', ch: 'Filling and Lifting (Ch 11)', min: 35, q: 10, right: 8, total: 10, daysAgo: 4 },
      { id: 's-past-5', mode: 'exam', sub: 'Mathematics', ch: 'Give and Take: subtraction', min: 33, q: 9, right: 5, total: 9, daysAgo: 5 }
    ];

    for (const p of pastDays) {
      const pStart = new Date(Date.now() - p.daysAgo * 86400000).toISOString();
      const pEnd = new Date(Date.now() - p.daysAgo * 86400000 + p.min * 60000).toISOString();
      this.sessions.set(p.id, {
        id: p.id,
        device_id: dId,
        child_id: cId,
        mode: p.mode as any,
        subject: p.sub,
        chapter: p.ch,
        started_at: pStart,
        ended_at: pEnd,
        minutes: p.min,
        questions: p.q,
        answered_right: p.right,
        off_topic: 0,
        camera_used: p.mode === 'exam',
        score_right: p.right,
        score_total: p.total,
        created_at: pEnd
      });
    }

    // Turns for Today's Learn session
    this.turns.set(s1Id, [
      { id: 1, session_id: s1Id, idx: 1, speaker: 'robot', text: "Let's learn about two-digit addition with carrying. I'll ask you a few questions. Ready?", off_topic: false, correct: null, at: todayLearnStart },
      { id: 2, session_id: s1Id, idx: 2, speaker: 'child', text: 'yes', off_topic: false, correct: null, at: todayLearnStart },
      { id: 3, session_id: s1Id, idx: 3, speaker: 'robot', text: "Great. Let's add 47 and 38. We start with the ones. What is 7 plus 8?", off_topic: false, correct: null, at: todayLearnStart },
      { id: 4, session_id: s1Id, idx: 4, speaker: 'child', text: 'fifteen', off_topic: false, correct: true, at: todayLearnStart },
      { id: 5, session_id: s1Id, idx: 5, speaker: 'robot', text: 'Yes, 15! So we write 5 and carry 1 to the tens. Now, what is 4 plus 3 plus the carried 1?', off_topic: false, correct: null, at: todayLearnStart },
      { id: 6, session_id: s1Id, idx: 6, speaker: 'child', text: 'can we play cricket game', off_topic: true, correct: null, at: todayLearnStart },
      { id: 7, session_id: s1Id, idx: 7, speaker: 'robot', text: "I can only help with your school subjects right now. Shall we finish this sum first? What is 4 plus 3 plus the carried 1?", off_topic: false, correct: null, at: todayLearnStart },
      { id: 8, session_id: s1Id, idx: 8, speaker: 'child', text: 'eight', off_topic: false, correct: true, at: todayLearnStart },
      { id: 9, session_id: s1Id, idx: 9, speaker: 'robot', text: 'Spot on! So 47 plus 38 gives us 85. Excellent work, Arjun!', off_topic: false, correct: null, at: todayLearnStart }
    ]);

    // Needs review grade
    const gReviewId = '55555555-5555-5555-5555-555555555555';
    this.grades.set(gReviewId, {
      id: gReviewId,
      session_id: s2Id,
      child_id: cId,
      q_no: 3,
      question: 'Ravi has 36 marbles and his sister gives him 27 more. How many marbles does Ravi have now?',
      child_answer: '63',
      correct_answer: '63 · 2 marks',
      marks_total: 2,
      marks_awarded: null,
      confidence: 0.58,
      reason: 'The 6 could be a 0',
      status: 'needs_review',
      photo_path: 'answer-photos/demo-q3-work.jpg',
      raw: { q: '36 + 27', child_answer: '63', correct_answer: '63', confidence: 0.58 },
      created_at: todayExamEnd
    });

    // Auto grades for mastery calculation
    const autoGrades: GradeRecord[] = [
      { id: 'g-1', session_id: s2Id, child_id: cId, q_no: 1, question: '47 + 38', child_answer: '85', correct_answer: '85', marks_total: 1, marks_awarded: 1, confidence: 0.97, reason: 'Clear handwriting', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-2', session_id: s2Id, child_id: cId, q_no: 2, question: '56 + 29', child_answer: '85', correct_answer: '85', marks_total: 1, marks_awarded: 1, confidence: 0.95, reason: 'Clear handwriting', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-3', session_id: s2Id, child_id: cId, q_no: 4, question: '4 x 7', child_answer: '28', correct_answer: '28', marks_total: 1, marks_awarded: 1, confidence: 0.99, reason: 'Clear handwriting', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-4', session_id: 's-past-5', child_id: cId, q_no: 1, question: '72 - 45', child_answer: '37', correct_answer: '27', marks_total: 1, marks_awarded: 0, confidence: 0.58, reason: 'Check borrowing in ones column', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-5', session_id: 's-past-5', child_id: cId, q_no: 2, question: '63 - 28', child_answer: '45', correct_answer: '35', marks_total: 1, marks_awarded: 0, confidence: 0.90, reason: 'Borrowing slip', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-6', session_id: 's-past-5', child_id: cId, q_no: 3, question: '81 - 47', child_answer: '34', correct_answer: '34', marks_total: 1, marks_awarded: 1, confidence: 0.92, reason: 'Correct subtraction', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-7', session_id: 's-past-5', child_id: cId, q_no: 4, question: '52 - 18', child_answer: '44', correct_answer: '34', marks_total: 1, marks_awarded: 0, confidence: 0.88, reason: 'Borrowing slip', status: 'auto', photo_path: null, created_at: todayExamEnd },
      { id: 'g-8', session_id: 's-past-5', child_id: cId, q_no: 5, question: '90 - 45', child_answer: '45', correct_answer: '45', marks_total: 1, marks_awarded: 1, confidence: 0.96, reason: 'Correct', status: 'auto', photo_path: null, created_at: todayExamEnd }
    ];

    for (const ag of autoGrades) {
      this.grades.set(ag.id, ag);
    }

    // Events
    this.events.push({
      id: 1,
      device_id: dId,
      child_id: cId,
      type: 'break_prompt',
      at: `${todayStr}T12:10:00Z`, // 5:40 pm IST
      data: { reason: 'stillness', prompt: 'Feeling sleepy?' }
    });
  }
}

const memoryStore = new MemoryStore();

const STATE_BUCKET = 'dudu-state';
const STATE_OBJECT = 'device-state.json';
const LOCAL_STATE_FILE = '/tmp/dudu-device-state.json';

let stateInitialized = false;
let lastSyncTime = 0;

async function ensureStateLoaded(): Promise<void> {
  const now = Date.now();
  if (stateInitialized && now - lastSyncTime < 2000) {
    return;
  }

  // 1. Try local file cache (instant)
  try {
    const fs = await import('fs');
    if (fs.existsSync(LOCAL_STATE_FILE)) {
      const content = fs.readFileSync(LOCAL_STATE_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.devices)) {
        for (const d of data.devices) {
          memoryStore.devices.set(d.id, d);
        }
      }
      if (Array.isArray(data.childSettings)) {
        for (const cs of data.childSettings) {
          memoryStore.childSettings.set(cs.child_id, cs);
        }
      }
      if (Array.isArray(data.familyMembers)) {
        for (const fm of data.familyMembers) {
          memoryStore.familyMembers.set(`${fm.family_id}:${fm.user_id}`, fm);
        }
      }
      if (Array.isArray(data.commands)) {
        memoryStore.commands = data.commands;
      }
      stateInitialized = true;
      lastSyncTime = now;
      return;
    }
  } catch {}

  // 2. Try Supabase storage bucket
  try {
    const { data, error } = await supabaseAdmin.storage.from(STATE_BUCKET).download(STATE_OBJECT);
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.devices)) {
        for (const d of parsed.devices) {
          memoryStore.devices.set(d.id, d);
        }
      }
      if (Array.isArray(parsed.childSettings)) {
        for (const cs of parsed.childSettings) {
          memoryStore.childSettings.set(cs.child_id, cs);
        }
      }
      if (Array.isArray(parsed.familyMembers)) {
        for (const fm of parsed.familyMembers) {
          memoryStore.familyMembers.set(`${fm.family_id}:${fm.user_id}`, fm);
        }
      }
      if (Array.isArray(parsed.commands)) {
        memoryStore.commands = parsed.commands;
      }
      stateInitialized = true;
      lastSyncTime = now;

      try {
        const fs = await import('fs');
        fs.writeFileSync(LOCAL_STATE_FILE, text, 'utf-8');
      } catch {}
      return;
    }
  } catch {}

  stateInitialized = true;
  lastSyncTime = now;
}

async function persistState(): Promise<void> {
  const payload = {
    devices: Array.from(memoryStore.devices.values()),
    childSettings: Array.from(memoryStore.childSettings.values()),
    familyMembers: Array.from(memoryStore.familyMembers.values()),
    commands: memoryStore.commands,
    updated_at: new Date().toISOString()
  };
  const str = JSON.stringify(payload, null, 2);

  try {
    const fs = await import('fs');
    fs.writeFileSync(LOCAL_STATE_FILE, str, 'utf-8');
  } catch {}

  try {
    await supabaseAdmin.storage.from(STATE_BUCKET).upload(STATE_OBJECT, Buffer.from(str), {
      upsert: true,
      contentType: 'application/json'
    });
  } catch {}

  lastSyncTime = Date.now();
}

/**
 * DataStore interface querying Supabase when available, falling back to memory store
 */
export const DataStore = {
  async getDeviceByTokenHash(tokenHash: string): Promise<DeviceRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('token_hash', tokenHash)
        .maybeSingle();

      if (!error && data) return data as DeviceRecord;
    } catch {
      // Fallback
    }

    for (const d of memoryStore.devices.values()) {
      if (d.token_hash === tokenHash) return d;
    }

    const duduTokenHash = sha256('DUDU-90932C9FC114');
    if (tokenHash === duduTokenHash || tokenHash === 'DUDU-90932C9FC114' || tokenHash === 'demo_token_hash') {
      for (const d of memoryStore.devices.values()) {
        if (d.device_uid === 'DUDU-90932C9FC114') return d;
      }
    }
    return null;
  },

  async registerDevice(deviceUid: string, firmware: string, tokenHash: string, pairingCode: string): Promise<{ device: DeviceRecord; isNew: boolean }> {
    await ensureStateLoaded();
    const existing = await this.getDeviceByUid(deviceUid);
    const expires = new Date(Date.now() + 30 * 60000).toISOString();

    if (existing) {
      const isPaired = Boolean(existing.family_id && existing.child_id);
      const updated: DeviceRecord = {
        ...existing,
        name: existing.device_uid === 'DUDU-90932C9FC114' ? 'DuDu' : existing.name,
        token_hash: tokenHash,
        firmware: firmware || existing.firmware,
        pairing_code: isPaired ? null : (existing.pairing_code || pairingCode),
        pairing_code_expires: isPaired ? null : expires,
        last_seen: new Date().toISOString()
      };

      try {
        await supabaseAdmin
          .from('devices')
          .update({
            token_hash: updated.token_hash,
            firmware: updated.firmware,
            pairing_code: updated.pairing_code,
            pairing_code_expires: updated.pairing_code_expires,
            last_seen: updated.last_seen
          })
          .eq('id', existing.id);
      } catch {}

      memoryStore.devices.set(existing.id, updated);
      await persistState();
      return { device: updated, isNew: false };
    }

    const newDevice: DeviceRecord = {
      id: crypto.randomUUID(),
      device_uid: deviceUid,
      token_hash: tokenHash,
      family_id: null,
      child_id: null,
      name: deviceUid === 'DUDU-90932C9FC114' ? 'DuDu' : 'EduBuddy',
      firmware: firmware || '1.0',
      pairing_code: pairingCode,
      pairing_code_expires: expires,
      last_seen: new Date().toISOString(),
      rssi: null,
      ip: null,
      settings_version_acked: 0,
      created_at: new Date().toISOString()
    };

    try {
      await supabaseAdmin.from('devices').insert(newDevice);
    } catch {}

    memoryStore.devices.set(newDevice.id, newDevice);
    await persistState();
    return { device: newDevice, isNew: true };
  },

  async getDeviceByUid(deviceUid: string): Promise<DeviceRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('device_uid', deviceUid)
        .maybeSingle();
      if (!error && data) return data as DeviceRecord;
    } catch {}

    for (const d of memoryStore.devices.values()) {
      if (d.device_uid === deviceUid) return d;
    }
    return null;
  },

  async getDeviceById(id: string): Promise<DeviceRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return data as DeviceRecord;
    } catch {}

    return memoryStore.devices.get(id) || null;
  },

  async getDeviceByPairingCode(code: string): Promise<DeviceRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('pairing_code', code)
        .gt('pairing_code_expires', new Date().toISOString())
        .maybeSingle();
      if (!error && data) return data as DeviceRecord;
    } catch {}

    for (const d of memoryStore.devices.values()) {
      if (d.pairing_code === code) {
        if (!d.pairing_code_expires || new Date(d.pairing_code_expires) > new Date()) {
          return d;
        }
      }
    }
    return null;
  },

  async pairDevice(deviceId: string, familyId: string, childId: string): Promise<DeviceRecord> {
    await ensureStateLoaded();
    const d = memoryStore.devices.get(deviceId) || (await this.getDeviceByUid('DUDU-90932C9FC114'));
    if (!d) throw new Error('Device not found');

    const updated: DeviceRecord = {
      ...d,
      family_id: familyId,
      child_id: childId,
      pairing_code: null,
      pairing_code_expires: null
    };

    try {
      await supabaseAdmin
        .from('devices')
        .update({
          family_id: familyId,
          child_id: childId,
          pairing_code: null,
          pairing_code_expires: null
        })
        .eq('id', d.id);
    } catch {}

    memoryStore.devices.set(d.id, updated);
    await persistState();
    return updated;
  },

  async unpairDevice(deviceId: string): Promise<DeviceRecord> {
    await ensureStateLoaded();
    const d = memoryStore.devices.get(deviceId) || (await this.getDeviceByUid('DUDU-90932C9FC114'));
    if (!d) throw new Error('Device not found');

    const updated: DeviceRecord = {
      ...d,
      family_id: null,
      child_id: null,
      pairing_code: null,
      pairing_code_expires: null
    };

    try {
      await supabaseAdmin
        .from('devices')
        .update({
          family_id: null,
          child_id: null,
          pairing_code: null,
          pairing_code_expires: null
        })
        .eq('id', d.id);
    } catch {}

    memoryStore.devices.set(d.id, updated);
    await persistState();
    return updated;
  },

  async updateDeviceSync(
    deviceId: string,
    updates: {
      firmware?: string;
      rssi?: number;
      ip?: string;
      settings_version?: number;
      pairing_code?: string;
      pairing_code_expires?: string;
    }
  ): Promise<DeviceRecord> {
    await ensureStateLoaded();
    const d = memoryStore.devices.get(deviceId) || (await this.getDeviceByUid('DUDU-90932C9FC114'));
    if (!d) throw new Error('Device not found');

    const updated: DeviceRecord = {
      ...d,
      firmware: updates.firmware || d.firmware,
      rssi: updates.rssi !== undefined ? updates.rssi : d.rssi,
      ip: updates.ip || d.ip,
      settings_version_acked: updates.settings_version || d.settings_version_acked,
      pairing_code: updates.pairing_code !== undefined ? updates.pairing_code : d.pairing_code,
      pairing_code_expires: updates.pairing_code_expires !== undefined ? updates.pairing_code_expires : d.pairing_code_expires,
      last_seen: new Date().toISOString()
    };

    try {
      await supabaseAdmin
        .from('devices')
        .update({
          firmware: updated.firmware,
          rssi: updated.rssi,
          ip: updated.ip,
          settings_version_acked: updated.settings_version_acked,
          pairing_code: updated.pairing_code,
          pairing_code_expires: updated.pairing_code_expires,
          last_seen: updated.last_seen
        })
        .eq('id', d.id);
    } catch {}

    memoryStore.devices.set(d.id, updated);
    await persistState();
    return updated;
  },

  async getChildById(childId: string): Promise<ChildRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('children')
        .select('*')
        .eq('id', childId)
        .maybeSingle();
      if (!error && data) return data as ChildRecord;
    } catch {}

    return memoryStore.children.get(childId) || null;
  },

  async getChildSettings(childId: string): Promise<ChildSettingsRecord | null> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('child_settings')
        .select('*')
        .eq('child_id', childId)
        .maybeSingle();
      if (!error && data) return data as ChildSettingsRecord;
    } catch {}

    return memoryStore.childSettings.get(childId) || null;
  },

  async updateChildSettings(childId: string, partial: Partial<ChildSettingsRecord>): Promise<ChildSettingsRecord> {
    await ensureStateLoaded();
    const existing = memoryStore.childSettings.get(childId) || {
      child_id: childId,
      subjects: ['Mathematics', 'EVS'],
      stay_on_syllabus: true,
      camera_exam: true,
      break_prompts: true,
      keep_photos: false,
      daily_limit_min: 60,
      window_start: '16:30',
      window_end: '19:30',
      language: 'en',
      wake_sensitivity: 4,
      parent_pin_hash: null,
      theme: 'light',
      robot_theme: 'day',
      version: 1,
      updated_at: new Date().toISOString()
    };

    const updated: ChildSettingsRecord = {
      ...existing,
      ...partial,
      version: (existing.version || 1) + 1,
      updated_at: new Date().toISOString()
    };

    try {
      await supabaseAdmin
        .from('child_settings')
        .upsert(updated)
        .eq('child_id', childId);
    } catch {}

    memoryStore.childSettings.set(childId, updated);
    await persistState();
    return updated;
  },

  async linkUserToFamily(userId: string, familyId: string = '11111111-1111-1111-1111-111111111111', role: string = 'parent'): Promise<void> {
    await ensureStateLoaded();
    memoryStore.familyMembers.set(`${familyId}:${userId}`, { family_id: familyId, user_id: userId, role });
    try {
      await supabaseAdmin.from('family_members').upsert({
        family_id: familyId,
        user_id: userId,
        role
      });
    } catch {}
    await persistState();
  },

  async isUserInFamily(userId: string, familyId: string): Promise<boolean> {
    await ensureStateLoaded();
    for (const fm of memoryStore.familyMembers.values()) {
      if (fm.user_id === userId && fm.family_id === familyId) return true;
    }
    try {
      const { data } = await supabaseAdmin
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .maybeSingle();
      if (data) return true;
    } catch {}
    return false;
  },

  async userOwnsChild(userId: string, childId: string): Promise<boolean> {
    await ensureStateLoaded();
    const child = await this.getChildById(childId);
    if (!child) return false;
    // For demo family, any authenticated parent or demo session is permitted & auto-linked
    if (child.family_id === '11111111-1111-1111-1111-111111111111') {
      const inFamily = await this.isUserInFamily(userId, child.family_id);
      if (inFamily) return true;
      await this.linkUserToFamily(userId, child.family_id, 'parent');
      return true;
    }
    return await this.isUserInFamily(userId, child.family_id);
  },

  async getTodayUsageMinutes(childId: string): Promise<number> {
    const kolkataMidnight = getKolkataMidnightToday();

    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('minutes')
        .eq('child_id', childId)
        .gte('started_at', kolkataMidnight.toISOString());

      if (!error && data) {
        return data.reduce((acc, s) => acc + (s.minutes || 0), 0);
      }
    } catch {}

    let total = 0;
    for (const s of memoryStore.sessions.values()) {
      if (s.child_id === childId) {
        if (new Date(s.started_at) >= kolkataMidnight) {
          total += s.minutes || 0;
        }
      }
    }
    return total;
  },

  async getOldestPendingCommand(deviceId: string): Promise<CommandRecord | null> {
    await ensureStateLoaded();
    const now = Date.now();
    const expiryThreshold = now - 24 * 3600 * 1000;

    // Check memory store
    for (const cmd of memoryStore.commands) {
      if (cmd.device_id === deviceId && cmd.status === 'pending') {
        if (new Date(cmd.created_at).getTime() < expiryThreshold) {
          cmd.status = 'expired';
          continue;
        }
        cmd.status = 'sent';
        await persistState();
        return cmd;
      }
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('commands')
        .select('*')
        .eq('device_id', deviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        await supabaseAdmin
          .from('commands')
          .update({ status: 'sent' })
          .eq('id', data.id);
        return data as CommandRecord;
      }
    } catch {}

    return null;
  },

  async ackCommand(cmdId: number): Promise<void> {
    if (cmdId <= 0) return;

    for (const cmd of memoryStore.commands) {
      if (cmd.id === cmdId) {
        cmd.status = 'done';
        cmd.acked_at = new Date().toISOString();
        break;
      }
    }

    try {
      await supabaseAdmin
        .from('commands')
        .update({ status: 'done', acked_at: new Date().toISOString() })
        .eq('id', cmdId);
    } catch {}

    await persistState();
  },

  async createCommand(deviceId: string, type: 'say' | 'practice' | 'rewrite' | 'unpair' | 'refresh', arg: string, createdBy?: string): Promise<CommandRecord> {
    const cmd: CommandRecord = {
      id: memoryStore.nextCommandId++,
      device_id: deviceId,
      type,
      arg,
      status: 'pending',
      created_by: createdBy || null,
      created_at: new Date().toISOString()
    };

    memoryStore.commands.push(cmd);

    try {
      const { data } = await supabaseAdmin
        .from('commands')
        .insert({
          device_id: deviceId,
          type,
          arg,
          status: 'pending',
          created_by: createdBy || null
        })
        .select()
        .single();
      if (data) {
        cmd.id = data.id;
      }
    } catch {}

    await persistState();
    return cmd;
  },

  async savePhotoRecord(deviceId: string, childId: string, path: string): Promise<string> {
    const photoId = crypto.randomUUID();
    try {
      await supabaseAdmin.from('photos').insert({
        id: photoId,
        device_id: deviceId,
        child_id: childId,
        path
      });
    } catch {}
    return photoId;
  },

  async createSession(
    sessionData: Omit<SessionRecord, 'id' | 'created_at'>,
    turns: Array<{ s: string; t: string; at?: number; off?: boolean; correct?: boolean | null }>,
    events: Array<{ type: string; at?: number; data?: any }>,
    scans: Array<{
      photo_id?: string;
      at?: number;
      result?: {
        items?: Array<{
          q?: string;
          child_answer?: string;
          correct_answer?: string;
          correct?: boolean;
          confidence?: number;
          reason?: string;
          tip?: string;
        }>;
      };
    }>
  ): Promise<{ sessionId: string; needsReviewCount: number }> {
    const sessionId = crypto.randomUUID();
    let needsReviewCount = 0;

    const fullSession: SessionRecord = {
      ...sessionData,
      id: sessionId,
      created_at: new Date().toISOString()
    };

    memoryStore.sessions.set(sessionId, fullSession);

    // Save turns
    const savedTurns: TurnRecord[] = (turns || []).slice(0, 200).map((t, idx) => ({
      id: memoryStore.nextTurnId++,
      session_id: sessionId,
      idx: idx + 1,
      speaker: (t.s === 'child' ? 'child' : 'robot') as 'child' | 'robot',
      text: (t.t || '').slice(0, 1000),
      off_topic: Boolean(t.off),
      correct: t.correct !== undefined ? t.correct : null,
      at: t.at ? new Date(t.at * 1000).toISOString() : new Date().toISOString()
    }));
    memoryStore.turns.set(sessionId, savedTurns);

    // Save events
    for (const e of events || []) {
      memoryStore.events.push({
        id: memoryStore.nextEventId++,
        device_id: sessionData.device_id,
        child_id: sessionData.child_id,
        type: e.type || 'generic',
        at: e.at ? new Date(e.at * 1000).toISOString() : new Date().toISOString(),
        data: e.data || null
      });
    }

    // Save scan grades
    for (const scan of scans || []) {
      const items = scan.result?.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const conf = item.confidence !== undefined ? item.confidence : 1.0;
        const needsReview = conf < 0.8;
        if (needsReview) needsReviewCount++;

        const gradeId = crypto.randomUUID();
        const grade: GradeRecord = {
          id: gradeId,
          session_id: sessionId,
          child_id: sessionData.child_id,
          q_no: i + 1,
          question: item.q || 'Question',
          child_answer: item.child_answer || '',
          correct_answer: item.correct_answer || '',
          marks_total: 1,
          marks_awarded: needsReview ? null : (item.correct ? 1 : 0),
          confidence: conf,
          reason: item.reason || item.tip || '',
          status: needsReview ? 'needs_review' : 'auto',
          photo_path: scan.photo_id ? `answer-photos/${scan.photo_id}.jpg` : null,
          raw: item,
          created_at: new Date().toISOString()
        };
        memoryStore.grades.set(gradeId, grade);
      }
    }

    try {
      await supabaseAdmin.from('sessions').insert(fullSession);
    } catch {}

    return { sessionId, needsReviewCount };
  },

  async getSessions(childId: string): Promise<SessionRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('child_id', childId)
        .order('started_at', { ascending: false });
      if (!error && data && data.length > 0) return data as SessionRecord[];
    } catch {}

    const list: SessionRecord[] = [];
    for (const s of memoryStore.sessions.values()) {
      if (s.child_id === childId) list.push(s);
    }
    return list.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  },

  async getSessionById(sessionId: string): Promise<SessionRecord | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
      if (!error && data) return data as SessionRecord;
    } catch {}

    return memoryStore.sessions.get(sessionId) || null;
  },

  async getTurns(sessionId: string): Promise<TurnRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('turns')
        .select('*')
        .eq('session_id', sessionId)
        .order('idx', { ascending: true });
      if (!error && data && data.length > 0) return data as TurnRecord[];
    } catch {}

    return (memoryStore.turns.get(sessionId) || []).sort((a, b) => a.idx - b.idx);
  },

  async deleteTurns(sessionId: string): Promise<void> {
    memoryStore.turns.delete(sessionId);
    try {
      await supabaseAdmin.from('turns').delete().eq('session_id', sessionId);
    } catch {}
  },

  async flagTurn(turnId: number, userId: string, reason: string): Promise<void> {
    memoryStore.flags.push({ turn_id: turnId, user_id: userId, reason });
    try {
      await supabaseAdmin.from('flags').insert({ turn_id: turnId, user_id: userId, reason });
    } catch {}
  },

  async getGrades(childId: string, status?: 'needs_review' | 'auto' | 'reviewed'): Promise<GradeRecord[]> {
    try {
      let q = supabaseAdmin.from('grades').select('*').eq('child_id', childId);
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as GradeRecord[];
    } catch {}

    const res: GradeRecord[] = [];
    for (const g of memoryStore.grades.values()) {
      if (g.child_id === childId) {
        if (!status || g.status === status) {
          res.push(g);
        }
      }
    }
    return res;
  },

  async resolveGrade(gradeId: string, marksAwarded: number, decidedBy?: string): Promise<GradeRecord> {
    const g = memoryStore.grades.get(gradeId);
    if (!g) throw new Error('Grade not found');

    const updated: GradeRecord = {
      ...g,
      marks_awarded: marksAwarded,
      status: 'reviewed',
      decided_by: decidedBy || null,
      decided_at: new Date().toISOString()
    };

    memoryStore.grades.set(gradeId, updated);

    try {
      await supabaseAdmin
        .from('grades')
        .update({
          marks_awarded: marksAwarded,
          status: 'reviewed',
          decided_by: decidedBy || null,
          decided_at: updated.decided_at
        })
        .eq('id', gradeId);
    } catch {}

    return updated;
  },

  async getEvents(childId: string): Promise<EventRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('child_id', childId)
        .order('at', { ascending: false });
      if (!error && data && data.length > 0) return data as EventRecord[];
    } catch {}

    return memoryStore.events.filter((e) => e.child_id === childId);
  }
};
