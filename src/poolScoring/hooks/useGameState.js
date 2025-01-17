import { useState } from 'react';

export const useGameState = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [objectBallsOnTable, setObjectBallsOnTable] = useState(15);
    const [activePlayer, setActivePlayer] = useState(1);
    const [targetGoal, setTargetGoal] = useState(125);
    const [currentInning, setCurrentInning] = useState(1);
    const [breakPlayer, setBreakPlayer] = useState(1);
    const [isBreakShot, setIsBreakShot] = useState(true);
    const [winner, setWinner] = useState(null);
    const [winnerStats, setWinnerStats] = useState(null);
    const [showGameStats, setShowGameStats] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showBreakFoulModal, setShowBreakFoulModal] = useState(false);
    const [breakFoulPlayer, setBreakFoulPlayer] = useState(null);

    const resetGame = () => {
        setGameStarted(false);
        setObjectBallsOnTable(15);
        setActivePlayer(1);
        setCurrentInning(1);
        setBreakPlayer(1);
        setIsBreakShot(true);
        setWinner(null);
        setWinnerStats(null);
        setShowGameStats(false);
        setShowWinModal(false);
        setShowBreakFoulModal(false);
        setBreakFoulPlayer(null);
    };

    const startGame = () => {
        setGameStarted(true);
        setObjectBallsOnTable(15);
        setCurrentInning(1);
        setBreakPlayer(1);
        setIsBreakShot(true);
    };

    return {
        gameStarted,
        setGameStarted,
        objectBallsOnTable,
        setObjectBallsOnTable,
        activePlayer,
        setActivePlayer,
        targetGoal,
        setTargetGoal,
        currentInning,
        setCurrentInning,
        breakPlayer,
        setBreakPlayer,
        isBreakShot,
        setIsBreakShot,
        winner,
        setWinner,
        winnerStats,
        setWinnerStats,
        showGameStats,
        setShowGameStats,
        showWinModal,
        setShowWinModal,
        showBreakFoulModal,
        setShowBreakFoulModal,
        breakFoulPlayer,
        setBreakFoulPlayer,
        resetGame,
        startGame
    };
}; 