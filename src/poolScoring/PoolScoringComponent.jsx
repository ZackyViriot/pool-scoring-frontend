import React, { useState, useEffect, useRef, useCallback } from "react";
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext.tsx";
import { getSavedGameProperty, safeSaveLocalStorage } from "../utils/localStorage.js";

// Import test utilities in development
if (process.env.NODE_ENV === 'development') {
    import("../utils/testLocalStorage.js");
}

const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.hostname === 'localhost' 
            ? 'http://localhost:8000'
            : 'https://poolscoringbackend.org';
    }
    return 'https://poolscoringbackend.org';
};

export default function PoolScoringComponent() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [playWinSound] = useSound('/sounds/win.mp3');

    // All state hooks moved to the top level
    const [showMenu, setShowMenu] = useState(false);
    const [gameStarted, setGameStarted] = useState(() => getSavedGameProperty('gameStarted', false));
    const [objectBallsOnTable, setObjectBallsOnTable] = useState(() => getSavedGameProperty('objectBallsOnTable', 15));
    const [activePlayer, setActivePlayer] = useState(() => getSavedGameProperty('activePlayer', 1));
    const [targetGoal, setTargetGoal] = useState(() => getSavedGameProperty('targetGoal', 125));
    const [gameTime, setGameTime] = useState(() => getSavedGameProperty('gameTime', 0));
    const [isTimerRunning, setIsTimerRunning] = useState(() => getSavedGameProperty('isTimerRunning', false));
    const [currentInning, setCurrentInning] = useState(() => getSavedGameProperty('currentInning', 1));
    const [breakPlayer, setBreakPlayer] = useState(() => getSavedGameProperty('breakPlayer', null));
    const [scoreHistory, setScoreHistory] = useState(() => getSavedGameProperty('scoreHistory', []));
    const [bestRun, setBestRun] = useState(() => getSavedGameProperty('bestRun', 0));
    const [isBreakShot, setIsBreakShot] = useState(() => getSavedGameProperty('isBreakShot', true));
    const [player1FoulHistory, setPlayer1FoulHistory] = useState(() => getSavedGameProperty('player1FoulHistory', []));
    const [player2FoulHistory, setPlayer2FoulHistory] = useState(() => getSavedGameProperty('player2FoulHistory', []));
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [turnHistory, setTurnHistory] = useState(() => getSavedGameProperty('turnHistory', []));
    const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
    const [breakFoulPlayer, setBreakFoulPlayer] = useState(null);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showPlayerStats, setShowPlayerStats] = useState(null);
    const [winner, setWinner] = useState(null);
    const [showGameStats, setShowGameStats] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark';
        }
        return true;
    });
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });
    const [player1, setPlayer1] = useState(() => getSavedGameProperty('player1', {
        name: "",
        score: 0,
        handicap: 0,
        totalPoints: 0,
        totalInnings: 0,
        breakAndRuns: 0,
        safetyPlays: 0,
        safes: 0,
        defensiveShots: 0,
        scratches: 0,
        avgPointsPerInning: 0,
        fouls: 0,
        intentionalFouls: 0,
        misses: 0,
        bestRun: 0,
        currentRun: 0,
        breakingFouls: 0
    }));
    const [player2, setPlayer2] = useState(() => getSavedGameProperty('player2', {
        name: "",
        score: 0,
        handicap: 0,
        totalPoints: 0,
        totalInnings: 0,
        breakAndRuns: 0,
        safetyPlays: 0,
        safes: 0,
        defensiveShots: 0,
        scratches: 0,
        avgPointsPerInning: 0,
        fouls: 0,
        intentionalFouls: 0,
        misses: 0,
        bestRun: 0,
        currentRun: 0,
        breakingFouls: 0
    }));
    const [gameType] = useState(() => getSavedGameProperty('gameType', 'Straight Pool'));
    const [showRunsModal, setShowRunsModal] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showConsecutiveFoulsModal, setShowConsecutiveFoulsModal] = useState(false);
    const [consecutiveFoulsPlayer, setConsecutiveFoulsPlayer] = useState(null);
    
    // Ref for debounced save function
    const saveGameStateRef = useRef();

    // Memoized saveGameState function
    const saveGameState = useCallback(() => {
        const gameState = {
            gameStarted,
            objectBallsOnTable,
            activePlayer,
            targetGoal,
            gameTime,
            isTimerRunning,
            currentInning,
            breakPlayer,
            scoreHistory,
            bestRun,
            isBreakShot,
            player1FoulHistory,
            player2FoulHistory,
            turnHistory,
            player1,
            player2,
            gameType
        };
        // Clear previous timeout
        if (saveGameStateRef.current) {
            clearTimeout(saveGameStateRef.current);
        }
        // Debounce the save operation
        saveGameStateRef.current = setTimeout(() => {
            const success = safeSaveLocalStorage('poolGame', gameState);
            if (!success) {
                console.warn('Failed to save game state to localStorage');
            }
        }, 100); // 100ms debounce
    }, [
        gameStarted,
        objectBallsOnTable,
        activePlayer,
        targetGoal,
        gameTime,
        isTimerRunning,
        currentInning,
        breakPlayer,
        scoreHistory,
        bestRun,
        isBreakShot,
        player1FoulHistory,
        player2FoulHistory,
        turnHistory,
        player1,
        player2,
        gameType
    ]);

    // All useEffect hooks moved here
    useEffect(() => {
        if (!user) {
            try {
                navigate('/');
            } catch (error) {
                console.error('Navigation error:', error);
                // Fallback to window.location if navigate fails
                window.location.href = '/';
            }
        }
    }, [user, navigate]);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = localStorage.getItem('token');
                if (!token || !user) {
                    console.log('No authentication found, redirecting to login');
                    navigate('/login');
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Auth check error:', error);
                return false;
            }
        };

        if (!checkAuth()) return;

        const interval = setInterval(checkAuth, 60000);
        return () => clearInterval(interval);
    }, [navigate, user]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isDarkMode]);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setGameTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (gameStarted) {
            saveGameState();
        }
    }, [
        gameStarted,
        objectBallsOnTable,
        activePlayer,
        currentInning,
        player1,
        player2,
        turnHistory,
        player1FoulHistory,
        player2FoulHistory,
        saveGameState
    ]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveGameStateRef.current) {
                clearTimeout(saveGameStateRef.current);
            }
        };
    }, []);

    // Rest of your component code...

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        const pad = (num) => num.toString().padStart(2, '0');
        
        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
        }
        return `${pad(minutes)}:${pad(remainingSeconds)}`;
    };

    const undoLastAction = () => {
        if (scoreHistory.length > 0) {
            const lastAction = scoreHistory[scoreHistory.length - 1];
            
            // Save current state before restoring
            // Removed unused currentState variable
            
            // Restore player states with all properties
            setPlayer1({
                ...player1,
                ...lastAction.player1,
                name: player1.name, // Preserve current name
                handicap: player1.handicap // Preserve handicap
            });
            setPlayer2({
                ...player2,
                ...lastAction.player2,
                name: player2.name, // Preserve current name
                handicap: player2.handicap // Preserve handicap
            });
            
            // Restore game state
            setActivePlayer(lastAction.activePlayer);
            setCurrentInning(lastAction.currentInning);
            setObjectBallsOnTable(lastAction.objectBallsOnTable);
            setPlayer1FoulHistory(lastAction.player1FoulHistory || []);
            setPlayer2FoulHistory(lastAction.player2FoulHistory || []);
            setIsBreakShot(lastAction.isBreakShot || false);
            
            // Remove the last action from history
            setScoreHistory(prev => prev.slice(0, -1));
            setTurnHistory(prev => prev.slice(0, -1));

            // Save the restored state
            saveGameState();
        }
    };

    // Clear localStorage when game ends
    const clearGameState = () => {
        localStorage.removeItem('poolGame');
    };

    // Update endGame to clear localStorage
    const endGame = () => {
        setGameStarted(false);
        setIsTimerRunning(false);
        clearGameState();
        setPlayer1(prev => ({
            ...prev,
            score: 0,
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            currentRun: 0
        }));
        setPlayer2(prev => ({
            ...prev,
            score: 0,
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            currentRun: 0
        }));
    };

    // Function to add turn to history
    const addToTurnHistory = (playerNum, action, points) => {
        const player = playerNum === 1 ? player1 : player2;
        const turnEntry = {
            inning: currentInning,
            playerName: player.name || `Player ${playerNum}`,
            playerNum,
            action,
            points,
            timestamp: new Date(),
            score: player.score + (points || 0),
            ballsPocketed: action === 'Points' ? points : 0  // Add this line to track balls pocketed
        };
        setTurnHistory(prev => [...prev, turnEntry]);
    };

    // Add this function near the top with other state management functions
    const saveStateToHistory = () => {
        const currentState = {
            player1: {
                ...player1,
                score: player1.score,
                high: player1.high,
                safes: player1.safes,
                misses: player1.misses,
                fouls: player1.fouls,
                intentionalFouls: player1.intentionalFouls,
                scratches: player1.scratches,
                currentRun: player1.currentRun,
                bestGameRun: player1.bestGameRun
            },
            player2: {
                ...player2,
                score: player2.score,
                high: player2.high,
                safes: player2.safes,
                misses: player2.misses,
                fouls: player2.fouls,
                intentionalFouls: player2.intentionalFouls,
                scratches: player2.scratches,
                currentRun: player2.currentRun,
                bestGameRun: player2.bestGameRun
            },
            activePlayer,
            currentInning,
            objectBallsOnTable,
            player1FoulHistory,
            player2FoulHistory,
            isBreakShot,
            turnHistory: [...turnHistory]
        };
        setScoreHistory(prev => [...prev, currentState]);
    };

    const handleWin = (playerNum, newScore, newCurrentRun, newBestRun) => {
        const updatedPlayer = playerNum === 1 
            ? { ...player1, score: newScore, currentRun: newCurrentRun, bestRun: newBestRun }
            : { ...player2, score: newScore, currentRun: newCurrentRun, bestRun: newBestRun };
        
        const otherPlayer = playerNum === 1 ? player2 : player1;
        
        // Calculate final stats for both players
        const player1FinalStats = calculatePlayerStats(playerNum === 1 ? updatedPlayer : player1, 1);
        const player2FinalStats = calculatePlayerStats(playerNum === 2 ? updatedPlayer : player2, 2);
        
        setWinner(playerNum);
        setShowWinModal(true);
        setIsTimerRunning(false);
        playWinSound();

        // Save match with the final stats
        saveMatchToDatabase({
            winner: updatedPlayer,
            loser: otherPlayer,
            finalScore1: playerNum === 1 ? newScore : otherPlayer.score,
            finalScore2: playerNum === 1 ? otherPlayer.score : newScore,
            player1FinalStats,
            player2FinalStats
        }, gameTime);
    };

    const adjustScore = (playerNum, amount) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        // Only set breakPlayer if it is null and points are being scored
        if (breakPlayer === null && amount > 0) {
            setBreakPlayer(playerNum);
        }
        saveStateToHistory();
        saveGameState();
        const currentPlayerState = playerNum === 1 ? player1 : player2;
        const setCurrentPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        const newScore = currentPlayerState.score + amount;
        const newCurrentRun = amount > 0 ? currentPlayerState.currentRun + amount : 0;
        const newBestRun = Math.max(currentPlayerState.bestRun || 0, newCurrentRun);
        
        addToTurnHistory(playerNum, 'Points', amount);

        // Reset foul history when a ball is made
        if (amount > 0) {
            setFoulHistory([]);  // Reset foul count on successful shot
            setObjectBallsOnTable(prev => {
                const newCount = Math.max(0, prev - amount);  // Update this line to subtract the actual amount
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
            totalInnings: amount <= 0 ? (prev.totalInnings || 0) + 1 : prev.totalInnings || 0
        }));

        // Check for win condition before switching turns
        if (newScore >= targetGoal) {
            handleWin(playerNum, newScore, newCurrentRun, newBestRun);
            return;
        }

        // Only switch turns if no points were scored
        if (amount <= 0) {
            if (playerNum === 2) {
                setCurrentInning(prev => prev + 1);
            }
            
            setActivePlayer(playerNum === 1 ? 2 : 1);
        }
    };

    const checkThreeFouls = (playerNum) => {
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;

        // Add current turn to foul history first
        const updatedHistory = [...foulHistory, true];
        
        // Check if player has 3 fouls in their last 3 turns
        if (updatedHistory.length >= 3 && updatedHistory.slice(-3).every(foul => foul)) {
            // Reset foul history after applying penalty
            setFoulHistory([]);
            return true;
        } else {
            // Only keep the last 3 fouls in history
            setFoulHistory(updatedHistory.slice(-3));
            return false;
        }
    };


    // Function to handle acknowledgment of consecutive fouls warning
    const handleConsecutiveFoulsAcknowledged = () => {
        setShowConsecutiveFoulsModal(false);
        setConsecutiveFoulsPlayer(null);
    };

    const handleFoul = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        
        // Check for consecutive fouls warning BEFORE recording the foul
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        if (foulHistory.length === 1 && foulHistory[0] === true) {
            // This will be the second consecutive foul
            setConsecutiveFoulsPlayer(playerNum);
            setShowConsecutiveFoulsModal(true);
        }
        
        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        setPlayer(prev => ({
            ...prev,
            score: prev.score - 1,
            fouls: (prev.fouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1,
            totalPoints: prev.totalPoints || 0  // Ensure totalPoints is initialized
        }));

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        
        addToTurnHistory(playerNum, 'Foul', -1);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -15);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 15
            }));
        }
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleSafe = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Safety', 0);

        setPlayer(prev => ({
            ...prev,
            safes: (prev.safes || 0) + 1,
            safetyPlays: (prev.safetyPlays || 0) + 1,
            defensiveShots: (prev.defensiveShots || 0) + 1,
            currentRun: 0,
            totalInnings: prev.totalInnings + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleMiss = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Miss', 0);

        setPlayer(prev => ({
            ...prev,
            misses: (prev.misses || 0) + 1,
            currentRun: 0,
            totalInnings: prev.totalInnings + 1
        }));
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleScratch = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        
        // Check for consecutive fouls warning BEFORE recording the foul
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        if (foulHistory.length === 1 && foulHistory[0] === true) {
            // This will be the second consecutive foul
            setConsecutiveFoulsPlayer(playerNum);
            setShowConsecutiveFoulsModal(true);
        }
        
        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        setPlayer(prev => ({
            ...prev,
            score: prev.score - 1,
            scratches: (prev.scratches || 0) + 1,
            fouls: (prev.fouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1,
            totalPoints: prev.totalPoints || 0  // Ensure totalPoints is initialized
        }));

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        
        addToTurnHistory(playerNum, 'Scratch', -1);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -15);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 15
            }));
        }
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const startGame = () => {
        // Set default names if none provided
        if (!player1.name) {
            setPlayer1(prev => ({ ...prev, name: "Player 1" }));
        }
        if (!player2.name) {
            setPlayer2(prev => ({ ...prev, name: "Player 2" }));
        }

        setGameStarted(true);
        setIsTimerRunning(true);
        setObjectBallsOnTable(15);
        setCurrentInning(1);
        setActivePlayer(1); // Start with player 1, but break will be assigned on first action
        setBreakPlayer(null); // Break player will be assigned when first action is taken
        setScoreHistory([]);
        setBestRun(0);
        setIsBreakShot(true);
        setPlayer1FoulHistory([]);
        setPlayer2FoulHistory([]);
        setTurnHistory([]);

        // Apply handicaps at game start
        const player1Handicap = Number(player1.handicap) || 0;
        const player2Handicap = Number(player2.handicap) || 0;
        
        const handicapDifference = player1Handicap - player2Handicap;
        
        // Initialize player1 with all stats from backend schema
        setPlayer1(prev => ({
            ...prev,
            name: prev.name || "Player 1",
            score: handicapDifference < 0 ? Math.abs(handicapDifference) : 0,
            handicap: player1Handicap,
            totalPoints: 0,
            totalInnings: 0,
            breakAndRuns: 0,
            safetyPlays: 0,
            safes: 0,
            defensiveShots: 0,
            scratches: 0,
            avgPointsPerInning: 0,
            fouls: 0,
            intentionalFouls: 0,
            breakingFouls: 0,
            misses: 0,
            bestRun: 0,
            currentRun: 0,
            runHistory: []
        }));

        // Initialize player2 with all stats from backend schema
        setPlayer2(prev => ({
            ...prev,
            name: prev.name || "Player 2",
            score: handicapDifference > 0 ? handicapDifference : 0,
            handicap: player2Handicap,
            totalPoints: 0,
            totalInnings: 0,
            breakAndRuns: 0,
            safetyPlays: 0,
            safes: 0,
            defensiveShots: 0,
            scratches: 0,
            avgPointsPerInning: 0,
            fouls: 0,
            intentionalFouls: 0,
            breakingFouls: 0,
            misses: 0,
            bestRun: 0,
            currentRun: 0,
            runHistory: []
        }));

        // Record handicap differences in turn history
        if (handicapDifference !== 0) {
            const turnEntry = {
                inning: 1,  // Start with inning 1
                playerNum: handicapDifference > 0 ? 2 : 1,
                playerName: handicapDifference > 0 ? player2.name || 'Player 2' : player1.name || 'Player 1',
                action: 'Handicap Applied',
                points: Math.abs(handicapDifference),
                timestamp: new Date(), // Store as Date object
                score: Math.abs(handicapDifference)
            };
            setTurnHistory([turnEntry]);
        }

        // Remove the duplicate handicap recording
        // if (handicapDifference !== 0) {
        //     if (handicapDifference > 0) {
        //         addToTurnHistory(2, 'Handicap Applied', handicapDifference);
        //     } else if (handicapDifference < 0) {
        //         addToTurnHistory(1, 'Handicap Applied', Math.abs(handicapDifference));
        //     }
        // }
    };

    const closeWinModal = () => {
        setShowWinModal(false);
        setShowGameStats(false);
        setWinner(null);
        setShowPlayerStats(null);
    };

    const startNewGame = () => {
        setShowWinModal(false);
        setShowGameStats(false);
        setWinner(null);
        setShowPlayerStats(null);
        endGame();
    };

    // Add this function to handle showing stats
    const toggleGameStats = () => {
        setShowGameStats(!showGameStats);
    };

    const switchTurn = () => {
        if (gameStarted) {
            saveStateToHistory();
            saveGameState();
            if (activePlayer === 2) {
                setCurrentInning(prev => prev + 1);
            }
            setActivePlayer(activePlayer === 1 ? 2 : 1);
            const setCurrentPlayer = activePlayer === 1 ? setPlayer1 : setPlayer2;
            setCurrentPlayer(prev => ({
                ...prev,
                currentRun: 0
            }));
        }
    };

    // Add this function to generate detailed player stats
    const generateDetailedStats = (playerNum) => {
        const player = playerNum === 1 ? player1 : player2;
        
        // Process turn history to get details
        const details = turnHistory.reduce((acc, turn) => {
            if (turn.playerNum === playerNum) {
                // Track fouls
                if (turn.action === 'Foul' || turn.action === 'Breaking Foul' || 
                    turn.action === 'Breaking Foul - Rebreak' || turn.action === 'Intentional Foul') {
                    acc.foulDetails.push({
                        inning: turn.inning,
                        type: turn.action,
                        points: turn.points
                    });
                }
                
                // Track safes
                if (turn.action === 'Safety') {
                    acc.safeDetails.push({
                        inning: turn.inning,
                        timestamp: turn.timestamp
                    });
                }
                
                // Track misses
                if (turn.action === 'Miss') {
                    acc.missDetails.push({
                        inning: turn.inning,
                        timestamp: turn.timestamp
                    });
                }
                
                // Track scratches
                if (turn.action === 'Scratch') {
                    acc.scratchDetails.push({
                        inning: turn.inning,
                        timestamp: turn.timestamp
                    });
                }
                
                // Track finish racks separately
                if (turn.action === 'Finish Rack') {
                    acc.finishRackDetails.push({
                        inning: turn.inning,
                        points: turn.points,
                        timestamp: turn.timestamp
                    });
                }
                
                // Track regular scoring runs (excluding finish racks)
                if (turn.action === 'Points') {
                    acc.runDetails.push({
                        inning: turn.inning,
                        points: turn.points,
                        timestamp: turn.timestamp
                    });
                }
            }
            return acc;
        }, {
            foulDetails: [],
            safeDetails: [],
            missDetails: [],
            scratchDetails: [],
            finishRackDetails: [],
            runDetails: []
        });

        // Calculate totals from the actual turn history
        const totalFouls = details.foulDetails.length;
        const totalSafes = details.safeDetails.length;
        const totalMisses = details.missDetails.length;
        const totalScratches = details.scratchDetails.length;
        const totalFinishRacks = details.finishRackDetails.length;
        // Calculate best run as cumulative consecutive scoring actions
        let bestRun = 0;
        let currentRun = 0;
        
        // Sort all turns by timestamp to get chronological order
        const allTurns = turnHistory.filter(turn => turn.playerNum === playerNum).sort((a, b) => a.timestamp - b.timestamp);
        
        for (const turn of allTurns) {
            if (turn.action === 'Points' || turn.action === 'Finish Rack') {
                // Add to current run
                currentRun += turn.points || 0;
                bestRun = Math.max(bestRun, currentRun);
            } else if (['Miss', 'Safety', 'Foul', 'Intentional Foul', 'Breaking Foul', 'Scratch'].includes(turn.action)) {
                // End current run
                currentRun = 0;
            }
        }

        return {
            name: player.name || `Player ${playerNum}`,
            totalScore: player.score || 0,
            bestRun: bestRun,
            totalFouls: totalFouls,
            totalSafes: totalSafes,
            totalMisses: totalMisses,
            totalScratches: totalScratches,
            totalFinishRacks: totalFinishRacks,
            ...details
        };
    };

    // Update the ball counter to look like a pool ball
    const BallCounter = () => (
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            w-24 h-24 rounded-full
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
            shadow-lg border-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
            flex flex-col items-center justify-center
            z-10`}>
            <div className="text-5xl font-bold">
                {objectBallsOnTable}
            </div>
            <div className="text-sm opacity-60">
                BOT
            </div>
        </div>
    );

    // Update the stats grid styling
    const StatBox = ({ label, value, onClick, color = '', isSmallText = false }) => (
        <button 
            onClick={onClick}
            className={`bg-black/20 rounded-lg p-6 text-center min-h-[120px] min-w-[120px] 
                hover:bg-opacity-30 transition-all
                ${onClick ? 'cursor-pointer hover:scale-105 transform' : 'cursor-default'}`}
        >
            <div className={`text-6xl font-bold ${color}`}>
                {value}
            </div>
            <div className={`font-semibold opacity-75 ${isSmallText ? 'text-base' : 'text-xl'}`}>{label}</div>
        </button>
    );

    // Helper function to determine score color
    const getScoreColor = (score, playerNum) => {
        if (score >= targetGoal - 10) {
            return 'text-green-400';
        }
        return isDarkMode ? 'text-white brightness-150' : 'text-black';
    };

    // Add intentional foul handler
    const handleIntentionalFoul = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        
        // Check for consecutive fouls warning BEFORE recording the foul
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        if (foulHistory.length === 1 && foulHistory[0] === true) {
            // This will be the second consecutive foul
            setConsecutiveFoulsPlayer(playerNum);
            setShowConsecutiveFoulsModal(true);
        }
        
        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        setPlayer(prev => ({
            ...prev,
            score: prev.score - 1,
            fouls: (prev.fouls || 0) + 1,
            intentionalFouls: (prev.intentionalFouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1,
            totalPoints: prev.totalPoints || 0  // Ensure totalPoints is initialized
        }));

        addToTurnHistory(playerNum, 'Intentional Foul', -1);

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -15);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 15
            }));
        }
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    // Add handleBreakingFoul function
    const handleBreakingFoul = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        setBreakFoulPlayer(playerNum);
        setShowBreakFoulModal(true);
    };

    // Update handleBreakFoulContinue function
    const handleBreakFoulContinue = () => {
        const playerNum = breakFoulPlayer;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        // Check for consecutive fouls warning BEFORE recording the foul
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        if (foulHistory.length === 1 && foulHistory[0] === true) {
            // This will be the second consecutive foul
            setConsecutiveFoulsPlayer(playerNum);
            setShowConsecutiveFoulsModal(true);
        }
        
        saveGameState();
        
        setPlayer(prev => ({
            ...prev,
            score: prev.score - 2,
            fouls: (prev.fouls || 0) + 1,
            breakingFouls: (prev.breakingFouls || 0) + 1,
            currentRun: 0,
            totalInnings: (prev.totalInnings || 0) + 1,
            totalPoints: prev.totalPoints || 0  // Ensure totalPoints is initialized
        }));

        addToTurnHistory(playerNum, 'Breaking Foul', -2);

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -15);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 15
            }));
        }

        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }

        setActivePlayer(playerNum === 1 ? 2 : 1);
        setShowBreakFoulModal(false);
        setBreakFoulPlayer(null);
    };

    // Update handleBreakFoulRebreak function
    const handleBreakFoulRebreak = () => {
        const playerNum = breakFoulPlayer;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        // Check for consecutive fouls warning BEFORE recording the foul
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        if (foulHistory.length === 1 && foulHistory[0] === true) {
            // This will be the second consecutive foul
            setConsecutiveFoulsPlayer(playerNum);
            setShowConsecutiveFoulsModal(true);
        }
        
        saveGameState();
        
        // Update player state with breaking foul
        setPlayer(prev => ({
            ...prev,
            score: prev.score - 2,
            fouls: (prev.fouls || 0) + 1,
            breakingFouls: (prev.breakingFouls || 0) + 1,
            currentRun: 0
        }));

        addToTurnHistory(playerNum, 'Breaking Foul - Rebreak', -2);

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -15);
        }

        setObjectBallsOnTable(15);
        setIsBreakShot(true);
        setActivePlayer(playerNum);
        setShowBreakFoulModal(false);
        setBreakFoulPlayer(null);
    };

    // Update finishRack function
    const finishRack = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;
        // Only set breakPlayer if it is null and points are being awarded
        const currentPlayerState = playerNum === 1 ? player1 : player2;
        const remainingBalls = objectBallsOnTable;
        const pointsToAward = remainingBalls - 1;
        if (breakPlayer === null && pointsToAward > 0) {
            setBreakPlayer(playerNum);
        }
        saveStateToHistory();
        saveGameState();
        const setCurrentPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        
        addToTurnHistory(playerNum, 'Finish Rack', pointsToAward);

        setFoulHistory([]); // Reset foul history on successful finish
        setObjectBallsOnTable(15); // Reset to 15 balls

        const newScore = currentPlayerState.score + pointsToAward;
        const newCurrentRun = currentPlayerState.currentRun + pointsToAward;
        const newBestRun = Math.max(currentPlayerState.bestRun || 0, newCurrentRun);

        setCurrentPlayer(prev => ({
            ...prev,
            score: newScore,
            currentRun: newCurrentRun,
            bestRun: newBestRun,
            high: Math.max(prev.high, newCurrentRun),
            bestGameRun: Math.max(prev.bestGameRun, newCurrentRun)
        }));

        // Check for win condition
        if (newScore >= targetGoal) {
            handleWin(playerNum, newScore, newCurrentRun, newBestRun);
            return;
        }

        // When finishing a rack, the player continues their turn
        // No turn switching needed
    };

    // Update calculatePlayerStats function to properly map frontend stats
    const calculatePlayerStats = (player, playerNum) => {
        let totalPoints = player.score || 0;
        let totalSafes = player.safes || 0;
        let totalMisses = player.misses || 0;
        let totalFouls = player.fouls || 0;
        let totalScratches = player.scratches || 0;
        let totalIntentionalFouls = player.intentionalFouls || 0;
        let totalBreakingFouls = player.breakingFouls || 0;
        // Removed unused bestRunInGame variable
        let currentRunCount = 0;
        let maxRunInGame = 0;
        let breakAndRuns = 0;
        let defensiveShots = player.defensiveShots || 0;
        let safetyPlays = player.safetyPlays || 0;
        let playerInnings = 0;
        let wasBreakShot = false;

        // Count additional stats from turn history
        turnHistory.forEach(turn => {
            if (turn.playerNum === playerNum) {
                playerInnings++;
                wasBreakShot = turn.isBreak || false;

                switch (turn.action) {
                    case 'Points':
                    case 'Finish Rack':
                        currentRunCount += turn.points || 0;
                        maxRunInGame = Math.max(maxRunInGame, currentRunCount);
                        if (wasBreakShot && currentRunCount >= 14) {
                            breakAndRuns++;
                        }
                        break;
                    case 'Breaking Foul':
                    case 'Breaking Foul - Rebreak':
                        totalBreakingFouls++;
                        totalFouls++;
                        currentRunCount = 0;
                        break;
                    case 'Safety':
                        totalSafes++;
                        safetyPlays++;
                        defensiveShots++;
                        currentRunCount = 0;
                        break;
                    case 'Miss':
                        totalMisses++;
                        currentRunCount = 0;
                        break;
                    case 'Scratch':
                    case 'Break Scratch':
                        totalScratches++;
                        totalFouls++;
                        currentRunCount = 0;
                        break;
                    case 'Foul':
                        totalFouls++;
                        currentRunCount = 0;
                        break;
                    case 'Intentional Foul':
                        totalFouls++;
                        totalIntentionalFouls++;
                        currentRunCount = 0;
                        break;
                    default:
                        if (!['New Rack', 'Undo', 'Handicap Applied'].includes(turn.action)) {
                            currentRunCount = 0;
                        }
                }
                wasBreakShot = false;
            }
        });

        // Calculate final stats
        const stats = {
            totalPoints: totalPoints,
            totalInnings: playerInnings,
            breakAndRuns: breakAndRuns,
            safetyPlays: safetyPlays,
            safes: totalSafes,
            defensiveShots: defensiveShots,
            scratches: totalScratches,
            avgPointsPerInning: playerInnings > 0 ? (totalPoints / playerInnings) : 0,
            fouls: totalFouls,
            intentionalFouls: totalIntentionalFouls,
            breakingFouls: totalBreakingFouls,
            misses: totalMisses,
            bestRun: Math.max(maxRunInGame, player.bestRun || 0),
            currentRun: currentRunCount,
            runHistory: []
        };

        // Ensure all stats are numbers and non-negative
        Object.keys(stats).forEach(key => {
            if (key === 'runHistory') return;
            if (key === 'avgPointsPerInning') {
                stats[key] = Math.max(0, parseFloat(stats[key]) || 0);
            } else {
                stats[key] = Math.max(0, parseInt(stats[key]) || 0);
            }
        });

        return stats;
    };

    // Update saveMatchToDatabase function
    const saveMatchToDatabase = async (gameResult, duration) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!user || !token) {
                console.error('No authentication found, redirecting to login');
                navigate('/login');
                throw new Error('Authentication information not found');
            }

            // Calculate final stats for both players
            const player1Stats = {
                score: player1.score || 0,
                totalPoints: player1.score || 0,
                totalInnings: currentInning,
                safes: player1.safes || 0,
                misses: player1.misses || 0,
                bestRun: player1.bestRun || 0,
                scratches: player1.scratches || 0,
                fouls: player1.fouls || 0,
                intentionalFouls: player1.intentionalFouls || 0,
                breakingFouls: player1.breakingFouls || 0,
                currentRun: player1.currentRun || 0,
                runHistory: player1.runHistory || []
            };

            const player2Stats = {
                score: player2.score || 0,
                totalPoints: player2.score || 0,
                totalInnings: currentInning,
                safes: player2.safes || 0,
                misses: player2.misses || 0,
                bestRun: player2.bestRun || 0,
                scratches: player2.scratches || 0,
                fouls: player2.fouls || 0,
                intentionalFouls: player2.intentionalFouls || 0,
                breakingFouls: player2.breakingFouls || 0,
                currentRun: player2.currentRun || 0,
                runHistory: player2.runHistory || []
            };

            // Process innings data to match backend schema
            const processedInnings = turnHistory.map(turn => ({
                playerNumber: turn.playerNum,
                playerName: turn.playerName,
                ballsPocketed: turn.action === 'Points' || turn.action === 'Finish Rack' ? turn.points : 0,
                action: turn.action,
                timestamp: turn.timestamp,
                score: turn.score,
                inning: turn.inning,
                points: turn.points,
                isBreak: false,
                isScratch: turn.action.toLowerCase().includes('scratch'),
                isSafetyPlay: turn.action.toLowerCase().includes('safe'),
                isDefensiveShot: turn.action.toLowerCase().includes('defensive'),
                isFoul: turn.action.toLowerCase().includes('foul'),
                isBreakingFoul: turn.action.toLowerCase().includes('breaking foul'),
                isIntentionalFoul: turn.action.toLowerCase().includes('intentional foul'),
                isMiss: turn.action.toLowerCase().includes('miss'),
                actionText: turn.action,
                actionColor: '#000000'
            }));

            const matchData = {
                player1: {
                    name: player1.name,
                    handicap: player1.handicap || 0
                },
                player2: {
                    name: player2.name,
                    handicap: player2.handicap || 0
                },
                player1Score: gameResult.finalScore1,
                player2Score: gameResult.finalScore2,
                winner: {
                    name: gameResult.winner.name,
                    handicap: gameResult.winner.handicap || 0
                },
                gameType: gameType || "Straight Pool",
                duration: duration || 0,
                player1Stats,
                player2Stats,
                innings: processedInnings,
                matchDate: new Date(),
                targetScore: targetGoal || 0,
                userId: user.id
            };

            console.log('Sending match data:', matchData);

            const response = await fetch(`${getApiUrl()}/matches`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(matchData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error saving match:', errorData);
                throw new Error(`Failed to save match: ${errorData.message || 'Unknown error'}`);
            }

            const savedMatch = await response.json();
            console.log('Match saved successfully:', savedMatch);
            return savedMatch;
        } catch (error) {
            console.error('Error in saveMatchToDatabase:', error);
            throw error;
        }
    };

    // Add this function before the return statement
    const handleShowRuns = (playerNum) => {
        setSelectedPlayer(playerNum);
        setShowRunsModal(true);
    };

    // Update the getPlayerRuns function to group runs into turns
    const getPlayerRuns = (playerNum) => {
        const turns = [];
        let currentTurn = {
            shots: [],
            totalPoints: 0,
            inning: null,
            startTime: null,
            endTime: null
        };
        
        turnHistory.forEach((turn, index) => {
            if (turn.playerNum === playerNum) {
                if (turn.action === 'Points' || turn.action === 'Finish Rack') {
                    // Start a new turn if this is the first shot
                    if (currentTurn.shots.length === 0) {
                        currentTurn = {
                            shots: [],
                            totalPoints: 0,
                            inning: turn.inning,
                            startTime: turn.timestamp
                        };
                    }
                    
                    // Add shot to current turn
                    currentTurn.shots.push({
                        points: turn.points,
                        timestamp: turn.timestamp
                    });
                    currentTurn.totalPoints += turn.points;
                    currentTurn.endTime = turn.timestamp;
                } else if (['Miss', 'Foul', 'Scratch', 'Safety', 'Breaking Foul', 'Intentional Foul'].includes(turn.action)) {
                    // End current turn if there were any shots
                    if (currentTurn.shots.length > 0) {
                        turns.push({...currentTurn});
                        currentTurn = {
                            shots: [],
                            totalPoints: 0,
                            inning: null,
                            startTime: null,
                            endTime: null
                        };
                    }
                }
            }
        });
        
        // Add the last turn if it exists
        if (currentTurn.shots.length > 0) {
            turns.push(currentTurn);
        }
        
        return turns;
    };

    return (
        <div className={`min-h-screen h-screen overflow-hidden transition-colors duration-200
            ${isDarkMode 
                ? 'bg-gradient-to-br from-gray-900 to-black text-white' 
                : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
            
            <div className="h-screen flex flex-col px-1">
                {/* Header Section */}
                <div className={`rounded-lg p-2 mb-1 transition-colors duration-200
                    ${isDarkMode 
                        ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                        : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}`}>
                    
                    <div className="grid grid-cols-3 gap-4">
                        {/* Player 1 Info */}
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                placeholder="Player 1"
                                className={`w-full bg-transparent border-b text-xl font-medium 
                                    focus:outline-none transition-colors duration-200
                                    ${isDarkMode 
                                        ? 'border-blue-500 focus:border-blue-400' 
                                        : 'border-blue-600 focus:border-blue-500'}`}
                                value={player1.name}
                                onChange={(e) => setPlayer1({...player1, name: e.target.value})}
                            />
                            <input
                                type="number"
                                placeholder="HC"
                                className={`w-20 bg-transparent border-b text-base text-center
                                    focus:outline-none transition-colors duration-200
                                    ${isDarkMode 
                                        ? 'border-blue-500 focus:border-blue-400' 
                                        : 'border-blue-600 focus:border-blue-500'}`}
                                value={player1.handicap}
                                onChange={(e) => setPlayer1({...player1, handicap: Number(e.target.value)})}
                            />
                        </div>

                        {/* Game Controls */}
                        <div className="flex items-center justify-center gap-4">
                            {/* Menu Toggle */}
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className={`p-4 rounded-lg transition-all duration-200 min-h-[60px] min-w-[60px]
                                    ${isDarkMode 
                                        ? 'bg-black/30 hover:bg-black/50 border border-white/10' 
                                        : 'bg-white/80 hover:bg-white border border-gray-200'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    className={`w-20 bg-transparent border-b text-2xl font-bold
                                        text-center focus:outline-none transition-colors duration-200
                                        ${isDarkMode 
                                            ? 'border-purple-500' 
                                            : 'border-purple-600'}`}
                                    value={targetGoal}
                                    onChange={(e) => setTargetGoal(Number(e.target.value))}
                                />
                                <div className="text-sm opacity-60">TARGET</div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-4 rounded-lg transition-all duration-200 min-h-[60px] min-w-[60px]
                                    hover:scale-110 transform shadow-lg
                                    dark:bg-gray-800 bg-white"
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? (
                                    <SunIcon className="h-5 w-5 text-yellow-400" />
                                ) : (
                                    <MoonIcon className="h-5 w-5 text-gray-700" />
                                )}
                            </button>
                        </div>

                        {/* Player 2 Info */}
                        <div className="flex items-center gap-2 justify-end">
                            <input
                                type="number"
                                placeholder="HC"
                                className={`w-20 bg-transparent border-b text-base text-center
                                    focus:outline-none transition-colors duration-200
                                    ${isDarkMode 
                                        ? 'border-orange-500 focus:border-orange-400' 
                                        : 'border-orange-600 focus:border-orange-500'}`}
                                value={player2.handicap}
                                onChange={(e) => setPlayer2({...player2, handicap: Number(e.target.value)})}
                            />
                            <input
                                type="text"
                                placeholder="Player 2"
                                className={`w-full bg-transparent border-b text-xl text-right
                                    font-medium focus:outline-none transition-colors duration-200
                                    ${isDarkMode 
                                        ? 'border-orange-500 focus:border-orange-400' 
                                        : 'border-orange-600 focus:border-orange-500'}`}
                                value={player2.name}
                                onChange={(e) => setPlayer2({...player2, name: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Game Controls Row */}
                    <div className="flex justify-center gap-4 mt-2">
                        <button 
                            onClick={gameStarted ? endGame : startGame}
                            className={`px-8 py-4 rounded-full text-lg font-medium min-h-[60px]
                                transition-colors duration-200 ${
                                gameStarted 
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            }`}
                        >
                            {gameStarted ? 'End Game' : 'Start Game'}
                        </button>
                        
                        {gameStarted && (
                            <>
                                {objectBallsOnTable > 1 && (
                                    <button
                                        onClick={() => finishRack(activePlayer)}
                                        className="px-8 py-4 rounded-full text-lg font-medium min-h-[60px]
                                            bg-green-500/20 text-green-400 hover:bg-green-500/30 
                                            transition-colors duration-200"
                                    >
                                        Finish Rack (+{objectBallsOnTable})
                                    </button>
                                )}

                                <button 
                                    onClick={switchTurn}
                                    className="px-8 py-4 rounded-full text-lg font-medium min-h-[60px]
                                        bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 
                                        transition-colors duration-200"
                                >
                                    Switch
                                </button>

                                <button 
                                    onClick={undoLastAction}
                                    className="px-8 py-4 rounded-full text-lg font-medium min-h-[60px]
                                        bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 
                                        transition-colors duration-200"
                                >
                                    Undo
                                </button>

                                <button 
                                    onClick={() => setShowHistoryModal(true)}
                                    className="px-8 py-4 rounded-full text-lg font-medium min-h-[60px]
                                        bg-green-500/20 text-green-400 hover:bg-green-500/30 
                                        transition-colors duration-200"
                                >
                                    History
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Scoring Section */}
                <div className="grid grid-cols-2 gap-6 h-[calc(100vh-180px)] relative">
                    {/* Player 1 Score */}
                    <div className={`rounded-lg p-2 transition-colors duration-200 h-full flex flex-col relative
                        ${isDarkMode 
                            ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}
                        ${activePlayer === 1 ? 'ring-2 ring-blue-500/50 animate-pulse' : 'opacity-50'}
                        ${activePlayer !== 1 && gameStarted ? 'pointer-events-none' : ''}`}>
                        


                        <div className="text-center flex-grow flex flex-col justify-center">
                            {activePlayer === 1 && gameStarted && (
                                <div className="text-xl font-semibold mb-2 animate-pulse">
                                    Shooting
                                </div>
                            )}
                            <div className={`text-8xl font-bold mb-4 transition-colors duration-300
                                ${getScoreColor(player1.score, 1)}`}>
                                {player1.score}
                            </div>
                            <div className="flex justify-center mb-4">
                                <button 
                                    onClick={() => gameStarted && adjustScore(1, 1)}
                                    className="text-7xl text-gray-400 hover:text-white 
                                        w-44 h-44 rounded-full bg-gray-800/50 
                                        flex items-center justify-center transition-colors
                                        hover:scale-105 transform"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Player 1 Stats */}
                        <div className="flex flex-col gap-4">
                            {/* Top row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox 
                                    label="Safety"
                                    value={player1.safes || 0}
                                    onClick={() => gameStarted && handleSafe(1)}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Miss"
                                    value={player1.misses || 0}
                                    onClick={() => gameStarted && handleMiss(1)}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Run"
                                    value={player1.currentRun || 0}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Break F"
                                    value={player1.breakingFouls || 0}
                                    onClick={() => gameStarted && handleBreakingFoul(1)}
                                    color="text-red-400"
                                    isSmallText={true}
                                />
                            </div>
                            {/* Bottom row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox 
                                    label="Best"
                                    value={(() => {
                                        // Calculate cumulative best run for player 1
                                        let bestRun = 0;
                                        let currentRun = 0;
                                        const allTurns = turnHistory.filter(turn => turn.playerNum === 1).sort((a, b) => a.timestamp - b.timestamp);
                                        for (const turn of allTurns) {
                                            if (turn.action === 'Points' || turn.action === 'Finish Rack') {
                                                currentRun += turn.points || 0;
                                                bestRun = Math.max(bestRun, currentRun);
                                            } else if (['Miss', 'Safety', 'Foul', 'Intentional Foul', 'Breaking Foul', 'Scratch'].includes(turn.action)) {
                                                currentRun = 0;
                                            }
                                        }
                                        return bestRun;
                                    })()}
                                    onClick={() => handleShowRuns(1)}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Scratch"
                                    value={player1.scratches || 0}
                                    onClick={() => gameStarted && handleScratch(1)}
                                    color="text-yellow-400"
                                />
                                <StatBox 
                                    label="Foul"
                                    value={player1.fouls || 0}
                                    onClick={() => gameStarted && handleFoul(1)}
                                    color="text-red-400"
                                />
                                <StatBox 
                                    label="Int Foul"
                                    value={player1.intentionalFouls || 0}
                                    onClick={() => gameStarted && handleIntentionalFoul(1)}
                                    color="text-red-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Centered Ball Counter */}
                    <BallCounter />

                    {/* Player 2 Score */}
                    <div className={`rounded-lg p-2 transition-colors duration-200 h-full flex flex-col relative
                        ${isDarkMode 
                            ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}
                        ${activePlayer === 2 ? 'ring-2 ring-orange-500/50 animate-pulse' : 'opacity-50'}
                        ${activePlayer !== 2 && gameStarted ? 'pointer-events-none' : ''}`}>
                        


                        <div className="text-center flex-grow flex flex-col justify-center">
                            {activePlayer === 2 && gameStarted && (
                                <div className="text-xl font-semibold mb-2 animate-pulse">
                                    Shooting
                                </div>
                            )}
                            <div className={`text-8xl font-bold mb-4 transition-colors duration-300
                                ${getScoreColor(player2.score, 2)}`}>
                                {player2.score}
                            </div>
                            <div className="flex justify-center mb-4">
                                <button 
                                    onClick={() => gameStarted && adjustScore(2, 1)}
                                    className="text-7xl text-gray-400 hover:text-white 
                                        w-44 h-44 rounded-full bg-gray-800/50 
                                        flex items-center justify-center transition-colors
                                        hover:scale-105 transform"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Player 2 Stats */}
                        <div className="flex flex-col gap-4">
                            {/* Top row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox 
                                    label="Safety"
                                    value={player2.safes || 0}
                                    onClick={() => gameStarted && handleSafe(2)}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Miss"
                                    value={player2.misses || 0}
                                    onClick={() => gameStarted && handleMiss(2)}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Run"
                                    value={player2.currentRun || 0}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Break F"
                                    value={player2.breakingFouls || 0}
                                    onClick={() => gameStarted && handleBreakingFoul(2)}
                                    color="text-red-400"
                                    isSmallText={true}
                                />
                            </div>
                            {/* Bottom row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox 
                                    label="Best"
                                    value={(() => {
                                        // Calculate cumulative best run for player 2
                                        let bestRun = 0;
                                        let currentRun = 0;
                                        const allTurns = turnHistory.filter(turn => turn.playerNum === 2).sort((a, b) => a.timestamp - b.timestamp);
                                        for (const turn of allTurns) {
                                            if (turn.action === 'Points' || turn.action === 'Finish Rack') {
                                                currentRun += turn.points || 0;
                                                bestRun = Math.max(bestRun, currentRun);
                                            } else if (['Miss', 'Safety', 'Foul', 'Intentional Foul', 'Breaking Foul', 'Scratch'].includes(turn.action)) {
                                                currentRun = 0;
                                            }
                                        }
                                        return bestRun;
                                    })()}
                                    onClick={() => handleShowRuns(2)}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Scratch"
                                    value={player2.scratches || 0}
                                    onClick={() => gameStarted && handleScratch(2)}
                                    color="text-yellow-400"
                                />
                                <StatBox 
                                    label="Foul"
                                    value={player2.fouls || 0}
                                    onClick={() => gameStarted && handleFoul(2)}
                                    color="text-red-400"
                                />
                                <StatBox 
                                    label="Int Foul"
                                    value={player2.intentionalFouls || 0}
                                    onClick={() => gameStarted && handleIntentionalFoul(2)}
                                    color="text-red-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section with Game Info */}
                <div className={`fixed bottom-20 left-0 right-0 
                    ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} 
                    backdrop-blur-sm`}>
                    {/* Game Info Row */}
                    <div className="flex justify-center items-center gap-6 p-3">
                        <div>
                            Inning: {currentInning}
                        </div>
                        <div>
                            Balls: {objectBallsOnTable}
                        </div>
                        <div>
                            Break: {breakPlayer === null ? 'Not Set' : (breakPlayer === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2')}
                        </div>
                        <div>
                            Turn: {activePlayer === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'}
                        </div>
                    </div>
                </div>

                {/* History Modal */}
                {showHistoryModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                        <div className={`rounded-xl p-4 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden
                            shadow-2xl animate-fadeIn transition-colors duration-200
                            ${isDarkMode 
                                ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                            
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Game History</h2>
                                <div className="flex gap-2">
                                    {winner && (
                                        <button
                                            onClick={() => {
                                                setShowHistoryModal(false);
                                                setShowPlayerStats(1);
                                            }}
                                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                                                text-blue-300 rounded-full transition-colors text-sm"
                                        >
                                            {player1.name || 'Player 1'} Stats
                                        </button>
                                    )}
                                    {winner && (
                                        <button
                                            onClick={() => {
                                                setShowHistoryModal(false);
                                                setShowPlayerStats(2);
                                            }}
                                            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 
                                                text-orange-300 rounded-full transition-colors text-sm"
                                        >
                                            {player2.name || 'Player 2'} Stats
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowHistoryModal(false)}
                                        className="p-4 rounded-full hover:bg-gray-700/50 min-h-[50px] min-w-[50px]"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-2">
                                {(() => {
                                    // Group turns by inning and player
                                    const inningGroups = {};
                                    turnHistory.forEach((turn) => {
                                        const key = `${turn.inning}-${turn.playerNum}`;
                                        if (!inningGroups[key]) {
                                            inningGroups[key] = {
                                                inning: turn.inning,
                                                playerNum: turn.playerNum,
                                                playerName: turn.playerName,
                                                netPoints: 0,
                                                timestamp: turn.timestamp
                                            };
                                        }
                                        inningGroups[key].netPoints += turn.points || 0;
                                    });

                                    // Convert to array and sort by inning
                                    const sortedInnings = Object.values(inningGroups).sort((a, b) => a.inning - b.inning);

                                    return sortedInnings.map((inning, index) => {
                                        let timeString;
                                        try {
                                            const timestamp = inning.timestamp ? new Date(inning.timestamp) : new Date();
                                            if (isNaN(timestamp.getTime())) {
                                                timeString = format(new Date(), 'h:mm a');
                                            } else {
                                                timeString = format(timestamp, 'h:mm a');
                                            }
                                        } catch (error) {
                                            console.warn('Error formatting inning timestamp:', error);
                                            timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        }
                                        
                                        return (
                                            <div key={index} 
                                                className={`p-3 rounded-lg flex items-center justify-between
                                                    ${isDarkMode ? 'bg-black/30' : 'bg-gray-100'}
                                                    ${inning.playerNum === 1 
                                                        ? 'border-l-4 border-blue-500' 
                                                        : 'border-l-4 border-orange-500'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-medium ${
                                                        inning.playerNum === 1 ? 'text-blue-400' : 'text-orange-400'
                                                    }`}>
                                                        {inning.playerName}
                                                    </span>
                                                    <span className="opacity-75 font-semibold">
                                                        Inning {inning.inning}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`text-2xl font-bold ${
                                                        inning.netPoints > 0 ? 'text-green-400' :
                                                        inning.netPoints < 0 ? 'text-red-400' : 'text-gray-400'
                                                    }`}>
                                                        {inning.netPoints > 0 ? '+' : ''}{inning.netPoints}
                                                    </div>
                                                    <span className="text-sm opacity-60">
                                                        {timeString}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add a View Stats button when there's a winner but modal is closed */}
                {winner && !showWinModal && (
                    <button
                        onClick={toggleGameStats}
                        className="fixed bottom-20 right-4 px-6 py-4 rounded-lg text-lg font-medium min-h-[60px]
                            bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 
                            transition-colors z-50"
                    >
                        View Stats
                    </button>
                )}

                {/* Win Modal */}
                {(showWinModal || showGameStats) && (
                    <>
                        {showWinModal && <Confetti
                            width={windowSize.width}
                            height={windowSize.height}
                            numberOfPieces={200}
                            recycle={false}
                            colors={['#60A5FA', '#34D399', '#F87171', '#FBBF24']}
                        />}
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                            flex items-center justify-center z-50">
                            <div className={`rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto
                                shadow-2xl animate-fadeIn transition-colors duration-200
                                ${isDarkMode 
                                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                    : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                                
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-4xl font-bold text-purple-400">
                                        🏆 Game Over 🏆
                                    </h2>
                                    <button
                                        onClick={showWinModal ? closeWinModal : toggleGameStats}
                                        className="p-4 rounded-full hover:bg-gray-700/50 min-h-[50px] min-w-[50px]"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Final Score Display */}
                                <div className="text-center mb-6">
                                    <p className="text-2xl font-medium mb-2">
                                        Winner: {winner === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'}
                                    </p>
                                    <div className="flex justify-center items-center gap-8 text-3xl font-bold mb-4">
                                        <div className={`${winner === 1 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {player1.name || 'Player 1'}: {player1.score}
                                        </div>
                                        <div className="text-2xl opacity-60">vs</div>
                                        <div className={`${winner === 2 ? 'text-green-400' : 'text-gray-400'}`}>
                                            {player2.name || 'Player 2'}: {player2.score}
                                        </div>
                                    </div>
                                    <div className="text-sm opacity-60">
                                        Game ended in {currentInning - 1} innings • {formatTime(gameTime)}
                                    </div>
                                </div>

                                {/* Player Stats Buttons */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    {[1, 2].map(playerNum => {
                                        const stats = generateDetailedStats(playerNum);
                                        return (
                                            <button
                                                key={playerNum}
                                                onClick={() => setShowPlayerStats(playerNum)}
                                                className={`p-6 rounded-lg text-left transition-all hover:scale-105
                                                    ${isDarkMode ? 'bg-black/30 hover:bg-black/50' : 'bg-gray-100 hover:bg-gray-200'}
                                                    ${winner === playerNum ? 'ring-2 ring-green-500/50' : ''}`}
                                            >
                                                <h3 className={`text-xl font-bold mb-2 ${
                                                    playerNum === 1 ? 'text-blue-400' : 'text-orange-400'
                                                }`}>
                                                    {stats.name} {winner === playerNum && '🏆'}
                                                </h3>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-2xl font-bold">{stats.totalScore}</div>
                                                        <div className="text-sm opacity-60">Final Score</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-2xl font-bold">{stats.bestRun}</div>
                                                        <div className="text-sm opacity-60">Best Run</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-2xl font-bold">{(() => {
                                                            const playerInnings = new Set();
                                                            turnHistory.forEach(turn => {
                                                                if (turn.playerNum === playerNum) {
                                                                    playerInnings.add(turn.inning);
                                                                }
                                                            });
                                                            return playerInnings.size;
                                                        })()}</div>
                                                        <div className="text-sm opacity-60">Innings</div>
                                                    </div>
                                                </div>
                                                <p className="text-sm opacity-60 mt-2">Click to view detailed stats</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="text-center space-x-4">
                                    <p className="opacity-60 mb-2">Game Time: {formatTime(gameTime)}</p>
                                    <button
                                        onClick={startNewGame}
                                        className="px-8 py-3 bg-purple-500/20 hover:bg-purple-500/30 
                                            text-purple-300 rounded-full transition-colors text-lg"
                                    >
                                        New Game
                                    </button>
                                    <button
                                        onClick={() => navigate('/history')}
                                        className="px-8 py-3 bg-blue-500/20 hover:bg-blue-500/30 
                                            text-blue-300 rounded-full transition-colors text-lg"
                                    >
                                        View History
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Individual Player Stats Modal */}
                {showPlayerStats && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                        <div className={`rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto
                            shadow-2xl animate-fadeIn transition-colors duration-200
                            ${isDarkMode 
                                ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                            
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">
                                    {showPlayerStats === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'} Stats
                                </h2>
                                <button
                                    onClick={() => setShowPlayerStats(null)}
                                    className="p-2 rounded-full hover:bg-gray-700/50"
                                >
                                    ✕
                                </button>
                            </div>

                            {(() => {
                                const stats = generateDetailedStats(showPlayerStats);
                                const playerInnings = new Set();
                                turnHistory.forEach(turn => {
                                    if (turn.playerNum === showPlayerStats) {
                                        playerInnings.add(turn.inning);
                                    }
                                });
                                const totalInnings = playerInnings.size;
                                
                                return (
                                    <div className="space-y-6">
                                        {/* Player Summary */}
                                        <div className={`p-4 rounded-lg ${
                                            showPlayerStats === 1 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-orange-500/10 border border-orange-500/20'
                                        }`}>
                                            <h3 className={`text-lg font-bold mb-2 ${
                                                showPlayerStats === 1 ? 'text-blue-400' : 'text-orange-400'
                                            }`}>
                                                {stats.name} Summary
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="opacity-60">Final Score:</span>
                                                    <span className="ml-2 font-bold">{stats.totalScore}</span>
                                                </div>
                                                <div>
                                                    <span className="opacity-60">Total Innings:</span>
                                                    <span className="ml-2 font-bold">{totalInnings}</span>
                                                </div>
                                                <div>
                                                    <span className="opacity-60">Best Run:</span>
                                                    <span className="ml-2 font-bold">{stats.bestRun}</span>
                                                </div>
                                                <div>
                                                    <span className="opacity-60">Avg per Inning:</span>
                                                    <span className="ml-2 font-bold">
                                                        {totalInnings > 0 ? (stats.totalScore / totalInnings).toFixed(1) : '0.0'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Key Stats Grid */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="bg-black/20 rounded p-3 text-center">
                                                <div className="text-2xl font-bold">{stats.totalScore}</div>
                                                <div className="text-sm opacity-60">Final Score</div>
                                            </div>
                                            <div className="bg-black/20 rounded p-3 text-center">
                                                <div className="text-2xl font-bold">{stats.bestRun}</div>
                                                <div className="text-sm opacity-60">Best Run</div>
                                            </div>
                                            <div className="bg-black/20 rounded p-3 text-center">
                                                <div className="text-2xl font-bold">{totalInnings}</div>
                                                <div className="text-sm opacity-60">Total Innings</div>
                                            </div>
                                            <div className="bg-black/20 rounded p-3 text-center">
                                                <div className="text-2xl font-bold">{totalInnings > 0 ? (stats.totalScore / totalInnings).toFixed(1) : '0.0'}</div>
                                                <div className="text-sm opacity-60">Avg/Inning</div>
                                            </div>
                                        </div>

                                        {/* Game Stats Summary */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="bg-green-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-green-400">{stats.totalSafes || 0}</div>
                                                <div className="text-sm opacity-60">Safety</div>
                                            </div>
                                            <div className="bg-red-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-red-400">{stats.totalMisses || 0}</div>
                                                <div className="text-sm opacity-60">Misses</div>
                                            </div>
                                            <div className="bg-orange-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-orange-400">{stats.totalScratches || 0}</div>
                                                <div className="text-sm opacity-60">Scratches</div>
                                            </div>
                                            <div className="bg-red-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-red-400">{stats.totalFouls || 0}</div>
                                                <div className="text-sm opacity-60">Fouls</div>
                                            </div>
                                        </div>

                                        {/* Foul Types Breakdown */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-yellow-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-yellow-400">
                                                    {(stats.foulDetails || []).filter(f => f.type.includes('Break')).length}
                                                </div>
                                                <div className="text-sm opacity-60">Break Fouls</div>
                                            </div>
                                            <div className="bg-purple-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-purple-400">
                                                    {(stats.foulDetails || []).filter(f => f.type.includes('Intentional')).length}
                                                </div>
                                                <div className="text-sm opacity-60">Int Fouls</div>
                                            </div>
                                            <div className="bg-indigo-500/10 rounded p-2 text-center">
                                                <div className="text-lg font-bold text-indigo-400">{stats.totalFinishRacks || 0}</div>
                                                <div className="text-sm opacity-60">Finish Racks</div>
                                            </div>
                                        </div>

                                                                                {/* Detailed Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="bg-green-500/20 rounded p-3">
                                                    <h4 className="font-medium text-green-400 mb-2">Safety ({stats.totalSafes || 0})</h4>
                                                    <div className="space-y-1">
                                                        {(stats.safeDetails || []).map((safe, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {safe.inning}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-red-500/20 rounded p-3">
                                                    <h4 className="font-medium text-red-400 mb-2">Misses ({stats.totalMisses || 0})</h4>
                                                    <div className="space-y-1">
                                                        {(stats.missDetails || []).map((miss, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {miss.inning}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-500/20 rounded p-3">
                                                    <h4 className="font-medium text-blue-400 mb-2">Runs</h4>
                                                    <div className="space-y-1">
                                                        {(() => {
                                                            // Show cumulative runs instead of per-inning
                                                            const runs = [];
                                                            let currentRun = 0;
                                                            let runStart = null;
                                                            
                                                            // Sort all turns by timestamp to get chronological order
                                                            const allTurns = (showPlayerStats === 1 ? player1.turnHistory : player2.turnHistory) || [];
                                                            const sortedTurns = [...allTurns].sort((a, b) => a.timestamp - b.timestamp);
                                                            
                                                            for (const turn of sortedTurns) {
                                                                if (turn.action === 'Points' || turn.action === 'Finish Rack') {
                                                                    if (currentRun === 0) {
                                                                        runStart = turn.inning;
                                                                    }
                                                                    currentRun += turn.points || 0;
                                                                } else if (['Miss', 'Safety', 'Foul', 'Intentional Foul', 'Breaking Foul', 'Scratch'].includes(turn.action)) {
                                                                    if (currentRun > 0) {
                                                                        runs.push({
                                                                            start: runStart,
                                                                            end: turn.inning - 1,
                                                                            points: currentRun
                                                                        });
                                                                    }
                                                                    currentRun = 0;
                                                                    runStart = null;
                                                                }
                                                            }
                                                            
                                                            // Add final run if game ended during a run
                                                            if (currentRun > 0) {
                                                                runs.push({
                                                                    start: runStart,
                                                                    end: currentInning,
                                                                    points: currentRun
                                                                });
                                                            }

                                                            return runs.map((run, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>
                                                                        {run.start === run.end 
                                                                            ? `Inning ${run.start}` 
                                                                            : `Innings ${run.start}-${run.end}`}
                                                                    </span>
                                                                    <span className="text-green-400">+{run.points}</span>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>

                                                <div className="bg-orange-500/20 rounded p-3">
                                                    <h4 className="font-medium text-orange-400 mb-2">Scratches</h4>
                                                    <div className="space-y-1">
                                                        {(stats.scratchDetails || []).map((scratch, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {scratch.inning}</span>
                                                                <span className="text-red-400">-1</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="bg-red-500/20 rounded p-3">
                                                    <h4 className="font-medium text-red-400 mb-2">Fouls ({stats.totalFouls || 0})</h4>
                                                    <div className="space-y-1">
                                                        {(stats.foulDetails || []).map((foul, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {foul.inning}</span>
                                                                <span className="text-red-400">{foul.type} ({foul.points})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-yellow-500/20 rounded p-3">
                                                    <h4 className="font-medium text-yellow-400 mb-2">Break Fouls</h4>
                                                    <div className="space-y-1">
                                                        {(stats.foulDetails || []).filter(f => f.type.includes('Break')).map((foul, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {foul.inning}</span>
                                                                <span className="text-red-400">{foul.points}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-purple-500/20 rounded p-3">
                                                    <h4 className="font-medium text-purple-400 mb-2">Intentional Fouls</h4>
                                                    <div className="space-y-1">
                                                        {(stats.foulDetails || []).filter(f => f.type.includes('Intentional')).map((foul, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {foul.inning}</span>
                                                                <span className="text-red-400">{foul.points}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-indigo-500/20 rounded p-3">
                                                    <h4 className="font-medium text-indigo-400 mb-2">Finish Racks</h4>
                                                    <div className="space-y-1">
                                                        {(stats.finishRackDetails || []).map((finish, idx) => (
                                                            <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                <span>Inning {finish.inning}</span>
                                                                <span className="text-green-400">+{finish.points}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex justify-center gap-4 pt-4">
                                            <button
                                                onClick={() => {
                                                    setShowPlayerStats(null);
                                                    setShowHistoryModal(true);
                                                }}
                                                className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 
                                                    text-blue-300 rounded-full transition-colors"
                                            >
                                                View Game History
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Breaking Foul Modal */}
                {showBreakFoulModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                        <div className={`rounded-xl p-4 w-full max-w-md mx-4
                            shadow-2xl animate-fadeIn transition-colors duration-200
                            ${isDarkMode 
                                ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                            
                            <h2 className="text-xl font-bold mb-4 text-center">Breaking Foul</h2>
                            <p className="text-center mb-6 opacity-75">
                                Would you like to continue playing or re-break?
                            </p>

                            <div className="flex justify-center gap-6">
                                <button
                                    onClick={handleBreakFoulContinue}
                                    className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400
                                        hover:bg-blue-500/30 transition-colors"
                                >
                                    Continue Playing
                                </button>
                                <button
                                    onClick={handleBreakFoulRebreak}
                                    className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400
                                        hover:bg-purple-500/30 transition-colors"
                                >
                                    Re-Break
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Consecutive Fouls Warning Modal */}
                {showConsecutiveFoulsModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                        <div className={`rounded-xl p-6 w-full max-w-md mx-4
                            shadow-2xl animate-fadeIn transition-colors duration-200
                            ${isDarkMode 
                                ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                            
                            <div className="text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h2 className="text-xl font-bold mb-4 text-red-400">Consecutive Fouls Warning</h2>
                                <p className="text-center mb-6 opacity-75">
                                    {consecutiveFoulsPlayer === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'} has committed 2 consecutive fouls.
                                </p>
                                <p className="text-center mb-6 text-red-400 font-semibold">
                                    The next foul will result in a -15 point penalty!
                                </p>
                                <p className="text-center mb-6 text-sm opacity-60">
                                    Both players must acknowledge this warning to continue.
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleConsecutiveFoulsAcknowledged}
                                    className="px-6 py-3 rounded-lg bg-red-500/20 text-red-400
                                        hover:bg-red-500/30 transition-colors font-semibold"
                                >
                                    Acknowledge Warning
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add menu dropdown at root level */}
            {showMenu && (
                <div className="fixed inset-0 z-[9999]" onClick={() => setShowMenu(false)}>
                    <div 
                        className={`fixed top-16 left-4 w-40 py-2 rounded-lg shadow-lg
                            ${isDarkMode 
                                ? 'bg-black/95 border border-white/10' 
                                : 'bg-white border border-gray-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            type="button"
                            onClick={() => {
                                navigate('/');
                                setShowMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left transition-colors flex items-center gap-2 cursor-pointer
                                ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                navigate('/history');
                                setShowMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left transition-colors flex items-center gap-2 cursor-pointer
                                ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                logout();
                                setShowMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left transition-colors flex items-center gap-2 cursor-pointer
                                ${isDarkMode ? 'hover:bg-white/10 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            )}

            {showRunsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                    flex items-center justify-center z-50">
                    <div className={`rounded-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto
                        shadow-2xl animate-fadeIn transition-colors duration-200
                        ${isDarkMode 
                            ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                            : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                        
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-purple-400">
                                {selectedPlayer === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'}'s Runs
                            </h2>
                            <button
                                onClick={() => setShowRunsModal(false)}
                                className="p-2 rounded-full hover:bg-gray-700/50"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {getPlayerRuns(selectedPlayer).map((turn, index) => (
                                <div key={index} className={`p-4 rounded-lg ${
                                    isDarkMode ? 'bg-black/30' : 'bg-gray-100'
                                }`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-purple-400 font-semibold">
                                                Turn {index + 1}
                                            </span>
                                            <span className="opacity-60">
                                                Inning {turn.inning}
                                            </span>
                                            <span className="text-green-400 font-bold">
                                                Total: {turn.totalPoints}
                                            </span>
                                        </div>
                                        <span className="text-sm opacity-60">
                                            {new Date(turn.startTime).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 mt-3">
                                        {turn.shots.map((shot, shotIndex) => (
                                            <div key={shotIndex} className="flex items-center gap-4 pl-4">
                                                <span className="text-green-400">
                                                    +{shot.points}
                                                </span>
                                                <span className="text-sm opacity-60">
                                                    Shot {shotIndex + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

