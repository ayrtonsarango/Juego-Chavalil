const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'all-8-minigames-e2e');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const MINIGAMES = [
  { id: 1, type: 'curve', name: 'Curvas Chavalil' },
  { id: 2, type: 'tank', name: 'Tank Trouble' },
  { id: 3, type: 'headsoccer', name: 'Cabezones Soccer' },
  { id: 4, type: 'bomberman', name: 'Chaval Bomberman' },
  { id: 5, type: 'haxball', name: 'HaxBall Chavalil' },
  { id: 6, type: 'race', name: 'Mario Kart (Micro Racers)' },
  { id: 7, type: 'brawler', name: 'Super Smash (Battlefield)' },
  { id: 8, type: 'opensmash', name: 'OpenSmash (Destino Final)' }
];

(async () => {
  console.log('🚀 Starting Automated Test for All 8 Minigames...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const hostErrors = [];
  const playerErrors = [];

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });

    hostPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore favicon or non-critical 404s if any
        if (!text.includes('favicon')) {
          hostErrors.push(text);
          console.error('[Host Error]:', text);
        }
      }
    });

    hostPage.on('pageerror', err => {
      hostErrors.push(err.message);
      console.error('[Host PageError]:', err.message);
    });

    const playerPage = await browser.newPage();
    await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    playerPage.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) {
          playerErrors.push(text);
          console.error('[Player Error]:', text);
        }
      }
    });

    playerPage.on('pageerror', err => {
      playerErrors.push(err.message);
      console.error('[Player PageError]:', err.message);
    });

    console.log('1️⃣ Loading Host and Mobile Player...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Reset lobby
    await hostPage.evaluate(() => {
      const resetBtn = document.getElementById('btn-admin-reset');
      if (resetBtn) resetBtn.click();
    });
    await sleep(1000);

    // Ready player
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await sleep(1000);

    // Dismiss any alert modal
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    const gameResults = [];

    for (const game of MINIGAMES) {
      console.log(`\n🎮 Testing Game ${game.id}: ${game.name} (${game.type})...`);
      const startHostErrors = hostErrors.length;
      const startPlayerErrors = playerErrors.length;

      // Launch minigame
      await hostPage.evaluate((gType) => {
        if (window.socket) {
          window.socket.emit('admin_launch_minigame', { gameType: gType });
        }
      }, game.type);

      await sleep(1500);

      // Verify canvas rendered
      const canvasInfo = await hostPage.evaluate(() => {
        const canvas = document.getElementById('minigame-canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          clientWidth: canvas.width,
          clientHeight: canvas.height,
          visible: rect.width > 0 && rect.height > 0
        };
      });

      // Verify player controls
      const playerControlInfo = await playerPage.evaluate((gType) => {
        const padMap = {
          'curve': 'pad-curve',
          'tank': 'pad-tank',
          'headsoccer': 'pad-headsoccer',
          'bomberman': 'pad-bomberman',
          'haxball': 'pad-haxball',
          'race': 'pad-race',
          'brawler': 'pad-smash',
          'opensmash': 'pad-smash'
        };
        const expectedPadId = padMap[gType];
        const el = document.getElementById(expectedPadId);
        const style = el ? window.getComputedStyle(el) : null;
        return {
          padId: expectedPadId,
          exists: !!el,
          display: style ? style.display : 'none'
        };
      });

      // Simulate inputs for 2 seconds
      await playerPage.evaluate((gType) => {
        if (window.socket) {
          window.socket.emit('player_input', {
            steer: 1,
            gas: true,
            shoot: true,
            jump: true,
            action: true,
            left: true
          });
        }
      }, game.type);
      await sleep(1000);

      await playerPage.evaluate((gType) => {
        if (window.socket) {
          window.socket.emit('player_input', {
            steer: -1,
            gas: false,
            shoot: false,
            jump: false,
            action: false,
            right: true
          });
        }
      }, game.type);
      await sleep(1000);

      // Capture screenshot
      const shotPath = path.join(OUT_DIR, `${game.id}_${game.type}.png`);
      await hostPage.screenshot({ path: shotPath });

      const newHostErrors = hostErrors.length - startHostErrors;
      const newPlayerErrors = playerErrors.length - startPlayerErrors;
      const passed = canvasInfo && canvasInfo.visible && newHostErrors === 0 && newPlayerErrors === 0;

      const res = {
        id: game.id,
        type: game.type,
        name: game.name,
        canvasVisible: canvasInfo?.visible || false,
        canvasSize: canvasInfo ? `${Math.round(canvasInfo.width)}x${Math.round(canvasInfo.height)}` : 'N/A',
        padDisplayed: playerControlInfo.display !== 'none',
        hostErrors: newHostErrors,
        playerErrors: newPlayerErrors,
        passed
      };

      gameResults.push(res);
      console.log(`  -> Canvas: ${res.canvasSize}, Pad '${playerControlInfo.padId}': ${playerControlInfo.display}`);
      console.log(`  -> Errors (Host: ${newHostErrors}, Player: ${newPlayerErrors}) - ${passed ? '✅ PASS' : '❌ FAIL'}`);
    }

    console.log('\n=======================================');
    console.log('📋 ALL 8 MINIGAMES TEST SUMMARY:');
    let allPassed = true;
    for (const r of gameResults) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.id}. ${r.name} (${r.type}) - Canvas: ${r.canvasSize}, HostErr: ${r.hostErrors}, PlayerErr: ${r.playerErrors}`);
      if (!r.passed) allPassed = false;
    }
    console.log(`Overall Status: ${allPassed ? '✅ ALL 8 MINIGAMES PASSED WITH 0 ERRORS' : '❌ SOME MINIGAMES FAILED'}`);
    console.log('=======================================\n');
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
})();
