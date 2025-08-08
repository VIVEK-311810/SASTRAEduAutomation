-- =====================================================
-- EDUCATIONAL PLATFORM - DEMO SESSIONS
-- =====================================================
-- Purpose: Create demo sessions with participants and polls for testing
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- Clear existing session data
DELETE FROM poll_responses;
DELETE FROM polls;
DELETE FROM session_participants;
DELETE FROM sessions;

-- =====================================================
-- DEMO SESSIONS
-- =====================================================

-- Computer Science Sessions (Dr. Sarah Johnson - ID: 1)
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('CS101A', 1, 'Introduction to Programming', 'Basic programming concepts using Python', 'Computer Science 101', true, NOW() - INTERVAL '2 hours'),
('CS201B', 1, 'Data Structures and Algorithms', 'Advanced data structures and algorithm analysis', 'Computer Science 201', false, NOW() - INTERVAL '1 day'),
('CS301C', 1, 'Web Development Fundamentals', 'HTML, CSS, JavaScript, and React basics', 'Computer Science 301', true, NOW() - INTERVAL '30 minutes');

-- Mathematics Sessions (Prof. Michael Chen - ID: 2)
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('MATH101', 2, 'Calculus I', 'Differential and integral calculus', 'Mathematics 101', true, NOW() - INTERVAL '1 hour'),
('MATH201', 2, 'Linear Algebra', 'Vector spaces, matrices, and linear transformations', 'Mathematics 201', false, NOW() - INTERVAL '2 days'),
('MATH301', 2, 'Statistics and Probability', 'Statistical analysis and probability theory', 'Mathematics 301', true, NOW() - INTERVAL '45 minutes');

-- Physics Sessions (Dr. Emily Davis - ID: 3)
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('PHY101', 3, 'Classical Mechanics', 'Newton\'s laws and mechanical systems', 'Physics 101', false, NOW() - INTERVAL '3 days'),
('PHY201', 3, 'Electromagnetism', 'Electric and magnetic fields and waves', 'Physics 201', true, NOW() - INTERVAL '20 minutes');

-- Chemistry Sessions (Prof. Robert Wilson - ID: 4)
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('CHEM101', 4, 'General Chemistry', 'Atomic structure and chemical bonding', 'Chemistry 101', true, NOW() - INTERVAL '1.5 hours'),
('CHEM201', 4, 'Organic Chemistry', 'Carbon compounds and reaction mechanisms', 'Chemistry 201', false, NOW() - INTERVAL '4 days');

-- Biology Sessions (Dr. Lisa Brown - ID: 5)
INSERT INTO sessions (session_id, teacher_id, title, description, course_name, is_active, created_at) VALUES
('BIO101', 5, 'Cell Biology', 'Structure and function of cells', 'Biology 101', true, NOW() - INTERVAL '40 minutes'),
('BIO201', 5, 'Genetics', 'Heredity and genetic variation', 'Biology 201', false, NOW() - INTERVAL '5 days');

-- =====================================================
-- SESSION PARTICIPANTS
-- =====================================================

-- Get session IDs for reference
-- CS101A participants (Computer Science students)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '2 hours'),
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '1 hour 45 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), NOW() - INTERVAL '1 hour 30 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'david.miller@student.edu'), NOW() - INTERVAL '1 hour 15 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CS101A'), (SELECT id FROM users WHERE email = 'eva.garcia@student.edu'), NOW() - INTERVAL '1 hour');

-- CS301C participants (Web Development)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CS301C'), (SELECT id FROM users WHERE email = 'alice.smith@student.edu'), NOW() - INTERVAL '25 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CS301C'), (SELECT id FROM users WHERE email = 'bob.wilson@student.edu'), NOW() - INTERVAL '20 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CS301C'), (SELECT id FROM users WHERE email = 'carol.davis@student.edu'), NOW() - INTERVAL '15 minutes');

-- MATH101 participants (Calculus)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'), NOW() - INTERVAL '55 minutes'),
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'grace.anderson@student.edu'), NOW() - INTERVAL '50 minutes'),
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'henry.thomas@student.edu'), NOW() - INTERVAL '45 minutes'),
((SELECT id FROM sessions WHERE session_id = 'MATH101'), (SELECT id FROM users WHERE email = 'iris.jackson@student.edu'), NOW() - INTERVAL '40 minutes');

-- MATH301 participants (Statistics)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH301'), (SELECT id FROM users WHERE email = 'frank.taylor@student.edu'), NOW() - INTERVAL '40 minutes'),
((SELECT id FROM sessions WHERE session_id = 'MATH301'), (SELECT id FROM users WHERE email = 'grace.anderson@student.edu'), NOW() - INTERVAL '35 minutes'),
((SELECT id FROM sessions WHERE session_id = 'MATH301'), (SELECT id FROM users WHERE email = 'jack.white@student.edu'), NOW() - INTERVAL '30 minutes');

-- PHY201 participants (Electromagnetism)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'PHY201'), (SELECT id FROM users WHERE email = 'kate.harris@student.edu'), NOW() - INTERVAL '18 minutes'),
((SELECT id FROM sessions WHERE session_id = 'PHY201'), (SELECT id FROM users WHERE email = 'liam.martin@student.edu'), NOW() - INTERVAL '15 minutes'),
((SELECT id FROM sessions WHERE session_id = 'PHY201'), (SELECT id FROM users WHERE email = 'mia.thompson@student.edu'), NOW() - INTERVAL '12 minutes');

-- CHEM101 participants (General Chemistry)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), (SELECT id FROM users WHERE email = 'paul.rodriguez@student.edu'), NOW() - INTERVAL '1 hour 20 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), (SELECT id FROM users WHERE email = 'quinn.lewis@student.edu'), NOW() - INTERVAL '1 hour 10 minutes'),
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), (SELECT id FROM users WHERE email = 'ruby.lee@student.edu'), NOW() - INTERVAL '1 hour'),
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), (SELECT id FROM users WHERE email = 'sam.walker@student.edu'), NOW() - INTERVAL '50 minutes');

-- BIO101 participants (Cell Biology)
INSERT INTO session_participants (session_id, student_id, joined_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'BIO101'), (SELECT id FROM users WHERE email = 'uma.allen@student.edu'), NOW() - INTERVAL '35 minutes'),
((SELECT id FROM sessions WHERE session_id = 'BIO101'), (SELECT id FROM users WHERE email = 'victor.young@student.edu'), NOW() - INTERVAL '30 minutes'),
((SELECT id FROM sessions WHERE session_id = 'BIO101'), (SELECT id FROM users WHERE email = 'wendy.king@student.edu'), NOW() - INTERVAL '25 minutes'),
((SELECT id FROM sessions WHERE session_id = 'BIO101'), (SELECT id FROM users WHERE email = 'xavier.wright@student.edu'), NOW() - INTERVAL '20 minutes');

-- =====================================================
-- DEMO POLLS
-- =====================================================

-- CS101A Polls (Programming)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CS101A'), 
 'What is the correct way to define a function in Python?', 
 '["def function_name():", "function function_name():", "define function_name():", "func function_name():"]', 
 0, 
 'In Python, functions are defined using the "def" keyword followed by the function name and parentheses.',
 60, 
 true, 
 NOW() - INTERVAL '30 minutes'),

((SELECT id FROM sessions WHERE session_id = 'CS101A'), 
 'Which data type is used to store text in Python?', 
 '["int", "float", "str", "bool"]', 
 2, 
 'The "str" (string) data type is used to store text in Python.',
 45, 
 false, 
 NOW() - INTERVAL '45 minutes');

-- CS301C Polls (Web Development)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CS301C'), 
 'Which HTML tag is used to create a hyperlink?', 
 '["<link>", "<a>", "<href>", "<url>"]', 
 1, 
 'The <a> tag with the href attribute is used to create hyperlinks in HTML.',
 60, 
 true, 
 NOW() - INTERVAL '10 minutes');

-- MATH101 Polls (Calculus)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH101'), 
 'What is the derivative of x²?', 
 '["x", "2x", "x²", "2x²"]', 
 1, 
 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
 90, 
 false, 
 NOW() - INTERVAL '20 minutes');

-- MATH301 Polls (Statistics)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'MATH301'), 
 'What is the mean of the dataset: 2, 4, 6, 8, 10?', 
 '["5", "6", "7", "8"]', 
 1, 
 'Mean = (2+4+6+8+10)/5 = 30/5 = 6',
 75, 
 true, 
 NOW() - INTERVAL '15 minutes');

-- PHY201 Polls (Electromagnetism)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'PHY201'), 
 'What is the unit of electric field?', 
 '["Volts", "Amperes", "Newtons per Coulomb", "Watts"]', 
 2, 
 'Electric field is measured in Newtons per Coulomb (N/C) or equivalently Volts per meter (V/m).',
 60, 
 false, 
 NOW() - INTERVAL '8 minutes');

-- CHEM101 Polls (General Chemistry)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'CHEM101'), 
 'What is the atomic number of Carbon?', 
 '["4", "6", "8", "12"]', 
 1, 
 'Carbon has 6 protons, so its atomic number is 6.',
 45, 
 true, 
 NOW() - INTERVAL '25 minutes');

-- BIO101 Polls (Cell Biology)
INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active, created_at) VALUES
((SELECT id FROM sessions WHERE session_id = 'BIO101'), 
 'Which organelle is known as the powerhouse of the cell?', 
 '["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"]', 
 1, 
 'Mitochondria produce ATP through cellular respiration, earning them the nickname "powerhouse of the cell".',
 60, 
 false, 
 NOW() - INTERVAL '12 minutes');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Display session summary
DO $$
DECLARE
    session_count INTEGER;
    participant_count INTEGER;
    poll_count INTEGER;
    active_session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM sessions;
    SELECT COUNT(*) INTO participant_count FROM session_participants;
    SELECT COUNT(*) INTO poll_count FROM polls;
    SELECT COUNT(*) INTO active_session_count FROM sessions WHERE is_active = true;
    
    RAISE NOTICE 'Demo Sessions Created Successfully!';
    RAISE NOTICE 'Total Sessions: %', session_count;
    RAISE NOTICE 'Active Sessions: %', active_session_count;
    RAISE NOTICE 'Total Participants: %', participant_count;
    RAISE NOTICE 'Total Polls: %', poll_count;
END $$;

-- Show active sessions with participant counts
SELECT 
    s.session_id,
    s.title,
    s.course_name,
    u.full_name as teacher,
    COUNT(sp.student_id) as participants,
    s.created_at
FROM sessions s
JOIN users u ON s.teacher_id = u.id
LEFT JOIN session_participants sp ON s.id = sp.session_id
WHERE s.is_active = true
GROUP BY s.id, s.session_id, s.title, s.course_name, u.full_name, s.created_at
ORDER BY s.created_at DESC;

