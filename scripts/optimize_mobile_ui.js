const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { renderAvatarSVG, AVATAR_PRESETS } = require('../public/js/avatar-engine.js');

const pAyrton = AVATAR_PRESETS.find(p => p.id === 'ayrton') || AVATAR_PRESETS[0];
const svgAvatarThumb = renderAvatarSVG(pAyrton.config, 56);
const svgAvatarSmall = renderAvatarSVG(pAyrton.config, 42);

// Premium Doodle Pop Candy-Arcade Design System
const masterCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');

  :root {
    --navy: #1e293b;
    --navy-dark: #0f172a;
    --navy-skirt: #090d16;
    --border-w: 3.5px;
    --border-btn: 3.5px;
    
    /* Vibrant Candy Palette */
    --c-cyan: #38bdf8;
    --c-cyan-top: #7dd3fc;
    --c-cyan-skirt: #0284c7;

    --c-green: #22c55e;
    --c-green-top: #86efac;
    --c-green-skirt: #15803d;

    --c-pink: #f43f5e;
    --c-pink-top: #fda4af;
    --c-pink-skirt: #be123c;

    --c-yellow: #facc15;
    --c-yellow-top: #fef08a;
    --c-yellow-skirt: #ca8a04;

    --c-orange: #fb923c;
    --c-orange-top: #fed7aa;
    --c-orange-skirt: #c2410c;

    --c-purple: #a855f7;
    --c-purple-top: #d8b4fe;
    --c-purple-skirt: #7e22ce;

    --c-slate-btn: #ffffff;
    --c-slate-top: #ffffff;
    --c-slate-skirt: #cbd5e1;
  }

  * {
    margin: 0; padding: 0; box-sizing: border-box;
    user-select: none; -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: #f0f7ff;
    /* Soft doodle squiggly wavy SVG pattern + pastel confetti */
    background-image: 
      radial-gradient(#38bdf8 2px, transparent 2.5px),
      radial-gradient(#f43f5e 2px, transparent 2.5px),
      radial-gradient(#facc15 2px, transparent 2.5px),
      url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 20 Q 30 5, 50 25 T 90 20 T 125 45 Q 110 75, 80 55 T 40 75 T 15 105 Q 35 135, 65 125 T 115 135' stroke='%23cbd5e1' stroke-width='2.8' stroke-linecap='round' fill='none' opacity='0.75'/%3E%3C/svg%3E");
    background-size: 70px 70px, 110px 110px, 90px 90px, 140px 140px;
    background-position: 0 0, 35px 55px, 70px 25px, 0 0;
    font-family: 'Outfit', sans-serif;
    color: var(--navy);
    overflow: hidden;
  }

  /* JUICY CANDY BUTTON ENGINE */
  .candy-btn {
    border: var(--border-btn) solid var(--navy);
    font-family: 'Fredoka', sans-serif;
    font-weight: 900;
    text-align: center;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      inset 0 3px 0 rgba(255,255,255,0.55),
      inset 0 -3px 0 rgba(0,0,0,0.12),
      0 6px 0 var(--btn-skirt, #94a3b8),
      0 6px 0 var(--border-btn) var(--navy);
    transition: transform 0.05s ease, box-shadow 0.05s ease;
  }
  .candy-btn:active {
    transform: translateY(4px);
    box-shadow: 
      inset 0 2px 0 rgba(255,255,255,0.4),
      inset 0 -2px 0 rgba(0,0,0,0.1),
      0 2px 0 var(--btn-skirt, #94a3b8),
      0 2px 0 var(--border-btn) var(--navy);
  }

  .btn-cyan {
    background: linear-gradient(180deg, var(--c-cyan-top) 0%, var(--c-cyan) 60%);
    color: #ffffff;
    --btn-skirt: var(--c-cyan-skirt);
    text-shadow: 0 2px 0 rgba(2, 132, 199, 0.7);
  }
  .btn-green {
    background: linear-gradient(180deg, var(--c-green-top) 0%, var(--c-green) 60%);
    color: #ffffff;
    --btn-skirt: var(--c-green-skirt);
    text-shadow: 0 2px 0 rgba(21, 128, 61, 0.7);
  }
  .btn-pink {
    background: linear-gradient(180deg, var(--c-pink-top) 0%, var(--c-pink) 60%);
    color: #ffffff;
    --btn-skirt: var(--c-pink-skirt);
    text-shadow: 0 2px 0 rgba(190, 18, 60, 0.7);
  }
  .btn-yellow {
    background: linear-gradient(180deg, var(--c-yellow-top) 0%, var(--c-yellow) 60%);
    color: var(--navy);
    --btn-skirt: var(--c-yellow-skirt);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  .btn-orange {
    background: linear-gradient(180deg, var(--c-orange-top) 0%, var(--c-orange) 60%);
    color: #ffffff;
    --btn-skirt: var(--c-orange-skirt);
    text-shadow: 0 2px 0 rgba(194, 65, 12, 0.7);
  }
  .btn-white {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    color: var(--navy);
    --btn-skirt: var(--c-slate-skirt);
  }

  /* Universal Player Header */
  .player-strip-card {
    background: #ffffff;
    border: var(--border-w) solid var(--navy);
    border-radius: 24px;
    padding: 8px 14px;
    box-shadow: 0 5px 0 rgba(30, 41, 59, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    position: relative;
    z-index: 10;
  }
  .player-identity-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .player-avatar-circle {
    width: 48px;
    height: 48px;
    border: 3px solid var(--navy);
    border-radius: 50%;
    background: #bae6fd;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 0 rgba(0,0,0,0.12);
  }
  .player-text-group {
    display: flex;
    flex-direction: column;
  }
  .player-nickname {
    font-family: 'Fredoka', sans-serif;
    font-size: 21px;
    font-weight: 900;
    line-height: 1.1;
    color: var(--navy);
  }
  .player-role-sub {
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .player-tag-pill {
    background: var(--navy);
    color: #ffffff;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 900;
    padding: 6px 14px;
    border-radius: 14px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 3px 0 rgba(0,0,0,0.15);
  }
  .tag-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
  }

  /* Soundboard Bottom Strip */
  .soundboard-card {
    background: #ffffff;
    border: var(--border-w) solid var(--navy);
    border-radius: 20px;
    padding: 8px 10px;
    box-shadow: 0 4px 0 rgba(30, 41, 59, 0.1);
    margin-top: auto;
  }
  .soundboard-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 5px;
  }
  .sb-mini-btn {
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
  .sb-mini-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--navy);
  }
`;

// =========================================================================
// 1. OPTIMIZED OVERWORLD (Portrait: 412 x 850)
// =========================================================================
const html_opt_overworld = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Overworld - Optimizado</title>
  <style>
    ${masterCSS}
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
      margin-bottom: 12px;
    }
    .guide-title {
      font-family: 'Fredoka', sans-serif;
      font-size: 18px;
      font-weight: 900;
      color: var(--navy);
      margin-bottom: 4px;
    }
    .guide-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e0f2fe;
      border: 2px solid #0284c7;
      border-radius: 12px;
      padding: 4px 14px;
      font-size: 13px;
      font-weight: 900;
      color: #0369a1;
    }

    /* Tactile Main Board */
    .tactile-board {
      flex: 1;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 32px;
      padding: 24px 20px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      margin-bottom: 12px;
    }

    /* Chunky Arcade D-PAD with Candy Inset */
    .arcade-dpad {
      width: 230px;
      height: 230px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dpad-track {
      position: absolute;
      width: 82px;
      height: 230px;
      background: #e2e8f0;
      border: var(--border-w) solid var(--navy);
      border-radius: 24px;
      box-shadow: inset 0 4px 8px rgba(0,0,0,0.12);
    }
    .dpad-track.horizontal {
      width: 230px;
      height: 82px;
    }
    .dpad-center-hub {
      position: absolute;
      width: 68px;
      height: 68px;
      background: #cbd5e1;
      border: 3px solid var(--navy);
      border-radius: 18px;
      z-index: 4;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
      display: flex; align-items: center; justify-content: center;
    }
    .dpad-center-hub::after {
      content: '';
      width: 22px; height: 22px;
      background: #94a3b8;
      border-radius: 50%;
      border: 2px solid var(--navy);
    }

    /* The 4 directional wings */
    .dpad-wing {
      position: absolute;
      z-index: 6;
      border-radius: 18px;
      font-family: 'Fredoka', sans-serif;
      font-size: 26px;
      color: var(--navy);
      cursor: pointer;
    }
    .dpad-wing.up {
      top: 6px; width: 72px; height: 70px;
    }
    .dpad-wing.down {
      bottom: 6px; width: 72px; height: 70px;
    }
    .dpad-wing.left {
      left: 6px; width: 70px; height: 72px;
    }
    .dpad-wing.right {
      right: 6px; width: 70px; height: 72px;
    }

    /* Actions */
    .actions-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn-action-main {
      width: 100%;
      height: 74px;
      border-radius: 24px;
      font-size: 23px;
      letter-spacing: 0.5px;
    }
    .btn-action-secondary {
      width: 100%;
      height: 52px;
      border-radius: 18px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="player-strip-card">
    <div class="player-identity-group">
      <div class="player-avatar-circle">${svgAvatarThumb}</div>
      <div class="player-text-group">
        <span class="player-nickname">Ayrton</span>
        <span class="player-role-sub">Anfitrión J1</span>
      </div>
    </div>
    <div class="player-tag-pill">
      <span class="tag-dot"></span>
      <span>AZUL · P1</span>
    </div>
  </header>

  <!-- Level Guide -->
  <div class="guide-card">
    <div class="guide-title">MAPA OVERWORLD</div>
    <div class="guide-pill">
      <span>📍 Mundo 1-1</span>
      <span style="opacity: 0.6;">·</span>
      <span>Pelotón 4/4 Listo</span>
    </div>
  </div>

  <!-- Tactile Board -->
  <div class="tactile-board">
    <!-- D-Pad -->
    <div class="arcade-dpad">
      <div class="dpad-track"></div>
      <div class="dpad-track horizontal"></div>
      <div class="dpad-center-hub"></div>
      
      <div class="candy-btn btn-cyan dpad-wing up">▲</div>
      <div class="candy-btn btn-cyan dpad-wing down">▼</div>
      <div class="candy-btn btn-cyan dpad-wing left">◀</div>
      <div class="candy-btn btn-cyan dpad-wing right">▶</div>
    </div>

    <!-- Actions -->
    <div class="actions-box">
      <div class="candy-btn btn-pink btn-action-main">
        ¡ENTRAR AL NIVEL!
      </div>
      <div class="candy-btn btn-yellow btn-action-secondary">
        📢 REUNIR PELOTÓN
      </div>
    </div>
  </div>

  <!-- Soundboard -->
  <footer class="soundboard-card">
    <div class="soundboard-grid">
      <div class="sb-mini-btn">BOCINA</div>
      <div class="sb-mini-btn">AUUU</div>
      <div class="sb-mini-btn">BING</div>
      <div class="sb-mini-btn">FAAAH</div>
      <div class="sb-mini-btn">OMG</div>
      <div class="sb-mini-btn">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 2. OPTIMIZED MARIO KART (Landscape: 850 x 412)
// =========================================================================
const html_opt_mariokart = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Mario Kart - Optimizado</title>
  <style>
    ${masterCSS}
    body {
      width: 850px; height: 412px;
      padding: 12px 18px;
      display: flex; flex-direction: column;
    }
    .kart-hud {
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 20px;
      padding: 6px 14px;
      box-shadow: 0 4px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 10px;
    }
    .kart-hud-left {
      display: flex; align-items: center; gap: 10px;
    }
    .hud-game-name {
      font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 900; color: var(--navy);
    }
    .hud-pills-row {
      display: flex; align-items: center; gap: 8px;
    }
    .lap-pill {
      background: #fef08a; border: 2px solid var(--navy); border-radius: 12px;
      padding: 3px 12px; font-family: 'Fredoka', sans-serif; font-size: 13px; font-weight: 900;
    }
    .pos-pill {
      background: #bae6fd; border: 2px solid #0284c7; border-radius: 12px;
      padding: 3px 12px; font-family: 'Fredoka', sans-serif; font-size: 13px; font-weight: 900; color: #0369a1;
    }

    /* 50% / 50% Thumb Surface */
    .kart-dual-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }

    /* Left Steer Paddle Card */
    .steer-paddles-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 28px;
      padding: 12px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .steer-paddle {
      border-radius: 22px;
      flex-direction: column;
      gap: 8px;
      font-size: 44px;
    }
    .steer-label {
      font-size: 14px; font-weight: 900; letter-spacing: 0.5px;
    }
    .steer-grip {
      display: flex; gap: 4px; opacity: 0.5; margin-top: -4px;
    }
    .grip-line {
      width: 14px; height: 3.5px; background: currentColor; border-radius: 3px;
    }

    /* Right Action Clúster Card */
    .actions-cluster-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 28px;
      padding: 12px;
      display: flex; flex-direction: column; gap: 12px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .throttle-pedal {
      flex: 1.35;
      border-radius: 20px;
      font-size: 26px;
      letter-spacing: 0.5px;
      display: flex; align-items: center; justify-content: center; gap: 12px;
    }
    .pedal-grip-stripes {
      display: flex; flex-direction: column; gap: 4px; opacity: 0.45;
    }
    .pedal-stripe {
      width: 24px; height: 3.5px; background: #ffffff; border-radius: 2px;
    }
    .sub-actions-split {
      flex: 1; display: grid; grid-template-columns: 1fr 1.15fr; gap: 12px;
    }
    .btn-drift-pill {
      border-radius: 18px;
      font-size: 18px;
      letter-spacing: 0.5px;
      gap: 6px;
    }
    .btn-item-pill {
      border-radius: 18px;
      font-size: 18px;
      letter-spacing: 0.5px;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="kart-hud">
    <div class="kart-hud-left">
      <div class="player-avatar-circle" style="width: 36px; height: 36px;">${svgAvatarSmall}</div>
      <span class="hud-game-name">🏎️ MARIO KART · AYRTON</span>
    </div>
    <div class="hud-pills-row">
      <span class="lap-pill">🏁 VUELTA 2 / 3</span>
      <span class="pos-pill">POS: 1º</span>
    </div>
  </div>

  <div class="kart-dual-surface">
    <!-- Left Steer 50% -->
    <div class="steer-paddles-card">
      <div class="candy-btn btn-cyan steer-paddle">
        <span>◀</span>
        <span class="steer-label">IZQUIERDA</span>
        <div class="steer-grip"><span class="grip-line"></span><span class="grip-line"></span><span class="grip-line"></span></div>
      </div>
      <div class="candy-btn btn-cyan steer-paddle">
        <span>▶</span>
        <span class="steer-label">DERECHA</span>
        <div class="steer-grip"><span class="grip-line"></span><span class="grip-line"></span><span class="grip-line"></span></div>
      </div>
    </div>

    <!-- Right Clúster 50% -->
    <div class="actions-cluster-card">
      <div class="candy-btn btn-green throttle-pedal">
        <div class="pedal-grip-stripes">
          <span class="pedal-stripe"></span><span class="pedal-stripe"></span><span class="pedal-stripe"></span>
        </div>
        <span>🟢 ACELERAR</span>
        <div class="pedal-grip-stripes">
          <span class="pedal-stripe"></span><span class="pedal-stripe"></span><span class="pedal-stripe"></span>
        </div>
      </div>

      <div class="sub-actions-split">
        <div class="candy-btn btn-pink btn-drift-pill">
          ⚡ DERRAPE
        </div>
        <div class="candy-btn btn-yellow btn-item-pill">
          ❓ OBJETO
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =========================================================================
// 3. OPTIMIZED SUPER SMASH (Landscape: 850 x 412)
// =========================================================================
const html_opt_supersmash = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Super Smash - Optimizado</title>
  <style>
    ${masterCSS}
    body {
      width: 850px; height: 412px;
      padding: 12px 18px;
      display: flex; flex-direction: column;
    }
    .smash-hud {
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 20px;
      padding: 6px 14px;
      box-shadow: 0 4px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 10px;
    }
    .hud-title {
      font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 900; color: var(--navy);
      display: flex; align-items: center; gap: 8px;
    }
    .damage-display-pill {
      background: #fee2e2; border: 2.5px solid #ef4444; border-radius: 12px;
      padding: 4px 16px; font-family: 'Fredoka', sans-serif; font-size: 16px; font-weight: 900; color: #b91c1c;
      box-shadow: 0 2px 0 rgba(239, 68, 68, 0.2);
    }

    .smash-dual-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }

    /* Left D-Pad Combat Card */
    .combat-dpad-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 28px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .combat-dpad {
      width: 210px; height: 210px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .dpad-track-s {
      position: absolute; width: 72px; height: 210px; background: #e2e8f0;
      border: var(--border-w) solid var(--navy); border-radius: 22px;
      box-shadow: inset 0 3px 6px rgba(0,0,0,0.12);
    }
    .dpad-track-s.horiz { width: 210px; height: 72px; }
    .dpad-hub-s {
      position: absolute; width: 58px; height: 58px; background: #cbd5e1;
      border: 3px solid var(--navy); border-radius: 16px; z-index: 4;
    }
    .dpad-s-btn {
      position: absolute; z-index: 6; border-radius: 16px;
      font-family: 'Fredoka', sans-serif; font-size: 24px; color: var(--navy);
      cursor: pointer;
    }
    .dpad-s-btn.up { top: 6px; width: 64px; height: 60px; }
    .dpad-s-btn.down { bottom: 6px; width: 64px; height: 60px; }
    .dpad-s-btn.left { left: 6px; width: 60px; height: 64px; }
    .dpad-s-btn.right { right: 6px; width: 60px; height: 64px; }

    /* Right Candy Diamond Actions Card */
    .actions-diamond-card {
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 28px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
    }
    .diamond-holder {
      width: 260px; height: 260px; position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .candy-action-bubble {
      position: absolute;
      width: 82px; height: 82px;
      border-radius: 50%;
      font-size: 24px;
      flex-direction: column;
      gap: 1px;
    }
    .action-sub-lbl {
      font-size: 11px; font-weight: 900; letter-spacing: 0.5px;
    }

    /* Top: X (Jump) */
    .act-x { top: 6px; }
    /* Left: Y (Shield) */
    .act-y { left: 6px; }
    /* Right: A (Attack) */
    .act-a { right: 6px; }
    /* Bottom: B (Special) */
    .act-b { bottom: 6px; }
  </style>
</head>
<body>
  <div class="smash-hud">
    <div class="hud-title">
      <div class="player-avatar-circle" style="width: 36px; height: 36px;">${svgAvatarSmall}</div>
      <span>💥 SUPER SMASH · AYRTON (P1)</span>
    </div>
    <div class="damage-display-pill">
      DAÑO: 28%
    </div>
  </div>

  <div class="smash-dual-surface">
    <!-- D-Pad Left -->
    <div class="combat-dpad-card">
      <div class="combat-dpad">
        <div class="dpad-track-s"></div>
        <div class="dpad-track-s horiz"></div>
        <div class="dpad-hub-s"></div>
        
        <div class="candy-btn btn-yellow dpad-s-btn up">▲</div>
        <div class="candy-btn btn-cyan dpad-s-btn down">▼</div>
        <div class="candy-btn btn-cyan dpad-s-btn left">◀</div>
        <div class="candy-btn btn-cyan dpad-s-btn right">▶</div>
      </div>
    </div>

    <!-- Diamond Right -->
    <div class="actions-diamond-card">
      <div class="diamond-holder">
        <div class="candy-btn btn-cyan candy-action-bubble act-x">
          <span>X</span>
          <span class="action-sub-lbl">SALTO</span>
        </div>
        <div class="candy-btn btn-green candy-action-bubble act-y">
          <span>Y</span>
          <span class="action-sub-lbl">ESCUDO</span>
        </div>
        <div class="candy-btn btn-pink candy-action-bubble act-a">
          <span>A</span>
          <span class="action-sub-lbl">GOLPE</span>
        </div>
        <div class="candy-btn btn-yellow candy-action-bubble act-b">
          <span>B</span>
          <span class="action-sub-lbl">ESPECIAL</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =========================================================================
// 4. OPTIMIZED BUTTON BASH BUZZER (Portrait: 412 x 850)
// =========================================================================
const html_opt_buttonbash = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando Button Bash - Optimizado</title>
  <style>
    ${masterCSS}
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
      font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 900; color: var(--navy);
    }
    .guide-card p {
      font-size: 13px; font-weight: 800; color: #64748b; margin-top: 2px;
    }

    /* Giant Candy Arcade Buzzer Dome */
    .buzzer-stage-card {
      flex: 1;
      background: #ffffff;
      border: var(--border-w) solid var(--navy);
      border-radius: 32px;
      padding: 24px 20px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .target-status-pill {
      background: #fef08a; border: 2px solid var(--navy); border-radius: 14px;
      padding: 6px 16px; font-family: 'Fredoka', sans-serif; font-size: 14px; font-weight: 900; color: var(--navy);
      margin-bottom: 28px; box-shadow: 0 3px 0 rgba(0,0,0,0.1);
    }
    .huge-arcade-dome {
      width: 255px;
      height: 255px;
      border-radius: 50%;
      border: 4.5px solid var(--navy);
      background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%);
      color: #ffffff;
      box-shadow: 
        inset 0 6px 0 rgba(255,255,255,0.65),
        inset 0 -8px 0 rgba(0,0,0,0.2),
        0 14px 0 #0369a1,
        0 14px 0 4.5px var(--navy);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer;
      position: relative;
      transition: transform 0.05s ease, box-shadow 0.05s ease;
    }
    .huge-arcade-dome:active {
      transform: translateY(8px);
      box-shadow: 
        inset 0 3px 0 rgba(255,255,255,0.4),
        inset 0 -4px 0 rgba(0,0,0,0.15),
        0 6px 0 #0369a1,
        0 6px 0 4.5px var(--navy);
    }
    .dome-target-icon {
      width: 64px; height: 64px;
      background: #ffffff;
      border: 3px solid var(--navy);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      margin-bottom: 8px;
      box-shadow: 0 3px 0 rgba(0,0,0,0.15);
    }
    .dome-title {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900;
      letter-spacing: 1px; text-shadow: 0 2px 0 rgba(2, 132, 199, 0.8);
    }
    .dome-sub {
      font-size: 13px; font-weight: 900; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <header class="player-strip-card">
    <div class="player-identity-group">
      <div class="player-avatar-circle">${svgAvatarThumb}</div>
      <div class="player-text-group">
        <span class="player-nickname">Ayrton</span>
        <span class="player-role-sub">P1 · AZUL</span>
      </div>
    </div>
    <div class="player-tag-pill" style="background: #38bdf8; color: var(--navy);">
      🎯 BUTTON BASH
    </div>
  </header>

  <div class="guide-card">
    <h2>🎯 DIANA DE DARDOS</h2>
    <p>1º Pulso: Fija la coordenada X · 2º Pulso: Fija la Y</p>
  </div>

  <div class="buzzer-stage-card">
    <div class="target-status-pill">
      ¡MIRA A LA TELEVISIÓN Y CLAVA EL CENTRO!
    </div>
    <div class="huge-arcade-dome">
      <div class="dome-target-icon">🎯</div>
      <div class="dome-title">¡PULSA!</div>
      <div class="dome-sub">DISPARAR DARDO</div>
    </div>
  </div>

  <footer class="soundboard-card">
    <div class="soundboard-grid">
      <div class="sb-mini-btn">BOCINA</div>
      <div class="sb-mini-btn">AUUU</div>
      <div class="sb-mini-btn">BING</div>
      <div class="sb-mini-btn">FAAAH</div>
      <div class="sb-mini-btn">OMG</div>
      <div class="sb-mini-btn">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 5. OPTIMIZED 4-CANDY TRIVIAL / REFLEX (Portrait: 412 x 850)
// =========================================================================
const html_opt_candyquad = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando 4 Botones - Optimizado</title>
  <style>
    ${masterCSS}
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
      margin-bottom: 12px;
    }
    .guide-card h2 {
      font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 900; color: var(--navy);
    }
    .quad-candy-container {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 14px;
      margin-bottom: 12px;
      position: relative;
    }
    .quad-candy-btn {
      border-radius: 28px;
      font-size: 56px;
      flex-direction: column;
    }
    .quad-label-sub {
      font-size: 15px; font-weight: 900; letter-spacing: 0.5px; margin-top: -6px;
    }
    .center-junction-badge {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 54px; height: 54px;
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
  <header class="player-strip-card">
    <div class="player-identity-group">
      <div class="player-avatar-circle">${svgAvatarThumb}</div>
      <div class="player-text-group">
        <span class="player-nickname">Ayrton</span>
        <span class="player-role-sub">P1 · AZUL</span>
      </div>
    </div>
    <div class="player-tag-pill" style="background: #facc15; color: var(--navy);">
      ⚡ REFLEJOS
    </div>
  </header>

  <div class="guide-card">
    <h2>¡RÁPIDO! ¡PULSA EN LA TELEVISIÓN!</h2>
  </div>

  <div class="quad-candy-container">
    <div class="center-junction-badge">!</div>
    <div class="candy-btn btn-pink quad-candy-btn">
      A
      <span class="quad-label-sub">OPCIÓN A</span>
    </div>
    <div class="candy-btn btn-green quad-candy-btn">
      B
      <span class="quad-label-sub">OPCIÓN B</span>
    </div>
    <div class="candy-btn btn-cyan quad-candy-btn">
      X
      <span class="quad-label-sub">OPCIÓN C</span>
    </div>
    <div class="candy-btn btn-yellow quad-candy-btn">
      Y
      <span class="quad-label-sub">OPCIÓN D</span>
    </div>
  </div>

  <footer class="soundboard-card">
    <div class="soundboard-grid">
      <div class="sb-mini-btn">BOCINA</div>
      <div class="sb-mini-btn">AUUU</div>
      <div class="sb-mini-btn">BING</div>
      <div class="sb-mini-btn">FAAAH</div>
      <div class="sb-mini-btn">OMG</div>
      <div class="sb-mini-btn">ALLAH</div>
    </div>
  </footer>
</body>
</html>`;

// =========================================================================
// 6. MASTER SHOWCASE BOARD (Like the user's Image 2)
// =========================================================================
const html_master_showcase = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sistema de Mandos Móviles - Candy-Arcade</title>
  <style>
    ${masterCSS}
    body {
      width: 1920px; height: 1080px;
      padding: 30px 40px;
      display: flex; flex-direction: column;
    }
    .showcase-header {
      background: #ffffff;
      border: 4px solid var(--navy);
      border-radius: 24px;
      padding: 16px 36px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px;
    }
    .header-left h1 {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900; color: var(--navy);
    }
    .header-left p {
      font-size: 16px; font-weight: 800; color: #64748b; margin-top: 2px;
    }
    .header-tag {
      background: #fef08a; border: 3px solid var(--navy); border-radius: 14px;
      padding: 6px 18px; font-family: 'Fredoka', sans-serif; font-size: 16px; font-weight: 900;
    }

    .showcase-grid {
      flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 24px;
    }
    .showcase-card {
      background: #ffffff;
      border: 4px solid var(--navy);
      border-radius: 28px;
      padding: 14px 18px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column;
    }
    .card-title-bar {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-bottom: 8px; border-bottom: 2.5px dashed #cbd5e1; margin-bottom: 12px;
    }
    .card-title {
      font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 900; color: var(--navy);
    }
    .card-desc {
      font-size: 12px; font-weight: 800; color: #64748b;
    }
    .screen-preview-frame {
      flex: 1; display: flex; align-items: center; justify-content: center;
      overflow: hidden; background: #edf5fd; border: 2.5px solid var(--navy); border-radius: 20px;
    }
    .screen-preview-frame iframe {
      border: none; transform-origin: center center;
    }
  </style>
</head>
<body>
  <div class="showcase-header">
    <div class="header-left">
      <h1>SISTEMA DE MANDOS MÓVILES · JUEGO CHAVALIL</h1>
      <p>Estética Light Theme Candy-Arcade optimizada con ergonomía táctil y sensación física jugable</p>
    </div>
    <div class="header-tag">★ EDICIÓN CUADRILLA ★</div>
  </div>

  <div class="showcase-grid">
    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">1. MAPA OVERWORLD</span>
        <span class="card-desc">Cruceta Candy + Botón Entrar + Soundboard</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-opt-1-overworld.html" width="412" height="850" style="transform: scale(0.42);"></iframe>
      </div>
    </div>

    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">2. MARIO KART (CARRERAS)</span>
        <span class="card-desc">Giro 50% izq + Pedal Acelerar + Derrape y Objeto</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-opt-2-mariokart.html" width="850" height="412" style="transform: scale(0.60);"></iframe>
      </div>
    </div>

    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">3. SUPER SMASH (BRAWLER)</span>
        <span class="card-desc">D-Pad combate + Diamante de 4 acciones de caramelo</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-opt-3-supersmash.html" width="850" height="412" style="transform: scale(0.60);"></iframe>
      </div>
    </div>

    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">4. PULSAR RÁPIDO / TRIVIAL</span>
        <span class="card-desc">4 cuadrantes de caramelo (A, B, X, Y) + Badge central</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-opt-5-candyquad.html" width="412" height="850" style="transform: scale(0.42);"></iframe>
      </div>
    </div>

    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">5. BUTTON BASH (DIANA DARDO)</span>
        <span class="card-desc">Buzzer circular arcade de cúpula táctil 3D</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-opt-4-buttonbash.html" width="412" height="850" style="transform: scale(0.42);"></iframe>
      </div>
    </div>

    <div class="showcase-card">
      <div class="card-title-bar">
        <span class="card-title">6. TRANSICIÓN A HORIZONTAL</span>
        <span class="card-desc">Aviso animado de giro con dos pulgares</span>
      </div>
      <div class="screen-preview-frame">
        <iframe src="mando-6-rotate.html" width="850" height="412" style="transform: scale(0.60);"></iframe>
      </div>
    </div>
  </div>
</body>
</html>`;

// Write HTML files
fs.writeFileSync('design/directions/mando-opt-1-overworld.html', html_opt_overworld);
fs.writeFileSync('design/directions/mando-opt-2-mariokart.html', html_opt_mariokart);
fs.writeFileSync('design/directions/mando-opt-3-supersmash.html', html_opt_supersmash);
fs.writeFileSync('design/directions/mando-opt-4-buttonbash.html', html_opt_buttonbash);
fs.writeFileSync('design/directions/mando-opt-5-candyquad.html', html_opt_candyquad);
fs.writeFileSync('design/directions/master-showcase.html', html_master_showcase);

console.log('Optimized HTMLs created.');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();

  const captures = [
    { html: 'design/directions/mando-opt-1-overworld.html', out: 'design/directions/mando-opt-1-overworld.png', w: 412, h: 850, scale: 2 },
    { html: 'design/directions/mando-opt-2-mariokart.html', out: 'design/directions/mando-opt-2-mariokart.png', w: 850, h: 412, scale: 2 },
    { html: 'design/directions/mando-opt-3-supersmash.html', out: 'design/directions/mando-opt-3-supersmash.png', w: 850, h: 412, scale: 2 },
    { html: 'design/directions/mando-opt-4-buttonbash.html', out: 'design/directions/mando-opt-4-buttonbash.png', w: 412, h: 850, scale: 2 },
    { html: 'design/directions/mando-opt-5-candyquad.html', out: 'design/directions/mando-opt-5-candyquad.png', w: 412, h: 850, scale: 2 },
    { html: 'design/directions/master-showcase.html', out: 'design/directions/master-showcase.png', w: 1920, h: 1080, scale: 1 },
  ];

  for (const c of captures) {
    const full = path.resolve(c.html);
    await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: c.scale });
    await page.goto('file:///' + full.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: c.out });
    console.log('Optimized capture:', c.out);
  }

  await browser.close();
  console.log('All optimized captures generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
