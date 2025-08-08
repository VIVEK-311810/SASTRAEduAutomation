import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joinedSessions, setJoinedSessions] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/auth');
      return;
    }
    // In a real app, you'd fetch sessions the student has joined
    // For now, we'll just show a placeholder or direct to join
    setLoading(false);
  }, [currentUser, navigate]);

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {currentUser.full_name}! Join a session or review resources.</p>
        </div>
        <button
          onClick={() => navigate('/student/join')}
          className="btn-primary"
        >
          Join New Session
        </button>
      </div>

      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Ready to learn?</h3>
        <p className="text-gray-500 mb-6">Enter a session ID to join your class and participate in live polls.</p>
        <button
          onClick={() => navigate('/student/join')}
          className="btn-primary"
        >
          Join a Session
        </button>
      </div>

      {/* Placeholder for joined sessions list */}
      {joinedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Joined Sessions</h2>
          <div className="grid gap-4">
            {/* Map through joinedSessions here */}
            {joinedSessions.map(session => (
              <div key={session.id} className="card">
                <h3 className="font-semibold">{session.title}</h3>
                <p className="text-sm text-gray-600">{session.course_name}</p>
                <button 
                  onClick={() => navigate(`/student/session/${session.session_id}`)}
                  className="btn-secondary mt-2"
                >
                  Rejoin Session
                </button>
                <button 
                  onClick={() => navigate(`/student/session/${session.session_id}/resources`)}
                  className="btn-secondary mt-2 ml-2"
                >
                  View Resources
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

