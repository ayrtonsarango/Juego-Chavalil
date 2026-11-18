const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testCurvePacksAndAudio() {
  console.log('🚀 INICIANDO TEST: CURVAS CHAVALIL (PACKS EQUILIBRADOS, FFA Y AUDIO LOL)...');

  const localAudio = path.join(__dirname, '..', 'public', 'audio', 'lol_match_found.mp3');
  const dloadAudio = 'C:\\Users\\ayrton\\Downloads\\lol-match-found-7s.mp3';

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });

    const playerPage = await browser.newPage();
    await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log('1. Cargando TV Host y Smartphone Player...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 1000));

    // Mark player ready
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Dismiss android modal if open
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    // Add exactly 5 bots (1 human + 5 bots = 6 players)
    console.log('2. Añadiendo bots para alcanzar 6 jugadores (ejemplo del usuario: 3 y 3)...');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bot4 = btns.find(b => b.textContent.includes('+4 Bots'));
      if (bot4) bot4.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bot1 = btns.find(b => b.textContent.includes('+1 Bot'));
      if (bot1) bot1.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    // 3. Test CurveFeverEngine pack partitioning mathematical rules
    console.log('3. Comprobando partición matemática de packs parejos...');
    const partitionTests = await hostPage.evaluate(() => {
      const testCases = [
        { count: 6, expected: [3, 3] },
        { count: 7, expected: [4, 3] },
        { count: 8, expected: [4, 4] },
        { count: 5, expected: [3, 2] },
        { count: 4, expected: [4] }
      ];

      return testCases.map(tc => {
        const dummyPlayers = Array.from({ length: tc.count }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
        const packs = CurveFeverEngine.partitionIntoBalancedPacks(dummyPlayers, 4);
        const sizes = packs.map(p => p.length);
        const match = JSON.stringify(sizes) === JSON.stringify(tc.expected);
        return { count: tc.count, sizes, expected: tc.expected, match };
      });
    });

    console.log('Resultados de partición:', partitionTests);

    // Track playLolMatchFound
    await hostPage.evaluate(() => {
      window.__lolMatchFoundCalls = 0;
      const orig = soundEngine.playLolMatchFound.bind(soundEngine);
      soundEngine.playLolMatchFound = function(vol) {
        window.__lolMatchFoundCalls++;
        return orig(vol);
      };
    });

    // 4. Launch Curvas Chavalil
    console.log('4. Lanzando Curvas Chavalil en la TV...');
    await hostPage.evaluate(() => {
      const select = document.getElementById('select-arcade-minigame');
      if (select) {
        select.value = 'curve';
        select.dispatchEvent(new Event('change'));
      }
      const testBtn = document.getElementById('btn-admin-launch-arcade');
      if (testBtn) testBtn.click();
    });

    // Wait for level intro transition and minigame countdown to be active
    await new Promise(r => setTimeout(r, 4500));

    // Inspect live state of CurveFeverEngine
    const liveEngineState = await hostPage.evaluate(() => {
      const eng = window.activeMinigameEngine;
      if (!eng) return null;
      return {
        totalPlayers: eng.allPlayers.length,
        numPacks: eng.packs.length,
        packSizes: eng.packs.map(p => p.length),
        activePlayersCount: eng.activePlayers.length,
        activePlayerNames: eng.activePlayers.map(p => p.name),
        currentPhaseTitle: eng.phases[eng.currentPhaseIndex]?.title,
        maxRounds: eng.phases[eng.currentPhaseIndex]?.maxRounds,
        gameState: eng.gameState,
        lolCalls: window.__lolMatchFoundCalls
      };
    });

    console.log('Estado en vivo de CurveFeverEngine:', liveEngineState);

    // Take screenshot of Curvas Chavalil TV
    const tvShotPath = path.join(ARTIFACTS_DIR, '05_curvas_chavalil_balanced_packs_tv.png');
    await hostPage.screenshot({ path: tvShotPath });
    console.log('📸 Captura de TV guardada en:', tvShotPath);

    // Check player mobile UI
    const mobileStatus = await playerPage.evaluate(() => {
      const banner = document.getElementById('minigame-team-banner');
      const boxBench = document.getElementById('box-bench-spectator');
      const padCurve = document.getElementById('pad-curve');

      return {
        bannerText: banner ? banner.textContent.trim() : null,
        isBenchVisible: boxBench && window.getComputedStyle(boxBench).display !== 'none',
        isPadVisible: padCurve && window.getComputedStyle(padCurve).display !== 'none'
      };
    });

    console.log('Estado móvil:', mobileStatus);

    const mobileShotPath = path.join(ARTIFACTS_DIR, '06_curvas_chavalil_mobile_state.png');
    await playerPage.screenshot({ path: mobileShotPath });
    console.log('📸 Captura móvil guardada en:', mobileShotPath);

    console.log('\n=============================================');
    console.log('RESUMEN DE VERIFICACIÓN:');
    console.log('1. Partición 6 jugadores (3 y 3):', liveEngineState.packSizes.join(' y ') === '3 y 3' ? '✅ OK (3 y 3)' : '❌ FALLO');
    console.log('2. Partición 7 jugadores (4 y 3):', partitionTests.find(t => t.count === 7)?.match ? '✅ OK (4 y 3)' : '❌ FALLO');
    console.log('3. Modo FFA (3 jugadores activos en pista):', liveEngineState.activePlayersCount === 3 ? '✅ OK' : '❌ FALLO');
    console.log('4. LoL Match Found audio ejecutado:', liveEngineState.lolCalls > 0 ? '✅ OK' : '❌ FALLO');
    console.log('5. Audio 7s en Downloads:', fs.existsSync(dloadAudio) ? '✅ OK' : '❌ FALLO');
    console.log('=============================================\n');

  } catch (err) {
    console.error('ERROR EN TEST:', err);
  } finally {
    await browser.close();
  }
}

testCurvePacksAndAudio();
