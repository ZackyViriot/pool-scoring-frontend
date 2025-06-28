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
      : 'http://b0cwgosscocoskkggsgs804w.85.31.224.91.sslip.io';
  }
  return 'http://localhost:8000';
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

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleMatchDelete = () => {
    // Refresh the matches list after deletion
    fetchMatches();
  };

  const handleCloseModal = () => {
    setSelectedMatch(null);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Move fetchMatches function outside useEffect so it can be reused
  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

        {/* Match Details Modal */}
        <Modal
          open={selectedMatch !== null}
          onClose={handleCloseModal}
          className="flex items-center justify-center"
        >
          <Box className={`rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto
            ${isDarkMode 
              ? 'bg-black/95 backdrop-blur-sm border border-white/10' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'}`}
          >
            {selectedMatch && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <Typography variant="h5" className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedMatch.gameType}
                    </Typography>
                    <Typography variant="body2" className={isDarkMode ? 'text-gray-300' : 'text-gray-500'}>
                      {format(new Date(selectedMatch.createdAt), 'MMMM d, yyyy')}
                    </Typography>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    isDarkMode ? 'bg-black/50 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    Duration: {formatDuration(selectedMatch.duration)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className={`p-6 rounded-lg ${
                    isDarkMode 
                      ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
                  }`}>
                    <Typography variant="h6" className={`font-bold mb-4 text-blue-400`}>
                      {selectedMatch.player1.name}
                    </Typography>
                    <div className="space-y-3">
                      <StatRow label="Score" value={selectedMatch.player1Score} isDarkMode={isDarkMode} isPlayer1={true} />
                      <StatRow 
                        label="Avg Points/Inning" 
                        value={selectedMatch.player1Stats.avgPointsPerInning.toFixed(2)} 
                        isDarkMode={isDarkMode}
                        isPlayer1={true}
                      />
                      <StatRow 
                        label="Break & Runs" 
                        value={selectedMatch.player1Stats.breakAndRuns} 
                        isDarkMode={isDarkMode}
                        isPlayer1={true}
                      />
                      <StatRow 
                        label="Safety Plays" 
                        value={selectedMatch.player1Stats.safetyPlays} 
                        isDarkMode={isDarkMode}
                        isPlayer1={true}
                      />
                      <StatRow 
                        label="Scratches" 
                        value={selectedMatch.player1Stats.scratches} 
                        isDarkMode={isDarkMode}
                        isPlayer1={true}
                      />
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg ${
                    isDarkMode 
                      ? 'bg-black/30 backdrop-blur-sm border border-white/10' 
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
                  }`}>
                    <Typography variant="h6" className={`font-bold mb-4 text-orange-400`}>
                      {selectedMatch.player2.name}
                    </Typography>
                    <div className="space-y-3">
                      <StatRow label="Score" value={selectedMatch.player2Score} isDarkMode={isDarkMode} isPlayer1={false} />
                      <StatRow 
                        label="Avg Points/Inning" 
                        value={selectedMatch.player2Stats.avgPointsPerInning.toFixed(2)} 
                        isDarkMode={isDarkMode}
                        isPlayer1={false}
                      />
                      <StatRow 
                        label="Break & Runs" 
                        value={selectedMatch.player2Stats.breakAndRuns} 
                        isDarkMode={isDarkMode}
                        isPlayer1={false}
                      />
                      <StatRow 
                        label="Safety Plays" 
                        value={selectedMatch.player2Stats.safetyPlays} 
                        isDarkMode={isDarkMode}
                        isPlayer1={false}
                      />
                      <StatRow 
                        label="Scratches" 
                        value={selectedMatch.player2Stats.scratches} 
                        isDarkMode={isDarkMode}
                        isPlayer1={false}
                      />
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg overflow-hidden ${
                  isDarkMode ? 'bg-black/30 backdrop-blur-sm border border-white/10' : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
                }`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <Typography variant="h6" className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Inning Details
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
                            Points
                          </TableCell>
                          <TableCell className="text-inherit">
                            Time
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedMatch.innings.map((turn, index) => {
                          // Check if this turn belongs to Player 1 or Player 2
                          const isPlayer1 = turn.playerName === selectedMatch.player1.name;
                          const playerColor = isPlayer1 ? 'text-blue-400' : 'text-orange-400';
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
                              <TableCell className={playerColor}>
                                {turn.score}
                              </TableCell>
                              <TableCell className={playerColor}>
                                {format(new Date(turn.timestamp), 'h:mm:ss a')}
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
      </div>
    </div>
  );
}

// Helper component for stats rows
const StatRow = ({ label, value, isDarkMode, isPlayer1 }: { label: string; value: string | number; isDarkMode: boolean; isPlayer1: boolean }) => (
  <div className="flex justify-between items-center">
    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    <span className={`font-bold ${isPlayer1 ? 'text-blue-400' : 'text-orange-400'}`}>{value}</span>
  </div>
); 