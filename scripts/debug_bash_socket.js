const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function debugBash() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const hostPage = await browser.newPage();
  await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });

  const playerPage = await browser.newPage();
  await playerPage.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });

  // Ready
  await playerPage.evaluate(() => {
    const btn = document.getElementById('btn-toggle-ready');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Launch Button Bash directly
  await hostPage.evaluate(() => {
    window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log('Host phase before tap 1:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  // Tap 1
  await playerPage.evaluate(() => {
    const btn = document.getElementById('btn-bash-target');
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Host phase after tap 1:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  // Tap 2
  await playerPage.evaluate(() => {
    const btn = document.getElementById('btn-bash-target');
    btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('Host phase after tap 2:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  await new Promise(r => setTimeout(r, 2000));
  console.log('Host phase after 2s:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  const vistaState = await playerPage.evaluate(() => {
    const vista = document.getElementById('prank-step-vista');
    return vista ? vista.style.display : null;
  });
  console.log('1. Vista dialog on player:', vistaState);

  // Click close vista
  await playerPage.evaluate(() => {
    const btn = document.getElementById('btn-prank-close-vista');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const ramenState = await playerPage.evaluate(() => {
    const ramen = document.getElementById('prank-step-ramen');
    return ramen ? ramen.style.display : null;
  });
  console.log('2. GangBang Ramen on player:', ramenState);

  // Wait for Blackout (~12s)
  console.log('Waiting for blackout...');
  await new Promise(r => setTimeout(r, 12000));
  console.log('Host phase during blackout:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  const blackoutState = await playerPage.evaluate(() => {
    const b = document.getElementById('bash-blackout-fullscreen');
    return b ? b.style.display : null;
  });
  console.log('3. Blackout fullscreen on player:', blackoutState);

  // Wait for Fake Ranking (~8s)
  console.log('Waiting for fake ranking...');
  await new Promise(r => setTimeout(r, 8000));
  console.log('Host phase during fake ranking:', await hostPage.evaluate(() => window.activeMinigameEngine ? window.activeMinigameEngine.phase : 'none'));

  const rankingState = await playerPage.evaluate(() => {
    const r = document.getElementById('bash-fake-ranking-mobile');
    return r ? r.style.display : null;
  });
  console.log('4. Fake ranking on player:', rankingState);

  await browser.close();
}

debugBash();
