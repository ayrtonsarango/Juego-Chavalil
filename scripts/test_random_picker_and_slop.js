const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testRandomPickerAndSlop() {
  console.log('🚀 TEST RANDOM PICKER & ANTI-SLOP VERIFICATION...');

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

    console.log('1. Cargando TV Host y Player...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Screenshot 1: TV Host Lobby Empty State
    await hostPage.screenshot({ path: path.join(ARTIFACTS_DIR, '31_tv_host_lobby_clean_empty_state.png') });
    console.log('📸 31_tv_host_lobby_clean_empty_state.png guardado');

    // 2. Click Quick Random Dice Button
    console.log('2. Pulsando botón 🎲 Aleatorio en el móvil...');
    await playerPage.evaluate(() => {
      const diceBtn = document.getElementById('btn-quick-random');
      if (diceBtn) diceBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 2: Mobile Player in Aleatorio
    await playerPage.screenshot({ path: path.join(ARTIFACTS_DIR, '29_mobile_carousel_random_initial.png') });
    console.log('📸 29_mobile_carousel_random_initial.png guardado');

    // 3. Click "Generar aleatorio" button to re-roll
    console.log('3. Pulsando "🎲 Generar aleatorio" para re-roll...');
    const prevSvg = await playerPage.evaluate(() => {
      const preview = document.querySelector('.creator-avatar-preview');
      return preview ? preview.innerHTML : '';
    });

    await playerPage.evaluate(() => {
      const rerollBtn = document.querySelector('.random-reroll-pill');
      if (rerollBtn) rerollBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const newSvg = await playerPage.evaluate(() => {
      const preview = document.querySelector('.creator-avatar-preview');
      return preview ? preview.innerHTML : '';
    });

    console.log('Avatar cambiado con éxito:', prevSvg !== newSvg);

    // Screenshot 3: Mobile Player after Re-roll
    await playerPage.screenshot({ path: path.join(ARTIFACTS_DIR, '30_mobile_carousel_random_rerolled.png') });
    console.log('📸 30_mobile_carousel_random_rerolled.png guardado');

    // 4. Test ready and verify TV updates
    console.log('4. Marcando Listo...');
    await playerPage.evaluate(() => {
      const readyBtn = document.getElementById('btn-toggle-ready');
      if (readyBtn) readyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await hostPage.screenshot({ path: path.join(ARTIFACTS_DIR, '32_tv_host_lobby_1_ready_clean.png') });
    console.log('📸 32_tv_host_lobby_1_ready_clean.png guardado');

    const evalData = await playerPage.evaluate(() => {
      const title = document.getElementById('champion-name-title');
      const rerollBtn = document.querySelector('.random-reroll-pill');
      const gamertag = document.getElementById('input-player-name');
      return {
        title: title ? title.textContent : '',
        hasRerollBtn: !!rerollBtn,
        rerollText: rerollBtn ? rerollBtn.textContent.trim() : '',
        gamertag: gamertag ? gamertag.value : ''
      };
    });

    console.log('📊 EVALUACIÓN RANDOM PICKER:', JSON.stringify(evalData, null, 2));

  } catch (err) {
    console.error('❌ Error en test:', err);
  } finally {
    await browser.close();
  }
}

testRandomPickerAndSlop();
