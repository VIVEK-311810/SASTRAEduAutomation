import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'teacher') {
      navigate('/auth');
      return;
    }
    fetchSessions();
  }, [currentUser, navigate]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/teacher/${currentUser.id}`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionStatusToggle = async (sessionId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchSessions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading your sessions..." />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your sessions and track student engagement</p>
        </div>
        <button
          onClick={() => navigate('/teacher/create-session')}
          className="btn-primary"
        >
          + Create New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">No sessions yet</h3>
          <p className="text-gray-500 mb-6">Create your first session to get started</p>
          <button
            onClick={() => navigate('/teacher/create-session')}
            className="btn-primary"
          >
            Create Session
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div key={session.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
                  <p className="text-sm text-gray-500">{session.course_name}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Session ID: <strong>{session.session_id}</strong></span>
                  <span>{formatDate(session.created_at)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/teacher/session/${session.session_id}`)}
                  className="btn-primary flex-1 text-sm"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleSessionStatusToggle(session.session_id, session.is_active)}
                  className={`flex-1 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                    session.is_active
                      ? 'bg-red-100 hover:bg-red-200 text-red-800'
                      : 'bg-green-100 hover:bg-green-200 text-green-800'
                  }`}
                >
                  {session.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

