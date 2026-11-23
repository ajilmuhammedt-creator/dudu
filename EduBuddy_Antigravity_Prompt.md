# EduBuddy Parent web app — build prompt for Antigravity

> Attach **EduBuddy — Device & Parent App UI/UX.pdf** to the agent together with this prompt.
> Paste everything below the line into Antigravity's agent panel.

---

## 1. What you are building

Build **EduBuddy Parent**, a production-quality web app (mobile-first, works on desktop) for parents of children who use **EduBuddy**, a small AI desk robot for CBSE students in India (Classes 1–10). The robot's internal name is **DuDu**. It runs on an ESP32-S3 with a 1.8" screen, mic, speaker, camera and a touch sensor on its head. It talks to the child by voice.

The web app has two jobs:

1. **Parent app:** the screens in the attached PDF. These are Today, Progress, Review, Controls, a session transcript, robot pairing, and a desktop dashboard.
2. **Device API:** the cloud backend the robot calls. Robots register, get paired to a child, pull settings, upload finished study sessions and homework-check results, and receive parent commands.

The **robot screens** in the PDF (Learn / Q&A / Exam / Scan & Check, the keypad, the "Feeling sleepy?" card) are **not** web pages. The real robot only has a 160×128 screen and works by voice. Use those pages only to understand the data the robot produces. Do **not** build them.

The device API contract in section 6 is **fixed**. The firmware is already written against it. Do not rename fields, paths or status codes.

## 2. Tech stack (use exactly this)

- **Framework:** Next.js 15 (App Router, TypeScript, Server Components, Route Handlers for the API) with Tailwind CSS. Use shadcn/ui for primitives where it helps. Use lucide-react icons.
- **Backend services:** Supabase (Postgres, Auth with email magic link + Google, Storage for photos, Row Level Security). Access it with `@supabase/ssr`.
- **Charts:** Recharts.
- **Hosting:** Vercel. Create `.env.example` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server only, used by the device API)
  - `APP_TIMEZONE=Asia/Kolkata`
- **Database setup:** write SQL migrations in `supabase/migrations/` and a seed script that creates the demo family from the PDF (Arjun, Class 3, Mathematics + EVS, one week of sessions, one grade waiting for review).
- **Time zone:** all "today" and "this week" maths runs in **Asia/Kolkata**.

## 3. Visual design

Follow the PDF closely: layout, wording, card structure, the bottom tab bar on mobile (**Today · Progress · Review · Controls**), and the left sidebar on desktop (Overview, Progress, Review queue with a count badge, Sessions, Controls, Devices, Children, + Add child).

Design tokens (they match the robot's own control page):

- **Colours:**
  - background `#F6F3EE`, cards `#FFFFFF`, card border `#ECE7DE`, text `#1F2328`, muted text `#6B7280`
  - brand orange `#F26B1D`, study blue `#1E6FE0`, success `#17A34A`, warning `#B7791F`, error `#D8262B`
- **Shape:** card radius 20px, buttons 12px, minimum tap target 44px.
- **Font:** Inter.
- **Feel:** calm, warm and trustworthy. No dark patterns, no gamified pressure on the parent.
- **Accessibility:** WCAG AA contrast, keyboard navigable, every chart also readable as text.
- **Languages:** the UI is English. Structure the strings with `next-intl` so Hindi and Malayalam can be added later.

## 4. Screens (match the PDF)

**Onboarding** (stepper "1 Account · 2 Child · 3 Robot"):
- **Account:** sign up / sign in.
- **Child:** name, CBSE class 1–10, subjects.
- **Robot:** pairing. The heading is "Pair Arjun's EduBuddy". Show a 6-digit code input formatted `483 921` and an illustration of what the robot's screen looks like. Below it, a child picker ("Pair to" + "+ Add child") and this note: "The robot keeps its own key. Pairing only tells it which family and child it belongs to; you can unpair any time." Then a **Pair robot** button.
- **Pairing errors:** wrong or expired code → inline error. Robot already paired to another family → explain that it must be unpaired first.

**Today** (mobile home):
- **Header:** child name, "CBSE Class 3 · Mathematics, EVS", robot online/offline dot. A robot is online if `last_seen` is under 3 minutes ago.
- **Three stat tiles:**
  - Study time "42 min of 60 min limit"
  - Exam score (latest exam today, chapter name)
  - Breaks (count + last break-prompt time)
- **Banner** "Grade needs your check" with a count. It links to Review.
- **Sessions list for today:** mode · topic, time range, number of questions, length, and the score or "camera used".

**Session transcript:**
- **Header:** "Learn · Give and Take", time range · length · camera on/off.
- **Stats row:** questions, answered right, off-topic asks.
- **Body:** chat bubbles (robot left, child right). Off-topic turns get a small note: "Off-topic · stayed on syllabus (your setting)".
- **Actions:**
  - **Flag a reply:** select a robot turn and add a reason. It is stored in `flags`.
  - **Delete transcript:** confirm dialog, then hard delete of the turns, keeping session stats.

**Review** (queue of grades with `status = 'needs_review'`):
- **Header:** "Check this grade". Under it: session · chapter · question number · time.
- **Explanation:** "EduBuddy read the answer as 63 but was only 58% sure — the 6 could be a 0. Please decide." This comes from `grades.reason` and `confidence`.
- **Question card:** question text, correct answer, marks.
- **Photo:** the child's page from Storage, tap to zoom, using a signed URL.
- **Decision buttons:** Correct (full marks) / Half / Wrong (0).
- **Link:** "Ask Arjun to write it again on the robot". This creates a `rewrite` command.
- **Save:** "Save · 1 of 1 reviewed".
- **Rule to state in the UI:** "Grades EduBuddy is sure about never land here."

**Progress** (Week / Month toggle):
- **Study minutes:** bar chart by day plus total ("3h 10m this week").
- **By subject:** per-subject cards with exams count and average. Under each, chapter rows with mastery %. Mastery is the share of correct graded answers per chapter.
- **Weak-spot insight card:** text written by the server (section 7) with a **Set a practice session** button. The button creates a `practice` command.
- **Recent exams list.**

**Controls** ("What EduBuddy may do") for the selected child. Every change saves immediately, then shows an "Updated on robot ✓" toast when the robot acks the new `settings_version`:
- **Class:** with "Change class".
- **Subjects the tutor may teach:** chips for Mathematics, EVS, English, Hindi, Science, Social Science, Malayalam, Computer.
- **Toggles:**
  - Stay on the syllabus
  - Camera for written exams
  - Break prompts
  - Keep answer photos ("Deleted after 30 days. Off = graded, then discarded.")
- **Daily study limit:** minutes, 15–180 in steps of 5.
- **Study window:** start and end time.
- **Robot language:** English / हिंदी / മലയാളം.
- **"Hey DuDu" sensitivity:** slider 1–10. Show a help line: "Higher = wakes more easily, but may wake by itself".
- **Parent PIN on the robot:** 4 digits, stored as a hash. This is a placeholder for a later firmware feature.

**Desktop dashboard (Overview):**
- **KPI tiles:** Study time with delta vs last week, Exams taken with avg score, Needs your check, Break prompts.
- **Chapter mastery table:** for the main subject.
- **Insight card.**
- **Right rail:** review queue preview with inline Correct/Wrong buttons, and a Device card (name, online, camera off/on, Manage).
- **"Sessions this week" table:**
  - Columns: When, Mode, Topic, Length, Result, Camera, Open/Transcript.
  - Buttons: **Download report (PDF)** (server-rendered with `@react-pdf/renderer`) and **Set a practice session**.

**Devices:**
- **List:** name (editable, e.g. "Study Room"), child, firmware version, online status, last seen, Wi-Fi signal.
- **Actions:** **Unpair** (sends an `unpair` command and clears `child_id`) and **Say something** (sends a `say` command, max 120 chars).

**Children:** add, edit or archive children. One family can have several children and several robots. Each robot is paired to exactly one child.

## 5. Data model (Postgres, all tables with RLS)

Row Level Security: a parent only sees rows of their own family. The device API uses the service role and checks the device token itself.

```
families(id uuid pk, created_at)
family_members(family_id fk, user_id fk auth.users, role text default 'parent', pk(family_id,user_id))
children(id uuid pk, family_id fk, name text, cbse_class int check 1..10, avatar text, archived bool default false, created_at)
child_settings(child_id pk fk, subjects text[] default '{Mathematics,EVS}', stay_on_syllabus bool default true,
  camera_exam bool default true, break_prompts bool default true, keep_photos bool default false,
  daily_limit_min int default 60, window_start time default '16:30', window_end time default '19:30',
  language text default 'en' check in ('en','hi','ml'), wake_sensitivity int default 4 check 1..10,
  parent_pin_hash text, version int default 1, updated_at timestamptz)
  -- trigger: bump version on every update
devices(id uuid pk, device_uid text unique, token_hash text, family_id fk null, child_id fk null, name text default 'EduBuddy',
  firmware text, pairing_code text, pairing_code_expires timestamptz, last_seen timestamptz, rssi int, ip text,
  settings_version_acked int default 0, created_at)
sessions(id uuid pk, device_id fk, child_id fk, mode text check in ('learn','qa','fun','exam','scan'), subject text, chapter text,
  started_at timestamptz, ended_at timestamptz, minutes int, questions int, answered_right int, off_topic int,
  camera_used bool, score_right int null, score_total int null, created_at)
turns(id bigserial pk, session_id fk on delete cascade, idx int, speaker text check in ('child','robot'), text text,
  off_topic bool default false, correct bool null, at timestamptz)
grades(id uuid pk, session_id fk, child_id fk, q_no int, question text, child_answer text, correct_answer text,
  marks_total numeric, marks_awarded numeric null, confidence real, reason text, status text check in
  ('auto','needs_review','reviewed'), photo_path text null, decided_by uuid null, decided_at timestamptz null,
  raw jsonb, created_at)
events(id bigserial pk, device_id fk, child_id fk null, type text, at timestamptz, data jsonb)   -- break_prompt, limit_reached, outside_window, wake, error
commands(id bigserial pk, device_id fk, type text check in ('say','practice','rewrite','unpair','refresh'), arg text,
  status text default 'pending' check in ('pending','sent','done','expired'), created_by uuid, created_at, acked_at)
flags(id bigserial pk, turn_id fk, user_id fk, reason text, created_at)
photos(id uuid pk, device_id fk, child_id fk, path text, created_at)
```

**Photo storage:** a private Storage bucket `answer-photos`.
- Signed URLs expire after 10 minutes.
- A daily scheduled job (Vercel Cron → `/api/cron/cleanup`) deletes photos older than 30 days, and also deletes all photos of children whose `keep_photos` is false, except photos linked to a grade that is still `needs_review`.

## 6. Device API — FIXED CONTRACT (the firmware already uses this)

**General rules:**
- **Base URL:** `${APP_URL}/api/device`.
- **Format:** JSON in and out (`Content-Type: application/json`) except the photo upload.
- **Keep responses FLAT and small.** The robot has a tiny JSON parser:
  - top-level keys only
  - strings, numbers, booleans
  - no nested objects or arrays in **responses**
  - lists sent as comma-separated strings
- **Auth:** every route except `register` requires `Authorization: Bearer <device_token>`. Look up the device by `sha256(token)` = `token_hash`, then update `last_seen`. On a bad token return 401 `{"error":"bad_token"}`. The robot then re-registers.
- **Times:** the robot sends times as unix seconds (UTC). `0` means "unknown, use server time".

### 6.1 `POST /api/device/register` (no auth)

Request: `{"device_uid":"DUDU-3C84A1F2B9","firmware":"1.0"}`

Behaviour:
- Create the device if it is new; otherwise keep its existing pairing.
- Generate a fresh random 32-byte token (hex) and store only its hash.
- If the device is not paired, generate a unique 6-digit `pairing_code`, valid 30 minutes.

Response 200:
```json
{"device_token":"<64 hex>","paired":false,"pairing_code":"483921"}
```

### 6.2 `POST /api/device/sync` (auth)

The robot calls this every 60 s while idle, right after boot, and after every upload.

Request:
```json
{"firmware":"1.0","rssi":-58,"ip":"192.168.1.107","uptime_s":5230,"settings_version":3,
 "ack_cmd":17,"usage_today_min":42,"mode":"study","busy":false}
```
- `ack_cmd` is the id of the last command the robot finished (`0` = none). Mark it `done`.
- If the device is unpaired and the pairing code has expired, issue a new code.

Response 200, unpaired:
```json
{"paired":false,"pairing_code":"483921","server_time":1763890000}
```

Response 200, paired:
```json
{"paired":true,"server_time":1763890000,
 "child_name":"Arjun","child_class":3,
 "settings_version":4,
 "subjects":"Mathematics,EVS",
 "stay_on_syllabus":true,"camera_exam":true,"break_prompts":true,"keep_photos":false,
 "daily_limit_min":60,"window_start":"16:30","window_end":"19:30",
 "language":"en","wake_sensitivity":4,
 "usage_today_min":42,
 "cmd_id":18,"cmd_type":"practice","cmd_arg":"Give and Take (Ch 12): subtraction with borrowing"}
```

Field rules:
- `usage_today_min` = sum of `sessions.minutes` for this child since local midnight (Asia/Kolkata).
- Send **at most one** pending command per sync: the oldest one. Set its status to `sent`. If none is pending, send `"cmd_id":0,"cmd_type":"","cmd_arg":""`.
- Commands older than 24 h become `expired`.
- Command arguments:
  - `say`: the text to speak.
  - `practice`: the topic.
  - `rewrite`: `"<grade_id>|<question text>"`.
  - `unpair` / `refresh`: empty.

### 6.3 `POST /api/device/photo` (auth)

Body: raw JPEG (`Content-Type: image/jpeg`, max 1 MB).

Behaviour: store it at `answer-photos/<family_id>/<child_id>/<uuid>.jpg`, then insert a row in `photos`.

Response: `{"photo_id":"<uuid>"}`

### 6.4 `POST /api/device/session` (auth)

The robot sends one finished session.

```json
{"mode":"learn","subject":"Mathematics","chapter":"Give and Take (Ch 12)",
 "started_at":1763887500,"ended_at":1763889060,"minutes":26,
 "questions":14,"answered_right":11,"off_topic":1,"camera_used":false,
 "turns":[{"s":"robot","t":"Let's add 47 and 38...","at":1763887510},
          {"s":"child","t":"fifteen","at":1763887530,"off":false},
          {"s":"child","t":"can we play cricket game","at":1763887600,"off":true}],
 "events":[{"type":"break_prompt","at":1763888800}],
 "scans":[{"photo_id":"<uuid or empty>","at":1763888900,
           "result":{"summary":"I checked 4 sums. 3 are correct and 1 needs another look.",
                     "right":3,"total":4,"confidence":0.92,
                     "items":[{"q":"47 + 38","child_answer":"85","correct_answer":"85","correct":true,"confidence":0.97,"tip":""},
                              {"q":"72 - 45","child_answer":"37","correct_answer":"27","correct":false,"confidence":0.58,
                               "tip":"Check the ones column: can you take 5 away from 2 without borrowing?",
                               "reason":"The 3 could be a 2"}]}}]}
```

Behaviour:
- Insert the session, its turns and its events.
- For every scan item, insert a `grades` row:
  - `status = 'needs_review'` when the item's `confidence < 0.8`; otherwise `'auto'`.
  - `marks_total = 1`, `marks_awarded = correct ? 1 : 0` (null while it needs review).
  - Store the item JSON in `raw` and link `photo_path` from `photo_id`.
- Set `sessions.score_right` / `score_total` from the scans (or exam) and set `camera_used`.

**Accept missing fields.** Older firmware may send fewer keys: default numbers to 0, strings to "" and arrays to [].

Response: `{"session_id":"<uuid>","needs_review":1}`

### 6.5 Security

- Rate-limit `register` to 10 per hour per IP.
- Rate-limit other device routes to 120 per minute per device.
- Validate every body with zod.
- Cap `turns` at 200 per session and `text` at 1000 chars.
- Never return another family's data.
- Pairing (`POST /api/pair` from the parent app) takes `{code, child_id}`. It requires the parent to own the child and allows 5 tries per 10 minutes per user. On success it sets `devices.family_id/child_id` and clears the code.

## 7. Server-side logic

- **Mastery** per chapter = correct graded answers ÷ graded answers. Grades still in review are excluded.
- **Weak-spot insight:**
  - Find the chapter with the lowest mastery that has at least 4 graded answers.
  - Write one plain sentence from the wrong items' `tip`/`reason` (rule-based summary; leave an `insights.ts` hook to swap in an LLM later).
  - Example: "Subtraction with borrowing is the weak spot — 3 of 5 wrong answers were a borrowing slip."
- **Online status:** `last_seen` within 3 minutes.
- **Settings acked:** compare `settings_version` from sync with `child_settings.version`.
- **Realtime:** use Supabase Realtime on `sessions`, `grades` and `devices` so Today and Review update live.

## 8. Privacy & child-safety requirements (show them in the UI too)

- The robot never streams video. Photos only come from Scan & Check / Exam, only when `camera_exam` is on, and the robot shows a light while the camera is on. Say this on the Controls screen.
- Photos are deleted after 30 days, or right after grading when Keep answer photos is off.
- Transcripts can be deleted by the parent. Deleting a child deletes all their data (cascade).
- **No child accounts, no ads, no third-party analytics.**
- **Children's data law:** follow India's DPDP Act. Show a consent checkbox at sign-up: "I am the parent or guardian".

## 9. Deliverables & definition of done

1. A runnable repo:
   - `pnpm i && pnpm dev` works against a local or hosted Supabase.
   - `README.md` with setup, migrations, seed and Vercel deploy steps.
2. All screens above, populated from the seed data, responsive at 375px and 1440px.
3. The device API exactly as in section 6, plus `scripts/fake-robot.ts`. This script registers, prints the pairing code, syncs every 10 s, and uploads one sample session with a scan. Use it to prove the end-to-end flow:
   - pair from the UI
   - see the session on Today
   - resolve the grade in Review
   - send a `say` command and see `ack_cmd` mark it done
4. Tests:
   - Vitest for the device API handlers (register, sync with/without pairing, session with a low-confidence scan → `needs_review`).
   - Playwright smoke test for pairing + review.
5. No secrets in the repo.

Work in this order: schema + seed → device API + fake robot → auth + onboarding/pairing → Today → Review → Controls → Progress → desktop dashboard → PDF report → tests → README. Show me the plan first, then build.
