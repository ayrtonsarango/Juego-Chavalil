const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:/Users/ayrton/.gemini/antigravity/brain/1005e3a0-445a-4cb3-ae0d-45ee92ec56b8';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('🚀 INICIANDO AUDITORÍA INTEGRAL: COCHES CHAVALIL Y DIANA DE DARDOS REVAMPED');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080'
    ]
  });

  const hostErrors = [];
  const p1Errors = [];

  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1920, height: 1080 });
  hostPage.on('console', m => { if (m.type() === 'error') hostErrors.push(m.text()); });
  hostPage.on('pageerror', e => hostErrors.push(e.message));

  const p1 = await browser.newPage();
  await p1.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p1.on('console', m => { if (m.type() === 'error') p1Errors.push(m.text()); });
  p1.on('pageerror', e => p1Errors.push(e.message));

  const p2 = await browser.newPage();
  await p2.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  try {
    console.log('1️⃣ Conectando Host y 2 Chavales...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await p1.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await p2.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Marcar listos
    await p1.evaluate(() => document.getElementById('btn-toggle-ready')?.click());
    await p2.evaluate(() => {
      document.getElementById('btn-champ-next')?.click();
      document.getElementById('btn-toggle-ready')?.click();
    });
    await sleep(1200);

    // ==========================================
    // PARTE 1: VERIFICAR COCHES CHAVALIL (RACE)
    // ==========================================
    console.log('2️⃣ Lanzando Coches Chavalil (Micro Racers) con el nuevo circuito técnico...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_launch_minigame', { gameType: 'race' });
    });
    await hostPage.bringToFront();
    await sleep(1500);

    // Screenshot 1: Parrilla de salida con el nuevo circuito
    const gridShot = path.join(ARTIFACT_DIR, '01_coches_chavalil_parrilla.png');
    await hostPage.screenshot({ path: gridShot });
    console.log('   📸 Capturada parrilla de salida:', gridShot);

    // Esperar fin del semáforo (countdown es 3.6s, esperamos 4.0s para bandera verde)
    console.log('3️⃣ Esperando luz verde (¡GAS!) y acelerando a fondo...');
    await sleep(4000);

    // Enviar gas a fondo y giros dinámicos
    await p1.evaluate(() => {
      if (window.socket) window.socket.emit('player_input', { gas: true, steer: 0.15 });
    });
    await p2.evaluate(() => {
      if (window.socket) window.socket.emit('player_input', { gas: true, steer: 0.7 });
    });
    await sleep(2500);

    // Screenshot 2: Carrera en progreso con faros, neumáticos, tribuna y pianos
    const raceShot = path.join(ARTIFACT_DIR, '02_coches_chavalil_carrera_activa.png');
    await hostPage.screenshot({ path: raceShot });
    console.log('   📸 Capturada carrera activa:', raceShot);

    // ==========================================
    // PARTE 2: VERIFICAR DIANA DE DARDOS (BASH)
    // ==========================================
    console.log('4️⃣ Lanzando Diana de Dardos Bar HotBunnies (Button Bash)...');
    await hostPage.evaluate(() => {
      if (window.socket) window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
    });
    await sleep(2600); // dejar que pase el banner de apertura

    // Screenshot 3: Nueva diana gigante nítida y crosshairs
    const dartsShot = path.join(ARTIFACT_DIR, '03_diana_dardos_gigante_tv.png');
    await hostPage.screenshot({ path: dartsShot });
    console.log('   📸 Capturada diana de dardos gigante en TV:', dartsShot);

    // Disparar dardo desde P1
    console.log('5️⃣ P1 fijando X e Y y lanzando dardo a la diana...');
    await p1.evaluate(() => document.getElementById('btn-bash-target')?.click());
    await sleep(500);
    await p1.evaluate(() => document.getElementById('btn-bash-target')?.click());
    await sleep(1000);

    // Screenshot 4: Dardo clavado en la diana con puntos
    const hitShot = path.join(ARTIFACT_DIR, '04_dardo_clavado_puntos.png');
    await hostPage.screenshot({ path: hitShot });
    console.log('   📸 Capturado dardo clavado con puntos:', hitShot);

    console.log('\n========================================');
    console.log('📊 REPORTE DE ERRORES:');
    console.log('   Host errors:', hostErrors.length, hostErrors);
    console.log('   Player errors:', p1Errors.length, p1Errors);
    console.log('========================================');

    if (hostErrors.length === 0 && p1Errors.length === 0) {
      console.log('🎉 ¡AUDITORÍA SUPERADA CON 0 ERRORES EN AMBOS MINIJUEGOS!');
    } else {
      console.error('❌ SE DETECTARON ERRORES');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error durante la prueba:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
