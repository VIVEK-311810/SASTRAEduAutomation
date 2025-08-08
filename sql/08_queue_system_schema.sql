-- MCQ Queue System Database Schema
-- This file adds the necessary database structure for intelligent MCQ queuing

-- Add queue-related columns to existing polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS queue_position INTEGER;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS queue_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE polls ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT true;
ALTER TABLE polls ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update existing polls to have proper queue status
UPDATE polls SET queue_status = 'active' WHERE is_active = true AND queue_status IS NULL;
UPDATE polls SET queue_status = 'completed' WHERE is_active = false AND queue_status IS NULL;

-- Create index for efficient queue queries
CREATE INDEX IF NOT EXISTS idx_polls_queue ON polls(session_id, queue_status, queue_position);
CREATE INDEX IF NOT EXISTS idx_polls_session_active ON polls(session_id, is_active);

-- Create poll queue settings table
CREATE TABLE IF NOT EXISTS poll_queue_settings (
    session_id INTEGER PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    auto_advance BOOLEAN DEFAULT true,
    poll_duration INTEGER DEFAULT 60, -- Default poll duration in seconds
    break_between_polls INTEGER DEFAULT 10, -- Break between polls in seconds
    max_concurrent_polls INTEGER DEFAULT 1, -- Maximum concurrent active polls
    advancement_mode VARCHAR(20) DEFAULT 'auto', -- 'auto', 'manual', 'timed', 'response_based'
    min_response_percentage INTEGER DEFAULT 70, -- For response_based advancement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create poll queue history table for tracking
CREATE TABLE IF NOT EXISTS poll_queue_history (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'queued', 'activated', 'completed', 'paused', 'skipped', 'cancelled'
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    triggered_by VARCHAR(20) DEFAULT 'system', -- 'system', 'teacher', 'auto'
    metadata JSONB, -- Additional data like response counts, timing, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for queue history
CREATE INDEX IF NOT EXISTS idx_queue_history_session ON poll_queue_history(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_history_poll ON poll_queue_history(poll_id);

-- Create view for active queue status
CREATE OR REPLACE VIEW poll_queue_status AS
SELECT 
    s.id as session_id,
    s.session_id as session_code,
    s.title as session_title,
    COUNT(p.id) as total_polls,
    COUNT(CASE WHEN p.queue_status = 'queued' THEN 1 END) as queued_polls,
    COUNT(CASE WHEN p.queue_status = 'active' THEN 1 END) as active_polls,
    COUNT(CASE WHEN p.queue_status = 'completed' THEN 1 END) as completed_polls,
    COUNT(CASE WHEN p.queue_status = 'paused' THEN 1 END) as paused_polls,
    MIN(CASE WHEN p.queue_status = 'active' THEN p.queue_position END) as current_position,
    MAX(p.queue_position) as total_positions,
    pqs.auto_advance,
    pqs.advancement_mode,
    pqs.poll_duration,
    pqs.break_between_polls
FROM sessions s
LEFT JOIN polls p ON s.id = p.session_id
LEFT JOIN poll_queue_settings pqs ON s.id = pqs.session_id
WHERE s.is_active = true
GROUP BY s.id, s.session_id, s.title, pqs.auto_advance, pqs.advancement_mode, pqs.poll_duration, pqs.break_between_polls;

-- Function to get next poll in queue
CREATE OR REPLACE FUNCTION get_next_poll_in_queue(session_id_param INTEGER)
RETURNS TABLE(poll_id INTEGER, queue_position INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.queue_position
    FROM polls p
    WHERE p.session_id = session_id_param 
      AND p.queue_status = 'queued'
    ORDER BY p.queue_position ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to activate next poll in queue
CREATE OR REPLACE FUNCTION activate_next_poll(session_id_param INTEGER)
RETURNS TABLE(activated_poll_id INTEGER, queue_position INTEGER) AS $$
DECLARE
    next_poll_id INTEGER;
    next_position INTEGER;
BEGIN
    -- Get the next poll in queue
    SELECT poll_id, queue_position INTO next_poll_id, next_position
    FROM get_next_poll_in_queue(session_id_param);
    
    IF next_poll_id IS NOT NULL THEN
        -- Activate the next poll
        UPDATE polls 
        SET queue_status = 'active', 
            is_active = true, 
            activated_at = CURRENT_TIMESTAMP
        WHERE id = next_poll_id;
        
        -- Log the activation
        INSERT INTO poll_queue_history (session_id, poll_id, action, previous_status, new_status, triggered_by)
        VALUES (session_id_param, next_poll_id, 'activated', 'queued', 'active', 'system');
        
        RETURN QUERY SELECT next_poll_id, next_position;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to complete current poll and advance queue
CREATE OR REPLACE FUNCTION complete_poll_and_advance(poll_id_param INTEGER)
RETURNS TABLE(completed_poll_id INTEGER, next_poll_id INTEGER) AS $$
DECLARE
    session_id_param INTEGER;
    next_poll INTEGER;
    auto_advance_enabled BOOLEAN;
BEGIN
    -- Get session ID and check auto-advance setting
    SELECT p.session_id, COALESCE(pqs.auto_advance, true)
    INTO session_id_param, auto_advance_enabled
    FROM polls p
    LEFT JOIN poll_queue_settings pqs ON p.session_id = pqs.session_id
    WHERE p.id = poll_id_param;
    
    -- Complete the current poll
    UPDATE polls 
    SET queue_status = 'completed', 
        is_active = false, 
        completed_at = CURRENT_TIMESTAMP
    WHERE id = poll_id_param;
    
    -- Log the completion
    INSERT INTO poll_queue_history (session_id, poll_id, action, previous_status, new_status, triggered_by)
    VALUES (session_id_param, poll_id_param, 'completed', 'active', 'completed', 'system');
    
    -- Auto-advance if enabled
    IF auto_advance_enabled THEN
        SELECT activated_poll_id INTO next_poll
        FROM activate_next_poll(session_id_param);
    END IF;
    
    RETURN QUERY SELECT poll_id_param, next_poll;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set queue position when polls are inserted
CREATE OR REPLACE FUNCTION set_queue_position()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.queue_position IS NULL THEN
        SELECT COALESCE(MAX(queue_position), 0) + 1
        INTO NEW.queue_position
        FROM polls
        WHERE session_id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_queue_position
    BEFORE INSERT ON polls
    FOR EACH ROW
    EXECUTE FUNCTION set_queue_position();

-- Insert default queue settings for existing sessions
INSERT INTO poll_queue_settings (session_id)
SELECT id FROM sessions 
WHERE id NOT IN (SELECT session_id FROM poll_queue_settings)
ON CONFLICT (session_id) DO NOTHING;

-- Update existing polls to have queue positions
WITH numbered_polls AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at) as rn
    FROM polls
    WHERE queue_position IS NULL
)
UPDATE polls 
SET queue_position = numbered_polls.rn
FROM numbered_polls
WHERE polls.id = numbered_polls.id;

COMMENT ON TABLE poll_queue_settings IS 'Configuration settings for poll queuing system per session';
COMMENT ON TABLE poll_queue_history IS 'Audit trail for all poll queue operations';
COMMENT ON VIEW poll_queue_status IS 'Real-time view of poll queue status for all active sessions';
COMMENT ON FUNCTION get_next_poll_in_queue IS 'Returns the next poll to be activated in the queue';
COMMENT ON FUNCTION activate_next_poll IS 'Activates the next poll in queue and returns its details';
COMMENT ON FUNCTION complete_poll_and_advance IS 'Completes current poll and auto-advances if enabled';

