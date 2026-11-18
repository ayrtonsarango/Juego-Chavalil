const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testCleanLobby() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  try {
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });

    // Click modal dismiss if present
    await hostPage.evaluate(() => {
      const modal = document.getElementById('android-alert-modal');
      if (modal) modal.style.display = 'none';
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    });

    await new Promise(r => setTimeout(r, 600));

    const shotPath = path.join(ARTIFACTS_DIR, '04_tv_lobby_clean_squad_grid.png');
    await hostPage.screenshot({ path: shotPath });
    console.log('Clean shot saved to:', shotPath);
  } finally {
    await browser.close();
  }
}

testCleanLobby();
