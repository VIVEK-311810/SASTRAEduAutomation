import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const PollInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [activePoll, setActivePoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pollLoading, setPollLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  // Use useRef to store the interval IDs to clear them properly
  const pollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const lastPollIdRef = useRef(null); // Track the last poll ID to prevent unnecessary updates

  // Function to clear all intervals
  const clearAllIntervals = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
    fetchSession();
    
    // Initial check for active poll
    checkForActivePoll();
    
    // Poll for active polls every 3 seconds
    pollIntervalRef.current = setInterval(checkForActivePoll, 3000);
    
    // Cleanup intervals on component unmount
    return () => {
      clearAllIntervals();
    };
  }, [sessionId, currentUser, navigate]);

  useEffect(() => {
    if (activePoll && activePoll.time_limit && !hasResponded) {
      // Clear any existing timer before starting a new one
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Calculate initial timeLeft based on activated_at and time_limit
      const activatedTime = new Date(activePoll.activated_at).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - activatedTime) / 1000);
      const remaining = activePoll.time_limit - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        // Poll is already expired, mark as responded to prevent interaction
        setHasResponded(true);
      } else {
        setTimeLeft(remaining);
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
              setHasResponded(true); // Mark as responded when time runs out
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else if (hasResponded || !activePoll) {
      // If responded or no active poll, clear the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    // Cleanup timer when component unmounts or dependencies change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activePoll, hasResponded]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        alert('Session not found');
        navigate('/student/join');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForActivePoll = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/active-poll`);
      if (response.ok) {
        const poll = await response.json();
        
        // Only update if it's a new poll or the existing one has changed
        if (!activePoll || activePoll.id !== poll.id) {
          setActivePoll(poll);
          setHasResponded(false); // Reset response status for new poll
          setSelectedOption(null);
          lastPollIdRef.current = poll.id; // Update last poll ID
        }
      } else {
        // No active poll, clear current poll state only if we had one
        if (activePoll) {
          setActivePoll(null);
          setHasResponded(false);
          setSelectedOption(null);
          lastPollIdRef.current = null;
        }
      }
    } catch (error) {
      // No active poll or error - this is normal, just ensure state is cleared
      if (activePoll) {
        setActivePoll(null);
        setHasResponded(false);
        setSelectedOption(null);
        lastPollIdRef.current = null;
      }
    }
  };

  const submitResponse = async () => {
    if (selectedOption === null || hasResponded || pollLoading) return;

    setPollLoading(true);
    try {
      const responseTime = activePoll.time_limit - timeLeft;
      const response = await fetch(`http://localhost:3001/api/polls/${activePoll.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: currentUser.id,
          selected_option: selectedOption,
          response_time: responseTime,
        }),
      });

      if (response.ok) {
        setHasResponded(true);
        
        // Stop the timer immediately after successful submission
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // Temporarily stop polling for new polls to avoid immediate refresh issues
        // The main useEffect will restart it after a delay or on next poll activation
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        alert('Response submitted successfully!');
      } else {
        const error = await response.json();
        if (error.error === 'Already responded to this poll') {
          setHasResponded(true);
          alert('You have already responded to this poll.');
        } else {
          alert('Error submitting response: ' + error.error);
        }
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response. Please try again.');
    } finally {
      setPollLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner text="Loading session..." />;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Session Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
            <p className="text-gray-600">{session.course_name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary-600">ID: {session.session_id}</div>
            <button
              onClick={() => navigate(`/student/session/${sessionId}/resources`)}
              className="btn-secondary text-sm mt-2"
            >
              View Resources
            </button>
          </div>
        </div>
      </div>

      {/* Poll Interface */}
      {activePoll ? (
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Live Poll</h2>
            {timeLeft > 0 && !hasResponded && (
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-500">Time remaining</div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{activePoll.question}</h3>
            
            <div className="space-y-3">
              {activePoll.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !hasResponded && !pollLoading && timeLeft > 0 && setSelectedOption(index)}
                  disabled={hasResponded || timeLeft === 0 || pollLoading}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedOption === index
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    hasResponded || timeLeft === 0 || pollLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="text-gray-800">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!hasResponded && timeLeft > 0 && (
            <button
              onClick={submitResponse}
              disabled={selectedOption === null || pollLoading}
              className="btn-primary w-full py-3"
            >
              {pollLoading ? 'Submitting...' : 'Submit Response'}
            </button>
          )}

          {hasResponded && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 font-medium">Response submitted successfully!</span>
              </div>
              {activePoll.justification && (
                <div className="mt-3 text-sm text-green-700">
                  <strong>Explanation:</strong> {activePoll.justification}
                </div>
              )}
            </div>
          )}

          {timeLeft === 0 && !hasResponded && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-red-800 font-medium">Time's up! You can no longer respond to this poll.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Waiting for the next poll...</h3>
          <p className="text-gray-500">Your teacher will send polls during the session. Stay tuned!</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="text-primary-600 hover:text-primary-800 text-sm"
        >
          ← Back to dashboard
        </button>
      </div>
    </div>
  );
};

export default PollInterface;