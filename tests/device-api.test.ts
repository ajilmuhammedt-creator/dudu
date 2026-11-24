// tests/device-api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { POST as registerHandler } from '../src/app/api/device/register/route';
import { POST as syncHandler } from '../src/app/api/device/sync/route';
import { POST as sessionHandler } from '../src/app/api/device/session/route';
import { POST as unpairHandler } from '../src/app/api/unpair/route';
import { POST as pairHandler } from '../src/app/api/pair/route';
import { POST as controlsHandler } from '../src/app/api/controls/route';
import { GET as statusHandler } from '../src/app/api/device/status/route';
import { NextRequest } from 'next/server';
import { DataStore } from '../src/lib/data-store';
import { sha256 } from '../src/lib/crypto';

describe('Device API Contract Tests', () => {
  let unpairedToken = '';
  let unpairedCode = '';
  const testUid = `TEST-ROBOT-${Date.now()}`;

  it('1. POST /api/device/register - registers new robot and returns flat JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/device/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        device_uid: testUid,
        firmware: '1.0'
      })
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('device_token');
    expect(data.device_token).toHaveLength(64); // 32-byte hex
    expect(data.paired).toBe(false);
    expect(data.pairing_code).toMatch(/^\d{6}$/); // 6-digit code

    unpairedToken = data.device_token;
    unpairedCode = data.pairing_code;
  });

  it('2. POST /api/device/sync - handles unpaired device with flat response', async () => {
    const req = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unpairedToken}`
      },
      body: JSON.stringify({
        firmware: '1.0',
        rssi: -58,
        ip: '192.168.1.107',
        uptime_s: 120,
        settings_version: 0,
        ack_cmd: 0
      })
    });

    const res = await syncHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.paired).toBe(false);
    expect(data.pairing_code).toBe(unpairedCode);
    expect(typeof data.server_time).toBe('number');
  });

  it('3. POST /api/device/sync - returns 401 bad_token on invalid credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_random_token_string'
      },
      body: JSON.stringify({ firmware: '1.0' })
    });

    const res = await syncHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('bad_token');
  });

  it('4. POST /api/device/sync - handles paired device with flat settings and commands', async () => {
    // Pair the test device to Arjun
    const tokenHash = sha256(unpairedToken);
    const dev = await DataStore.getDeviceByTokenHash(tokenHash);
    expect(dev).not.toBeNull();

    await DataStore.pairDevice(
      dev!.id,
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    );

    const req = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unpairedToken}`
      },
      body: JSON.stringify({
        firmware: '1.0',
        rssi: -55,
        ip: '192.168.1.107',
        uptime_s: 200,
        settings_version: 4,
        ack_cmd: 0
      })
    });

    const res = await syncHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.paired).toBe(true);
    expect(data.child_name).toBe('Arjun');
    expect(data.child_class).toBe(3);
    expect(typeof data.subjects).toBe('string'); // Comma-separated list for flat parser
    expect(data.stay_on_syllabus).toBe(true);
    expect(typeof data.usage_today_min).toBe('number');
    expect(typeof data.cmd_id).toBe('number');
  });

  it('5. POST /api/device/session - marks low-confidence scan item as needs_review', async () => {
    const now = Math.floor(Date.now() / 1000);
    const req = new NextRequest('http://localhost:3000/api/device/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unpairedToken}`
      },
      body: JSON.stringify({
        mode: 'exam',
        subject: 'Mathematics',
        chapter: 'Give and Take (Ch 12)',
        started_at: now - 900,
        ended_at: now,
        minutes: 15,
        questions: 2,
        answered_right: 1,
        camera_used: true,
        scans: [
          {
            photo_id: 'test-scan-uuid',
            result: {
              items: [
                {
                  q: '47 + 38',
                  child_answer: '85',
                  correct_answer: '85',
                  correct: true,
                  confidence: 0.95
                },
                {
                  q: '72 - 45',
                  child_answer: '37',
                  correct_answer: '27',
                  correct: false,
                  confidence: 0.58, // < 0.8 triggers needs_review
                  reason: 'The 3 could be a 2'
                }
              ]
            }
          }
        ]
      })
    });

    const res = await sessionHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('session_id');
    expect(data.needs_review).toBe(1); // 1 item flagged with <0.8 confidence
  });

  it('6. Full cycle: unpair → sync gets paired:false with code → pair with code → sync gets paired:true', async () => {
    // A. Unpair device
    const unpairReq = new NextRequest('http://localhost:3000/api/unpair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: '33333333-3333-3333-3333-333333333333' })
    });
    const unpairRes = await unpairHandler(unpairReq);
    expect(unpairRes.status).toBe(200);

    // Verify status returns paired: false
    const statusRes = await statusHandler();
    const statusData = await statusRes.json();
    expect(statusData.paired).toBe(false);

    // B. Robot syncs after unpair -> receives paired: false with 6-digit pairing_code
    const syncReq1 = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer DUDU-90932C9FC114'
      },
      body: JSON.stringify({ firmware: '1.0' })
    });
    const syncRes1 = await syncHandler(syncReq1);
    expect(syncRes1.status).toBe(200);
    const syncData1 = await syncRes1.json();
    expect(syncData1.paired).toBe(false);
    expect(syncData1.pairing_code).toMatch(/^\d{6}$/);

    const robotCode = syncData1.pairing_code;

    // C. Pair using that code from "Pair a robot" modal
    const pairReq = new NextRequest('http://localhost:3000/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: robotCode,
        child_id: '22222222-2222-2222-2222-222222222222'
      })
    });
    const pairRes = await pairHandler(pairReq);
    expect(pairRes.status).toBe(200);
    const pairData = await pairRes.json();
    expect(pairData.success).toBe(true);

    // D. Robot syncs again -> receives paired: true with Arjun's settings
    const syncReq2 = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer DUDU-90932C9FC114'
      },
      body: JSON.stringify({ firmware: '1.0' })
    });
    const syncRes2 = await syncHandler(syncReq2);
    expect(syncRes2.status).toBe(200);
    const syncData2 = await syncRes2.json();
    expect(syncData2.paired).toBe(true);
    expect(syncData2.child_name).toBe('Arjun');
    expect(syncData2.child_class).toBe(3);
  });

  it('7. POST /api/controls & sync - updates and propagates themes to device', async () => {
    const controlsReq = new NextRequest('http://localhost:3000/api/controls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_id: '22222222-2222-2222-2222-222222222222',
        theme: 'dark',
        robot_theme: 'night'
      })
    });
    const controlsRes = await controlsHandler(controlsReq);
    expect(controlsRes.status).toBe(200);
    const controlsData = await controlsRes.json();
    expect(controlsData.settings.theme).toBe('dark');
    expect(controlsData.settings.robot_theme).toBe('night');

    // Robot syncs and receives robot_theme: 'night'
    const syncReq = new NextRequest('http://localhost:3000/api/device/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer DUDU-90932C9FC114'
      },
      body: JSON.stringify({ firmware: '1.0' })
    });
    const syncRes = await syncHandler(syncReq);
    expect(syncRes.status).toBe(200);
    const syncData = await syncRes.json();
    expect(syncData.paired).toBe(true);
    expect(syncData.robot_theme).toBe('night');
  });
});
