import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Navbar from '../components/Navbar.tsx';
import {
  Grid,
  Typography,
  Modal,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import MatchCard from '../components/MatchCard.tsx';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
    }
  }
}

interface Player {
  name: string;
  _id: string;
}

interface PlayerStats {
  totalPoints: number;
  totalInnings: number;
  breakAndRuns: number;
  safetyPlays: number;
  defensiveShots: number;
  scratches: number;
  avgPointsPerInning: number;
  safes: number;
  misses: number;
  bestRun: number;
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
  innings: Turn[];
  createdAt: string;
  matchDate: Date;
}

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://poolscoringbackend.org';
  }
  return 'https://poolscoringbackend.org';
};

const API_BASE_URL = getApiUrl();

export default function History() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return true;
  });
  const [showPlayerStats, setShowPlayerStats] = useState<number | null>(null);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleMatchDelete = () => {
    // Refresh the matches list after deletion
    fetchMatches();
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
    setShowPlayerStats(null);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeOnly = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return format(date, 'h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  // Generate detailed stats for a player (similar to Game Mode)
  const generateDetailedStats = (match: Match, playerNum: number) => {
    const player = playerNum === 1 ? match.player1 : match.player2;
    const playerStats = playerNum === 1 ? match.player1Stats : match.player2Stats;
    const playerScore = playerNum === 1 ? match.player1Score : match.player2Score;
    const isWinner = match.winner.name === player.name;

    // Calculate innings played
    const playerInnings = new Set();
    (match.innings || []).forEach(turn => {
      if (turn.playerNumber === playerNum) {
        playerInnings.add(turn.inning);
      }
    });

    // Process turn history for detailed stats
    const safeDetails: { inning: number }[] = [];
    const missDetails: { inning: number }[] = [];
    const scratchDetails: { inning: number }[] = [];
    const foulDetails: { inning: number; type: string; points: number }[] = [];
    const runDetails: { inning: number; points: number }[] = [];
    const finishRackDetails: { inning: number; points: number }[] = [];

    (match.innings || []).forEach(turn => {
      if (turn.playerNumber === playerNum) {
        if (turn.isSafetyPlay || turn.isDefensiveShot) {
          safeDetails.push({ inning: turn.inning });
        }
        if (turn.isMiss) {
          missDetails.push({ inning: turn.inning });
        }
        if (turn.isScratch) {
          scratchDetails.push({ inning: turn.inning });
        }
        if (turn.isFoul || turn.isBreakingFoul || turn.isIntentionalFoul) {
          let foulType = 'Foul';
          let points = -1;
          if (turn.isBreakingFoul) {
            foulType = 'Breaking Foul';
            points = -2;
          } else if (turn.isIntentionalFoul) {
            foulType = 'Intentional Foul';
            points = -2;
          }
          foulDetails.push({ inning: turn.inning, type: foulType, points });
        }
        if (turn.ballsPocketed > 0 && !turn.isBreak) {
          runDetails.push({ inning: turn.inning, points: turn.points });
        }
        if (turn.action === 'Finish Rack') {
          finishRackDetails.push({ inning: turn.inning, points: turn.points });
        }
      }
    });

    return {
      name: player.name,
      totalScore: playerScore,
      bestRun: playerStats.bestRun,
      totalSafes: playerStats.safes,
      totalMisses: playerStats.misses,
      totalScratches: playerStats.scratches,
      totalFouls: playerStats.fouls,
      totalFinishRacks: finishRackDetails.length,
      safeDetails,
      missDetails,
      scratchDetails,
      foulDetails,
      runDetails,
      finishRackDetails,
      isWinner
    };
  };

  // Move fetchMatches function outside useEffect so it can be reused
  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      // Ensure response.data is an array
      setMatches(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch matches');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className={`min-h-screen h-screen overflow-hidden transition-colors duration-200
      ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-black text-white' 
        : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
      
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      
      <div className="max-w-7xl mx-auto p-4 h-full flex flex-col pt-20">
        {/* Header Section */}
        <div className={`rounded-lg p-4 mb-4 transition-colors duration-200
          ${isDarkMode 
            ? 'bg-gray-900/80 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}`}>
          <Typography variant="h4" className={`text-center font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Match History
          </Typography>
        </div>

        {/* Match Cards Grid */}
        <div className={`flex-grow overflow-y-auto rounded-lg p-4 transition-colors duration-200
          ${isDarkMode 
            ? 'bg-gray-900/80 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}`}>
          <Grid container spacing={3}>
            {Array.isArray(matches) && matches
              .filter((match): match is Match => 
                match !== null && 
                match !== undefined && 
                typeof match === 'object' &&
                'player1' in match && 
                'player2' in match && 
                'winner' in match)
              .map((match) => (
                <Grid item xs={12} sm={6} lg={4} key={match._id}>
                  <MatchCard 
                    match={match}
                    isDarkMode={isDarkMode}
                    onClick={handleMatchClick}
                    onDelete={handleMatchDelete}
                  />
                </Grid>
              ))}
          </Grid>
        </div>

        {/* Match Details Modal - Game Mode Style */}
        <Modal
          open={selectedMatch !== null}
          onClose={handleCloseModal}
          className="flex items-center justify-center"
        >
          <Box className={`rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto
            shadow-2xl animate-fadeIn transition-colors duration-200
            ${isDarkMode 
              ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
              : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}
          >
            {selectedMatch && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Typography variant="h4" className={`font-bold text-purple-400 mb-2`}>
                      🏆 Game Summary 🏆
                    </Typography>
                    <Typography variant="subtitle1" className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {(() => {
                        try {
                          const date = new Date(selectedMatch.createdAt);
                          if (isNaN(date.getTime())) {
                            return 'Invalid date';
                          }
                          return `${format(date, 'MMMM d, yyyy')} • ${formatDuration(selectedMatch.duration)}`;
                        } catch (error) {
                          return `Unknown date • ${formatDuration(selectedMatch.duration)}`;
                        }
                      })()}
                    </Typography>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className={`p-2 rounded-full hover:bg-gray-700/50 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    ✕
                  </button>
                </div>

                {/* Final Score Display */}
                <div className="text-center mb-8">
                  <p className={`text-2xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Winner: {selectedMatch.winner.name}
                  </p>
                  <div className="flex justify-center items-center gap-8 text-3xl font-bold mb-4">
                    <div className={`${selectedMatch.winner.name === selectedMatch.player1.name ? 'text-green-400' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedMatch.player1.name}: {selectedMatch.player1Score}
                    </div>
                    <div className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</div>
                    <div className={`${selectedMatch.winner.name === selectedMatch.player2.name ? 'text-green-400' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedMatch.player2.name}: {selectedMatch.player2Score}
                    </div>
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Game ended in {(selectedMatch.innings || []).length} innings • {formatDuration(selectedMatch.duration)}
                  </div>
                </div>

                {/* Player Stats Cards */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {[1, 2].map(playerNum => {
                    const stats = generateDetailedStats(selectedMatch, playerNum);
                    const playerInnings = new Set();
                    selectedMatch.innings.forEach(turn => {
                      if (turn.playerNumber === playerNum) {
                        playerInnings.add(turn.inning);
                      }
                    });
                    const totalInnings = playerInnings.size;

                    return (
                      <button
                        key={playerNum}
                        onClick={() => setShowPlayerStats(playerNum)}
                        className={`p-6 rounded-lg text-left transition-all hover:scale-105
                          ${isDarkMode ? 'bg-black/30 hover:bg-black/50' : 'bg-gray-100 hover:bg-gray-200'}
                          ${stats.isWinner ? 'ring-2 ring-green-500/50' : ''}`}
                      >
                        <h3 className={`text-xl font-bold mb-2 ${
                          playerNum === 1 ? 'text-blue-400' : 'text-orange-400'
                        }`}>
                          {stats.name} {stats.isWinner && '🏆'}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className={`rounded p-2 ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalScore}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Score</div>
                          </div>
                          <div className={`rounded p-2 ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.bestRun}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Run</div>
                          </div>
                          <div className={`rounded p-2 ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalInnings}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Innings</div>
                          </div>
                        </div>
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click to view detailed stats</p>
                      </button>
                    );
                  })}
                </div>

                {/* Game History Section */}
                <div className={`rounded-lg overflow-hidden ${
                  isDarkMode ? 'bg-black/30 backdrop-blur-sm border border-white/10' : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
                }`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <Typography variant="h6" className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Game History
                    </Typography>
                  </div>
                  <TableContainer className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    <Table sx={{ 
                      '& .MuiTableCell-root': { 
                        color: 'inherit',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : undefined 
                      }
                    }}>
                      <TableHead>
                        <TableRow className={isDarkMode ? 'bg-black/20' : 'bg-gray-50'}>
                          <TableCell className="text-inherit">
                            Inning
                          </TableCell>
                          <TableCell className="text-inherit">
                            Player
                          </TableCell>
                          <TableCell className="text-inherit">
                            Action
                          </TableCell>
                          <TableCell className="text-inherit">
                            Points
                          </TableCell>
                          <TableCell className="text-inherit">
                            Time
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedMatch.innings || []).map((turn, index) => {
                          const isPlayer1 = turn.playerName === selectedMatch.player1.name;
                          const playerColor = isPlayer1 ? 'text-blue-400' : 'text-orange-400';
                          
                          let actionText = '';
                          let actionColor = 'text-gray-400';

                          if (turn.isBreak && turn.ballsPocketed > 0) {
                            actionText = `Break - Made ${turn.ballsPocketed} ball${turn.ballsPocketed !== 1 ? 's' : ''}`;
                            actionColor = 'text-green-500';
                          } else if (turn.isFoul) {
                            actionText = 'Foul';
                            actionColor = 'text-red-500';
                          } else if (turn.isBreakingFoul) {
                            actionText = 'Breaking Foul';
                            actionColor = 'text-red-500';
                          } else if (turn.isIntentionalFoul) {
                            actionText = 'Intentional Foul';
                            actionColor = 'text-red-500';
                          } else if (turn.isScratch) {
                            actionText = turn.isBreak ? 'Break Scratch' : 'Scratch';
                            actionColor = 'text-red-500';
                          } else if (turn.isSafetyPlay || turn.isDefensiveShot) {
                            actionText = 'Safety';
                            actionColor = 'text-yellow-500';
                          } else if (turn.isMiss) {
                            actionText = 'Miss';
                            actionColor = 'text-red-500';
                          } else if (turn.ballsPocketed > 0) {
                            actionText = `Made ${turn.ballsPocketed} ball${turn.ballsPocketed !== 1 ? 's' : ''}`;
                            actionColor = 'text-green-500';
                          } else if (turn.action === 'Finish Rack') {
                            actionText = 'Finish Rack';
                            actionColor = 'text-green-500';
                          } else {
                            actionText = 'No balls pocketed';
                            actionColor = 'text-gray-500';
                          }

                          return (
                            <TableRow 
                              key={`${turn.inning}-${index}`}
                              className={`${isDarkMode ? 'hover:bg-black/20' : 'hover:bg-gray-50'}`}
                            >
                              <TableCell className="text-inherit">
                                {turn.inning}
                              </TableCell>
                              <TableCell className={playerColor}>
                                {turn.playerName}
                              </TableCell>
                              <TableCell className={actionColor}>
                                {actionText}
                              </TableCell>
                              <TableCell className={turn.points > 0 ? 'text-green-400' : turn.points < 0 ? 'text-red-400' : 'text-gray-400'}>
                                {turn.points > 0 ? '+' : ''}{turn.points}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                {(() => {
                                  try {
                                    return formatTimeOnly(turn.timestamp);
                                  } catch (error) {
                                    return 'N/A';
                                  }
                                })()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </>
            )}
          </Box>
        </Modal>

        {/* Individual Player Stats Modal */}
        {showPlayerStats && selectedMatch && (
          <Modal
            open={showPlayerStats !== null}
            onClose={() => setShowPlayerStats(null)}
            className="flex items-center justify-center"
          >
            <Box className={`rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto
              shadow-2xl animate-fadeIn transition-colors duration-200
              ${isDarkMode 
                ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10' 
                : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {showPlayerStats === 1 ? selectedMatch.player1.name : selectedMatch.player2.name} Stats
                </h2>
                <button
                  onClick={() => setShowPlayerStats(null)}
                  className={`p-2 rounded-full hover:bg-gray-700/50 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  ✕
                </button>
              </div>

              {(() => {
                const stats = generateDetailedStats(selectedMatch, showPlayerStats);
                const playerInnings = new Set();
                selectedMatch.innings.forEach(turn => {
                  if (turn.playerNumber === showPlayerStats) {
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
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Score:</span>
                          <span className={`ml-2 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalScore}</span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Innings:</span>
                          <span className={`ml-2 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalInnings}</span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Run:</span>
                          <span className={`ml-2 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.bestRun}</span>
                        </div>
                        <div>
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg per Inning:</span>
                          <span className={`ml-2 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {totalInnings > 0 ? (stats.totalScore / totalInnings).toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className={`rounded p-3 text-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalScore}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Final Score</div>
                      </div>
                      <div className={`rounded p-3 text-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.bestRun}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Best Run</div>
                      </div>
                      <div className={`rounded p-3 text-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalInnings}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Innings</div>
                      </div>
                      <div className={`rounded p-3 text-center ${isDarkMode ? 'bg-black/20' : 'bg-gray-200'}`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalInnings > 0 ? (stats.totalScore / totalInnings).toFixed(1) : '0.0'}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg/Inning</div>
                      </div>
                    </div>

                    {/* Game Stats Summary */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-green-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-green-400">{stats.totalSafes || 0}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Safety</div>
                      </div>
                      <div className="bg-red-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{stats.totalMisses || 0}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Misses</div>
                      </div>
                      <div className="bg-orange-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-orange-400">{stats.totalScratches || 0}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scratches</div>
                      </div>
                      <div className="bg-red-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-red-400">{stats.totalFouls || 0}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fouls</div>
                      </div>
                    </div>

                    {/* Foul Types Breakdown */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-yellow-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-yellow-400">
                          {(stats.foulDetails || []).filter(f => f.type.includes('Break')).length}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Break Fouls</div>
                      </div>
                      <div className="bg-purple-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-purple-400">
                          {(stats.foulDetails || []).filter(f => f.type.includes('Intentional')).length}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Int Fouls</div>
                      </div>
                      <div className="bg-indigo-500/10 rounded p-2 text-center">
                        <div className="text-lg font-bold text-indigo-400">{stats.totalFinishRacks || 0}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Finish Racks</div>
                      </div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="bg-green-500/20 rounded p-3">
                          <h4 className="font-medium text-green-400 mb-2">Safety ({stats.totalSafes || 0})</h4>
                          <div className="space-y-1">
                            {(stats.safeDetails || []).map((safe, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {safe.inning}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-red-500/20 rounded p-3">
                          <h4 className="font-medium text-red-400 mb-2">Misses ({stats.totalMisses || 0})</h4>
                          <div className="space-y-1">
                            {(stats.missDetails || []).map((miss, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {miss.inning}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-500/20 rounded p-3">
                          <h4 className="font-medium text-blue-400 mb-2">Runs</h4>
                          <div className="space-y-1">
                            {(() => {
                              // Group runs by inning
                              const runGroups: { [key: number]: number } = {};
                              (stats.runDetails || []).forEach((run) => {
                                if (!runGroups[run.inning]) {
                                  runGroups[run.inning] = 0;
                                }
                                runGroups[run.inning] += run.points;
                              });

                              return Object.entries(runGroups).map(([inning, points]) => (
                                <div key={inning} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {inning}</span>
                                  <span className="text-green-400">+{points}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        <div className="bg-orange-500/20 rounded p-3">
                          <h4 className="font-medium text-orange-400 mb-2">Scratches</h4>
                          <div className="space-y-1">
                            {(stats.scratchDetails || []).map((scratch, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {scratch.inning}</span>
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
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {foul.inning}</span>
                                <span className="text-red-400">{foul.type} ({foul.points})</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-yellow-500/20 rounded p-3">
                          <h4 className="font-medium text-yellow-400 mb-2">Break Fouls</h4>
                          <div className="space-y-1">
                            {(stats.foulDetails || []).filter(f => f.type.includes('Break')).map((foul, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {foul.inning}</span>
                                <span className="text-red-400">{foul.points}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-purple-500/20 rounded p-3">
                          <h4 className="font-medium text-purple-400 mb-2">Intentional Fouls</h4>
                          <div className="space-y-1">
                            {(stats.foulDetails || []).filter(f => f.type.includes('Intentional')).map((foul, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {foul.inning}</span>
                                <span className="text-red-400">{foul.points}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-indigo-500/20 rounded p-3">
                          <h4 className="font-medium text-indigo-400 mb-2">Finish Racks</h4>
                          <div className="space-y-1">
                            {(stats.finishRackDetails || []).map((finish, idx) => (
                              <div key={idx} className={`text-sm flex justify-between rounded px-2 py-1 ${isDarkMode ? 'bg-black/10' : 'bg-gray-100'}`}>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Inning {finish.inning}</span>
                                <span className="text-green-400">+{finish.points}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Box>
          </Modal>
        )}
      </div>
    </div>
  );
} 