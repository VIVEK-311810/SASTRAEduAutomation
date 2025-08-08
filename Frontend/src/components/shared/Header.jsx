import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/auth');
  };

  const isAuthPage = location.pathname.startsWith('/auth');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary-600">EduPlatform</h1>
            {currentUser && (
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.name || currentUser.full_name}
              </span>
            )}
          </div>

          <nav className="flex items-center space-x-4">
            {!isAuthPage && currentUser && (
              <>
                {currentUser.role === 'teacher' && (
                  <>
                    <button
                      onClick={() => navigate('/teacher/dashboard')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/teacher/create-session')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Create Session
                    </button>
                  </>
                )}
                
                {currentUser.role === 'student' && (
                  <>
                    <button
                      onClick={() => navigate('/student/dashboard')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/student/join')}
                      className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Join Session
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

