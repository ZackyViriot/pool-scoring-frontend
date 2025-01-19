export interface Player {
  name: string;
  _id: string;
}

export interface PlayerStats {
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

export interface Turn {
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

export interface Match {
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