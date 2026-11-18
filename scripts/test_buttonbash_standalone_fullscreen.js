const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'standalone-bash');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function testStandaloneFullscreen() {
  console.log('🚀 INICIANDO TEST: BUTTON BASH STANDALONE FULLSCREEN TAKEOVER...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const hostErrors = [];
  const playerErrors = [];

  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1920, height: 1080 });
  hostPage.on('console', msg => {
    if (msg.type() === 'error') hostErrors.push(msg.text());
  });
  hostPage.on('pageerror', err => hostErrors.push(err.toString()));

  const playerPage = await browser.newPage();
  await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  playerPage.on('console', msg => {
    if (msg.type() === 'error') playerErrors.push(msg.text());
  });
  playerPage.on('pageerror', err => playerErrors.push(err.toString()));

  try {
    console.log('1. Cargando TV Host y Smartphone Player...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });

    // Mark player ready
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Launch Button Bash directly
    console.log('2. Lanzando Button Bash en modo juego independiente a pantalla completa...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
    });
    await new Promise(r => setTimeout(r, 1200));

    // Verify standalone mode on Host
    const standaloneData = await hostPage.evaluate(() => {
      const isStandalone = document.body.classList.contains('standalone-game-active');
      const canvas = document.getElementById('minigame-canvas');
      const hud = document.getElementById('standalone-arcade-hud');
      const banner = document.querySelector('.minigame-header-banner');
      const teams = document.querySelector('.teams-grid');
      const footer = document.querySelector('.admin-footer');
      const rect = canvas ? canvas.getBoundingClientRect() : null;

      return {
        isStandalone,
        canvasRect: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
        hudVisible: hud && hud.style.display !== 'none',
        bannerVisible: banner ? window.getComputedStyle(banner).display : 'none',
        teamsVisible: teams ? window.getComputedStyle(teams).display : 'none',
        footerVisible: footer ? window.getComputedStyle(footer).display : 'none'
      };
    });

    console.log('   - Standalone activo en body:', standaloneData.isStandalone);
    console.log('   - Dimensiones del canvas en TV 1080p:', standaloneData.canvasRect);
    console.log('   - HUD flotante de arcade visible:', standaloneData.hudVisible);
    console.log('   - Banner superior encapsulador oculto:', standaloneData.bannerVisible === 'none');
    console.log('   - Grid de equipos encapsulador oculto:', standaloneData.teamsVisible === 'none');
    console.log('   - Footer de admin oculto:', standaloneData.footerVisible === 'none');

    // Screenshot 1: Intro Marquee
    await hostPage.screenshot({ path: path.join(OUT_DIR, '01_tv_standalone_intro_marquee.png') });
    console.log('📸 Capturada: 01_tv_standalone_intro_marquee.png');

    // Wait 2.5s for opening splash to fade out and tickers to be active
    await new Promise(r => setTimeout(r, 2600));
    await hostPage.screenshot({ path: path.join(OUT_DIR, '02_tv_standalone_active_board_1080p.png') });
    console.log('📸 Capturada: 02_tv_standalone_active_board_1080p.png');

    // Test 4K scaling
    console.log('3. Comprobando escala a 4K Ultra HD (3840x2160)...');
    await hostPage.setViewport({ width: 3840, height: 2160 });
    await new Promise(r => setTimeout(r, 800));
    const canvas4k = await hostPage.evaluate(() => {
      const c = document.getElementById('minigame-canvas');
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    console.log('   - Dimensiones del canvas en TV 4K:', canvas4k);
    await hostPage.screenshot({ path: path.join(OUT_DIR, '03_tv_standalone_active_board_4k.png') });
    console.log('📸 Capturada: 03_tv_standalone_active_board_4k.png');

    // Return to 1080p for gameplay interaction
    await hostPage.setViewport({ width: 1920, height: 1080 });
    await new Promise(r => setTimeout(r, 500));

    // Throw dart
    console.log('4. Disparando dardo desde el smartphone...');
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 600));
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });

    // Wait for tilted popups
    await new Promise(r => setTimeout(r, 2500));
    await hostPage.screenshot({ path: path.join(OUT_DIR, '04_tv_standalone_overlapping_popups.png') });
    console.log('📸 Capturada: 04_tv_standalone_overlapping_popups.png');

    // Wait for Blackout
    console.log('5. Esperando el apagón a pantalla completa...');
    await new Promise(r => setTimeout(r, 11000));
    await hostPage.screenshot({ path: path.join(OUT_DIR, '05_tv_standalone_blackout.png') });
    console.log('📸 Capturada: 05_tv_standalone_blackout.png');

    // Wait for Fake Ranking
    console.log('6. Esperando el fake ranking a pantalla completa...');
    await new Promise(r => setTimeout(r, 8000));
    await hostPage.screenshot({ path: path.join(OUT_DIR, '06_tv_standalone_fake_ranking.png') });
    console.log('📸 Capturada: 06_tv_standalone_fake_ranking.png');

    console.log('\n======================================================');
    console.log('📊 RESULTADOS AUDITORÍA STANDALONE FULLSCREEN:');
    console.log('   Host Errors:', hostErrors.length, hostErrors);
    console.log('   Player Errors:', playerErrors.length, playerErrors);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Error durante el test standalone:', err);
  } finally {
    await browser.close();
  }
}

testStandaloneFullscreen();
