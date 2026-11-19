/**
 * Swarm Verification Script: Minigame Scoring & Ranking Audit
 */
const assert = require('assert');

console.log('🧪 Starting Minigame Scoring & Ranking Verification Test...');

// 1. Point Tables Verification
const RANK_POINTS_RACE = [100, 75, 50, 35, 20];
const getRacePoints = (rank) => (rank >= 1 && rank <= RANK_POINTS_RACE.length ? RANK_POINTS_RACE[rank - 1] : 15);

assert.strictEqual(getRacePoints(1), 100, '1st place should be 100 pts');
assert.strictEqual(getRacePoints(2), 75, '2nd place should be 75 pts');
assert.strictEqual(getRacePoints(3), 50, '3rd place should be 50 pts');
assert.strictEqual(getRacePoints(4), 35, '4th place should be 35 pts');
assert.strictEqual(getRacePoints(5), 20, '5th place should be 20 pts');
assert.strictEqual(getRacePoints(6), 15, '6th place should be 15 pts');
assert.strictEqual(getRacePoints(9), 15, '9th place should be 15 pts');
console.log('✅ Race Point Ladder verified: 100, 75, 50, 35, 20, 15');

// 2. Server Debounce Guard Verification
console.log('🧪 Testing Server Debouncing / Guard logic...');

let testGameState = {
  status: 'minigame',
  currentLevelIndex: 6, // e.g. Super Smash
  levels: [
    { id: 1, title: 'Level 1' },
    { id: 2, title: 'Level 2' },
    { id: 3, title: 'Level 3' },
    { id: 4, title: 'Level 4' },
    { id: 5, title: 'Level 5' },
    { id: 6, title: 'Level 6' },
    { id: 7, title: 'Level 7' }
  ]
};

let lastCompletedLevelIndex = -1;
let lastMinigameCompleteTime = 0;
let completeEventProcessedCount = 0;
const testPlayers = new Map([
  ['p1', { id: 'p1', score: 0 }],
  ['p2', { id: 'p2', score: 0 }]
]);

function simulateServerMinigameComplete(data) {
  const now = Date.now();
  if (testGameState.status === 'podium') {
    return { status: 'rejected', reason: 'already_podium' };
  }

  const currentIdx = testGameState.currentLevelIndex;
  if (lastCompletedLevelIndex === currentIdx && (now - lastMinigameCompleteTime < 3000)) {
    return { status: 'rejected', reason: 'debounced_duplicate' };
  }

  lastCompletedLevelIndex = currentIdx;
  lastMinigameCompleteTime = now;
  completeEventProcessedCount++;

  // Award points
  if (!data?.isPrank && Array.isArray(data?.players)) {
    data.players.forEach(s => {
      const p = testPlayers.get(s.id);
      if (p && typeof s.score === 'number' && !isNaN(s.score)) {
        p.score += Math.round(s.score);
      }
    });
  }

  testGameState.status = 'podium';
  return { status: 'accepted' };
}

// First event should be accepted
const res1 = simulateServerMinigameComplete({
  winningTeam: 'teamA',
  players: [
    { id: 'p1', score: 100 },
    { id: 'p2', score: 25 }
  ]
});
assert.strictEqual(res1.status, 'accepted', 'First minigame_complete should be accepted');
assert.strictEqual(testPlayers.get('p1').score, 100);
assert.strictEqual(testPlayers.get('p2').score, 25);
assert.strictEqual(completeEventProcessedCount, 1);

// Immediate duplicate while in podium should be rejected
const res2 = simulateServerMinigameComplete({
  winningTeam: 'teamA',
  players: [
    { id: 'p1', score: 100 },
    { id: 'p2', score: 25 }
  ]
});
assert.strictEqual(res2.status, 'rejected');
assert.strictEqual(res2.reason, 'already_podium');
assert.strictEqual(testPlayers.get('p1').score, 100, 'Score should not increase');
assert.strictEqual(completeEventProcessedCount, 1);

// If room leaves podium to map and another duplicate arrives immediately for same level index
testGameState.status = 'map';
const res3 = simulateServerMinigameComplete({
  winningTeam: 'teamA',
  players: [
    { id: 'p1', score: 100 },
    { id: 'p2', score: 25 }
  ]
});
assert.strictEqual(res3.status, 'rejected');
assert.strictEqual(res3.reason, 'debounced_duplicate');
assert.strictEqual(testPlayers.get('p1').score, 100, 'Score should not increase on debounced event');
assert.strictEqual(completeEventProcessedCount, 1);
console.log('✅ Server Guard & Debouncing logic verified!');

// 3. Button Bash Prank Check
testGameState.status = 'minigame';
lastCompletedLevelIndex = -1; // reset for new minigame
const resPrank = simulateServerMinigameComplete({
  isPrank: true,
  players: [
    { id: 'p1', score: 999999999 },
    { id: 'p2', score: 999999999 }
  ]
});
assert.strictEqual(resPrank.status, 'accepted');
assert.strictEqual(testPlayers.get('p1').score, 100, 'Prank score MUST NOT be added to leaderboard!');
assert.strictEqual(testPlayers.get('p2').score, 25, 'Prank score MUST NOT be added to leaderboard!');
console.log('✅ Prank minigame score safety verified!');

// 4. NaN / Undefined Guard Verification
testGameState.status = 'minigame';
lastCompletedLevelIndex = -1;
const resNaN = simulateServerMinigameComplete({
  isPrank: false,
  players: [
    { id: 'p1', score: NaN },
    { id: 'p2', score: undefined }
  ]
});
assert.strictEqual(resNaN.status, 'accepted');
assert.strictEqual(isNaN(testPlayers.get('p1').score), false, 'Score must not become NaN');
assert.strictEqual(testPlayers.get('p1').score, 100);
assert.strictEqual(testPlayers.get('p2').score, 25);
console.log('✅ NaN / Undefined immunity verified!');

console.log('\n🎉 ALL MINIGAME AUDIT VERIFICATION CHECKS PASSED SUCCESSFULLY!');
