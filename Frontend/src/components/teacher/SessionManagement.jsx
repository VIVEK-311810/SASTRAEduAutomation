import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../shared/LoadingSpinner';
import PollCreation from './PollCreation';
import GeneratedMCQs from './GeneratedMCQs';

const SessionManagement = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('polls'); // 'polls', 'generated-mcqs', 'participants', 'resources'
  const [generatedMCQs, setGeneratedMCQs] = useState([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'teacher') {
      navigate('/auth');
      return;
    }
    fetchSession();
  }, [sessionId, currentUser, navigate]);

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

  const fetchGeneratedMCQs = async () => {
    setLoadingMCQs(true);
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/generated-mcqs`);
      if (response.ok) {
        const data = await response.json();
        setGeneratedMCQs(data.mcqs);
      } else {
        console.error('Failed to fetch generated MCQs');
        setGeneratedMCQs([]);
      }
    } catch (error) {
      console.error('Error fetching generated MCQs:', error);
      setGeneratedMCQs([]);
    } finally {
      setLoadingMCQs(false);
    }
  };

  const handleMCQsSent = () => {
    setGeneratedMCQs([]); // Clear generated MCQs after sending
    // Optionally, refresh the polls list here if needed
  };

  if (loading) {
    return <LoadingSpinner text="Loading session management..." />;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
            <p className="text-gray-600">{session.course_name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary-600">ID: {session.session_id}</div>
            <div className="text-sm text-gray-500">Participants: {session.participant_count}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'polls' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('polls')}
          >
            Polls
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'generated-mcqs' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setActiveTab('generated-mcqs');
              fetchGeneratedMCQs();
            }}
          >
            Generated MCQs
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'participants' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'resources' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => navigate(`/teacher/session/${sessionId}/resources`)}
          >
            Resources
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'polls' && (
          <PollCreation sessionId={session.session_id} />
        )}
        {activeTab === 'generated-mcqs' && (
          <GeneratedMCQs
            sessionId={session.session_id}
            generatedMCQs={generatedMCQs}
            loading={loadingMCQs}
            onMCQsSent={handleMCQsSent}
          />
        )}
        {activeTab === 'participants' && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Session Participants</h2>
            <p>Participant list will go here.</p>
          </div>
        )}
        {activeTab === 'resources' && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Session Resources</h2>
            <p>Resources will be managed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManagement;