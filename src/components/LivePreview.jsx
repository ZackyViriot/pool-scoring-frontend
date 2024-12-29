import React, { useState, useEffect } from 'react';

// Demo game states to cycle through
const demoStates = [
    {
        player1: { score: 0, run: 0, high: 0, safe: 0, miss: 0, active: true },
        player2: { score: 0, run: 0, high: 0, safe: 0, miss: 0, active: false },
        balls: 15,
        inning: 1,
        message: "Game Start"
    },
    {
        player1: { score: 15, run: 15, high: 15, safe: 0, miss: 0, active: true },
        player2: { score: 0, run: 0, high: 0, safe: 0, miss: 0, active: false },
        balls: 0,
        inning: 1,
        message: "Player 1 clears the rack!"
    },
    {
        player1: { score: 15, run: 0, high: 15, safe: 0, miss: 0, active: false },
        player2: { score: 0, run: 0, high: 0, safe: 0, miss: 0, active: true },
        balls: 15,
        inning: 2,
        message: "New rack, Player 2's turn"
    },
    {
        player1: { score: 15, run: 0, high: 15, safe: 0, miss: 0, active: false },
        player2: { score: 8, run: 8, high: 8, safe: 0, miss: 0, active: true },
        balls: 7,
        inning: 2,
        message: "Player 2 on a run"
    }
];

function PreviewButton({ text, color }) {
    const colors = {
        blue: 'bg-blue-500/20 text-blue-400',
        red: 'bg-red-500/20 text-red-400',
        purple: 'bg-purple-500/20 text-purple-400',
        green: 'bg-green-500/20 text-green-400'
    };

    return (
        <div className={`px-3 py-1 rounded-full text-xs ${colors[color]}`}>
            {text}
        </div>
    );
}

function PreviewStat({ label, value }) {
    return (
        <div className="bg-black/20 rounded p-1">
            <div className="font-bold">{value}</div>
            <div className="opacity-60 text-xs">{label}</div>
        </div>
    );
}

export default function LivePreview() {
    const [currentState, setCurrentState] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        if (isAnimating) {
            const timer = setInterval(() => {
                setCurrentState((prev) => (prev + 1) % demoStates.length);
            }, 3000); // Change state every 3 seconds

            return () => clearInterval(timer);
        }
    }, [isAnimating]);

    const state = demoStates[currentState];

    return (
        <div className="relative">
            {/* Preview Frame */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-2xl">
                {/* Message Banner */}
                <div className="text-center mb-4">
                    <div className="inline-block bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm">
                        {state.message}
                    </div>
                </div>

                {/* Game Controls */}
                <div className="flex justify-center gap-2 mb-6">
                    <PreviewButton text={`New Rack (${state.balls})`} color="blue" />
                    <PreviewButton text="Breaking Foul" color="red" />
                    <PreviewButton text="Switch" color="purple" />
                    <PreviewButton text="History" color="green" />
                </div>

                {/* Scoring Area */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Player 1 */}
                    <div className={`bg-black/30 rounded-xl p-4 text-center transition-all duration-300
                        ${state.player1.active ? 'ring-2 ring-blue-500/50' : 'opacity-50'}`}>
                        <div className="text-sm text-blue-400 mb-2">Player 1</div>
                        <div className="text-5xl font-bold mb-4">{state.player1.score}</div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                            <PreviewStat label="Run" value={state.player1.run} />
                            <PreviewStat label="High" value={state.player1.high} />
                            <PreviewStat label="Safe" value={state.player1.safe} />
                            <PreviewStat label="Miss" value={state.player1.miss} />
                        </div>
                    </div>

                    {/* Player 2 */}
                    <div className={`bg-black/30 rounded-xl p-4 text-center transition-all duration-300
                        ${state.player2.active ? 'ring-2 ring-orange-500/50' : 'opacity-50'}`}>
                        <div className="text-sm text-orange-400 mb-2">Player 2</div>
                        <div className="text-5xl font-bold mb-4">{state.player2.score}</div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                            <PreviewStat label="Run" value={state.player2.run} />
                            <PreviewStat label="High" value={state.player2.high} />
                            <PreviewStat label="Safe" value={state.player2.safe} />
                            <PreviewStat label="Miss" value={state.player2.miss} />
                        </div>
                    </div>
                </div>

                {/* Ball Counter */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                    w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700
                    flex items-center justify-center text-2xl font-bold
                    transition-all duration-300">
                    {state.balls}
                </div>

                {/* Game Info */}
                <div className="text-center text-sm text-gray-400">
                    Inning: {state.inning} | Turn: {state.player1.active ? 'Player 1' : 'Player 2'}
                </div>
            </div>

            {/* Preview Controls */}
            <div className="absolute -top-4 right-4 flex gap-2">
                <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors"
                >
                    {isAnimating ? 'Pause Demo' : 'Play Demo'}
                </button>
            </div>
        </div>
    );
} 