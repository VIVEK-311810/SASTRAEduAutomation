import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            EduPlatform
          </Link>
          
          <div className="navbar-nav">
            {currentUser ? (
              <>
                <span className="nav-link">
                  Welcome, {currentUser.full_name} ({currentUser.role})
                </span>
                <Link 
                  to={`/${currentUser.role}/dashboard`} 
                  className="nav-link"
                >
                  Dashboard
                </Link>
                {currentUser.role === 'student' && (
                  <Link to="/student/join" className="nav-link">
                    Join Session
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/auth" className="nav-link">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

