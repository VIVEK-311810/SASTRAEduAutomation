-- =====================================================
-- EDUCATIONAL PLATFORM - STUDENT DEMO DATA
-- =====================================================
-- Purpose: Create student-specific demo data including poll responses and activity
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- Clear existing poll responses
DELETE FROM poll_responses;

-- =====================================================
-- POLL RESPONSES - CS101A (Programming Session)
-- =====================================================

-- Poll 1: "What is the correct way to define a function in Python?"
-- Correct answer: 0 (def function_name():)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 0, true, 15, NOW() - INTERVAL '25 minutes'),
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), 
 1, false, 22, NOW() - INTERVAL '24 minutes'),
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), 
 0, true, 18, NOW() - INTERVAL '23 minutes'),
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'david.miller@student.edu'), 
 0, true, 12, NOW() - INTERVAL '22 minutes'),
((SELECT id FROM polls WHERE question LIKE '%define a function in Python%'), 
 (SELECT id FROM users WHERE email = 'eva.garcia@student.edu'), 
 2, false, 35, NOW() - INTERVAL '21 minutes');

-- Poll 2: "Which data type is used to store text in Python?"
-- Correct answer: 2 (str)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%data type%store text%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 2, true, 8, NOW() - INTERVAL '40 minutes'),
((SELECT id FROM polls WHERE question LIKE '%data type%store text%'), 
 (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), 
 2, true, 12, NOW() - INTERVAL '39 minutes'),
((SELECT id FROM polls WHERE question LIKE '%data type%store text%'), 
 (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), 
 1, false, 25, NOW() - INTERVAL '38 minutes'),
((SELECT id FROM polls WHERE question LIKE '%data type%store text%'), 
 (SELECT id FROM users WHERE email = 'david.miller@student.edu'), 
 2, true, 10, NOW() - INTERVAL '37 minutes');

-- =====================================================
-- POLL RESPONSES - CS301C (Web Development Session)
-- =====================================================

-- Poll: "Which HTML tag is used to create a hyperlink?"
-- Correct answer: 1 (<a>)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%HTML tag%hyperlink%'), 
 (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), 
 1, true, 7, NOW() - INTERVAL '8 minutes'),
((SELECT id FROM polls WHERE question LIKE '%HTML tag%hyperlink%'), 
 (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), 
 1, true, 9, NOW() - INTERVAL '7 minutes'),
((SELECT id FROM polls WHERE question LIKE '%HTML tag%hyperlink%'), 
 (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), 
 0, false, 15, NOW() - INTERVAL '6 minutes');

-- =====================================================
-- POLL RESPONSES - MATH101 (Calculus Session)
-- =====================================================

-- Poll: "What is the derivative of x²?"
-- Correct answer: 1 (2x)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%derivative of x²%'), 
 (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'), 
 1, true, 20, NOW() - INTERVAL '18 minutes'),
((SELECT id FROM polls WHERE question LIKE '%derivative of x²%'), 
 (SELECT id FROM users WHERE email = 'grace.anderson@student.edu'), 
 1, true, 15, NOW() - INTERVAL '17 minutes'),
((SELECT id FROM polls WHERE question LIKE '%derivative of x²%'), 
 (SELECT id FROM users WHERE email = 'henry.thomas@student.edu'), 
 0, false, 45, NOW() - INTERVAL '16 minutes'),
((SELECT id FROM polls WHERE question LIKE '%derivative of x²%'), 
 (SELECT id FROM users WHERE email = 'iris.jackson@student.edu'), 
 1, true, 25, NOW() - INTERVAL '15 minutes');

-- =====================================================
-- POLL RESPONSES - MATH301 (Statistics Session)
-- =====================================================

-- Poll: "What is the mean of the dataset: 2, 4, 6, 8, 10?"
-- Correct answer: 1 (6)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%mean of the dataset%'), 
 (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'), 
 1, true, 30, NOW() - INTERVAL '12 minutes'),
((SELECT id FROM polls WHERE question LIKE '%mean of the dataset%'), 
 (SELECT id FROM users WHERE email = 'grace.anderson@student.edu'), 
 1, true, 25, NOW() - INTERVAL '11 minutes'),
((SELECT id FROM polls WHERE question LIKE '%mean of the dataset%'), 
 (SELECT id FROM users WHERE email = 'jack.white@student.edu'), 
 0, false, 40, NOW() - INTERVAL '10 minutes');

-- =====================================================
-- POLL RESPONSES - PHY201 (Electromagnetism Session)
-- =====================================================

-- Poll: "What is the unit of electric field?"
-- Correct answer: 2 (Newtons per Coulomb)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%unit of electric field%'), 
 (SELECT id FROM users WHERE email = 'kate.harris@student.edu'), 
 2, true, 18, NOW() - INTERVAL '6 minutes'),
((SELECT id FROM polls WHERE question LIKE '%unit of electric field%'), 
 (SELECT id FROM users WHERE email = 'liam.martin@student.edu'), 
 0, false, 35, NOW() - INTERVAL '5 minutes'),
((SELECT id FROM polls WHERE question LIKE '%unit of electric field%'), 
 (SELECT id FROM users WHERE email = 'mia.thompson@student.edu'), 
 2, true, 22, NOW() - INTERVAL '4 minutes');

-- =====================================================
-- POLL RESPONSES - CHEM101 (General Chemistry Session)
-- =====================================================

-- Poll: "What is the atomic number of Carbon?"
-- Correct answer: 1 (6)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%atomic number of Carbon%'), 
 (SELECT id FROM users WHERE email = 'paul.rodriguez@student.edu'), 
 1, true, 12, NOW() - INTERVAL '20 minutes'),
((SELECT id FROM polls WHERE question LIKE '%atomic number of Carbon%'), 
 (SELECT id FROM users WHERE email = 'quinn.lewis@student.edu'), 
 1, true, 8, NOW() - INTERVAL '19 minutes'),
((SELECT id FROM polls WHERE question LIKE '%atomic number of Carbon%'), 
 (SELECT id FROM users WHERE email = 'ruby.lee@student.edu'), 
 3, false, 28, NOW() - INTERVAL '18 minutes'),
((SELECT id FROM polls WHERE question LIKE '%atomic number of Carbon%'), 
 (SELECT id FROM users WHERE email = 'sam.walker@student.edu'), 
 1, true, 15, NOW() - INTERVAL '17 minutes');

-- =====================================================
-- POLL RESPONSES - BIO101 (Cell Biology Session)
-- =====================================================

-- Poll: "Which organelle is known as the powerhouse of the cell?"
-- Correct answer: 1 (Mitochondria)
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) VALUES
((SELECT id FROM polls WHERE question LIKE '%powerhouse of the cell%'), 
 (SELECT id FROM users WHERE email = 'uma.allen@student.edu'), 
 1, true, 10, NOW() - INTERVAL '10 minutes'),
((SELECT id FROM polls WHERE question LIKE '%powerhouse of the cell%'), 
 (SELECT id FROM users WHERE email = 'victor.young@student.edu'), 
 1, true, 14, NOW() - INTERVAL '9 minutes'),
((SELECT id FROM polls WHERE question LIKE '%powerhouse of the cell%'), 
 (SELECT id FROM users WHERE email = 'wendy.king@student.edu'), 
 0, false, 25, NOW() - INTERVAL '8 minutes'),
((SELECT id FROM polls WHERE question LIKE '%powerhouse of the cell%'), 
 (SELECT id FROM users WHERE email = 'xavier.wright@student.edu'), 
 1, true, 12, NOW() - INTERVAL '7 minutes');

-- =====================================================
-- ADDITIONAL HISTORICAL POLL RESPONSES
-- =====================================================
-- Adding some older responses to create activity history

-- Older CS responses for Alice Smith
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) 
SELECT 
    p.id,
    (SELECT id FROM users WHERE email = 'alice.smith@student.edu'),
    CASE WHEN random() < 0.8 THEN p.correct_answer ELSE (p.correct_answer + 1) % 4 END,
    CASE WHEN random() < 0.8 THEN true ELSE false END,
    (10 + random() * 30)::INTEGER,
    NOW() - INTERVAL '1 day' - (random() * INTERVAL '2 days')
FROM polls p
JOIN sessions s ON p.session_id = s.id
WHERE s.session_id IN ('CS201B') AND p.id NOT IN (SELECT poll_id FROM poll_responses WHERE student_id = (SELECT id FROM users WHERE email = 'alice.smith@student.edu'))
LIMIT 3;

-- Older Math responses for Frank Taylor
INSERT INTO poll_responses (poll_id, student_id, selected_option, is_correct, response_time, responded_at) 
SELECT 
    p.id,
    (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'),
    CASE WHEN random() < 0.75 THEN p.correct_answer ELSE (p.correct_answer + 1) % 4 END,
    CASE WHEN random() < 0.75 THEN true ELSE false END,
    (15 + random() * 25)::INTEGER,
    NOW() - INTERVAL '2 days' - (random() * INTERVAL '1 day')
FROM polls p
JOIN sessions s ON p.session_id = s.id
WHERE s.session_id IN ('MATH201') AND p.id NOT IN (SELECT poll_id FROM poll_responses WHERE student_id = (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'))
LIMIT 2;

-- =====================================================
-- VERIFICATION AND STATISTICS
-- =====================================================

-- Display student activity summary
DO $$
DECLARE
    total_responses INTEGER;
    total_students_with_responses INTEGER;
    avg_accuracy DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_responses FROM poll_responses;
    SELECT COUNT(DISTINCT student_id) INTO total_students_with_responses FROM poll_responses;
    SELECT ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) INTO avg_accuracy FROM poll_responses;
    
    RAISE NOTICE 'Student Demo Data Created Successfully!';
    RAISE NOTICE 'Total Poll Responses: %', total_responses;
    RAISE NOTICE 'Students with Responses: %', total_students_with_responses;
    RAISE NOTICE 'Overall Accuracy: %%%', avg_accuracy;
END $$;

-- Show student performance summary
SELECT 
    u.full_name,
    u.register_number,
    COUNT(pr.id) as total_responses,
    COUNT(CASE WHEN pr.is_correct THEN 1 END) as correct_responses,
    ROUND(
        (COUNT(CASE WHEN pr.is_correct THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(pr.id), 0)) * 100, 1
    ) as accuracy_percentage,
    ROUND(AVG(pr.response_time), 1) as avg_response_time_seconds
FROM users u
LEFT JOIN poll_responses pr ON u.id = pr.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.register_number
HAVING COUNT(pr.id) > 0
ORDER BY accuracy_percentage DESC, total_responses DESC;

-- Show recent activity for debugging
SELECT 
    u.full_name as student,
    s.session_id,
    s.title as session_title,
    p.question,
    pr.selected_option,
    pr.is_correct,
    pr.response_time,
    pr.responded_at
FROM poll_responses pr
JOIN users u ON pr.student_id = u.id
JOIN polls p ON pr.poll_id = p.id
JOIN sessions s ON p.session_id = s.id
ORDER BY pr.responded_at DESC
LIMIT 20;

