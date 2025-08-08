import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
import QueueManagement from './QueueManagement';

const EnhancedSessionManagement = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [participants, setParticipants] = useState([]);
  const [generatedMCQs, setGeneratedMCQs] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    justification: '',
    timeLimit: 60
  });
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Debug log for participants
  console.log('Participants type:', typeof participants, 'Value:', participants, 'IsArray:', Array.isArray(participants));

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'teacher') {
      navigate('/auth');
      return;
    }
    fetchSession();
    fetchParticipants();
    fetchPolls();
    fetchGeneratedMCQs();
    // In a real app, you'd set up WebSocket connection here for real-time updates
  }, [sessionId, navigate]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchSession = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        alert('Session not found');
        navigate('/teacher/dashboard');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/participants`);
      if (response.ok) {
        const data = await response.json();
        // Ensure data is always an array
        console.log('Fetched participants data:', data);
        setParticipants(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch participants');
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]); // Always fallback to empty array
    }
  };

  const fetchPolls = async () => {
    try {
      // This would be a real API call to get polls for the session
      setPolls([
        {
          id: 1,
          question: 'What is the purpose of useEffect hook?',
          options: ['To manage state', 'To handle side effects', 'To render components', 'To create components'],
          correctAnswer: 1,
          isActive: false,
          responses: 15,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };

  const fetchGeneratedMCQs = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/generated-mcqs`);
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and object with mcqs property
        const mcqs = data.mcqs || data;
        setGeneratedMCQs(Array.isArray(mcqs) ? mcqs : []);
      } else {
        console.error('Failed to fetch generated MCQs:', response.status);
        setGeneratedMCQs([]);
      }
    } catch (error) {
      console.error('Error fetching generated MCQs:', error);
      setGeneratedMCQs([]);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: newPoll.question,
          options: newPoll.options.filter(opt => opt.trim() !== ''),
          correct_answer: newPoll.correctAnswer,
          justification: newPoll.justification,
          time_limit: newPoll.timeLimit
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Poll created and added to queue:', data);
        
        // Reset form
        setNewPoll({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          justification: '',
          timeLimit: 60
        });
        
        alert('Poll created and added to queue! If queue was empty, it will be sent automatically.');
        
        // Refresh session data
        fetchSession();
        
        // Check if this should be sent immediately (if queue was empty)
        checkAndSendNextPoll();
        
      } else {
        const errorData = await response.json();
        console.error('Failed to create poll:', errorData);
        alert('Failed to create poll: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll');
    }
  };

  const checkAndSendNextPoll = async () => {
    try {
      // Check if there are any active polls
      const activeResponse = await fetch(`http://localhost:3001/api/sessions/${sessionId}/active-poll`);
      
      if (activeResponse.status === 404) {
        // No active poll, send the next one from queue
        const queueResponse = await fetch(`http://localhost:3001/api/sessions/${sessionId}/poll-queue`);
        
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          
          if (queueData.polls && queueData.polls.length > 0) {
            // Send the first poll in queue
            const nextPoll = queueData.polls[0];
            await activatePoll(nextPoll);
          }
        }
      }
    } catch (error) {
      console.error('Error checking poll queue:', error);
    }
  };

  const activatePoll = async (poll) => {
    try {
      const response = await fetch(`http://localhost:3001/api/polls/${poll.id}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        console.log('Poll activated and sent to students!');
        
        // Broadcast via WebSocket if available
        if (window.socket) {
          window.socket.send(JSON.stringify({
            type: 'activate-poll',
            sessionId: sessionId,
            poll: poll
          }));
        }
      }
    } catch (error) {
      console.error('Error activating poll:', error);
    }
  };

  const handleActivatePoll = async (pollId) => {
    try {
      // In a real app, this would activate the poll via API
      setPolls(polls.map(poll => ({
        ...poll,
        isActive: poll.id === pollId ? true : false
      })));
      setActivePoll(polls.find(p => p.id === pollId));
      alert('Poll activated! Students can now respond.');
    } catch (error) {
      console.error('Error activating poll:', error);
    }
  };

  const handleDeactivatePoll = async (pollId) => {
    try {
      setPolls(polls.map(poll => ({
        ...poll,
        isActive: false
      })));
      setActivePoll(null);
      alert('Poll deactivated.');
    } catch (error) {
      console.error('Error deactivating poll:', error);
    }
  };

  const updatePollOption = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleSendSelectedMCQs = async (mcqIds) => {
    try {
      // Show queue options dialog
      const queueOptions = await showQueueOptionsDialog();
      
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/send-mcqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mcq_ids: mcqIds,
          queueOptions: queueOptions
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully queued ${result.polls.length} MCQ${result.polls.length !== 1 ? 's' : ''}! ${result.message}`);
        // Refresh the generated MCQs list to remove sent ones
        fetchGeneratedMCQs();
        // Refresh polls to show the new ones
        fetchPolls();
        // Switch to queue tab to show the queue
        setActiveTab('queue');
      } else {
        const error = await response.json();
        alert(`Error sending MCQs: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending MCQs:', error);
      alert('Error sending MCQs to students');
    }
  };

  const showQueueOptionsDialog = () => {
    return new Promise((resolve) => {
      const autoAdvance = window.confirm('Enable auto-advance? (Polls will automatically move to the next one after time limit)\n\nClick OK for auto-advance, Cancel for manual control.');
      
      let pollDuration = 60;
      let breakBetweenPolls = 10;
      
      if (autoAdvance) {
        const durationInput = window.prompt('Poll duration in seconds (default: 60):', '60');
        if (durationInput && !isNaN(durationInput)) {
          pollDuration = parseInt(durationInput);
        }
        
        const breakInput = window.prompt('Break between polls in seconds (default: 10):', '10');
        if (breakInput && !isNaN(breakInput)) {
          breakBetweenPolls = parseInt(breakInput);
        }
      }
      
      resolve({
        autoAdvance,
        pollDuration,
        breakBetweenPolls,
        activateFirst: true
      });
    });
  };

  const handleEditMCQ = (mcq) => {
    setEditingMCQ({
      id: mcq.id,
      question: mcq.question,
      options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options),
      correctAnswer: mcq.correct_answer,
      justification: mcq.justification || '',
      timeLimit: mcq.time_limit || 60
    });
    setShowEditModal(true);
  };

  const handleUpdateMCQ = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/generated-mcqs/${editingMCQ.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: editingMCQ.question,
          options: editingMCQ.options,
          correct_answer: editingMCQ.correctAnswer,
          justification: editingMCQ.justification,
          time_limit: editingMCQ.timeLimit
        }),
      });

      if (response.ok) {
        alert('MCQ updated successfully!');
        setShowEditModal(false);
        setEditingMCQ(null);
        fetchGeneratedMCQs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error updating MCQ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating MCQ:', error);
      alert('Error updating MCQ');
    }
  };

  const handleDeleteMCQ = async (mcqId) => {
    if (!window.confirm('Are you sure you want to delete this MCQ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/generated-mcqs/${mcqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('MCQ deleted successfully!');
        fetchGeneratedMCQs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error deleting MCQ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting MCQ:', error);
      alert('Error deleting MCQ');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading session management..." />;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600 mt-1">{session.course_name}</p>
            <p className="text-sm text-gray-500 mt-2">{session.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{session.session_id}</div>
                <div className="text-sm text-gray-500">Session ID</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{participants.length}</div>
                <div className="text-sm text-gray-500">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{polls.length}</div>
                <div className="text-sm text-gray-500">Polls</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Poll Alert */}
      {activePoll && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-green-800 font-medium">Active Poll: {activePoll.question}</span>
            </div>
            <button
              onClick={() => handleDeactivatePoll(activePoll.id)}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              End Poll
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'polls', name: 'Polls', icon: '📝' },
              { id: 'generated-mcqs', name: 'Generated MCQs', icon: '🤖' },
              { id: 'queue', name: 'Poll Queue', icon: '📋' },
              { id: 'participants', name: 'Participants', icon: '👥' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Session Status</h3>
                  <p className="text-blue-700">
                    {session.is_active ? '🟢 Active' : '⚪ Inactive'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Live Participants</h3>
                  <p className="text-green-700">
                    {Array.isArray(participants) ? participants.filter(p => p.is_active && p.connection_status === 'online').length : 0} students online
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Recent Activity</h3>
                  <p className="text-purple-700">
                    {activePoll ? 'Poll in progress' : 'No active polls'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('polls')}
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <span className="text-2xl mr-3">📝</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create Poll</p>
                      <p className="text-sm text-gray-500">Ask students a question</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('participants')}
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors duration-200"
                  >
                    <span className="text-2xl mr-3">👥</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Participants</p>
                      <p className="text-sm text-gray-500">See who's online</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <span className="text-2xl mr-3">📈</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-500">Performance insights</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('generated-mcqs')}
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors duration-200"
                  >
                    <span className="text-2xl mr-3">🤖</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Generated MCQs</p>
                      <p className="text-sm text-gray-500">From automation workflow</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Polls Tab */}
          {activeTab === 'polls' && (
            <div className="space-y-6">
              {/* Create New Poll */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Poll</h3>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={newPoll.question}
                      onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter your question here..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    <div className="space-y-2">
                      {newPoll.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600 w-8">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            required
                          />
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={newPoll.correctAnswer === index}
                              onChange={() => setNewPoll({ ...newPoll, correctAnswer: index })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-600">Correct</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justification/Explanation
                    </label>
                    <textarea
                      value={newPoll.justification}
                      onChange={(e) => setNewPoll({ ...newPoll, justification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Explain why the correct answer is right..."
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (seconds)
                      </label>
                      <select
                        value={newPoll.timeLimit}
                        onChange={(e) => setNewPoll({ ...newPoll, timeLimit: parseInt(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={90}>1.5 minutes</option>
                        <option value={120}>2 minutes</option>
                        <option value={180}>3 minutes</option>
                      </select>
                    </div>
                    <div className="flex-1"></div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                    >
                      Create Poll
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Polls */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Polls</h3>
                {polls.length === 0 ? (
                  <p className="text-gray-500">No polls created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {polls.map((poll) => (
                      <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{poll.question}</h4>
                            <div className="space-y-1 mb-3">
                              {poll.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  <span className="text-sm text-gray-700">{option}</span>
                                  {poll.correctAnswer === index && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{poll.responses} responses</span>
                              <span>Created: {new Date(poll.createdAt).toLocaleString()}</span>
                              {poll.isActive && (
                                <span className="text-green-600 font-medium">🟢 Active</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {poll.isActive ? (
                              <button
                                onClick={() => handleDeactivatePoll(poll.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                End Poll
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivatePoll(poll.id)}
                                className="bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                              >
                                Activate
                              </button>
                            )}
                            <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                              Results
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated MCQs Tab */}
          {activeTab === 'generated-mcqs' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generated MCQs</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    MCQs automatically generated from your automation workflow
                  </p>
                </div>
                <button
                  onClick={fetchGeneratedMCQs}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {/* API Endpoint Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔗 Automation Webhook Endpoint</h4>
                <div className="bg-white rounded border p-3 font-mono text-sm">
                  <strong>POST</strong> http://localhost:3001/api/webhook/generated-mcqs
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  Send MCQs from your n8n workflow to this endpoint with session_id and mcqs array.
                </p>
              </div>

              {/* Generated MCQs List */}
              {!Array.isArray(generatedMCQs) || generatedMCQs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Generated MCQs Yet</h4>
                  <p className="text-gray-600 mb-4">
                    MCQs from your automation workflow will appear here when received.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>Make sure your n8n workflow sends MCQs to:</p>
                    <code className="bg-gray-200 px-2 py-1 rounded mt-1 inline-block">
                      POST /api/webhook/generated-mcqs
                    </code>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {Array.isArray(generatedMCQs) ? generatedMCQs.length : 0} MCQ{(Array.isArray(generatedMCQs) ? generatedMCQs.length : 0) !== 1 ? 's' : ''} received from automation
                    </p>
                    <button
                      onClick={() => handleSendSelectedMCQs(Array.isArray(generatedMCQs) ? generatedMCQs.map(mcq => mcq.id) : [])}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      disabled={!Array.isArray(generatedMCQs) || generatedMCQs.length === 0}
                    >
                      Send All to Students
                    </button>
                  </div>

                  {Array.isArray(generatedMCQs) && generatedMCQs.map((mcq, index) => (
                    <div key={mcq.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            MCQ #{index + 1}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Generated: {new Date(mcq.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMCQ(mcq)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMCQ(mcq.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleSendSelectedMCQs([mcq.id])}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors duration-200"
                          >
                            Send to Students
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Question:</h5>
                          <p className="text-gray-900">{mcq.question}</p>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Options:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(() => {
                              try {
                                const options = typeof mcq.options === 'string' ? JSON.parse(mcq.options) : mcq.options;
                                return Array.isArray(options) ? options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border ${
                                      optIndex === mcq.correct_answer
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <span className="font-medium">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>{' '}
                                    {option}
                                    {optIndex === mcq.correct_answer && (
                                      <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                    )}
                                  </div>
                                )) : <div className="text-red-500">Invalid options format</div>;
                              } catch (error) {
                                console.error('Error parsing options:', error);
                                return <div className="text-red-500">Error parsing options</div>;
                              }
                            })()}
                          </div>
                        </div>

                        {mcq.justification && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Justification:</h5>
                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                              {mcq.justification}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Session Participants ({Array.isArray(participants) ? participants.length : 0} total, {Array.isArray(participants) ? participants.filter(p => p.is_active && p.connection_status === 'online').length : 0} online)
                </h3>
                <button
                  onClick={fetchParticipants}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Refresh
                </button>
              </div>
              
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">No participants have joined yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Share session ID: <strong>{session.session_id}</strong></p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Online Participants */}
                  <div>
                    <h4 className="text-md font-medium text-green-800 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Online ({Array.isArray(participants) ? participants.filter(p => p.is_active && p.connection_status === 'online').length : 0})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(participants) ? participants
                        .filter(p => p.is_active && p.connection_status === 'online')
                        .map((participant) => (
                        <div key={participant.id} className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-medium">
                                  {participant.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{participant.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{participant.email || 'No email'}</p>
                              <p className="text-xs text-gray-500">
                                Last seen: {formatTimeAgo(participant.last_activity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )) : []}
                    </div>
                  </div>

                  {/* Offline Participants */}
                  {Array.isArray(participants) && participants.filter(p => !p.is_active || p.connection_status !== 'online').length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-600 mb-3 flex items-center">
                        <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                        Offline ({Array.isArray(participants) ? participants.filter(p => !p.is_active || p.connection_status !== 'online').length : 0})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.isArray(participants) ? participants
                          .filter(p => !p.is_active || p.connection_status !== 'online')
                          .map((participant) => (
                          <div key={participant.id} className="bg-white border border-gray-200 rounded-lg p-4 opacity-75">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {participant.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-700">{participant.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">{participant.email || 'No email'}</p>
                                <p className="text-xs text-gray-500">
                                  Last seen: {formatTimeAgo(participant.last_activity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )) : []}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div>
              <QueueManagement 
                sessionId={sessionId} 
                onQueueUpdate={(queueData) => {
                  // Handle queue updates if needed
                  console.log('Queue updated:', queueData);
                }}
              />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">Engagement Rate</h4>
                  <p className="text-3xl font-bold text-blue-700">85%</p>
                  <p className="text-sm text-blue-600 mt-1">Students actively participating</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-2">Average Score</h4>
                  <p className="text-3xl font-bold text-green-700">78%</p>
                  <p className="text-sm text-green-600 mt-1">Across all polls</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-2">Response Time</h4>
                  <p className="text-3xl font-bold text-purple-700">12s</p>
                  <p className="text-sm text-purple-600 mt-1">Average response time</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MCQ Edit Modal */}
      {showEditModal && editingMCQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit MCQ</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMCQ(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <textarea
                  value={editingMCQ.question}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, question: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter your question..."
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {editingMCQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={editingMCQ.correctAnswer === index}
                        onChange={() => setEditingMCQ({ ...editingMCQ, correctAnswer: index })}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const updatedOptions = [...editingMCQ.options];
                          updatedOptions[index] = e.target.value;
                          setEditingMCQ({ ...editingMCQ, options: updatedOptions });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select the radio button next to the correct answer
                </p>
              </div>

              {/* Justification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification (Optional)
                </label>
                <textarea
                  value={editingMCQ.justification}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, justification: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={editingMCQ.timeLimit}
                  onChange={(e) => setEditingMCQ({ ...editingMCQ, timeLimit: parseInt(e.target.value) || 60 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="10"
                  max="300"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleDeleteMCQ(editingMCQ.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Delete MCQ
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMCQ(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMCQ}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Update MCQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSessionManagement;

