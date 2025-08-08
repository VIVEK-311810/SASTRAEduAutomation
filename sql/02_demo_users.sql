-- =====================================================
-- EDUCATIONAL PLATFORM - DEMO USERS
-- =====================================================
-- Purpose: Insert demo users (teachers and students) for testing
-- Author: Manus AI
-- Version: 1.0
-- Last Updated: 2025-01-02
-- =====================================================

-- Clear existing users (if any)
DELETE FROM users WHERE email LIKE '%@university.edu' OR email LIKE '%@student.edu';

-- =====================================================
-- DEMO TEACHERS
-- =====================================================

INSERT INTO users (email, password_hash, full_name, role, department) VALUES
('sarah.johnson@university.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Dr. Sarah Johnson', 'teacher', 'Computer Science'),
('michael.chen@university.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Prof. Michael Chen', 'teacher', 'Mathematics'),
('emily.davis@university.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Dr. Emily Davis', 'teacher', 'Physics'),
('robert.wilson@university.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Prof. Robert Wilson', 'teacher', 'Chemistry'),
('lisa.brown@university.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Dr. Lisa Brown', 'teacher', 'Biology');

-- =====================================================
-- DEMO STUDENTS
-- =====================================================

INSERT INTO users (email, password_hash, full_name, role, register_number, department) VALUES
-- Computer Science Students
('alice.smith@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Alice Smith', 'student', 'CS2021001', 'Computer Science'),
('bob.wilson@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Bob Wilson', 'student', 'CS2021002', 'Computer Science'),
('carol.davis@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Carol Davis', 'student', 'CS2021003', 'Computer Science'),
('david.miller@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'David Miller', 'student', 'CS2021004', 'Computer Science'),
('eva.garcia@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Eva Garcia', 'student', 'CS2021005', 'Computer Science'),

-- Mathematics Students
('frank.taylor@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Frank Taylor', 'student', 'MATH2021001', 'Mathematics'),
('grace.anderson@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Grace Anderson', 'student', 'MATH2021002', 'Mathematics'),
('henry.thomas@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Henry Thomas', 'student', 'MATH2021003', 'Mathematics'),
('iris.jackson@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Iris Jackson', 'student', 'MATH2021004', 'Mathematics'),
('jack.white@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Jack White', 'student', 'MATH2021005', 'Mathematics'),

-- Physics Students
('kate.harris@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Kate Harris', 'student', 'PHY2021001', 'Physics'),
('liam.martin@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Liam Martin', 'student', 'PHY2021002', 'Physics'),
('mia.thompson@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Mia Thompson', 'student', 'PHY2021003', 'Physics'),
('noah.garcia@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Noah Garcia', 'student', 'PHY2021004', 'Physics'),
('olivia.martinez@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Olivia Martinez', 'student', 'PHY2021005', 'Physics'),

-- Chemistry Students
('paul.rodriguez@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Paul Rodriguez', 'student', 'CHEM2021001', 'Chemistry'),
('quinn.lewis@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Quinn Lewis', 'student', 'CHEM2021002', 'Chemistry'),
('ruby.lee@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Ruby Lee', 'student', 'CHEM2021003', 'Chemistry'),
('sam.walker@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Sam Walker', 'student', 'CHEM2021004', 'Chemistry'),
('tina.hall@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Tina Hall', 'student', 'CHEM2021005', 'Chemistry'),

-- Biology Students
('uma.allen@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Uma Allen', 'student', 'BIO2021001', 'Biology'),
('victor.young@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Victor Young', 'student', 'BIO2021002', 'Biology'),
('wendy.king@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Wendy King', 'student', 'BIO2021003', 'Biology'),
('xavier.wright@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Xavier Wright', 'student', 'BIO2021004', 'Biology'),
('yara.lopez@student.edu', '$2b$10$dummy.hash.for.demo.purposes.only', 'Yara Lopez', 'student', 'BIO2021005', 'Biology');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Display created users summary
DO $$
DECLARE
    teacher_count INTEGER;
    student_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM users WHERE role = 'teacher';
    SELECT COUNT(*) INTO student_count FROM users WHERE role = 'student';
    
    RAISE NOTICE 'Demo Users Created Successfully!';
    RAISE NOTICE 'Teachers: % users', teacher_count;
    RAISE NOTICE 'Students: % users', student_count;
    RAISE NOTICE 'Total: % users', teacher_count + student_count;
END $$;

-- Show teachers
SELECT 
    id, 
    full_name, 
    email, 
    department,
    created_at
FROM users 
WHERE role = 'teacher' 
ORDER BY department, full_name;

-- Show students by department
SELECT 
    department,
    COUNT(*) as student_count,
    STRING_AGG(full_name, ', ' ORDER BY full_name) as students
FROM users 
WHERE role = 'student' 
GROUP BY department 
ORDER BY department;

-- =====================================================
-- NOTES
-- =====================================================
-- Password hashes are dummy values for demo purposes
-- In production, use proper bcrypt hashes
-- All users have the same dummy password hash for simplicity
-- Email domains distinguish between teachers (@university.edu) and students (@student.edu)
-- Register numbers follow department-specific patterns (CS2021001, MATH2021001, etc.)

