/**
 * Game History Simulation Tests
 *
 * Tests the core game logic extracted from PoolScoringComponent:
 * - Turn history recording
 * - Stats calculation (calculatePlayerStats)
 * - Match data processing for save (processedInnings mapping)
 *
 * Simulates full games and verifies the data that would be sent to the backend.
 */

// ============================================================
// Extracted core logic (mirrors PoolScoringComponent functions)
// ============================================================

/**
 * Simulates addToTurnHistory - builds a turn entry
 */
function buildTurnEntry(playerNum, action, points, gameState) {
  const player = playerNum === 1 ? gameState.player1 : gameState.player2;
  return {
    inning: gameState.currentInning,
    playerName: player.name || `Player ${playerNum}`,
    playerNum,
    action,
    points,
    timestamp: new Date(),
    score: player.score + (points || 0),
    ballsPocketed: action === 'Points' ? points : 0
  };
}

/**
 * Mirrors calculatePlayerStats from PoolScoringComponent (after fix)
 * Stats derived purely from turnHistory - no double-counting
 */
function calculatePlayerStats(player, playerNum, turnHistory) {
  let totalPoints = player.score || 0;
  let totalSafes = 0;
  let totalMisses = 0;
  let totalFouls = 0;
  let totalScratches = 0;
  let totalIntentionalFouls = 0;
  let totalBreakingFouls = 0;
  let currentRunCount = 0;
  let maxRunInGame = 0;
  let breakAndRuns = 0;
  let defensiveShots = 0;
  let safetyPlays = 0;
  let playerInnings = 0;
  let wasBreakShot = false;
  const runHistoryArr = [];

  const endRun = () => {
    if (currentRunCount > 0) {
      runHistoryArr.push(currentRunCount);
    }
    currentRunCount = 0;
  };

  turnHistory.forEach(turn => {
    if (turn.playerNum === playerNum) {
      playerInnings++;
      wasBreakShot = turn.isBreak || false;

      switch (turn.action) {
        case 'Points':
        case 'Finish Rack':
          currentRunCount += turn.points || 0;
          maxRunInGame = Math.max(maxRunInGame, currentRunCount);
          if (wasBreakShot && currentRunCount >= 14) {
            breakAndRuns++;
          }
          break;
        case 'Breaking Foul':
        case 'Breaking Foul - Rebreak':
          totalBreakingFouls++;
          totalFouls++;
          endRun();
          break;
        case 'Safety':
          totalSafes++;
          safetyPlays++;
          defensiveShots++;
          endRun();
          break;
        case 'Miss':
          totalMisses++;
          endRun();
          break;
        case 'Scratch':
        case 'Break Scratch':
          totalScratches++;
          endRun();
          break;
        case 'Foul':
          totalFouls++;
          endRun();
          break;
        case 'Intentional Foul':
          totalFouls++;
          totalIntentionalFouls++;
          endRun();
          break;
        default:
          if (!['New Rack', 'Undo', 'Handicap Applied'].includes(turn.action)) {
            endRun();
          }
      }
      wasBreakShot = false;
    }
  });

  if (currentRunCount > 0) {
    runHistoryArr.push(currentRunCount);
  }

  const stats = {
    totalPoints,
    totalInnings: playerInnings,
    breakAndRuns,
    safetyPlays,
    safes: totalSafes,
    defensiveShots,
    scratches: totalScratches,
    avgPointsPerInning: playerInnings > 0 ? (totalPoints / playerInnings) : 0,
    fouls: totalFouls,
    intentionalFouls: totalIntentionalFouls,
    breakingFouls: totalBreakingFouls,
    misses: totalMisses,
    bestRun: Math.max(maxRunInGame, player.bestRun || 0),
    currentRun: currentRunCount,
    runHistory: runHistoryArr
  };

  // Same sanitization as the real code
  Object.keys(stats).forEach(key => {
    if (key === 'runHistory') return;
    if (key === 'avgPointsPerInning') {
      stats[key] = Math.max(0, parseFloat(stats[key]) || 0);
    } else {
      stats[key] = Math.max(0, parseInt(stats[key]) || 0);
    }
  });

  return stats;
}

/**
 * Mirrors processedInnings mapping from saveMatchToDatabase
 */
function processInnings(turnHistory) {
  return turnHistory.map((turn, index) => ({
    playerNumber: turn.playerNum,
    playerName: turn.playerName,
    ballsPocketed: turn.action === 'Points' || turn.action === 'Finish Rack' ? turn.points : 0,
    action: turn.action,
    timestamp: turn.timestamp,
    score: turn.score,
    inning: turn.inning,
    points: turn.points,
    isBreak: index === 0 || turn.action === 'Breaking Foul' || turn.action === 'Breaking Foul - Rebreak' || turn.action === 'Break Scratch',
    isScratch: turn.action.toLowerCase().includes('scratch'),
    isSafetyPlay: turn.action.toLowerCase().includes('safe'),
    isDefensiveShot: turn.action.toLowerCase().includes('defensive'),
    isFoul: turn.action.toLowerCase().includes('foul'),
    isBreakingFoul: turn.action.toLowerCase().includes('breaking foul'),
    isIntentionalFoul: turn.action.toLowerCase().includes('intentional foul'),
    isMiss: turn.action.toLowerCase().includes('miss'),
    actionText: turn.action,
    actionColor: '#000000'
  }));
}

/**
 * Mirrors the History page's generateDetailedStats logic (after fix)
 */
function generateDetailedStats(innings, playerNum, playerStats, playerScore, playerName, winnerName) {
  const safeDetails = [];
  const missDetails = [];
  const scratchDetails = [];
  const foulDetails = [];
  const runDetails = [];
  const finishRackDetails = [];

  (innings || []).forEach(turn => {
    if (turn.playerNumber === playerNum) {
      const action = turn.action || '';
      if (action === 'Safety' || turn.isSafetyPlay || turn.isDefensiveShot) {
        safeDetails.push({ inning: turn.inning });
      }
      if (action === 'Miss' || turn.isMiss) {
        missDetails.push({ inning: turn.inning });
      }
      if (action === 'Scratch' || action === 'Break Scratch' || turn.isScratch) {
        scratchDetails.push({ inning: turn.inning });
      }
      if (action === 'Breaking Foul' || action === 'Breaking Foul - Rebreak' || turn.isBreakingFoul) {
        foulDetails.push({ inning: turn.inning, type: 'Breaking Foul', points: -2 });
      } else if (action === 'Intentional Foul' || turn.isIntentionalFoul) {
        foulDetails.push({ inning: turn.inning, type: 'Intentional Foul', points: -2 });
      } else if (action === 'Foul' || (turn.isFoul && !turn.isBreakingFoul && !turn.isIntentionalFoul)) {
        foulDetails.push({ inning: turn.inning, type: 'Foul', points: -1 });
      }
      if (action === 'Points' || (turn.ballsPocketed > 0 && !turn.isBreak && action !== 'Finish Rack')) {
        runDetails.push({ inning: turn.inning, points: turn.points });
      }
      if (action === 'Finish Rack') {
        finishRackDetails.push({ inning: turn.inning, points: turn.points });
      }
    }
  });

  return {
    name: playerName,
    totalScore: playerScore,
    bestRun: playerStats?.bestRun || 0,
    totalSafes: safeDetails.length,
    totalMisses: missDetails.length,
    totalScratches: scratchDetails.length,
    totalFouls: foulDetails.length,
    totalFinishRacks: finishRackDetails.length,
    safeDetails,
    missDetails,
    scratchDetails,
    foulDetails,
    runDetails,
    finishRackDetails,
    isWinner: playerName === winnerName
  };
}

// ============================================================
// Game Simulator - drives the extracted logic like a real game
// ============================================================

class GameSimulator {
  constructor(player1Name, player2Name, targetGoal) {
    this.player1 = { name: player1Name, score: 0, bestRun: 0, currentRun: 0, safes: 0, misses: 0, fouls: 0, intentionalFouls: 0, breakingFouls: 0, scratches: 0 };
    this.player2 = { name: player2Name, score: 0, bestRun: 0, currentRun: 0, safes: 0, misses: 0, fouls: 0, intentionalFouls: 0, breakingFouls: 0, scratches: 0 };
    this.activePlayer = 1;
    this.currentInning = 1;
    this.turnHistory = [];
    this.targetGoal = targetGoal;
    this.winner = null;
  }

  getGameState() {
    return {
      player1: this.player1,
      player2: this.player2,
      currentInning: this.currentInning
    };
  }

  addTurn(action, points) {
    const playerNum = this.activePlayer;
    const entry = buildTurnEntry(playerNum, action, points, this.getGameState());
    this.turnHistory.push(entry);

    const player = playerNum === 1 ? this.player1 : this.player2;

    switch (action) {
      case 'Points':
        player.score += points;
        player.currentRun += points;
        player.bestRun = Math.max(player.bestRun, player.currentRun);
        // Check win
        if (player.score >= this.targetGoal) {
          this.winner = playerNum;
        }
        return; // Don't switch turns
      case 'Finish Rack':
        player.score += points;
        player.currentRun += points;
        player.bestRun = Math.max(player.bestRun, player.currentRun);
        if (player.score >= this.targetGoal) {
          this.winner = playerNum;
        }
        return; // Don't switch turns
      case 'Miss':
        player.misses++;
        player.currentRun = 0;
        break;
      case 'Safety':
        player.safes++;
        player.currentRun = 0;
        break;
      case 'Foul':
        player.score -= 1;
        player.fouls++;
        player.currentRun = 0;
        break;
      case 'Scratch':
        player.score -= 1;
        player.scratches++;
        player.currentRun = 0;
        break;
      case 'Breaking Foul':
        player.score -= 2;
        player.fouls++;
        player.breakingFouls++;
        player.currentRun = 0;
        break;
      case 'Intentional Foul':
        player.score -= 2;
        player.fouls++;
        player.intentionalFouls++;
        player.currentRun = 0;
        break;
    }

    // Switch turns
    if (playerNum === 2) {
      this.currentInning++;
    }
    this.activePlayer = playerNum === 1 ? 2 : 1;
  }

  getResults() {
    const winnerNum = this.winner;
    const winnerPlayer = winnerNum === 1 ? this.player1 : this.player2;

    const p1Stats = calculatePlayerStats(this.player1, 1, this.turnHistory);
    const p2Stats = calculatePlayerStats(this.player2, 2, this.turnHistory);
    const innings = processInnings(this.turnHistory);

    return {
      player1: this.player1,
      player2: this.player2,
      player1Stats: p1Stats,
      player2Stats: p2Stats,
      innings,
      turnHistory: this.turnHistory,
      winner: winnerPlayer,
      winnerNum
    };
  }
}

// ============================================================
// Tests
// ============================================================

describe('Game History - Simulation Tests', () => {

  describe('Simulation 1: Clean game - Player 1 runs out to 25', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Alice', 'Bob', 25);

      // Inning 1: Alice scores 5, misses
      sim.addTurn('Points', 3);
      sim.addTurn('Points', 2);
      sim.addTurn('Miss', 0);

      // Inning 1: Bob scores 3, misses
      sim.addTurn('Points', 3);
      sim.addTurn('Miss', 0);

      // Inning 2: Alice scores 7, misses
      sim.addTurn('Points', 4);
      sim.addTurn('Points', 3);
      sim.addTurn('Miss', 0);

      // Inning 2: Bob plays safe
      sim.addTurn('Safety', 0);

      // Inning 3: Alice scores 8, misses
      sim.addTurn('Points', 5);
      sim.addTurn('Points', 3);
      sim.addTurn('Miss', 0);

      // Inning 3: Bob scores 2, misses
      sim.addTurn('Points', 2);
      sim.addTurn('Miss', 0);

      // Inning 4: Alice scores 5 to win (20 + 5 = 25)
      sim.addTurn('Points', 5);

      results = sim.getResults();
    });

    test('final scores are correct', () => {
      expect(results.player1.score).toBe(25);
      expect(results.player2.score).toBe(5);
    });

    test('player1 stats calculated correctly from turnHistory', () => {
      const p1 = results.player1Stats;
      expect(p1.misses).toBe(3);
      expect(p1.safes).toBe(0);
      expect(p1.fouls).toBe(0);
      expect(p1.scratches).toBe(0);
      expect(p1.bestRun).toBe(8); // 5+3 in inning 3
      expect(p1.totalPoints).toBe(25);
    });

    test('player2 stats calculated correctly from turnHistory', () => {
      const p2 = results.player2Stats;
      expect(p2.misses).toBe(2);
      expect(p2.safes).toBe(1);
      expect(p2.fouls).toBe(0);
      expect(p2.totalPoints).toBe(5);
    });

    test('runHistory tracks runs correctly', () => {
      const p1 = results.player1Stats;
      // Runs: 5 (miss), 7 (miss), 8 (miss), 5 (game end, in progress)
      expect(p1.runHistory).toEqual([5, 7, 8, 5]);
    });

    test('innings are recorded with correct structure', () => {
      const innings = results.innings;
      expect(innings.length).toBe(sim.turnHistory.length);
      innings.forEach(inning => {
        expect(inning).toHaveProperty('playerNumber');
        expect(inning).toHaveProperty('playerName');
        expect(inning).toHaveProperty('action');
        expect(inning).toHaveProperty('points');
        expect(inning).toHaveProperty('inning');
        expect(inning).toHaveProperty('isFoul');
        expect(inning).toHaveProperty('isScratch');
        expect(inning).toHaveProperty('isMiss');
        expect(inning).toHaveProperty('isSafetyPlay');
      });
    });

    test('winner is correct', () => {
      expect(results.winner.name).toBe('Alice');
      expect(results.winnerNum).toBe(1);
    });
  });

  describe('Simulation 2: Game with fouls, scratches, and intentional fouls', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Charlie', 'Diana', 15);

      // Inning 1: Charlie breaks and fouls
      sim.addTurn('Breaking Foul', -2);

      // Inning 1: Diana scores 4, misses
      sim.addTurn('Points', 4);
      sim.addTurn('Miss', 0);

      // Inning 2: Charlie scratches
      sim.addTurn('Scratch', -1);

      // Inning 2: Diana intentional fouls
      sim.addTurn('Intentional Foul', -2);

      // Inning 3: Charlie scores 8
      sim.addTurn('Points', 5);
      sim.addTurn('Points', 3);
      sim.addTurn('Miss', 0);

      // Inning 3: Diana scores 6, misses
      sim.addTurn('Points', 6);
      sim.addTurn('Miss', 0);

      // Inning 4: Charlie fouls
      sim.addTurn('Foul', -1);

      // Inning 4: Diana scores 7 to win (4 - 2 + 6 + 7 = 15)
      sim.addTurn('Points', 7);

      results = sim.getResults();
    });

    test('scores reflect deductions', () => {
      // Charlie: -2 (break foul) -1 (scratch) +5 +3 -1 (foul) = 4
      expect(results.player1.score).toBe(4);
      // Diana: 4 -2 (int foul) +6 +7 = 15
      expect(results.player2.score).toBe(15);
    });

    test('foul types are counted separately (no double-counting)', () => {
      const p1 = results.player1Stats;
      expect(p1.breakingFouls).toBe(1);
      expect(p1.scratches).toBe(1);
      // fouls total: breaking foul(1) + foul(1) = 2 (scratches tracked separately)
      expect(p1.fouls).toBe(2);
      expect(p1.intentionalFouls).toBe(0);

      const p2 = results.player2Stats;
      expect(p2.intentionalFouls).toBe(1);
      // fouls total: intentional foul(1) = 1
      expect(p2.fouls).toBe(1);
      expect(p2.breakingFouls).toBe(0);
    });

    test('processedInnings sets boolean flags correctly for foul types', () => {
      const innings = results.innings;

      // First turn: Breaking Foul
      const breakFoulTurn = innings[0];
      expect(breakFoulTurn.action).toBe('Breaking Foul');
      expect(breakFoulTurn.isFoul).toBe(true);
      expect(breakFoulTurn.isBreakingFoul).toBe(true);
      expect(breakFoulTurn.isIntentionalFoul).toBe(false);

      // Scratch turn (index 3)
      const scratchTurn = innings[3];
      expect(scratchTurn.action).toBe('Scratch');
      expect(scratchTurn.isScratch).toBe(true);

      // Intentional Foul turn (index 4)
      const intFoulTurn = innings[4];
      expect(intFoulTurn.action).toBe('Intentional Foul');
      expect(intFoulTurn.isIntentionalFoul).toBe(true);
      expect(intFoulTurn.isFoul).toBe(true);
    });

    test('History page generateDetailedStats correctly categorizes foul types', () => {
      const p1Details = generateDetailedStats(
        results.innings, 1, results.player1Stats, results.player1.score, 'Charlie', 'Diana'
      );

      // Should have 2 total fouls (scratches tracked separately)
      expect(p1Details.totalFouls).toBe(2);
      // Breaking foul should be categorized as 'Breaking Foul', not generic 'Foul'
      const breakingFouls = p1Details.foulDetails.filter(f => f.type === 'Breaking Foul');
      expect(breakingFouls.length).toBe(1);
      // Regular foul
      const regularFouls = p1Details.foulDetails.filter(f => f.type === 'Foul');
      expect(regularFouls.length).toBe(1);

      const p2Details = generateDetailedStats(
        results.innings, 2, results.player2Stats, results.player2.score, 'Diana', 'Diana'
      );
      // Intentional foul should NOT be categorized as generic 'Foul'
      const intFouls = p2Details.foulDetails.filter(f => f.type === 'Intentional Foul');
      expect(intFouls.length).toBe(1);
      const genericFouls = p2Details.foulDetails.filter(f => f.type === 'Foul');
      expect(genericFouls.length).toBe(0);
    });

    test('winner is correct', () => {
      expect(results.winner.name).toBe('Diana');
    });
  });

  describe('Simulation 3: Game with Finish Rack and long runs', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Eve', 'Frank', 30);

      // Inning 1: Eve scores a huge run with a finish rack
      sim.addTurn('Points', 5);
      sim.addTurn('Points', 4);
      sim.addTurn('Finish Rack', 3); // finishes rack with 3, continues
      sim.addTurn('Points', 6);
      sim.addTurn('Miss', 0);

      // Inning 1: Frank scores 2, misses
      sim.addTurn('Points', 2);
      sim.addTurn('Miss', 0);

      // Inning 2: Eve scores 5, safety
      sim.addTurn('Points', 5);
      sim.addTurn('Safety', 0);

      // Inning 2: Frank scores 10
      sim.addTurn('Points', 5);
      sim.addTurn('Points', 5);
      sim.addTurn('Miss', 0);

      // Inning 3: Eve scores 7 to win (5+4+3+6+5+7 = 30)
      sim.addTurn('Points', 7);

      results = sim.getResults();
    });

    test('scores are correct', () => {
      expect(results.player1.score).toBe(30);
      expect(results.player2.score).toBe(12);
    });

    test('Finish Rack is included in run count', () => {
      const p1 = results.player1Stats;
      // Run 1: 5+4+3+6 = 18 (miss ends it)
      // Run 2: 5 (safety ends it)
      // Run 3: 7 (game end, in progress)
      expect(p1.runHistory).toEqual([18, 5, 7]);
      expect(p1.bestRun).toBe(18);
    });

    test('Finish Rack turns have correct innings data', () => {
      const finishRackTurns = results.innings.filter(t => t.action === 'Finish Rack');
      expect(finishRackTurns.length).toBe(1);
      expect(finishRackTurns[0].ballsPocketed).toBe(3);
      expect(finishRackTurns[0].points).toBe(3);
    });

    test('History detail stats count finish racks', () => {
      const p1Details = generateDetailedStats(
        results.innings, 1, results.player1Stats, 30, 'Eve', 'Eve'
      );
      expect(p1Details.totalFinishRacks).toBe(1);
      expect(p1Details.finishRackDetails.length).toBe(1);
      expect(p1Details.isWinner).toBe(true);
    });
  });

  describe('Simulation 4: Back-and-forth game with many innings', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Grace', 'Hank', 10);

      // Inning 1
      sim.addTurn('Points', 1); sim.addTurn('Miss', 0); // Grace: 1
      sim.addTurn('Points', 2); sim.addTurn('Miss', 0); // Hank: 2

      // Inning 2
      sim.addTurn('Points', 1); sim.addTurn('Miss', 0); // Grace: 2
      sim.addTurn('Points', 1); sim.addTurn('Miss', 0); // Hank: 3

      // Inning 3
      sim.addTurn('Safety', 0);                          // Grace: 2
      sim.addTurn('Points', 1); sim.addTurn('Miss', 0); // Hank: 4

      // Inning 4
      sim.addTurn('Foul', -1);                           // Grace: 1
      sim.addTurn('Points', 2); sim.addTurn('Miss', 0); // Hank: 6

      // Inning 5
      sim.addTurn('Points', 3); sim.addTurn('Miss', 0); // Grace: 4
      sim.addTurn('Points', 1); sim.addTurn('Miss', 0); // Hank: 7

      // Inning 6
      sim.addTurn('Points', 2); sim.addTurn('Miss', 0); // Grace: 6
      sim.addTurn('Points', 3);                          // Hank: 10 - wins!

      results = sim.getResults();
    });

    test('scores are correct', () => {
      expect(results.player1.score).toBe(6);
      expect(results.player2.score).toBe(10);
    });

    test('inning numbers advance correctly', () => {
      // Should have 6 innings
      const uniqueInnings = new Set(results.innings.map(t => t.inning));
      expect(uniqueInnings.size).toBe(6);
    });

    test('stats reflect every action', () => {
      const p1 = results.player1Stats;
      expect(p1.misses).toBe(4);
      expect(p1.safes).toBe(1);
      expect(p1.fouls).toBe(1);

      const p2 = results.player2Stats;
      expect(p2.misses).toBe(5);
      expect(p2.safes).toBe(0);
      expect(p2.fouls).toBe(0);
    });

    test('winner is Hank', () => {
      expect(results.winner.name).toBe('Hank');
    });
  });

  describe('Simulation 5: Edge case - game with only fouls and one scoring shot', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Ivy', 'Jake', 5);

      // A chaotic game with lots of fouls
      sim.addTurn('Breaking Foul', -2);  // Ivy: -2
      sim.addTurn('Scratch', -1);         // Jake: -1
      sim.addTurn('Foul', -1);            // Ivy: -3
      sim.addTurn('Intentional Foul', -2);// Jake: -3
      sim.addTurn('Miss', 0);             // Ivy: -3
      sim.addTurn('Points', 3);
      sim.addTurn('Miss', 0);             // Jake: 0

      // Now some scoring
      sim.addTurn('Points', 5);           // Ivy: 2 (not enough, score was -3)

      // Wait - score should be -3 + 5 = 2, need more
      sim.addTurn('Points', 3);           // Ivy: 5, wins!

      results = sim.getResults();
    });

    test('negative scores tracked correctly', () => {
      // Ivy: -2 -1 +5 +3 = 5
      expect(results.player1.score).toBe(5);
      // Jake: -1 -2 +3 = 0
      expect(results.player2.score).toBe(0);
    });

    test('all foul types counted correctly', () => {
      const p1 = results.player1Stats;
      expect(p1.breakingFouls).toBe(1);
      expect(p1.fouls).toBe(2); // breaking foul + regular foul
      expect(p1.misses).toBe(1);

      const p2 = results.player2Stats;
      expect(p2.scratches).toBe(1);
      expect(p2.intentionalFouls).toBe(1);
      expect(p2.fouls).toBe(1); // intentional foul only (scratches tracked separately)
    });

    test('runs track across negative score territory', () => {
      const p1 = results.player1Stats;
      // Run: 5+3 = 8 (in-progress at game end)
      expect(p1.runHistory).toEqual([8]);
      expect(p1.bestRun).toBe(8);
    });
  });

  describe('Simulation 6: Verify no double-counting in calculatePlayerStats', () => {
    test('stats from turnHistory should NOT be added to player state stats', () => {
      const sim = new GameSimulator('Test1', 'Test2', 50);

      // Player makes 3 safeties and 2 misses
      sim.addTurn('Safety', 0);
      sim.addTurn('Miss', 0);  // P2
      sim.addTurn('Safety', 0);
      sim.addTurn('Miss', 0);  // P2
      sim.addTurn('Safety', 0);
      sim.addTurn('Miss', 0);  // P2
      sim.addTurn('Miss', 0);
      sim.addTurn('Miss', 0);  // P2
      sim.addTurn('Miss', 0);

      const results = sim.getResults();

      // Player 1 had 3 safes and 2 misses
      const p1 = results.player1Stats;
      expect(p1.safes).toBe(3);  // NOT 6 (which would be double-counted)
      expect(p1.misses).toBe(2); // NOT 4
    });
  });

  describe('Simulation 7: History page display - action text rendering', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Player1', 'Player2', 50);

      sim.addTurn('Points', 3);
      sim.addTurn('Breaking Foul', -2);  // This also sets isFoul=true
      sim.addTurn('Intentional Foul', -2);
      sim.addTurn('Points', 2);
      sim.addTurn('Scratch', -1);
      sim.addTurn('Safety', 0);
      sim.addTurn('Miss', 0);
      sim.addTurn('Foul', -1);
      sim.addTurn('Finish Rack', 3);

      results = sim.getResults();
    });

    test('Breaking Foul has isFoul=true AND isBreakingFoul=true', () => {
      // This is the crucial test - the History page needs to handle this correctly
      const breakFoul = results.innings.find(t => t.action === 'Breaking Foul');
      expect(breakFoul.isFoul).toBe(true);
      expect(breakFoul.isBreakingFoul).toBe(true);
    });

    test('Intentional Foul has isFoul=true AND isIntentionalFoul=true', () => {
      const intFoul = results.innings.find(t => t.action === 'Intentional Foul');
      expect(intFoul.isFoul).toBe(true);
      expect(intFoul.isIntentionalFoul).toBe(true);
    });

    test('generateDetailedStats does not double-count overlapping foul flags', () => {
      // This tests the fix: before, Breaking Foul was counted as both 'Breaking Foul' AND 'Foul'
      const p1Details = generateDetailedStats(
        results.innings, 1, results.player1Stats, results.player1.score, 'Player1', null
      );

      // P1 actions: Points(3), BreakingFoul(-2), Points(2), Scratch(-1), Miss, FinishRack(3)
      // Fouls for P1: BreakingFoul only (scratch tracked separately)
      const breakingFouls = p1Details.foulDetails.filter(f => f.type === 'Breaking Foul');
      const genericFouls = p1Details.foulDetails.filter(f => f.type === 'Foul');

      expect(breakingFouls.length).toBe(1);
      // No generic fouls for P1
      expect(genericFouls.length).toBe(0);
      expect(p1Details.totalFouls).toBe(1);
      // Scratch tracked separately
      expect(p1Details.totalScratches).toBe(1);

      const p2Details = generateDetailedStats(
        results.innings, 2, results.player2Stats, results.player2.score, 'Player2', null
      );

      // P2 actions: IntentionalFoul(-2), Safety, Foul(-1)
      const intFouls = p2Details.foulDetails.filter(f => f.type === 'Intentional Foul');
      const p2GenericFouls = p2Details.foulDetails.filter(f => f.type === 'Foul');

      // Intentional foul should only appear once as 'Intentional Foul'
      expect(intFouls.length).toBe(1);
      // Regular foul should appear once
      expect(p2GenericFouls.length).toBe(1);
      // Total fouls for P2: 2 (intentional foul + regular foul)
      expect(p2Details.totalFouls).toBe(2);
    });
  });

  describe('Simulation 8: Large game - stress test with many turns', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('Pro1', 'Pro2', 100);

      // Simulate a long game with varied actions
      const actions = [
        // P1 run of 15
        ['Points', 3], ['Points', 4], ['Points', 5], ['Points', 3], ['Miss', 0],
        // P2 run of 8
        ['Points', 4], ['Points', 4], ['Miss', 0],
        // P1 fouls
        ['Foul', -1],
        // P2 safety
        ['Safety', 0],
        // P1 big run
        ['Points', 5], ['Points', 5], ['Points', 5], ['Points', 5], ['Points', 5], ['Points', 5],
        ['Finish Rack', 3], ['Points', 5], ['Points', 5], ['Miss', 0],
        // P2 scratch
        ['Scratch', -1],
        // P1 scores to 60
        ['Points', 10], ['Points', 10], ['Miss', 0],
        // P2 run
        ['Points', 10], ['Points', 10], ['Points', 10], ['Miss', 0],
        // P1 wins
        ['Points', 10], ['Points', 10], ['Points', 10], ['Points', 5],
      ];

      actions.forEach(([action, points]) => {
        if (!sim.winner) {
          sim.addTurn(action, points);
        }
      });

      results = sim.getResults();
    });

    test('game has a winner', () => {
      expect(results.winner).toBeTruthy();
      expect(results.winner.score).toBeGreaterThanOrEqual(100);
    });

    test('all turns recorded', () => {
      expect(results.innings.length).toBeGreaterThan(0);
      expect(results.innings.length).toBe(results.turnHistory.length);
    });

    test('stats are internally consistent', () => {
      [1, 2].forEach(playerNum => {
        const stats = playerNum === 1 ? results.player1Stats : results.player2Stats;
        const player = playerNum === 1 ? results.player1 : results.player2;

        // Total points should equal final score
        expect(stats.totalPoints).toBe(player.score);

        // bestRun should be max of runHistory
        if (stats.runHistory.length > 0) {
          expect(stats.bestRun).toBeGreaterThanOrEqual(Math.max(...stats.runHistory));
        }

        // All stat values should be non-negative integers (except avgPointsPerInning)
        expect(stats.safes).toBeGreaterThanOrEqual(0);
        expect(stats.misses).toBeGreaterThanOrEqual(0);
        expect(stats.fouls).toBeGreaterThanOrEqual(0);
        expect(stats.scratches).toBeGreaterThanOrEqual(0);
      });
    });

    test('innings data matches turnHistory data', () => {
      results.innings.forEach((inning, idx) => {
        const turn = results.turnHistory[idx];
        expect(inning.playerNumber).toBe(turn.playerNum);
        expect(inning.action).toBe(turn.action);
        expect(inning.points).toBe(turn.points);
        expect(inning.inning).toBe(turn.inning);
      });
    });
  });

  describe('Simulation 9: Verify History display counts match saved stats', () => {
    let sim, results;

    beforeAll(() => {
      sim = new GameSimulator('StatsP1', 'StatsP2', 18);

      // P1: Points(3)→3, stays P1
      sim.addTurn('Points', 3);
      // P1: Safety→3, switch→P2
      sim.addTurn('Safety', 0);
      // P2: Miss→0, inning++, switch→P1
      sim.addTurn('Miss', 0);
      // P1: Points(2)→5, stays P1
      sim.addTurn('Points', 2);
      // P1: Scratch→4, switch→P2
      sim.addTurn('Scratch', -1);
      // P2: Points(5)→5, stays P2
      sim.addTurn('Points', 5);
      // P2: Foul→4, inning++, switch→P1
      sim.addTurn('Foul', -1);
      // P1: BreakingFoul→2, switch→P2
      sim.addTurn('Breaking Foul', -2);
      // P2: Points(4)→8, stays P2
      sim.addTurn('Points', 4);
      // P2: Miss→8, inning++, switch→P1
      sim.addTurn('Miss', 0);
      // P1: Points(5)→7, stays P1
      sim.addTurn('Points', 5);
      // P1: Points(3)→10, stays P1
      sim.addTurn('Points', 3);
      // P1: Miss→10, switch→P2
      sim.addTurn('Miss', 0);
      // P2: Points(5)→13, stays P2
      sim.addTurn('Points', 5);
      // P2: Points(5)→18, wins!
      sim.addTurn('Points', 5);

      results = sim.getResults();
    });

    test('saved stats match what History page would display', () => {
      expect(results.winner.name).toBe('StatsP2');

      [1, 2].forEach(playerNum => {
        const savedStats = playerNum === 1 ? results.player1Stats : results.player2Stats;
        const player = playerNum === 1 ? results.player1 : results.player2;
        const displayStats = generateDetailedStats(
          results.innings, playerNum, savedStats, player.score, player.name, results.winner.name
        );

        // History display counts (from innings) should match saved stats (from turnHistory)
        expect(displayStats.totalSafes).toBe(savedStats.safes);
        expect(displayStats.totalMisses).toBe(savedStats.misses);
        expect(displayStats.totalScratches).toBe(savedStats.scratches);

        // Fouls: both calculatePlayerStats and generateDetailedStats now count
        // fouls separately from scratches, so they should match
        expect(displayStats.totalFouls).toBe(savedStats.fouls);
      });
    });
  });
});
