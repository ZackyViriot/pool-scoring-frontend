import { useCallback } from 'react';

export const useGameActions = (
    gameState,
    player1Stats,
    player2Stats,
    matchData,
    setTimer
) => {
    const {
        activePlayer,
        setActivePlayer,
        currentInning,
        setCurrentInning,
        isBreakShot,
        setIsBreakShot,
        objectBallsOnTable,
        setObjectBallsOnTable,
        setWinner,
        setWinnerStats,
        setShowWinModal,
        targetGoal
    } = gameState;

    const handleWin = useCallback((winningPlayer, newScore, currentRun, bestRun) => {
        const winnerState = winningPlayer === 1 ? player1Stats.playerState : player2Stats.playerState;
        const winnerStats = {
            ...winnerState,
            score: newScore,
            currentRun,
            bestRun
        };

        setWinner(winningPlayer);
        setWinnerStats(winnerStats);
        setShowWinModal(true);
        setTimer(prev => ({ ...prev, running: false }));

        matchData.saveMatchToDatabase(
            player1Stats.playerState,
            player2Stats.playerState,
            targetGoal,
            winningPlayer
        );
    }, [player1Stats, player2Stats, setWinner, setWinnerStats, setShowWinModal, setTimer, matchData, targetGoal]);

    const adjustScore = useCallback((playerNum, amount, action = 'score') => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();

        const currentPlayerState = playerNum === 1 ? player1 : player2;
        const setCurrentPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        const newScore = currentPlayerState.score + amount;
        const newCurrentRun = amount > 0 ? (currentPlayerState.currentRun || 0) + amount : 0;
        const newBestRun = Math.max(currentPlayerState.bestRun || 0, newCurrentRun);
        
        addToTurnHistory(playerNum, action, amount);

        // Reset foul history when a ball is made
        if (amount > 0) {
            setFoulHistory([]);  // Reset foul count on successful shot
            setObjectBallsOnTable(prev => {
                const newCount = Math.max(0, prev - 1);
                if (newCount <= 1) {
                    setTimeout(() => setObjectBallsOnTable(15), 500);
                    return 1;
                }
                return newCount;
            });
        }

        setCurrentPlayer(prev => ({
            ...prev,
            score: newScore,
            currentRun: newCurrentRun,
            bestRun: newBestRun,
            totalPoints: (prev.totalPoints || 0) + (amount > 0 ? amount : 0),  // Only add positive points to totalPoints
            totalInnings: amount <= 0 ? (prev.totalInnings || 0) + 1 : prev.totalInnings || 0,
            runHistory: [...(prev.runHistory || []), newCurrentRun]
        }));

        // Check for win condition
        if (newScore >= targetGoal) {
            handleWin(playerNum, newScore, newCurrentRun, newBestRun);
            return;
        }

        // Switch turns if it's not a scoring shot
        if (amount <= 0) {
            if (playerNum === 2) {
                setCurrentInning(prev => prev + 1);
            }
            setActivePlayer(playerNum === 1 ? 2 : 1);
        }
    }, [activePlayer, isBreakShot, player1Stats, player2Stats, targetGoal, handleWin, setActivePlayer, setCurrentInning, setIsBreakShot, setObjectBallsOnTable, matchData, currentInning]);

    const handleFoul = useCallback((playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Foul', -1);

        setPlayer(prev => ({
            ...prev,
            score: prev.score - 1,
            fouls: (prev.fouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    const handleScratch = useCallback((playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Scratch', -1);

        setPlayer(prev => ({
            ...prev,
            score: prev.score - 1,
            scratches: (prev.scratches || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    const handleIntentionalFoul = useCallback((playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Intentional Foul', -2);

        setPlayer(prev => ({
            ...prev,
            score: prev.score - 2,
            intentionalFouls: (prev.intentionalFouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    const handleSafe = useCallback((playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Safe', 0);

        setPlayer(prev => ({
            ...prev,
            safes: (prev.safes || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    const handleMiss = useCallback(() => {
        const currentPlayerStats = activePlayer === 1 ? player1Stats : player2Stats;
        currentPlayerStats.incrementStat('misses');
        adjustScore(-1, 'miss');
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    const handleBreakFoulContinue = useCallback(() => {
        const currentPlayerStats = activePlayer === 1 ? player1Stats : player2Stats;
        currentPlayerStats.incrementStat('breakingFouls');
        adjustScore(-1, 'breakingFoul');
    }, [activePlayer, player1Stats, player2Stats, adjustScore]);

    return {
        adjustScore,
        handleFoul,
        handleScratch,
        handleIntentionalFoul,
        handleSafe,
        handleMiss,
        handleBreakFoulContinue
    };
}; 