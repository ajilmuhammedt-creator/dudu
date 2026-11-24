// scripts/fake-robot.ts
/**
 * DuDu ESP32-S3 Robot Simulator
 * 
 * Simulates the ESP32-S3 firmware:
 * 1. Registers with device UID (e.g. EB-QAI96T) and IP 192.168.1.107.
 * 2. Displays pairing code formatted like '483 921' until paired.
 * 3. Once paired, syncs every 10 seconds, executes commands, and marks ack_cmd.
 * 4. Can upload a test session with a photo and scan item (triggering needs_review).
 */

const BASE_URL = process.env.ROBOT_SERVER_URL || 'http://localhost:3000';
const DEVICE_UID = process.env.ROBOT_UID || 'EB-QAI96T';
const ROBOT_IP = process.env.ROBOT_IP || '192.168.1.107';
const FIRMWARE = '1.0';

let deviceToken = '';
let isPaired = false;
let pairingCode = '';
let lastCmdId = 0;
let uptimeSeconds = 100;

async function register() {
  console.log(`\n🤖 [DuDu ESP32-S3] Powering on...`);
  console.log(`📡 [DuDu ESP32-S3] Connecting to Wi-Fi at IP ${ROBOT_IP}... Connected.`);
  console.log(`🔗 [DuDu ESP32-S3] Registering with cloud: ${BASE_URL}/api/device/register`);

  const res = await fetch(`${BASE_URL}/api/device/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_uid: DEVICE_UID, firmware: FIRMWARE })
  });

  if (!res.ok) {
    throw new Error(`Register failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  deviceToken = data.device_token;
  isPaired = data.paired;
  pairingCode = data.pairing_code;

  console.log(`✅ [DuDu ESP32-S3] Token received: ${deviceToken.slice(0, 8)}...`);
  if (!isPaired) {
    const formattedCode = `${pairingCode.slice(0, 3)} ${pairingCode.slice(3)}`;
    console.log(`\n======================================================`);
    console.log(`📱 [ROBOT SCREEN] Enter 6-digit code in Parent App:`);
    console.log(`                  >>>  ${formattedCode}  <<<`);
    console.log(`======================================================\n`);
  } else {
    console.log(`🎉 [DuDu ESP32-S3] Robot is already paired!`);
  }
}

async function sync() {
  uptimeSeconds += 10;
  const res = await fetch(`${BASE_URL}/api/device/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deviceToken}`
    },
    body: JSON.stringify({
      firmware: FIRMWARE,
      rssi: -58,
      ip: ROBOT_IP,
      uptime_s: uptimeSeconds,
      settings_version: 4,
      ack_cmd: lastCmdId,
      usage_today_min: 42,
      mode: 'study',
      busy: false
    })
  });

  if (res.status === 401) {
    console.log(`⚠️ Token expired or invalid. Re-registering...`);
    await register();
    return;
  }

  if (!res.ok) {
    console.error(`❌ Sync error: ${res.status}`);
    return;
  }

  const data = await res.json();
  if (!data.paired) {
    isPaired = false;
    const code = data.pairing_code || pairingCode;
    const formatted = `${code.slice(0, 3)} ${code.slice(3)}`;
    console.log(`⏳ Waiting for pairing... Code: [ ${formatted} ]`);
    return;
  }

  if (!isPaired && data.paired) {
    isPaired = true;
    console.log(`🎉 Robot successfully paired to child: ${data.child_name} (Class ${data.child_class})!`);
  }

  // Check incoming commands
  if (data.cmd_id && data.cmd_id > 0) {
    console.log(`\n⚡ [DuDu COMMAND RECEIVED] ID: ${data.cmd_id} | Type: ${data.cmd_type} | Arg: "${data.cmd_arg}"`);
    if (data.cmd_type === 'say') {
      console.log(`🔊 [DuDu TTS] Speaking: "${data.cmd_arg}"`);
    } else if (data.cmd_type === 'practice') {
      console.log(`📚 [DuDu Session] Starting practice topic: "${data.cmd_arg}"`);
    } else if (data.cmd_type === 'rewrite') {
      console.log(`✏️ [DuDu Screen] Prompting child to write again: "${data.cmd_arg}"`);
    } else if (data.cmd_type === 'unpair') {
      console.log(`🔓 [DuDu] Unpair command received.`);
      isPaired = false;
    }
    lastCmdId = data.cmd_id;
  }
}

async function uploadSampleSession() {
  console.log(`\n📤 [DuDu ESP32-S3] Uploading completed exam session with written scan...`);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    mode: 'exam',
    subject: 'Mathematics',
    chapter: 'Give and Take (Ch 12)',
    started_at: now - 960,
    ended_at: now,
    minutes: 16,
    questions: 4,
    answered_right: 3,
    off_topic: 2,
    camera_used: true,
    watch_checks: 24,
    watch_moving: 19,
    active_pct: 79,
    sleepy_checks: 1,
    sleepy_yes: 1,
    sleepy_no_answer: 0,
    distractions: 3,
    turns: [
      { s: 'robot', t: 'Let us check your written page for Question 3.', at: now - 900 },
      { s: 'child', t: 'I held it up to the camera.', at: now - 850 }
    ],
    events: [
      { type: 'camera_capture', at: now - 800 },
      { type: 'off_topic', at: now - 600 },
      { type: 'sleepy_check', at: now - 400 },
      { type: 'sleepy_yes', at: now - 390 }
    ],
    scans: [
      {
        photo_id: 'demo-scan-q3',
        at: now - 60,
        result: {
          summary: 'I checked 4 sums. 3 are correct and 1 needs another look.',
          right: 3,
          total: 4,
          confidence: 0.92,
          items: [
            { q: '47 + 38', child_answer: '85', correct_answer: '85', correct: true, confidence: 0.97, tip: '' },
            { q: '56 + 29', child_answer: '85', correct_answer: '85', correct: true, confidence: 0.95, tip: '' },
            {
              q: '72 - 45',
              child_answer: '37',
              correct_answer: '27',
              correct: false,
              confidence: 0.58,
              tip: 'Check the ones column: can you take 5 away from 2 without borrowing?',
              reason: 'The 3 could be a 2'
            },
            { q: '4 x 7', child_answer: '28', correct_answer: '28', correct: true, confidence: 0.99, tip: '' }
          ]
        }
      }
    ]
  };

  const res = await fetch(`${BASE_URL}/api/device/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deviceToken}`
    },
    body: JSON.stringify(payload)
  });

  const resData = await res.json();
  console.log(`✅ Session uploaded! ID: ${resData.session_id}, Needs Review Items: ${resData.needs_review}`);
}

async function main() {
  await register();

  // Run initial sync
  await sync();

  if (isPaired) {
    await uploadSampleSession();
  }

  // Periodic sync loop
  console.log(`\n🔄 Starting heartbeat loop (every 10s)... Press Ctrl+C to stop.`);
  setInterval(async () => {
    try {
      await sync();
    } catch (err: any) {
      console.error(`Sync error: ${err.message}`);
    }
  }, 10000);
}

if (require.main === module) {
  main().catch(console.error);
}
