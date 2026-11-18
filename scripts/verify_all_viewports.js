/**
 * Multi-Viewport Visual Verification Script
 * Validates across all required screen sizes:
 * 1. Android pequeño (360x640)
 * 2. Android gama media (360x800)
 * 3. Android grande (412x915)
 * 4. iPhone SE (375x667)
 * 5. iPhone estándar (390x844 & 393x852)
 * 6. iPhone Pro Max (430x932)
 * 7. TV 1080p (1920x1080)
 * 8. TV 4K (3840x2160)
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'viewports');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const MOBILE_VIEWPORTS = [
  { name: '01_android_small_360x640', w: 360, h: 640 },
  { name: '02_android_mid_360x800', w: 360, h: 800 },
  { name: '03_android_large_412x915', w: 412, h: 915 },
  { name: '04_iphone_se_375x667', w: 375, h: 667 },
  { name: '05_iphone_std_390x844', w: 390, h: 844 },
  { name: '06_iphone_promax_430x932', w: 430, h: 932 }
];

const TV_VIEWPORTS = [
  { name: 'tv_1080p_1920x1080', w: 1920, h: 1080 },
  { name: 'tv_4k_3840x2160', w: 3840, h: 2160 }
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('🚀 Running Multi-Viewport Verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  // 1. Mobile Tests across the 6 sizes
  for (const vp of MOBILE_VIEWPORTS) {
    console.log(`📱 Testing Mobile ${vp.name} (${vp.w}x${vp.h})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: true, hasTouch: true });

    // Test Creator Screen
    await page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_creator.png`) });

    // Test Gamepad in Portrait
    await page.evaluate(() => {
      const creator = document.getElementById('screen-creator');
      const controller = document.getElementById('screen-controller');
      if (creator && controller) {
        creator.classList.remove('active');
        controller.classList.add('active');
      }
      if (typeof showActiveGamepad === 'function') {
        showActiveGamepad('race');
      }
    });
    await sleep(400);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_gamepad_portrait.png`) });

    // Test Gamepad in Landscape
    await page.setViewport({ width: vp.h, height: vp.w, isMobile: true, hasTouch: true });
    await sleep(400);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_gamepad_landscape.png`) });

    await page.close();
  }

  // 2. TV Tests across 1080p and 4K
  for (const vp of TV_VIEWPORTS) {
    console.log(`📺 Testing TV ${vp.name} (${vp.w}x${vp.h})...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });

    // Lobby
    await page.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_lobby.png`) });

    // Test Podium Celebration
    await page.evaluate(() => {
      if (typeof showPodiumResults === 'function') {
        showPodiumResults({
          winner: { name: 'Ayrton', score: 100, isAndroid: false, avatar: {} },
          ranking: [
            { name: 'Ayrton', score: 100, isAndroid: false, avatar: {} },
            { name: 'Adriachi', score: 75, isAndroid: true, avatar: {} },
            { name: 'Marta', score: 50, isAndroid: false, avatar: {} },
            { name: 'Manu', score: 25, isAndroid: false, avatar: {} }
          ],
          completedLevel: { name: 'Mario Kart GP' }
        });
      }
    });
    await sleep(600);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_podium.png`) });

    await page.close();
  }

  await browser.close();
  console.log('🎉 Multi-Viewport Verification Complete! All screenshots saved in', OUT_DIR);
})();
