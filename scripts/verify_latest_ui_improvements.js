const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function runVerification() {
  console.log('🚀 INICIANDO VERIFICACIÓN DE MEJORAS DE UI Y AUDIO...');

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

    await new Promise(r => setTimeout(r, 1500));

    // 2. Select Ayrton preset and add pet 'bembo' on player 1
    console.log('2. Configurando Player 1 (Ayrton + Mascota Bembo)...');
    await playerPage.evaluate(() => {
      // Find Ayrton preset button
      const chips = Array.from(document.querySelectorAll('.preset-chip-btn'));
      const ayrtonBtn = chips.find(b => b.textContent.includes('Ayrton'));
      if (ayrtonBtn) ayrtonBtn.click();

      // Click Mascota tab
      const tabs = Array.from(document.querySelectorAll('.tab-btn'));
      const petTab = tabs.find(t => t.getAttribute('data-tab') === 'pet');
      if (petTab) petTab.click();
    });

    await new Promise(r => setTimeout(r, 500));

    await playerPage.evaluate(() => {
      // Pick bembo pet
      const petBtns = Array.from(document.querySelectorAll('.pill-pet'));
      const bemboBtn = petBtns.find(b => b.textContent.includes('Bembo'));
      if (bemboBtn) bemboBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Check Player Mobile UI
    const mobileUI = await playerPage.evaluate(() => {
      const headerTitle = document.querySelector('.player-title');
      const previewAvatar = document.querySelector('.creator-avatar-preview svg.avatar-svg');
      const petBadge = document.querySelector('.preview-pet-wrap');
      const avatarBox = document.querySelector('.creator-avatar-preview');
      const boxRect = avatarBox ? avatarBox.getBoundingClientRect() : null;
      const avatarRect = previewAvatar ? previewAvatar.getBoundingClientRect() : null;

      // Check if avatar is horizontally centered inside the preview box
      const boxCenter = boxRect ? boxRect.left + boxRect.width / 2 : 0;
      const avatarCenter = avatarRect ? avatarRect.left + avatarRect.width / 2 : 0;
      const diffX = Math.abs(boxCenter - avatarCenter);

      return {
        hasMandoTitle: !!headerTitle,
        avatarWidth: previewAvatar ? previewAvatar.getAttribute('width') : null,
        avatarHeight: previewAvatar ? previewAvatar.getAttribute('height') : null,
        hasPetBadge: !!petBadge,
        avatarCenterDiff: diffX,
        boxRect
      };
    });

    console.log('Mobile UI Check:', mobileUI);

    // Take screenshot of mobile screen
    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, '01_mobile_creator_enlarged_avatar.png');
    await playerPage.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log('📸 Captura móvil guardada en:', mobileScreenshotPath);

    // Mark player ready
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Check TV Host UI
    const hostUI = await hostPage.evaluate(() => {
      const sectionTitle = document.querySelector('.tv-players-topbar h2');
      const playerCards = Array.from(document.querySelectorAll('.tv-player-card'));
      const results = [];

      playerCards.forEach(card => {
        const frame = card.querySelector('.tv-avatar-frame');
        const avatarSvg = frame ? frame.querySelector('svg.avatar-svg') : null;
        const petBadge = card.querySelector('.player-card-pet-badge');

        const frameRect = frame ? frame.getBoundingClientRect() : null;
        const avatarRect = avatarSvg ? avatarSvg.getBoundingClientRect() : null;

        const frameCenterX = frameRect ? frameRect.left + frameRect.width / 2 : 0;
        const frameCenterY = frameRect ? frameRect.top + frameRect.height / 2 : 0;
        const avatarCenterX = avatarRect ? avatarRect.left + avatarRect.width / 2 : 0;
        const avatarCenterY = avatarRect ? avatarRect.top + avatarRect.height / 2 : 0;

        const diffX = Math.abs(frameCenterX - avatarCenterX);
        const diffY = Math.abs(frameCenterY - avatarCenterY);

        results.push({
          playerName: card.querySelector('.tv-card-name')?.textContent,
          hasPetBadge: !!petBadge,
          diffX,
          diffY,
          isFrameOverflowHidden: frame ? window.getComputedStyle(frame).overflow : null
        });
      });

      return {
        sectionTitle: sectionTitle ? sectionTitle.textContent.trim() : null,
        playerCount: playerCards.length,
        cardResults: results
      };
    });

    console.log('Host TV UI Check:', hostUI);

    // Take screenshot of TV Lobby
    const hostScreenshotPath = path.join(ARTIFACTS_DIR, '02_tv_lobby_centered_player_with_pet.png');
    await hostPage.screenshot({ path: hostScreenshotPath });
    console.log('📸 Captura TV Host guardada en:', hostScreenshotPath);

    // Test Sound Engine for Yago
    const soundCheck = await hostPage.evaluate(() => {
      let warwickCalled = false;
      let lolMatchCalled = false;

      const origWarwick = soundEngine.playWarwick;
      const origLol = soundEngine.playLolMatchFound;

      soundEngine.playWarwick = function() { warwickCalled = true; };
      soundEngine.playLolMatchFound = function() { lolMatchCalled = true; };

      soundEngine.playCharacterTheme('yago');

      soundEngine.playWarwick = origWarwick;
      soundEngine.playLolMatchFound = origLol;

      return { warwickCalled, lolMatchCalled };
    });

    console.log('Sound Engine Check (Yago theme):', soundCheck);

    console.log('\n=============================================');
    console.log('RESULTADOS DE VERIFICACIÓN:');
    console.log('1. Audio Yago usa Warwick howl:', soundCheck.warwickCalled && !soundCheck.lolMatchCalled ? '✅ OK' : '❌ FALLO');
    console.log('2. Mando Chavalil eliminado:', !mobileUI.hasMandoTitle ? '✅ OK' : '❌ FALLO');
    console.log('3. Avatar móvil ampliado (165px):', mobileUI.avatarWidth === '165' ? '✅ OK' : '❌ FALLO');
    console.log('4. Avatar móvil centrado con mascota:', mobileUI.avatarCenterDiff < 5 ? `✅ OK (${mobileUI.avatarCenterDiff.toFixed(1)}px)` : '❌ DESPLAZADO');
    console.log('5. Título TV es "La Cuadrilla":', hostUI.sectionTitle === 'La Cuadrilla' ? '✅ OK' : '❌ FALLO');
    if (hostUI.cardResults.length > 0) {
      const p1 = hostUI.cardResults[0];
      console.log('6. Avatar TV centrado con mascota:', p1.diffX < 2 && p1.diffY < 2 ? `✅ OK (diffX: ${p1.diffX.toFixed(1)}px, diffY: ${p1.diffY.toFixed(1)}px)` : '❌ DESPLAZADO');
    }
    console.log('=============================================\n');

  } catch (err) {
    console.error('ERROR EN TEST:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
