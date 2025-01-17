import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  Typography,
  Dialog,
} from '@mui/material';

interface Player {
  name: string;
  _id: string;
}

interface PlayerStats {
  totalPoints: number;
  totalInnings: number;
  safes: number;
  misses: number;
  bestRun: number;
  scratches: number;
  fouls: number;
  intentionalFouls: number;
  breakingFouls: number;
  currentRun: number;
  runHistory: number[];
}

interface InningTurn {
  player: string;
  pointsScored: number;
  ballsPocketed: string[];
  timestamp: Date;
}

interface Inning {
  inningNumber: number;
  turns: InningTurn[];
}

interface Match {
  _id: string;
  player1: Player;
  player2: Player;
  player1Score: number;
  player2Score: number;
  winner: Player;
  gameType: string;
  duration: number;
  player1Stats: PlayerStats;
  player2Stats: PlayerStats;
  innings: Inning[];
  createdAt: string;
}

interface MatchCardProps {
  match: Match;
  isDarkMode: boolean;
  onClick: (match: Match) => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, isDarkMode, onClick }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    setShowDetails(true);
  };

  // Helper function to safely count fouls
  const countFouls = (playerId: string) => {
    if (!match.innings) return 0;
    return match.innings.reduce((total, inning) => 
      total + (inning.turns || []).filter(turn => 
        turn.player === playerId && turn.pointsScored < 0
      ).length, 0
    );
  };

  return (
    <>
      <Card 
        onClick={handleClick}
        sx={{ 
          backgroundColor: isDarkMode ? '#000000' : 'inherit',
          borderRadius: '16px'
        }}
        className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
          isDarkMode 
            ? 'text-gray-200 border border-gray-800 hover:bg-gray-900' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
        }`}
      >
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
              {match.gameType || 'Unknown Game'}
            </Typography>
            <div className={`px-3 py-1 rounded-full text-xs ${
              isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {formatDuration(match.duration)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
            }`}>
              <Typography variant="body2" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {match.player1?.name || 'Player 1'}
              </Typography>
              <Typography variant="h5" className={`font-bold mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {match.player1Score}
              </Typography>
            </div>
            <div className={`p-3 rounded-lg ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200'
            }`}>
              <Typography variant="body2" className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {match.player2?.name || 'Player 2'}
              </Typography>
              <Typography variant="h5" className={`font-bold mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {match.player2Score}
              </Typography>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mt-4">
            <div className={`px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              Winner: {match.winner?.name || 'Unknown'}
            </div>
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {format(new Date(match.createdAt), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderRadius: '16px',
          }
        }}
      >
        <div className={`p-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h5" className="font-bold">
              Game History
            </Typography>
            <button 
              onClick={() => setShowDetails(false)}
              className={`p-2 rounded-full hover:bg-gray-800 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-lg font-medium mb-2">{match.player1.name}</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Final Score</span>
                  <span>{match.player1Score}</span>
                </div>
                <div className="flex justify-between">
                  <span>Best Run</span>
                  <span>{match.player1Stats?.bestRun || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Fouls</span>
                  <span>{(match.player1Stats?.fouls || 0) + (match.player1Stats?.intentionalFouls || 0) + (match.player1Stats?.breakingFouls || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safes</span>
                  <span>{match.player1Stats?.safes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scratches</span>
                  <span>{match.player1Stats?.scratches || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Misses</span>
                  <span>{match.player1Stats?.misses || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-lg font-medium mb-2">{match.player2.name}</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Final Score</span>
                  <span>{match.player2Score}</span>
                </div>
                <div className="flex justify-between">
                  <span>Best Run</span>
                  <span>{match.player2Stats?.bestRun || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Fouls</span>
                  <span>{(match.player2Stats?.fouls || 0) + (match.player2Stats?.intentionalFouls || 0) + (match.player2Stats?.breakingFouls || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safes</span>
                  <span>{match.player2Stats?.safes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scratches</span>
                  <span>{match.player2Stats?.scratches || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Misses</span>
                  <span>{match.player2Stats?.misses || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium mb-2">Scoring Runs</div>
            {(match.innings || []).map((inning, i) => 
              (inning.turns || []).map((turn, j) => {
                const playerName = turn.player === match.player1._id ? match.player1.name : match.player2.name;
                if (turn.pointsScored > 0) {
                  return (
                    <div key={`${i}-${j}`} className="flex justify-between items-center">
                      <span>{playerName} - Inning {inning.inningNumber}</span>
                      <span className="text-green-500">+{turn.pointsScored}</span>
                    </div>
                  );
                } else if (turn.pointsScored < 0) {
                  return (
                    <div key={`${i}-${j}`} className="flex justify-between items-center">
                      <span>{playerName} - Inning {inning.inningNumber}</span>
                      <span className="text-red-500">{turn.pointsScored}</span>
                    </div>
                  );
                }
                return null;
              })
            )}
          </div>

          <div className="mt-6 text-sm text-center text-gray-500">
            Game Time: {formatDuration(match.duration)}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default MatchCard; 