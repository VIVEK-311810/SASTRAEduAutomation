-- =====================================================
-- EDUCATIONAL PLATFORM - DATABASE RESET
-- =====================================================
-- Purpose: Complete database reset and cleanup for fresh start
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- WARNING: This script will DELETE ALL DATA in the database
-- Use with caution - this action cannot be undone

-- =====================================================
-- CONFIRMATION PROMPT
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: DATABASE RESET INITIATED';
    RAISE NOTICE '⚠️  This will DELETE ALL DATA in the educational platform database';
    RAISE NOTICE '⚠️  Make sure you have backups if needed';
    RAISE NOTICE '';
    RAISE NOTICE 'Starting database reset in 3 seconds...';
    PERFORM pg_sleep(1);
    RAISE NOTICE '2...';
    PERFORM pg_sleep(1);
    RAISE NOTICE '1...';
    PERFORM pg_sleep(1);
    RAISE NOTICE 'Proceeding with reset...';
END $$;

-- =====================================================
-- STEP 1: DELETE ALL DATA (PRESERVE STRUCTURE)
-- =====================================================

-- Delete data in correct order to handle foreign key constraints
DELETE FROM poll_responses;
DELETE FROM generated_mcqs;
DELETE FROM polls;
DELETE FROM session_participants;
DELETE FROM sessions;
DELETE FROM users;

-- Reset sequences to start from 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE session_participants_id_seq RESTART WITH 1;
ALTER SEQUENCE polls_id_seq RESTART WITH 1;
ALTER SEQUENCE poll_responses_id_seq RESTART WITH 1;
ALTER SEQUENCE generated_mcqs_id_seq RESTART WITH 1;

-- =====================================================
-- STEP 2: VERIFY CLEANUP
-- =====================================================

DO $$
DECLARE
    users_count INTEGER;
    sessions_count INTEGER;
    participants_count INTEGER;
    polls_count INTEGER;
    responses_count INTEGER;
    mcqs_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO sessions_count FROM sessions;
    SELECT COUNT(*) INTO participants_count FROM session_participants;
    SELECT COUNT(*) INTO polls_count FROM polls;
    SELECT COUNT(*) INTO responses_count FROM poll_responses;
    SELECT COUNT(*) INTO mcqs_count FROM generated_mcqs;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ DATA CLEANUP VERIFICATION:';
    RAISE NOTICE 'Users: % (should be 0)', users_count;
    RAISE NOTICE 'Sessions: % (should be 0)', sessions_count;
    RAISE NOTICE 'Session Participants: % (should be 0)', participants_count;
    RAISE NOTICE 'Polls: % (should be 0)', polls_count;
    RAISE NOTICE 'Poll Responses: % (should be 0)', responses_count;
    RAISE NOTICE 'Generated MCQs: % (should be 0)', mcqs_count;
    
    IF users_count = 0 AND sessions_count = 0 AND participants_count = 0 AND 
       polls_count = 0 AND responses_count = 0 AND mcqs_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ SUCCESS: All data has been cleared successfully!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ WARNING: Some data may not have been cleared properly!';
    END IF;
END $$;

-- =====================================================
-- STEP 3: OPTIONAL - DROP AND RECREATE TABLES
-- =====================================================
-- Uncomment the following section if you want to completely recreate the schema

/*
-- Drop all tables
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS generated_mcqs CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop views
DROP VIEW IF EXISTS active_sessions_with_participants CASCADE;
DROP VIEW IF EXISTS student_session_details CASCADE;
DROP VIEW IF EXISTS poll_statistics CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_session_id() CASCADE;
DROP FUNCTION IF EXISTS set_session_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

RAISE NOTICE '';
RAISE NOTICE '✅ COMPLETE SCHEMA RESET: All tables, views, and functions dropped';
RAISE NOTICE '📝 NOTE: Run 01_database_schema.sql to recreate the schema';
*/

-- =====================================================
-- STEP 4: VACUUM AND ANALYZE
-- =====================================================

-- Clean up and optimize the database
VACUUM FULL;
ANALYZE;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE RESET COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Run 02_demo_users.sql to create demo users';
    RAISE NOTICE '2. Run 03_demo_sessions.sql to create demo sessions';
    RAISE NOTICE '3. Run 04_student_data.sql to create student demo data';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FOR PRODUCTION:';
    RAISE NOTICE '- Skip demo data scripts';
    RAISE NOTICE '- Create real users through the application';
    RAISE NOTICE '- Use proper authentication and authorization';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is now ready for fresh data!';
END $$;

-- =====================================================
-- QUICK VERIFICATION QUERIES
-- =====================================================

-- Show table sizes (should all be 0)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Rows Inserted",
    n_tup_upd as "Rows Updated", 
    n_tup_del as "Rows Deleted"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show sequence current values (should all be 1)
SELECT 
    sequence_name,
    last_value,
    is_called
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

