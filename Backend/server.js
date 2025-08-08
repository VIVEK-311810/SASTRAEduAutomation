const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections by session
const sessionConnections = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      switch (data.type) {
        case 'join-session':
          handleJoinSession(ws, data);
          break;
        case 'poll-response':
          handlePollResponse(ws, data);
          break;
        case 'activate-poll':
          handleActivatePoll(data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Remove from session connections
    for (const [sessionId, connections] of sessionConnections.entries()) {
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          sessionConnections.delete(sessionId);
        }
        break;
      }
    }
  });
});

function handleJoinSession(ws, data) {
  const { sessionId, studentId } = data;
  
  if (!sessionConnections.has(sessionId)) {
    sessionConnections.set(sessionId, []);
  }
  
  sessionConnections.get(sessionId).push(ws);
  ws.sessionId = sessionId;
  ws.studentId = studentId;
  
  console.log(`Student ${studentId} joined session ${sessionId}`);
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'session-joined',
    sessionId: sessionId,
    message: 'Successfully joined session'
  }));
  
  // Broadcast participant count update
  broadcastToSession(sessionId, {
    type: 'participant-count-updated',
    count: sessionConnections.get(sessionId).length
  });
}

function handlePollResponse(ws, data) {
  console.log('Poll response received:', data);
  // Here you would save the response to database
  // and potentially broadcast results
}

function handleActivatePoll(data) {
  const { sessionId, poll } = data;
  console.log(`Activating poll for session ${sessionId}:`, poll);
  
  broadcastToSession(sessionId, {
    type: 'poll-activated',
    poll: poll
  });
}

function broadcastToSession(sessionId, message) {
  const connections = sessionConnections.get(sessionId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Import route modules
const sessionsRouter = require('./routes/sessions');
const pollsRouter = require('./routes/polls');
const resourcesRouter = require('./routes/resources');
const generatedMCQsRoutes = require('./routes/generated-mcqs');
const studentsRouter = require('./routes/students');


// Use route modules
app.use('/api/sessions', sessionsRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/students', studentsRouter);
app.use('/api', generatedMCQsRoutes);

// Real authentication endpoint using database users
app.post('/api/mock-login', async (req, res) => {
  try {
    const { role } = req.body;
    
    // Get real users from database
    const query = 'SELECT id, full_name as name, email, register_number, role FROM users WHERE role = $1 ORDER BY id';
    const result = await pool.query(query, [role]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No ${role}s found in database` });
    }
    
    // Return a random user from database
    const users = result.rows;
    const selectedUser = users[Math.floor(Math.random() * users.length)];
    
    // Format response to match frontend expectations
    const formattedUser = {
      id: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
      ...(role === 'student' && { student_id: selectedUser.register_number }),
      ...(role === 'teacher' && { department: 'Computer Science' }) // Default department
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error('Error in database login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mock users (for demo purposes) - now returns real database users
app.get('/api/mock-users', async (req, res) => {
  try {
    const teachersQuery = 'SELECT id, full_name as name, email, role FROM users WHERE role = $1 ORDER BY id';
    const studentsQuery = 'SELECT id, full_name as name, email, register_number as student_id, role FROM users WHERE role = $1 ORDER BY id';
    
    const [teachersResult, studentsResult] = await Promise.all([
      pool.query(teachersQuery, ['teacher']),
      pool.query(studentsQuery, ['student'])
    ]);
    
    const mockUsers = {
      teachers: teachersResult.rows.map(teacher => ({
        ...teacher,
        department: 'Computer Science' // Default department
      })),
      students: studentsResult.rows
    };
    
    res.json(mockUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generated MCQs endpoint - receives POST with session_id & MCQs
app.post('/api/generated-mcqs', async (req, res) => {
  try {
    const { session_id, mcqs } = req.body;
    
    if (!session_id || !mcqs || !Array.isArray(mcqs)) {
      return res.status(400).json({ error: 'session_id and mcqs array are required' });
    }
    
    console.log(`Received ${mcqs.length} MCQs for session ${session_id}`);
    
    // Store MCQs in database and add to queue
    const insertedMCQs = [];
    
    for (const mcq of mcqs) {
      const insertQuery = `
        INSERT INTO generated_mcqs (session_id, question, options, correct_answer, explanation, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        session_id,
        mcq.question,
        JSON.stringify(mcq.options),
        mcq.correct_answer,
        mcq.explanation || ''
      ]);
      
      insertedMCQs.push(result.rows[0]);
    }
    
    res.json({
      success: true,
      message: `Successfully stored ${insertedMCQs.length} MCQs`,
      mcqs: insertedMCQs
    });
    
  } catch (error) {
    console.error('Error storing generated MCQs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Session participant management endpoints
app.post('/api/sessions/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id, websocket_id } = req.body;
    
    const query = `
      INSERT INTO session_participants (session_id, student_id, connection_status, websocket_id, is_active)
      VALUES ((SELECT id FROM sessions WHERE session_id = $1), $2, 'online', $3, true)
      ON CONFLICT (session_id, student_id) 
      DO UPDATE SET 
        connection_status = 'online',
        joined_at = CURRENT_TIMESTAMP,
        left_at = NULL,
        is_active = true,
        websocket_id = $3,
        last_activity = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [sessionId, student_id, websocket_id]);
    
    // Broadcast participant count update
    const countQuery = `
      SELECT COUNT(*) as count FROM session_participants sp
      JOIN sessions s ON sp.session_id = s.id
      WHERE s.session_id = $1 AND sp.is_active = true AND sp.connection_status = 'online'
    `;
    const countResult = await pool.query(countQuery, [sessionId]);
    
    broadcastToSession(sessionId, {
      type: 'participant-count-updated',
      count: parseInt(countResult.rows[0].count)
    });
    
    res.json({ success: true, participant: result.rows[0] });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sessions/:sessionId/leave', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id } = req.body;
    
    const query = `
      UPDATE session_participants 
      SET 
        connection_status = 'offline',
        left_at = CURRENT_TIMESTAMP,
        is_active = false,
        websocket_id = NULL,
        last_activity = CURRENT_TIMESTAMP
      WHERE session_id = (SELECT id FROM sessions WHERE session_id = $1) 
      AND student_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [sessionId, student_id]);
    
    // Broadcast participant count update
    const countQuery = `
      SELECT COUNT(*) as count FROM session_participants sp
      JOIN sessions s ON sp.session_id = s.id
      WHERE s.session_id = $1 AND sp.is_active = true AND sp.connection_status = 'online'
    `;
    const countResult = await pool.query(countQuery, [sessionId]);
    
    broadcastToSession(sessionId, {
      type: 'participant-count-updated',
      count: parseInt(countResult.rows[0].count)
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sessions/:sessionId/leave', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id } = req.body;
    
    const query = `
      UPDATE session_participants 
      SET 
        connection_status = 'offline',
        left_at = CURRENT_TIMESTAMP,
        is_active = false,
        websocket_id = NULL,
        last_activity = CURRENT_TIMESTAMP
      WHERE session_id = (SELECT id FROM sessions WHERE session_id = $1) 
      AND student_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [sessionId, student_id]);
    
    // Broadcast participant count update
    const countQuery = `
      SELECT COUNT(*) as count FROM session_participants sp
      JOIN sessions s ON sp.session_id = s.id
      WHERE s.session_id = $1 AND sp.is_active = true AND sp.connection_status = 'online'
    `;
    const countResult = await pool.query(countQuery, [sessionId]);
    
    broadcastToSession(sessionId, {
      type: 'participant-count-updated',
      count: parseInt(countResult.rows[0].count)
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update connection status
app.post('/api/sessions/:sessionId/update-connection', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id, connection_status } = req.body;
    
    const query = `
      UPDATE session_participants 
      SET 
        connection_status = $3,
        last_activity = CURRENT_TIMESTAMP
      WHERE session_id = (SELECT id FROM sessions WHERE session_id = $1) 
      AND student_id = $2
      RETURNING *
    `;
    
    await pool.query(query, [sessionId, student_id, connection_status]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating connection status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update last activity
app.post('/api/sessions/:sessionId/update-activity', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { student_id } = req.body;
    
    const query = `
      UPDATE session_participants 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE session_id = (SELECT id FROM sessions WHERE session_id = $1) 
      AND student_id = $2
      RETURNING *
    `;
    
    await pool.query(query, [sessionId, student_id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating last activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Automatic cleanup of inactive participants (runs every 5 minutes)
setInterval(async () => {
  try {
    const cleanupQuery = `
      UPDATE session_participants 
      SET 
        is_active = false,
        connection_status = 'offline'
      WHERE 
        last_activity < NOW() - INTERVAL '5 minutes' 
        AND is_active = true
        AND connection_status = 'online'
      RETURNING session_id
    `;
    
    const result = await pool.query(cleanupQuery);
    
    if (result.rows.length > 0) {
      console.log(`Cleaned up ${result.rows.length} inactive participants`);
      
      // Broadcast updates to affected sessions
      const sessionIds = [...new Set(result.rows.map(row => row.session_id))];
      
      for (const sessionId of sessionIds) {
        const countQuery = `
          SELECT s.session_id, COUNT(*) as count 
          FROM session_participants sp
          JOIN sessions s ON sp.session_id = s.id
          WHERE s.id = $1 AND sp.is_active = true AND sp.connection_status = 'online'
          GROUP BY s.session_id
        `;
        const countResult = await pool.query(countQuery, [sessionId]);
        
        if (countResult.rows.length > 0) {
          broadcastToSession(countResult.rows[0].session_id, {
            type: 'participant-count-updated',
            count: parseInt(countResult.rows[0].count)
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during automatic cleanup:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// AI Tutor endpoint (connects to your n8n workflow)
app.post('/api/tutor', async (req, res) => {
  try {
    const { question, mode } = req.body;
    
    if (!question || !mode) {
      return res.status(400).json({ error: 'Question and mode are required' });
    }

    console.log('Forwarding request to n8n:', `mode='${mode}'`);
    
    // Forward to n8n workflow
    const n8nResponse = await fetch('YOUR_N8N_WEBHOOK_URL_HERE', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question,
        mode: mode,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N request failed with status ${n8nResponse.status}`);
    }

    const result = await n8nResponse.json();
    res.json(result);
  } catch (error) {
    console.error('Error forwarding request to n8n:', error.message);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`Backend server with WebSocket is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});

module.exports = { app, server, wss };

