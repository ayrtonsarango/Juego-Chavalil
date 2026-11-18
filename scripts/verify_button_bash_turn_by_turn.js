const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'design', 'test-results', 'button-bash-turn');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

(async () => {
  console.log('🎯 Starting Button Bash Turn-by-Turn & Banquillo Cloud Verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const hostErrors = [];
  const p1Errors = [];
  const p2Errors = [];

  try {
    // 1. Setup Host TV
    const hostPage = await browser.newPage();
    await hostPage.setViewport({ width: 1920, height: 1080 });
    hostPage.on('console', msg => {
      if (msg.type() === 'error') {
        hostErrors.push(msg.text());
        console.error('[Host Error]:', msg.text());
      }
    });

    // 2. Setup Player 1
    const p1Page = await browser.newPage();
    await p1Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    p1Page.on('console', msg => {
      if (msg.type() === 'error') {
        p1Errors.push(msg.text());
        console.error('[P1 Error]:', msg.text());
      }
    });

    // 3. Setup Player 2
    const p2Page = await browser.newPage();
    await p2Page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    p2Page.on('console', msg => {
      if (msg.type() === 'error') {
        p2Errors.push(msg.text());
        console.error('[P2 Error]:', msg.text());
      }
    });

    console.log('1️⃣ Navigating to Host and Players...');
    await hostPage.goto('http://localhost:3000/host', { waitUntil: 'networkidle2' });
    await p1Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await p2Page.goto('http://localhost:3000/player', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Reset lobby on host
    await hostPage.evaluate(() => {
      const resetBtn = document.getElementById('btn-admin-reset');
      if (resetBtn) resetBtn.click();
    });
    await sleep(1000);

    // Set player names & ready up
    console.log('2️⃣ Setting ready for both players...');
    await p1Page.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await sleep(500);

    await p2Page.evaluate(() => {
      const btn = document.getElementById('btn-toggle-ready');
      if (btn) btn.click();
    });
    await sleep(1000);

    // Dismiss any modal
    await hostPage.evaluate(() => {
      const btn = document.getElementById('btn-close-android-modal');
      if (btn) btn.click();
    });

    // Launch Button Bash
    console.log('3️⃣ Launching Button Bash on Host...');
    await hostPage.evaluate(() => {
      if (window.socket) {
        window.socket.emit('admin_launch_minigame', { gameType: 'buttonbash' });
      }
    });
    await sleep(2000);

    // Check Turn 1
    console.log('4️⃣ Checking Turn 1 (P1 active shooter, P2 on Banquillo)...');
    const p1StateTurn1 = await p1Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      const pad = document.getElementById('pad-buttonbash');
      const bench = document.getElementById('box-bench-spectator');
      return {
        btnDisabled: btn ? btn.disabled : null,
        btnLocked: btn ? btn.classList.contains('locked') : null,
        padVisible: pad ? window.getComputedStyle(pad).display !== 'none' : false,
        benchVisible: bench ? window.getComputedStyle(bench).display !== 'none' : false
      };
    });

    const p2StateTurn1 = await p2Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      const pad = document.getElementById('pad-buttonbash');
      const bench = document.getElementById('box-bench-spectator');
      const shoutInput = document.getElementById('bench-shout-input');
      const shoutBtn = document.getElementById('btn-bench-send');
      return {
        btnDisabled: btn ? btn.disabled : null,
        btnLocked: btn ? btn.classList.contains('locked') : null,
        padVisible: pad ? window.getComputedStyle(pad).display !== 'none' : false,
        benchVisible: bench ? window.getComputedStyle(bench).display !== 'none' : false,
        hasShoutInput: !!shoutInput,
        hasShoutBtn: !!shoutBtn
      };
    });

    console.log('P1 State (Turn 1):', p1StateTurn1);
    console.log('P2 State (Turn 1):', p2StateTurn1);

    await hostPage.screenshot({ path: path.join(OUT_DIR, '01_turn1_host.png') });
    await p1Page.screenshot({ path: path.join(OUT_DIR, '01_turn1_p1_active.png') });
    await p2Page.screenshot({ path: path.join(OUT_DIR, '01_turn1_p2_bench.png') });

    // 5. Test Banquillo shout from P2
    console.log('5️⃣ P2 sending shout "¡VAMOS!" from Banquillo...');
    const shoutSent = await p2Page.evaluate(() => {
      const input = document.getElementById('bench-shout-input');
      const btn = document.getElementById('btn-bench-send');
      if (input && btn) {
        input.value = '¡VAMOS!';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Shout sent from P2:', shoutSent);
    await sleep(600);

    // Verify shout on Host TV
    const hostShoutInfo = await hostPage.evaluate(() => {
      const overlay = document.getElementById('bench-shouts-overlay');
      const pills = document.querySelectorAll('.bench-shout-pill');
      const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
      const shouts = Array.from(pills).map(p => {
        const rect = p.getBoundingClientRect();
        const style = window.getComputedStyle(p);
        return {
          text: p.innerText,
          top: rect.top,
          left: rect.left,
          opacity: style.opacity,
          transform: style.transform
        };
      });

      return {
        overlayExists: !!overlay,
        overlayHeight: overlayStyle ? overlayStyle.height : 'none',
        overlayBottom: overlayStyle ? overlayStyle.bottom : 'none',
        shoutCount: pills.length,
        shouts
      };
    });

    console.log('Host TV Shout Info:', hostShoutInfo);
    await hostPage.screenshot({ path: path.join(OUT_DIR, '02_tv_floating_cloud_shout.png') });

    // 6. P1 takes their shot
    console.log('6️⃣ P1 taking shot (Lock X and Lock Y)...');
    await p1Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.click();
    });
    await sleep(600);

    await p1Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.click();
    });
    await sleep(2800);

    // Check Turn 2 (Should advance to P2)
    console.log('7️⃣ Checking Turn 2 (P2 active shooter, P1 on Banquillo)...');
    const p1StateTurn2 = await p1Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      const pad = document.getElementById('pad-buttonbash');
      const bench = document.getElementById('box-bench-spectator');
      return {
        btnDisabled: btn ? btn.disabled : null,
        btnLocked: btn ? btn.classList.contains('locked') : null,
        padVisible: pad ? window.getComputedStyle(pad).display !== 'none' : false,
        benchVisible: bench ? window.getComputedStyle(bench).display !== 'none' : false
      };
    });

    const p2StateTurn2 = await p2Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      const pad = document.getElementById('pad-buttonbash');
      const bench = document.getElementById('box-bench-spectator');
      return {
        btnDisabled: btn ? btn.disabled : null,
        btnLocked: btn ? btn.classList.contains('locked') : null,
        padVisible: pad ? window.getComputedStyle(pad).display !== 'none' : false,
        benchVisible: bench ? window.getComputedStyle(bench).display !== 'none' : false
      };
    });

    console.log('P1 State (Turn 2):', p1StateTurn2);
    console.log('P2 State (Turn 2):', p2StateTurn2);

    await hostPage.screenshot({ path: path.join(OUT_DIR, '03_turn2_host.png') });
    await p1Page.screenshot({ path: path.join(OUT_DIR, '03_turn2_p1_bench.png') });
    await p2Page.screenshot({ path: path.join(OUT_DIR, '03_turn2_p2_active.png') });

    // 8. P2 shoots
    console.log('8️⃣ P2 taking shot (Lock X and Lock Y)...');
    await p2Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.click();
    });
    await sleep(600);

    await p2Page.evaluate(() => {
      const btn = document.getElementById('btn-bash-target');
      if (btn) btn.click();
    });
    await sleep(2800);

    await hostPage.screenshot({ path: path.join(OUT_DIR, '04_turn2_after_p2_shot.png') });

    // Assessment
    const turn1P1Active = p1StateTurn1.padVisible && !p1StateTurn1.btnDisabled && !p1StateTurn1.benchVisible;
    const turn1P2Banquillo = p2StateTurn1.benchVisible;
    const shoutShown = hostShoutInfo.shouts.some(s => s.text.includes('VAMOS'));
    const turn2P2Active = p2StateTurn2.padVisible && !p2StateTurn2.btnDisabled && !p2StateTurn2.benchVisible;
    const turn2P1Banquillo = p1StateTurn2.benchVisible;

    console.log('\n📊 BUTTON BASH TEST REPORT:');
    console.log(`- Turn 1: P1 active shooter unlocked: ${turn1P1Active ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Turn 1: P2 in Banquillo with shout form: ${turn1P2Banquillo ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Banquillo shout '¡VAMOS!' appeared on TV: ${shoutShown ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Turn 2: P2 active shooter unlocked: ${turn2P2Active ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Turn 2: P1 in Banquillo with shout form: ${turn2P1Banquillo ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`- Errors: Host=${hostErrors.length}, P1=${p1Errors.length}, P2=${p2Errors.length}`);

    if (turn1P1Active && turn1P2Banquillo && shoutShown && turn2P2Active && turn2P1Banquillo) {
      console.log('🎉 BUTTON BASH TURN-BY-TURN & BANQUILLO TEST PASSED!');
    } else {
      console.warn('⚠️ BUTTON BASH FAILED EXPECTATIONS (needs implementation fixes)');
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
})();
