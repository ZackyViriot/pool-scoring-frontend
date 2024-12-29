import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gray-800 
          flex items-center justify-center text-gray-400 hover:text-white
          transition-colors border border-gray-700"
      >
        ×
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-500/20 text-red-400 rounded text-center">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-black/30 border border-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-black/30 border border-gray-700 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
} 