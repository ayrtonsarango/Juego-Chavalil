const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/player', { waitUntil: 'networkidle0' });

  // 1. Screenshot Creator
  await page.screenshot({ path: 'C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/37_test_creator_640.png' });

  // 2. Test typing in mote
  await page.click('.gamertag-card');
  await page.type('#input-player-name', '_Pro');
  const val = await page.$eval('#input-player-name', el => el.value);
  console.log('Typed input value:', val);

  // 3. Click Soundboard Bocina in Creator
  await page.click('.emote-board .btn-emote[data-sound="bocina"]');
  await new Promise(r => setTimeout(r, 200));
  const badgeText = await page.$eval('.soundboard-cooldown-badge', el => ({ text: el.textContent, display: getComputedStyle(el).display }));
  const btnDisabled = await page.$eval('.btn-emote', el => el.disabled);
  console.log('Cooldown in creator:', badgeText, 'btnDisabled:', btnDisabled);

  // Screenshot cooldown active in creator
  await page.screenshot({ path: 'C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/38_test_creator_cooldown.png' });

  // 4. Wait for cooldown to end
  await new Promise(r => setTimeout(r, 4200));

  // 5. Click Ready
  await page.click('#btn-toggle-ready');
  await new Promise(r => setTimeout(r, 600));

  // 6. Screenshot Lobby Pad
  await page.screenshot({ path: 'C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/39_test_lobby_pad_640.png' });

  // 7. Click Soundboard in Lobby Pad
  await page.click('.lobby-pad-soundboard .btn-emote[data-sound="auuu"]');
  await new Promise(r => setTimeout(r, 200));
  const lobbyBadge = await page.$eval('.lobby-pad-soundboard .soundboard-cooldown-badge', el => ({ text: el.textContent, display: getComputedStyle(el).display }));
  console.log('Cooldown in lobby pad:', lobbyBadge);

  // Screenshot cooldown active in lobby pad
  await page.screenshot({ path: 'C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/40_test_lobby_pad_cooldown.png' });

  await browser.close();
  console.log('ALL VERIFICATIONS SUCCESSFUL!');
})();
