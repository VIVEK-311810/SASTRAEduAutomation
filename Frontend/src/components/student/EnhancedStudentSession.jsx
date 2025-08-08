import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const EnhancedStudentSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePoll, setActivePoll] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pollResults, setPollResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    // Temporarily disable auth check for testing
    // if (!currentUser || currentUser.role !== 'student') {
    //   navigate('/auth');
    //   return;
    // }
    console.log('Loading session:', sessionId);
    fetchSession();
    joinSession();
    // Set up real WebSocket connection for real-time updates
    setupWebSocketConnection();
  }, [sessionId, navigate]);

  useEffect(() => {
    let timer;
    if (activePoll && timeRemaining > 0 && !hasAnswered) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activePoll, timeRemaining, hasAnswered]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        setConnectionStatus('connected');
        // Fetch real participants after session is loaded
        fetchParticipants();
      } else {
        console.error('Session not found:', response.status);
        setSession(null);
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      if (!currentUser || !currentUser.id) {
        console.error('No valid user found, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      const studentId = currentUser.id;
      
      console.log('Joining session:', sessionId, 'as student:', studentId);
      
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully joined session:', data);
      } else {
        console.error('Failed to join session:', response.status);
      }
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      } else {
        console.error('Failed to fetch participants:', response.status);
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    }
  };

  const leaveSession = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      if (currentUser && currentUser.id) {
        const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/leave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: currentUser.id,
          }),
        });

        if (response.ok) {
          console.log('Successfully left session');
        } else {
          console.error('Failed to leave session:', response.status);
        }
      }
    } catch (error) {
      console.error('Error leaving session:', error);
    } finally {
      // Navigate to dashboard regardless of API success
      navigate('/student/dashboard');
    }
  };

  const setupWebSocketConnection = () => {
    // Set up real WebSocket connection
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      
      // Join the session room and update connection status
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        ws.send(JSON.stringify({
          type: 'join-session',
          sessionId: sessionId,
          studentId: currentUser.id
        }));
        
        // Update connection status in database
        updateConnectionStatus('online');
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      switch (data.type) {
        case 'poll-activated':
          setActivePoll(data.poll);
          setTimeRemaining(data.poll.timeLimit || 60);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setShowResults(false);
          break;
          
        case 'poll-deactivated':
          setActivePoll(null);
          break;
          
        case 'poll-results':
          setShowResults(true);
          break;
          
        case 'participant-count-updated':
          // Refresh participants list when count changes
          fetchParticipants();
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      // Update connection status in database
      updateConnectionStatus('offline');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      // Update connection status in database
      updateConnectionStatus('offline');
    };

    // Set up heartbeat to maintain connection and update activity
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          sessionId: sessionId,
          studentId: JSON.parse(localStorage.getItem('currentUser') || '{}').id
        }));
        // Update last activity in database
        updateLastActivity();
      }
    }, 30000); // Every 30 seconds

    // Cleanup function
    const cleanup = () => {
      clearInterval(heartbeatInterval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    // Store WebSocket reference and cleanup function
    return { ws, cleanup };
  };

  const updateConnectionStatus = async (status) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        await fetch(`http://localhost:3001/api/sessions/${sessionId}/update-connection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: currentUser.id,
            connection_status: status,
          }),
        });
      }
    } catch (error) {
      console.error('Error updating connection status:', error);
    }
  };

  const updateLastActivity = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id) {
        await fetch(`http://localhost:3001/api/sessions/${sessionId}/update-activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: currentUser.id,
          }),
        });
      }
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null) return;

    try {
      // Submit answer to real API
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      
      if (!currentUser || !currentUser.id) {
        console.error('No valid user found for answer submission');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/polls/${activePoll.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: currentUser.id,
          session_id: sessionId,
          selected_option: selectedAnswer,
        }),
      });

      if (response.ok) {
        setHasAnswered(true);
        console.log('Answer submitted successfully');
        // Update activity after poll response
        updateLastActivity();
      } else {
        console.error('Failed to submit answer:', response.status);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleTimeUp = () => {
    if (!hasAnswered) {
      setHasAnswered(true);
      // Auto-submit or mark as no answer
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptionColor = (index) => {
    if (!showResults) {
      return selectedAnswer === index 
        ? 'bg-blue-100 border-blue-500 text-blue-900' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';
    }

    if (pollResults.correctAnswer === index) {
      return 'bg-green-100 border-green-500 text-green-900';
    }
    
    if (pollResults.userAnswer === index && index !== pollResults.correctAnswer) {
      return 'bg-red-100 border-red-500 text-red-900';
    }

    return 'bg-gray-50 border-gray-300 text-gray-600';
  };

  if (loading) {
    return <LoadingSpinner text="Joining session..." />;
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Session Not Found</h2>
          <p className="text-red-600 mb-4">The session you're trying to join doesn't exist or has ended.</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <p className="text-gray-600 mt-1">{session.course_name}</p>
            <p className="text-sm text-gray-500 mt-2">Teacher: {session.teacher_name || 'Loading...'}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{session.session_id}</div>
                <div className="text-xs text-gray-500">Session ID</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {connectionStatus === 'connected' ? '🟢' : '🔴'}
                </div>
                <div className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{participants.length}</div>
                <div className="text-xs text-gray-500">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Poll */}
      {activePoll ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Live Poll</h2>
            {!hasAnswered && timeRemaining > 0 && (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`font-bold ${timeRemaining <= 10 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{activePoll.question}</h3>
            
            <div className="space-y-3">
              {activePoll.options.map((option, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => !hasAnswered && setSelectedAnswer(index)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${getOptionColor(index)} ${
                      hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </div>
                      {showResults && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {pollResults.distribution[index]}%
                          </span>
                          {pollResults.correctAnswer === index && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {showResults && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              pollResults.correctAnswer === index ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${pollResults.distribution[index]}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!hasAnswered && selectedAnswer !== null && timeRemaining > 0 && (
            <div className="flex justify-center">
              <button
                onClick={handleAnswerSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Submit Answer
              </button>
            </div>
          )}

          {hasAnswered && !showResults && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Answer submitted! Waiting for results...</span>
              </div>
            </div>
          )}

          {showResults && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Poll Results</h4>
                <p className="text-sm text-gray-600">{pollResults.totalResponses} students responded</p>
              </div>
              
              <div className="text-center">
                {pollResults.isCorrect ? (
                  <div className="inline-flex items-center space-x-2 text-green-600 font-medium">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Correct! Well done!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 text-red-600 font-medium">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Incorrect. The correct answer was {String.fromCharCode(65 + pollResults.correctAnswer)}.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Waiting for teacher</h3>
          <p className="text-gray-500">The teacher will start polls and activities soon</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Participants ({participants.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">
                  {participant.name.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-gray-700 truncate">{participant.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Controls */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Controls</h3>
            <p className="text-sm text-gray-600">Manage your participation</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={leaveSession}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Leave Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentSession;

