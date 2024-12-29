import React from 'react';

export default function Pricing({ onSelectPlan }) {
    return (
        <div className="mt-8 max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-baseline mb-4">
                    <div className="text-lg font-semibold">Access Pass</div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold">$1</span>
                        <span className="text-gray-400 ml-2 text-sm">one-time</span>
                    </div>
                </div>
                <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Full access to all features
                    </li>
                    <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Pay once, use forever
                    </li>
                </ul>
                <button
                    onClick={() => onSelectPlan('onetime')}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                    Get Access Now
                </button>
            </div>
        </div>
    );
} 