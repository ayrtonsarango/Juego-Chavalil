const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function capture() {
  console.log('Launching Edge headless...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=412,915']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000/player ...');
  await page.goto('http://localhost:3000/player', { waitUntil: 'networkidle0', timeout: 15000 });

  // 1. Capture screen-creator (initial)
  const creatorPath = path.join(ARTIFACT_DIR, 'live-mobile-1-creator.png');
  await page.screenshot({ path: creatorPath });
  console.log('Captured:', creatorPath);

  // 2. Switch to screen-controller + overworld map
  await page.evaluate(() => {
    document.getElementById('screen-creator').classList.remove('active');
    document.getElementById('screen-controller').classList.add('active');
    document.getElementById('box-j1-controls').style.display = 'none';
    document.getElementById('box-player-map-nav').style.display = 'flex';
    document.getElementById('j1-map-actions').style.display = 'flex';
    document.getElementById('box-minigame-controls').style.display = 'none';
  });
  const mapPath = path.join(ARTIFACT_DIR, 'live-mobile-2-overworld.png');
  await page.screenshot({ path: mapPath });
  console.log('Captured:', mapPath);

  // 3. Switch to minigame race (Portrait)
  await page.evaluate(() => {
    document.getElementById('box-player-map-nav').style.display = 'none';
    document.getElementById('box-bench-spectator').style.display = 'none';
    document.getElementById('box-minigame-controls').style.display = 'flex';
    const pads = document.querySelectorAll('.pad-layout');
    pads.forEach(p => p.style.display = 'none');
    document.getElementById('pad-race').style.display = 'flex';
  });
  const racePath = path.join(ARTIFACT_DIR, 'live-mobile-3-mariokart.png');
  await page.screenshot({ path: racePath });
  console.log('Captured:', racePath);

  // 3b. Switch to minigame race (Landscape)
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const raceLandPath = path.join(ARTIFACT_DIR, 'live-mobile-3b-mariokart-landscape.png');
  await page.screenshot({ path: raceLandPath });
  console.log('Captured:', raceLandPath);

  // Reset viewport to Portrait
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 4. Switch to minigame smash (Portrait)
  await page.evaluate(() => {
    const pads = document.querySelectorAll('.pad-layout');
    pads.forEach(p => p.style.display = 'none');
    document.getElementById('pad-smash').style.display = 'flex';
  });
  const smashPath = path.join(ARTIFACT_DIR, 'live-mobile-4-supersmash.png');
  await page.screenshot({ path: smashPath });
  console.log('Captured:', smashPath);

  // 4b. Switch to minigame smash (Landscape)
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const smashLandPath = path.join(ARTIFACT_DIR, 'live-mobile-4b-supersmash-landscape.png');
  await page.screenshot({ path: smashLandPath });
  console.log('Captured:', smashLandPath);

  // Reset viewport to Portrait
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 5. Switch to bench spectator
  await page.evaluate(() => {
    const pads = document.querySelectorAll('.pad-layout');
    pads.forEach(p => p.style.display = 'none');
    document.getElementById('box-bench-spectator').style.display = 'flex';
  });
  const benchPath = path.join(ARTIFACT_DIR, 'live-mobile-5-bench.png');
  await page.screenshot({ path: benchPath });
  console.log('Captured:', benchPath);

  // 6. Switch to Button Bash diana buzzer
  await page.evaluate(() => {
    document.getElementById('box-bench-spectator').style.display = 'none';
    const pads = document.querySelectorAll('.pad-layout');
    pads.forEach(p => p.style.display = 'none');
    document.getElementById('pad-buttonbash').style.display = 'flex';
  });
  const bashPath = path.join(ARTIFACT_DIR, 'live-mobile-6-buttonbash.png');
  await page.screenshot({ path: bashPath });
  console.log('Captured:', bashPath);

  // 7. Switch to Curve Fever (2 big thumb paddles)
  await page.evaluate(() => {
    const pads = document.querySelectorAll('.pad-layout');
    pads.forEach(p => p.style.display = 'none');
    document.getElementById('pad-curve').style.display = 'flex';
  });
  const curvePath = path.join(ARTIFACT_DIR, 'live-mobile-7-curve.png');
  await page.screenshot({ path: curvePath });
  console.log('Captured:', curvePath);

  await browser.close();
  console.log('All live mobile screenshots captured successfully.');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
