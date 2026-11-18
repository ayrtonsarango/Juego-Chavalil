const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setContent(`
    <html><body>
      <canvas id="c" width="1280" height="720"></canvas>
      <script>
        const canvas = document.getElementById("c");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = "http://localhost:3000/images/hotbunnies_bar.jpg";
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1280, 720);
          // Let's sample a box x: 500..750, y: 220..480
          const imgData = ctx.getImageData(520, 230, 240, 240);
          // find the bullseye: bullseye has highest red/green contrast or center of the circular board
          // The circular board is dark wood/cork, with radius around 120, dartboard radius ~78
          // Let's print out brightness/contrast profile
          let minX = 999, maxX = -1, minY = 999, maxY = -1;
          for (let y = 0; y < 240; y++) {
            for (let x = 0; x < 240; x++) {
              const idx = (y * 240 + x) * 4;
              const r = imgData.data[idx];
              const g = imgData.data[idx + 1];
              const b = imgData.data[idx + 2];
              // dartboard sectors have high brightness (white/cream segments ~150+)
              if (r > 130 && g > 130 && b > 110) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          window.coords = {
            centerX: 520 + (minX + maxX) / 2,
            centerY: 230 + (minY + maxY) / 2,
            radiusX: (maxX - minX) / 2,
            radiusY: (maxY - minY) / 2,
            minX: 520 + minX,
            maxX: 520 + maxX,
            minY: 230 + minY,
            maxY: 230 + maxY
          };
          window.done = true;
        };
      </script>
    </body></html>
  `);
  await page.waitForFunction('window.done === true');
  const coords = await page.evaluate(() => window.coords);
  console.log('Detected Dartboard Coords:', coords);
  await browser.close();
})();
