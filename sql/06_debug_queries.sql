-- =====================================================
-- EDUCATIONAL PLATFORM - DEBUG QUERIES
-- =====================================================
-- Purpose: Debugging queries for student dashboard and general troubleshooting
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- =====================================================
-- STUDENT DASHBOARD DEBUGGING
-- =====================================================

-- Query 1: Get student's joined sessions (for student dashboard)
-- Usage: Replace 101 with actual student ID
SELECT 
    s.id as session_id,
    s.session_id as join_code,
    s.title,
    s.course_name,
    s.description,
    s.is_active,
    u.full_name as teacher_name,
    sp.joined_at,
    sp.is_active as participation_active,
    -- Count of polls in this session
    (SELECT COUNT(*) FROM polls WHERE session_id = s.id) as total_polls,
    -- Count of active polls
    (SELECT COUNT(*) FROM polls WHERE session_id = s.id AND is_active = true) as active_polls,
    -- Student's response count for this session
    (SELECT COUNT(*) FROM poll_responses pr 
     JOIN polls p ON pr.poll_id = p.id 
     WHERE p.session_id = s.id AND pr.student_id = sp.student_id) as student_responses
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
JOIN users u ON s.teacher_id = u.id
WHERE sp.student_id = 101 -- Replace with actual student ID
  AND sp.is_active = true
ORDER BY sp.joined_at DESC;

-- Query 2: Get student's recent activity (for activity feed)
-- Usage: Replace 101 with actual student ID
SELECT 
    'poll_answered' as activity_type,
    CONCAT('Answered poll in ', s.title) as title,
    pr.responded_at as activity_time,
    CASE WHEN pr.is_correct THEN 'Correct' ELSE 'Incorrect' END as result,
    s.session_id as related_session,
    p.question as poll_question,
    pr.response_time as time_taken
FROM poll_responses pr
JOIN polls p ON pr.poll_id = p.id
JOIN sessions s ON p.session_id = s.id
WHERE pr.student_id = 101 -- Replace with actual student ID

UNION ALL

SELECT 
    'session_joined' as activity_type,
    CONCAT('Joined ', s.title, ' session') as title,
    sp.joined_at as activity_time,
    NULL as result,
    s.session_id as related_session,
    NULL as poll_question,
    NULL as time_taken
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
WHERE sp.student_id = 101 -- Replace with actual student ID

ORDER BY activity_time DESC
LIMIT 20;

-- Query 3: Get student statistics (for dashboard stats)
-- Usage: Replace 101 with actual student ID
WITH student_stats AS (
    SELECT 
        -- Sessions joined
        (SELECT COUNT(*) FROM session_participants WHERE student_id = 101 AND is_active = true) as sessions_joined,
        
        -- Total polls answered
        (SELECT COUNT(*) FROM poll_responses WHERE student_id = 101) as polls_answered,
        
        -- Correct answers
        (SELECT COUNT(*) FROM poll_responses WHERE student_id = 101 AND is_correct = true) as correct_answers,
        
        -- Active sessions (sessions student is in that are currently active)
        (SELECT COUNT(*) 
         FROM session_participants sp 
         JOIN sessions s ON sp.session_id = s.id 
         WHERE sp.student_id = 101 AND sp.is_active = true AND s.is_active = true) as active_sessions
)
SELECT 
    sessions_joined,
    polls_answered,
    correct_answers,
    active_sessions,
    CASE 
        WHEN polls_answered > 0 THEN ROUND((correct_answers::DECIMAL / polls_answered) * 100, 1)
        ELSE 0 
    END as average_score
FROM student_stats;

-- Query 4: Get active polls for a student's sessions
-- Usage: Replace 101 with actual student ID
SELECT 
    p.id as poll_id,
    p.question,
    p.options,
    p.time_limit,
    p.created_at,
    p.activated_at,
    s.session_id,
    s.title as session_title,
    -- Check if student has already responded
    CASE WHEN pr.id IS NOT NULL THEN true ELSE false END as already_responded,
    pr.selected_option,
    pr.is_correct,
    pr.responded_at
FROM polls p
JOIN sessions s ON p.session_id = s.id
JOIN session_participants sp ON s.id = sp.session_id
LEFT JOIN poll_responses pr ON p.id = pr.poll_id AND pr.student_id = sp.student_id
WHERE sp.student_id = 101 -- Replace with actual student ID
  AND sp.is_active = true
  AND p.is_active = true
ORDER BY p.activated_at DESC;

-- =====================================================
-- GENERAL DEBUGGING QUERIES
-- =====================================================

-- Query 5: Check database connectivity and basic counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'session_participants', COUNT(*) FROM session_participants
UNION ALL
SELECT 'polls', COUNT(*) FROM polls
UNION ALL
SELECT 'poll_responses', COUNT(*) FROM poll_responses
UNION ALL
SELECT 'generated_mcqs', COUNT(*) FROM generated_mcqs
ORDER BY table_name;

-- Query 6: Active sessions overview
SELECT 
    s.session_id,
    s.title,
    s.course_name,
    u.full_name as teacher,
    s.created_at,
    COUNT(sp.student_id) as participant_count,
    COUNT(p.id) as poll_count,
    COUNT(CASE WHEN p.is_active THEN 1 END) as active_poll_count
FROM sessions s
JOIN users u ON s.teacher_id = u.id
LEFT JOIN session_participants sp ON s.id = sp.session_id AND sp.is_active = true
LEFT JOIN polls p ON s.id = p.session_id
WHERE s.is_active = true
GROUP BY s.id, s.session_id, s.title, s.course_name, u.full_name, s.created_at
ORDER BY s.created_at DESC;

-- Query 7: Student participation overview
SELECT 
    u.full_name,
    u.register_number,
    u.department,
    COUNT(DISTINCT sp.session_id) as sessions_joined,
    COUNT(pr.id) as total_responses,
    COUNT(CASE WHEN pr.is_correct THEN 1 END) as correct_responses,
    CASE 
        WHEN COUNT(pr.id) > 0 THEN ROUND((COUNT(CASE WHEN pr.is_correct THEN 1 END)::DECIMAL / COUNT(pr.id)) * 100, 1)
        ELSE 0 
    END as accuracy_percentage,
    MAX(pr.responded_at) as last_activity
FROM users u
LEFT JOIN session_participants sp ON u.id = sp.student_id AND sp.is_active = true
LEFT JOIN poll_responses pr ON u.id = pr.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.register_number, u.department
ORDER BY sessions_joined DESC, total_responses DESC;

-- Query 8: Poll performance analysis
SELECT 
    p.id as poll_id,
    s.session_id,
    s.title as session_title,
    p.question,
    p.correct_answer,
    COUNT(pr.id) as total_responses,
    COUNT(CASE WHEN pr.is_correct THEN 1 END) as correct_responses,
    CASE 
        WHEN COUNT(pr.id) > 0 THEN ROUND((COUNT(CASE WHEN pr.is_correct THEN 1 END)::DECIMAL / COUNT(pr.id)) * 100, 1)
        ELSE 0 
    END as accuracy_percentage,
    ROUND(AVG(pr.response_time), 1) as avg_response_time,
    p.created_at,
    p.is_active
FROM polls p
JOIN sessions s ON p.session_id = s.id
LEFT JOIN poll_responses pr ON p.id = pr.poll_id
GROUP BY p.id, s.session_id, s.title, p.question, p.correct_answer, p.created_at, p.is_active
ORDER BY p.created_at DESC;

-- =====================================================
-- TROUBLESHOOTING QUERIES
-- =====================================================

-- Query 9: Find orphaned records
SELECT 'Orphaned session_participants' as issue, COUNT(*) as count
FROM session_participants sp
LEFT JOIN sessions s ON sp.session_id = s.id
LEFT JOIN users u ON sp.student_id = u.id
WHERE s.id IS NULL OR u.id IS NULL

UNION ALL

SELECT 'Orphaned polls', COUNT(*)
FROM polls p
LEFT JOIN sessions s ON p.session_id = s.id
WHERE s.id IS NULL

UNION ALL

SELECT 'Orphaned poll_responses', COUNT(*)
FROM poll_responses pr
LEFT JOIN polls p ON pr.poll_id = p.id
LEFT JOIN users u ON pr.student_id = u.id
WHERE p.id IS NULL OR u.id IS NULL;

-- Query 10: Check for data inconsistencies
SELECT 
    'Sessions without teachers' as issue,
    COUNT(*) as count
FROM sessions s
LEFT JOIN users u ON s.teacher_id = u.id
WHERE u.id IS NULL OR u.role != 'teacher'

UNION ALL

SELECT 
    'Active polls in inactive sessions',
    COUNT(*)
FROM polls p
JOIN sessions s ON p.session_id = s.id
WHERE p.is_active = true AND s.is_active = false

UNION ALL

SELECT 
    'Poll responses with invalid options',
    COUNT(*)
FROM poll_responses pr
JOIN polls p ON pr.poll_id = p.id
WHERE pr.selected_option >= jsonb_array_length(p.options) OR pr.selected_option < 0;

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- Query 11: Recent activity timeline
SELECT 
    'User Registration' as event_type,
    full_name as details,
    created_at as event_time
FROM users
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Session Created',
    CONCAT(title, ' (', session_id, ')'),
    created_at
FROM sessions
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Student Joined Session',
    CONCAT(u.full_name, ' joined ', s.title),
    sp.joined_at
FROM session_participants sp
JOIN users u ON sp.student_id = u.id
JOIN sessions s ON sp.session_id = s.id
WHERE sp.joined_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Poll Response',
    CONCAT(u.full_name, ' answered poll'),
    pr.responded_at
FROM poll_responses pr
JOIN users u ON pr.student_id = u.id
WHERE pr.responded_at > NOW() - INTERVAL '24 hours'

ORDER BY event_time DESC
LIMIT 50;

-- Query 12: System health check
SELECT 
    'Database Connection' as check_name,
    'OK' as status,
    NOW() as checked_at

UNION ALL

SELECT 
    'Active Sessions',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'No Active Sessions' END,
    NOW()
FROM sessions WHERE is_active = true

UNION ALL

SELECT 
    'Recent Activity',
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'No Recent Activity' END,
    NOW()
FROM poll_responses WHERE responded_at > NOW() - INTERVAL '1 hour';

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
HOW TO USE THESE QUERIES:

1. STUDENT DASHBOARD QUERIES (1-4):
   - Replace student ID (101) with actual student ID
   - Use these in your API endpoints to fetch real data

2. GENERAL DEBUGGING (5-8):
   - Run these to understand overall system state
   - Good for admin dashboards and monitoring

3. TROUBLESHOOTING (9-10):
   - Run when you suspect data issues
   - Should return 0 for all counts in healthy system

4. PERFORMANCE MONITORING (11-12):
   - Use for system health checks
   - Monitor recent activity and system status

EXAMPLE API ENDPOINT USAGE:
- GET /api/students/:studentId/sessions → Use Query 1
- GET /api/students/:studentId/activity → Use Query 2  
- GET /api/students/:studentId/stats → Use Query 3
- GET /api/students/:studentId/active-polls → Use Query 4
*/

