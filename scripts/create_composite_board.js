const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const compositeHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Sistema de Mandos Móviles Candy-Arcade</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px; height: 1080px;
      padding: 24px 36px;
      background-color: #f1f7fe;
      background-image: 
        radial-gradient(#38bdf8 2px, transparent 2.5px),
        radial-gradient(#f43f5e 2px, transparent 2.5px),
        radial-gradient(#facc15 2px, transparent 2.5px),
        url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 20 Q 30 5, 50 25 T 90 20 T 125 45 Q 110 75, 80 55 T 40 75 T 15 105 Q 35 135, 65 125 T 115 135' stroke='%23cbd5e1' stroke-width='2.8' stroke-linecap='round' fill='none' opacity='0.75'/%3E%3C/svg%3E");
      background-size: 70px 70px, 110px 110px, 90px 90px, 140px 140px;
      font-family: 'Outfit', sans-serif;
      color: #1e293b;
      display: flex; flex-direction: column;
    }
    header {
      background: #ffffff;
      border: 4.5px solid #1e293b;
      border-radius: 28px;
      padding: 12px 36px;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 6px 0 rgba(30, 41, 59, 0.12);
      margin-bottom: 20px;
    }
    .header-titles h1 {
      font-family: 'Fredoka', sans-serif; font-size: 34px; font-weight: 900; color: #1e293b;
      letter-spacing: -0.5px;
    }
    .header-titles p {
      font-size: 15px; font-weight: 800; color: #64748b; margin-top: 2px;
    }
    .header-tag {
      background: #fef08a; border: 3px solid #1e293b; border-radius: 14px;
      padding: 6px 20px; font-family: 'Fredoka', sans-serif; font-size: 16px; font-weight: 900;
      box-shadow: 0 3px 0 #1e293b;
    }

    .grid-container {
      flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 20px;
    }
    .grid-card {
      background: #ffffff;
      border: 4px solid #1e293b;
      border-radius: 26px;
      padding: 14px 18px;
      display: flex; flex-direction: column;
      box-shadow: 0 8px 0 rgba(30, 41, 59, 0.12);
    }
    .card-header {
      display: flex; flex-direction: column; gap: 2px;
      padding-bottom: 6px; border-bottom: 2px dashed #cbd5e1; margin-bottom: 10px;
      text-align: center;
    }
    .card-title {
      font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 900; color: #1e293b;
    }
    .card-desc {
      font-size: 11px; font-weight: 800; color: #64748b;
    }

    .device-stage {
      flex: 1; display: flex; align-items: center; justify-content: center;
      background: #f8fafc; border: 2.5px solid #e2e8f0; border-radius: 20px;
      overflow: hidden; padding: 6px;
    }

    /* Stylized Smartphone Bezel Mockups */
    .phone-mockup-portrait {
      height: 345px;
      width: 175px;
      background: #0f172a;
      border: 3.5px solid #1e293b;
      border-radius: 28px;
      padding: 6px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.22);
      display: flex; flex-direction: column;
    }
    .phone-screen-p {
      flex: 1; border-radius: 22px; overflow: hidden; background: #ffffff;
      display: flex; align-items: center; justify-content: center;
    }
    .phone-screen-p img {
      width: 100%; height: 100%; object-fit: fill; display: block;
    }

    .phone-mockup-landscape {
      width: 440px;
      height: 220px;
      background: #0f172a;
      border: 3.5px solid #1e293b;
      border-radius: 28px;
      padding: 6px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.22);
      display: flex;
    }
    .phone-screen-l {
      flex: 1; border-radius: 22px; overflow: hidden; background: #ffffff;
      display: flex; align-items: center; justify-content: center;
    }
    .phone-screen-l img {
      width: 100%; height: 100%; object-fit: fill; display: block;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-titles">
      <h1>SISTEMA DE MANDOS MÓVILES · JUEGO CHAVALIL</h1>
      <p>Estética Light Theme Candy-Arcade optimizada · Botones con física 3D, micro-relieve táctil y ergonomía para dos pulgares</p>
    </div>
    <div class="header-tag">★ EDICIÓN CUADRILLA ★</div>
  </header>

  <div class="grid-container">
    <!-- 1. MAPA OVERWORLD -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">1. MAPA OVERWORLD</span>
        <span class="card-desc">Cruceta D-Pad táctil + Botón entrar + Soundboard meme</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-portrait">
          <div class="phone-screen-p">
            <img src="mando-opt-1-overworld.png" alt="Overworld">
          </div>
        </div>
      </div>
    </div>

    <!-- 2. MARIO KART -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">2. MARIO KART (CARRERAS)</span>
        <span class="card-desc">Giro 50% izq + Clúster Acelerar (Verde), Derrape (Rosa), Objeto (Amarillo)</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-landscape">
          <div class="phone-screen-l">
            <img src="mando-opt-2-mariokart.png" alt="Mario Kart">
          </div>
        </div>
      </div>
    </div>

    <!-- 3. SUPER SMASH -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">3. SUPER SMASH (BRAWLER)</span>
        <span class="card-desc">D-Pad combate + Diamante de 4 acciones de caramelo (A, B, X, Y)</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-landscape">
          <div class="phone-screen-l">
            <img src="mando-opt-3-supersmash.png" alt="Super Smash">
          </div>
        </div>
      </div>
    </div>

    <!-- 4. PULSAR RÁPIDO -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">4. FASE DE PULSAR RÁPIDO / TRIVIAL</span>
        <span class="card-desc">4 botones gigantes de caramelo (A, B, X, Y) + Badge central (!)</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-portrait">
          <div class="phone-screen-p">
            <img src="mando-opt-5-candyquad.png" alt="Pulsar Rápido">
          </div>
        </div>
      </div>
    </div>

    <!-- 5. BUTTON BASH -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">5. BUTTON BASH (DIANA DARDO)</span>
        <span class="card-desc">Buzzer circular arcade de cúpula táctil 3D (1º fija X · 2º fija Y)</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-portrait">
          <div class="phone-screen-p">
            <img src="mando-opt-4-buttonbash.png" alt="Button Bash">
          </div>
        </div>
      </div>
    </div>

    <!-- 6. ROTATE -->
    <div class="grid-card">
      <div class="card-header">
        <span class="card-title">6. TRANSICIÓN A HORIZONTAL</span>
        <span class="card-desc">Invitación visual animada al pasar de mapa a minijuegos de velocidad</span>
      </div>
      <div class="device-stage">
        <div class="phone-mockup-landscape">
          <div class="phone-screen-l">
            <img src="mando-6-rotate.png" alt="Rotate">
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('design/directions/sistema-mandos-moviles.html', compositeHTML);

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const fullHtml = path.resolve('design/directions/sistema-mandos-moviles.html');
  await page.goto('file:///' + fullHtml.replace(/\\\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'design/directions/sistema-mandos-moviles.png' });
  await browser.close();
  console.log('sistema-mandos-moviles.png updated successfully!');
}

run().catch(e => { console.error(e); process.exit(1); });
