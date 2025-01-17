import { useState } from 'react';

export const usePlayerStats = (initialName = '', initialHandicap = 0) => {
    const [playerState, setPlayerState] = useState({
        name: initialName,
        handicap: initialHandicap,
        score: 0,
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
        runHistory: [],
        turnHistory: []
    });

    const updatePlayerState = (updates) => {
        setPlayerState(prev => ({
            ...prev,
            ...updates
        }));
    };

    const incrementStat = (statName, amount = 1) => {
        setPlayerState(prev => ({
            ...prev,
            [statName]: (prev[statName] || 0) + amount
        }));
    };

    const resetStats = () => {
        setPlayerState(prev => ({
            name: prev.name,
            handicap: prev.handicap,
            score: 0,
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
            runHistory: [],
            turnHistory: []
        }));
    };

    const addToTurnHistory = (turn) => {
        setPlayerState(prev => ({
            ...prev,
            turnHistory: [...prev.turnHistory, turn]
        }));
    };

    const updateRunHistory = (run) => {
        setPlayerState(prev => ({
            ...prev,
            runHistory: [...prev.runHistory, run],
            bestRun: Math.max(prev.bestRun, run)
        }));
    };

    return {
        playerState,
        updatePlayerState,
        incrementStat,
        resetStats,
        addToTurnHistory,
        updateRunHistory
    };
}; 