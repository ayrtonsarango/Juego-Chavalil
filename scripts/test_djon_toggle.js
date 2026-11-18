const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testDjonToggle() {
  console.log('🚀 INICIANDO TEST: TOGGLE DE DJON EN EL CREADOR DE AVATARES...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });

    // Reset game to lobby
    await hostPage.evaluate(() => {
      const resetBtn = document.getElementById('btn-admin-reset');
      if (resetBtn) resetBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const playerPage = await browser.newPage();
    await playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Select DJon preset
    console.log('1. Seleccionando preset DJon...');
    await playerPage.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.preset-chip-btn'));
      const djonBtn = chips.find(b => b.textContent.includes('DJon'));
      if (djonBtn) djonBtn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Check state with toggle ON
    const stateOn = await playerPage.evaluate(() => {
      const btn = document.querySelector('.specific-toggles-row .toggle-pill');
      const preview = document.querySelector('.creator-avatar-preview');
      const hasHeadset = !!preview.querySelector('rect[fill="#10b981"]');
      const hasShades = !!preview.querySelector('rect[fill="#000000"]');
      const hasNormalEyes = !!preview.querySelector('ellipse[rx="9"][ry="12"]');

      return {
        toggleLabel: btn ? btn.textContent.trim() : null,
        isToggleActive: btn ? btn.classList.contains('active') : false,
        hasHeadset,
        hasShades,
        hasNormalEyes
      };
    });

    console.log('Estado DJon (ON):', stateOn);

    const shotOnPath = path.join(ARTIFACTS_DIR, '07_djon_with_headset_and_shades.png');
    await playerPage.screenshot({ path: shotOnPath });
    console.log('📸 Captura DJon (ON) guardada en:', shotOnPath);

    // 2. Click toggle button to turn OFF
    console.log('2. Pulsando toggle para quitar cascos y gafas...');
    await playerPage.evaluate(() => {
      const btn = document.querySelector('.specific-toggles-row .toggle-pill');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 800));

    // Check state with toggle OFF
    const stateOff = await playerPage.evaluate(() => {
      const btn = document.querySelector('.specific-toggles-row .toggle-pill');
      const preview = document.querySelector('.creator-avatar-preview');
      const hasHeadset = !!preview.querySelector('rect[fill="#10b981"]');
      const hasShades = !!preview.querySelector('rect[fill="#000000"]');
      const hasNormalEyes = !!preview.querySelector('ellipse[rx="9"][ry="12"]');

      return {
        toggleLabel: btn ? btn.textContent.trim() : null,
        isToggleActive: btn ? btn.classList.contains('active') : false,
        hasHeadset,
        hasShades,
        hasNormalEyes
      };
    });

    console.log('Estado DJon (OFF - solo ojos y pelo marrón hacia arriba):', stateOff);

    const shotOffPath = path.join(ARTIFACTS_DIR, '08_djon_solo_ojos_pelo_marron.png');
    await playerPage.screenshot({ path: shotOffPath });
    console.log('📸 Captura DJon (OFF) guardada en:', shotOffPath);

    console.log('\n=============================================');
    console.log('RESUMEN DE VERIFICACIÓN:');
    console.log('1. Toggle ON tiene cascos y gafas:', stateOn.hasHeadset && stateOn.hasShades && !stateOn.hasNormalEyes ? '✅ OK' : '❌ FALLO');
    console.log('2. Toggle OFF quita cascos y gafas:', !stateOff.hasHeadset && !stateOff.hasShades ? '✅ OK' : '❌ FALLO');
    console.log('3. Toggle OFF muestra solo ojos normales:', stateOff.hasNormalEyes ? '✅ OK' : '❌ FALLO');
    console.log('=============================================\n');

  } catch (err) {
    console.error('ERROR EN TEST:', err);
  } finally {
    await browser.close();
  }
}

testDjonToggle();
