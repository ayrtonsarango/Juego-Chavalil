const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/host');

  const res = await page.evaluate(async () => {
    const img = new Image();
    img.src = '/images/hotbunnies_bar.jpg';
    await new Promise(r => img.onload = r);

    const c = document.getElementById('minigame-canvas');
    c.style.display = 'block';
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 1280, 720);

    // Let's test centers
    // Bullseye test at 636, 350? Or let's test a range of Y:
    // In the photo, the neon "HOTBUNNIES" is above.
    // The lamp is below the neon sign.
    // Below the lamp is the circular backboard, then the dartboard.
    // Below the dartboard are table & stools.
    return true;
  });

  // Let's take a screenshot of the bar photo rendered on canvas with candidate coordinates
  await page.evaluate(() => {
    const c = document.getElementById('minigame-canvas');
    const ctx = c.getContext('2d');
    const candidates = [
      { x: 636, y: 350, r: 85, color: '#00ff00', label: 'Y:350, R:85' },
      { x: 636, y: 360, r: 80, color: '#ff0000', label: 'Y:360, R:80' },
      { x: 636, y: 345, r: 88, color: '#ffff00', label: 'Y:345, R:88' },
      { x: 636, y: 355, r: 84, color: '#00ffff', label: 'Y:355, R:84' }
    ];
    candidates.forEach(cand => {
      ctx.strokeStyle = cand.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cand.x, cand.y, cand.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = cand.color;
      ctx.fillRect(cand.x - 2, cand.y - 2, 4, 4);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(cand.label, cand.x + cand.r + 5, cand.y);
    });
  });

  await page.screenshot({ path: path.join(__dirname, '..', 'design', 'test-results', 'dartboard_candidates.png') });
  await browser.close();
  console.log('Saved dartboard_candidates.png');
})();
