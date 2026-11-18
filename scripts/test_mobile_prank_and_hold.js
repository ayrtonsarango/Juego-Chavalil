const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testMobilePrankAndHold() {
  console.log('🧪 INICIANDO TEST: J1 HOLD-TO-CONFIRM, FLOATING JOYSTICK & BUTTON BASH MOBILE PRANK...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const hostErrors = [];
  const playerErrors = [];

  const hostPage = await browser.newPage();
  hostPage.setViewport({ width: 1920, height: 1080 });
  hostPage.on('pageerror', err => hostErrors.push(err.toString()));
  hostPage.on('console', msg => {
    if (msg.type() === 'error') hostErrors.push(msg.text());
  });

  const playerPage = await browser.newPage();
  playerPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  playerPage.on('pageerror', err => playerErrors.push(err.toString()));
  playerPage.on('console', msg => {
    if (msg.type() === 'error') playerErrors.push(msg.text());
  });

  try {
    console.log('1. Navegando a Host (TV)...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    console.log('2. Conectando Jugador 1 (Ayrton)...');
    await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Player enters ready
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Admin starts game to go to Overworld Map
    console.log('3. Iniciando partida hacia el Mapa Overworld...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_start_game');
    });
    await new Promise(r => setTimeout(r, 1500));

    // Verify J1 Hold-to-confirm on Player
    console.log('4. Probando Hold-to-Confirm en botón J1 (750ms)...');
    const btnHold = await playerPage.$('#btn-j1-enter-level');
    if (btnHold) {
      const box = await btnHold.boundingBox();
      console.log('   - Pulsando sin llegar a 750ms (cancelación temprana)...');
      await playerPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await playerPage.mouse.down();
      await new Promise(r => setTimeout(r, 200));
      await playerPage.mouse.up();
      await new Promise(r => setTimeout(r, 300));

      const isStillInMap = await hostPage.evaluate(() => {
        const map = document.getElementById('screen-map');
        return map && map.classList.contains('active');
      });
      console.log('   - Cancelación temprana verificada (sigue en mapa):', isStillInMap);

      console.log('   - Manteniendo pulsado durante 800ms para confirmar entrada...');
      await playerPage.mouse.down();
      await new Promise(r => setTimeout(r, 850));
      await playerPage.mouse.up();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Now test Smash Floating Joystick
    console.log('5. Probando mando Super Smash y Floating Joystick...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_launch_minigame', { gameType: 'opensmash' });
    });
    await new Promise(r => setTimeout(r, 1500));

    const joyActive = await playerPage.evaluate(() => {
      const padSmash = document.getElementById('pad-smash');
      const base = document.getElementById('smash-floating-base');
      return Boolean(padSmash && base);
    });
    console.log('   - Floating joystick y pad Smash montados correctamente:', joyActive);

    // Now launch Button Bash to test Mobile Pranks
    console.log('6. Lanzando Button Bash (Diana HotBunnies) para validar broma interactiva en móvil...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
    });
    await new Promise(r => setTimeout(r, 2000));

    // Tap buzzer to trigger shot and start prank cascade
    console.log('7. Jugador pulsa el buzzer de Button Bash para fijar X e Y...');
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 600));
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    console.log('   - Dardo disparado hacia la diana de HotBunnies. Esperando cascada de bromas...');

    // Wait for Prank Stage A (Vista Error: triggered 1200ms after throw)
    await new Promise(r => setTimeout(r, 2200));
    const vistaState = await playerPage.evaluate(() => {
      const card = document.getElementById('prank-step-vista');
      return card ? card.style.display : null;
    });
    console.log('   - [Broma Móvil A] Popup Windows Vista visible en smartphone:', vistaState === 'block');
    await playerPage.screenshot({ path: 'design/test-results/mobile_prank_vista.png' });

    // Click "Cerrar aviso" on mobile -> should open Gangbang Ramen
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-prank-close-vista');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const ramenState = await playerPage.evaluate(() => {
      const card = document.getElementById('prank-step-ramen');
      return card ? card.style.display : null;
    });
    console.log('   - [Broma Móvil A2] Oferta GangBang Ramen visible en smartphone:', ramenState === 'block');
    await playerPage.screenshot({ path: 'design/test-results/mobile_prank_ramen.png' });

    // Click "No, gracias" -> should show "Mamá de dos gatos"
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-ramen-no');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const catsGuiltVisible = await playerPage.evaluate(() => {
      const s2 = document.getElementById('ramen-msg-stage2');
      return s2 && s2.style.display === 'block';
    });
    console.log('   - [Broma Móvil A3] Chantaje emocional gatos visible en smartphone:', catsGuiltVisible);
    await playerPage.screenshot({ path: 'design/test-results/mobile_prank_cats.png' });

    // Click "Vale, voy" -> should open Captcha
    await playerPage.evaluate(() => {
      const btn = document.getElementById('btn-ramen-force-1');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const captchaVisible = await playerPage.evaluate(() => {
      const card = document.getElementById('prank-step-captcha');
      return card && card.style.display === 'block';
    });
    console.log('   - [Broma Móvil C2] Captcha Kalimotxo Don Simón visible:', captchaVisible);
    await playerPage.screenshot({ path: 'design/test-results/mobile_prank_captcha.png' });

    // Wait for Blackout (Stage D: 12.5s from throw)
    console.log('8. Esperando el Apagón de 7s en TV y Móvil...');
    await new Promise(r => setTimeout(r, 12500));

    const blackoutState = await playerPage.evaluate(() => {
      const bScreen = document.getElementById('bash-blackout-fullscreen');
      return bScreen ? bScreen.style.display : null;
    });
    console.log('   - [Broma Móvil D] Pantalla en negro total con CRT scanlines activa:', blackoutState === 'flex');

    // Capture screenshots
    await playerPage.screenshot({ path: 'design/test-results/mobile_prank_blackout.png' });
    await hostPage.screenshot({ path: 'design/test-results/tv_prank_blackout.png' });

    // Wait for Fake Ranking (8.5s after blackout starts)
    console.log('9. Esperando el Fake Ranking de Tracasa...');
    await new Promise(r => setTimeout(r, 8500));

    const fakeRankingState = await playerPage.evaluate(() => {
      const fScreen = document.getElementById('bash-fake-ranking-mobile');
      return fScreen ? fScreen.style.display : null;
    });
    console.log('   - [Broma Móvil Ranking] Coronación de alvarito.tracasa.lover.69 en móvil:', fakeRankingState === 'flex');

    await playerPage.screenshot({ path: 'design/test-results/mobile_fake_ranking.png' });
    await hostPage.screenshot({ path: 'design/test-results/tv_fake_ranking.png' });

    await playerPage.screenshot({ path: 'design/test-results/mobile_fake_ranking.png' });
    await hostPage.screenshot({ path: 'design/test-results/tv_fake_ranking.png' });

    console.log('\n======================================================');
    console.log('📊 AUDITORÍA DE ERRORES DE CONSOLA:');
    console.log('   Host Errors:', hostErrors.length, hostErrors);
    console.log('   Player Errors:', playerErrors.length, playerErrors);
    console.log('======================================================\n');

    if (hostErrors.length === 0 && playerErrors.length === 0) {
      console.log('🎉 ¡TEST COMPLETADO CON ÉXITO! 0 ERRORES DE CONSOLA.');
    } else {
      console.error('❌ Se encontraron errores durante la prueba.');
    }

  } catch (err) {
    console.error('Error durante la ejecución del test:', err);
  } finally {
    await browser.close();
  }
}

testMobilePrankAndHold();
