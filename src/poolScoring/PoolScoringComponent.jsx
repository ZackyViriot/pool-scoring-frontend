import React, { useState, useEffect } from "react";
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://pool-scoring-backend-production.up.railway.app';
  }
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiUrl();

export default function PoolScoringComponent() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Check authentication on mount and periodically
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            if (!token || !user) {
                console.log('No authentication found, redirecting to login');
                navigate('/login');
                return false;
            }
            return true;
        };

        // Initial check
        if (!checkAuth()) return;

        // Periodic check every minute
        const interval = setInterval(checkAuth, 60000);
        return () => clearInterval(interval);
    }, [navigate, user]);

    // Add menu state
    const [showMenu, setShowMenu] = useState(false);
    
    // Game state
    const [gameStarted, setGameStarted] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).gameStarted : false;
    });
    const [objectBallsOnTable, setObjectBallsOnTable] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).objectBallsOnTable : 15;
    });
    const [activePlayer, setActivePlayer] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).activePlayer : 1;
    });
    const [targetGoal, setTargetGoal] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).targetGoal : 125;
    });
    const [gameTime, setGameTime] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).gameTime : 0;
    });
    const [isTimerRunning, setIsTimerRunning] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).isTimerRunning : false;
    });
    const [currentInning, setCurrentInning] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).currentInning : 1;
    });
    const [breakPlayer, setBreakPlayer] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).breakPlayer : 1;
    });
    const [scoreHistory, setScoreHistory] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).scoreHistory : [];
    });
    const [bestRun, setBestRun] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).bestRun : 0;
    });
    const [isBreakShot, setIsBreakShot] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).isBreakShot : true;
    });
    const [player1FoulHistory, setPlayer1FoulHistory] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).player1FoulHistory : [];
    });
    const [player2FoulHistory, setPlayer2FoulHistory] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).player2FoulHistory : [];
    });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [turnHistory, setTurnHistory] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).turnHistory : [];
    });
    const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
    const [breakFoulPlayer, setBreakFoulPlayer] = useState(null);
    
    // Win modal state
    const [showWinModal, setShowWinModal] = useState(false);
    const [winner, setWinner] = useState(null);
    const [winnerStats, setWinnerStats] = useState(null);
    const [showGameStats, setShowGameStats] = useState(false);

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark';
        }
        return true;
    });

    // Window size for confetti
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    // Sound effects
    const [playWinSound] = useSound('/sounds/win.mp3');

    // Player states
    const [player1, setPlayer1] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).player1 : {
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
        };
    });

    const [player2, setPlayer2] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).player2 : {
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
        };
    });

    // GameType state
    const [gameType, setGameType] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).gameType : 'Straight Pool';
    });

    // Theme effect
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

    // Window size effect
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

    // Game timer effect
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setGameTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

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

    const calculateStats = (player) => {
        const totalShots = player.misses + player.safes + player.high;
        const accuracy = totalShots ? ((totalShots - player.misses) / totalShots * 100).toFixed(1) : 0;
        const avgPointsPerInning = player.score / (player.misses + player.safes + 1);
        
        return {
            accuracy: accuracy,
            avgPointsPerInning: avgPointsPerInning.toFixed(1),
            totalShots: totalShots,
            foulsPerGame: player.fouls
        };
    };

    const undoLastAction = () => {
        if (scoreHistory.length > 0) {
            const lastAction = scoreHistory[scoreHistory.length - 1];
            
            // Save current state before restoring
            const currentState = {
                player1,
                player2,
                activePlayer,
                currentInning,
                objectBallsOnTable,
                player1FoulHistory,
                player2FoulHistory,
                isBreakShot,
                turnHistory: [...turnHistory]
            };
            
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

    const saveGameState = () => {
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
        localStorage.setItem('poolGame', JSON.stringify(gameState));
    };

    // Add effect to save game state when important values change
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
            timestamp: new Date(), // Store as Date object
            score: player.score + (points || 0)
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
        setWinnerStats(playerNum === 1 ? player1FinalStats : player2FinalStats);
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
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;

        // Add current turn to foul history first
        const updatedHistory = [...foulHistory, true];
        
        // Check if player has 3 fouls in their last 3 turns
        if (updatedHistory.length >= 3 && updatedHistory.slice(-3).every(foul => foul)) {
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 16  // Full -16 penalty (includes the current foul)
            }));
            // Reset foul history after applying penalty
            setFoulHistory([]);
            return true;
        } else {
            // Only keep the last 3 fouls in history
            setFoulHistory(updatedHistory.slice(-3));
            return false;
        }
    };

    // Add this function to check for 2 consecutive fouls
    const hasTwoConsecutiveFouls = (playerNum) => {
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        return foulHistory.length === 2 && foulHistory.every(foul => foul);
    };

    const handleFoul = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

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
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 16
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
        
        addToTurnHistory(playerNum, 'Safe', 0);

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

    const handleBreakScratch = (playerNum) => {
        // Only allow actions for active player
        if (playerNum !== activePlayer || !gameStarted) return;

        saveStateToHistory();
        saveGameState();
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        // Add to turn history
        addToTurnHistory(playerNum, 'Break Scratch', -2);

        setPlayer(prev => ({
            ...prev,
            score: prev.score - 2,
            fouls: prev.fouls + 1,
            currentRun: 0,
            totalInnings: prev.totalInnings + 1
        }));
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
        setIsBreakShot(false);
    };

    const handleScratch = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

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

        addToTurnHistory(playerNum, 'Scratch', -1);
        
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
        setBreakPlayer(1);
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
        setWinnerStats(null);
    };

    const startNewGame = () => {
        setShowWinModal(false);
        setShowGameStats(false);
        setWinner(null);
        setWinnerStats(null);
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
            
            // If current player is player 2, we're completing a full inning
            if (activePlayer === 2) {
                setCurrentInning(prev => prev + 1);
            }
            
            setActivePlayer(activePlayer === 1 ? 2 : 1);
            
            // Reset current run for the player who just finished their turn
            const setCurrentPlayer = activePlayer === 1 ? setPlayer1 : setPlayer2;
            
            setCurrentPlayer(prev => ({
                ...prev,
                currentRun: 0
            }));
        }
    };

    const newRack = () => {
        setObjectBallsOnTable(15);
        setIsBreakShot(true);
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
                if (turn.action === 'Safe') {
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
                
                // Track scoring runs
                if (turn.action === 'Points' || turn.action === 'Finish Rack') {
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
            runDetails: []
        });

        // Calculate totals from the actual turn history
        const totalFouls = details.foulDetails.length;
        const totalSafes = details.safeDetails.length;
        const totalMisses = details.missDetails.length;
        const totalPoints = details.runDetails.reduce((sum, run) => sum + run.points, 0);
        const bestRun = Math.max(...details.runDetails.map(run => run.points), 0);

        return {
            name: player.name || `Player ${playerNum}`,
            totalScore: player.score || 0,
            bestRun: bestRun,
            totalFouls: totalFouls,
            totalSafes: totalSafes,
            totalMisses: totalMisses,
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
            <div className="text-xs opacity-60">
                Balls
            </div>
        </div>
    );

    // Update the stats grid styling
    const StatBox = ({ label, value, onClick, color = '', isSmallText = false }) => (
        <button 
            onClick={onClick}
            className={`bg-black/20 rounded-lg p-3 text-center 
                hover:bg-opacity-30 transition-all
                ${onClick ? 'cursor-pointer hover:scale-105 transform' : 'cursor-default'}`}
        >
            <div className={`text-4xl font-bold ${color}`}>
                {value}
            </div>
            <div className={`font-semibold opacity-75 ${isSmallText ? 'text-xs' : 'text-base'}`}>{label}</div>
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
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 16
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
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 16
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
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
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

        saveStateToHistory();
        saveGameState();
        const currentPlayerState = playerNum === 1 ? player1 : player2;
        const setCurrentPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        const remainingBalls = objectBallsOnTable;
        
        addToTurnHistory(playerNum, 'Finish Rack', remainingBalls);

        setFoulHistory([]); // Reset foul history on successful finish
        setObjectBallsOnTable(15); // Reset to 15 balls

        const newScore = currentPlayerState.score + remainingBalls;
        const newCurrentRun = currentPlayerState.currentRun + remainingBalls;

        // Check for win condition
        if (newScore >= targetGoal) {
            const updatedPlayer = {
                ...currentPlayerState,
                score: newScore,
                currentRun: newCurrentRun,
                high: Math.max(currentPlayerState.high, newCurrentRun),
                bestGameRun: Math.max(currentPlayerState.bestGameRun, newCurrentRun)
            };
            
            // Calculate final stats for both players
            const player1FinalStats = calculatePlayerStats(playerNum === 1 ? updatedPlayer : player1, 1);
            const player2FinalStats = calculatePlayerStats(playerNum === 2 ? updatedPlayer : player2, 2);
            
            setWinner(playerNum);
            setWinnerStats(playerNum === 1 ? player1FinalStats : player2FinalStats);
            setShowWinModal(true);
            setIsTimerRunning(false);
            playWinSound();

            // Update the player's state without saving the match (will be saved in useEffect)
            setCurrentPlayer(prev => ({
                ...prev,
                score: newScore,
                currentRun: newCurrentRun,
                high: Math.max(prev.high, newCurrentRun),
                bestGameRun: Math.max(prev.bestGameRun, newCurrentRun)
            }));

            // Save match with the final stats
            saveMatchToDatabase({
                winner: updatedPlayer,
                loser: playerNum === 1 ? player2 : player1,
                finalScore1: playerNum === 1 ? newScore : player2.score,
                finalScore2: playerNum === 1 ? player2.score : newScore,
                player1FinalStats: playerNum === 1 ? player1FinalStats : player2FinalStats,
                player2FinalStats: playerNum === 2 ? player1FinalStats : player2FinalStats
            }, gameTime);
            
            return;  // Don't switch turns if game is won
        }

        setCurrentPlayer(prev => ({
            ...prev,
            score: newScore,
            currentRun: newCurrentRun,
            high: Math.max(prev.high, newCurrentRun),
            bestGameRun: Math.max(prev.bestGameRun, newCurrentRun)
        }));
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
        let bestRunInGame = player.bestRun || 0;
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
                    case 'Safe':
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
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');
            if (!userId || !token) {
                throw new Error('Authentication information not found');
            }

            // Calculate final stats for both players
            const player1Stats = {
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

            const matchData = {
                player1: {
                    name: player1.name,
                    handicap: parseInt(player1.handicap) || 0
                },
                player2: {
                    name: player2.name,
                    handicap: parseInt(player2.handicap) || 0
                },
                player1Score: parseInt(gameResult.finalScore1),
                player2Score: parseInt(gameResult.finalScore2),
                winner: {
                    name: gameResult.winner.name,
                    handicap: gameResult.winner.handicap || 0
                },
                gameType: "Straight Pool",
                duration: parseInt(duration) || 0,
                userId: userId,
                player1Stats: player1Stats,
                player2Stats: player2Stats,
                innings: turnHistory.map((turn) => {
                    const isHandicap = turn.action === 'Handicap Applied';
                    let actionText = '';
                    let actionColor = '';

                    if (isHandicap) {
                        actionText = `Handicap Applied (+${turn.points})`;
                        actionColor = 'text-purple-500';
                    } else if (turn.action === 'Points') {
                        actionText = `Made ${turn.points} ball${turn.points !== 1 ? 's' : ''} (+${turn.points})`;
                        actionColor = 'text-green-500';
                    } else if (turn.action === 'Safe') {
                        actionText = 'Safe';
                        actionColor = 'text-yellow-500';
                    } else if (turn.action === 'Miss') {
                        actionText = 'Miss';
                        actionColor = 'text-red-500';
                    } else if (turn.action === 'Scratch') {
                        actionText = 'Scratch (-1)';
                        actionColor = 'text-red-500';
                    } else if (turn.action === 'Break Scratch') {
                        actionText = 'Break Scratch (-2)';
                        actionColor = 'text-red-500';
                    } else if (turn.action === 'Breaking Foul') {
                        actionText = 'Breaking Foul (-2)';
                        actionColor = 'text-red-500';
                    } else if (turn.action === 'Breaking Foul - Rebreak') {
                        actionText = 'Breaking Foul - Rebreak (-2)';
                        actionColor = 'text-red-500';
                    } else if (turn.action === 'Intentional Foul') {
                        actionText = 'Intentional Foul (-2)';
                        actionColor = 'text-red-500';
                    } else {
                        actionText = turn.action;
                        actionColor = 'text-gray-400';
                    }

                    // Ensure timestamp is a Date object
                    const timestamp = turn.timestamp instanceof Date ? turn.timestamp : new Date(turn.timestamp);

                    return {
                        playerNumber: turn.playerNum,
                        playerName: turn.playerNum === 1 ? player1.name : player2.name,
                        ballsPocketed: turn.points > 0 && !isHandicap ? turn.points : 0,
                        action: turn.action,
                        timestamp: timestamp,
                        score: parseInt(turn.score) || 0,
                        inning: turn.inning,
                        points: parseInt(turn.points) || 0,
                        isBreak: turn.action.toLowerCase().includes('break'),
                        isScratch: turn.action === 'Scratch' || turn.action === 'Break Scratch',
                        isSafetyPlay: turn.action === 'Safe',
                        isDefensiveShot: turn.action === 'Safe',
                        isFoul: turn.action === 'Foul' || turn.action === 'Breaking Foul' || 
                               turn.action === 'Breaking Foul - Rebreak' || turn.action === 'Intentional Foul',
                        isBreakingFoul: turn.action === 'Breaking Foul' || turn.action === 'Breaking Foul - Rebreak',
                        isIntentionalFoul: turn.action === 'Intentional Foul',
                        isMiss: turn.action === 'Miss',
                        isHandicap: isHandicap,
                        actionText: actionText,
                        actionColor: actionColor
                    };
                }),
                targetScore: targetGoal,
                turnHistory: turnHistory
            };

            console.log('Saving complete match data:', matchData);
            const response = await axios.post(`${API_BASE_URL}/matches`, matchData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Match saved successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error saving match:', error);
            if (error.response?.status === 401) {
                console.error('Authentication error: Please log in again');
            }
            throw error;
        }
    };

    // Update the formatDate function to handle date strings
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return format(date, 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
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
                    
                    <div className="grid grid-cols-3 gap-2">
                        {/* Player 1 Info */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Player 1"
                                className={`w-full bg-transparent border-b text-lg font-medium 
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
                                className={`w-16 bg-transparent border-b text-sm text-center
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
                                className={`p-2 rounded-lg transition-all duration-200
                                    ${isDarkMode 
                                        ? 'bg-black/30 hover:bg-black/50 border border-white/10' 
                                        : 'bg-white/80 hover:bg-white border border-gray-200'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-2">
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
                                <div className="text-xs opacity-60">TARGET</div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-2 rounded-lg transition-all duration-200
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
                                className={`w-16 bg-transparent border-b text-sm text-center
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
                                className={`w-full bg-transparent border-b text-lg text-right
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
                    <div className="flex justify-center gap-1 mt-1">
                        <button 
                            onClick={gameStarted ? endGame : startGame}
                            className={`px-3 py-1 rounded-full text-xs
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
                                        className="px-3 py-1 rounded-full text-xs
                                            bg-green-500/20 text-green-400 hover:bg-green-500/30 
                                            transition-colors duration-200"
                                    >
                                        Finish Rack (+{objectBallsOnTable})
                                    </button>
                                )}

                                <button 
                                    onClick={switchTurn}
                                    className="px-3 py-1 rounded-full text-xs
                                        bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 
                                        transition-colors duration-200"
                                >
                                    Switch
                                </button>

                                <button 
                                    onClick={undoLastAction}
                                    className="px-3 py-1 rounded-full text-xs
                                        bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 
                                        transition-colors duration-200"
                                >
                                    Undo
                                </button>

                                <button 
                                    onClick={() => setShowHistoryModal(true)}
                                    className="px-3 py-1 rounded-full text-xs
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
                <div className="grid grid-cols-2 gap-1 h-[calc(100vh-180px)] relative">
                    {/* Player 1 Score */}
                    <div className={`rounded-lg p-2 transition-colors duration-200 h-full flex flex-col relative
                        ${isDarkMode 
                            ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}
                        ${activePlayer === 1 ? 'ring-2 ring-blue-500/50 animate-pulse' : 'opacity-50'}
                        ${activePlayer !== 1 && gameStarted ? 'pointer-events-none' : ''}`}>
                        
                        {/* Warning for 2 consecutive fouls */}
                        {hasTwoConsecutiveFouls(1) && (
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2
                                bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs animate-pulse">
                                Warning: Next Foul -16 Points
                            </div>
                        )}

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
                                    className="text-5xl text-gray-400 hover:text-white 
                                        w-32 h-32 rounded-full bg-gray-800/50 
                                        flex items-center justify-center transition-colors
                                        hover:scale-105 transform"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Player 1 Stats */}
                        <div className="flex flex-col gap-2">
                            {/* Top row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Safe"
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
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Best"
                                    value={player1.bestRun || 0}
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
                        
                        {/* Warning for 2 consecutive fouls */}
                        {hasTwoConsecutiveFouls(2) && (
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2
                                bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs animate-pulse">
                                Warning: Next Foul -16 Points
                            </div>
                        )}

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
                                    className="text-5xl text-gray-400 hover:text-white 
                                        w-32 h-32 rounded-full bg-gray-800/50 
                                        flex items-center justify-center transition-colors
                                        hover:scale-105 transform"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Player 2 Stats */}
                        <div className="flex flex-col gap-2">
                            {/* Top row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Safe"
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
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Best"
                                    value={player2.bestRun || 0}
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
                <div className={`fixed bottom-0 left-0 right-0 
                    ${isDarkMode ? 'bg-black/50' : 'bg-white/50'} 
                    backdrop-blur-sm`}>
                    {/* Game Info Row */}
                    <div className="flex justify-center items-center gap-4 p-1">
                        <div>
                            Inning: {currentInning}
                        </div>
                        <div>
                            Balls: {objectBallsOnTable}
                        </div>
                        <div>
                            Break: {breakPlayer === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'}
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
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="p-2 rounded-full hover:bg-gray-700/50"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-2">
                                {turnHistory.map((turn, index) => {
                                    let timeString;
                                    try {
                                        // Ensure timestamp is a valid date
                                        const timestamp = turn.timestamp ? new Date(turn.timestamp) : new Date();
                                        if (isNaN(timestamp.getTime())) {
                                            // If invalid date, use current time
                                            timeString = format(new Date(), 'h:mm a');
                                        } else {
                                            timeString = format(timestamp, 'h:mm a');
                                        }
                                    } catch (error) {
                                        // Fallback to current time if any error occurs
                                        timeString = format(new Date(), 'h:mm a');
                                    }
                                    
                                    return (
                                        <div key={index} 
                                            className={`p-2 rounded-lg flex items-center justify-between
                                                ${isDarkMode ? 'bg-black/30' : 'bg-gray-100'}
                                                ${turn.playerNum === 1 
                                                    ? 'border-l-4 border-blue-500' 
                                                    : 'border-l-4 border-orange-500'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`font-medium ${
                                                    turn.playerNum === 1 ? 'text-blue-400' : 'text-orange-400'
                                                }`}>
                                                    {turn.playerName}
                                                </span>
                                                <span className="opacity-75">
                                                    Inning {turn.inning}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`${
                                                    turn.action === 'Miss' ? 'text-red-400' :
                                                    turn.points > 0 ? 'text-green-400' :
                                                    turn.points < 0 ? 'text-red-400' : ''
                                                }`}>
                                                    {turn.action}
                                                    {turn.points !== undefined && turn.points !== 0 && (
                                                        <span className={turn.points > 0 ? 'text-green-400' : 'text-red-400'}>
                                                            {' '}({turn.points > 0 ? '+' : ''}{turn.points})
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-sm opacity-60">
                                                    {timeString}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add a View Stats button when there's a winner but modal is closed */}
                {winner && !showWinModal && (
                    <button
                        onClick={toggleGameStats}
                        className="fixed bottom-20 right-4 px-4 py-2 rounded-lg
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
                                        className="p-2 rounded-full hover:bg-gray-700/50"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <p className="text-2xl font-medium text-center mb-6">
                                    Winner: {winner === 1 ? player1.name || 'Player 1' : player2.name || 'Player 2'}
                                </p>

                                <div className="grid grid-cols-2 gap-6">
                                    {[1, 2].map(playerNum => {
                                        const stats = generateDetailedStats(playerNum);
                                        return (
                                            <div key={playerNum} className={`space-y-4 p-4 rounded-lg
                                                ${isDarkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
                                                <h3 className={`text-xl font-bold ${
                                                    playerNum === 1 ? 'text-blue-400' : 'text-orange-400'
                                                }`}>
                                                    {stats.name}
                                                </h3>
                                                
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-2xl font-bold">{stats.totalScore}</div>
                                                        <div className="text-xs opacity-60">Final Score</div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-2">
                                                        <div className="text-2xl font-bold">{stats.bestRun}</div>
                                                        <div className="text-xs opacity-60">Best Run</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Fouls Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Fouls ({stats.totalFouls || 0})</h4>
                                                        <div className="space-y-1">
                                                            {(stats.foulDetails || []).map((foul, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {foul.inning}</span>
                                                                    <span className="text-red-400">{foul.type} ({foul.points})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Safes Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Safes ({stats.totalSafes || 0})</h4>
                                                        <div className="space-y-1">
                                                            {(stats.safeDetails || []).map((safe, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {safe.inning}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Misses Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Misses ({stats.totalMisses || 0})</h4>
                                                        <div className="space-y-1">
                                                            {(stats.missDetails || []).map((miss, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {miss.inning}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Runs Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Scoring Runs</h4>
                                                        <div className="space-y-1">
                                                            {(stats.runDetails || []).map((run, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {run.inning}</span>
                                                                    <span className="text-green-400">+{run.points}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="text-center mt-6 space-x-4">
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

                            <div className="flex justify-center gap-4">
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
                                localStorage.removeItem('token');
                                localStorage.removeItem('userId');
                                navigate('/login');
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
        </div>
    );
}

