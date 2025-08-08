-- =====================================================
-- EDUCATIONAL PLATFORM - TEST SCENARIOS
-- =====================================================
-- Purpose: Create specific test scenarios for different use cases
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- =====================================================
-- SCENARIO 1: NEW STUDENT WITH NO ACTIVITY
-- =====================================================

-- Create a new student with no session participation
INSERT INTO users (email, password_hash, full_name, role, register_number, department) VALUES
('newbie.student@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Alex Newbie', 'student', 'CS2024001', 'Computer Science')
ON CONFLICT (email) DO NOTHING;

-- Verify new student has no activity
SELECT 
    'New Student Test' as scenario,
    u.full_name,
    COUNT(sp.id) as sessions_joined,
    COUNT(pr.id) as polls_answered
FROM users u
LEFT JOIN session_participants sp ON u.id = sp.student_id
LEFT JOIN poll_responses pr ON u.id = pr.student_id
WHERE u.email = 'newbie.student@student.edu'
GROUP BY u.id, u.full_name;

-- =====================================================
-- SCENARIO 2: HIGHLY ACTIVE STUDENT
-- =====================================================

-- Make Alice Smith a highly active student
-- Add her to more sessions
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '2 hours'),
((SELECT id FROM sessions WHERE session_id = 'PHY201'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '1 hour'),
((SELECT id FROM sessions WHERE session_id = 'BIO101'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '30 minutes')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Add more poll responses for Alice
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
-- Math poll
((SELECT id FROM polls WHERE question LIKE '%derivative of x²%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 1, true, 18, NOW() - INTERVAL '1 hour 30 minutes'),
-- Physics poll
((SELECT id FROM polls WHERE question LIKE '%unit of electric field%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 2, true, 22, NOW() - INTERVAL '45 minutes'),
-- Biology poll
((SELECT id FROM polls WHERE question LIKE '%powerhouse of the cell%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 1, true, 12, NOW() - INTERVAL '20 minutes')
ON CONFLICT (poll_id, student_id) DO NOTHING;

-- Verify Alice's high activity
SELECT 
    'Highly Active Student Test' as scenario,
    u.full_name,
    COUNT(DISTINCT sp.session_id) as sessions_joined,
    COUNT(pr.id) as polls_answered,
    COUNT(CASE WHEN pr.is_correct THEN 1 END) as correct_answers,
    ROUND(AVG(pr.response_time), 1) as avg_response_time
FROM users u
LEFT JOIN session_participants sp ON u.id = sp.student_id AND sp.is_active = true
LEFT JOIN poll_responses pr ON u.id = pr.student_id
WHERE u.email = 'alice.smith@student.edu'
GROUP BY u.id, u.full_name;

-- =====================================================
-- SCENARIO 3: STUDENT WITH POOR PERFORMANCE
-- =====================================================

-- Create a student with mostly incorrect answers
INSERT INTO users (email, password_hash, full_name, role, register_number, department) VALUES
('struggling.student@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Sam Struggling', 'student', 'CS2023002', 'Computer Science')
ON CONFLICT (email) DO NOTHING;

-- Add struggling student to a session
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'struggling.student@student.edu'), NOW() - INTERVAL '1 hour')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Add mostly incorrect responses
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
-- Wrong answer to Python function question (correct is 0, choosing 1)
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'struggling.student@student.edu'), 
 1, false, 45, NOW() - INTERVAL '50 minutes'),
-- Wrong answer to data type question (correct is 2, choosing 0)
((SELECT id FROM polls WHERE question LIKE '%data type%store text%'), 
 (SELECT id FROM users WHERE email = 'struggling.student@student.edu'), 
 0, false, 55, NOW() - INTERVAL '40 minutes')
ON CONFLICT (poll_id, student_id) DO NOTHING;

-- Verify struggling student performance
SELECT 
    'Poor Performance Student Test' as scenario,
    u.full_name,
    COUNT(pr.id) as polls_answered,
    COUNT(CASE WHEN pr.is_correct THEN 1 END) as correct_answers,
    ROUND((COUNT(CASE WHEN pr.is_correct THEN 1 END)::DECIMAL / NULLIF(COUNT(pr.id), 0)) * 100, 1) as accuracy_percentage,
    ROUND(AVG(pr.response_time), 1) as avg_response_time
FROM users u
LEFT JOIN poll_responses pr ON u.id = pr.student_id
WHERE u.email = 'struggling.student@student.edu'
GROUP BY u.id, u.full_name;

-- =====================================================
-- SCENARIO 4: SESSION WITH NO PARTICIPANTS
-- =====================================================

-- Create a session with no students
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('EMPTY01', 1, 'Empty Session Test', 'Session with no participants for testing', 'Test Course', true, NOW() - INTERVAL '10 minutes');

-- Verify empty session
SELECT 
    'Empty Session Test' as scenario,
    s.session_id,
    s.title,
    COUNT(sp.student_id) as participant_count,
    COUNT(p.id) as poll_count
FROM sessions s
LEFT JOIN session_participants sp ON s.id = sp.session_id
LEFT JOIN polls p ON s.id = p.session_id
WHERE s.session_id = 'EMPTY01'
GROUP BY s.id, s.session_id, s.title;

-- =====================================================
-- SCENARIO 5: SESSION WITH ACTIVE POLL
-- =====================================================

-- Create a session with an active poll for real-time testing
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('LIVE01', 1, 'Live Poll Session', 'Session with active poll for real-time testing', 'Live Test Course', true, NOW() - INTERVAL '5 minutes')
ON CONFLICT (session_id) DO NOTHING;

-- Add some students to this session
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'LIVE01'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '4 minutes'),
((SELECT id FROM sessions WHERE session_id = 'LIVE01'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '3 minutes'),
((SELECT id FROM sessions WHERE session_id = 'LIVE01'), (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), NOW() - INTERVAL '2 minutes')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Create an active poll
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at, activated_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'LIVE01'), 
 'What is 2 + 2?', 
 '["3", "4", "5", "6"]', 
 1, 
 'Basic arithmetic: 2 + 2 = 4',
 60, 
 true, 
 NOW() - INTERVAL '2 minutes',
 NOW() - INTERVAL '2 minutes');

-- Add some responses to the active poll
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question = 'What is 2 + 2?' AND session_id = (SELECT id FROM sessions WHERE session_id = 'LIVE01')), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 1, true, 8, NOW() - INTERVAL '1 minute'),
((SELECT id FROM polls WHERE question = 'What is 2 + 2?' AND session_id = (SELECT id FROM sessions WHERE session_id = 'LIVE01')), 
 (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), 
 1, true, 12, NOW() - INTERVAL '30 seconds')
ON CONFLICT (poll_id, student_id) DO NOTHING;

-- Verify live session
SELECT 
    'Live Poll Session Test' as scenario,
    s.session_id,
    s.title,
    COUNT(DISTINCT sp.student_id) as participants,
    COUNT(DISTINCT p.id) as total_polls,
    COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_polls,
    COUNT(pr.id) as poll_responses
FROM sessions s
LEFT JOIN session_participants sp ON s.id = sp.session_id
LEFT JOIN polls p ON s.id = p.session_id
LEFT JOIN poll_responses pr ON p.id = pr.poll_id
WHERE s.session_id = 'LIVE01'
GROUP BY s.id, s.session_id, s.title;

-- =====================================================
-- SCENARIO 6: MULTIPLE SESSIONS FOR ONE STUDENT
-- =====================================================

-- Test student dashboard with multiple active sessions
-- Bob Wilson joins multiple sessions
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '3 hours'),
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '2 hours'),
((SELECT id FROM sessions WHERE session_id = 'LIVE01'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '1 hour')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- Verify Bob's multiple sessions
SELECT 
    'Multiple Sessions Test' as scenario,
    u.full_name,
    s.session_id,
    s.title,
    s.is_active as session_active,
    sp.joined_at,
    COUNT(p.id) as polls_in_session,
    COUNT(pr.id) as student_responses_in_session
FROM users u
JOIN session_participants sp ON u.id = sp.student_id
JOIN sessions s ON sp.session_id = s.id
LEFT JOIN polls p ON s.id = p.session_id
LEFT JOIN poll_responses pr ON p.id = pr.poll_id AND pr.student_id = u.id
WHERE u.email = 'bob.wilson@student.edu'
GROUP BY u.id, u.full_name, s.id, s.session_id, s.title, s.is_active, sp.joined_at
ORDER BY sp.joined_at DESC;

-- =====================================================
-- SCENARIO 7: EDGE CASE - INVALID DATA
-- =====================================================

-- Test handling of edge cases (these should be caught by constraints)
-- Uncomment to test error handling

/*
-- Try to create session with non-existent teacher (should fail)
INSERT INTO sessions (session_id, teacher_id, title, course_name, is_active) VALUES
('INVALID1', 99999, 'Invalid Session', 'Test Course', true);

-- Try to add student to non-existent session (should fail)
INSERT INTO session_participants (session_id, student_id) VALUES
(99999, (SELECT id FROM users WHERE email = 'alice.smith@student.edu'));

-- Try to create poll response with invalid option (should be caught by application logic)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct) VALUES
((SELECT id FROM polls LIMIT 1), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 99, false);
*/

-- =====================================================
-- VERIFICATION SUMMARY
-- =====================================================

-- Summary of all test scenarios
SELECT 
    'Test Scenarios Summary' as report_type,
    COUNT(CASE WHEN u.email = 'newbie.student@student.edu' THEN 1 END) as new_students,
    COUNT(CASE WHEN u.email = 'struggling.student@student.edu' THEN 1 END) as struggling_students,
    COUNT(CASE WHEN s.session_id = 'EMPTY01' THEN 1 END) as empty_sessions,
    COUNT(CASE WHEN s.session_id = 'LIVE01' THEN 1 END) as live_sessions,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_polls
FROM users u
FULL OUTER JOIN sessions s ON true
FULL OUTER JOIN polls p ON true
WHERE u.role = 'student' OR u.role IS NULL;

-- Test data for student dashboard API endpoints
SELECT 
    'API Test Data Ready' as status,
    'Use student IDs: ' || STRING_AGG(DISTINCT u.id::TEXT, ', ') as student_ids_for_testing
FROM users u
WHERE u.email IN ('alice.smith@student.edu', 'bob.wilson@student.edu', 'newbie.student@student.edu', 'struggling.student@student.edu');

-- =====================================================
-- CLEANUP INSTRUCTIONS
-- =====================================================

/*
TO CLEAN UP TEST DATA:

-- Remove test users
DELETE FROM users WHERE email IN ('newbie.student@student.edu', 'struggling.student@student.edu');

-- Remove test sessions
DELETE FROM sessions WHERE session_id IN ('EMPTY01', 'LIVE01');

-- Or run 05_reset_database.sql to clean everything
*/

