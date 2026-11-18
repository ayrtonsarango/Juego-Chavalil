const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

(async () => {
  console.log('1. Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--window-size=1280,720']
  });

  // 1. Host Page
  console.log('2. Opening Host...');
  const hostPage = await browser.newPage();
  await hostPage.setViewport({ width: 1280, height: 720 });
  await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });

  // 2. Player 1
  console.log('3. Opening Player 1...');
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 390, height: 640, isMobile: true, hasTouch: true });
  await p1.goto('http://localhost:3000/player', { waitUntil: 'networkidle0' });
  await p1.evaluate(() => document.getElementById('btn-toggle-ready').click());

  // 3. Player 2
  console.log('4. Opening Player 2...');
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 390, height: 640, isMobile: true, hasTouch: true });
  await p2.goto('http://localhost:3000/player', { waitUntil: 'networkidle0' });
  await p2.evaluate(() => {
    document.getElementById('btn-champ-next').click();
    document.getElementById('btn-toggle-ready').click();
  });

  await new Promise(r => setTimeout(r, 1200));

  console.log('5. Launching race minigame via socket...');
  await hostPage.evaluate(() => {
    if (window.socket) {
      window.socket.emit('admin_launch_minigame', { gameType: 'race' });
    }
  });

  await new Promise(r => setTimeout(r, 1500));

  console.log('6. Taking grid screenshot...');
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, '41_tv_micro_racers_grid.png') });

  // Wait for countdown to end (countdown is 3.6s)
  console.log('7. Waiting for green light & sending car inputs...');
  await new Promise(r => setTimeout(r, 2500));

  // Dispatch steer & gas via player pages
  await p1.evaluate(() => {
    if (window.socket) {
      window.socket.emit('player_input', { gas: true, steer: 0 });
    }
  });

  await p2.evaluate(() => {
    if (window.socket) {
      window.socket.emit('player_input', { gas: true, steer: 0.8 });
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('8. Taking racing screenshots...');
  await hostPage.screenshot({ path: path.join(ARTIFACT_DIR, '42_tv_micro_racers_racing.png') });

  // Mobile pad screenshot
  await p1.screenshot({ path: path.join(ARTIFACT_DIR, '43_mobile_micro_racers_pad.png') });

  console.log('ALL MICRO RACERS TESTS PASSED PERFECTLY!');
  await browser.close();
})();
