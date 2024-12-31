{/* Scoring Section */ }
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-[calc(100vh-180px)] relative">
    {/* Player 1 Score */}
    <div className={`rounded-lg p-2 sm:p-4 transition-colors duration-200 h-full flex flex-col relative
                        ${isDarkMode
            ? 'bg-black/30 backdrop-blur-sm border border-white/10'
            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}
                        ${activePlayer === 1 ? 'ring-2 ring-blue-500/50 animate-pulse' : 'opacity-50'}
                        ${activePlayer !== 1 && gameStarted ? 'pointer-events-none' : ''}`}>

        {/* Warning for 2 consecutive fouls */}
        {hasTwoConsecutiveFouls(1) && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2
                                bg-red-500/20 text-red-400 px-2 sm:px-3 py-1 rounded-full text-xs animate-pulse">
                Warning: Next Foul -16 Points
            </div>
        )}

        <div className="text-center flex-grow flex flex-col justify-center">                            {activePlayer === 1 && gameStarted && (
            <div className="text-lg sm:text-xl font-semibold mb-2 animate-pulse">
                Shooting
            </div>
        )}
            <div className={`text-6xl sm:text-8xl font-bold mb-4 transition-colors duration-300
                                ${getScoreColor(player1.score, 1)}`}>
                {player1.score}
            </div>
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => gameStarted && adjustScore(1, 1)}
                    className="text-4xl sm:text-5xl text-gray-400 hover:text-white 
                                        w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-800/50 
                                        flex items-center justify-center transition-colors
                                        hover:scale-105 transform"
                >
                    +
                </button>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 mt-2">
            <button
                onClick={() => handleFoul(1)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded bg-red-500/20 text-red-400 
                                    hover:bg-red-500/30 transition-colors text-xs sm:text-sm"
            >
                Foul
            </button>
            <button
                onClick={() => handleSafe(1)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded bg-yellow-500/20 text-yellow-400 
                                    hover:bg-yellow-500/30 transition-colors text-xs sm:text-sm"
            >
                Safe
            </button>
            <button
                onClick={() => handleMiss(1)}
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded bg-gray-500/20 text-gray-400 
                                    hover:bg-gray-500/30 transition-colors text-xs sm:text-sm col-span-2 sm:col-span-1"
            >
                Miss
            </button>
        </div>

        {/* Stats */}
        <div className="mt-2 text-xs sm:text-sm space-y-1">
            <div className="flex justify-between text-gray-400">
                <span>High Run:</span>
                <span>{player1.high}</span>
            </div>
            <div className="flex justify-between text-gray-400">
                <span>Current Run:</span>
                <span>{player1.currentRun}</span>
            </div>
        </div>
    </div>

    {/* Game Controls */}
    <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 p-2 sm:p-4 z-50 sm:relative sm:bottom-auto sm:left-auto sm:right-auto">
        <div className="flex flex-wrap justify-center gap-2">
            <button
                onClick={startGame}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-500 text-white 
                                    hover:bg-green-600 transition-colors text-sm sm:text-base"
            >
                New Game
            </button>
            <button
                onClick={() => setShowHistoryModal(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-500/20 text-blue-400 
                                    hover:bg-blue-500/30 transition-colors text-sm sm:text-base"
            >
                History
            </button>
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-purple-500/20 text-purple-400 
                                    hover:bg-purple-500/30 transition-colors text-sm sm:text-base"
            >
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
        </div>
    </div>
</div> 