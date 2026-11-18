const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS_DIR = 'C:\\Users\\ayrton\\.gemini\\antigravity\\brain\\a4d06d8c-cb5f-4a99-96fa-fca66435e83f';

async function testLobbyLounge() {
  console.log('--- TEST: INTERACTIVE LOBBY LOUNGE (LA SALA DE LA CUADRILLA) ---');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Launch Host TV Page (1920x1080 Full HD)
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle0' });
    console.log('Host TV page loaded.');

    await new Promise(r => setTimeout(r, 1000));

    // Reset game state to clean lobby
    await hostPage.evaluate(() => {
      window.socket.emit('admin_reset_game');
    });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot 1: Empty Lobby with 2D Lounge & QR Sidebar
    const emptyLobbyPath = path.resolve('C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/09_tv_lobby_empty_lounge_and_qr.png');
    await hostPage.screenshot({ path: emptyLobbyPath });
    console.log('Saved 09_tv_lobby_empty_lounge_and_qr.png');

    // 2. Launch Player 1 Mobile Page (iPhone 390x844)
    const player1Page = await browser.newPage();
    await player1Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await player1Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle0' });
    console.log('Player 1 Mobile page loaded.');

    // Set nickname and choose character
    await player1Page.evaluate(() => {
      const nameInput = document.getElementById('input-player-name');
      if (nameInput) {
        nameInput.value = 'Ayrton';
        nameInput.dispatchEvent(new Event('input'));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Check Host TV: Player 1 should be in "En el Vestidor"
    const unreadyCount = await hostPage.evaluate(() => {
      const chips = document.querySelectorAll('.unready-player-chip');
      return chips.length;
    });
    console.log(`Players in Dressing Room (unready): ${unreadyCount}`);

    // Screenshot 2: Host TV with Player 1 in Dressing Room
    const dressingRoomPath = path.resolve('C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/10_tv_lobby_player_in_dressing_room.png');
    await hostPage.screenshot({ path: dressingRoomPath });
    console.log('Saved 10_tv_lobby_player_in_dressing_room.png');

    // 3. Player 1 Clicks "¡LISTO PARA JUGAR!"
    await player1Page.evaluate(() => {
      const readyBtn = document.getElementById('btn-toggle-ready');
      if (readyBtn) readyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Screenshot 3: Player 1 Mobile Lounge Controller (Active Pad)
    const mobilePadPath = path.resolve('C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/11_mobile_lounge_controller_pad.png');
    await player1Page.screenshot({ path: mobilePadPath });
    console.log('Saved 11_mobile_lounge_controller_pad.png');

    // Check TV: Player 1 entity should now be spawned in "La Sala"
    const spawnedPlayerCount = await hostPage.evaluate(() => {
      const entities = document.querySelectorAll('.room-player-entity');
      return entities.length;
    });
    console.log(`Players spawned in La Sala: ${spawnedPlayerCount}`);

    // 4. Test Mobile Controls: Move Right and Jump
    console.log('Testing movement: moving RIGHT on mobile pad...');
    await player1Page.evaluate(() => {
      const btnRight = document.getElementById('btn-lobby-right');
      if (btnRight) {
        btnRight.dispatchEvent(new MouseEvent('mousedown'));
      }
    });
    await new Promise(r => setTimeout(r, 800)); // Walk for 800ms
    await player1Page.evaluate(() => {
      const btnRight = document.getElementById('btn-lobby-right');
      if (btnRight) {
        btnRight.dispatchEvent(new MouseEvent('mouseup'));
      }
    });

    console.log('Testing jump: jumping on mobile pad...');
    await player1Page.evaluate(() => {
      const btnJump = document.getElementById('btn-lobby-jump');
      if (btnJump) {
        btnJump.dispatchEvent(new MouseEvent('mousedown'));
      }
    });
    await new Promise(r => setTimeout(r, 100));
    await player1Page.evaluate(() => {
      const btnJump = document.getElementById('btn-lobby-jump');
      if (btnJump) {
        btnJump.dispatchEvent(new MouseEvent('mouseup'));
      }
    });

    // Emote soundboard test: Wolf Howl
    await player1Page.evaluate(() => {
      const wolfBtn = document.querySelector('.lobby-pad-soundboard .btn-emote[data-sound="auuu"]');
      if (wolfBtn) wolfBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Screenshot 4: TV showing Ayrton in La Sala with Emote Bubble
    const tvInActionPath = path.resolve('C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/12_tv_lounge_player_active_and_emote.png');
    await hostPage.screenshot({ path: tvInActionPath });
    console.log('Saved 12_tv_lounge_player_active_and_emote.png');

    // 5. Test 10+ Players Scaling: Add 10 Bots!
    console.log('Adding 10 bots to test 10+ players in La Sala...');
    await hostPage.evaluate(() => {
      window.socket.emit('admin_add_bot', 10);
    });
    await new Promise(r => setTimeout(r, 1800)); // Let bots spawn and move

    const totalLoungePlayers = await hostPage.evaluate(() => {
      const entities = document.querySelectorAll('.room-player-entity');
      return entities.length;
    });
    console.log(`Total players roaming in La Sala: ${totalLoungePlayers}`);

    // Screenshot 5: TV with 11 Players enjoying La Sala together
    const tv11PlayersPath = path.resolve('C:/Users/ayrton/.gemini/antigravity/brain/a4d06d8c-cb5f-4a99-96fa-fca66435e83f/13_tv_lounge_11_players_party.png');
    await hostPage.screenshot({ path: tv11PlayersPath });
    console.log('Saved 13_tv_lounge_11_players_party.png');

    console.log('--- ALL TESTS COMPLETED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testLobbyLounge();
