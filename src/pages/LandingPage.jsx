import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import LivePreview from '../components/LivePreview';
import Pricing from '../components/Pricing';

export default function LandingPage() {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const { user, logout } = useAuth();

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setAuthMode('register');
        setShowAuthModal(true);
    };

    const handleCloseModal = () => {
        setShowAuthModal(false);
        setSelectedPlan(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-b border-white/10 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="text-xl font-bold">Pool Scoring Pro</div>
                    <div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-gray-300">Welcome, {user.name}</span>
                                <Link
                                    to="/pool-scoring"
                                    className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors text-white"
                                >
                                    Go to App
                                </Link>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('register');
                                        setShowAuthModal(true);
                                    }}
                                    className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                >
                                    Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section with Pricing */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Professional Pool Scoring System
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                        The ultimate digital scoring solution for straight pool players and tournaments.
                    </p>
                    {!user ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* One-time Payment Card */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-xl font-bold mb-2">One-time Payment</h3>
                                <div className="text-4xl font-bold text-blue-400 mb-4">$10</div>
                                <p className="text-gray-300 mb-6">Lifetime access to all features</p>
                                <ul className="text-left text-gray-400 mb-6 space-y-2">
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Full access forever
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        All premium features
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        No recurring payments
                                    </li>
                                </ul>
                                <button
                                    onClick={() => {
                                        setAuthMode('register');
                                        setSelectedPlan('one-time');
                                        setShowAuthModal(true);
                                    }}
                                    className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 transition-colors rounded-lg font-semibold"
                                >
                                    Get Started
                                </button>
                            </div>

                            {/* Monthly Subscription Card */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/50 hover:border-purple-500 transition-colors transform scale-105">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 px-4 py-1 rounded-full text-sm">
                                    Popular Choice
                                </div>
                                <h3 className="text-xl font-bold mb-2">Monthly Plan</h3>
                                <div className="text-4xl font-bold text-purple-400 mb-4">$5</div>
                                <p className="text-gray-300 mb-6">Per month, cancel anytime</p>
                                <ul className="text-left text-gray-400 mb-6 space-y-2">
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        All premium features
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Monthly updates
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Cancel anytime
                                    </li>
                                </ul>
                                <button
                                    onClick={() => {
                                        setAuthMode('register');
                                        setSelectedPlan('monthly');
                                        setShowAuthModal(true);
                                    }}
                                    className="w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 transition-colors rounded-lg font-semibold"
                                >
                                    Subscribe Now
                                </button>
                            </div>

                            {/* Login Card */}
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition-colors">
                                <h3 className="text-xl font-bold mb-2">Existing User?</h3>
                                <div className="text-4xl font-bold text-green-400 mb-4">
                                    <span className="text-3xl">👋</span>
                                </div>
                                <p className="text-gray-300 mb-6">Welcome back!</p>
                                <ul className="text-left text-gray-400 mb-6 space-y-2">
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Quick access
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        Resume scoring
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        View your stats
                                    </li>
                                </ul>
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 transition-colors rounded-lg font-semibold"
                                >
                                    Login Now
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/pool-scoring"
                            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 
                                px-8 py-4 rounded-full text-lg font-semibold
                                hover:from-blue-600 hover:to-purple-700 
                                transform hover:scale-105 transition-all
                                shadow-lg hover:shadow-xl"
                        >
                            Launch Scoring System
                        </Link>
                    )}
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        title="Real-time Scoring"
                        description="Track scores, runs, fouls, and more in real-time with our intuitive interface."
                        icon="⚡"
                    />
                    <FeatureCard 
                        title="Advanced Statistics"
                        description="Monitor player performance with detailed stats and game history."
                        icon="📊"
                    />
                    <FeatureCard 
                        title="Tournament Ready"
                        description="Perfect for tournaments with handicap support and professional features."
                        icon="🏆"
                    />
                </div>
            </div>

            {/* Preview Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Live Preview</h2>
                <LivePreview />
            </div>

            {/* Key Features List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <Feature text="Automatic ball counting and rack management" />
                    <Feature text="Three-foul penalty tracking" />
                    <Feature text="Break foul handling with re-break option" />
                    <Feature text="Detailed game history and statistics" />
                    <Feature text="Player handicap system" />
                    <Feature text="Dark and light mode support" />
                    <Feature text="Responsive design for all devices" />
                    <Feature text="Professional tournament features" />
                </div>
            </div>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-full max-w-md mx-4">
                        <div className="relative">
                            {authMode === 'login' ? (
                                <div>
                                    <LoginForm onClose={handleCloseModal} />
                                    <p className="text-center mt-4 text-gray-400">
                                        Don't have an account?{' '}
                                        <button
                                            onClick={() => setAuthMode('register')}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            Register now
                                        </button>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <RegisterForm 
                                        selectedPlan={selectedPlan} 
                                        onClose={handleCloseModal}
                                    />
                                    <p className="text-center mt-4 text-gray-400">
                                        Already have an account?{' '}
                                        <button
                                            onClick={() => setAuthMode('login')}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            Login
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FeatureCard({ title, description, icon }) {
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}

function Feature({ text }) {
    return (
        <div className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-4">
            <div className="text-green-400">✓</div>
            <div>{text}</div>
        </div>
    );
} 