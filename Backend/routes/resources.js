const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create a new resource
router.post('/', async (req, res) => {
  try {
    const { session_id, title, description, resource_type, content, file_url } = req.body;
    
    if (!session_id || !title || !resource_type) {
      return res.status(400).json({ error: 'Missing required fields: session_id, title, resource_type' });
    }

    // Validate resource type
    const validTypes = ['note', 'document', 'link', 'transcript'];
    if (!validTypes.includes(resource_type)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }

    // Verify session exists
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [session_id.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Validate required fields based on resource type
    if (resource_type === 'link' && !file_url) {
      return res.status(400).json({ error: 'file_url is required for link resources' });
    }

    if (resource_type === 'note' && !content) {
      return res.status(400).json({ error: 'content is required for note resources' });
    }

    const result = await pool.query(
      'INSERT INTO session_resources (session_id, title, description, resource_type, content, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [session_id.toUpperCase(), title, description, resource_type, content, file_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resource by ID
router.get('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM session_resources WHERE id = $1',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a resource
router.put('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { title, description, content, file_url } = req.body;
    
    // Check if resource exists
    const resourceCheck = await pool.query(
      'SELECT * FROM session_resources WHERE id = $1',
      [resourceId]
    );

    if (resourceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const result = await pool.query(
      'UPDATE session_resources SET title = COALESCE($1, title), description = COALESCE($2, description), content = COALESCE($3, content), file_url = COALESCE($4, file_url), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [title, description, content, file_url, resourceId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a resource
router.delete('/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM session_resources WHERE id = $1 RETURNING *',
      [resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully', resource: result.rows[0] });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resources by session ID (this is also available via sessions route)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM session_resources WHERE session_id = $1 ORDER BY created_at DESC',
      [sessionId.toUpperCase()]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching session resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get resources by type
router.get('/session/:sessionId/type/:resourceType', async (req, res) => {
  try {
    const { sessionId, resourceType } = req.params;
    
    // Validate resource type
    const validTypes = ['note', 'document', 'link', 'transcript'];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }
    
    const result = await pool.query(
      'SELECT * FROM session_resources WHERE session_id = $1 AND resource_type = $2 ORDER BY created_at DESC',
      [sessionId.toUpperCase(), resourceType]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources by type:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk create resources (useful for importing multiple resources at once)
router.post('/bulk', async (req, res) => {
  try {
    const { session_id, resources } = req.body;
    
    if (!session_id || !Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ error: 'session_id and resources array are required' });
    }

    // Verify session exists
    const sessionResult = await pool.query(
      'SELECT * FROM sessions WHERE session_id = $1',
      [session_id.toUpperCase()]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const validTypes = ['note', 'document', 'link', 'transcript'];
    const createdResources = [];

    // Validate all resources first
    for (const resource of resources) {
      if (!resource.title || !resource.resource_type) {
        return res.status(400).json({ error: 'Each resource must have title and resource_type' });
      }
      
      if (!validTypes.includes(resource.resource_type)) {
        return res.status(400).json({ error: `Invalid resource type: ${resource.resource_type}` });
      }
    }

    // Create all resources
    for (const resource of resources) {
      const result = await pool.query(
        'INSERT INTO session_resources (session_id, title, description, resource_type, content, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          session_id.toUpperCase(),
          resource.title,
          resource.description || null,
          resource.resource_type,
          resource.content || null,
          resource.file_url || null
        ]
      );
      createdResources.push(result.rows[0]);
    }

    res.status(201).json({
      message: `Successfully created ${createdResources.length} resources`,
      resources: createdResources
    });
  } catch (error) {
    console.error('Error bulk creating resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search resources within a session
router.get('/session/:sessionId/search', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    let query = `
      SELECT * FROM session_resources 
      WHERE session_id = $1 
      AND (title ILIKE $2 OR description ILIKE $2 OR content ILIKE $2)
    `;
    let params = [sessionId.toUpperCase(), `%${q}%`];

    // Add resource type filter if specified
    if (type) {
      const validTypes = ['note', 'document', 'link', 'transcript'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid resource type filter' });
      }
      query += ' AND resource_type = $3';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      query: q,
      type: type || 'all',
      count: result.rows.length,
      resources: result.rows
    });
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

