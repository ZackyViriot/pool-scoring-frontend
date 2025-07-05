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

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://poolscoringbackend.org';
  }
  return 'https://poolscoringbackend.org';
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, isDarkMode, onClick, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${getApiUrl()}/matches/${match._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
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
        onClick={() => onClick(match)}
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