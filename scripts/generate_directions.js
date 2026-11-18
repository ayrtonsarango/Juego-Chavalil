const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const QRCode = require('qrcode');
const { renderAvatarSVG, AVATAR_PRESETS } = require('../public/js/avatar-engine.js');

// Pick 4 canonical avatars for lobby preview: Ayrton (J1), Adriachi, Marta, Manu
const pAyrton = AVATAR_PRESETS.find(p => p.id === 'ayrton') || AVATAR_PRESETS[0];
const pAdri = AVATAR_PRESETS.find(p => p.id === 'adriachi') || AVATAR_PRESETS[1];
const pMarta = AVATAR_PRESETS.find(p => p.id === 'marta') || AVATAR_PRESETS[5];
const pManu = AVATAR_PRESETS.find(p => p.id === 'manu') || AVATAR_PRESETS[3];

const svgAyrton = renderAvatarSVG(pAyrton.config, 90);
const svgAdri = renderAvatarSVG(pAdri.config, 90);
const svgMarta = renderAvatarSVG(pMarta.config, 90);
const svgManu = renderAvatarSVG(pManu.config, 90);

const svgAyrtonThumb = renderAvatarSVG(pAyrton.config, 56);

async function createAll() {
  const qrDataUrl = await QRCode.toDataURL('http://192.168.1.45:3000/player', {
    margin: 1,
    scale: 8,
    color: { dark: '#0f172a', light: '#ffffff' }
  });

  // =========================================================================
  // DIRECTION 1: CHUNKY NEO-BRUTALIST (Fall Guys + WarioWare)
  // =========================================================================
  const d1_tv = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dirección 1 (TV): Chunky Neo-Brutalist</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width: 1920px; height: 1080px; overflow: hidden;
      background: #f8f6f0;
      background-image: radial-gradient(#cbd5e1 2px, transparent 2px);
      background-size: 32px 32px;
      font-family: 'Outfit', sans-serif;
      color: #0f172a;
      display: flex; flex-direction: column;
      padding: 36px 48px;
    }
    header {
      display: flex; justify-content: space-between; align-items: center;
      background: #ffffff;
      border: 4px solid #0f172a;
      border-radius: 24px;
      padding: 18px 36px;
      box-shadow: 6px 6px 0 #0f172a;
      margin-bottom: 32px;
    }
    .brand {
      display: flex; align-items: center; gap: 16px;
    }
    .brand-tag {
      background: #facc15;
      border: 3px solid #0f172a;
      border-radius: 12px;
      font-family: 'Fredoka', sans-serif;
      font-weight: 900;
      font-size: 20px;
      padding: 4px 14px;
      box-shadow: 3px 3px 0 #0f172a;
    }
    .brand-title {
      font-family: 'Fredoka', sans-serif;
      font-weight: 900;
      font-size: 40px;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .room-pill {
      display: flex; align-items: center; gap: 20px;
    }
    .url-chip {
      background: #e0f2fe;
      border: 3px solid #0f172a;
      border-radius: 14px;
      padding: 8px 20px;
      font-size: 24px;
      font-weight: 800;
      color: #0369a1;
      box-shadow: 4px 4px 0 #0f172a;
    }
    .count-chip {
      background: #86efac;
      border: 3px solid #0f172a;
      border-radius: 14px;
      padding: 8px 20px;
      font-size: 22px;
      font-weight: 900;
      box-shadow: 4px 4px 0 #0f172a;
    }

    main {
      flex: 1; display: grid; grid-template-columns: 560px 1fr; gap: 36px;
    }
    .qr-card {
      background: #ffffff;
      border: 4px solid #0f172a;
      border-radius: 28px;
      padding: 36px;
      box-shadow: 8px 8px 0 #0f172a;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
    }
    .qr-wrapper {
      padding: 16px; background: #ffffff; border: 4px solid #0f172a; border-radius: 20px;
      box-shadow: 6px 6px 0 #0f172a;
      margin-bottom: 24px;
    }
    .qr-wrapper img { width: 280px; height: 280px; display: block; border-radius: 8px; }
    .qr-card h2 {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900; margin-bottom: 8px;
    }
    .qr-card p {
      font-size: 20px; font-weight: 700; color: #64748b;
    }
    .j1-callout {
      margin-top: 20px; background: #fef08a; border: 3px solid #0f172a; border-radius: 12px;
      padding: 8px 18px; font-weight: 800; font-size: 18px; box-shadow: 3px 3px 0 #0f172a;
    }

    .players-area {
      background: #ffffff;
      border: 4px solid #0f172a;
      border-radius: 28px;
      padding: 36px;
      box-shadow: 8px 8px 0 #0f172a;
      display: flex; flex-direction: column;
    }
    .players-header {
      display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 28px;
      padding-bottom: 16px; border-bottom: 3px dashed #cbd5e1;
    }
    .players-header h2 {
      font-family: 'Fredoka', sans-serif; font-size: 36px; font-weight: 900;
    }
    .players-header span {
      font-size: 22px; font-weight: 800; color: #64748b;
    }

    .players-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; flex: 1;
    }
    .p-card {
      border: 4px solid #0f172a;
      border-radius: 20px;
      padding: 18px 24px;
      display: flex; align-items: center; gap: 20px;
      box-shadow: 6px 6px 0 #0f172a;
      position: relative;
    }
    .p-card.p1 { background: #bae6fd; } /* Player 1 Cyan */
    .p-card.p2 { background: #fecdd3; } /* Player 2 Pink/Red */
    .p-card.p3 { background: #d9f99d; } /* Player 3 Lime */
    .p-card.p4 { background: #fed7aa; } /* Player 4 Orange */

    .p-num-badge {
      position: absolute; top: -14px; left: 18px;
      background: #0f172a; color: #ffffff;
      font-family: 'Fredoka', sans-serif; font-weight: 900; font-size: 16px;
      padding: 2px 12px; border-radius: 8px; border: 2px solid #ffffff;
    }
    .p-avatar {
      width: 90px; height: 90px; background: #ffffff; border: 3px solid #0f172a;
      border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center;
      box-shadow: 3px 3px 0 #0f172a; flex-shrink: 0;
    }
    .p-info { flex: 1; }
    .p-name {
      font-family: 'Fredoka', sans-serif; font-size: 28px; font-weight: 900; margin-bottom: 6px;
    }
    .p-status {
      display: inline-flex; align-items: center; gap: 8px;
      background: #ffffff; border: 2.5px solid #0f172a; border-radius: 8px;
      padding: 4px 12px; font-size: 15px; font-weight: 800; box-shadow: 2px 2px 0 #0f172a;
    }
    .p-status.ready { background: #4ade80; color: #0f172a; }

    footer.bottom-bar {
      margin-top: 28px; display: flex; justify-content: space-between; align-items: center;
      background: #0f172a; color: #ffffff; border-radius: 18px; padding: 16px 32px;
      border: 4px solid #0f172a;
    }
    .bottom-hint { font-size: 20px; font-weight: 800; color: #cbd5e1; }
    .btn-start {
      background: #facc15; color: #0f172a; border: 3px solid #0f172a;
      font-family: 'Fredoka', sans-serif; font-weight: 900; font-size: 24px;
      padding: 12px 36px; border-radius: 14px; box-shadow: 4px 4px 0 #ffffff;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-tag">PARTY GAME</div>
      <h1 class="brand-title">JUEGO CHAVALIL</h1>
    </div>
    <div class="room-pill">
      <div class="url-chip">192.168.1.45:3000/player</div>
      <div class="count-chip">4 / 8 LISTOS</div>
    </div>
  </header>

  <main>
    <div class="qr-card">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" alt="QR">
      </div>
      <h2>¡ESCANEA CON TU MÓVIL!</h2>
      <p>Abre la cámara y apúntala al código para entrar</p>
      <div class="j1-callout">👑 Ayrton es el J1 (Líder)</div>
    </div>

    <div class="players-area">
      <div class="players-header">
        <h2>Chavales en la Sala</h2>
        <span>4 Jugadores conectados</span>
      </div>

      <div class="players-grid">
        <div class="p-card p1">
          <div class="p-num-badge">JUGADOR 1 · AZUL</div>
          <div class="p-avatar">${svgAyrton}</div>
          <div class="p-info">
            <div class="p-name">Ayrton</div>
            <div class="p-status ready">LISTO (J1)</div>
          </div>
        </div>

        <div class="p-card p2">
          <div class="p-num-badge">JUGADOR 2 · ROJO</div>
          <div class="p-avatar">${svgAdri}</div>
          <div class="p-info">
            <div class="p-name">Adriachi</div>
            <div class="p-status ready">LISTO</div>
          </div>
        </div>

        <div class="p-card p3">
          <div class="p-num-badge">JUGADOR 3 · VERDE</div>
          <div class="p-avatar">${svgMarta}</div>
          <div class="p-info">
            <div class="p-name">Marta</div>
            <div class="p-status ready">LISTO</div>
          </div>
        </div>

        <div class="p-card p4">
          <div class="p-num-badge">JUGADOR 4 · NARANJA</div>
          <div class="p-avatar">${svgManu}</div>
          <div class="p-info">
            <div class="p-name">Manu</div>
            <div class="p-status ready">LISTO</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="bottom-bar">
    <div class="bottom-hint">Esperando a que J1 inicie la partida desde su móvil o el host...</div>
    <div class="btn-start">INICIAR PARTIDA ▶</div>
  </footer>
</body>
</html>`;

  const d1_mobile = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando (Dirección 1): Chunky Neo-Brutalist</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; -webkit-user-select:none; }
    body {
      width: 100vw; height: 100dvh; overflow: hidden;
      background: #f8f6f0;
      font-family: 'Outfit', sans-serif; color: #0f172a;
      display: flex; flex-direction: column;
      padding: env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px) 16px;
    }
    /* Player Strip */
    .player-strip {
      background: #ffffff; border: 3px solid #0f172a; border-radius: 16px;
      padding: 10px 14px; box-shadow: 4px 4px 0 #0f172a;
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .player-meta { display: flex; align-items: center; gap: 12px; }
    .strip-avatar {
      width: 44px; height: 44px; border: 2.5px solid #0f172a; border-radius: 10px;
      overflow: hidden; background: #bae6fd; display: flex; align-items: center; justify-content: center;
    }
    .strip-name { font-family: 'Fredoka', sans-serif; font-size: 20px; font-weight: 900; }
    .strip-badge {
      background: #0f172a; color: #facc15; font-size: 13px; font-weight: 900;
      padding: 4px 10px; border-radius: 8px; border: 1.5px solid #0f172a;
    }

    /* Screen Title */
    .nav-guide {
      text-align: center; margin-bottom: 8px;
    }
    .nav-guide h2 {
      font-family: 'Fredoka', sans-serif; font-size: 18px; font-weight: 900; color: #0f172a;
    }
    .nav-pos-pill {
      display: inline-block; background: #e0f2fe; border: 2px solid #0f172a; border-radius: 8px;
      padding: 2px 10px; font-size: 13px; font-weight: 800; color: #0369a1; margin-top: 4px;
    }

    /* Controller Surface */
    .ctrl-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center;
    }

    /* D-PAD */
    .dpad-container {
      display: grid; grid-template-columns: repeat(3, 58px); grid-template-rows: repeat(3, 58px);
      gap: 6px; justify-content: center; align-content: center;
    }
    .dpad-btn {
      background: #ffffff; border: 3px solid #0f172a; border-radius: 14px;
      box-shadow: 0 5px 0 #0f172a; font-family: 'Fredoka', sans-serif; font-size: 22px; font-weight: 900;
      display: flex; align-items: center; justify-content: center; color: #0f172a;
      cursor: pointer;
    }
    .dpad-btn:active {
      transform: translateY(3px); box-shadow: 0 2px 0 #0f172a;
    }
    .dpad-center {
      background: #e2e8f0; border: 2px dashed #94a3b8; border-radius: 10px;
    }
    .dpad-btn.up { grid-column: 2; grid-row: 1; }
    .dpad-btn.left { grid-column: 1; grid-row: 2; }
    .dpad-btn.right { grid-column: 3; grid-row: 2; }
    .dpad-btn.down { grid-column: 2; grid-row: 3; }

    /* ACTION CLUSTER */
    .action-cluster {
      display: flex; flex-direction: column; gap: 14px; justify-content: center; height: 100%;
    }
    .btn-act {
      border: 3.5px solid #0f172a; border-radius: 20px; padding: 18px 12px;
      font-family: 'Fredoka', sans-serif; font-weight: 900; font-size: 19px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; position: relative; text-align: center;
    }
    .btn-act.accept {
      background: #4ade80; color: #0f172a; box-shadow: 0 7px 0 #15803d, 0 7px 0 3px #0f172a;
      flex: 1.3;
    }
    .btn-act.accept:active {
      transform: translateY(4px); box-shadow: 0 3px 0 #15803d, 0 3px 0 3px #0f172a;
    }
    .btn-act.gather {
      background: #facc15; color: #0f172a; box-shadow: 0 5px 0 #ca8a04, 0 5px 0 3px #0f172a;
      flex: 1; font-size: 16px;
    }
    .btn-act.gather:active {
      transform: translateY(3px); box-shadow: 0 2px 0 #ca8a04, 0 2px 0 3px #0f172a;
    }

    /* Soundboard Strip */
    .sb-strip {
      background: #ffffff; border: 3px solid #0f172a; border-radius: 16px;
      padding: 10px; box-shadow: 4px 4px 0 #0f172a; margin-top: 10px;
    }
    .sb-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .sb-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
    .sb-btn {
      background: #f1f5f9; border: 2px solid #0f172a; border-radius: 10px; padding: 6px 2px;
      font-size: 10px; font-weight: 900; text-align: center; box-shadow: 0 3px 0 #0f172a;
    }
    .sb-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #0f172a; }
  </style>
</head>
<body>
  <div class="player-strip">
    <div class="player-meta">
      <div class="strip-avatar">${svgAyrtonThumb}</div>
      <div class="strip-name">Ayrton</div>
    </div>
    <div class="strip-badge">J1 · AZUL</div>
  </div>

  <div class="nav-guide">
    <h2>MAPA OVERWORLD</h2>
    <div class="nav-pos-pill">Posición: Mundo 1-1 (Pelotón 4/4)</div>
  </div>

  <div class="ctrl-surface">
    <!-- D-PAD -->
    <div class="dpad-container">
      <div class="dpad-btn up">▲</div>
      <div class="dpad-btn left">◀</div>
      <div class="dpad-center"></div>
      <div class="dpad-btn right">▶</div>
      <div class="dpad-btn down">▼</div>
    </div>

    <!-- ACTION CLUSTER -->
    <div class="action-cluster">
      <div class="btn-act accept">
        ENTRAR
        <span style="font-size: 12px; font-weight: 700; opacity: 0.85;">PULSAR PARA CONFIRMAR</span>
      </div>
      <div class="btn-act gather">
        REUNIR PELOTÓN
      </div>
    </div>
  </div>

  <div class="sb-strip">
    <div class="sb-title">Soundboard Meme</div>
    <div class="sb-grid">
      <div class="sb-btn">BOCINA</div>
      <div class="sb-btn">AUUU</div>
      <div class="sb-btn">BING</div>
      <div class="sb-btn">FAAH</div>
      <div class="sb-btn">OMG</div>
      <div class="sb-btn">ALLAH</div>
    </div>
  </div>
</body>
</html>`;

  // =========================================================================
  // DIRECTION 2: DOODLE POP ARCADE (Button Bash Authentic)
  // =========================================================================
  const d2_tv = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dirección 2 (TV): Doodle Pop Arcade</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Chango&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width: 1920px; height: 1080px; overflow: hidden;
      background: #eef6ff;
      /* Doodle squiggly wavy SVG pattern inspired by Button Bash */
      background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 20 Q 30 5, 50 25 T 90 20 T 115 45 Q 100 70, 80 55 T 40 70 T 15 95 Q 35 115, 65 105 T 105 115' stroke='%23cbd5e1' stroke-width='3.5' stroke-linecap='round' fill='none'/%3E%3Ccircle cx='95' cy='30' r='5' fill='%2393c5fd' opacity='0.4'/%3E%3Ccircle cx='25' cy='85' r='4' fill='%23fca5a5' opacity='0.4'/%3E%3C/svg%3E");
      font-family: 'Nunito', sans-serif;
      color: #1e293b;
      display: flex; flex-direction: column;
      padding: 36px 48px;
    }
    header {
      display: flex; justify-content: space-between; align-items: center;
      background: #ffffff;
      border: 4px solid #1e293b;
      border-radius: 36px;
      padding: 16px 36px;
      box-shadow: 0 10px 0 rgba(30, 41, 59, 0.15);
      margin-bottom: 30px;
    }
    .brand {
      display: flex; align-items: center; gap: 18px;
    }
    .brand-circle {
      width: 64px; height: 64px; background: #1e293b; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #ffffff; font-family: 'Chango', cursive; font-size: 26px;
      transform: rotate(-5deg);
    }
    .brand-title {
      font-family: 'Chango', cursive;
      font-size: 34px;
      color: #1e293b;
      letter-spacing: 0.5px;
    }
    .room-pill {
      display: flex; align-items: center; gap: 16px;
    }
    .url-chip {
      background: #dbeafe; border: 3px solid #1e293b; border-radius: 20px;
      padding: 8px 24px; font-size: 22px; font-weight: 900; color: #1e40af;
    }
    .count-chip {
      background: #fde047; border: 3px solid #1e293b; border-radius: 20px;
      padding: 8px 22px; font-size: 20px; font-weight: 900;
    }

    main {
      flex: 1; display: grid; grid-template-columns: 560px 1fr; gap: 36px;
    }
    .qr-card {
      background: #ffffff;
      border: 4.5px solid #1e293b;
      border-radius: 40px;
      padding: 36px;
      box-shadow: 0 14px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      transform: rotate(-0.8deg);
    }
    .qr-wrapper {
      padding: 16px; background: #ffffff; border: 4px solid #1e293b; border-radius: 28px;
      margin-bottom: 24px;
    }
    .qr-wrapper img { width: 280px; height: 280px; display: block; border-radius: 12px; }
    .qr-card h2 {
      font-family: 'Chango', cursive; font-size: 28px; color: #1e293b; margin-bottom: 8px;
    }
    .qr-card p {
      font-size: 19px; font-weight: 800; color: #64748b;
    }

    .players-area {
      background: #ffffff;
      border: 4.5px solid #1e293b;
      border-radius: 40px;
      padding: 36px;
      box-shadow: 0 14px 0 rgba(30, 41, 59, 0.12);
      display: flex; flex-direction: column;
      transform: rotate(0.6deg);
    }
    .players-header {
      display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 26px;
      padding-bottom: 16px; border-bottom: 3.5px solid #e2e8f0;
    }
    .players-header h2 {
      font-family: 'Chango', cursive; font-size: 30px; color: #1e293b;
    }
    .players-header span {
      font-size: 20px; font-weight: 800; color: #64748b;
    }

    .players-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; flex: 1;
    }
    .p-card {
      border: 3.5px solid #1e293b;
      border-radius: 30px;
      padding: 18px 24px;
      display: flex; align-items: center; gap: 20px;
      background: #f8fafc;
      position: relative;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.08);
    }
    .p-card.p1 { border-color: #2563eb; background: #eff6ff; }
    .p-card.p2 { border-color: #dc2626; background: #fef2f2; }
    .p-card.p3 { border-color: #16a34a; background: #f0fdf4; }
    .p-card.p4 { border-color: #d97706; background: #fffbeb; }

    .p-doodle-dot {
      width: 18px; height: 18px; border-radius: 50%; border: 3px solid #1e293b;
      position: absolute; top: -8px; left: 24px;
    }
    .p-card.p1 .p-doodle-dot { background: #3b82f6; }
    .p-card.p2 .p-doodle-dot { background: #ef4444; }
    .p-card.p3 .p-doodle-dot { background: #22c55e; }
    .p-card.p4 .p-doodle-dot { background: #f59e0b; }

    .p-avatar {
      width: 90px; height: 90px; background: #ffffff; border: 3px solid #1e293b;
      border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .p-info { flex: 1; }
    .p-name {
      font-size: 26px; font-weight: 900; margin-bottom: 6px; color: #1e293b;
    }
    .p-status {
      display: inline-block; background: #1e293b; color: #ffffff;
      border-radius: 12px; padding: 4px 14px; font-size: 14px; font-weight: 800;
    }

    footer.bottom-bar {
      margin-top: 24px; display: flex; justify-content: space-between; align-items: center;
      background: #1e293b; color: #ffffff; border-radius: 28px; padding: 16px 36px;
    }
    .bottom-hint { font-size: 20px; font-weight: 800; color: #94a3b8; }
    .btn-start {
      background: #f97316; color: #ffffff; border: 3px solid #1e293b;
      font-family: 'Chango', cursive; font-size: 20px; padding: 12px 36px; border-radius: 20px;
      box-shadow: 0 6px 0 #9a3412;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-circle">B!</div>
      <h1 class="brand-title">JUEGO CHAVALIL</h1>
    </div>
    <div class="room-pill">
      <div class="url-chip">192.168.1.45:3000/player</div>
      <div class="count-chip">4 LISTOS</div>
    </div>
  </header>

  <main>
    <div class="qr-card">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" alt="QR">
      </div>
      <h2>¡APUNTA Y ENTRA!</h2>
      <p>Escanea con la cámara de tu smartphone</p>
    </div>

    <div class="players-area">
      <div class="players-header">
        <h2>Chavales Conectados</h2>
        <span>4 en partida</span>
      </div>

      <div class="players-grid">
        <div class="p-card p1">
          <div class="p-doodle-dot"></div>
          <div class="p-avatar">${svgAyrton}</div>
          <div class="p-info">
            <div class="p-name">Ayrton</div>
            <div class="p-status">J1 · AZUL</div>
          </div>
        </div>

        <div class="p-card p2">
          <div class="p-doodle-dot"></div>
          <div class="p-avatar">${svgAdri}</div>
          <div class="p-info">
            <div class="p-name">Adriachi</div>
            <div class="p-status">ROJO</div>
          </div>
        </div>

        <div class="p-card p3">
          <div class="p-doodle-dot"></div>
          <div class="p-avatar">${svgMarta}</div>
          <div class="p-info">
            <div class="p-name">Marta</div>
            <div class="p-status">VERDE</div>
          </div>
        </div>

        <div class="p-card p4">
          <div class="p-doodle-dot"></div>
          <div class="p-avatar">${svgManu}</div>
          <div class="p-info">
            <div class="p-name">Manu</div>
            <div class="p-status">NARANJA</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="bottom-bar">
    <div class="bottom-hint">Ayrton (J1) tiene el mando para iniciar el mapa</div>
    <div class="btn-start">¡A JUGAR!</div>
  </footer>
</body>
</html>`;

  const d2_mobile = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando (Dirección 2): Doodle Pop Arcade</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Chango&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body {
      width: 100vw; height: 100dvh; overflow: hidden;
      background: #eff6ff;
      font-family: 'Nunito', sans-serif; color: #1e293b;
      display: flex; flex-direction: column;
      padding: env(safe-area-inset-top, 14px) 14px env(safe-area-inset-bottom, 14px) 14px;
    }
    .player-strip {
      background: #ffffff; border: 3.5px solid #1e293b; border-radius: 24px;
      padding: 8px 14px; box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .player-meta { display: flex; align-items: center; gap: 10px; }
    .strip-avatar {
      width: 44px; height: 44px; border: 2.5px solid #1e293b; border-radius: 50%;
      overflow: hidden; background: #dbeafe; display: flex; align-items: center; justify-content: center;
    }
    .strip-name { font-size: 20px; font-weight: 900; }
    .strip-badge {
      background: #2563eb; color: #ffffff; font-size: 13px; font-weight: 800;
      padding: 4px 12px; border-radius: 12px;
    }

    .nav-guide { text-align: center; margin-bottom: 8px; }
    .nav-guide h2 { font-family: 'Chango', cursive; font-size: 16px; color: #1e293b; }

    .ctrl-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center;
    }
    .dpad-container {
      display: grid; grid-template-columns: repeat(3, 56px); grid-template-rows: repeat(3, 56px);
      gap: 6px; justify-content: center; align-content: center;
    }
    .dpad-btn {
      background: #ffffff; border: 3.5px solid #1e293b; border-radius: 18px;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.15); font-size: 22px; font-weight: 900;
      display: flex; align-items: center; justify-content: center; color: #1e293b;
    }
    .dpad-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(30, 41, 59, 0.15); }
    .dpad-btn.up { grid-column: 2; grid-row: 1; }
    .dpad-btn.left { grid-column: 1; grid-row: 2; }
    .dpad-btn.right { grid-column: 3; grid-row: 2; }
    .dpad-btn.down { grid-column: 2; grid-row: 3; }

    .action-cluster {
      display: flex; flex-direction: column; gap: 12px; justify-content: center; height: 100%;
    }
    .btn-act {
      border: 3.5px solid #1e293b; border-radius: 28px; padding: 18px 12px;
      font-weight: 900; font-size: 18px; text-align: center;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .btn-act.accept {
      background: #22c55e; color: #ffffff; box-shadow: 0 8px 0 #15803d; flex: 1.2;
    }
    .btn-act.accept:active { transform: translateY(4px); box-shadow: 0 2px 0 #15803d; }
    .btn-act.gather {
      background: #f97316; color: #ffffff; box-shadow: 0 6px 0 #c2410c; flex: 1;
    }
    .btn-act.gather:active { transform: translateY(3px); box-shadow: 0 2px 0 #c2410c; }

    .sb-strip {
      background: #ffffff; border: 3px solid #1e293b; border-radius: 20px;
      padding: 8px; box-shadow: 0 4px 0 rgba(30, 41, 59, 0.1); margin-top: 8px;
    }
    .sb-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
    .sb-btn {
      background: #f1f5f9; border: 2px solid #1e293b; border-radius: 12px; padding: 6px 2px;
      font-size: 10px; font-weight: 800; text-align: center;
    }
  </style>
</head>
<body>
  <div class="player-strip">
    <div class="player-meta">
      <div class="strip-avatar">${svgAyrtonThumb}</div>
      <div class="strip-name">Ayrton</div>
    </div>
    <div class="strip-badge">J1 AZUL</div>
  </div>

  <div class="nav-guide">
    <h2>MAPA DE NIVELES</h2>
  </div>

  <div class="ctrl-surface">
    <div class="dpad-container">
      <div class="dpad-btn up">▲</div>
      <div class="dpad-btn left">◀</div>
      <div class="dpad-btn right">▶</div>
      <div class="dpad-btn down">▼</div>
    </div>

    <div class="action-cluster">
      <div class="btn-act accept">¡ENTRAR AL NIVEL!</div>
      <div class="btn-act gather">REUNIR GRUPO</div>
    </div>
  </div>

  <div class="sb-strip">
    <div class="sb-grid">
      <div class="sb-btn">BOCINA</div>
      <div class="sb-btn">AUUU</div>
      <div class="sb-btn">BING</div>
      <div class="sb-btn">FAAH</div>
      <div class="sb-btn">OMG</div>
      <div class="sb-btn">ALLAH</div>
    </div>
  </div>
</body>
</html>`;

  // =========================================================================
  // DIRECTION 3: RETRO CONSOLE 16-BIT SUPER (SNES + Jackbox Deluxe)
  // =========================================================================
  const d3_tv = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dirección 3 (TV): Retro Console 16-Bit Super</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      width: 1920px; height: 1080px; overflow: hidden;
      background: #0b0f19;
      font-family: 'Rubik', sans-serif;
      color: #f8fafc;
      display: flex; flex-direction: column;
      padding: 36px 48px;
    }
    header {
      display: flex; justify-content: space-between; align-items: center;
      background: #1e293b;
      border: 3px solid #334155;
      border-radius: 18px;
      padding: 16px 36px;
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.5);
      margin-bottom: 30px;
    }
    .brand {
      display: flex; align-items: center; gap: 16px;
    }
    .brand-icon {
      font-size: 32px; color: #38bdf8;
    }
    .brand-title {
      font-family: 'Bungee', cursive;
      font-size: 36px;
      color: #38bdf8;
      text-shadow: 0 2px 8px rgba(56, 189, 248, 0.4);
      letter-spacing: 1px;
    }
    .room-pill {
      display: flex; align-items: center; gap: 18px;
    }
    .url-chip {
      background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px;
      padding: 8px 24px; font-size: 22px; font-weight: 800; color: #38bdf8;
    }
    .count-chip {
      background: #10b981; color: #0b0f19; border-radius: 12px;
      padding: 8px 20px; font-size: 20px; font-weight: 900;
    }

    main {
      flex: 1; display: grid; grid-template-columns: 560px 1fr; gap: 36px;
    }
    .qr-card {
      background: #1e293b;
      border: 3px solid #334155;
      border-radius: 24px;
      padding: 36px;
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.08), 0 12px 35px rgba(0,0,0,0.6);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
    }
    .qr-wrapper {
      padding: 16px; background: #ffffff; border-radius: 16px; margin-bottom: 24px;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
    }
    .qr-wrapper img { width: 280px; height: 280px; display: block; }
    .qr-card h2 {
      font-family: 'Bungee', cursive; font-size: 28px; color: #f8fafc; margin-bottom: 8px;
    }
    .qr-card p {
      font-size: 19px; font-weight: 700; color: #94a3b8;
    }

    .players-area {
      background: #1e293b;
      border: 3px solid #334155;
      border-radius: 24px;
      padding: 36px;
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.08), 0 12px 35px rgba(0,0,0,0.6);
      display: flex; flex-direction: column;
    }
    .players-header {
      display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 26px;
      padding-bottom: 16px; border-bottom: 2px solid #334155;
    }
    .players-header h2 {
      font-family: 'Bungee', cursive; font-size: 30px; color: #f8fafc;
    }
    .players-header span {
      font-size: 20px; font-weight: 700; color: #94a3b8;
    }

    .players-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; flex: 1;
    }
    .p-card {
      border: 2px solid #475569;
      border-radius: 18px;
      padding: 18px 24px;
      display: flex; align-items: center; gap: 20px;
      background: #0f172a;
      position: relative;
    }
    .p-card.p1 { border-color: #38bdf8; box-shadow: inset 0 0 15px rgba(56,189,248,0.15); }
    .p-card.p2 { border-color: #f43f5e; box-shadow: inset 0 0 15px rgba(244,63,94,0.15); }
    .p-card.p3 { border-color: #10b981; box-shadow: inset 0 0 15px rgba(16,185,129,0.15); }
    .p-card.p4 { border-color: #f59e0b; box-shadow: inset 0 0 15px rgba(245,158,11,0.15); }

    .p-avatar {
      width: 90px; height: 90px; background: #1e293b; border: 2px solid #475569;
      border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .p-info { flex: 1; }
    .p-name {
      font-size: 26px; font-weight: 800; margin-bottom: 6px;
    }
    .p-status {
      display: inline-block; background: #334155; color: #38bdf8;
      border-radius: 8px; padding: 4px 12px; font-size: 14px; font-weight: 800;
    }

    footer.bottom-bar {
      margin-top: 24px; display: flex; justify-content: space-between; align-items: center;
      background: #111827; border: 2px solid #374151; border-radius: 18px; padding: 16px 36px;
    }
    .bottom-hint { font-size: 20px; font-weight: 700; color: #9ca3af; }
    .btn-start {
      background: #38bdf8; color: #0b0f19;
      font-family: 'Bungee', cursive; font-size: 20px; padding: 12px 36px; border-radius: 12px;
      box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <h1 class="brand-title">JUEGO CHAVALIL</h1>
    </div>
    <div class="room-pill">
      <div class="url-chip">192.168.1.45:3000/player</div>
      <div class="count-chip">4 CONECTADOS</div>
    </div>
  </header>

  <main>
    <div class="qr-card">
      <div class="qr-wrapper">
        <img src="${qrDataUrl}" alt="QR">
      </div>
      <h2>UNIRSE A LA SALA</h2>
      <p>Escanea el código QR con tu móvil</p>
    </div>

    <div class="players-area">
      <div class="players-header">
        <h2>SALA DE ESPERA</h2>
        <span>4 Jugadores listos</span>
      </div>

      <div class="players-grid">
        <div class="p-card p1">
          <div class="p-avatar">${svgAyrton}</div>
          <div class="p-info">
            <div class="p-name">Ayrton</div>
            <div class="p-status">P1 · LÍDER AZUL</div>
          </div>
        </div>

        <div class="p-card p2">
          <div class="p-avatar">${svgAdri}</div>
          <div class="p-info">
            <div class="p-name">Adriachi</div>
            <div class="p-status">P2 · ROJO</div>
          </div>
        </div>

        <div class="p-card p3">
          <div class="p-avatar">${svgMarta}</div>
          <div class="p-info">
            <div class="p-name">Marta</div>
            <div class="p-status">P3 · VERDE</div>
          </div>
        </div>

        <div class="p-card p4">
          <div class="p-avatar">${svgManu}</div>
          <div class="p-info">
            <div class="p-name">Manu</div>
            <div class="p-status">P4 · ÁMBAR</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="bottom-bar">
    <div class="bottom-hint">Ayrton puede pulsar INICIAR cuando todos estén listos</div>
    <div class="btn-start">ARRANCAR PARTIDA</div>
  </footer>
</body>
</html>`;

  const d3_mobile = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Mando (Dirección 3): Retro Console 16-Bit Super</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; }
    body {
      width: 100vw; height: 100dvh; overflow: hidden;
      background: #0b0f19;
      font-family: 'Rubik', sans-serif; color: #f8fafc;
      display: flex; flex-direction: column;
      padding: env(safe-area-inset-top, 14px) 14px env(safe-area-inset-bottom, 14px) 14px;
    }
    .player-strip {
      background: #1e293b; border: 2px solid #334155; border-radius: 14px;
      padding: 8px 14px; display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .player-meta { display: flex; align-items: center; gap: 10px; }
    .strip-avatar {
      width: 44px; height: 44px; border: 2px solid #38bdf8; border-radius: 10px;
      overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center;
    }
    .strip-name { font-size: 20px; font-weight: 800; }
    .strip-badge {
      background: #38bdf8; color: #0b0f19; font-size: 13px; font-weight: 900;
      padding: 4px 10px; border-radius: 8px;
    }

    .nav-guide { text-align: center; margin-bottom: 8px; }
    .nav-guide h2 { font-family: 'Bungee', cursive; font-size: 16px; color: #38bdf8; }

    .ctrl-surface {
      flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: center;
    }
    .dpad-container {
      display: grid; grid-template-columns: repeat(3, 56px); grid-template-rows: repeat(3, 56px);
      gap: 6px; justify-content: center; align-content: center;
    }
    .dpad-btn {
      background: #1e293b; border: 2.5px solid #475569; border-radius: 12px;
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 5px 0 #0f172a; font-size: 22px; font-weight: 800;
      display: flex; align-items: center; justify-content: center; color: #f8fafc;
    }
    .dpad-btn:active { transform: translateY(3px); box-shadow: inset 0 2px 0 rgba(255,255,255,0.15), 0 2px 0 #0f172a; }
    .dpad-btn.up { grid-column: 2; grid-row: 1; }
    .dpad-btn.left { grid-column: 1; grid-row: 2; }
    .dpad-btn.right { grid-column: 3; grid-row: 2; }
    .dpad-btn.down { grid-column: 2; grid-row: 3; }

    .action-cluster {
      display: flex; flex-direction: column; gap: 12px; justify-content: center; height: 100%;
    }
    .btn-act {
      border-radius: 16px; padding: 18px 12px; font-weight: 900; font-size: 18px; text-align: center;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .btn-act.accept {
      background: #10b981; color: #0b0f19; border: 2.5px solid #059669;
      box-shadow: 0 6px 0 #047857; flex: 1.2;
    }
    .btn-act.accept:active { transform: translateY(4px); box-shadow: 0 2px 0 #047857; }
    .btn-act.gather {
      background: #f59e0b; color: #0b0f19; border: 2.5px solid #d97706;
      box-shadow: 0 5px 0 #b45309; flex: 1;
    }
    .btn-act.gather:active { transform: translateY(3px); box-shadow: 0 2px 0 #b45309; }

    .sb-strip {
      background: #1e293b; border: 2px solid #334155; border-radius: 14px;
      padding: 8px; margin-top: 8px;
    }
    .sb-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
    .sb-btn {
      background: #0f172a; border: 1.5px solid #334155; border-radius: 8px; padding: 6px 2px;
      font-size: 10px; font-weight: 800; text-align: center; color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="player-strip">
    <div class="player-meta">
      <div class="strip-avatar">${svgAyrtonThumb}</div>
      <div class="strip-name">Ayrton</div>
    </div>
    <div class="strip-badge">P1 · AZUL</div>
  </div>

  <div class="nav-guide">
    <h2>MAPA OVERWORLD</h2>
  </div>

  <div class="ctrl-surface">
    <div class="dpad-container">
      <div class="dpad-btn up">▲</div>
      <div class="dpad-btn left">◀</div>
      <div class="dpad-btn right">▶</div>
      <div class="dpad-btn down">▼</div>
    </div>

    <div class="action-cluster">
      <div class="btn-act accept">CONFIRMAR NIVEL</div>
      <div class="btn-act gather">LLAMAR AL EQUIPO</div>
    </div>
  </div>

  <div class="sb-strip">
    <div class="sb-grid">
      <div class="sb-btn">BOCINA</div>
      <div class="sb-btn">AUUU</div>
      <div class="sb-btn">BING</div>
      <div class="sb-btn">FAAH</div>
      <div class="sb-btn">OMG</div>
      <div class="sb-btn">ALLAH</div>
    </div>
  </div>
</body>
</html>`;

  // Write HTML files
  fs.writeFileSync('design/directions/direction-1-tv.html', d1_tv);
  fs.writeFileSync('design/directions/direction-1-mobile.html', d1_mobile);
  fs.writeFileSync('design/directions/direction-2-tv.html', d2_tv);
  fs.writeFileSync('design/directions/direction-2-mobile.html', d2_mobile);
  fs.writeFileSync('design/directions/direction-3-tv.html', d3_tv);
  fs.writeFileSync('design/directions/direction-3-mobile.html', d3_mobile);

  console.log('HTML files generated successfully in design/directions/');

  // Launch Edge to take screenshots
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const pairs = [
    { html: 'design/directions/direction-1-tv.html', out: 'design/directions/direction-1-tv.png', w: 1920, h: 1080 },
    { html: 'design/directions/direction-1-mobile.html', out: 'design/directions/direction-1-mobile.png', w: 412, h: 850 },
    { html: 'design/directions/direction-2-tv.html', out: 'design/directions/direction-2-tv.png', w: 1920, h: 1080 },
    { html: 'design/directions/direction-2-mobile.html', out: 'design/directions/direction-2-mobile.png', w: 412, h: 850 },
    { html: 'design/directions/direction-3-tv.html', out: 'design/directions/direction-3-tv.png', w: 1920, h: 1080 },
    { html: 'design/directions/direction-3-mobile.html', out: 'design/directions/direction-3-mobile.png', w: 412, h: 850 },
  ];

  for (const item of pairs) {
    const fullHtmlPath = path.resolve(item.html);
    await page.setViewport({ width: item.w, height: item.h, deviceScaleFactor: item.w === 1920 ? 1 : 2 });
    await page.goto('file:///' + fullHtmlPath.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: item.out });
    console.log('Screenshot captured:', item.out);
  }

  await browser.close();
  console.log('ALL DIRECTIONS GENERATED AND CAPTURED!');
}

createAll().catch(err => {
  console.error('Error generating directions:', err);
  process.exit(1);
});
