# Educational Platform - SQL Files Documentation

## Overview

This directory contains comprehensive SQL files for the Educational Platform database management, debugging, and testing. Each file serves a specific purpose in the development and maintenance workflow.

## File Structure

### Core Database Files

#### `01_database_schema.sql`
**Purpose**: Complete database structure creation
- Creates all tables with proper relationships
- Includes indexes for performance optimization
- Sets up triggers for auto-generation (session IDs, timestamps)
- Creates views for common queries
- Includes comprehensive documentation and comments

**When to use**: 
- Initial database setup
- After complete database reset
- When deploying to new environment

#### `02_demo_users.sql`
**Purpose**: Create demo users for testing and development
- 5 demo teachers across different departments
- 25 demo students with realistic data
- Proper role assignments and department associations
- Dummy password hashes for security

**When to use**:
- Development environment setup
- Testing user authentication
- Demonstrating multi-user functionality

#### `03_demo_sessions.sql`
**Purpose**: Create realistic demo sessions with participants and polls
- Multiple sessions across different subjects
- Students joined to various sessions
- Sample polls with different question types
- Mix of active and inactive sessions

**When to use**:
- Testing session management features
- Demonstrating teacher-student interactions
- Populating dashboard with realistic data

#### `04_student_data.sql`
**Purpose**: Create student-specific demo data including poll responses
- Realistic poll response patterns
- Historical activity data
- Performance variations across students
- Recent activity for dashboard testing

**When to use**:
- Testing student dashboard functionality
- Demonstrating analytics and statistics
- Creating realistic user activity patterns

### Maintenance Files

#### `05_reset_database.sql`
**Purpose**: Complete database reset and cleanup
- Safely deletes all data while preserving structure
- Resets auto-increment sequences
- Includes verification and safety checks
- Optional complete schema recreation

**When to use**:
- Starting fresh development cycle
- Cleaning up test data
- Preparing for production deployment
- Troubleshooting data corruption

#### `06_debug_queries.sql`
**Purpose**: Comprehensive debugging and monitoring queries
- Student dashboard data queries
- System health checks
- Performance monitoring
- Data consistency verification
- Troubleshooting orphaned records

**When to use**:
- Debugging student dashboard issues
- Monitoring system performance
- Investigating data inconsistencies
- Creating API endpoints

#### `07_test_scenarios.sql`
**Purpose**: Create specific test scenarios for edge cases
- New student with no activity
- Highly active student
- Poor performance student
- Empty sessions
- Live polling scenarios
- Multiple session participation

**When to use**:
- Testing edge cases
- Validating application behavior
- Creating specific test conditions
- Quality assurance testing

## Usage Workflow

### Initial Setup
```sql
-- 1. Create database structure
\i 01_database_schema.sql

-- 2. Add demo users
\i 02_demo_users.sql

-- 3. Create demo sessions
\i 03_demo_sessions.sql

-- 4. Add student activity data
\i 04_student_data.sql
```

### Development Testing
```sql
-- Create specific test scenarios
\i 07_test_scenarios.sql

-- Use debug queries for troubleshooting
\i 06_debug_queries.sql
```

### Reset and Cleanup
```sql
-- Complete reset when needed
\i 05_reset_database.sql

-- Then re-run setup files as needed
```

## Student Dashboard API Integration

The debug queries in `06_debug_queries.sql` are specifically designed to support the student dashboard API endpoints:

### API Endpoint Mappings

| API Endpoint | SQL Query | Purpose |
|--------------|-----------|---------|
| `GET /api/students/:id/sessions` | Query 1 | Get student's joined sessions |
| `GET /api/students/:id/activity` | Query 2 | Get recent activity feed |
| `GET /api/students/:id/stats` | Query 3 | Get dashboard statistics |
| `GET /api/students/:id/active-polls` | Query 4 | Get active polls for student |

### Example Usage in Node.js

```javascript
// Get student sessions
app.get('/api/students/:studentId/sessions', async (req, res) => {
  const { studentId } = req.params;
  // Use Query 1 from 06_debug_queries.sql
  const result = await pool.query(`
    SELECT s.id as session_id, s.session_id as join_code, s.title...
    WHERE sp.student_id = $1 AND sp.is_active = true
    ORDER BY sp.joined_at DESC
  `, [studentId]);
  res.json(result.rows);
});
```

## Data Relationships

### Key Tables
- **users**: Teachers and students
- **sessions**: Class sessions created by teachers
- **session_participants**: Students joined to sessions
- **polls**: Questions created by teachers
- **poll_responses**: Student answers to polls

### Important Views
- **active_sessions_with_participants**: Sessions with participant counts
- **student_session_details**: Student participation details
- **poll_statistics**: Poll performance analytics

## Security Considerations

### Demo Data
- All demo passwords use dummy hashes
- Email addresses use `.edu` domains for identification
- No real personal information included

### Production Deployment
- Remove all demo data before production
- Use proper password hashing
- Implement proper authentication
- Set up database access controls

## Performance Optimization

### Indexes Created
- User email and role indexes
- Session ID and teacher indexes
- Participant session and student indexes
- Poll response timing indexes

### Query Optimization
- Views for common query patterns
- Efficient joins and aggregations
- Proper use of LIMIT and ORDER BY

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   - Check data insertion order
   - Verify referenced records exist
   - Use debug queries to find orphaned records

2. **Performance Issues**
   - Check index usage with EXPLAIN
   - Monitor query execution times
   - Use performance monitoring queries

3. **Data Inconsistencies**
   - Run troubleshooting queries (Query 9-10)
   - Check for orphaned records
   - Verify constraint compliance

### Debug Process
1. Run system health check (Query 12)
2. Check for data inconsistencies (Query 9-10)
3. Review recent activity (Query 11)
4. Use specific student queries for dashboard issues

## File Dependencies

```
01_database_schema.sql (foundation)
├── 02_demo_users.sql (requires schema)
├── 03_demo_sessions.sql (requires users)
├── 04_student_data.sql (requires sessions)
└── 07_test_scenarios.sql (requires all above)

06_debug_queries.sql (independent, works with any data)
05_reset_database.sql (independent, cleans everything)
```

## Version Control

- All files include version numbers and update dates
- Changes should be documented in file headers
- Test all files after modifications
- Maintain backward compatibility when possible

## Support

For issues or questions:
1. Check debug queries for data verification
2. Review troubleshooting section
3. Examine query execution plans
4. Verify data relationships and constraints

---

**Author**: Manus AI  
**Version**: 1.0  
**Last Updated**: 2025-01-02

