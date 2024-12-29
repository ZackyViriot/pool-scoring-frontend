import React, { useState, useEffect } from "react";
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

export default function PoolScoringComponent() {
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
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            intentionalFouls: 0,
            scratches: 0,
            currentRun: 0,
            bestGameRun: 0
        };
    });

    const [player2, setPlayer2] = useState(() => {
        const saved = localStorage.getItem('poolGame');
        return saved ? JSON.parse(saved).player2 : {
            name: "",
            score: 0,
            handicap: 0,
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            intentionalFouls: 0,
            scratches: 0,
            currentRun: 0,
            bestGameRun: 0
        };
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
            setPlayer1(lastAction.player1);
            setPlayer2(lastAction.player2);
            setActivePlayer(lastAction.activePlayer);
            setCurrentInning(lastAction.currentInning);
            setObjectBallsOnTable(lastAction.objectBallsOnTable);
            setPlayer1FoulHistory(lastAction.player1FoulHistory || []);
            setPlayer2FoulHistory(lastAction.player2FoulHistory || []);
            setScoreHistory(prev => prev.slice(0, -1));
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
            player2
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
        player2FoulHistory
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
            timestamp: new Date().toLocaleTimeString(),
            score: player.score + (points || 0)
        };
        setTurnHistory(prev => [...prev, turnEntry]);
    };

    const adjustScore = (playerNum, amount) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();

        const currentPlayerState = playerNum === 1 ? player1 : player2;
        const setCurrentPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        const newScore = currentPlayerState.score + amount;
        const newCurrentRun = amount > 0 ? currentPlayerState.currentRun + amount : 0;
        const newBestGameRun = Math.max(currentPlayerState.bestGameRun, newCurrentRun);
        
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
            high: Math.max(prev.high, newCurrentRun),
            bestGameRun: newBestGameRun
        }));

        // Check for win condition before switching turns
        if (newScore >= targetGoal) {
            const stats = calculateStats(currentPlayerState);
            setWinner(playerNum);
            setWinnerStats(stats);
            setShowWinModal(true);
            setIsTimerRunning(false);
            playWinSound();
            return;  // Don't switch turns if game is won
        }

        // Only switch turns if no points were scored
        if (amount <= 0) {
            if (playerNum === 2) {
                setCurrentInning(prev => prev + 1);
            }
            
            setActivePlayer(playerNum === 1 ? 2 : 1);
            setCurrentPlayer(prev => ({
                ...prev,
                currentRun: 0
            }));
        }
    };

    const checkThreeFouls = (playerNum) => {
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;

        // Add current turn to foul history
        const updatedHistory = [...foulHistory, true].slice(-3);
        setFoulHistory(updatedHistory);

        // Check if player has 3 fouls in their last 3 turns
        if (updatedHistory.length === 3 && updatedHistory.every(foul => foul)) {
            setPlayer(prev => ({
                ...prev,
                score: prev.score - 16  // Full -16 penalty (includes the current foul)
            }));
            // Reset foul history after applying penalty
            setFoulHistory([]);
            return true;
        }
        return false;
    };

    // Add this function to check for 2 consecutive fouls
    const hasTwoConsecutiveFouls = (playerNum) => {
        const foulHistory = playerNum === 1 ? player1FoulHistory : player2FoulHistory;
        return foulHistory.length === 2 && foulHistory.every(foul => foul);
    };

    const handleFoul = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Foul', -1);

        setPlayer({
            ...player,
            score: player.score - 1,
            fouls: player.fouls + 1,
            currentRun: 0
        });

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
        }
        
        // Increment inning if Player 2's turn is ending
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleSafe = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        
        addToTurnHistory(playerNum, 'Safe', 0);

        setPlayer({
            ...player,
            safes: player.safes + 1,
            currentRun: 0
        });
        
        setFoulHistory([]);
        
        // Increment inning if Player 2's turn is ending
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleMiss = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        const setFoulHistory = playerNum === 1 ? setPlayer1FoulHistory : setPlayer2FoulHistory;
        
        addToTurnHistory(playerNum, 'Miss', 0);

        setPlayer({
            ...player,
            misses: player.misses + 1,
            currentRun: 0
        });
        
        setFoulHistory([]);  // Reset foul history on miss
        
        if (playerNum === 2) {
            setCurrentInning(prev => prev + 1);
        }
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
    };

    const handleBreakScratch = (playerNum) => {
        // Only allow actions for active player
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        // Add to turn history
        addToTurnHistory(playerNum, 'Break Scratch', -2);

        setPlayer({
            ...player,
            score: player.score - 2,
            fouls: player.fouls + 1,
            currentRun: 0
        });
        
        setActivePlayer(playerNum === 1 ? 2 : 1);
        setIsBreakShot(false);
    };

    const handleScratch = (playerNum) => {
        if (playerNum !== activePlayer || !gameStarted) return;

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Scratch', -1);

        setPlayer({
            ...player,
            score: player.score - 1,
            scratches: player.scratches + 1,
            fouls: player.fouls + 1,
            currentRun: 0
        });

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
        }
        
        // Increment inning if Player 2's turn is ending
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
        
        // If player 1 has higher handicap, player 2 starts with the difference
        // If player 2 has higher handicap, player 1 starts with the difference
        const handicapDifference = player1Handicap - player2Handicap;
        
        // Reset scores and stats
        setPlayer1(prev => ({
            ...prev,
            name: prev.name || "Player 1",  // Ensure default name is set
            score: handicapDifference < 0 ? Math.abs(handicapDifference) : 0,
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            currentRun: 0,
            bestGameRun: 0
        }));
        
        setPlayer2(prev => ({
            ...prev,
            name: prev.name || "Player 2",  // Ensure default name is set
            score: handicapDifference > 0 ? handicapDifference : 0,
            high: 0,
            safes: 0,
            misses: 0,
            fouls: 0,
            currentRun: 0,
            bestGameRun: 0
        }));

        // Add handicap application to turn history if there was a handicap
        if (handicapDifference !== 0) {
            if (handicapDifference > 0) {
                addToTurnHistory(2, 'Handicap Applied', handicapDifference);
            } else if (handicapDifference < 0) {
                addToTurnHistory(1, 'Handicap Applied', Math.abs(handicapDifference));
            }
        }
    };

    const closeWinModal = () => {
        setShowWinModal(false);
        setWinner(null);
        setWinnerStats(null);
        endGame();
    };

    const switchTurn = () => {
        if (gameStarted) {
            saveGameState();
            
            // If current player is player 2, we're completing a full inning
            if (activePlayer === 2) {
                setCurrentInning(prev => prev + 1);
            }
            
            setActivePlayer(activePlayer === 1 ? 2 : 1);
            
            // Reset current run for the player who just finished their turn
            const currentPlayer = activePlayer === 1 ? player1 : player2;
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
        const playerHistory = turnHistory.filter(turn => turn.playerNum === playerNum);
        
        const fouls = playerHistory.filter(turn => turn.action === 'Foul' || turn.action === 'Break Scratch');
        const safes = playerHistory.filter(turn => turn.action === 'Safe');
        const misses = playerHistory.filter(turn => turn.action === 'Miss');
        const points = playerHistory.filter(turn => turn.action === 'Points' && turn.points > 0);
        
        return {
            name: player.name || `Player ${playerNum}`,
            totalScore: player.score,
            bestRun: player.bestGameRun,
            totalInnings: currentInning,
            totalFouls: fouls.length,
            totalSafes: safes.length,
            totalMisses: misses.length,
            foulDetails: fouls.map(f => ({
                inning: f.inning,
                type: f.action,
                points: f.points
            })),
            safeDetails: safes.map(s => ({
                inning: s.inning
            })),
            missDetails: misses.map(m => ({
                inning: m.inning
            })),
            runDetails: points.map(p => ({
                inning: p.inning,
                points: p.points
            }))
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
    const StatBox = ({ label, value, onClick, color = '' }) => (
        <button 
            onClick={onClick}
            className={`bg-black/20 rounded-lg p-3 text-center 
                hover:bg-opacity-30 transition-all
                ${onClick ? 'cursor-pointer hover:scale-105 transform' : 'cursor-default'}`}
        >
            <div className={`text-4xl font-bold ${color}`}>
                {value}
            </div>
            <div className="text-base font-semibold opacity-75">{label}</div>
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

        saveGameState();
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        addToTurnHistory(playerNum, 'Intentional Foul', -1);

        setPlayer({
            ...player,
            score: player.score - 1,
            fouls: player.fouls + 1,  // Increment regular fouls too
            intentionalFouls: player.intentionalFouls + 1,
            currentRun: 0
        });

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
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
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        saveGameState();
        addToTurnHistory(playerNum, 'Breaking Foul', -2);

        setPlayer({
            ...player,
            score: player.score - 2,  // Changed from -1 to -2
            fouls: player.fouls + 1,
            currentRun: 0
        });

        const isThreeFoulPenalty = checkThreeFouls(playerNum);
        if (isThreeFoulPenalty) {
            addToTurnHistory(playerNum, 'Three Foul Penalty', -16);
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
        const player = playerNum === 1 ? player1 : player2;
        const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;
        
        saveGameState();
        addToTurnHistory(playerNum, 'Breaking Foul - Rebreak', -2);

        setPlayer({
            ...player,
            score: player.score - 2,
            fouls: player.fouls + 1,
            currentRun: 0
        });

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

        setCurrentPlayer(prev => ({
            ...prev,
            score: newScore,
            currentRun: newCurrentRun,
            high: Math.max(prev.high, newCurrentRun),
            bestGameRun: Math.max(prev.bestGameRun, newCurrentRun)
        }));

        // Check for win condition
        if (newScore >= targetGoal) {
            const stats = calculateStats(currentPlayerState);
            setWinner(playerNum);
            setWinnerStats(stats);
            setShowWinModal(true);
            setIsTimerRunning(false);
            playWinSound();
        }
    };

    return (
        <div className={`min-h-screen h-screen overflow-hidden transition-colors duration-200
            ${isDarkMode 
                ? 'bg-gradient-to-br from-gray-900 to-black text-white' 
                : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
            
            {/* Theme Toggle */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="fixed top-2 right-2 p-1 rounded-full transition-all duration-200
                    hover:scale-110 transform z-50 shadow-lg
                    dark:bg-gray-800 bg-white"
                aria-label="Toggle theme"
            >
                {isDarkMode ? (
                    <SunIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                    <MoonIcon className="w-4 h-4 text-gray-700" />
                )}
            </button>

            <div className="max-w-7xl mx-auto p-1 h-full flex flex-col">
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
                        <div className="flex flex-col items-center justify-center gap-1">
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
                            
                            {gameStarted && (
                                <div className="text-sm font-mono opacity-60">
                                    {formatTime(gameTime)}
                                </div>
                            )}
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
                                <button 
                                    onClick={newRack}
                                    className="px-3 py-1 rounded-full text-xs
                                        bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 
                                        transition-colors duration-200"
                                >
                                    New Rack ({objectBallsOnTable})
                                </button>

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
                                    onClick={() => handleBreakingFoul(activePlayer)}
                                    className="px-3 py-1 rounded-full text-xs
                                        bg-red-500/20 text-red-400 hover:bg-red-500/30 
                                        transition-colors duration-200"
                                >
                                    Breaking Foul
                                </button>

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
                                    value={player1.safes}
                                    onClick={() => gameStarted && handleSafe(1)}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Miss"
                                    value={player1.misses}
                                    onClick={() => gameStarted && handleMiss(1)}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Run"
                                    value={player1.currentRun}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="High"
                                    value={player1.high}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                            </div>
                            {/* Bottom row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Best"
                                    value={player1.bestGameRun}
                                    color={isDarkMode ? 'text-blue-400' : 'text-blue-600'}
                                />
                                <StatBox 
                                    label="Scratch"
                                    value={player1.scratches}
                                    onClick={() => gameStarted && handleScratch(1)}
                                    color="text-yellow-400"
                                />
                                <StatBox 
                                    label="Foul"
                                    value={player1.fouls}
                                    onClick={() => gameStarted && handleFoul(1)}
                                    color="text-red-400"
                                />
                                <StatBox 
                                    label="Int Foul"
                                    value={player1.intentionalFouls}
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
                                    value={player2.safes}
                                    onClick={() => gameStarted && handleSafe(2)}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Miss"
                                    value={player2.misses}
                                    onClick={() => gameStarted && handleMiss(2)}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Run"
                                    value={player2.currentRun}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="High"
                                    value={player2.high}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                            </div>
                            {/* Bottom row - 4 metrics */}
                            <div className="grid grid-cols-4 gap-2">
                                <StatBox 
                                    label="Best"
                                    value={player2.bestGameRun}
                                    color={isDarkMode ? 'text-orange-400' : 'text-orange-600'}
                                />
                                <StatBox 
                                    label="Scratch"
                                    value={player2.scratches}
                                    onClick={() => gameStarted && handleScratch(2)}
                                    color="text-yellow-400"
                                />
                                <StatBox 
                                    label="Foul"
                                    value={player2.fouls}
                                    onClick={() => gameStarted && handleFoul(2)}
                                    color="text-red-400"
                                />
                                <StatBox 
                                    label="Int Foul"
                                    value={player2.intentionalFouls}
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
                                {turnHistory.map((turn, index) => (
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
                                            <span>
                                                {turn.action}
                                                {turn.points !== undefined && turn.points !== 0 && (
                                                    <span className={turn.points > 0 ? 'text-green-400' : 'text-red-400'}>
                                                        {' '}({turn.points > 0 ? '+' : ''}{turn.points})
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-sm opacity-60">
                                                {turn.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Win Modal */}
                {showWinModal && (
                    <>
                        <Confetti
                            width={windowSize.width}
                            height={windowSize.height}
                            numberOfPieces={200}
                            recycle={false}
                            colors={['#60A5FA', '#34D399', '#F87171', '#FBBF24']}
                        />
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                            flex items-center justify-center z-50">
                            <div className={`rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto
                                shadow-2xl animate-fadeIn transition-colors duration-200
                                ${isDarkMode 
                                    ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                                    : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                                
                                <h2 className="text-4xl font-bold text-center text-purple-400 mb-4">
                                    🏆 Game Over 🏆
                                </h2>
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
                                                        <h4 className="font-medium mb-2">Fouls ({stats.totalFouls})</h4>
                                                        <div className="space-y-1">
                                                            {stats.foulDetails.map((foul, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {foul.inning}</span>
                                                                    <span className="text-red-400">{foul.type} ({foul.points})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Safes Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Safes ({stats.totalSafes})</h4>
                                                        <div className="space-y-1">
                                                            {stats.safeDetails.map((safe, idx) => (
                                                                <div key={idx} className="text-sm flex justify-between bg-black/10 rounded px-2 py-1">
                                                                    <span>Inning {safe.inning}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Misses Section */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Misses ({stats.totalMisses})</h4>
                                                        <div className="space-y-1">
                                                            {stats.missDetails.map((miss, idx) => (
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
                                                            {stats.runDetails.map((run, idx) => (
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

                                <div className="text-center mt-6">
                                    <p className="opacity-60 mb-2">Game Time: {formatTime(gameTime)}</p>
                                    <button
                                        onClick={closeWinModal}
                                        className="px-8 py-3 bg-purple-500/20 hover:bg-purple-500/30 
                                            text-purple-300 rounded-full transition-colors text-lg"
                                    >
                                        New Game
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
        </div>
    );
}

