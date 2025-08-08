import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinSession = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
  }, [navigate]);

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!sessionId.trim()) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const studentId = currentUser?.id || 101; // Use current user ID or fallback

    setLoading(true);
    try {
      // Directly attempt to join the session. The backend will handle existence and activity.
      const joinResponse = await fetch(`http://localhost:3001/api/sessions/${sessionId.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
        }),
      });

      // Check if response is JSON
      const contentType = joinResponse.headers.get('content-type');
      let joinData;
      
      if (contentType && contentType.includes('application/json')) {
        joinData = await joinResponse.json();
      } else {
        // If not JSON, treat as error but still allow navigation for demo
        console.warn('Non-JSON response received, proceeding with demo navigation');
        joinData = null;
      }
      
      if (joinResponse.ok && joinData && joinData.session) {
        // Backend returns the session object directly in joinData.session
        const sessionData = joinData.session; 

        // Store session info for quick access
        const sessionInfo = {
          sessionId: sessionData.session_id,
          title: sessionData.title,
          course_name: sessionData.course_name,
          joinedAt: new Date().toISOString(),
        };
        
        const existingSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');
        const updatedSessions = existingSessions.filter(s => s.sessionId !== sessionData.session_id);
        updatedSessions.unshift(sessionInfo);
        localStorage.setItem('joinedSessions', JSON.stringify(updatedSessions.slice(0, 10))); // Keep last 10

        alert(`Successfully joined "${sessionData.title}"!`);
        navigate(`/student/session/${sessionData.session_id}`);
      } else {
        // For demo purposes, if API fails but session ID is provided, navigate anyway
        console.log('API response not successful, using demo navigation');
        
        // Store demo session info
        const demoSessionInfo = {
          sessionId: sessionId.toUpperCase(),
          title: "Demo Session",
          course_name: "Educational Platform Demo",
          joinedAt: new Date().toISOString(),
        };
        
        const existingSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');
        const updatedSessions = existingSessions.filter(s => s.sessionId !== sessionId.toUpperCase());
        updatedSessions.unshift(demoSessionInfo);
        localStorage.setItem('joinedSessions', JSON.stringify(updatedSessions.slice(0, 10)));

        alert(`Joining session ${sessionId.toUpperCase()} in demo mode!`);
        navigate(`/student/session/${sessionId.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      
      // For demo purposes, still allow navigation even if API fails
      console.log('API call failed, using demo navigation fallback');
      
      // Store demo session info
      const demoSessionInfo = {
        sessionId: sessionId.toUpperCase(),
        title: "Demo Session",
        course_name: "Educational Platform Demo",
        joinedAt: new Date().toISOString(),
      };
      
      const existingSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');
      const updatedSessions = existingSessions.filter(s => s.sessionId !== sessionId.toUpperCase());
      updatedSessions.unshift(demoSessionInfo);
      localStorage.setItem('joinedSessions', JSON.stringify(updatedSessions.slice(0, 10)));

      alert(`Joining session ${sessionId.toUpperCase()} in demo mode!`);
      navigate(`/student/session/${sessionId.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const recentSessions = JSON.parse(localStorage.getItem('joinedSessions') || '[]');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Join a Session</h1>
        <p className="text-gray-600 mt-2">Enter the Session ID provided by your teacher</p>
      </div>

      <div className="card">
        <form onSubmit={handleJoinSession} className="space-y-6">
          <div>
            <label className="label">Session ID *</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              className="input-field text-center text-lg font-mono tracking-wider"
              placeholder="e.g., ABC123"
              maxLength="6"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Session IDs are 6 characters long (letters and numbers)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !sessionId.trim()}
            className="btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {recentSessions.slice(0, 5).map((session, index) => (
              <div key={index} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{session.title}</h3>
                    <p className="text-sm text-gray-600">{session.course_name}</p>
                    <p className="text-xs text-gray-500">ID: {session.sessionId}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/student/session/${session.sessionId}`)}
                      className="btn-primary text-sm"
                    >
                      Rejoin
                    </button>
                    <button
                      onClick={() => navigate(`/student/session/${session.sessionId}/resources`)}
                      className="btn-secondary text-sm"
                    >
                      Resources
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinSession;
