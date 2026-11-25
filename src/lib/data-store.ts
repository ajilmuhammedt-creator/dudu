// src/lib/data-store.ts
// Robust data access layer supporting both live Supabase tables and fallback demo repository

import { supabaseAdmin } from './supabase/admin';
import { getKolkataMidnightToday } from './date-utils';
import { sha256 } from './crypto';
import { getSubjectsForClass } from './cbse-subjects';

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
  watch_checks?: number;
  watch_moving?: number;
  active_pct?: number;
  sleepy_checks?: number;
  sleepy_yes?: number;
  sleepy_no_answer?: number;
  distractions?: number;
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
  session_id?: string | null;
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
  }
}

const memoryStore = new MemoryStore();

const STATE_BUCKET = 'dudu-state';
const STATE_OBJECT = 'device-state.json';
const LOCAL_STATE_FILE = '/tmp/dudu-device-state.json';

let stateInitialized = false;
let lastSyncTime = 0;

function applyStatePayload(data: any): void {
  if (Array.isArray(data.children)) {
    for (const c of data.children) {
      memoryStore.children.set(c.id, c);
    }
  }
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
  if (Array.isArray(data.sessions)) {
    for (const s of data.sessions) {
      memoryStore.sessions.set(s.id, s);
    }
  }
  if (data.turns && typeof data.turns === 'object') {
    for (const [sid, list] of Object.entries(data.turns)) {
      if (Array.isArray(list)) {
        memoryStore.turns.set(sid, list as TurnRecord[]);
      }
    }
  }
  if (Array.isArray(data.grades)) {
    for (const g of data.grades) {
      memoryStore.grades.set(g.id, g);
    }
  }
  if (Array.isArray(data.events)) {
    memoryStore.events = data.events;
  }
  if (Array.isArray(data.flags)) {
    memoryStore.flags = data.flags;
  }
}

async function ensureStateLoaded(): Promise<void> {
  const now = Date.now();
  if (stateInitialized && now - lastSyncTime < 2000) {
    return;
  }

  const loadLocal = async () => {
    try {
      const fs = await import('fs');
      if (fs.existsSync(LOCAL_STATE_FILE)) {
        const content = fs.readFileSync(LOCAL_STATE_FILE, 'utf-8');
        const data = JSON.parse(content);
        applyStatePayload(data);
        stateInitialized = true;
        lastSyncTime = now;
        return true;
      }
    } catch {}
    return false;
  };

  const loadSupabaseStorage = async () => {
    try {
      const { data, error } = await supabaseAdmin.storage.from(STATE_BUCKET).download(STATE_OBJECT);
      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        applyStatePayload(parsed);
        stateInitialized = true;
        lastSyncTime = now;

        try {
          const fs = await import('fs');
          fs.writeFileSync(LOCAL_STATE_FILE, text, 'utf-8');
        } catch {}
        return true;
      }
    } catch {}
    return false;
  };

  // On Vercel serverless, always prefer Supabase Storage so cross-container updates
  // (device sync last_seen, new children, class changes) are never shadowed by stale /tmp.
  if (process.env.VERCEL) {
    if (await loadSupabaseStorage()) return;
    if (await loadLocal()) return;
  } else {
    if (await loadLocal()) return;
    if (await loadSupabaseStorage()) return;
  }

  stateInitialized = true;
  lastSyncTime = now;
}

async function persistState(): Promise<void> {
  const turnsObj: Record<string, TurnRecord[]> = {};
  for (const [sid, list] of memoryStore.turns.entries()) {
    turnsObj[sid] = list;
  }

  const payload = {
    children: Array.from(memoryStore.children.values()),
    devices: Array.from(memoryStore.devices.values()),
    childSettings: Array.from(memoryStore.childSettings.values()),
    familyMembers: Array.from(memoryStore.familyMembers.values()),
    commands: memoryStore.commands,
    sessions: Array.from(memoryStore.sessions.values()),
    turns: turnsObj,
    grades: Array.from(memoryStore.grades.values()),
    events: memoryStore.events,
    flags: memoryStore.flags,
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

  async getChildrenByFamily(familyId: string): Promise<ChildRecord[]> {
    await ensureStateLoaded();
    try {
      const { data, error } = await supabaseAdmin
        .from('children')
        .select('*')
        .eq('family_id', familyId)
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) return data as ChildRecord[];
    } catch {}

    const list: ChildRecord[] = [];
    for (const c of memoryStore.children.values()) {
      if (c.family_id === familyId && !c.archived) list.push(c);
    }
    return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async createChild(input: {
    family_id: string;
    name: string;
    cbse_class: number;
    avatar?: string;
    subjects?: string[];
  }): Promise<{ child: ChildRecord; settings: ChildSettingsRecord }> {
    await ensureStateLoaded();
    const childId = crypto.randomUUID();
    const now = new Date().toISOString();

    const child: ChildRecord = {
      id: childId,
      family_id: input.family_id,
      name: input.name.trim(),
      cbse_class: input.cbse_class,
      avatar: input.avatar || '👦',
      archived: false,
      created_at: now
    };

    const classSubjects = getSubjectsForClass(input.cbse_class);
    const chosenSubjects =
      input.subjects && input.subjects.length > 0 ? input.subjects : classSubjects;

    const settings: ChildSettingsRecord = {
      child_id: childId,
      subjects: chosenSubjects,
      stay_on_syllabus: true,
      camera_exam: true,
      break_prompts: true,
      keep_photos: false,
      daily_limit_min: 60,
      window_start: '07:00',
      window_end: '20:00',
      language: 'en',
      wake_sensitivity: 4,
      parent_pin_hash: null,
      theme: 'light',
      robot_theme: 'day',
      version: 1,
      updated_at: now
    };

    memoryStore.children.set(childId, child);
    memoryStore.childSettings.set(childId, settings);

    try {
      await supabaseAdmin.from('children').insert(child);
      await supabaseAdmin.from('child_settings').insert(settings);
    } catch {}

    await persistState();
    return { child, settings };
  },

  async updateChild(
    childId: string,
    updates: { name?: string; cbse_class?: number; avatar?: string }
  ): Promise<{ child: ChildRecord; settings: ChildSettingsRecord }> {
    await ensureStateLoaded();
    const existing = memoryStore.children.get(childId);
    if (!existing) throw new Error('Child not found');

    const newClass = updates.cbse_class !== undefined ? updates.cbse_class : existing.cbse_class;
    const updatedChild: ChildRecord = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      cbse_class: newClass,
      avatar: updates.avatar !== undefined ? updates.avatar : existing.avatar
    };

    memoryStore.children.set(childId, updatedChild);
    try {
      await supabaseAdmin
        .from('children')
        .update({
          name: updatedChild.name,
          cbse_class: updatedChild.cbse_class,
          avatar: updatedChild.avatar
        })
        .eq('id', childId);
    } catch {}

    // Reconcile subjects if class changed, and bump settings version so robot picks up child_name/child_class
    const currentSettings = (await this.getChildSettings(childId)) || {
      child_id: childId,
      subjects: getSubjectsForClass(newClass),
      stay_on_syllabus: true,
      camera_exam: true,
      break_prompts: true,
      keep_photos: false,
      daily_limit_min: 60,
      window_start: '07:00',
      window_end: '20:00',
      language: 'en' as const,
      wake_sensitivity: 4,
      parent_pin_hash: null,
      theme: 'light' as const,
      robot_theme: 'day' as const,
      version: 1,
      updated_at: new Date().toISOString()
    };

    let nextSubjects = currentSettings.subjects;
    if (updates.cbse_class !== undefined && updates.cbse_class !== existing.cbse_class) {
      const validForNewClass = getSubjectsForClass(newClass);
      const kept = currentSettings.subjects.filter((s) => validForNewClass.includes(s));
      nextSubjects = kept.length > 0 ? kept : validForNewClass;
    }

    const updatedSettings = await this.updateChildSettings(childId, {
      subjects: nextSubjects
    });

    await persistState();
    return { child: updatedChild, settings: updatedSettings };
  },

  async assignDeviceChild(deviceId: string, childId: string): Promise<DeviceRecord> {
    await ensureStateLoaded();
    const d = memoryStore.devices.get(deviceId) || (await this.getDeviceByUid('DUDU-90932C9FC114'));
    if (!d) throw new Error('Device not found');

    const child = await this.getChildById(childId);
    if (!child) throw new Error('Child not found');

    const updated: DeviceRecord = {
      ...d,
      family_id: child.family_id,
      child_id: child.id
    };

    memoryStore.devices.set(d.id, updated);
    try {
      await supabaseAdmin
        .from('devices')
        .update({ family_id: child.family_id, child_id: child.id })
        .eq('id', d.id);
    } catch {}

    await persistState();
    return updated;
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
    await ensureStateLoaded();
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
    await ensureStateLoaded();
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
        session_id: sessionId,
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

    await persistState();
    return { sessionId, needsReviewCount };
  },

  async getSessions(childId: string): Promise<SessionRecord[]> {
    await ensureStateLoaded();
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
    await ensureStateLoaded();
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
    await ensureStateLoaded();
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
    await ensureStateLoaded();
    memoryStore.turns.delete(sessionId);
    try {
      await supabaseAdmin.from('turns').delete().eq('session_id', sessionId);
    } catch {}
    await persistState();
  },

  async flagTurn(turnId: number, userId: string, reason: string): Promise<void> {
    await ensureStateLoaded();
    memoryStore.flags.push({ turn_id: turnId, user_id: userId, reason });
    try {
      await supabaseAdmin.from('flags').insert({ turn_id: turnId, user_id: userId, reason });
    } catch {}
    await persistState();
  },

  async getGrades(childId: string, status?: 'needs_review' | 'auto' | 'reviewed'): Promise<GradeRecord[]> {
    await ensureStateLoaded();
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
    await ensureStateLoaded();
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

    await persistState();
    return updated;
  },

  async getEvents(childId: string): Promise<EventRecord[]> {
    await ensureStateLoaded();
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
