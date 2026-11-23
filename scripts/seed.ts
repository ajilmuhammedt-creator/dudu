// scripts/seed.ts
import { supabaseAdmin } from '../src/lib/supabase/admin';

async function seed() {
  console.log('🌱 Starting Supabase database seed for EduBuddy...');

  const fId = '11111111-1111-1111-1111-111111111111';
  const cId = '22222222-2222-2222-2222-222222222222';
  const dId = '33333333-3333-3333-3333-333333333333';

  try {
    // 1. Families
    const { error: fErr } = await supabaseAdmin.from('families').upsert({
      id: fId,
      name: 'Sharma Family'
    });
    if (fErr) console.warn('Families upsert notice:', fErr.message);

    // 2. Children
    const { error: cErr } = await supabaseAdmin.from('children').upsert({
      id: cId,
      family_id: fId,
      name: 'Arjun',
      cbse_class: 3,
      avatar: '👦',
      archived: false
    });
    if (cErr) console.warn('Children upsert notice:', cErr.message);

    // 3. Child Settings
    const { error: csErr } = await supabaseAdmin.from('child_settings').upsert({
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
      version: 4
    });
    if (csErr) console.warn('Child settings notice:', csErr.message);

    // 4. Device (DuDu ESP32-S3 with IP 192.168.1.107)
    const { error: dErr } = await supabaseAdmin.from('devices').upsert({
      id: dId,
      device_uid: 'EB-QAI96T',
      token_hash: 'demo_token_hash',
      family_id: fId,
      child_id: cId,
      name: 'Study Room',
      firmware: '1.0',
      pairing_code: '483921',
      last_seen: new Date().toISOString(),
      rssi: -58,
      ip: '192.168.1.107',
      settings_version_acked: 3
    });
    if (dErr) console.warn('Devices upsert notice:', dErr.message);

    console.log('✅ Supabase seed check completed.');
  } catch (err: any) {
    console.error('Seed exception:', err.message);
  }
}

seed();
