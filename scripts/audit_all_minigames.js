const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'all-games-audit');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const GAMES = [
  { id: 1, type: 'curve', name: 'Curvas Chavalil' },
  { id: 2, type: 'tank', name: 'Tank Trouble' },
  { id: 3, type: 'headsoccer', name: 'Cabezones Soccer' },
  { id: 4, type: 'bomberman', name: 'Chaval Bomberman' },
  { id: 5, type: 'haxball', name: 'HaxBall Chavalil' },
  { id: 6, type: 'race', name: 'Mario Kart' },
  { id: 7, type: 'brawler', name: 'Super Smash (Battlefield)' },
  { id: 8, type: 'opensmash', name: 'OpenSmash (Destino Final)' }
];

async function auditAllGames() {
  console.log('🔍 AUDITANDO EL RESTO DE MINIJUEGOS (1 AL 8)...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1920, height: 1080 });

  const playerPage = await browser.newPage();
  await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
  await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });

  // Ready player
  await playerPage.evaluate(() => {
    const btn = document.getElementById('btn-toggle-ready');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const gameReports = [];

  for (const game of GAMES) {
    console.log(`\n🎮 Probando minijuego ${game.id}: ${game.name} (${game.type})...`);

    // Launch minigame
    await hostPage.evaluate((gType) => {
      window.socket.emit('admin_launch_minigame', { gameType: gType });
    }, game.type);
    await new Promise(r => setTimeout(r, 1200));

    // Get metrics from Host
    const metrics = await hostPage.evaluate(() => {
      const canvas = document.getElementById('minigame-canvas');
      const container = document.querySelector('.minigame-canvas-container');
      const teams = document.querySelector('.teams-grid');
      const banner = document.querySelector('.minigame-header-banner');
      const footer = document.querySelector('.admin-footer');
      const cRect = canvas ? canvas.getBoundingClientRect() : null;
      return {
        canvasWidth: cRect ? Math.round(cRect.width) : 0,
        canvasHeight: cRect ? Math.round(cRect.height) : 0,
        containerStyle: container ? window.getComputedStyle(container).maxWidth : 'none',
        hasTeamsGridVisible: teams ? window.getComputedStyle(teams).display !== 'none' : false,
        hasBannerVisible: banner ? window.getComputedStyle(banner).display !== 'none' : false,
        hasFooterVisible: footer ? window.getComputedStyle(footer).display !== 'none' : false
      };
    });

    // Capture TV screenshot
    const hostPath = path.join(OUT_DIR, `${game.id}_tv_${game.type}.png`);
    await hostPage.screenshot({ path: hostPath });

    // Capture Player Mobile screenshot (portrait)
    const playerPath = path.join(OUT_DIR, `${game.id}_mobile_portrait_${game.type}.png`);
    await playerPage.screenshot({ path: playerPath });

    // Switch to landscape for 2-thumb games
    await playerPage.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 300));
    const playerLandscapePath = path.join(OUT_DIR, `${game.id}_mobile_landscape_${game.type}.png`);
    await playerPage.screenshot({ path: playerLandscapePath });
    await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    gameReports.push({
      ...game,
      metrics,
      screenshots: {
        tv: hostPath,
        mobilePortrait: playerPath,
        mobileLandscape: playerLandscapePath
      }
    });

    console.log(`   - Canvas en TV: ${metrics.canvasWidth}x${metrics.canvasHeight} (Banner visible: ${metrics.hasBannerVisible}, Equipos debajo: ${metrics.hasTeamsGridVisible})`);
  }

  await browser.close();

  console.log('\n📊 AUDITORÍA COMPLETADA. RESUMEN:');
  console.log(JSON.stringify(gameReports, null, 2));
}

auditAllGames();
