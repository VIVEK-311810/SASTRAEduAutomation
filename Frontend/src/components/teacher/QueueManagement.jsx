import React, { useState, useEffect } from 'react';

const QueueManagement = ({ sessionId, onQueueUpdate }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueueData();
    // Set up polling for real-time updates
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchQueueData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/poll-queue`);
      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
        if (onQueueUpdate) {
          onQueueUpdate(data);
        }
      }
    } catch (error) {
      console.error('Error fetching queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseQueue = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/queue/pause`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error pausing queue:', error);
    }
  };

  const handleResumeQueue = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/queue/resume`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error resuming queue:', error);
    }
  };

  const handleSkipCurrent = async () => {
    if (!window.confirm('Are you sure you want to skip the current poll?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/queue/skip`, {
        method: 'POST',
      });
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error skipping current poll:', error);
    }
  };

  const handleAdvanceQueue = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/queue/advance`, {
        method: 'POST',
      });
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchQueueData();
      }
    } catch (error) {
      console.error('Error advancing queue:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'queued': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'queued': return '⏳';
      case 'completed': return '✅';
      case 'paused': return '⏸️';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!queueData || !queueData.queue || queueData.queue.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Poll Queue</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-600">No polls in queue</p>
          <p className="text-sm text-gray-500 mt-2">Send MCQs to students to see them here</p>
        </div>
      </div>
    );
  }

  const { status, queue } = queueData;
  const activePoll = queue.find(poll => poll.queue_status === 'active');
  const queuedPolls = queue.filter(poll => poll.queue_status === 'queued');
  const completedPolls = queue.filter(poll => poll.queue_status === 'completed');

  return (
    <div className="space-y-6">
      {/* Queue Status Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 Poll Queue Status</h3>
          <button
            onClick={fetchQueueData}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{status?.total_polls || 0}</div>
            <div className="text-sm text-gray-500">Total Polls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{status?.active_polls || 0}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{status?.queued_polls || 0}</div>
            <div className="text-sm text-gray-500">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{status?.completed_polls || 0}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        {status?.total_positions > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{status.current_position || 0} of {status.total_positions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((status.current_position || 0) / status.total_positions) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Queue Controls */}
        <div className="flex flex-wrap gap-2">
          {status?.auto_advance ? (
            <button
              onClick={handlePauseQueue}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              ⏸️ Pause Auto-Advance
            </button>
          ) : (
            <button
              onClick={handleResumeQueue}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              ▶️ Resume Auto-Advance
            </button>
          )}
          
          {activePoll && (
            <button
              onClick={handleSkipCurrent}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              ⏭️ Skip Current
            </button>
          )}
          
          {queuedPolls.length > 0 && !status?.auto_advance && (
            <button
              onClick={handleAdvanceQueue}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
            >
              ⏩ Advance Manually
            </button>
          )}
        </div>
      </div>

      {/* Active Poll */}
      {activePoll && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-green-900 flex items-center">
              🟢 Currently Active Poll
            </h4>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Position {activePoll.queue_position}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-gray-700 mb-1">Question:</h5>
              <p className="text-gray-900">{activePoll.question}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Array.isArray(activePoll.options) ? activePoll.options : JSON.parse(activePoll.options || '[]')).map((option, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded border ${
                    index === activePoll.correct_answer 
                      ? 'bg-green-100 border-green-300' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  {index === activePoll.correct_answer && <span className="ml-2 text-green-600">✓</span>}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Responses: {activePoll.response_count || 0}</span>
              <span>Time Limit: {activePoll.time_limit}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Queued Polls */}
      {queuedPolls.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">⏳ Upcoming Polls ({queuedPolls.length})</h4>
          
          <div className="space-y-3">
            {queuedPolls.map((poll, index) => (
              <div key={poll.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        #{poll.queue_position}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(poll.queue_status)}`}>
                        {getStatusIcon(poll.queue_status)} {poll.status_display}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{poll.question}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span>Time Limit: {poll.time_limit}s</span>
                  {poll.justification && (
                    <span className="ml-4">Has Justification</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Polls */}
      {completedPolls.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">✅ Completed Polls ({completedPolls.length})</h4>
          
          <div className="space-y-2">
            {completedPolls.slice(0, 5).map((poll) => (
              <div key={poll.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                    #{poll.queue_position}
                  </span>
                  <span className="text-gray-900 truncate max-w-md">
                    {poll.question.length > 60 ? poll.question.substring(0, 60) + '...' : poll.question}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {poll.response_count || 0} responses
                </div>
              </div>
            ))}
            
            {completedPolls.length > 5 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                ... and {completedPolls.length - 5} more completed polls
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;

