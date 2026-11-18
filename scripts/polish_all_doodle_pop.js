const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const QRCode = require('qrcode');
const { renderAvatarSVG, AVATAR_PRESETS } = require('../public/js/avatar-engine.js');

const pAyrton = AVATAR_PRESETS.find(p => p.id === 'ayrton') || AVATAR_PRESETS[0];
const pAdri = AVATAR_PRESETS.find(p => p.id === 'adriachi') || AVATAR_PRESETS[1];
const pMarta = AVATAR_PRESETS.find(p => p.id === 'marta') || AVATAR_PRESETS[5];
const pManu = AVATAR_PRESETS.find(p => p.id === 'manu') || AVATAR_PRESETS[3];

const svgAyrtonTV = renderAvatarSVG(pAyrton.config, 86);
const svgAdriTV = renderAvatarSVG(pAdri.config, 86);
const svgMartaTV = renderAvatarSVG(pMarta.config, 86);
const svgManuTV = renderAvatarSVG(pManu.config, 86);

const svgAvatarThumb = renderAvatarSVG(pAyrton.config, 54);
const svgAvatarSmall = renderAvatarSVG(pAyrton.config, 40);

// ULTRA-POLISHED CANDY DOODLE POP CSS
const ultraCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');

  :root {
    --navy: #1e293b;
    --navy-dark: #0f172a;
    --navy-skirt: #090d16;
    --border-w: 3.5px;
    
    /* Vibrant Candy Palette with Highlights & 3D Skirts */
    --c-cyan: #38bdf8;
    --c-cyan-top: #bae6fd;
    --c-cyan-skirt: #0284c7;

    --c-green: #22c55e;
    --c-green-top: #bbf7d0;
    --c-green-skirt: #15803d;

    --c-pink: #f43f5e;
    --c-pink-top: #fecdd3;
    --c-pink-skirt: #be123c;

    --c-yellow: #facc15;
    --c-yellow-top: #fef08a;
    --c-yellow-skirt: #ca8a04;

    --c-orange: #fb923c;
    --c-orange-top: #fed7aa;
    --c-orange-skirt: #c2410c;

    --c-purple: #a855f7;
    --c-purple-top: #e9d5ff;
    --c-purple-skirt: #7e22ce;
  }

  * {
    margin: 0; padding: 0; box-sizing: border-box;
    user-select: none; -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    background-color: #f1f7fe;
    /* Clean doodle squiggles + confetti sprinkles */
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

  /* JUICY CANDY BUTTON WITH SPECULAR HIGHLIGHT ARC */
  .candy-btn {
    border: var(--border-w) solid var(--navy);
    font-family: 'Fredoka', sans-serif;
    font-weight: 900;
    text-align: center;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      inset 0 4px 0 rgba(255,255,255,0.65),
      inset 0 -3px 0 rgba(0,0,0,0.14),
      0 6px 0 var(--btn-skirt, #94a3b8),
      0 6px 0 var(--border-w) var(--navy);
    transition: transform 0.05s ease, box-shadow 0.05s ease;
    overflow: hidden;
  }
  .candy-btn::before {
    content: '';
    position: absolute;
    top: 2px; left: 8px; right: 8px; height: 35%;
    background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%);
    border-radius: 14px 14px 60px 60px;
    pointer-events: none;
  }
  .candy-btn:active {
    transform: translateY(4px);
    box-shadow: 
      inset 0 2px 0 rgba(255,255,255,0.4),
      inset 0 -2px 0 rgba(0,0,0,0.1),
      0 2px 0 var(--btn-skirt, #94a3b8),
      0 2px 0 var(--border-w) var(--navy);
  }

  .btn-cyan {
    background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 60%, #0284c7 100%);
    color: #ffffff;
    --btn-skirt: var(--c-cyan-skirt);
    text-shadow: 0 2px 0 rgba(2, 132, 199, 0.8);
  }
  .btn-green {
    background: linear-gradient(180deg, #86efac 0%, #22c55e 60%, #16a34a 100%);
    color: #ffffff;
    --btn-skirt: var(--c-green-skirt);
    text-shadow: 0 2px 0 rgba(21, 128, 61, 0.8);
  }
  .btn-pink {
    background: linear-gradient(180deg, #fda4af 0%, #f43f5e 60%, #e11d48 100%);
    color: #ffffff;
    --btn-skirt: var(--c-pink-skirt);
    text-shadow: 0 2px 0 rgba(190, 18, 60, 0.8);
  }
  .btn-yellow {
    background: linear-gradient(180deg, #fef08a 0%, #facc15 60%, #eab308 100%);
    color: var(--navy);
    --btn-skirt: var(--c-yellow-skirt);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  }
  .btn-orange {
    background: linear-gradient(180deg, #fed7aa 0%, #fb923c 60%, #ea580c 100%);
    color: #ffffff;
    --btn-skirt: var(--c-orange-skirt);
    text-shadow: 0 2px 0 rgba(194, 65, 12, 0.8);
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

async function generateAll() {
  const qrDataUrl = await QRCode.toDataURL('http://192.168.1.45:3000/player', {
    margin: 1,
    scale: 8,
    color: { dark: '#1e293b', light: '#ffffff' }
  });

  // =========================================================================
  // SCREEN 1: TV LOBBY - EXACT 1:1 REPLICA OF USER'S REFERENCE IMAGE
  // =========================================================================
  const html_tv_lobby = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>TV Lobby · Edición Cuadrilla</title>
  <style>
    ${ultraCSS}
    body {
      width: 1920px; height: 1080px;
      padding: 30px 48px;
      display: flex; flex-direction: column;
    }

    /* Top TV Bar */
    header.tv-header {
      background: #ffffff;
      border: 4.5px solid var(--navy);
      border-radius: 36px;
      padding: 16px 36px;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 26px;
    }
    .tv-brand {
      display: flex; align-items: center; gap: 16px;
    }
    .tv-brand-badge {
      width: 58px; height: 58px;
      background: #0284c7;
      border: 3.5px solid var(--navy);
      border-radius: 50%;
      color: #ffffff;
      font-family: 'Fredoka', sans-serif;
      font-size: 26px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 0 var(--navy);
    }
    .tv-brand-titles {
      display: flex; flex-direction: column;
    }
    .tv-main-title {
      font-family: 'Fredoka', sans-serif; font-size: 38px; font-weight: 900;
      letter-spacing: -0.5px; color: var(--navy); line-height: 1;
    }
    .tv-sub-title {
      font-size: 13px; font-weight: 900; color: #0284c7;
      letter-spacing: 1px; margin-top: 4px;
    }
    .tv-room-pills {
      display: flex; align-items: center; gap: 16px;
    }
    .tv-url-pill {
      background: #ffffff; border: 3.5px solid var(--navy); border-radius: 20px;
      padding: 8px 24px; font-size: 22px; font-weight: 900; color: #0369a1;
      box-shadow: 0 4px 0 rgba(30, 41, 59, 0.1);
    }
    .tv-ready-pill {
      background: #4ade80; border: 3.5px solid var(--navy); border-radius: 20px;
      padding: 8px 22px; font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 900;
      color: var(--navy); box-shadow: 0 4px 0 var(--navy);
    }

    /* Main Grid */
    main.tv-main-layout {
      flex: 1; display: grid; grid-template-columns: 550px 1fr; gap: 32px;
    }

    /* Left QR Card with Pin Dot */
    .tv-qr-container {
      background: #ffffff;
      border: 4.5px solid var(--navy);
      border-radius: 38px;
      padding: 32px 28px;
      box-shadow: 0 10px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      position: relative;
    }
    .card-pin-dot {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      width: 28px; height: 28px; border-radius: 50%;
      background: #ef4444; border: 4px solid var(--navy);
      box-shadow: 0 3px 0 var(--navy);
    }
    .tv-qr-box {
      background: #ffffff; border: 4px solid var(--navy); border-radius: 30px;
      padding: 16px; margin-bottom: 20px; box-shadow: 0 6px 0 rgba(30, 41, 59, 0.1);
    }
    .tv-qr-box img {
      width: 270px; height: 270px; display: block; border-radius: 12px;
    }
    .tv-qr-title {
      font-family: 'Fredoka', sans-serif; font-size: 32px; font-weight: 900;
      color: var(--navy); margin-bottom: 6px;
    }
    .tv-qr-desc {
      font-size: 18px; font-weight: 800; color: #64748b; margin-bottom: 18px;
    }
    .tv-j1-pill {
      background: #fde047; border: 3px solid var(--navy); border-radius: 16px;
      padding: 8px 20px; font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 900;
      color: var(--navy); box-shadow: 0 3px 0 var(--navy);
    }

    /* Right Players Area */
    .tv-players-container {
      background: #ffffff;
      border: 4.5px solid var(--navy);
      border-radius: 38px;
      padding: 32px 36px;
      box-shadow: 0 10px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column;
    }
    .tv-players-topbar {
      display: flex; justify-content: space-between; align-items: baseline;
      padding-bottom: 14px; border-bottom: 3.5px dashed #cbd5e1; margin-bottom: 26px;
    }
    .tv-players-topbar h2 {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900; color: var(--navy);
    }
    .tv-players-topbar span {
      font-size: 20px; font-weight: 800; color: #0284c7;
    }

    .tv-cards-grid {
      display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 24px; flex: 1;
    }
    .tv-player-card {
      border: 4px solid var(--navy);
      border-radius: 28px;
      padding: 18px 24px;
      display: flex; align-items: center; gap: 20px;
      position: relative;
      box-shadow: 0 7px 0 var(--navy);
    }
    .tv-player-card.p1 { background: #bae6fd; } /* Ayrton Cyan */
    .tv-player-card.p2 { background: #fecdd3; } /* Adriachi Pink */
    .tv-player-card.p3 { background: #d9f99d; } /* Marta Lime */
    .tv-player-card.p4 { background: #fed7aa; } /* Manu Orange */

    .player-tag-pin {
      position: absolute; top: -14px; left: 24px;
      background: var(--navy); color: #ffffff;
      font-family: 'Fredoka', sans-serif; font-size: 14px; font-weight: 900;
      padding: 3px 14px; border-radius: 10px; border: 2.5px solid #ffffff;
      letter-spacing: 0.5px;
    }
    .tv-avatar-frame {
      width: 90px; height: 90px; background: #ffffff; border: 3.5px solid var(--navy);
      border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 4px 0 rgba(0,0,0,0.15);
    }
    .tv-card-info { flex: 1; }
    .tv-card-name {
      font-family: 'Fredoka', sans-serif; font-size: 30px; font-weight: 900;
      color: var(--navy); margin-bottom: 8px;
    }
    .tv-card-status-pill {
      display: inline-block; background: #ffffff; border: 2.5px solid var(--navy);
      border-radius: 12px; padding: 4px 14px; font-family: 'Fredoka', sans-serif;
      font-size: 14px; font-weight: 900; color: var(--navy); box-shadow: 0 2px 0 var(--navy);
    }

    /* Bottom Navy Action Bar */
    footer.tv-bottom-bar {
      margin-top: 24px;
      background: var(--navy);
      border: 4px solid var(--navy);
      border-radius: 30px;
      padding: 16px 36px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    }
    .tv-bottom-msg {
      font-size: 21px; font-weight: 800; color: #ffffff;
    }
    .tv-btn-start {
      background: #f97316; color: #ffffff;
      border: 3.5px solid #ffffff; border-radius: 20px;
      font-family: 'Fredoka', sans-serif; font-size: 24px; font-weight: 900;
      padding: 12px 38px; box-shadow: 0 5px 0 #9a3412;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header class="tv-header">
    <div class="tv-brand">
      <div class="tv-brand-badge">B!</div>
      <div class="tv-brand-titles">
        <h1 class="tv-main-title">JUEGO CHAVALIL</h1>
        <span class="tv-sub-title">★ EDICIÓN CUADRILLA ★</span>
      </div>
    </div>
    <div class="tv-room-pills">
      <div class="tv-url-pill">192.168.1.45:3000/player</div>
      <div class="tv-ready-pill">4 / 8 LISTOS</div>
    </div>
  </header>

  <main class="tv-main-layout">
    <div class="tv-qr-container">
      <div class="card-pin-dot"></div>
      <div class="tv-qr-box">
        <img src="${qrDataUrl}" alt="QR">
      </div>
      <h2 class="tv-qr-title">¡APUNTA Y ENTRA!</h2>
      <p class="tv-qr-desc">Escanea con la cámara de tu smartphone</p>
      <div class="tv-j1-pill">👑 Ayrton tiene el mando (J1)</div>
    </div>

    <div class="tv-players-container">
      <div class="tv-players-topbar">
        <h2>La Cuadrilla en la Sala</h2>
        <span>4 Chavales dentro</span>
      </div>

      <div class="tv-cards-grid">
        <div class="tv-player-card p1">
          <div class="player-tag-pin">P1 · AZUL</div>
          <div class="tv-avatar-frame">${svgAyrtonTV}</div>
          <div class="tv-card-info">
            <div class="tv-card-name">Ayrton</div>
            <div class="tv-card-status-pill">¡LISTO PARA JUGAR!</div>
          </div>
        </div>

        <div class="tv-player-card p2">
          <div class="player-tag-pin">P2 · ROJO</div>
          <div class="tv-avatar-frame">${svgAdriTV}</div>
          <div class="tv-card-info">
            <div class="tv-card-name">Adriachi</div>
            <div class="tv-card-status-pill">¡LISTO PARA JUGAR!</div>
          </div>
        </div>

        <div class="tv-player-card p3">
          <div class="player-tag-pin">P3 · VERDE</div>
          <div class="tv-avatar-frame">${svgMartaTV}</div>
          <div class="tv-card-info">
            <div class="tv-card-name">Marta</div>
            <div class="tv-card-status-pill">¡LISTA PARA JUGAR!</div>
          </div>
        </div>

        <div class="tv-player-card p4">
          <div class="player-tag-pin">P4 · NARANJA</div>
          <div class="tv-avatar-frame">${svgManuTV}</div>
          <div class="tv-card-info">
            <div class="tv-card-name">Manu</div>
            <div class="tv-card-status-pill">¡LISTO PARA JUGAR!</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="tv-bottom-bar">
    <div class="tv-bottom-msg">Ayrton puede pulsar INICIAR en su móvil cuando estéis todos</div>
    <div class="tv-btn-start">¡ARRANCAR! ▶</div>
  </footer>
</body>
</html>`;

  fs.writeFileSync('design/directions/tv-lobby-doodle-pop.html', html_tv_lobby);
  console.log('TV Lobby Doodle Pop created.');

  // Launch Edge to capture TV Lobby
  const browser = await puppeteer.launch({
    executablePath: 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const fullHtml = path.resolve('design/directions/tv-lobby-doodle-pop.html');
  await page.goto('file:///' + fullHtml.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'design/directions/tv-lobby-doodle-pop.png' });
  await browser.close();

  console.log('TV Lobby screenshot captured: design/directions/tv-lobby-doodle-pop.png');
}

generateAll().catch(e => { console.error(e); process.exit(1); });
