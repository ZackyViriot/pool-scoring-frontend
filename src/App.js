import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { StripeProvider } from './context/StripeContext';
import PoolScoringComponent from './poolScoring/PoolScoringComponent.jsx';
import LandingPage from './pages/LandingPage';
import History from './pages/History.tsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Create a separate component for protected routes
const ProtectedRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pool-scoring" element={<PoolScoringComponent />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <StripeProvider>
            <ProtectedRoutes />
          </StripeProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
