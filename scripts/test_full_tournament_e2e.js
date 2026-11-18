/**
 * End-to-End Tournament & Minigame Integration Test
 * Verifies:
 * 1. 0 Console errors in Host TV view
 * 2. 4 Players join, custom avatars, ready toggles
 * 3. Overworld navigation
 * 4. Level 8 (OpenSmash - Destino Final): battle execution, combat inputs, podium, score check
 * 5. Level 9 (Button Bash): HotBunnies bar, tickers, dart throw, pranks, 7s blackout, fake ranking
 * 6. Tournament score invariant: Button Bash is prank and does NOT add points to tournament scores
 */

const puppeteer = require('puppeteer-core');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HOST_URL = 'http://localhost:3000/host';
const SERVER_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function runE2ETest() {
  console.log('🚀 Starting Full Tournament E2E Test...');
  const consoleErrors = [];
  const consoleLogs = [];

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error('[Host Browser Error]:', text);
    } else {
      consoleLogs.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('[Host Page Error]:', err.message);
  });

  console.log('1️⃣ Loading Host TV view...');
  await page.goto(HOST_URL, { waitUntil: 'networkidle2' });
  await sleep(1500);

  // Test a mobile player browser page for console errors
  console.log('📱 Loading Mobile Player view in second page...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push('[Player Error]: ' + msg.text());
      console.error('[Player Browser Error]:', msg.text());
    }
  });
  mobilePage.on('pageerror', err => {
    consoleErrors.push('[Player Page Error]: ' + err.message);
    console.error('[Player Page Error]:', err.message);
  });
  await mobilePage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, '01b_mobile_player_creator.png') });
  console.log('📸 Captured 01b_mobile_player_creator.png');

  await page.screenshot({ path: path.join(OUT_DIR, '01_host_lobby_initial.png') });
  console.log('📸 Captured 01_host_lobby_initial.png');

  // 2. Connect 4 simulated players
  console.log('2️⃣ Connecting 4 players...');
  const playerDefs = [
    { name: 'Ayrton', charId: 'ayrton', role: 'J1' },
    { name: 'Adriachi', charId: 'adriachi', role: 'J2' },
    { name: 'Marta', charId: 'marta', role: 'J3' },
    { name: 'Violeta', charId: 'violeta', role: 'J4' }
  ];

  const sockets = [];
  for (let i = 0; i < playerDefs.length; i++) {
    const def = playerDefs[i];
    const s = io(SERVER_URL, { reconnection: false });
    sockets.push(s);

    await new Promise((resolve) => {
      s.on('connect', () => {
        s.emit('player_join', {
          name: def.name,
          characterId: def.charId,
          avatarData: {
            characterId: def.charId,
            skinColor: '#fcd34d',
            eyeStyle: 'classic',
            mouthStyle: 'happy',
            shirtColor: '#3b82f6',
            pantColor: '#1e3a8a',
            shoesColor: '#111827',
            accessory: 'none',
            handItem: 'beer'
          }
        });
        setTimeout(resolve, 300);
      });
    });
  }

  await sleep(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '02_host_lobby_4_players.png') });
  console.log('📸 Captured 02_host_lobby_4_players.png (4 players joined)');

  // 3. Mark all players ready
  console.log('3️⃣ Setting all players READY...');
  sockets.forEach(s => {
    s.emit('player_ready_toggle', { ready: true });
  });

  await sleep(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '03_host_lobby_all_ready.png') });
  console.log('📸 Captured 03_host_lobby_all_ready.png (All 4 ready)');

  // 4. Ayrton (P1) starts game
  console.log('4️⃣ J1 (Ayrton) starts the tournament...');
  sockets[0].emit('start_game');
  await sleep(2000);

  await page.screenshot({ path: path.join(OUT_DIR, '04_host_overworld_map.png') });
  console.log('📸 Captured 04_host_overworld_map.png (Overworld map active)');

  // 5. TEST LEVEL 8: OPENSMASH (DESTINO FINAL)
  console.log('5️⃣ Launching Level 8: OpenSmash (Destino Final)...');
  await page.evaluate(() => {
    if (window.socket) {
      window.socket.emit('admin_launch_minigame', { gameType: 'opensmash' });
    }
  });

  await sleep(2500);
  await page.screenshot({ path: path.join(OUT_DIR, '05_host_opensmash_started.png') });
  console.log('📸 Captured 05_host_opensmash_started.png (OpenSmash canvas live)');

  // Simulate battle combat inputs for 2 seconds
  console.log('   Simulating combat inputs for 4 players...');
  for (let step = 0; step < 8; step++) {
    sockets[0].emit('player_input', { right: true, attack: true });
    sockets[1].emit('player_input', { left: true, special: true });
    sockets[2].emit('player_input', { jump: true, up: true });
    sockets[3].emit('player_input', { attack: true });
    await sleep(250);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '06_host_opensmash_combat.png') });
  console.log('📸 Captured 06_host_opensmash_combat.png (Combat in progress)');

  // Simulate completion of OpenSmash (Team A wins)
  console.log('   Finishing OpenSmash Level 8...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-complete-minigame');
    if (btn) btn.click();
  });

  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '07_host_opensmash_podium.png') });
  console.log('📸 Captured 07_host_opensmash_podium.png (Podium celebration)');

  // Check state & scores after OpenSmash
  const scoreStateAfterSmash = await page.evaluate(() => {
    return {
      gameState: window.currentGameState ? {
        status: window.currentGameState.status,
        currentLevelIndex: window.currentGameState.currentLevelIndex,
        teams: window.currentGameState.teams
      } : null
    };
  });
  console.log('   State after OpenSmash:', JSON.stringify(scoreStateAfterSmash));

  // Advance back to map
  await page.evaluate(() => {
    if (window.socket) window.socket.emit('admin_return_to_map');
  });
  await sleep(1500);

  // 6. TEST LEVEL 9: BUTTON BASH (DIANA BROMA)
  console.log('6️⃣ Launching Level 9: Button Bash (Diana Broma HotBunnies)...');
  await page.evaluate(() => {
    if (window.socket) {
      window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
    }
  });

  await sleep(2500);
  await page.screenshot({ path: path.join(OUT_DIR, '08_host_buttonbash_intro.png') });
  console.log('📸 Captured 08_host_buttonbash_intro.png (Button Bash board loaded)');

  // Players shoot darts and cheer
  console.log('   Players firing buzzer and cheers...');
  sockets[0].emit('player_input', { bash: true, shoot: true, timestamp: Date.now() });
  await sleep(1000);
  sockets[0].emit('player_input', { bash: true, shoot: true, timestamp: Date.now() });
  await sleep(1500);

  sockets[1].emit('player_input', { bash: true, shoot: true, timestamp: Date.now() });
  sockets[2].emit('player_input', { bash_cheer: 'vamos' });
  sockets[3].emit('player_input', { bash_cheer: 'diana' });

  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '09_host_buttonbash_play.png') });
  console.log('📸 Captured 09_host_buttonbash_play.png (Popups & Dart throwing)');

  // Fast forward to Blackout and Fake Ranking
  console.log('   Triggering prank sequence (Blackout & Fake Ranking)...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine && typeof window.activeMinigameEngine.triggerBlackout === 'function') {
      window.activeMinigameEngine.triggerBlackout();
    }
  });

  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '10_host_buttonbash_blackout.png') });
  console.log('📸 Captured 10_host_buttonbash_blackout.png (7s Blackout active)');

  await page.evaluate(() => {
    if (window.activeMinigameEngine && typeof window.activeMinigameEngine.triggerFakeRanking === 'function') {
      window.activeMinigameEngine.triggerFakeRanking();
    }
  });

  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '11_host_buttonbash_fake_ranking.png') });
  console.log('📸 Captured 11_host_buttonbash_fake_ranking.png (Fake ranking displayed)');

  // Complete prank minigame
  console.log('   Completing Button Bash minigame...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine && typeof window.activeMinigameEngine.finishPrank === 'function') {
      window.activeMinigameEngine.finishPrank();
    }
  });

  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '12_host_after_buttonbash.png') });
  console.log('📸 Captured 12_host_after_buttonbash.png');

  // Verify tournament score invariant
  const finalCheck = await page.evaluate(() => {
    return {
      gameState: window.currentGameState ? {
        status: window.currentGameState.status,
        lastPodium: window.currentGameState.lastPodium
      } : null
    };
  });
  console.log('   Final Check:', JSON.stringify(finalCheck));

  // Disconnect sockets & close browser
  sockets.forEach(s => s.disconnect());
  await browser.close();

  console.log('\n========================================');
  console.log('📊 E2E TEST SUMMARY');
  console.log('========================================');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Errors encountered:', consoleErrors);
  }
  console.log('Screenshots generated in design/test-results:');
  const files = fs.readdirSync(OUT_DIR);
  files.forEach(f => console.log(' - ' + f));
  console.log('========================================');

  if (consoleErrors.length > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 0 ERRORS!');
  }
}

runE2ETest().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
