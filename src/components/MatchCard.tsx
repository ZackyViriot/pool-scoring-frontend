import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Match } from '../types/match';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

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

interface Turn {
  playerNumber: number;
  playerName: string;
  ballsPocketed: number;
  action: string;
  timestamp: Date;
  score: number;
  inning: number;
  points: number;
  isBreak: boolean;
  isScratch: boolean;
  isSafetyPlay: boolean;
  isDefensiveShot: boolean;
  isFoul: boolean;
  isBreakingFoul: boolean;
  isIntentionalFoul: boolean;
  isMiss: boolean;
}

interface MatchCardProps {
  match: Match;
  isDarkMode: boolean;
  onClick: (match: Match) => void;
  onDelete?: () => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const formatTimeOnly = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    return format(date, 'h:mm a');
  } catch (error) {
    return 'Invalid time';
  }
};

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://pool-scoring-backend-production.up.railway.app';
  }
  return 'http://localhost:8000';
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, isDarkMode, onClick, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${getApiUrl()}/matches/${match._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card 
        onClick={() => setShowDetails(true)}
        className={`cursor-pointer transition-all duration-200 ${
          isDarkMode 
            ? 'bg-[#1f2437] hover:bg-[#1f2437] border border-gray-700' 
            : 'bg-white hover:bg-gray-50 border border-gray-300 shadow-lg hover:shadow-md'
        }`}
        sx={{
          backgroundColor: isDarkMode ? '#1f2437' : 'white',
          backgroundImage: 'none',
          '& .MuiCardContent-root': {
            backgroundColor: 'inherit'
          }
        }}
      >
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Typography variant="h6" className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                  {match.gameType || 'Straight Pool'}
                </Typography>
                <div className={`px-3 py-1 rounded-full text-xs ${
                  isDarkMode ? 'bg-[#2a2f3e] text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {formatDuration(match.duration)}
                </div>
              </div>
              <IconButton 
                size="small" 
                onClick={handleDeleteClick}
                className="text-red-500 hover:text-red-600"
                sx={{ 
                  padding: '4px',
                  color: '#ef4444',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-[#2a2f3e]' : 'bg-gray-100 shadow-inner'
              }`}>
                <div className="text-blue-400 font-medium">
                  {match.player1.name}
                </div>
                <div className="text-2xl font-bold text-blue-500 mt-1">
                  {match.player1Score}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-[#2a2f3e]' : 'bg-gray-100'
              }`}>
                <div className="text-orange-400 font-medium">
                  {match.player2.name}
                </div>
                <div className="text-2xl font-bold text-orange-500 mt-1">
                  {match.player2Score}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                Winner: <span className={isDarkMode ? 'text-white' : 'text-gray-700'}>{match.winner?.name}</span>
              </div>
              <div className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                {formatDate(match.matchDate)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
        className={isDarkMode ? 'dark' : ''}
      >
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1a1f2e] border border-gray-700' : 'bg-white'}`}>
          {/* Game Summary Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Typography variant="h5" className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {match.gameType || 'Straight Pool'}
                </Typography>
                <Typography variant="subtitle2" className="text-gray-400 mt-1">
                  {formatDate(match.matchDate)} • Game Time: {formatDuration(match.duration)}
                </Typography>
              </div>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Player Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* Player 1 Stats */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a2f3e] border-[#3a3f4e]' : 'bg-gray-50 border-gray-300 shadow-sm'} border`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-blue-400 font-medium text-lg">{match.player1.name}</div>
                  <div className="text-2xl font-bold text-blue-500">{match.player1Score}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Points:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Innings:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.totalInnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Run:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.bestRun}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Run:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.currentRun}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Safes:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.safes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Misses:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.misses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scratches:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.scratches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fouls:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.fouls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Breaking Fouls:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.breakingFouls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intentional Fouls:</span>
                    <span className="text-blue-500 font-medium">{match.player1Stats.intentionalFouls}</span>
                  </div>
                </div>
              </div>

              {/* Player 2 Stats */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a2f3e] border-[#3a3f4e]' : 'bg-gray-50 border-gray-200'} border`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-orange-400 font-medium text-lg">{match.player2.name}</div>
                  <div className="text-2xl font-bold text-orange-500">{match.player2Score}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Points:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Innings:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.totalInnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Run:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.bestRun}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Run:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.currentRun}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Safes:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.safes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Misses:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.misses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scratches:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.scratches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fouls:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.fouls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Breaking Fouls:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.breakingFouls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intentional Fouls:</span>
                    <span className="text-orange-500 font-medium">{match.player2Stats.intentionalFouls}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game History Section */}
          <div>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-[#3a3f4e]' : 'border-gray-200'}`}>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Player</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Inning</th>
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Action</th>
                  <th className="text-right px-6 py-3 text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-[#3a3f4e]' : 'divide-gray-200'}`}>
                {Array.isArray(match.innings) && match.innings.length > 0 ? (
                  match.innings.map((turn) => {
                    const isPlayer1 = turn.playerNumber === 1;
                    const playerName = isPlayer1 ? match.player1.name : match.player2.name;
                    const textColor = isPlayer1 ? 'text-blue-400' : 'text-orange-400';
                    
                    let actionText = '';
                    let actionColor = 'text-gray-400';

                    if (turn.isBreak && turn.ballsPocketed > 0) {
                      actionText = `Break - Made ${turn.ballsPocketed} ball${turn.ballsPocketed !== 1 ? 's' : ''} (+${turn.points})`;
                      actionColor = 'text-green-500';
                    } else if (turn.isFoul) {
                      actionText = 'Foul (-1)';
                      actionColor = 'text-red-500';
                    } else if (turn.isBreakingFoul) {
                      actionText = 'Breaking Foul (-2)';
                      actionColor = 'text-red-500';
                    } else if (turn.isIntentionalFoul) {
                      actionText = 'Intentional Foul (-2)';
                      actionColor = 'text-red-500';
                    } else if (turn.isScratch) {
                      actionText = turn.isBreak ? 'Break Scratch (-2)' : 'Scratch (-1)';
                      actionColor = 'text-red-500';
                    } else if (turn.isSafetyPlay || turn.isDefensiveShot) {
                      actionText = 'Safe';
                      actionColor = 'text-yellow-500';
                    } else if (turn.isMiss) {
                      actionText = 'Miss';
                      actionColor = 'text-red-500';
                    } else if (turn.ballsPocketed > 0) {
                      actionText = `Made ${turn.ballsPocketed} ball${turn.ballsPocketed !== 1 ? 's' : ''} (+${turn.points})`;
                      actionColor = 'text-green-500';
                    } else if (turn.ballsPocketed === 0) {
                      actionText = 'No balls pocketed';
                      actionColor = 'text-gray-500';
                    }

                    return (
                      <tr 
                        key={`${turn.inning}-${turn.playerNumber}`}
                        className="hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-3">
                          <span className={`${textColor} font-medium`}>{playerName}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-gray-400">#{turn.inning}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={actionColor}>{actionText}</span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="text-gray-500">{formatTimeOnly(turn.timestamp)}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-4">
                      No game history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showDeleteConfirm}
        onClose={handleCancelDelete}
        onClick={handleCancelDelete}
        className={isDarkMode ? 'dark' : ''}
      >
        <div className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}>
          <DialogTitle>Delete Match</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this match between {match.player1.name} and {match.player2.name}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
};

export default MatchCard; 