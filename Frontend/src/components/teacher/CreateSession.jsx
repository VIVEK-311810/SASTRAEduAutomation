import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSession = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_name: '',
  });
  const [loading, setLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          teacher_id: currentUser?.id || 1, // Fallback to teacher ID 1 for demo
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session creation response:', data);
        
        // The API returns the full session object, so we access session_id from it
        const sessionId = data.session_id;
        
        if (sessionId) {
          alert(`Session created successfully! Session ID: ${sessionId}`);
          console.log(`Navigating to: /teacher/session/${sessionId}`);
          navigate(`/teacher/session/${sessionId}`);
        } else {
          console.error('No session_id in response:', data);
          alert('Session created but navigation failed. Please check the dashboard.');
          navigate('/teacher/dashboard');
        }
      } else {
        const errorData = await response.json();
        console.error('Session creation failed:', errorData);
        alert('Error creating session: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Create New Session</h1>
        <p className="text-gray-600 mt-2">Set up a new class session for your students</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Session Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Introduction to React"
              required
            />
          </div>

          <div>
            <label className="label">Course Name *</label>
            <input
              type="text"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Web Development"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows="4"
              placeholder="Brief description of what will be covered in this session..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Session Features</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Students can join using a unique Session ID</li>
              <li>• Create and send real-time polls/MCQs</li>
              <li>• Track student participation and responses</li>
              <li>• Share resources and notes with students</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/teacher/dashboard')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;

