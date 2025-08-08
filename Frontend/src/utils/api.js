// API configuration for the Educational Platform
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Generic API request function with error handling
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Student API functions
export const studentAPI = {
  // Get student dashboard summary
  getDashboardSummary: (studentId) => 
    apiRequest(`/students/${studentId}/dashboard-summary`),
  
  // Get student sessions
  getSessions: (studentId) => 
    apiRequest(`/students/${studentId}/sessions`),
  
  // Get student activity
  getActivity: (studentId, limit = 20) => 
    apiRequest(`/students/${studentId}/activity?limit=${limit}`),
  
  // Get student statistics
  getStats: (studentId) => 
    apiRequest(`/students/${studentId}/stats`),
  
  // Get active polls
  getActivePolls: (studentId) => 
    apiRequest(`/students/${studentId}/active-polls`),
  
  // Submit poll response
  submitPollResponse: (studentId, pollId, selectedOption, responseTime) =>
    apiRequest(`/students/${studentId}/polls/${pollId}/respond`, {
      method: 'POST',
      body: JSON.stringify({
        selected_option: selectedOption,
        response_time: responseTime,
      }),
    }),
  
  // Get student performance
  getPerformance: (studentId) => 
    apiRequest(`/students/${studentId}/performance`),
  
  // Get recent polls
  getRecentPolls: (studentId, limit = 10) => 
    apiRequest(`/students/${studentId}/recent-polls?limit=${limit}`),
  
  // Get student profile
  getProfile: (studentId) => 
    apiRequest(`/students/${studentId}/profile`),
};

// Session API functions
export const sessionAPI = {
  // Join a session
  joinSession: (sessionId, studentId) =>
    apiRequest(`/sessions/${sessionId}/join`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    }),
  
  // Get session details
  getSession: (sessionId) => 
    apiRequest(`/sessions/${sessionId}`),
  
  // Get session participants
  getParticipants: (sessionId) => 
    apiRequest(`/sessions/${sessionId}/participants`),
};

// Poll API functions
export const pollAPI = {
  // Get poll details
  getPoll: (pollId) => 
    apiRequest(`/polls/${pollId}`),
  
  // Get poll results
  getPollResults: (pollId) => 
    apiRequest(`/polls/${pollId}/results`),
};

// Auth API functions (for demo)
export const authAPI = {
  // Mock login
  mockLogin: (role) =>
    apiRequest('/mock-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  
  // Get mock users
  getMockUsers: () => 
    apiRequest('/mock-users'),
};

export default {
  studentAPI,
  sessionAPI,
  pollAPI,
  authAPI,
  apiRequest,
};

