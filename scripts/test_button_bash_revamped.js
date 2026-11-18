const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'revamped-bash');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('🚀 Testing Revamped Button Bash...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[Browser Error]:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
  await sleep(1500);

  // Directly launch buttonbash minigame
  console.log('1. Launching Button Bash on Host Canvas...');
  await page.evaluate(() => {
    if (window.socket) {
      window.socket.emit('admin_launch_minigame', {
        gameType: 'buttonbash'
      });
    }
  });

  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '01_revamped_board_with_real_photo_and_admins.png') });
  console.log('📸 01: Real photo background, official Marta & Violeta avatars, and aligned tickers');

  // Simulate player throws dart
  console.log('2. Simulating dart throw...');
  await page.evaluate(() => {
    if (window.socket) {
      window.socket.emit('player_input', { bash: true, shoot: true });
    }
  });
  await sleep(600);
  await page.evaluate(() => {
    if (window.socket) {
      window.socket.emit('player_input', { bash: true, shoot: true });
    }
  });
  await sleep(1200);

  await page.screenshot({ path: path.join(OUT_DIR, '02_revamped_dart_stuck.png') });
  console.log('📸 02: Dart stuck in real board with score pop');

  // Prank A: Windows Vista slow calculation error
  console.log('3. Triggering Prank A (Vista error)...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine) window.activeMinigameEngine.triggerPrankA();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUT_DIR, '03_revamped_prank_a_vista.png') });
  console.log('📸 03: Prank A (Vista tilted error)');

  // Prank C: Overlapping popups ("una cosa sobre otra")
  console.log('4. Triggering Prank C (Overlapping Goofy Popups)...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine) window.activeMinigameEngine.triggerPrankC();
  });
  await sleep(3000); // Allow all 3 overlapping popups to cascade
  await page.screenshot({ path: path.join(OUT_DIR, '04_revamped_overlapping_popups.png') });
  console.log('📸 04: Overlapping tilted popups (Defender, Badostáin, Gangbang Ramen)');

  // Blackout
  console.log('5. Triggering Blackout...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine) window.activeMinigameEngine.triggerBlackout();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '05_revamped_blackout.png') });
  console.log('📸 05: Blackout with wandering flashlight beam and tilted panic texts');

  // Fake Ranking
  console.log('6. Triggering Fake Ranking...');
  await page.evaluate(() => {
    if (window.activeMinigameEngine) window.activeMinigameEngine.triggerFakeRanking();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT_DIR, '06_revamped_fake_ranking_tracasa.png') });
  console.log('📸 06: Fake Ranking with Alvarito crowned winner (Tracasa lore)');

  await browser.close();
  console.log('🎉 Test completed! All screenshots captured in', OUT_DIR);
})();
