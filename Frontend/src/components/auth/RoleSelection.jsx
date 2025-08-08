import React from 'react';
import { Link } from 'react-router-dom';

const RoleSelection = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="card p-8 w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to the Educational Platform</h2>
        <p className="text-gray-600 mb-8">Please select your role to continue:</p>
        <div className="flex flex-col space-y-4">
          <Link to="/auth/login/teacher" className="btn-primary py-3 text-lg">
            I am a Teacher
          </Link>
          <Link to="/auth/login/student" className="btn-secondary py-3 text-lg">
            I am a Student
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

