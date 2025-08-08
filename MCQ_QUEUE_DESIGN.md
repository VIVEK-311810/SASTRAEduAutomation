# MCQ Queue System Design

## 🎯 **PROBLEM STATEMENT**

Currently, when teachers send bulk MCQs to students, all MCQs are activated simultaneously as live polls. This creates several issues:

1. **Student Overwhelm**: Multiple active polls confuse students
2. **Poor UX**: Students don't know which poll to answer first
3. **Data Quality**: Rushed responses due to multiple simultaneous polls
4. **Teacher Control**: No way to manage poll sequencing

## 🏗️ **PROPOSED SOLUTION: INTELLIGENT MCQ QUEUE**

### **Core Concept**
Implement a queuing system that:
- **Queues MCQs** when sent in bulk
- **Activates one poll at a time** automatically
- **Provides teacher control** over queue management
- **Ensures smooth student experience** with sequential polling

### **Queue States**
```
QUEUED → ACTIVE → COMPLETED → ARCHIVED
```

## 📊 **DATABASE DESIGN**

### **Enhanced Polls Table**
```sql
ALTER TABLE polls ADD COLUMN queue_position INTEGER;
ALTER TABLE polls ADD COLUMN queue_status VARCHAR(20) DEFAULT 'queued';
-- queue_status: 'queued', 'active', 'completed', 'paused', 'cancelled'

CREATE INDEX idx_polls_queue ON polls(session_id, queue_status, queue_position);
```

### **Queue Management Table**
```sql
CREATE TABLE poll_queue_settings (
    session_id INTEGER PRIMARY KEY REFERENCES sessions(id),
    auto_advance BOOLEAN DEFAULT true,
    poll_duration INTEGER DEFAULT 60, -- seconds
    break_between_polls INTEGER DEFAULT 10, -- seconds
    max_concurrent_polls INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 **QUEUE LOGIC**

### **1. Bulk MCQ Sending**
```javascript
// When teacher sends bulk MCQs:
1. Create polls with queue_status = 'queued'
2. Assign queue_position (1, 2, 3, ...)
3. Auto-activate first poll (queue_position = 1)
4. Keep others in queue
```

### **2. Auto-Advancement**
```javascript
// When active poll completes:
1. Mark current poll as 'completed'
2. Find next poll in queue (queue_position + 1)
3. Activate next poll automatically
4. Send WebSocket/notification to students
```

### **3. Teacher Controls**
```javascript
// Teacher can:
- Pause queue (stop auto-advancement)
- Resume queue
- Skip current poll
- Reorder queue
- Add time between polls
- Cancel remaining polls
```

## 🎮 **USER EXPERIENCE**

### **Student Experience**
- **Single Active Poll**: Only one poll visible at a time
- **Queue Indicator**: "Poll 2 of 5" progress indicator
- **Smooth Transitions**: Automatic progression to next poll
- **Clear Instructions**: "Waiting for next poll..." messages

### **Teacher Experience**
- **Queue Dashboard**: Visual queue management interface
- **Real-time Control**: Pause, skip, reorder polls
- **Progress Tracking**: See which polls are completed
- **Flexible Settings**: Configure timing and behavior

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Backend Components**

#### **1. Queue Manager Service**
```javascript
class PollQueueManager {
    async addToQueue(sessionId, mcqs)
    async activateNext(sessionId)
    async pauseQueue(sessionId)
    async resumeQueue(sessionId)
    async skipCurrent(sessionId)
    async reorderQueue(sessionId, newOrder)
}
```

#### **2. Auto-Advancement Timer**
```javascript
// Background process to handle auto-advancement
setInterval(() => {
    checkCompletedPolls();
    advanceQueues();
}, 5000); // Check every 5 seconds
```

#### **3. Enhanced API Endpoints**
```
POST /api/sessions/:id/send-mcqs-queued    # Send MCQs to queue
GET  /api/sessions/:id/poll-queue          # Get queue status
POST /api/sessions/:id/queue/pause         # Pause queue
POST /api/sessions/:id/queue/resume        # Resume queue
POST /api/sessions/:id/queue/skip          # Skip current poll
PUT  /api/sessions/:id/queue/reorder       # Reorder queue
```

### **Frontend Components**

#### **1. Queue Management Dashboard**
```jsx
<QueueDashboard>
  <QueueProgress current={2} total={5} />
  <ActivePoll poll={currentPoll} />
  <QueueControls onPause={pauseQueue} onSkip={skipPoll} />
  <QueueList polls={queuedPolls} onReorder={reorderQueue} />
</QueueDashboard>
```

#### **2. Student Queue Interface**
```jsx
<StudentPollInterface>
  <QueueProgress current={2} total={5} />
  <ActivePoll poll={currentPoll} />
  <WaitingMessage>Waiting for next poll...</WaitingMessage>
</StudentPollInterface>
```

## ⚙️ **CONFIGURATION OPTIONS**

### **Queue Settings**
- **Auto-advance**: Automatically move to next poll
- **Poll Duration**: Default time limit for each poll
- **Break Duration**: Time between polls
- **Max Concurrent**: Number of simultaneous active polls
- **Notification Style**: How to notify students of new polls

### **Teacher Preferences**
- **Manual Control**: Teacher manually advances each poll
- **Timed Advancement**: Automatic advancement after time limit
- **Response-based**: Advance when X% of students respond
- **Hybrid Mode**: Combination of above

## 🎯 **BENEFITS**

### **For Students**
- ✅ **Reduced Confusion**: One poll at a time
- ✅ **Better Focus**: Can concentrate on current question
- ✅ **Clear Progress**: Know how many polls remaining
- ✅ **Improved Performance**: Better response quality

### **For Teachers**
- ✅ **Better Control**: Manage poll flow and timing
- ✅ **Real-time Monitoring**: See student engagement
- ✅ **Flexible Delivery**: Adjust pace based on class needs
- ✅ **Data Quality**: Better response rates and quality

### **For System**
- ✅ **Scalability**: Handle large numbers of MCQs efficiently
- ✅ **Performance**: Reduced server load from concurrent polls
- ✅ **Reliability**: Robust queue management
- ✅ **Maintainability**: Clean, organized poll delivery

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Database Schema**
- Add queue columns to polls table
- Create queue settings table
- Add necessary indexes

### **Phase 2: Backend Queue Logic**
- Implement PollQueueManager service
- Add queue API endpoints
- Create auto-advancement system

### **Phase 3: Frontend Queue Interface**
- Build teacher queue dashboard
- Update student poll interface
- Add queue progress indicators

### **Phase 4: Advanced Features**
- Add queue reordering
- Implement pause/resume
- Add configuration options

This design ensures a smooth, controlled, and user-friendly experience for both teachers and students when dealing with bulk MCQ distribution.

