const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Helper function to get numeric session ID from string session ID
async function getNumericSessionId(stringSessionId) {
  const sessionResult = await pool.query(
    "SELECT id FROM sessions WHERE session_id = $1",
    [stringSessionId.toUpperCase()]
  );
  if (sessionResult.rows.length === 0) {
    return null;
  }
  return sessionResult.rows[0].id;
}

// Create a new session
router.post("/", async (req, res) => {
  try {
    const { title, course_name, teacher_id } = req.body;
    if (!title || !course_name || !teacher_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // The database schema has a trigger to generate session_id if not provided
    // So we can directly insert and let the DB handle it.
    const result = await pool.query(
      "INSERT INTO sessions (title, course_name, teacher_id, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, course_name, teacher_id, true] // Sessions are active by default
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all sessions for a teacher
router.get("/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const result = await pool.query(
      "SELECT * FROM sessions WHERE teacher_id = $1 ORDER BY created_at DESC",
      [teacherId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching teacher sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single session by session_id (user-facing)
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      "SELECT * FROM sessions WHERE session_id = $1",
      [sessionId.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Student joins a session
router.post("/:sessionId/join", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    const sessionResult = await pool.query(
      "SELECT id, is_active FROM sessions WHERE session_id = $1",
      [sessionId.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];
    const numericSessionId = session.id;

    if (!session.is_active) {
      return res.status(403).json({ error: "Session is not active" });
    }

    // Check if student is already a participant
    const existingParticipant = await pool.query(
      "SELECT * FROM session_participants WHERE session_id = $1 AND student_id = $2",
      [numericSessionId, student_id]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(200).json({ message: "Already joined session", session: sessionResult.rows[0] });
    }

    // Add student to session participants
    await pool.query(
      "INSERT INTO session_participants (session_id, id) VALUES ($1, $2)",
      [numericSessionId, student_id]
    );

    res.status(201).json({ message: "Successfully joined session", session: sessionResult.rows[0] });
  } catch (error) {
    console.error("Error joining session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get participants for a session
router.get("/:sessionId/participants", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const numericSessionId = await getNumericSessionId(sessionId);

    if (numericSessionId === null) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await pool.query(
      `SELECT sp.student_id as id, u.full_name as name, u.email, sp.joined_at, sp.is_active
       FROM session_participants sp
       JOIN users u ON sp.student_id = u.id
       WHERE sp.session_id = $1 AND sp.is_active = true
       ORDER BY sp.joined_at DESC`,
      [numericSessionId]
    );
    
    res.json({ 
      participants: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get active poll for a session
router.get("/:sessionId/active-poll", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const numericSessionId = await getNumericSessionId(sessionId);

    if (numericSessionId === null) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await pool.query(
      "SELECT * FROM polls WHERE session_id = $1 AND is_active = TRUE ORDER BY activated_at DESC LIMIT 1",
      [numericSessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No active poll found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching active poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get generated MCQs for a session
router.get("/:sessionId/generated-mcqs", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const numericSessionId = await getNumericSessionId(sessionId);

    if (numericSessionId === null) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await pool.query(
      "SELECT * FROM generated_mcqs WHERE session_id = $1 AND sent_to_students = FALSE ORDER BY created_at DESC",
      [numericSessionId]
    );
    res.json({ mcqs: result.rows });
  } catch (error) {
    console.error("Error fetching generated MCQs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send MCQs to queue (enhanced version with queuing)
router.post("/:sessionId/send-mcqs", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { mcq_ids, queueOptions = {} } = req.body;

    if (!mcq_ids || !Array.isArray(mcq_ids) || mcq_ids.length === 0) {
      return res.status(400).json({ error: "No MCQ IDs provided" });
    }

    const pollQueueManager = require('../services/PollQueueManager');
    
    // Default queue options
    const options = {
      autoAdvance: queueOptions.autoAdvance !== false, // Default to true
      activateFirst: queueOptions.activateFirst !== false, // Default to true
      pollDuration: queueOptions.pollDuration || 60,
      breakBetweenPolls: queueOptions.breakBetweenPolls || 10,
      ...queueOptions
    };

    const result = await pollQueueManager.addMCQsToQueue(sessionId, mcq_ids, options);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Error sending MCQs to queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Queue management endpoints
router.get("/:sessionId/poll-queue", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pollQueueManager = require('../services/PollQueueManager');
    
    const queueStatus = await pollQueueManager.getQueueStatus(sessionId);
    const detailedQueue = await pollQueueManager.getDetailedQueue(sessionId);
    
    res.json({
      status: queueStatus,
      queue: detailedQueue
    });
  } catch (error) {
    console.error("Error getting poll queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/:sessionId/queue/pause", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pollQueueManager = require('../services/PollQueueManager');
    
    const result = await pollQueueManager.pauseQueue(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error pausing queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/:sessionId/queue/resume", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pollQueueManager = require('../services/PollQueueManager');
    
    const result = await pollQueueManager.resumeQueue(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error resuming queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/:sessionId/queue/skip", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pollQueueManager = require('../services/PollQueueManager');
    
    const result = await pollQueueManager.skipCurrentPoll(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error skipping current poll:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/:sessionId/queue/advance", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pollQueueManager = require('../services/PollQueueManager');
    
    const result = await pollQueueManager.activateNextPoll(sessionId);
    res.json(result);
  } catch (error) {
    console.error("Error advancing queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.put("/:sessionId/queue/reorder", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newOrder } = req.body;
    
    if (!newOrder || !Array.isArray(newOrder)) {
      return res.status(400).json({ error: "New order array is required" });
    }
    
    const pollQueueManager = require('../services/PollQueueManager');
    const result = await pollQueueManager.reorderQueue(sessionId, newOrder);
    res.json(result);
  } catch (error) {
    console.error("Error reordering queue:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;