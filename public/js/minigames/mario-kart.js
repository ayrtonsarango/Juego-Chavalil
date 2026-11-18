/**
 * SUPER MARIO KART: GRAN PREMIO CHAVALIL (SNES MODE 7 ULTRA RÉPLICA)
 * 
 * Motor de carreras Mode 7 en HTML5 Canvas:
 * - Proyección Scanline Mode 7 a 60 FPS con texturas originales de SNES (Mario Circuit 1 512x512).
 * - Sprite sheets originales de personajes (Mario, Luigi, Peach, Toad, Yoshi, Bowser, Donkey Kong, Koopa, Wario)
 *   con 22 ángulos de rotación 3D, frames de derrape y spin-out.
 * - Fondo parallax SNES (bg_hills y bg_trees) sincronizado con el ángulo de cámara.
 * - Objetos en pista en 3D (Cajas ?, Plátanos, Caparazones Verdes con rebotes, Caparazones Rojos teledirigidos, Champiñones Turbo, Estrellas).
 * - Mitad inferior de pantalla: Radar 2D de Mario Circuit 1 en tiempo real, velocímetro digital LED,
 *   ruleta de objetos, cronómetro de vueltas y tabla de clasificaciones en directo.
 * - Integración con mandos móviles Socket.io (steer, gas, drift, item).
 */

class MarioKartEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = options;
    this.onComplete = options.onComplete || (() => {});

    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Viewport layout: Upper Mode 7 3D (1280x460), Lower Dashboard/Radar (1280x260)
    this.m7ViewW = 1280;
    this.m7ViewH = 460;
    this.dashY = 460;
    this.dashH = 260;

    // Internal low-res Mode 7 render buffer (crispy authentic 16-bit SNES look & blazing 60 FPS)
    this.bufW = 320;
    this.bufH = 160;
    this.horizonY = 52;
    this.camHeight = 22;
    this.focalLength = 135;
    this.camDistBehind = 18;

    this.m7Canvas = document.createElement('canvas');
    this.m7Canvas.width = this.bufW;
    this.m7Canvas.height = this.bufH;
    this.m7Ctx = this.m7Canvas.getContext('2d');
    this.m7ImgData = this.m7Ctx.createImageData(this.bufW, this.bufH);
    this.m7Buf32 = new Uint32Array(this.m7ImgData.data.buffer);

    this.running = false;
    this.animationId = null;
    this.lastTime = performance.now();

    // Circuit Waypoints on Mario Circuit 1 (512x512 track coordinates)
    this.waypoints = [
      { x: 40, y: 160 },  // 0: Start / Finish Line
      { x: 45, y: 80 },   // 1: Northbound Straight
      { x: 63, y: 48 },   // 2: North Curve Entry
      { x: 100, y: 36 },  // 3: North Curve Apex
      { x: 183, y: 66 },  // 4: Long Diagonal Straight
      { x: 284, y: 118 }, // 5: Diagonal Mid
      { x: 385, y: 170 }, // 6: Diagonal Lower
      { x: 456, y: 226 }, // 7: Hairpin Entry
      { x: 468, y: 280 }, // 8: Hairpin Mid
      { x: 468, y: 360 }, // 9: Hairpin Exit
      { x: 454, y: 420 }, // 10: South Curve Entry
      { x: 389, y: 454 }, // 11: South Hairpin Apex
      { x: 345, y: 449 }, // 12: South Hairpin Exit
      { x: 306, y: 398 }, // 13: Infield Chicane Entry
      { x: 240, y: 306 }, // 14: Chicane Apex 1
      { x: 197, y: 312 }, // 15: Chicane Apex 2
      { x: 127, y: 359 }, // 16: Chicane Return
      { x: 73, y: 385 },  // 17: Southwest Curve Entry
      { x: 50, y: 359 },  // 18: Onto Main Straight
      { x: 40, y: 240 }   // 19: Main Straight Approach
    ];

    // Total Laps
    this.totalLaps = 3;
    this.players = [];
    this.itemsOnTrack = [];
    this.itemBoxes = [];
    this.particles = [];
    this.skidmarks = [];
    this.screenShake = 0;
    this.floatingTexts = [];
    this.radarSweepAngle = 0;

    this.raceState = 'countdown'; // 'countdown' | 'racing' | 'podium'
    this.countdownTimer = 3.5;
    this.raceTimer = 0;
    this.winningTeam = null;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.finishOrder = [];

    // Camera State
    this.camX = 40;
    this.camY = 180;
    this.camAngle = -Math.PI / 2; // Facing North

    // Asset Cache
    this.assets = {};
    this.assetsLoaded = false;
    this.trackCanvas = document.createElement('canvas');
    this.trackCanvas.width = 512;
    this.trackCanvas.height = 512;
    this.trackCtx = this.trackCanvas.getContext('2d');
    this.trackBuf32 = null;

    // Avatar Cache
    this.avatarImages = {};

    this.initItemBoxes();
    this.loadAssets();
  }

  loadAssets() {
    const list = [
      { key: 'map', src: '/media/mariokart/map_1.png' },
      { key: 'bgHills', src: '/media/mariokart/bg_hills.png' },
      { key: 'bgTrees', src: '/media/mariokart/bg_trees.png' },
      { key: 'mario', src: '/media/mariokart/sprite_mario.png' },
      { key: 'luigi', src: '/media/mariokart/sprite_luigi.png' },
      { key: 'peach', src: '/media/mariokart/sprite_peach.png' },
      { key: 'toad', src: '/media/mariokart/sprite_toad.png' },
      { key: 'yoshi', src: '/media/mariokart/sprite_yoshi.png' },
      { key: 'bowser', src: '/media/mariokart/sprite_bowser.png' },
      { key: 'donkey', src: '/media/mariokart/sprite_donkey-kong.png' },
      { key: 'koopa', src: '/media/mariokart/sprite_koopa.png' },
      { key: 'wario', src: '/media/mariokart/sprite_wario.png' },
      { key: 'box', src: '/media/mariokart/sprite_box.png' },
      { key: 'banana', src: '/media/mariokart/sprite_banane.png' },
      { key: 'shellGreen', src: '/media/mariokart/sprite_carapace.png' },
      { key: 'shellRed', src: '/media/mariokart/sprite_carapace-rouge.png' },
      { key: 'mushroom', src: '/media/mariokart/sprite_champi.png' },
      { key: 'star', src: '/media/mariokart/sprite_etoile.png' },
      { key: 'pipe', src: '/media/mariokart/sprite_tuyau.png' }
    ];

    let loadedCount = 0;
    list.forEach(item => {
      const img = new Image();
      img.onload = () => {
        this.assets[item.key] = img;
        loadedCount++;
        if (item.key === 'map') {
          this.trackCtx.drawImage(img, 0, 0, 512, 512);
          const imgData = this.trackCtx.getImageData(0, 0, 512, 512);
          this.trackBuf32 = new Uint32Array(imgData.data.buffer);
        }
        if (loadedCount === list.length) {
          this.assetsLoaded = true;
        }
      };
      img.onerror = () => {
        console.warn(`Error loading asset: ${item.src}`);
        loadedCount++;
        if (loadedCount === list.length) this.assetsLoaded = true;
      };
      img.src = item.src;
    });
  }

  initItemBoxes() {
    this.itemBoxes = [
      { x: 42, y: 110, active: true, respawnTimer: 0 },
      { x: 183, y: 66, active: true, respawnTimer: 0 },
      { x: 284, y: 118, active: true, respawnTimer: 0 },
      { x: 468, y: 320, active: true, respawnTimer: 0 },
      { x: 389, y: 454, active: true, respawnTimer: 0 },
      { x: 240, y: 306, active: true, respawnTimer: 0 },
      { x: 127, y: 359, active: true, respawnTimer: 0 }
    ];
  }

  async prepareAvatars(playerList) {
    const promises = playerList.map(p => {
      return new Promise((resolve) => {
        if (!p.avatar || typeof renderAvatarSVG === 'undefined') {
          resolve();
          return;
        }
        const svg = renderAvatarSVG(p.avatar, 64);
        const img = new Image();
        img.onload = () => {
          this.avatarImages[p.id] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    });
    await Promise.all(promises);
  }

  init(playerList, teams = {}) {
    this.running = true;
    this.raceState = 'countdown';
    this.countdownTimer = 3.5;
    this.raceTimer = 0;
    this.itemsOnTrack = [];
    this.particles = [];
    this.skidmarks = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.finishOrder = [];
    this.winningTeam = null;

    const teamA = (teams.teamA || []).map(p => p.id);

    // Authentic character mapping to original SNES sprite sheets
    const charSpriteMap = {
      ayrton: 'mario',
      violeta: 'peach',
      asier: 'luigi',
      marta: 'toad',
      djon: 'bowser',
      dj: 'bowser',
      adriachi: 'yoshi',
      lerga: 'donkey',
      hua: 'koopa',
      lucia: 'peach',
      yago: 'wario',
      alel: 'wario',
      eneko: 'luigi',
      santi: 'mario'
    };

    const spriteFallbackList = ['mario', 'luigi', 'peach', 'toad', 'yoshi', 'bowser', 'donkey', 'koopa', 'wario'];

    // Staggered SNES starting grid positions along the start straight (facing North)
    // Human players placed with rivals visible ahead of them on the grid!
    const gridPositions = [
      { x: 38, y: 154 }, // Pole position 1
      { x: 44, y: 164 }, // Pole position 2
      { x: 38, y: 174 }, // Position 3
      { x: 44, y: 184 }, // Position 4 (Human P1 starts here with leaders in front!)
      { x: 38, y: 194 }, // Position 5
      { x: 44, y: 204 }, // Position 6
      { x: 38, y: 214 }, // Position 7
      { x: 44, y: 224 }  // Position 8
    ];

    this.players = playerList.map((p, idx) => {
      const inTeamA = teamA.includes(p.id) || (idx % 2 === 0);
      const grid = gridPositions[idx % gridPositions.length];
      const charKey = (p.id || '').toLowerCase();
      const spriteKey = charSpriteMap[charKey] || spriteFallbackList[idx % spriteFallbackList.length];

      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        isAndroid: Boolean(p.isAndroid),
        team: inTeamA ? 'teamA' : 'teamB',
        teamColor: inTeamA ? '#3b82f6' : '#ef4444',
        teamName: inTeamA ? 'AZUL' : 'ROJO',
        spriteKey: spriteKey,

        // World Coordinates & Physics
        x: grid.x,
        y: grid.y,
        angle: -Math.PI / 2, // Facing North
        speed: 0,
        maxSpeed: 2.75,
        accel: 0.08,
        friction: 0.982,
        steerSpeed: 0.048,

        // Inputs
        inputSteer: 0,
        inputGas: false,
        inputDrift: false,
        inputItem: false,

        // Racing Progress
        lap: 0,
        nextWaypoint: 1,
        lapProgress: 0,
        finished: false,
        finishRank: 0,
        finishTime: 0,
        currentRank: idx + 1,

        // Items & Powerups
        item: null,
        itemRoulette: false,
        itemRouletteTimer: 0,
        turboTimer: 0,
        spinTimer: 0,
        starTimer: 0,
        driftCharge: 0,
        driftDir: 0,

        // Bot AI parameters
        aiWander: (Math.random() - 0.5) * 8,
        aiSkill: 0.88 + Math.random() * 0.12
      };
    });

    this.prepareAvatars(playerList);
    this.lastTime = performance.now();
    this.loop();
  }

  handlePlayerInput(playerId, data) {
    const kart = this.players.find(p => p.id === playerId);
    if (!kart) return;

    if (data.steer !== undefined) kart.inputSteer = Math.max(-1, Math.min(1, data.steer));
    if (data.gas !== undefined) kart.inputGas = Boolean(data.gas);
    if (data.drift !== undefined) kart.inputDrift = Boolean(data.drift);
    if (data.item !== undefined && data.item) {
      this.useItem(kart);
    }
  }

  useItem(kart) {
    if (!kart.item || kart.spinTimer > 0 || kart.itemRoulette) return;
    const itemType = kart.item;
    kart.item = null;

    if (window.soundEngine) soundEngine.playMarioCoin();

    if (itemType === 'mushroom') {
      // Mega Turbo Boost
      kart.turboTimer = 90; // ~1.5s
      this.screenShake = Math.max(this.screenShake, 8);
      if (!kart.isBot) this.addFloatingText('¡TURBO SETA!', '#22c55e', 1.2, 1.3);
      for (let i = 0; i < 16; i++) {
        this.createParticle(kart.x, kart.y, 'flame', kart.angle + Math.PI + (Math.random() - 0.5) * 0.6);
      }
    } else if (itemType === 'banana') {
      // Drop banana behind kart
      const dropDist = 14;
      if (!kart.isBot) this.addFloatingText('¡PLÁTANO!', '#facc15', 0.8, 1.0);
      this.itemsOnTrack.push({
        type: 'banana',
        x: kart.x - Math.cos(kart.angle) * dropDist,
        y: kart.y - Math.sin(kart.angle) * dropDist,
        radius: 6,
        ownerId: kart.id,
        createdAt: performance.now()
      });
    } else if (itemType === 'shellGreen') {
      // Fire green shell forward with bouncing
      if (!kart.isBot) this.addFloatingText('¡CAPARAZÓN VERDE!', '#4ade80', 0.9, 1.1);
      this.itemsOnTrack.push({
        type: 'shellGreen',
        x: kart.x + Math.cos(kart.angle) * 12,
        y: kart.y + Math.sin(kart.angle) * 12,
        vx: Math.cos(kart.angle) * 5.2,
        vy: Math.sin(kart.angle) * 5.2,
        radius: 6,
        ownerId: kart.id,
        bounces: 0,
        createdAt: performance.now()
      });
    } else if (itemType === 'shellRed') {
      // Fire homing red shell towards leading kart
      const targets = this.players.filter(p => !p.finished && p.id !== kart.id && p.currentRank < kart.currentRank);
      const target = targets.length > 0 ? targets[0] : null;
      if (!kart.isBot) this.addFloatingText('¡CAPARAZÓN ROJO!', '#ef4444', 0.9, 1.1);

      this.itemsOnTrack.push({
        type: 'shellRed',
        x: kart.x + Math.cos(kart.angle) * 12,
        y: kart.y + Math.sin(kart.angle) * 12,
        vx: Math.cos(kart.angle) * 4.8,
        vy: Math.sin(kart.angle) * 4.8,
        targetId: target ? target.id : null,
        radius: 6,
        ownerId: kart.id,
        bounces: 0,
        createdAt: performance.now()
      });
    } else if (itemType === 'star') {
      // Super Star Invincibility
      kart.starTimer = 160;
      kart.turboTimer = 100;
      this.screenShake = Math.max(this.screenShake, 10);
      if (!kart.isBot) this.addFloatingText('¡SUPER ESTRELLA!', '#facc15', 1.4, 1.4);
    }
  }

  addFloatingText(text, color = '#facc15', duration = 1.0, scale = 1.0) {
    this.floatingTexts.push({
      text,
      color,
      x: this.m7ViewW / 2,
      y: this.m7ViewH / 2 - 35,
      alpha: 1.0,
      scale,
      duration,
      life: duration
    });
  }

  createParticle(x, y, type, angle = 0, speed = 1.8) {
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
      life: 1.0,
      decay: 0.045 + Math.random() * 0.03,
      type // 'smoke' | 'spark' | 'flame' | 'star'
    });
  }

  // Check if track pixel is asphalt or off-road
  isOffroad(x, y) {
    if (!this.trackBuf32) return false;
    const ix = Math.floor(x) & 511;
    const iy = Math.floor(y) & 511;
    const pixel = this.trackBuf32[(iy << 9) | ix];
    const r = pixel & 0xFF;
    const g = (pixel >> 8) & 0xFF;
    const b = (pixel >> 16) & 0xFF;

    // Asphalt road in SNES Mario Circuit 1 has low saturation gray (r ≈ g ≈ b ≈ 96-176)
    const isGray = Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && r > 70 && r < 200;
    const isCurb = (r > 200 && g > 200 && b > 200) || (r > 180 && g < 80); // White checker / Red curb

    return !(isGray || isCurb);
  }

  update(dt) {
    if (!this.running) return;

    // Decay Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 26);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 32;
      ft.alpha = Math.max(0, ft.life / ft.duration);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Update Radar Sweep
    this.radarSweepAngle = (this.radarSweepAngle + dt * 2.8) % (Math.PI * 2);

    // Countdown
    if (this.raceState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.raceState = 'racing';
        if (window.soundEngine) soundEngine.playCelebrationJump();
      }
      return;
    }

    if (this.raceState === 'racing') {
      this.raceTimer += dt;
    }

    // Respawn Item Boxes
    this.itemBoxes.forEach(box => {
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) box.active = true;
      }
    });

    // Update Skidmarks decay
    for (let i = this.skidmarks.length - 1; i >= 0; i--) {
      this.skidmarks[i].alpha -= dt * 0.12;
      if (this.skidmarks[i].alpha <= 0) this.skidmarks.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Items on Track (Shells & Bananas)
    for (let i = this.itemsOnTrack.length - 1; i >= 0; i--) {
      const item = this.itemsOnTrack[i];
      if (item.type === 'shellGreen' || item.type === 'shellRed') {
        // Red shell homing
        if (item.type === 'shellRed' && item.targetId) {
          const tgt = this.players.find(p => p.id === item.targetId);
          if (tgt && !tgt.finished) {
            const targetAngle = Math.atan2(tgt.y - item.y, tgt.x - item.x);
            const currentAngle = Math.atan2(item.vy, item.vx);
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const newAngle = currentAngle + Math.sign(diff) * Math.min(0.08, Math.abs(diff));
            const spd = Math.hypot(item.vx, item.vy);
            item.vx = Math.cos(newAngle) * spd;
            item.vy = Math.sin(newAngle) * spd;
          }
        }

        item.x += item.vx;
        item.y += item.vy;

        // Bounce if hitting off-road
        if (this.isOffroad(item.x, item.y)) {
          item.vx = -item.vx * 0.85;
          item.vy = -item.vy * 0.85;
          item.bounces++;
          if (item.bounces > 4) {
            this.itemsOnTrack.splice(i, 1);
            continue;
          }
        }

        // Lifetime 7s
        if (performance.now() - item.createdAt > 7000) {
          this.itemsOnTrack.splice(i, 1);
          continue;
        }
      }
    }

    // Update Karts
    this.players.forEach(kart => {
      // Item roulette spinning
      if (kart.itemRoulette) {
        kart.itemRouletteTimer -= dt;
        if (kart.itemRouletteTimer <= 0) {
          kart.itemRoulette = false;
          const pool = ['mushroom', 'banana', 'shellGreen', 'shellRed', 'star'];
          // Bias item based on rank (players behind get stars/mushrooms)
          if (kart.currentRank > 3 && Math.random() < 0.6) {
            kart.item = Math.random() < 0.5 ? 'star' : 'mushroom';
          } else {
            kart.item = pool[Math.floor(Math.random() * pool.length)];
          }
        }
      }

      if (kart.finished) {
        kart.speed *= 0.95;
        kart.x += Math.cos(kart.angle) * kart.speed;
        kart.y += Math.sin(kart.angle) * kart.speed;
        return;
      }

      // Bot AI
      if (kart.isBot) {
        this.updateBotAI(kart);
      }

      // Spin out effect
      if (kart.spinTimer > 0) {
        kart.spinTimer--;
        kart.angle += 0.38;
        kart.speed *= 0.92;
        kart.x += Math.cos(kart.angle) * kart.speed;
        kart.y += Math.sin(kart.angle) * kart.speed;
        this.createParticle(kart.x, kart.y, 'smoke', kart.angle + Math.PI, 0.8);
        return;
      }

      // Check Off-road surface
      const offroad = this.isOffroad(kart.x, kart.y);
      let currentMaxSpeed = kart.maxSpeed;

      if (offroad && kart.starTimer <= 0) {
        currentMaxSpeed *= 0.45;
        if (Math.random() < 0.25) {
          this.createParticle(kart.x, kart.y, 'smoke', kart.angle + Math.PI, 0.9);
        }
      }

      if (kart.turboTimer > 0) {
        kart.turboTimer--;
        currentMaxSpeed = 4.2;
        kart.speed = Math.max(kart.speed, 3.8);
        if (Math.random() < 0.5) {
          this.createParticle(kart.x, kart.y, 'flame', kart.angle + Math.PI + (Math.random() - 0.5) * 0.4, 2.2);
        }
      }

      if (kart.starTimer > 0) {
        kart.starTimer--;
      }

      // Gas / Accel
      if (kart.inputGas) {
        kart.speed += kart.accel;
        if (kart.speed > currentMaxSpeed) kart.speed = currentMaxSpeed;
      } else {
        kart.speed *= kart.friction;
      }

      // Steering & Drift
      if (kart.speed > 0.15) {
        let steerFactor = kart.steerSpeed;
        if (kart.inputDrift) {
          steerFactor *= 1.35;
          kart.driftCharge++;
          if (kart.driftCharge > 35) {
            const sparkType = kart.driftCharge > 70 ? 'flame' : 'spark';
            this.createParticle(kart.x, kart.y, sparkType, kart.angle + Math.PI + (Math.random() - 0.5) * 0.7, 1.4);
          }
          if (kart.speed > 0.8 && Math.random() < 0.4) {
            this.skidmarks.push({
              x: kart.x,
              y: kart.y,
              alpha: 0.75
            });
          }
        } else {
          // Release drift mini-turbo!
          if (kart.driftCharge > 70) {
            kart.turboTimer = 50; // Super Orange Boost
            this.screenShake = Math.max(this.screenShake, 8);
            if (!kart.isBot) this.addFloatingText('¡SUPER TURBO!', '#f97316', 1.1, 1.3);
            if (window.soundEngine) soundEngine.playCelebrationJump();
          } else if (kart.driftCharge > 35) {
            kart.turboTimer = 25; // Blue Mini Turbo
            this.screenShake = Math.max(this.screenShake, 5);
            if (!kart.isBot) this.addFloatingText('¡MINI TURBO!', '#38bdf8', 0.9, 1.1);
          }
          kart.driftCharge = 0;
        }

        kart.angle += kart.inputSteer * steerFactor;
      }

      // Move forward
      kart.x += Math.cos(kart.angle) * kart.speed;
      kart.y += Math.sin(kart.angle) * kart.speed;

      // Check Item Box pickups
      this.itemBoxes.forEach(box => {
        if (box.active && !kart.item && !kart.itemRoulette) {
          const dist = Math.hypot(kart.x - box.x, kart.y - box.y);
          if (dist < 10) {
            box.active = false;
            box.respawnTimer = 6.0;
            kart.itemRoulette = true;
            kart.itemRouletteTimer = 1.4; // 1.4s roulette roll
            if (!kart.isBot) this.addFloatingText('¡OBJETO!', '#facc15', 0.8, 1.1);
            if (window.soundEngine) soundEngine.playMarioCoin();
            for (let i = 0; i < 14; i++) {
              this.createParticle(box.x, box.y, 'spark', Math.random() * Math.PI * 2, 2.5);
            }
          }
        }
      });

      // Check Hazard collisions (Bananas, Shells)
      for (let i = this.itemsOnTrack.length - 1; i >= 0; i--) {
        const item = this.itemsOnTrack[i];
        if (item.ownerId === kart.id && (performance.now() - item.createdAt < 1200)) continue;
        const dist = Math.hypot(kart.x - item.x, kart.y - item.y);
        if (dist < 8) {
          // Hit!
          this.itemsOnTrack.splice(i, 1);
          if (kart.starTimer > 0) continue; // Invincible!

          kart.spinTimer = 35; // Spin out!
          kart.speed *= 0.2;
          this.screenShake = 16;
          if (!kart.isBot) this.addFloatingText('¡SPIN OUT!', '#ef4444', 1.2, 1.4);
          if (window.soundEngine) soundEngine.playHonk();
          for (let p = 0; p < 16; p++) {
            this.createParticle(kart.x, kart.y, 'smoke', Math.random() * Math.PI * 2, 2.0);
            this.createParticle(kart.x, kart.y, 'spark', Math.random() * Math.PI * 2, 2.4);
          }
        }
      }

      // Waypoint & Lap Checkpoints
      const targetWp = this.waypoints[kart.nextWaypoint];
      const distToWp = Math.hypot(kart.x - targetWp.x, kart.y - targetWp.y);
      if (distToWp < 38) {
        kart.nextWaypoint = (kart.nextWaypoint + 1) % this.waypoints.length;
        if (kart.nextWaypoint === 1) {
          // Crossed Start/Finish Line!
          kart.lap++;
          if (window.soundEngine) soundEngine.playMarioCoin();
          if (!kart.isBot) {
            this.addFloatingText(kart.lap >= this.totalLaps ? '¡META FINAL!' : (kart.lap === this.totalLaps - 1 ? '¡ÚLTIMA VUELTA!' : `¡VUELTA ${kart.lap + 1}!`), '#fbbf24', 1.5, 1.4);
          }
          if (kart.lap >= this.totalLaps) {
            // Finished Race!
            kart.finished = true;
            this.finishOrder.push(kart);
            kart.finishRank = this.finishOrder.length;
            kart.finishTime = this.raceTimer;
            this.checkRaceEnd();
          }
        }
      }

      // Compute continuous lap progress for live ranking
      kart.lapProgress = kart.lap * 1000 + kart.nextWaypoint * 50 - distToWp;
    });

    // Update Live Standings Ranks
    const sorted = [...this.players].sort((a, b) => {
      if (a.finished && b.finished) return a.finishRank - b.finishRank;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.lapProgress - a.lapProgress;
    });

    sorted.forEach((p, rankIdx) => {
      p.currentRank = rankIdx + 1;
    });

    // Camera smoothly follows Player 1 / Leading human kart
    const camKart = this.players.find(p => !p.isBot) || this.players[0];
    if (camKart) {
      // Damped camera tracking
      this.camAngle += (camKart.angle - this.camAngle) * 0.14;
      const targetCamX = camKart.x - Math.cos(this.camAngle) * this.camDistBehind;
      const targetCamY = camKart.y - Math.sin(this.camAngle) * this.camDistBehind;
      this.camX += (targetCamX - this.camX) * 0.22;
      this.camY += (targetCamY - this.camY) * 0.22;
    }
  }

  updateBotAI(kart) {
    const targetWp = this.waypoints[kart.nextWaypoint];
    const targetX = targetWp.x + kart.aiWander;
    const targetY = targetWp.y + kart.aiWander;

    const angleToTarget = Math.atan2(targetY - kart.y, targetX - kart.x);
    let diff = angleToTarget - kart.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    // Steer towards target
    if (Math.abs(diff) > 0.08) {
      kart.inputSteer = Math.sign(diff);
    } else {
      kart.inputSteer = 0;
    }

    // Drift into tight corners
    kart.inputDrift = Math.abs(diff) > 0.65;

    // Always gas unless spinning
    kart.inputGas = true;

    // Use items smartly
    if (kart.item && Math.random() < 0.02) {
      this.useItem(kart);
    }
  }

  checkRaceEnd() {
    const unfinished = this.players.filter(p => !p.finished);
    if (unfinished.length === 0 || (this.finishOrder.length >= 1 && unfinished.every(p => p.isBot))) {
      this.raceState = 'podium';

      // Calculate scores
      let scoreA = 0;
      let scoreB = 0;
      this.players.forEach(p => {
        const pts = Math.max(1, 9 - p.currentRank);
        if (p.team === 'teamA') scoreA += pts;
        else scoreB += pts;
      });

      this.teamScores = { teamA: scoreA, teamB: scoreB };
      this.winningTeam = scoreA >= scoreB ? 'teamA' : 'teamB';

      if (window.soundEngine) soundEngine.playSocialCreditVictory();

      setTimeout(() => {
        this.onComplete({
          gameType: 'race',
          winningTeam: this.winningTeam,
          scores: this.teamScores,
          players: this.players.map(p => ({ id: p.id, rank: p.currentRank, team: p.team }))
        });
      }, 5500);
    }
  }

  // Render Upper Half: SNES Mode 7 3D Perspective Projection
  renderMode7(ctx) {
    ctx.save();
    if (this.screenShake > 0.1) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    const W = this.bufW;
    const H = this.bufH;
    const horizon = this.horizonY;
    const hc = this.camHeight;
    const f = this.focalLength;
    const camX = this.camX;
    const camY = this.camY;
    const angle = this.camAngle;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const xc = W / 2;

    // 1. Draw Parallax Background Sky & Hills into Mode 7 offscreen canvas
    const skyGrad = this.m7Ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, '#2563eb');
    skyGrad.addColorStop(0.65, '#60a5fa');
    skyGrad.addColorStop(1, '#93c5fd');
    this.m7Ctx.fillStyle = skyGrad;
    this.m7Ctx.fillRect(0, 0, W, horizon);

    // Parallax scrolling hills
    if (this.assets.bgHills) {
      const bg = this.assets.bgHills;
      const hillH = 26;
      const scrollX = Math.floor((-angle * 120) % bg.width);
      for (let bx = scrollX - bg.width; bx < W; bx += bg.width) {
        this.m7Ctx.drawImage(bg, 0, 0, bg.width, bg.height, bx, horizon - hillH, bg.width, hillH);
      }
    }
    // Parallax scrolling foreground trees
    if (this.assets.bgTrees) {
      const bg = this.assets.bgTrees;
      const treeH = 20;
      const scrollX = Math.floor((-angle * 240) % bg.width);
      for (let bx = scrollX - bg.width; bx < W; bx += bg.width) {
        this.m7Ctx.drawImage(bg, 0, 0, bg.width, bg.height, bx, horizon - treeH + 1, bg.width, treeH);
      }
    }

    // 2. Scanline Mode 7 Ground Projection
    if (this.trackBuf32) {
      const src32 = this.trackBuf32;
      const dst32 = this.m7Buf32;
      const borderGrass = src32[(480 << 9) | 100]; // Authentic SNES off-road grass

      for (let y = horizon + 1; y < H; y++) {
        const dy = y - horizon;
        const z = (hc * f) / dy;
        const dx = z / f;

        const wx0 = camX + z * cosA + xc * dx * sinA;
        const wy0 = camY + z * sinA - xc * dx * cosA;

        const stepX = -dx * sinA;
        const stepY = dx * cosA;

        let wx = wx0;
        let wy = wy0;
        let dstIdx = y * W;

        for (let x = 0; x < W; x++) {
          const mapX = Math.floor(wx);
          const mapY = Math.floor(wy);
          if (mapX >= 0 && mapX < 512 && mapY >= 0 && mapY < 512) {
            dst32[dstIdx++] = src32[(mapY << 9) | mapX];
          } else {
            dst32[dstIdx++] = borderGrass;
          }
          wx += stepX;
          wy += stepY;
        }
      }
      // Copy ONLY the ground rectangle so the sky and parallax hills are never overwritten!
      this.m7Ctx.putImageData(this.m7ImgData, 0, 0, 0, horizon + 1, W, H - horizon - 1);
    }

    // 3. Project 3D Entities (Item Boxes, Bananas, Shells, Rival Karts)
    const entities = [];

    // Collect Item Boxes
    this.itemBoxes.forEach(b => {
      if (b.active) entities.push({ type: 'box', x: b.x, y: b.y });
    });

    // Collect Items on Track
    this.itemsOnTrack.forEach(item => {
      entities.push({ type: item.type, x: item.x, y: item.y });
    });

    // Collect Rival Karts
    const camKart = this.players.find(p => !p.isBot) || this.players[0];
    this.players.forEach(p => {
      if (p.id !== camKart.id) {
        entities.push({ type: 'kart', kart: p, x: p.x, y: p.y });
      }
    });

    // Sort entities by distance to camera (painter's algorithm)
    entities.forEach(ent => {
      const relX = ent.x - camX;
      const relY = ent.y - camY;
      ent.rz = relX * cosA + relY * sinA;
      ent.rx = relX * (-sinA) + relY * cosA;
    });

    entities.sort((a, b) => b.rz - a.rz);

    // Draw Mode 7 buffer scaled onto main canvas (pixelated 16-bit look)
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.m7Canvas, 0, 0, this.m7ViewW, this.m7ViewH);
    ctx.restore();

    // Render 3D Projected Entities directly onto main canvas for high-DPI crisp sprites
    const scaleFactorX = this.m7ViewW / W;
    const scaleFactorY = this.m7ViewH / H;

    entities.forEach(ent => {
      if (ent.rz <= 17 || ent.rz > 120) return; // Behind player kart or too far

      const screenX = (xc + (ent.rx / ent.rz) * f) * scaleFactorX;
      const screenY = (horizon + (hc / ent.rz) * f) * scaleFactorY;
      const spriteScale = (f / ent.rz) * 0.42;

      if (screenX < -60 || screenX > this.m7ViewW + 60) return;

      if (ent.type === 'kart') {
        this.render3DKartSprite(ctx, ent.kart, screenX, screenY, spriteScale, angle);
      } else if (ent.type === 'box') {
        this.render3DItemBox(ctx, screenX, screenY, spriteScale);
      } else if (ent.type === 'banana') {
        this.render3DBanana(ctx, screenX, screenY, spriteScale);
      } else if (ent.type === 'shellGreen' || ent.type === 'shellRed') {
        this.render3DShell(ctx, ent.type, screenX, screenY, spriteScale);
      }
    });

    // 4. Render 3D Projected Particles
    this.particles.forEach(p => {
      const relX = p.x - camX;
      const relY = p.y - camY;
      const rz = relX * cosA + relY * sinA;
      const rx = relX * (-sinA) + relY * cosA;
      if (rz <= 2 || rz > 130) return;

      const screenX = (xc + (rx / rz) * f) * scaleFactorX;
      const screenY = (horizon + (hc / rz) * f) * scaleFactorY;
      const pScale = (f / rz) * 0.42;
      const pSize = Math.max(3, pScale * (p.type === 'flame' ? 22 : (p.type === 'smoke' ? 26 : 14)) * p.life);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      if (p.type === 'flame') {
        ctx.fillStyle = p.life > 0.4 ? '#fb923c' : '#ef4444';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.life > 0.5 ? '#facc15' : '#fb923c';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;
      } else if (p.type === 'star') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 14;
      } else {
        ctx.fillStyle = `rgba(210, 220, 230, ${p.life * 0.75})`;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
      }
      ctx.beginPath();
      ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Render Player Kart in Bottom Center of 3D View
    if (camKart) {
      const playerScreenX = this.m7ViewW / 2;
      const playerScreenY = this.m7ViewH - 58;
      this.renderPlayerKartSprite(ctx, camKart, playerScreenX, playerScreenY);
    }

    // 6. Speed Lines / Warp Streaks during Turbo / Star
    if (camKart && (camKart.turboTimer > 0 || camKart.starTimer > 0)) {
      ctx.save();
      const numLines = camKart.starTimer > 0 ? 30 : 20;
      const centerX = this.m7ViewW / 2;
      const centerY = horizon * scaleFactorY;
      const color = camKart.starTimer > 0 ? '#facc15' : '#38bdf8';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < numLines; i++) {
        const ang = (i / numLines) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
        const r1 = 90 + Math.random() * 80;
        const r2 = 380 + Math.random() * 160;
        ctx.moveTo(centerX + Math.cos(ang) * r1, centerY + Math.sin(ang) * r1);
        ctx.lineTo(centerX + Math.cos(ang) * r2, centerY + Math.sin(ang) * r2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 7. Floating Arcade Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.font = `900 ${Math.round(28 * ft.scale)}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#020617';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore(); // Restore camera shake transform
  }

  // Render 3D Rival Kart with 22-angle sprite orientation
  render3DKartSprite(ctx, kart, x, y, scale, camAngle) {
    const img = this.assets[kart.spriteKey] || this.assets['mario'];
    if (!img) return;

    // Compute relative angle to camera (0 = rear, 11 = front)
    let rel = (kart.angle - camAngle) % (Math.PI * 2);
    if (rel < 0) rel += Math.PI * 2;
    let frame = Math.round((rel / (Math.PI * 2)) * 22) % 22;

    if (kart.spinTimer > 0) frame = 22; // Spin-out frame

    const frameW = 32;
    const frameH = 32;
    const drawW = frameW * scale * 2.8;
    const drawH = frameH * scale * 2.8;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Kart Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, drawW * 0.42, drawH * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sprite
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, x - drawW / 2, y - drawH + 4, drawW, drawH);

    // Floating Player Name & Team Badge
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    const tagW = ctx.measureText(kart.name).width + 14;
    ctx.fillStyle = kart.teamColor === '#3b82f6' ? 'rgba(30, 64, 175, 0.85)' : 'rgba(185, 28, 28, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x - tagW / 2, y - drawH - 16, tagW, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(kart.name, x, y - drawH - 4);

    // Chaval Avatar Head Badge over rival kart
    if (this.avatarImages[kart.id]) {
      const badgeSize = Math.max(16, Math.min(30, drawW * 0.45));
      ctx.drawImage(this.avatarImages[kart.id], x - badgeSize / 2, y - drawH - 18 - badgeSize, badgeSize, badgeSize);
    }

    ctx.restore();
  }

  // Render Player's own kart in cockpit view
  renderPlayerKartSprite(ctx, kart, x, y) {
    const img = this.assets[kart.spriteKey] || this.assets['mario'];
    if (!img) return;

    let frame = 0; // Straight rear view
    if (kart.spinTimer > 0) {
      frame = 22;
    } else if (kart.inputSteer < -0.2) {
      frame = 21; // Steer Left
    } else if (kart.inputSteer > 0.2) {
      frame = 1;  // Steer Right
    }

    const frameW = 32;
    const frameH = 32;
    const drawW = 105;
    const drawH = 105;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, drawW * 0.45, drawH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drift Sparks
    if (kart.inputDrift && kart.driftCharge > 30) {
      ctx.fillStyle = kart.driftCharge > 70 ? '#f97316' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(x - 38, y - 5, 8 + Math.random() * 4, 0, Math.PI * 2);
      ctx.arc(x + 38, y - 5, 8 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kart Sprite
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, x - drawW / 2, y - drawH + 18, drawW, drawH);

    // Chaval Avatar Head badge
    if (this.avatarImages[kart.id]) {
      ctx.drawImage(this.avatarImages[kart.id], x - 18, y - drawH - 12, 36, 36);
    }

    ctx.restore();
  }

  render3DItemBox(ctx, x, y, scale) {
    const img = this.assets.box;
    if (!img) return;
    const drawW = 22 * scale * 2.8;
    const drawH = 24 * scale * 2.8;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, img.width, img.height, x - drawW / 2, y - drawH, drawW, drawH);
    ctx.restore();
  }

  render3DBanana(ctx, x, y, scale) {
    const img = this.assets.banana;
    if (!img) return;
    const drawW = 16 * scale * 2.5;
    const drawH = 16 * scale * 2.5;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, img.width, img.height, x - drawW / 2, y - drawH, drawW, drawH);
    ctx.restore();
  }

  render3DShell(ctx, type, x, y, scale) {
    const img = type === 'shellRed' ? this.assets.shellRed : this.assets.shellGreen;
    if (!img) return;
    const drawW = 18 * scale * 2.5;
    const drawH = 18 * scale * 2.5;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 31, 32, x - drawW / 2, y - drawH, drawW, drawH);
    ctx.restore();
  }

  // Render Lower Half: Authentic SNES Dashboard & Real-Time Radar Minimap
  renderDashboard(ctx) {
    const dy = this.dashY;
    const dh = this.dashH;
    const dw = this.width;

    ctx.save();
    // Dark Carbon Chassis Background
    const bgGrad = ctx.createLinearGradient(0, dy, 0, dy + dh);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, dy, dw, dh);

    // Top gold bezel divider
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, dy);
    ctx.lineTo(dw, dy);
    ctx.stroke();

    // 1. LEFT PANEL: Authentic Mario Circuit 1 2D Radar Minimap (x: 20, y: dy + 15, w: 230, h: 230)
    this.renderCircuitRadar(ctx, 24, dy + 16, 228, 228);

    // 2. CENTER PANEL: Telemetry, Speedometer, Item Roulette & Controls (x: 280 to 860)
    this.renderTelemetry(ctx, 276, dy + 16, 570, 228);

    // 3. RIGHT PANEL: Live Standings Leaderboard (x: 870 to 1256)
    this.renderLiveLeaderboard(ctx, 866, dy + 16, 390, 228);

    ctx.restore();
  }

  renderCircuitRadar(ctx, rx, ry, rw, rh) {
    ctx.save();
    // Glass container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 10);
    ctx.fill();
    ctx.stroke();

    // Draw authentic 512x512 track map scaled into radar
    if (this.assets.map) {
      ctx.drawImage(this.assets.map, rx + 8, ry + 8, rw - 16, rh - 16);
    }

    // Scale factors
    const sx = (rw - 16) / 512;
    const sy = (rh - 16) / 512;

    // Sweeping Radar Beam Scanline
    const cx = rx + 8 + (rw - 16) / 2;
    const cy = ry + 8 + (rh - 16) / 2;
    const sweepRadius = (rw - 16) * 0.65;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx + 8, ry + 8, rw - 16, rh - 16);
    ctx.clip();
    const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sweepRadius);
    sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, sweepRadius, this.radarSweepAngle - 0.5, this.radarSweepAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw Item Boxes on Radar
    this.itemBoxes.forEach(b => {
      if (b.active) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(rx + 8 + b.x * sx - 2, ry + 8 + b.y * sy - 2, 4, 4);
      }
    });

    // Draw Karts on Radar
    this.players.forEach(p => {
      const px = rx + 8 + p.x * sx;
      const py = ry + 8 + p.y * sy;

      // Glow ring / Leader pulse
      if (p.currentRank === 1) {
        const pulse = 8 + Math.sin(performance.now() * 0.008) * 3;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = p.teamColor;
      ctx.beginPath();
      ctx.arc(px, py, p.currentRank === 1 ? 6.5 : 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Heading arrow
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(p.angle) * 8, py + Math.sin(p.angle) * 8);
      ctx.stroke();
    });

    // Radar Header Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('RADAR: MARIO CIRCUIT 1', rx + 12, ry + rh - 10);

    ctx.restore();
  }

  renderTelemetry(ctx, tx, ty, tw, th) {
    const camKart = this.players.find(p => !p.isBot) || this.players[0];

    ctx.save();
    // Telemetry Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, 10);
    ctx.fill();
    ctx.stroke();

    // 1. Digital LED Speedometer
    const speedKmh = Math.floor((camKart ? camKart.speed : 0) * 48);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 44px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${speedKmh.toString().padStart(3, ' ')}`, tx + 20, ty + 54);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#86efac';
    ctx.fillText('KM/H', tx + 125, ty + 50);

    // Speed bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tx + 20, ty + 68, 160, 10);
    const fillW = Math.min(160, (speedKmh / 160) * 160);
    ctx.fillStyle = speedKmh > 120 ? '#ef4444' : (speedKmh > 80 ? '#eab308' : '#22c55e');
    ctx.fillRect(tx + 20, ty + 68, fillW, 10);

    // 2. Lap Counter & Race Timer
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px Arial';
    const lapNum = camKart ? Math.min(this.totalLaps, camKart.lap + 1) : 1;
    ctx.fillText(`VUELTA: ${lapNum} / ${this.totalLaps}`, tx + 210, ty + 42);

    // Format Race Time
    const m = Math.floor(this.raceTimer / 60);
    const s = Math.floor(this.raceTimer % 60);
    const ms = Math.floor((this.raceTimer * 100) % 100);
    const timeStr = `${m}'${s.toString().padStart(2, '0')}"${ms.toString().padStart(2, '0')}`;
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#eab308';
    ctx.fillText(`TIEMPO: ${timeStr}`, tx + 210, ty + 74);

    // 3. Item Roulette Box
    const boxX = tx + 430;
    const boxY = ty + 16;
    const boxSize = 68;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, 8);
    ctx.fill();
    ctx.stroke();

    if (camKart && camKart.itemRoulette) {
      // Spinning roulette
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', boxX + boxSize / 2, boxY + boxSize / 2 + 12);
    } else if (camKart && camKart.item) {
      // Render held item
      const itemKey = camKart.item;
      const img = this.assets[itemKey];
      if (img) {
        ctx.drawImage(img, boxX + 10, boxY + 10, boxSize - 20, boxSize - 20);
      }
    } else {
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('[?]', boxX + boxSize / 2, boxY + boxSize / 2 + 10);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OBJETO', boxX + boxSize / 2, boxY + boxSize + 16);

    // 4. Mobile Controls Reminder Banner
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.beginPath();
    ctx.roundRect(tx + 18, ty + 115, tw - 36, 96, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText('🎮 CONTROLES MÓVIL (WebSockets en tiempo real):', tx + 32, ty + 140);

    ctx.font = '13px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• GIRA con los botones gigantes [ ◀ IZQUIERDA ] y [ DERECHA ▶ ]', tx + 32, ty + 162);
    ctx.fillText('• ACELERA con [ ⬆ GAS ] | DERRAPA con [ 🟡 DERRAPE ] para turbo en curvas', tx + 32, ty + 182);
    ctx.fillText('• DISPARA caparazones, plátanos y setas con [ 🔴 USAR OBJETO ]', tx + 32, ty + 200);

    ctx.restore();
  }

  renderLiveLeaderboard(ctx, lx, ly, lw, lh) {
    ctx.save();
    // Leaderboard Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(lx, ly, lw, lh, 10);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🏁 CLASIFICACIÓN EN DIRECTO', lx + 16, ly + 24);

    // Players sorted by rank
    const sorted = [...this.players].sort((a, b) => a.currentRank - b.currentRank);

    sorted.slice(0, 6).forEach((p, idx) => {
      const rowY = ly + 48 + idx * 28;

      // Rank circle
      ctx.fillStyle = p.currentRank === 1 ? '#eab308' : (p.currentRank === 2 ? '#94a3b8' : (p.currentRank === 3 ? '#d97706' : '#334155'));
      ctx.beginPath();
      ctx.arc(lx + 24, rowY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.currentRank}º`, lx + 24, rowY + 3.5);

      // Team badge
      ctx.fillStyle = p.teamColor;
      ctx.fillRect(lx + 42, rowY - 8, 4, 16);

      // Player Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px Arial';
      const label = `${p.name} ${p.finished ? '🏁' : ''}`;
      ctx.fillText(label, lx + 54, rowY + 4);

      // Lap or status
      ctx.textAlign = 'right';
      ctx.font = '12px monospace';
      ctx.fillStyle = p.finished ? '#4ade80' : '#94a3b8';
      ctx.fillText(p.finished ? 'TERMINADO' : `Vta ${Math.min(this.totalLaps, p.lap + 1)}`, lx + lw - 16, rowY + 4);
    });

    ctx.restore();
  }

  renderCountdownOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 18;

    const remaining = Math.ceil(this.countdownTimer);
    const frac = this.countdownTimer - Math.floor(this.countdownTimer);
    const bounceScale = 1.0 + Math.sin(Math.max(0, frac) * Math.PI) * 0.35;

    ctx.save();
    ctx.translate(this.width / 2, this.m7ViewH / 2 - 20);
    ctx.scale(bounceScale, bounceScale);

    if (remaining > 0) {
      ctx.font = 'bold 110px Arial';
      ctx.fillStyle = remaining === 3 ? '#ef4444' : (remaining === 2 ? '#eab308' : '#22c55e');
      ctx.fillText(remaining, 0, 0);

      ctx.font = 'bold 42px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('¡PREPARADOS!', 0, 85);
    } else {
      ctx.font = 'bold 110px Arial';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('¡YA!', 0, 20);
    }
    ctx.restore();
    ctx.restore();
  }

  renderPodiumOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 16;

    const winnerName = this.winningTeam === 'teamA' ? 'EQUIPO AZUL' : 'EQUIPO ROJO';
    const winnerColor = this.winningTeam === 'teamA' ? '#60a5fa' : '#f87171';

    ctx.font = 'bold 54px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText('🏁 ¡GRAN PREMIO CHAVALIL COMPLETADO! 🏁', this.width / 2, 140);

    ctx.font = 'bold 44px Arial';
    ctx.fillStyle = winnerColor;
    ctx.fillText(`🏆 ¡VICTORIA DEL ${winnerName}!`, this.width / 2, 215);

    // Podio Top 3
    const top3 = this.finishOrder.slice(0, 3);
    top3.forEach((p, idx) => {
      const px = this.width / 2 + (idx === 0 ? 0 : (idx === 1 ? -220 : 220));
      const py = 320 + (idx === 0 ? -20 : 20);

      ctx.fillStyle = idx === 0 ? '#eab308' : (idx === 1 ? '#94a3b8' : '#d97706');
      ctx.beginPath();
      ctx.arc(px, py - 30, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(`${idx + 1}º`, px, py - 30);

      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = p.teamColor;
      ctx.fillText(p.name, px, py + 15);
    });

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Desbloqueando siguiente nivel en el mapa de mundo...', this.width / 2, 540);

    ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Upper Half: Mode 7 3D Perspective Racing View
    this.renderMode7(this.ctx);

    // 2. Lower Half: Dashboard, Speedometer, Telemetry & Real-Time Radar
    this.renderDashboard(this.ctx);

    // 3. Overlays
    if (this.raceState === 'countdown') {
      this.renderCountdownOverlay(this.ctx);
    } else if (this.raceState === 'podium') {
      this.renderPodiumOverlay(this.ctx);
    }
  }

  loop(timestamp = performance.now()) {
    if (!this.running) return;
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.MarioKartEngine = MarioKartEngine;
