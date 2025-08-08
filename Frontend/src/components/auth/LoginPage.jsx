import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMockUsers();
  }, []);

  const fetchMockUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/mock-users');
      const data = await response.json();
      
      // Get the correct array based on role
      const roleUsers = role === 'teacher' ? data.teachers : data.students;
      setUsers(roleUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      // Find the selected user object
      const userObject = users.find(user => user.id.toString() === selectedUser);
      
      if (!userObject) {
        alert('User not found');
        setLoading(false);
        return;
      }

      // Store user in localStorage for authentication
      const selectedUserData = users.find(user => user.id.toString() === selectedUser);
      if (selectedUserData) {
        localStorage.setItem('currentUser', JSON.stringify(selectedUserData));
        localStorage.setItem('authToken', 'demo-token-' + selectedUserData.id);
        console.log('User logged in:', selectedUserData);
      }
      
      // Navigate to appropriate dashboard
      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {role === 'teacher' ? 'Teacher Login' : 'Student Login'}
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User (Demo Mode)
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name} {user.student_id ? `(${user.student_id})` : user.department ? `(${user.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedUser}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/auth')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
