const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testButtonBash() {
  console.log('Launching Edge headless...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,720']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000/host ...');
  await page.goto('http://localhost:3000/host', { waitUntil: 'networkidle0', timeout: 15000 });

  // Switch to minigame view and launch ButtonBashEngine directly on the canvas
  await page.evaluate(() => {
    // Hide other views
    document.getElementById('view-lobby').classList.remove('active');
    document.getElementById('view-map').classList.remove('active');
    document.getElementById('view-minigame').classList.add('active');

    const testPlayers = [
      { id: 'p1', name: 'Ayrton', isAndroid: false },
      { id: 'p2', name: 'Adriachi', isAndroid: false },
      { id: 'p3', name: 'Marta', isAndroid: true },
      { id: 'p4', name: 'Manu', isAndroid: false }
    ];

    window.engine = new window.ButtonBashEngine('minigame-canvas', {
      onComplete: (res) => console.log('Button Bash Done:', res)
    });
    window.engine.init(testPlayers, { teamA: [testPlayers[0], testPlayers[1]], teamB: [testPlayers[2], testPlayers[3]] });
  });

  // 1. Capture Initial Board & Admins
  await new Promise(r => setTimeout(r, 600));
  const boardPath = path.join(ARTIFACT_DIR, 'button-bash-tv-1-board.png');
  await page.screenshot({ path: boardPath });
  console.log('Captured:', boardPath);

  // 2. Trigger Popups (Group A & Group C)
  await page.evaluate(() => {
    window.engine.triggerPrankA();
    window.engine.triggerPrankB();
    window.engine.triggerPrankC();
  });
  await new Promise(r => setTimeout(r, 1000));
  const popupsPath = path.join(ARTIFACT_DIR, 'button-bash-tv-2-popups.png');
  await page.screenshot({ path: popupsPath });
  console.log('Captured:', popupsPath);

  // 3. Trigger Blackout (Group D)
  await page.evaluate(() => {
    window.engine.triggerBlackout();
  });
  await new Promise(r => setTimeout(r, 800));
  const blackoutPath = path.join(ARTIFACT_DIR, 'button-bash-tv-3-blackout.png');
  await page.screenshot({ path: blackoutPath });
  console.log('Captured:', blackoutPath);

  // 4. Trigger Fake Ranking (alvarito.tracasa.lover.69)
  await page.evaluate(() => {
    window.engine.triggerFakeRanking();
  });
  await new Promise(r => setTimeout(r, 800));
  const rankingPath = path.join(ARTIFACT_DIR, 'button-bash-tv-4-fake-ranking.png');
  await page.screenshot({ path: rankingPath });
  console.log('Captured:', rankingPath);

  await browser.close();
  console.log('All Button Bash TV screenshots captured successfully.');
}

testButtonBash().catch(err => {
  console.error('Error during Button Bash TV test:', err);
  process.exit(1);
});
