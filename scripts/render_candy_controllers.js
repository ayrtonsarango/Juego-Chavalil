const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { renderAvatarSVG, AVATAR_PRESETS } = require('../public/js/avatar-engine.js');

const pAyrton = AVATAR_PRESETS.find(p => p.id === 'ayrton') || AVATAR_PRESETS[0];
const svgAvatarThumb = renderAvatarSVG(pAyrton.config, 52);
const svgAvatarSmall = renderAvatarSVG(pAyrton.config, 40);

// Shared Doodle Pop CSS
const sharedCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');

  :root {
    --navy: #1e293b;
    --navy-dark: #0f172a;
    --navy-skirt: #090d16;
    --border-w: 3.5px;
    --bg-page: #edf5fd;
    --bg-card: #ffffff;
    
    --c-cyan: #38bdf8;
    --c-cyan-skirt: #0284c7;
    --c-green: #22c55e;
    --c-green-skirt: #15803d;
    --c-pink: #f43f5e;
    --c-pink-skirt: #be123c;
    --c-yellow: #facc15;
    --c-yellow-skirt: #ca8a04;
    --c-orange: #fb923c;
    --c-orange-skirt: #c2410c;
    --c-purple: #a855f7;
    --c-purple-skirt: #7e22ce;
  }

  * {
    margin: 0; padding: 0; box-sizing: border-box;
    user-select: none; -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: var(--bg-page);
    /* Doodle doodle squiggly pattern + candy confetti sprinkles */
    background-image: 
      radial-gradient(#93c5fd 2px, transparent 2.5px),
      radial-gradient(#fca5a5 2px, transparent 2.5px),
      radial-gradient(#fde047 2px, transparent 2.5px),
      url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 25 Q 35 5, 60 30 T 110 25 T 145 55 Q 130 90, 100 70 T 50 90 T 20 125 Q 45 155, 80 140 T 135 150' stroke='%23cbd5e1' stroke-width='3' stroke-linecap='round' fill='none' opacity='0.7'/%3E%3C/svg%3E");
    background-size: 80px 80px, 120px 120px, 95px 95px, 160px 160px;
    background-position: 0 0, 40px 60px, 80px 30px, 0 0;
    font-family: 'Outfit', sans-serif;
    color: var(--navy);
    overflow: hidden;
  }

  /* Universal Player Identity Strip */
  .player-header {
    background: #ffffff;
    border: var(--border-w) solid var(--navy);
    border-radius: 22px;
    padding: 8px 14px;
    box-shadow: 0 5px 0 rgba(30, 41, 59, 0.14);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    z-index: 10;
  }
  .player-identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .avatar-frame {
    width: 44px;
    height: 44px;
    border: 2.5px solid var(--navy);
    border-radius: 50%;
    background: #bae6fd;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 0 rgba(0,0,0,0.15);
  }
  .player-name-wrap {
    display: flex;
    flex-direction: column;
  }
  .player-name {
    font-family: 'Fredoka', sans-serif;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.1;
    color: var(--navy);
  }
  .player-sub {
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .player-badge-pill {
    background: var(--navy);
    color: #ffffff;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 900;
    padding: 5px 12px;
    border-radius: 12px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot-online {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
  }

  /* Universal Candy-Arcade Button Mixin */
  .candy-btn {
    border: var(--border-w) solid var(--navy);
    border-radius: 20px;
    font-family: 'Fredoka', sans-serif;
    font-weight: 900;
    text-align: center;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.06s ease, box-shadow 0.06s ease;
  }
  .candy-btn:active {
    transform: translateY(4px);
  }

  /* Soundboard Bottom Strip */
  .soundboard-drawer {
    background: #ffffff;
    border: var(--border-w) solid var(--navy);
    border-radius: 20px;
    padding: 8px 10px;
    box-shadow: 0 4px 0 rgba(30, 41, 59, 0.12);
    margin-top: auto;
  }
  .sb-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    padding: 0 4px;
  }
  .sb-title {
    font-size: 11px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .sb-chips-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 5px;
  }
  .sb-chip {
    background: #f8fafc;
    border: 2px solid var(--navy);
    border-radius: 10px;
    padding: 6px 2px;
    font-family: 'Fredoka', sans-serif;
    font-size: 11px;
    font-weight: 900;
    color: var(--navy);
    text-align: center;
    box-shadow: 0 3px 0 var(--navy);
    cursor: pointer;
  }
  .sb-chip:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--navy);
  }
`;

// =========================================================================
// 1. MOBILE OVERWORLD CONTROLLER (Portrait: 412 x 850)
// =========================================================================
const html_m1_overworld = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Overworld</title>
  <style>
    ${sharedCSS}
    body {
      width: 412px; height: 850px;
      padding: 16px;
      display: flex; flex-direction: column;
    }
    .level-guide-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 22px;
      padding: 12px 16px;
      box-shadow: 0 5px 0 rgba(30, 41, 59, 0.12);
      text-align: center;
      margin-bottom: 14px;
    }
    .guide-title {
      font-family: 'Fredoka', sans-serif;
      font-size: 17px;
      font-weight: 900;
      color: var(--navy);
      margin-bottom: 4px;
    }
    .guide-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dbeafe;
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 4px 12px;
      font-size: 13px;
      font-weight: 900;
      color: #1d4ed8;
    }

    /* Main Controller Area */
    .controller-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 28px;
      padding: 20px 16px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 12px;
    }

    /* Chunky Cross D-Pad */
    .dpad-board {
      width: 220px;
      height: 220px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dpad-cross-bg {
      position: absolute;
      width: 80px;
      height: 220px;
      background: #f1f5f9;
      border: var(--border-w) solid var(--navy);
      border-radius: 22px;
      box-shadow: 0 6px 0 var(--navy);
    }
    .dpad-cross-bg.horiz {
      width: 220px;
      height: 80px;
    }
    .dpad-center-gem {
      position: absolute;
      width: 60px;
      height: 60px;
      background: #e2e8f0;
      border: 3px solid var(--navy);
      border-radius: 16px;
      z-index: 3;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .dpad-btn-dir {
      position: absolute;
      z-index: 5;
      font-family: 'Fredoka', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: var(--navy);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .dpad-btn-dir.up { top: 6px; width: 70px; height: 65px; }
    .dpad-btn-dir.down { bottom: 6px; width: 70px; height: 65px; }
    .dpad-btn-dir.left { left: 6px; width: 65px; height: 70px; }
    .dpad-btn-dir.right { right: 6px; width: 65px; height: 70px; }

    /* Action Buttons in Overworld */
    .overworld-actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn-enter-level {
      width: 100%;
      height: 72px;
      background: #f43f5e;
      color: #ffffff;
      font-size: 24px;
      border-radius: 24px;
      box-shadow: 0 7px 0 var(--c-pink-skirt), 0 7px 0 var(--border-w) var(--navy);
      text-shadow: 0 2px 0 rgba(0,0,0,0.2);
    }
    .btn-enter-level:active {
      box-shadow: 0 2px 0 var(--c-pink-skirt), 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(5px);
    }
    .btn-gather-squad {
      width: 100%;
      height: 52px;
      background: #facc15;
      color: var(--navy);
      font-size: 16px;
      border-radius: 18px;
      box-shadow: 0 5px 0 var(--c-yellow-skirt), 0 5px 0 var(--border-w) var(--navy);
    }
    .btn-gather-squad:active {
      box-shadow: 0 2px 0 var(--c-yellow-skirt), 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(3px);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="player-header">
    <div class="player-identity">
      <div class="avatar-frame">${svgAvatarThumb}</div>
      <div class="player-name-wrap">
        <span class="player-name">Ayrton</span>
        <span class="player-sub">Líder J1</span>
      </div>
    </div>
    <div class="player-badge-pill">
      <span class="dot-online"></span>
      <span>AZUL · P1</span>
    </div>
  </header>

  <!-- Level Guide -->
  <div class="level-guide-card">
    <div class="guide-title">MAPA OVERWORLD CHAVALIL</div>
    <div class="guide-pill">
      <span>📍 Tu posición: Mundo 1-1</span>
      <span style="opacity: 0.6;">·</span>
      <span>Pelotón 4/4</span>
    </div>
  </div>

  <!-- Main Controller Body -->
  <div class="controller-body">
    <!-- D-Pad -->
    <div class="dpad-board">
      <div class="dpad-cross-bg"></div>
      <div class="dpad-cross-bg horiz"></div>
      <div class="dpad-center-gem"></div>
      <div class="dpad-btn-dir up">▲</div>
      <div class="dpad-btn-dir down">▼</div>
      <div class="dpad-btn-dir left">◀</div>
      <div class="dpad-btn-dir right">▶</div>
    </div>

    <!-- Actions -->
    <div class="overworld-actions">
      <div class="candy-btn btn-enter-level">
        ¡ENTRAR AL NIVEL!
      </div>
      <div class="candy-btn btn-gather-squad">
        📢 REUNIR AL PELOTÓN
      </div>
    </div>
  </div>

  <!-- Soundboard -->
  <footer class="soundboard-drawer">
    <div class="sb-header">
      <span class="sb-title">Soundboard Meme</span>
      <span style="font-size: 11px; font-weight: 800; color: #22c55e;">6 SONIDOS</span>
    </div>
    <div class="sb-chips-grid">
      <div class="sb-chip">BOCINA</div>
      <div class="sb-chip">AUUU</div>
      <div class="sb-chip">BING</div>
      <div class="sb-chip">FAAAH</div>
      <div class="sb-chip">OMG</div>
      <div class="sb-chip">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 2. MOBILE MARIO KART (Landscape: 850 x 412)
// =========================================================================
const html_m2_mariokart = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Mario Kart</title>
  <style>
    ${sharedCSS}
    body {
      width: 850px; height: 412px;
      padding: 12px 18px;
      display: flex; flex-direction: column;
    }
    .hud-bar {
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 18px;
      padding: 6px 14px;
      box-shadow: 0 4px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 10px;
    }
    .hud-left {
      display: flex; align-items: center; gap: 10px;
    }
    .hud-title {
      font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 900; color: var(--navy);
    }
    .hud-right {
      display: flex; align-items: center; gap: 8px;
    }
    .hud-pill {
      background: #fef08a; border: 2px solid var(--navy); border-radius: 10px;
      padding: 2px 10px; font-family: 'Fredoka', sans-serif; font-size: 13px; font-weight: 900;
    }

    /* 50% / 50% Two-Thumb Surface */
    .kart-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }

    /* Left Steer Zones */
    .steer-zone-wrapper {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 26px;
      padding: 10px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .btn-steer {
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 20px;
      font-size: 38px;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 6px 0 #7dd3fc, 0 6px 0 var(--border-w) var(--navy);
    }
    .btn-steer span {
      font-size: 14px; font-weight: 900; letter-spacing: 0.5px;
    }
    .btn-steer:active {
      box-shadow: 0 2px 0 #7dd3fc, 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(4px);
    }

    /* Right Action Cluster */
    .action-zone-wrapper {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 26px;
      padding: 10px;
      display: flex; flex-direction: column; gap: 10px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .btn-gas {
      flex: 1.3;
      background: #22c55e;
      color: #ffffff;
      font-size: 26px;
      border-radius: 18px;
      box-shadow: 0 6px 0 var(--c-green-skirt), 0 6px 0 var(--border-w) var(--navy);
      text-shadow: 0 2px 0 rgba(0,0,0,0.15);
    }
    .btn-gas:active {
      box-shadow: 0 2px 0 var(--c-green-skirt), 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(4px);
    }
    .sub-actions-row {
      flex: 1; display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px;
    }
    .btn-drift {
      background: #f43f5e;
      color: #ffffff;
      font-size: 18px;
      border-radius: 16px;
      box-shadow: 0 5px 0 var(--c-pink-skirt), 0 5px 0 var(--border-w) var(--navy);
    }
    .btn-drift:active {
      box-shadow: 0 2px 0 var(--c-pink-skirt), 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(3px);
    }
    .btn-item {
      background: #facc15;
      color: var(--navy);
      font-size: 18px;
      border-radius: 16px;
      box-shadow: 0 5px 0 var(--c-yellow-skirt), 0 5px 0 var(--border-w) var(--navy);
    }
    .btn-item:active {
      box-shadow: 0 2px 0 var(--c-yellow-skirt), 0 2px 0 var(--border-w) var(--navy);
      transform: translateY(3px);
    }
  </style>
</head>
<body>
  <div class="hud-bar">
    <div class="hud-left">
      <div class="avatar-frame" style="width: 34px; height: 34px;">${svgAvatarSmall}</div>
      <span class="hud-title">🏎️ MARIO KART · AYRTON (P1)</span>
    </div>
    <div class="hud-right">
      <span class="hud-pill">🏁 VUELTA 2 / 3</span>
      <span class="hud-pill" style="background: #bae6fd;">POS: 1º</span>
    </div>
  </div>

  <div class="kart-surface">
    <!-- Left Steer 50% -->
    <div class="steer-zone-wrapper">
      <div class="candy-btn btn-steer">
        ◀
        <span>IZQUIERDA</span>
      </div>
      <div class="candy-btn btn-steer">
        ▶
        <span>DERECHA</span>
      </div>
    </div>

    <!-- Right Clúster 50% -->
    <div class="action-zone-wrapper">
      <div class="candy-btn btn-gas">
        🟢 ACELERAR
      </div>
      <div class="sub-actions-row">
        <div class="candy-btn btn-drift">
          ⚡ DERRAPE
        </div>
        <div class="candy-btn btn-item">
          ❓ OBJETO
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =========================================================================
// 3. MOBILE SUPER SMASH (Landscape: 850 x 412)
// =========================================================================
const html_m3_supersmash = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Super Smash</title>
  <style>
    ${sharedCSS}
    body {
      width: 850px; height: 412px;
      padding: 12px 18px;
      display: flex; flex-direction: column;
    }
    .hud-bar {
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 18px;
      padding: 6px 14px;
      box-shadow: 0 4px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 10px;
    }
    .hud-title {
      font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 900; color: var(--navy);
      display: flex; align-items: center; gap: 8px;
    }
    .damage-pill {
      background: #fee2e2; border: 2.5px solid #ef4444; border-radius: 12px;
      padding: 3px 14px; font-family: 'Fredoka', sans-serif; font-size: 16px; font-weight: 900; color: #b91c1c;
    }

    .smash-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }

    /* Left D-Pad Card */
    .dpad-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 26px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .dpad-cross {
      width: 190px; height: 190px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .cross-bar {
      position: absolute; width: 68px; height: 190px; background: #f1f5f9;
      border: var(--border-w) solid var(--navy); border-radius: 20px;
      box-shadow: 0 5px 0 var(--navy);
    }
    .cross-bar.horiz { width: 190px; height: 68px; }
    .cross-center {
      position: absolute; width: 52px; height: 52px; background: #e2e8f0;
      border: 3px solid var(--navy); border-radius: 14px; z-index: 3;
    }
    .dpad-btn {
      position: absolute; z-index: 5; font-family: 'Fredoka', sans-serif;
      font-size: 22px; font-weight: 900; color: var(--navy);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
    }
    .dpad-btn.up { top: 4px; width: 64px; height: 58px; color: #ca8a04; }
    .dpad-btn.down { bottom: 4px; width: 64px; height: 58px; }
    .dpad-btn.left { left: 4px; width: 58px; height: 64px; }
    .dpad-btn.right { right: 4px; width: 58px; height: 64px; }

    /* Right Candy Diamond Cluster */
    .diamond-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 26px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
      position: relative;
    }
    .diamond-grid {
      width: 250px; height: 250px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .diamond-btn {
      position: absolute;
      width: 76px; height: 76px;
      border-radius: 50%;
      font-size: 22px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .diamond-btn span { font-size: 10px; font-weight: 900; margin-top: -2px; }
    
    /* X: Jump (Top) */
    .btn-x {
      top: 6px;
      background: #38bdf8; color: #ffffff;
      box-shadow: 0 6px 0 var(--c-cyan-skirt), 0 6px 0 var(--border-w) var(--navy);
    }
    /* Y: Shield (Left) */
    .btn-y {
      left: 6px;
      background: #22c55e; color: #ffffff;
      box-shadow: 0 6px 0 var(--c-green-skirt), 0 6px 0 var(--border-w) var(--navy);
    }
    /* A: Attack (Right) */
    .btn-a {
      right: 6px;
      background: #f43f5e; color: #ffffff;
      box-shadow: 0 6px 0 var(--c-pink-skirt), 0 6px 0 var(--border-w) var(--navy);
    }
    /* B: Special (Bottom) */
    .btn-b {
      bottom: 6px;
      background: #facc15; color: var(--navy);
      box-shadow: 0 6px 0 var(--c-yellow-skirt), 0 6px 0 var(--border-w) var(--navy);
    }
  </style>
</head>
<body>
  <div class="hud-bar">
    <div class="hud-title">
      <div class="avatar-frame" style="width: 34px; height: 34px;">${svgAvatarSmall}</div>
      <span>💥 SUPER SMASH CHAVALIL · AYRTON</span>
    </div>
    <div class="damage-pill">
      DAÑO: 28%
    </div>
  </div>

  <div class="smash-surface">
    <!-- D-Pad Left -->
    <div class="dpad-card">
      <div class="dpad-cross">
        <div class="cross-bar"></div>
        <div class="cross-bar horiz"></div>
        <div class="cross-center"></div>
        <div class="dpad-btn up">▲</div>
        <div class="dpad-btn down">▼</div>
        <div class="dpad-btn left">◀</div>
        <div class="dpad-btn right">▶</div>
      </div>
    </div>

    <!-- Diamond Right -->
    <div class="diamond-card">
      <div class="diamond-grid">
        <div class="candy-btn diamond-btn btn-x">
          X
          <span>SALTO</span>
        </div>
        <div class="candy-btn diamond-btn btn-y">
          Y
          <span>ESCUDO</span>
        </div>
        <div class="candy-btn diamond-btn btn-a">
          A
          <span>GOLPE</span>
        </div>
        <div class="candy-btn diamond-btn btn-b">
          B
          <span>ESPECIAL</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =========================================================================
// 4. MOBILE BUTTON BASH BUZZER (Portrait: 412 x 850)
// =========================================================================
const html_m4_buttonbash = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Button Bash</title>
  <style>
    ${sharedCSS}
    body {
      width: 412px; height: 850px;
      padding: 16px;
      display: flex; flex-direction: column;
    }
    .guide-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 22px;
      padding: 12px 16px;
      box-shadow: 0 5px 0 rgba(30, 41, 59, 0.12);
      text-align: center;
      margin-bottom: 16px;
    }
    .guide-card h2 {
      font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 900; color: var(--navy);
    }
    .guide-card p {
      font-size: 13px; font-weight: 800; color: #64748b; margin-top: 2px;
    }

    /* Huge Balanced Buzzer Card */
    .buzzer-area {
      flex: 1;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 32px;
      padding: 24px 20px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin-bottom: 14px;
      position: relative;
    }
    .target-hint-pill {
      background: #dbeafe; border: 2px solid #3b82f6; border-radius: 14px;
      padding: 6px 16px; font-family: 'Fredoka', sans-serif; font-size: 14px; font-weight: 900; color: #1d4ed8;
      margin-bottom: 30px;
    }
    .huge-buzzer {
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: #38bdf8;
      color: #ffffff;
      border: 5px solid var(--navy);
      box-shadow: 0 12px 0 var(--c-cyan-skirt), 0 12px 0 5px var(--navy);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer;
      transition: transform 0.05s ease, box-shadow 0.05s ease;
    }
    .huge-buzzer:active {
      transform: translateY(8px);
      box-shadow: 0 4px 0 var(--c-cyan-skirt), 0 4px 0 5px var(--navy);
    }
    .buzzer-icon {
      font-size: 48px; margin-bottom: 4px;
    }
    .buzzer-txt {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900;
      letter-spacing: 1px; text-shadow: 0 2px 0 rgba(0,0,0,0.2);
    }
    .buzzer-sub {
      font-size: 13px; font-weight: 900; opacity: 0.85; text-transform: uppercase;
    }
  </style>
</head>
<body>
  <header class="player-header">
    <div class="player-identity">
      <div class="avatar-frame">${svgAvatarThumb}</div>
      <div class="player-name-wrap">
        <span class="player-name">Ayrton</span>
        <span class="player-sub">P1 · AZUL</span>
      </div>
    </div>
    <div class="player-badge-pill" style="background: #38bdf8; color: var(--navy);">
      🎯 BUTTON BASH
    </div>
  </header>

  <div class="guide-card">
    <h2>🎯 DIANA DE DARDOS</h2>
    <p>1º Pulso: Fija la X · 2º Pulso: Fija la Y</p>
  </div>

  <div class="buzzer-area">
    <div class="target-hint-pill">
      ¡MIRA A LA TELEVISIÓN Y CLAVA EL CENTRO!
    </div>
    <div class="huge-buzzer">
      <div class="buzzer-icon">🎯</div>
      <div class="buzzer-txt">¡PULSA!</div>
      <div class="buzzer-sub">DISPARAR DARDO</div>
    </div>
  </div>

  <footer class="soundboard-drawer">
    <div class="sb-chips-grid">
      <div class="sb-chip">BOCINA</div>
      <div class="sb-chip">AUUU</div>
      <div class="sb-chip">BING</div>
      <div class="sb-chip">FAAAH</div>
      <div class="sb-chip">OMG</div>
      <div class="sb-chip">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 5. MOBILE 4-CANDY TRIVIAL / REFLEX (Portrait: 412 x 850)
// =========================================================================
const html_m5_candyquad = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando 4 Botones</title>
  <style>
    ${sharedCSS}
    body {
      width: 412px; height: 850px;
      padding: 16px;
      display: flex; flex-direction: column;
    }
    .guide-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 22px;
      padding: 12px 16px;
      box-shadow: 0 5px 0 rgba(30, 41, 59, 0.12);
      text-align: center;
      margin-bottom: 14px;
    }
    .guide-card h2 {
      font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 900; color: var(--navy);
    }
    .quad-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 14px;
      margin-bottom: 12px;
      position: relative;
    }
    .quad-btn {
      border-radius: 28px;
      font-size: 54px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .quad-btn span {
      font-size: 15px; font-weight: 900; letter-spacing: 0.5px; margin-top: -4px;
    }
    .q-a {
      background: #f43f5e; color: #ffffff;
      box-shadow: 0 8px 0 var(--c-pink-skirt), 0 8px 0 var(--border-w) var(--navy);
    }
    .q-b {
      background: #22c55e; color: #ffffff;
      box-shadow: 0 8px 0 var(--c-green-skirt), 0 8px 0 var(--border-w) var(--navy);
    }
    .q-x {
      background: #38bdf8; color: #ffffff;
      box-shadow: 0 8px 0 var(--c-cyan-skirt), 0 8px 0 var(--border-w) var(--navy);
    }
    .q-y {
      background: #facc15; color: var(--navy);
      box-shadow: 0 8px 0 var(--c-yellow-skirt), 0 8px 0 var(--border-w) var(--navy);
    }
    .center-badge {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 52px; height: 52px;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 50%;
      box-shadow: 0 4px 0 var(--navy);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 900; color: var(--navy);
      z-index: 10;
    }
  </style>
</head>
<body>
  <header class="player-header">
    <div class="player-identity">
      <div class="avatar-frame">${svgAvatarThumb}</div>
      <div class="player-name-wrap">
        <span class="player-name">Ayrton</span>
        <span class="player-sub">P1 · AZUL</span>
      </div>
    </div>
    <div class="player-badge-pill" style="background: #facc15; color: var(--navy);">
      ⚡ REFLEJOS
    </div>
  </header>

  <div class="guide-card">
    <h2>¡RÁPIDO! ¡PULSA EN LA TELEVISIÓN!</h2>
  </div>

  <div class="quad-grid">
    <div class="center-badge">VS</div>
    <div class="candy-btn quad-btn q-a">
      A
      <span>OPCIÓN A</span>
    </div>
    <div class="candy-btn quad-btn q-b">
      B
      <span>OPCIÓN B</span>
    </div>
    <div class="candy-btn quad-btn q-x">
      X
      <span>OPCIÓN C</span>
    </div>
    <div class="candy-btn quad-btn q-y">
      Y
      <span>OPCIÓN D</span>
    </div>
  </div>

  <footer class="soundboard-drawer">
    <div class="sb-chips-grid">
      <div class="sb-chip">BOCINA</div>
      <div class="sb-chip">AUUU</div>
      <div class="sb-chip">BING</div>
      <div class="sb-chip">FAAAH</div>
      <div class="sb-chip">OMG</div>
      <div class="sb-chip">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 6. ROTATE PHONE PROMPT (Landscape/Portrait Switch: 850 x 412)
// =========================================================================
const html_m6_rotate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Gira el Móvil</title>
  <style>
    ${sharedCSS}
    body {
      width: 850px; height: 412px;
      display: flex; align-items: center; justify-content: center;
      background: var(--navy-dark);
      color: #ffffff;
      padding: 24px;
    }
    .rotate-card {
      background: #1e293b;
      border: 4px solid #38bdf8;
      border-radius: 32px;
      padding: 36px 48px;
      box-shadow: 0 14px 40px rgba(0,0,0,0.6);
      display: flex; flex-direction: column; align-items: center; text-align: center;
      max-width: 620px;
    }
    .rotate-badge {
      background: #f43f5e; color: #ffffff;
      font-family: 'Fredoka', sans-serif; font-size: 14px; font-weight: 900;
      padding: 4px 16px; border-radius: 12px; margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    .rotate-icon {
      font-size: 54px; margin-bottom: 12px;
      animation: wiggle 1.8s ease-in-out infinite;
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-25deg); }
      75% { transform: rotate(90deg); }
    }
    .rotate-title {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900;
      color: #facc15; margin-bottom: 8px;
    }
    .rotate-sub {
      font-size: 18px; font-weight: 700; color: #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="rotate-card">
    <div class="rotate-badge">MINIJUEGO DE VELOCIDAD</div>
    <div class="rotate-icon">📱 ↷</div>
    <h1 class="rotate-title">¡GIRA EL MÓVIL EN HORIZONTAL!</h1>
    <p class="rotate-sub">Para jugar cómodamente con los dos pulgares en pantalla</p>
  </div>
</body>
</html>`;

// =========================================================================
// WRITE ALL FILES & CAPTURE
// =========================================================================
fs.writeFileSync('design/directions/mando-1-overworld.html', html_m1_overworld);
fs.writeFileSync('design/directions/mando-2-mariokart.html', html_m2_mariokart);
fs.writeFileSync('design/directions/mando-3-supersmash.html', html_m3_supersmash);
fs.writeFileSync('design/directions/mando-4-buttonbash.html', html_m4_buttonbash);
fs.writeFileSync('design/directions/mando-5-candyquad.html', html_m5_candyquad);
fs.writeFileSync('design/directions/mando-6-rotate.html', html_m6_rotate);

console.log('Mobile HTMLs created.');

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();

  const tasks = [
    { html: 'design/directions/mando-1-overworld.html', out: 'design/directions/mando-1-overworld.png', w: 412, h: 850 },
    { html: 'design/directions/mando-2-mariokart.html', out: 'design/directions/mando-2-mariokart.png', w: 850, h: 412 },
    { html: 'design/directions/mando-3-supersmash.html', out: 'design/directions/mando-3-supersmash.png', w: 850, h: 412 },
    { html: 'design/directions/mando-4-buttonbash.html', out: 'design/directions/mando-4-buttonbash.png', w: 412, h: 850 },
    { html: 'design/directions/mando-5-candyquad.html', out: 'design/directions/mando-5-candyquad.png', w: 412, h: 850 },
    { html: 'design/directions/mando-6-rotate.html', out: 'design/directions/mando-6-rotate.png', w: 850, h: 412 }
  ];

  for (const t of tasks) {
    const full = path.resolve(t.html);
    await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 2 });
    await page.goto('file:///' + full.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: t.out });
    console.log('Captured:', t.out);
  }

  await browser.close();
  console.log('All mobile controller captures complete!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
