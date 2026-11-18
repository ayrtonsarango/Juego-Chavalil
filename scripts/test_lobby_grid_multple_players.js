const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testLobbyCards() {
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

    // Dismiss any modal if open
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    // Add 4 bots
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bot4 = btns.find(b => b.textContent.includes('+4 Bots'));
      if (bot4) bot4.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Dismiss android modal if triggered by bot
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 500));

    const shotPath = path.join(ARTIFACTS_DIR, '03_tv_lobby_full_squad_grid.png');
    await hostPage.screenshot({ path: shotPath });
    console.log('Saved lobby multi-player shot to:', shotPath);
  } finally {
    await browser.close();
  }
}

testLobbyCards();
