const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

class PollQueueManager {
  constructor() {
    this.autoAdvanceInterval = null;
    this.startAutoAdvanceMonitor();
  }

  // Helper function to get numeric session ID from string session ID
  async getNumericSessionId(stringSessionId) {
    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE session_id = $1",
      [stringSessionId.toUpperCase()]
    );
    if (sessionResult.rows.length === 0) {
      return null;
    }
    return sessionResult.rows[0].id;
  }

  // Add MCQs to queue (modified version of send-mcqs)
  async addMCQsToQueue(sessionId, mcqIds, options = {}) {
    const client = await pool.connect();
    try {
      const { 
        autoAdvance = true, 
        activateFirst = true,
        pollDuration = 60,
        breakBetweenPolls = 10 
      } = options;

      await client.query("BEGIN");

      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (numericSessionId === null) {
        await client.query("ROLLBACK");
        throw new Error("Session not found");
      }

      // Ensure queue settings exist for this session
      await client.query(`
        INSERT INTO poll_queue_settings (session_id, auto_advance, poll_duration, break_between_polls)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_id) 
        DO UPDATE SET 
          auto_advance = $2,
          poll_duration = $3,
          break_between_polls = $4,
          updated_at = CURRENT_TIMESTAMP
      `, [numericSessionId, autoAdvance, pollDuration, breakBetweenPolls]);

      const insertedPolls = [];
      let isFirstPoll = true;

      for (const mcqId of mcqIds) {
        const mcqResult = await client.query(
          "SELECT * FROM generated_mcqs WHERE id = $1 AND session_id = $2 AND sent_to_students = FALSE",
          [mcqId, numericSessionId]
        );

        if (mcqResult.rows.length === 0) {
          console.warn(`MCQ with ID ${mcqId} not found or already sent.`);
          continue;
        }

        const mcq = mcqResult.rows[0];

        // Determine initial status: first poll active if activateFirst is true, others queued
        const initialStatus = (isFirstPoll && activateFirst) ? 'active' : 'queued';
        const isActive = (isFirstPoll && activateFirst);

        // Insert into polls table with queue status
        const pollInsertResult = await client.query(`
          INSERT INTO polls (
            session_id, question, options, correct_answer, justification, 
            time_limit, is_active, queue_status, activated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *
        `, [
          numericSessionId, 
          mcq.question, 
          mcq.options, 
          mcq.correct_answer, 
          mcq.justification, 
          mcq.time_limit || pollDuration,
          isActive,
          initialStatus,
          isActive ? new Date() : null
        ]);

        insertedPolls.push(pollInsertResult.rows[0]);

        // Log queue action
        await client.query(`
          INSERT INTO poll_queue_history (session_id, poll_id, action, new_status, triggered_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [numericSessionId, pollInsertResult.rows[0].id, 'queued', initialStatus, 'teacher']);

        // Mark as sent in generated_mcqs table
        await client.query(
          "UPDATE generated_mcqs SET sent_to_students = TRUE, sent_at = CURRENT_TIMESTAMP WHERE id = $1",
          [mcqId]
        );

        isFirstPoll = false;
      }

      await client.query("COMMIT");
      
      return {
        message: `${insertedPolls.length} MCQs added to queue successfully`,
        polls: insertedPolls,
        queueStatus: await this.getQueueStatus(sessionId)
      };

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Get queue status for a session
  async getQueueStatus(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      const result = await pool.query(`
        SELECT * FROM poll_queue_status WHERE session_id = $1
      `, [numericSessionId]);

      if (result.rows.length === 0) {
        return {
          sessionId,
          totalPolls: 0,
          queuedPolls: 0,
          activePolls: 0,
          completedPolls: 0,
          currentPosition: null,
          totalPositions: 0
        };
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }

  // Get detailed queue with poll information
  async getDetailedQueue(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      const result = await pool.query(`
        SELECT 
          p.*,
          CASE 
            WHEN p.queue_status = 'active' THEN 'Currently Active'
            WHEN p.queue_status = 'queued' THEN 'In Queue'
            WHEN p.queue_status = 'completed' THEN 'Completed'
            WHEN p.queue_status = 'paused' THEN 'Paused'
            ELSE p.queue_status
          END as status_display,
          (SELECT COUNT(*) FROM poll_responses WHERE poll_id = p.id) as response_count
        FROM polls p
        WHERE p.session_id = $1
        ORDER BY p.queue_position ASC
      `, [numericSessionId]);

      return result.rows;
    } catch (error) {
      console.error('Error getting detailed queue:', error);
      throw error;
    }
  }

  // Activate next poll in queue
  async activateNextPoll(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      const result = await pool.query(`
        SELECT * FROM activate_next_poll($1)
      `, [numericSessionId]);

      if (result.rows.length > 0) {
        const { activated_poll_id, queue_position } = result.rows[0];
        return {
          success: true,
          activatedPollId: activated_poll_id,
          queuePosition: queue_position,
          message: `Poll ${queue_position} activated successfully`
        };
      } else {
        return {
          success: false,
          message: "No more polls in queue"
        };
      }
    } catch (error) {
      console.error('Error activating next poll:', error);
      throw error;
    }
  }

  // Complete current poll and advance
  async completePollAndAdvance(pollId) {
    try {
      const result = await pool.query(`
        SELECT * FROM complete_poll_and_advance($1)
      `, [pollId]);

      if (result.rows.length > 0) {
        const { completed_poll_id, next_poll_id } = result.rows[0];
        return {
          success: true,
          completedPollId: completed_poll_id,
          nextPollId: next_poll_id,
          message: next_poll_id ? "Poll completed and next poll activated" : "Poll completed, no more polls in queue"
        };
      }
    } catch (error) {
      console.error('Error completing poll and advancing:', error);
      throw error;
    }
  }

  // Pause queue (disable auto-advance)
  async pauseQueue(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      await pool.query(`
        UPDATE poll_queue_settings 
        SET auto_advance = false, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
      `, [numericSessionId]);

      // Log the pause action
      await pool.query(`
        INSERT INTO poll_queue_history (session_id, action, triggered_by, metadata)
        VALUES ($1, $2, $3, $4)
      `, [numericSessionId, 'queue_paused', 'teacher', JSON.stringify({ timestamp: new Date() })]);

      return { success: true, message: "Queue paused successfully" };
    } catch (error) {
      console.error('Error pausing queue:', error);
      throw error;
    }
  }

  // Resume queue (enable auto-advance)
  async resumeQueue(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      await pool.query(`
        UPDATE poll_queue_settings 
        SET auto_advance = true, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $1
      `, [numericSessionId]);

      // Log the resume action
      await pool.query(`
        INSERT INTO poll_queue_history (session_id, action, triggered_by, metadata)
        VALUES ($1, $2, $3, $4)
      `, [numericSessionId, 'queue_resumed', 'teacher', JSON.stringify({ timestamp: new Date() })]);

      return { success: true, message: "Queue resumed successfully" };
    } catch (error) {
      console.error('Error resuming queue:', error);
      throw error;
    }
  }

  // Skip current poll
  async skipCurrentPoll(sessionId) {
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      // Find current active poll
      const activeResult = await pool.query(`
        SELECT id FROM polls 
        WHERE session_id = $1 AND queue_status = 'active'
        ORDER BY queue_position ASC
        LIMIT 1
      `, [numericSessionId]);

      if (activeResult.rows.length === 0) {
        return { success: false, message: "No active poll to skip" };
      }

      const activePollId = activeResult.rows[0].id;

      // Mark as skipped and deactivate
      await pool.query(`
        UPDATE polls 
        SET queue_status = 'completed', is_active = false, completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [activePollId]);

      // Log the skip action
      await pool.query(`
        INSERT INTO poll_queue_history (session_id, poll_id, action, previous_status, new_status, triggered_by)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [numericSessionId, activePollId, 'skipped', 'active', 'completed', 'teacher']);

      // Activate next poll
      const nextResult = await this.activateNextPoll(sessionId);

      return {
        success: true,
        message: "Poll skipped successfully",
        skippedPollId: activePollId,
        nextPoll: nextResult
      };
    } catch (error) {
      console.error('Error skipping current poll:', error);
      throw error;
    }
  }

  // Auto-advance monitor (background process)
  startAutoAdvanceMonitor() {
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
    }

    this.autoAdvanceInterval = setInterval(async () => {
      try {
        await this.checkAndAdvanceQueues();
      } catch (error) {
        console.error('Error in auto-advance monitor:', error);
      }
    }, 10000); // Check every 10 seconds

    console.log('Poll queue auto-advance monitor started');
  }

  // Check all sessions for polls that need advancement
  async checkAndAdvanceQueues() {
    try {
      // Find polls that have exceeded their time limit and should be auto-advanced
      const expiredPolls = await pool.query(`
        SELECT 
          p.id as poll_id,
          p.session_id,
          p.queue_position,
          pqs.auto_advance,
          pqs.poll_duration
        FROM polls p
        JOIN poll_queue_settings pqs ON p.session_id = pqs.session_id
        WHERE p.queue_status = 'active'
          AND pqs.auto_advance = true
          AND p.activated_at IS NOT NULL
          AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.activated_at)) > pqs.poll_duration
      `);

      for (const poll of expiredPolls.rows) {
        console.log(`Auto-advancing expired poll ${poll.poll_id} in session ${poll.session_id}`);
        await this.completePollAndAdvance(poll.poll_id);
      }

    } catch (error) {
      console.error('Error checking and advancing queues:', error);
    }
  }

  // Stop auto-advance monitor
  stopAutoAdvanceMonitor() {
    if (this.autoAdvanceInterval) {
      clearInterval(this.autoAdvanceInterval);
      this.autoAdvanceInterval = null;
      console.log('Poll queue auto-advance monitor stopped');
    }
  }

  // Reorder queue
  async reorderQueue(sessionId, newOrder) {
    const client = await pool.connect();
    try {
      const numericSessionId = await this.getNumericSessionId(sessionId);
      if (!numericSessionId) {
        throw new Error("Session not found");
      }

      await client.query("BEGIN");

      // Update queue positions based on new order
      for (let i = 0; i < newOrder.length; i++) {
        await client.query(`
          UPDATE polls 
          SET queue_position = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND session_id = $3 AND queue_status IN ('queued', 'paused')
        `, [i + 1, newOrder[i], numericSessionId]);
      }

      // Log the reorder action
      await client.query(`
        INSERT INTO poll_queue_history (session_id, action, triggered_by, metadata)
        VALUES ($1, $2, $3, $4)
      `, [numericSessionId, 'queue_reordered', 'teacher', JSON.stringify({ newOrder, timestamp: new Date() })]);

      await client.query("COMMIT");

      return { success: true, message: "Queue reordered successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error('Error reordering queue:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Create singleton instance
const pollQueueManager = new PollQueueManager();

module.exports = pollQueueManager;

