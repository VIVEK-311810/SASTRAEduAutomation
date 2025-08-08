const express = require('express');
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Endpoint to receive generated MCQs from n8n workflow
router.post("/generated-mcqs", async (req, res) => {
  try {
    const { session_id, mcqs } = req.body;

    if (!session_id || !mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(400).json({ 
        error: "Missing session_id or MCQs array",
        received: { session_id, mcqs: Array.isArray(mcqs) ? mcqs.length : 'not an array' }
      });
    }

    // Verify session exists and get its numeric ID
    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE session_id = $1",
      [session_id.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const numericSessionId = sessionResult.rows[0].id;

    // Store MCQs in a temporary table for teacher review
    const insertedMCQs = [];
    for (const mcq of mcqs) {
      const { question, option_a, option_b, option_c, option_d, correct_answer, justification } = mcq;

      if (!question || !option_a || !option_b || !option_c || !option_d) {
        console.warn("Skipping invalid MCQ:", mcq);
        continue;
      }

      // Convert options to array format
      const options = [option_a, option_b, option_c, option_d];
      
      // Convert correct_answer from letter to index
      let correctIndex = 0;
      if (correct_answer === 'B') correctIndex = 1;
      else if (correct_answer === 'C') correctIndex = 2;
      else if (correct_answer === 'D') correctIndex = 3;

      const result = await pool.query(
        "INSERT INTO generated_mcqs (session_id, question, options, correct_answer, justification, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *",
        [numericSessionId, question, JSON.stringify(options), correctIndex, justification]
      );
      insertedMCQs.push(result.rows[0]);
    }

    res.status(201).json({ 
      message: "Generated MCQs received and stored for teacher review", 
      mcqs: insertedMCQs,
      count: insertedMCQs.length
    });
  } catch (error) {
    console.error("Error receiving generated MCQs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to fetch generated MCQs for a session
router.get("/sessions/:sessionId/generated-mcqs", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get the numeric session ID
    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE session_id = $1",
      [sessionId.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const numericSessionId = sessionResult.rows[0].id;

    // Fetch generated MCQs that haven't been sent to students yet
    const result = await pool.query(
      "SELECT * FROM generated_mcqs WHERE session_id = $1 AND sent_to_students = FALSE ORDER BY created_at DESC",
      [numericSessionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching generated MCQs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to send selected MCQs to students (convert to polls)
router.post("/sessions/:sessionId/send-mcqs", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { mcqIds } = req.body;

    if (!mcqIds || !Array.isArray(mcqIds) || mcqIds.length === 0) {
      return res.status(400).json({ error: "Missing MCQ IDs array" });
    }

    // Get the numeric session ID
    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE session_id = $1",
      [sessionId.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const numericSessionId = sessionResult.rows[0].id;

    // Fetch the selected MCQs
    const mcqsResult = await pool.query(
      "SELECT * FROM generated_mcqs WHERE id = ANY($1) AND session_id = $2",
      [mcqIds, numericSessionId]
    );

    if (mcqsResult.rows.length === 0) {
      return res.status(404).json({ error: "No valid MCQs found" });
    }

    // Convert MCQs to polls
    const createdPolls = [];
    for (const mcq of mcqsResult.rows) {
      const pollResult = await pool.query(
        "INSERT INTO polls (session_id, question, options, correct_answer, justification, time_limit, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [numericSessionId, mcq.question, mcq.options, mcq.correct_answer, mcq.justification, 60, false]
      );
      createdPolls.push(pollResult.rows[0]);
    }

    // Mark MCQs as sent
    await pool.query(
      "UPDATE generated_mcqs SET sent_to_students = TRUE, sent_at = CURRENT_TIMESTAMP WHERE id = ANY($1)",
      [mcqIds]
    );

    res.status(201).json({ 
      message: "MCQs successfully sent to students as polls", 
      polls: createdPolls,
      count: createdPolls.length
    });
  } catch (error) {
    console.error("Error sending MCQs to students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

// PUT endpoint to update an MCQ
router.put("/generated-mcqs/:mcqId", async (req, res) => {
  try {
    const { mcqId } = req.params;
    const { question, options, correct_answer, justification, time_limit } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: "Invalid question or options" });
    }

    if (correct_answer < 0 || correct_answer >= 4) {
      return res.status(400).json({ error: "Invalid correct answer index" });
    }

    // Update the MCQ
    const result = await pool.query(
      `UPDATE generated_mcqs 
       SET question = $1, options = $2, correct_answer = $3, justification = $4, time_limit = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND sent_to_students = FALSE
       RETURNING *`,
      [question, JSON.stringify(options), correct_answer, justification || '', time_limit || 60, mcqId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "MCQ not found or already sent to students" });
    }

    res.json({ message: "MCQ updated successfully", mcq: result.rows[0] });
  } catch (error) {
    console.error("Error updating MCQ:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE endpoint to delete an MCQ
router.delete("/generated-mcqs/:mcqId", async (req, res) => {
  try {
    const { mcqId } = req.params;

    // Delete the MCQ (only if not sent to students)
    const result = await pool.query(
      "DELETE FROM generated_mcqs WHERE id = $1 AND sent_to_students = FALSE RETURNING *",
      [mcqId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "MCQ not found or already sent to students" });
    }

    res.json({ message: "MCQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting MCQ:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

