import { useState } from 'react';

export const useMatchData = () => {
    const [innings, setInnings] = useState([]);
    const [matchDate, setMatchDate] = useState(new Date());
    const [matchId, setMatchId] = useState(null);

    const addInning = (inning) => {
        const timestamp = new Date();
        setInnings(prev => [...prev, {
            playerNumber: inning.playerNumber,
            playerName: inning.playerName || 'Unknown Player',
            ballsPocketed: Math.max(0, inning.ballsPocketed || 0),
            action: inning.action || 'unknown',
            timestamp,
            score: inning.score || 0,
            inning: inning.inning || 1,
            isBreak: Boolean(inning.isBreak)
        }]);
    };

    const saveMatchToDatabase = async (player1State, player2State, targetScore, winner) => {
        const createPlayerStats = (playerState) => ({
            score: playerState.score || 0,
            totalPoints: playerState.totalPoints || 0,
            totalInnings: playerState.totalInnings || 0,
            safes: playerState.safes || 0,
            misses: playerState.misses || 0,
            bestRun: playerState.bestRun || 0,
            scratches: playerState.scratches || 0,
            fouls: playerState.fouls || 0,
            intentionalFouls: playerState.intentionalFouls || 0,
            breakingFouls: playerState.breakingFouls || 0,
            currentRun: playerState.currentRun || 0,
            runHistory: playerState.runHistory || []
        });

        const matchData = {
            matchDate,
            targetScore,
            player1: {
                name: player1State.name || 'Player 1',
                handicap: player1State.handicap || 0
            },
            player2: {
                name: player2State.name || 'Player 2',
                handicap: player2State.handicap || 0
            },
            player1Stats: createPlayerStats(player1State),
            player2Stats: createPlayerStats(player2State),
            innings: innings.map(inning => ({
                playerNumber: inning.playerNumber,
                playerName: inning.playerName || 'Unknown Player',
                ballsPocketed: Math.max(0, inning.ballsPocketed || 0),
                action: inning.action || 'unknown',
                timestamp: inning.timestamp || new Date(),
                score: inning.score || 0,
                inning: inning.inning || 1,
                isBreak: Boolean(inning.isBreak)
            })),
            winner: winner,
            player1Score: player1State.score || 0,
            player2Score: player2State.score || 0
        };

        try {
            const response = await fetch('/api/matches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matchData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                throw new Error('Failed to save match data');
            }

            const savedMatch = await response.json();
            console.log('Saved match data:', savedMatch);
            setMatchId(savedMatch._id);
            return savedMatch;
        } catch (error) {
            console.error('Error saving match:', error);
            throw error;
        }
    };

    const resetMatch = () => {
        setInnings([]);
        setMatchDate(new Date());
        setMatchId(null);
    };

    return {
        innings,
        matchDate,
        matchId,
        addInning,
        saveMatchToDatabase,
        resetMatch
    };
}; 