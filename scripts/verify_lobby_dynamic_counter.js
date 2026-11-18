const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'lobby-counter');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('🧪 Starting Lobby Counter Test...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });

    // Host page console listener
    hostPage.on('console', msg => {
      if (msg.type() === 'error') console.error('[Host Error]:', msg.text());
    });

    console.log('1️⃣ Opening Host TV view...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Reset game state to clean lobby
    await hostPage.evaluate(() => {
      const resetBtn = document.getElementById('btn-admin-reset');
      if (resetBtn) resetBtn.click();
    });
    await sleep(1000);

    // Dismiss any alert modals
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    // Check initial counter text with 0 players
    const initialText = await hostPage.$eval('#header-player-count', el => el.textContent.trim());
    console.log(`Initial counter (0 players): "${initialText}"`);

    // Player 1 connects
    console.log('2️⃣ Player 1 joining...');
    const player1Page = await browser.newPage();
    await player1Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await player1Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Dismiss avatar / android modals on host if any
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    const p1JoinedText = await hostPage.$eval('#header-player-count', el => el.textContent.trim());
    console.log(`After P1 joined (0 ready): "${p1JoinedText}"`);

    // Player 2 connects
    console.log('3️⃣ Player 2 joining...');
    const player2Page = await browser.newPage();
    await player2Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await player2Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Dismiss android modal if any
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    const p2JoinedText = await hostPage.$eval('#header-player-count', el => el.textContent.trim());
    console.log(`After P2 joined (0 ready / 2 total): "${p2JoinedText}"`);
    await hostPage.screenshot({ path: path.join(OUT_DIR, '01_zero_of_two_ready.png') });

    // Player 1 sets ready
    console.log('4️⃣ Player 1 clicking READY...');
    await player1Page.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await sleep(1000);

    const p1ReadyText = await hostPage.$eval('#header-player-count', el => el.textContent.trim());
    console.log(`After P1 ready (1 ready / 2 total): "${p1ReadyText}"`);
    await hostPage.screenshot({ path: path.join(OUT_DIR, '02_one_of_two_ready.png') });

    // Player 2 sets ready
    console.log('5️⃣ Player 2 clicking READY...');
    await player2Page.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await sleep(1000);

    const p2ReadyText = await hostPage.$eval('#header-player-count', el => el.textContent.trim());
    console.log(`After P2 ready (2 ready / 2 total): "${p2ReadyText}"`);
    await hostPage.screenshot({ path: path.join(OUT_DIR, '03_two_of_two_ready.png') });

    // Verification check
    const step1Pass = p2JoinedText.includes('0 / 2 LISTOS') || p2JoinedText.includes('0/2 LISTOS');
    const step2Pass = p1ReadyText.includes('1 / 2 LISTOS') || p1ReadyText.includes('1/2 LISTOS');
    const step3Pass = p2ReadyText.includes('2 / 2 LISTOS') || p2ReadyText.includes('2/2 LISTOS');
    const noHardcoded8 = !p2JoinedText.includes('8') && !p1ReadyText.includes('8') && !p2ReadyText.includes('8');

    console.log('\n📊 TEST RESULTS:');
    console.log(`- 0 / 2 LISTOS displayed: ${step1Pass ? '✅ PASS' : '❌ FAIL'} (${p2JoinedText})`);
    console.log(`- 1 / 2 LISTOS displayed: ${step2Pass ? '✅ PASS' : '❌ FAIL'} (${p1ReadyText})`);
    console.log(`- 2 / 2 LISTOS displayed: ${step3Pass ? '✅ PASS' : '❌ FAIL'} (${p2ReadyText})`);
    console.log(`- Never hardcoded 8: ${noHardcoded8 ? '✅ PASS' : '❌ FAIL'}`);

    if (step1Pass && step2Pass && step3Pass && noHardcoded8) {
      console.log('🎉 LOBBY COUNTER VERIFICATION SUCCEEDED!');
    } else {
      console.warn('⚠️ LOBBY COUNTER VERIFICATION FAILED CURRENT CHECKS');
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
})();
