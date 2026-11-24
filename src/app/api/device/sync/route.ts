// src/app/api/device/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateDevice } from '@/lib/device-auth';
import { generatePairingCode } from '@/lib/crypto';
import { DataStore } from '@/lib/data-store';
import { getNowUnixSeconds } from '@/lib/date-utils';

const syncSchema = z.object({
  firmware: z.string().optional().default('1.0'),
  rssi: z.number().optional().default(0),
  ip: z.string().optional().default(''),
  uptime_s: z.number().optional().default(0),
  settings_version: z.number().optional().default(0),
  ack_cmd: z.number().optional().default(0),
  usage_today_min: z.number().optional().default(0),
  mode: z.string().optional().default(''),
  busy: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  const auth = await authenticateDevice(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { device } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Tolerant to empty or missing body
  }

  const parsed = syncSchema.safeParse(body);
  const data = parsed.success ? parsed.data : syncSchema.parse({});

  // 1. If ack_cmd > 0, mark command as done
  if (data.ack_cmd > 0) {
    await DataStore.ackCommand(data.ack_cmd);
  }

  // 2. Check pairing status
  const isPaired = Boolean(device.family_id && device.child_id);
  const serverTime = getNowUnixSeconds();

  if (!isPaired) {
    // If device is unpaired and code expired, issue new code
    let activeCode = device.pairing_code;
    const isExpired = !device.pairing_code_expires || new Date(device.pairing_code_expires) <= new Date();

    if (!activeCode || isExpired) {
      activeCode = generatePairingCode();
      const expires = new Date(Date.now() + 30 * 60000).toISOString();
      await DataStore.updateDeviceSync(device.id, {
        firmware: data.firmware,
        rssi: data.rssi,
        ip: data.ip,
        pairing_code: activeCode,
        pairing_code_expires: expires
      });
    } else {
      await DataStore.updateDeviceSync(device.id, {
        firmware: data.firmware,
        rssi: data.rssi,
        ip: data.ip
      });
    }

    // Unpaired flat response
    return NextResponse.json({
      paired: false,
      pairing_code: activeCode,
      server_time: serverTime
    });
  }

  // 3. Paired flow
  await DataStore.updateDeviceSync(device.id, {
    firmware: data.firmware,
    rssi: data.rssi,
    ip: data.ip,
    settings_version: data.settings_version
  });

  const child = await DataStore.getChildById(device.child_id!);
  const settings = await DataStore.getChildSettings(device.child_id!);
  const usageTodayMin = await DataStore.getTodayUsageMinutes(device.child_id!);

  // Fetch oldest pending command
  const pendingCmd = await DataStore.getOldestPendingCommand(device.id);

  // Return strictly FLAT response (strings, numbers, booleans, comma-separated lists)
  return NextResponse.json({
    paired: true,
    server_time: serverTime,
    child_name: child?.name || 'Arjun',
    child_class: child?.cbse_class || 3,
    settings_version: settings?.version || 1,
    subjects: (settings?.subjects || ['Mathematics', 'EVS']).join(','),
    stay_on_syllabus: settings?.stay_on_syllabus ?? true,
    camera_exam: settings?.camera_exam ?? true,
    break_prompts: settings?.break_prompts ?? true,
    keep_photos: settings?.keep_photos ?? false,
    daily_limit_min: settings?.daily_limit_min ?? 60,
    window_start: settings?.window_start ?? '16:30',
    window_end: settings?.window_end ?? '19:30',
    language: settings?.language ?? 'en',
    wake_sensitivity: settings?.wake_sensitivity ?? 4,
    robot_theme: settings?.robot_theme || 'day',
    usage_today_min: usageTodayMin,
    cmd_id: pendingCmd ? pendingCmd.id : 0,
    cmd_type: pendingCmd ? pendingCmd.type : '',
    cmd_arg: pendingCmd ? pendingCmd.arg : ''
  });
}
