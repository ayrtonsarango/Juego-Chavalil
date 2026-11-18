const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testScreenCleanupAndPad() {
  console.log('🚀 TEST SCREEN CLEANUP & HEAD SOCCER FULL-PAD...');

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

    console.log('1. Cargando TV Host y Player 1...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Player 1 ready
    await playerPage.evaluate(() => {
      const readyBtn = document.getElementById('btn-toggle-ready');
      if (readyBtn) readyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Player 2
    console.log('2. Conectando Player 2...');
    const player2Page = await browser.newPage();
    await player2Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await player2Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    await player2Page.evaluate(() => {
      const nextBtn = document.getElementById('btn-carousel-next');
      if (nextBtn) nextBtn.click();
      const readyBtn = document.getElementById('btn-toggle-ready');
      if (readyBtn) readyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Launch Head Soccer via Arcade selector
    console.log('3. Lanzando Head Soccer con el botón Probar Arcade...');
    await hostPage.evaluate(() => {
      const select = document.getElementById('select-arcade-minigame');
      if (select) {
        select.value = 'headsoccer';
        const event = new Event('change');
        select.dispatchEvent(event);
      }
      const launchBtn = document.getElementById('btn-admin-launch-arcade');
      if (launchBtn) launchBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 3: TV Host in Head Soccer
    await hostPage.screenshot({ path: path.join(ARTIFACTS_DIR, '26_tv_headsoccer_clean_hud.png') });
    console.log('📸 26_tv_headsoccer_clean_hud.png guardado');

    // Screenshot 4: Mobile Player in Head Soccer
    await playerPage.screenshot({ path: path.join(ARTIFACTS_DIR, '27_mobile_headsoccer_fullscreen_pad.png') });
    console.log('📸 27_mobile_headsoccer_fullscreen_pad.png guardado');

    // Also take screenshot of Player 2 (Red Team)
    await player2Page.screenshot({ path: path.join(ARTIFACTS_DIR, '28_mobile_headsoccer_player2_pad.png') });
    console.log('📸 28_mobile_headsoccer_player2_pad.png guardado');

  } catch (err) {
    console.error('❌ Error en test:', err);
  } finally {
    await browser.close();
  }
}

testScreenCleanupAndPad();
