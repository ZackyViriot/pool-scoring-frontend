import React from 'react';
import { Link } from 'react-router-dom';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export default function Navbar({ isDarkMode, setIsDarkMode }: NavbarProps) {
  const { logout } = useAuth();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200
      ${isDarkMode 
        ? 'bg-black/30 backdrop-blur-sm border-b border-white/10' 
        : 'bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm'}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-bold text-xl">
            Pool Scoring
          </Link>

          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium hover:opacity-75 transition-opacity ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/pool-scoring" 
              className={`font-medium hover:opacity-75 transition-opacity ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Game
            </Link>
            <button 
              onClick={scrollToTop}
              className={`font-medium hover:opacity-75 transition-opacity ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              History
            </button>

            <button
              onClick={handleLogout}
              className={`font-medium hover:opacity-75 transition-opacity ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}
            >
              Logout
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1 rounded-full transition-all duration-200 hover:scale-110 transform
                ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 