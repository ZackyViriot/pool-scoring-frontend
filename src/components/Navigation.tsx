import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

const Navigation: React.FC = () => {
  const { user, logout } = useAuth() as AuthContextType;
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/pool-scoring" className={`text-sm px-3 py-2 rounded-lg transition-colors ${
            location.pathname === '/pool-scoring' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-300 hover:bg-blue-500/10'
          }`}>
            Scoring
          </Link>
          <Link to="/history" className={`text-sm px-3 py-2 rounded-lg transition-colors ${
            location.pathname === '/history' 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-300 hover:bg-blue-500/10'
          }`}>
            History
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">
            {user.name}
          </span>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 