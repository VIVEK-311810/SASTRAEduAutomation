import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Components
import RoleSelection from './components/auth/RoleSelection';
import LoginPage from './components/auth/LoginPage';

// Teacher Components
import TeacherDashboard from './components/teacher/TeacherDashboard';
import EnhancedTeacherDashboard from './components/teacher/EnhancedTeacherDashboard';
import CreateSession from './components/teacher/CreateSession';
import SessionManagement from './components/teacher/SessionManagement';
import EnhancedSessionManagement from './components/teacher/EnhancedSessionManagement';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import EnhancedStudentDashboard from './components/student/EnhancedStudentDashboard';
import EnhancedStudentSession from './components/student/EnhancedStudentSession';
import JoinSession from './components/student/JoinSession';
import PollInterface from './components/student/PollInterface';
import SessionResources from './components/student/SessionResources';

// Shared Components
import Header from './components/shared/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            
            {/* Authentication routes */}
            <Route path="/auth" element={<RoleSelection />} />
            <Route path="/auth/login/:role" element={<LoginPage />} />
            
            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={<EnhancedTeacherDashboard />} />
            <Route path="/teacher/dashboard/original" element={<TeacherDashboard />} />
            <Route path="/teacher/create-session" element={<CreateSession />} />
            <Route path="/teacher/session/:sessionId" element={<EnhancedSessionManagement />} />
            <Route path="/teacher/session/:sessionId/original" element={<SessionManagement />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={<EnhancedStudentDashboard />} />
            <Route path="/student/dashboard/original" element={<StudentDashboard />} />
            <Route path="/student/join" element={<JoinSession />} />
            <Route path="/student/session/:sessionId" element={<EnhancedStudentSession />} />
            <Route path="/student/session/:sessionId/original" element={<PollInterface />} />
            <Route path="/student/session/:sessionId/resources" element={<SessionResources />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

