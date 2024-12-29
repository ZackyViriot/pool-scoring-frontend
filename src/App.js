import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StripeProvider } from './context/StripeContext';
import PoolScoringComponent from './poolScoring/PoolScoringComponent';
import LandingPage from './pages/LandingPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/pool-scoring"
        element={
          <ProtectedRoute>
            <PoolScoringComponent />
          </ProtectedRoute>
        }
      />
      {/* Catch all route - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StripeProvider>
          <AppRoutes />
        </StripeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
