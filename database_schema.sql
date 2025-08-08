-- Educational Platform Database Schema
-- Run this in pgAdmin 4 Query Tool

-- Users table (both teachers and students)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
    register_number VARCHAR(50), -- For students
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (classes created by teachers)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(20) UNIQUE NOT NULL, -- The ID students use to join
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_name VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Session participants (students who joined a session)
CREATE TABLE session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(session_id, student_id)
);

-- Polls/MCQs created by teachers
CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer INTEGER, -- Index of correct answer (0-based)
    justification TEXT, -- Explanation for the correct answer
    time_limit INTEGER DEFAULT 60, -- Time limit in seconds
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- Student responses to polls
CREATE TABLE poll_responses (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    selected_option INTEGER NOT NULL, -- Index of selected option (0-based)
    response_time INTEGER, -- Time taken to respond in seconds
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, student_id)
);

-- Session resources (notes, materials uploaded by teachers)
CREATE TABLE session_resources (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- 'note', 'document', 'link', 'transcript'
    content TEXT, -- For notes and transcripts
    file_url VARCHAR(500), -- For uploaded files
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session notes (AI-generated or manual notes)
CREATE TABLE session_notes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai_generated', 'transcript'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_mcqs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of options: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer INTEGER NOT NULL, -- Index of correct answer (0-based)
    justification TEXT, -- Explanation for the correct answer
    sent_to_students BOOLEAN DEFAULT FALSE, -- Whether this MCQ has been sent to students as a poll
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP -- When it was sent to students
);

-- Index for faster queries
CREATE INDEX idx_generated_mcqs_session_id ON generated_mcqs(session_id);
CREATE INDEX idx_generated_mcqs_sent_status ON generated_mcqs(sent_to_students);

-- Indexes for better performance
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_student_id ON session_participants(student_id);
CREATE INDEX idx_polls_session_id ON polls(session_id);
CREATE INDEX idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_student_id ON poll_responses(student_id);
CREATE INDEX idx_session_resources_session_id ON session_resources(session_id);
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);

-- Function to generate unique session IDs
CREATE OR REPLACE FUNCTION generate_session_id() RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    done BOOLEAN := false;
BEGIN
    WHILE NOT done LOOP
        -- Generate a 6-character alphanumeric ID
        new_id := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if it already exists
        IF NOT EXISTS (SELECT 1 FROM sessions WHERE session_id = new_id) THEN
            done := true;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate session IDs
CREATE OR REPLACE FUNCTION set_session_id() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_id IS NULL OR NEW.session_id = '' THEN
        NEW.session_id := generate_session_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_session_id
    BEFORE INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_session_id();

-- Sample data for testing
INSERT INTO users (id, email, password_hash, full_name, role, department, register_number) VALUES
(1,'teacher1@college.edu', '$2b$10$example_hash_1', 'Dr. John Smith', 'teacher', 'Computer Science', NULL),
(2,'teacher2@college.edu', '$2b$10$example_hash_2', 'Prof. Sarah Johnson', 'teacher', 'Mathematics', NULL);

INSERT INTO users (id, email, password_hash, full_name, role, department, register_number) VALUES
(101,'student1@college.edu', '$2b$10$example_hash_3', 'Alice Brown', 'student', 'Computer Science', 'CS001'),
(102,'student2@college.edu', '$2b$10$example_hash_4', 'Bob Wilson', 'student', 'Computer Science', 'CS002'),
(103,'student3@college.edu', '$2b$10$example_hash_5', 'Carol Davis', 'student', 'Computer Science', 'CS003');

