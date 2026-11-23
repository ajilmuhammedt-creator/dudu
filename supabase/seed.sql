-- seed.sql
-- Demo family seed for EduBuddy Parent matching the UI/UX specifications

DO $$
DECLARE
    f_id UUID := '11111111-1111-1111-1111-111111111111';
    c_id UUID := '22222222-2222-2222-2222-222222222222';
    d_id UUID := '33333333-3333-3333-3333-333333333333';
    s1_id UUID := '44444444-4444-4444-4444-444444444441';
    s2_id UUID := '44444444-4444-4444-4444-444444444442';
    s3_id UUID := '44444444-4444-4444-4444-444444444443';
    s4_id UUID := '44444444-4444-4444-4444-444444444444';
    s5_id UUID := '44444444-4444-4444-4444-444444444445';
    s6_id UUID := '44444444-4444-4444-4444-444444444446';
    s7_id UUID := '44444444-4444-4444-4444-444444444447';
    g_review_id UUID := '55555555-5555-5555-5555-555555555555';
    demo_user_id UUID;
    v_token_hash TEXT := encode(digest('demo_device_token_secret_32bytes_hex', 'sha256'), 'hex');
BEGIN
    -- 1. Create or reference family
    INSERT INTO public.families (id, name, created_at)
    VALUES (f_id, 'Sharma Family', now() - INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- Attach current first auth user if exists
    SELECT id INTO demo_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF demo_user_id IS NOT NULL THEN
        INSERT INTO public.family_members (family_id, user_id, role)
        VALUES (f_id, demo_user_id, 'parent')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 2. Create Child Arjun
    INSERT INTO public.children (id, family_id, name, cbse_class, avatar, archived, created_at)
    VALUES (c_id, f_id, 'Arjun', 3, '👦', false, now() - INTERVAL '30 days')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, cbse_class = EXCLUDED.cbse_class;

    -- 3. Child Settings
    INSERT INTO public.child_settings (
        child_id, subjects, stay_on_syllabus, camera_exam, break_prompts, keep_photos,
        daily_limit_min, window_start, window_end, language, wake_sensitivity, version, updated_at
    ) VALUES (
        c_id, ARRAY['Mathematics', 'EVS'], true, true, true, false,
        60, '16:30'::TIME, '19:30'::TIME, 'en', 4, 3, now()
    ) ON CONFLICT (child_id) DO UPDATE SET
        subjects = EXCLUDED.subjects,
        daily_limit_min = EXCLUDED.daily_limit_min;

    -- 4. Device (DuDu ESP32-S3 with IP 192.168.1.107)
    INSERT INTO public.devices (
        id, device_uid, token_hash, family_id, child_id, name, firmware,
        pairing_code, pairing_code_expires, last_seen, rssi, ip, settings_version_acked, created_at
    ) VALUES (
        d_id, 'EB-QAI96T', v_token_hash, f_id, c_id, 'Study Room', '1.0',
        '483921', now() + INTERVAL '30 minutes', now() - INTERVAL '45 seconds', -58, '192.168.1.107', 3, now() - INTERVAL '30 days'
    ) ON CONFLICT (id) DO UPDATE SET
        ip = EXCLUDED.ip,
        last_seen = EXCLUDED.last_seen;

    -- 5. Sessions
    -- Today Session 1: Learn - Give and Take
    INSERT INTO public.sessions (
        id, device_id, child_id, mode, subject, chapter, started_at, ended_at,
        minutes, questions, answered_right, off_topic, camera_used, score_right, score_total, created_at
    ) VALUES (
        s1_id, d_id, c_id, 'learn', 'Mathematics', 'Give and Take (Ch 12)',
        (CURRENT_DATE + TIME '17:05:00')::TIMESTAMPTZ, (CURRENT_DATE + TIME '17:31:00')::TIMESTAMPTZ,
        26, 14, 11, 1, false, NULL, NULL, (CURRENT_DATE + TIME '17:31:00')::TIMESTAMPTZ
    ) ON CONFLICT (id) DO NOTHING;

    -- Today Session 2: Exam - Give and Take (written on paper)
    INSERT INTO public.sessions (
        id, device_id, child_id, mode, subject, chapter, started_at, ended_at,
        minutes, questions, answered_right, off_topic, camera_used, score_right, score_total, created_at
    ) VALUES (
        s2_id, d_id, c_id, 'exam', 'Mathematics', 'Give and Take (Ch 12)',
        (CURRENT_DATE + TIME '17:32:00')::TIMESTAMPTZ, (CURRENT_DATE + TIME '17:48:00')::TIMESTAMPTZ,
        16, 8, 7, 0, true, 7, 8, (CURRENT_DATE + TIME '17:48:00')::TIMESTAMPTZ
    ) ON CONFLICT (id) DO NOTHING;

    -- Past Days Sessions this week (for 3h 10m total study time, 6 exams avg 82%)
    INSERT INTO public.sessions (id, device_id, child_id, mode, subject, chapter, started_at, ended_at, minutes, questions, answered_right, off_topic, camera_used, score_right, score_total)
    VALUES
    (s3_id, d_id, c_id, 'exam', 'Mathematics', 'Fun at Class Party! (Ch 10)', now() - INTERVAL '2 days', now() - INTERVAL '2 days' + INTERVAL '25 minutes', 25, 10, 10, 0, false, 10, 10),
    (s4_id, d_id, c_id, 'exam', 'Mathematics', 'House of Hundreds – II (Ch 9)', now() - INTERVAL '3 days', now() - INTERVAL '3 days' + INTERVAL '30 minutes', 30, 12, 11, 0, true, 11, 12),
    (s5_id, d_id, c_id, 'learn', 'EVS', 'Water O Water', now() - INTERVAL '4 days', now() - INTERVAL '4 days' + INTERVAL '25 minutes', 25, 8, 7, 1, false, NULL, NULL),
    (s6_id, d_id, c_id, 'exam', 'Mathematics', 'Filling and Lifting (Ch 11)', now() - INTERVAL '5 days', now() - INTERVAL '5 days' + INTERVAL '35 minutes', 35, 10, 8, 0, true, 8, 10),
    (s7_id, d_id, c_id, 'exam', 'Mathematics', 'Give and Take: subtraction', now() - INTERVAL '6 days', now() - INTERVAL '6 days' + INTERVAL '33 minutes', 33, 9, 5, 0, true, 5, 9)
    ON CONFLICT (id) DO NOTHING;

    -- 6. Turns for Today's Learn Session
    INSERT INTO public.turns (session_id, idx, speaker, text, off_topic, correct, at) VALUES
    (s1_id, 1, 'robot', 'Let''s learn about two-digit addition with carrying. I''ll ask you a few questions. Ready?', false, NULL, (CURRENT_DATE + TIME '17:05:10')::TIMESTAMPTZ),
    (s1_id, 2, 'child', 'yes', false, NULL, (CURRENT_DATE + TIME '17:05:25')::TIMESTAMPTZ),
    (s1_id, 3, 'robot', 'Great. Let''s add 47 and 38. We start with the ones. What is 7 plus 8?', false, NULL, (CURRENT_DATE + TIME '17:05:30')::TIMESTAMPTZ),
    (s1_id, 4, 'child', 'fifteen', false, true, (CURRENT_DATE + TIME '17:05:50')::TIMESTAMPTZ),
    (s1_id, 5, 'robot', 'Yes, 15! So we write 5 and carry 1 to the tens. Now, what is 4 plus 3 plus the carried 1?', false, NULL, (CURRENT_DATE + TIME '17:06:05')::TIMESTAMPTZ),
    (s1_id, 6, 'child', 'can we play cricket game', true, NULL, (CURRENT_DATE + TIME '17:06:40')::TIMESTAMPTZ),
    (s1_id, 7, 'robot', 'I can only help with your school subjects right now. Shall we finish this sum first? What is 4 plus 3 plus 1?', false, NULL, (CURRENT_DATE + TIME '17:06:50')::TIMESTAMPTZ),
    (s1_id, 8, 'child', 'eight', false, true, (CURRENT_DATE + TIME '17:07:05')::TIMESTAMPTZ),
    (s1_id, 9, 'robot', 'Spot on! So 47 plus 38 gives us 85. Excellent work, Arjun!', false, NULL, (CURRENT_DATE + TIME '17:07:15')::TIMESTAMPTZ)
    ON CONFLICT DO NOTHING;

    -- 7. Events (Sleepy break prompt)
    INSERT INTO public.events (device_id, child_id, type, at, data)
    VALUES
    (d_id, c_id, 'break_prompt', (CURRENT_DATE + TIME '17:40:00')::TIMESTAMPTZ, '{"reason": "stillness", "prompt": "Feeling sleepy?"}'::JSONB)
    ON CONFLICT DO NOTHING;

    -- 8. Grade needing parent review
    INSERT INTO public.grades (
        id, session_id, child_id, q_no, question, child_answer, correct_answer,
        marks_total, marks_awarded, confidence, reason, status, photo_path, raw, created_at
    ) VALUES (
        g_review_id, s2_id, c_id, 3,
        'Ravi has 36 marbles and his sister gives him 27 more. How many marbles does Ravi have now?',
        '63', '63', 2, NULL, 0.58,
        'The 6 could be a 0', 'needs_review',
        'answer-photos/demo-q3-work.jpg',
        '{"q": "36 + 27", "child_answer": "63", "correct_answer": "63", "confidence": 0.58, "marks": 2}'::JSONB,
        (CURRENT_DATE + TIME '17:41:00')::TIMESTAMPTZ
    ) ON CONFLICT (id) DO UPDATE SET
        confidence = EXCLUDED.confidence,
        status = EXCLUDED.status;

    -- Auto-graded items for chapter mastery calculations
    INSERT INTO public.grades (session_id, child_id, q_no, question, child_answer, correct_answer, marks_total, marks_awarded, confidence, reason, status)
    VALUES
    (s2_id, c_id, 1, '47 + 38', '85', '85', 1, 1, 0.97, 'Clear handwriting', 'auto'),
    (s2_id, c_id, 2, '56 + 29', '85', '85', 1, 1, 0.95, 'Clear handwriting', 'auto'),
    (s2_id, c_id, 4, '4 x 7', '28', '28', 1, 1, 0.99, 'Clear handwriting', 'auto'),
    (s7_id, c_id, 1, '72 - 45', '37', '27', 1, 0, 0.58, 'Check borrowing in tens', 'auto'),
    (s7_id, c_id, 2, '63 - 28', '45', '35', 1, 0, 0.90, 'Borrowing slip', 'auto'),
    (s7_id, c_id, 3, '81 - 47', '34', '34', 1, 1, 0.92, 'Correct subtraction', 'auto')
    ON CONFLICT DO NOTHING;

END $$;
