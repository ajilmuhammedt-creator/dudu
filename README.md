# EduBuddy Parent Web App & DuDu ESP32-S3 Device API

EduBuddy Parent is a mobile-first (and desktop-responsive) companion web application and device cloud backend for **EduBuddy** (robot internal code: **DuDu**), an AI desk robot designed for CBSE students in India (Classes 1–10). The robot hardware runs on an ESP32-S3 microcontroller with a 1.8" screen, camera, microphone, speaker, and head touch sensor.

---

## 1. Features & Screens

- **Today (Mobile Home)**: Real-time study statistics (e.g. 42 min of 60 min limit), latest exam score, healthy break prompt alerts, review banner, and today's session activity.
- **Review Queue**: Dedicated parent verification queue for uncertain robot OCR/grading decisions (`confidence < 0.8`), complete with handwritten answer photo preview (tap-to-zoom), decision buttons (Correct / Half / Wrong), and a remote `rewrite` trigger back to the robot.
- **Controls ("What EduBuddy may do")**: Subject management, syllabus adherence toggle, exam camera permissions (with privacy notice), break prompt controls, daily study limits (15–180 min), study time window, robot language (English, Hindi, Malayalam), wake sensitivity, and parent PIN lock.
- **Progress**: Daily study minutes bar chart (Mon–Sun), chapter mastery breakdown, automated rule-based weak-spot insight generator ("Subtraction with borrowing is the weak spot..."), one-click practice session dispatcher, and recent exams history.
- **Session Transcript**: View complete dialogue turns between EduBuddy and the child, off-topic notes, response flagging for model improvement, and DPDP-compliant transcript deletion.
- **Desktop Overview Dashboard**: Complete 1440px+ command center with 4 KPI tiles, chapter mastery table, weak-spot recommendations, right-rail review queue preview, live device card, sessions table, and **Server-Rendered PDF Report Download** (`@react-pdf/renderer`).
- **Device Management**: Telemetry monitor showing firmware version, local IP (`192.168.1.107`), Wi-Fi RSSI, online status indicator (3-minute heartbeat), remote text-to-speech `say` command (max 120 chars), and secure unpairing.
- **Onboarding & Pairing**: 3-step setup (Account → Child → Robot) with 6-digit code entry (`483 921`), robot screen illustration, and DPDP guardian consent.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript, React 19, Server Components, Route Handlers)
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL with RLS, Auth, Storage bucket `answer-photos`, Realtime channels)
- **Charts**: Recharts
- **PDF Generation**: `@react-pdf/renderer`
- **Testing**: Vitest (API suite)
- **Timezone**: `Asia/Kolkata` (IST)

---

## 3. Fixed Device API Contract

The device API routes (`/api/device/*`) strictly conform to the embedded ESP32-S3 firmware contract:
- **Flat JSON Responses**: Top-level keys only; no nested objects or arrays in responses; list fields formatted as comma-separated strings (e.g. `"subjects": "Mathematics,EVS"`).
- **Authentication**: Bearer token checked via SHA-256 hash lookup against `devices.token_hash`.
- **IP Address**: Configured for ESP32-S3 device at `192.168.1.107`.

### Endpoints
1. `POST /api/device/register` (No Auth):
   - Accepts: `{"device_uid":"EB-QAI96T","firmware":"1.0"}`
   - Returns: `{"device_token":"<64 hex>","paired":false,"pairing_code":"483921"}`
2. `POST /api/device/sync` (Bearer Auth):
   - Accepts heartbeat with telemetry (`ip: 192.168.1.107`, `rssi`, `uptime_s`, `ack_cmd`, `usage_today_min`).
   - Returns flat sync settings, today's usage in Asia/Kolkata, and oldest pending parent command.
3. `POST /api/device/photo` (Bearer Auth):
   - Uploads raw JPEG image (`Content-Type: image/jpeg`, max 1 MB) into private storage bucket `answer-photos`.
4. `POST /api/device/session` (Bearer Auth):
   - Uploads finished session with turns, events, and written scan results. Scan items with confidence `< 0.8` automatically enter `needs_review`.

---

## 4. Local Development

### Prerequisites
- Node.js v20+ or v24+
- `pnpm` (or `npm`)

### Installation & Run
```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables (.env.local)
cp .env.example .env.local

# 3. Run development server
pnpm dev

# 4. In a separate terminal, test the ESP32-S3 fake robot:
pnpm robot
```

### Running Tests
```bash
pnpm test
```

---

## 5. Supabase Setup & Migrations

### Applying Database Schema
1. Open your Supabase Dashboard:
   `https://supabase.com/dashboard/project/yqviyubyjmwqtprywval/sql`
2. Run the SQL script located at:
   `supabase/migrations/00001_initial_schema.sql`
3. Run the seed data script:
   `supabase/seed.sql`

### Storage Bucket
- Ensure a private storage bucket named `answer-photos` exists with a 1 MB file size limit and MIME type `image/jpeg`.

---

## 6. Vercel Deployment

1. Push this repository to GitHub: `https://github.com/ajilmuhammedt-creator/dudu.git`
2. Import the project into [Vercel](https://vercel.com).
3. Set the following environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_...`
   - `APP_TIMEZONE`: `Asia/Kolkata`
   - `NEXT_PUBLIC_APP_URL`: Your deployed Vercel domain (e.g. `https://edubuddy-parent.vercel.app`)
4. Deploy!

---

## 7. Privacy & DPDP Act Compliance

- **No video streaming**: Camera is strictly hardware-limited to Exam and Scan & Check modes. An onboard physical LED lights up when the camera is powered.
- **Retention**: Answer photos are automatically discarded after 30 days via `/api/cron/cleanup` or immediately after grading if `keep_photos` is toggled off.
- **Parental Sovereignty**: Parents can inspect all dialogue turns, flag unsatisfactory responses, or delete session transcripts permanently.
