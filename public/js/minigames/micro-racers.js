/**
 * COCHES CHAVALIL (MICRO RACERS) - GRAN PREMIO CHAVALIL
 * Minijuego de carreras arcade multijugador 2D en pantalla única (1280x720).
 * Inspirado en Micro Machines, GeneRally e Indy Heat con estética Light-Theme Doodle Pop Candy-Arcade.
 *
 * Características principales:
 * - Circuito técnico desafiante con recta de salida, horquilla, chicana en S y curvas de velocidad.
 * - Fricción estricta fuera de pista: la hierba penaliza al 85% de velocidad máxima (se acabaron los atajos fáciles).
 * - Barreras físicas de neumáticos 3D (pilas de ruedas candy) en todos los vértices interiores y divisorias.
 * - Sistema secuencial de 13 checkpoints que impide saltarse sectores o dar vueltas cortando.
 * - Tribuna con público animado, flashes de fotos, vallas de patrocinio y pianos bicolores 3D.
 * - Coches con ruedas directrices delanteras, faros delanteros, luces de freno y llamas de turbo.
 */

class MicroRacersEngine {
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

    this.running = false;
    this.completed = false;
    this.finishTimeout = null;
    this.animationId = null;
    this.lastTime = performance.now();
    this.elapsedTime = 0;

    this.cars = [];
    this.avatarImages = {};
    this.particles = [];
    this.skidmarks = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.flashes = [];

    this.totalLaps = 3;
    this.gameState = 'countdown'; // 'countdown' | 'racing' | 'finished'
    this.countdownTimer = 3.6;
    this.finishTimer = 0;
    this.winner = null;
    this.rankings = [];

    // Track layout, checkpoints, tire barriers and hazards
    this.track = this.initTrack();

    // 8 distinct high-contrast candy palettes for player cars
    this.palette = [
      { car: '#2563eb', dark: '#1d4ed8', glow: '#60a5fa', name: 'Azul' },
      { car: '#e11d48', dark: '#be123c', glow: '#fb7185', name: 'Rojo' },
      { car: '#16a34a', dark: '#15803d', glow: '#4ade80', name: 'Verde' },
      { car: '#ca8a04', dark: '#a16207', glow: '#fde047', name: 'Amarillo' },
      { car: '#9333ea', dark: '#7e22ce', glow: '#c084fc', name: 'Morado' },
      { car: '#ea580c', dark: '#c2410c', glow: '#fb923c', name: 'Naranja' },
      { car: '#0891b2', dark: '#0e7490', glow: '#22d3ee', name: 'Cian' },
      { car: '#475569', dark: '#334155', glow: '#94a3b8', name: 'Gris' }
    ];
  }

  initTrack() {
    // 16 Centerline Waypoints forming a continuous, flowing technical race loop
    const waypoints = [
      { x: 380, y: 590 },  // 0. META (Start/Finish) - Heading East
      { x: 640, y: 590 },  // 1. Front Straight (High speed)
      { x: 880, y: 590 },  // 2. Front Straight (Braking marker)
      { x: 1060, y: 540 }, // 3. Curva 1 (Badostáin sweeper entry)
      { x: 1150, y: 430 }, // 4. Curva 1 Apex
      { x: 1120, y: 290 }, // 5. Curva 2 Exit
      { x: 1000, y: 170 }, // 6. High-speed transition
      { x: 840, y: 160 },  // 7. Chicane approach
      { x: 750, y: 280 },  // 8. Chicana Técnica - Dip
      { x: 620, y: 280 },  // 9. Chicana Técnica - Hook
      { x: 530, y: 160 },  // 10. Chicana Técnica - Exit
      { x: 360, y: 150 },  // 11. Horquilla del Bar - Approach
      { x: 210, y: 180 },  // 12. Horquilla del Bar - Outer
      { x: 140, y: 290 },  // 13. Horquilla del Bar - Apex
      { x: 150, y: 430 },  // 14. Horquilla del Bar - Exit
      { x: 240, y: 550 }   // 15. Sweeping entry to Front Straight
    ];

    // 13 Dense Sequential Checkpoints ensuring cars cannot skip corners
    const checkpoints = [
      { id: 0, p1: { x: 380, y: 535 }, p2: { x: 380, y: 645 }, name: 'META' },
      { id: 1, p1: { x: 640, y: 535 }, p2: { x: 640, y: 645 }, name: 'CP1' },
      { id: 2, p1: { x: 880, y: 535 }, p2: { x: 880, y: 645 }, name: 'CP2' },
      { id: 3, p1: { x: 1010, y: 590 }, p2: { x: 1100, y: 490 }, name: 'CP3' },
      { id: 4, p1: { x: 1090, y: 430 }, p2: { x: 1210, y: 430 }, name: 'CP4' },
      { id: 5, p1: { x: 1070, y: 270 }, p2: { x: 1170, y: 310 }, name: 'CP5' },
      { id: 6, p1: { x: 970, y: 120 }, p2: { x: 1030, y: 220 }, name: 'CP6' },
      { id: 7, p1: { x: 800, y: 220 }, p2: { x: 860, y: 110 }, name: 'CP7' },
      { id: 8, p1: { x: 685, y: 225 }, p2: { x: 685, y: 335 }, name: 'CP8' },
      { id: 9, p1: { x: 500, y: 110 }, p2: { x: 560, y: 210 }, name: 'CP9' },
      { id: 10, p1: { x: 360, y: 95 }, p2: { x: 360, y: 205 }, name: 'CP10' },
      { id: 11, p1: { x: 85, y: 290 }, p2: { x: 195, y: 290 }, name: 'CP11' },
      { id: 12, p1: { x: 170, y: 500 }, p2: { x: 270, y: 580 }, name: 'CP12' }
    ];

    // Solid Tire Barriers preventing shortcuts through the infield
    const tireWalls = [
      // Turn 1 inside apex
      { x: 1030, y: 470, r: 18 },
      { x: 1010, y: 430, r: 18 },
      // Chicane inner apex 1 (cannot cut the entry!)
      { x: 820, y: 220, r: 18 },
      { x: 800, y: 200, r: 18 },
      // Chicane bottom edge (prevents cutting underneath!)
      { x: 685, y: 350, r: 20 },
      { x: 650, y: 350, r: 20 },
      // Chicane inner apex 2
      { x: 590, y: 220, r: 18 },
      { x: 570, y: 200, r: 18 },
      // Infield central barrier line (seals the lawn between front straight and chicane)
      { x: 460, y: 430, r: 20 },
      { x: 520, y: 430, r: 20 },
      { x: 580, y: 430, r: 20 },
      { x: 640, y: 430, r: 20 },
      { x: 700, y: 430, r: 20 },
      { x: 760, y: 430, r: 20 },
      // Hairpin apex (cannot cut the hairpin!)
      { x: 250, y: 270, r: 24 },
      { x: 240, y: 320, r: 24 }
    ];

    // Speed Boost Pads & Oil Slicks
    const boostPads = [
      { x: 720, y: 590, w: 50, h: 44, rot: 0 },         // On front straight
      { x: 440, y: 155, w: 50, h: 44, rot: -Math.PI }  // On hairpin approach
    ];

    const oilSlicks = [
      { x: 960, y: 580, r: 22 },  // Braking zone into Turn 1
      { x: 760, y: 280, r: 20 },  // Middle of chicane
      { x: 180, y: 360, r: 22 }   // Exit of hairpin
    ];

    // Decorative Scenery & Sponsors
    const scenery = [
      { x: 60, y: 60, type: 'tree', r: 26 },
      { x: 110, y: 80, type: 'tree', r: 22 },
      { x: 1220, y: 70, type: 'tree', r: 26 },
      { x: 1180, y: 110, type: 'tree', r: 20 },
      { x: 1220, y: 620, type: 'tree', r: 28 },
      { x: 1160, y: 650, type: 'tree', r: 22 },
      { x: 60, y: 650, type: 'tree', r: 26 },
      { x: 70, y: 500, type: 'tree', r: 20 },
      { x: 600, y: 90, type: 'tree', r: 22 },
      { x: 400, y: 340, type: 'tree', r: 24 },
      { x: 350, y: 380, type: 'tree', r: 20 },
      { x: 920, y: 340, type: 'tree', r: 24 },
      { x: 860, y: 380, type: 'tree', r: 20 },
      { x: 230, y: 290, type: 'fountain', r: 28 }
    ];

    const billboards = [
      { x: 750, y: 648, text: '🍺 BAR HOTBUNNIES · KALIMOTXO GP', bg: '#dc2626', fg: '#ffffff' },
      { x: 500, y: 648, text: '🌻 PIPAS FACUNDO · AGUASAL SPEED', bg: '#f59e0b', fg: '#0f172a' },
      { x: 920, y: 108, text: '🏢 TRACASA SPEEDWAY', bg: '#0284c7', fg: '#ffffff' },
      { x: 260, y: 104, text: '🌾 BADOSTÁIN GRAND PRIX', bg: '#16a34a', fg: '#ffffff' }
    ];

    return { waypoints, checkpoints, tireWalls, boostPads, oilSlicks, scenery, billboards };
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

  init(playerList) {
    this.running = true;
    this.completed = false;
    if (this.finishTimeout) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
    this.gameState = 'countdown';
    this.countdownTimer = 3.6;
    this.finishTimer = 0;
    this.elapsedTime = 0;
    this.winner = null;
    this.rankings = [];
    this.particles = [];
    this.skidmarks = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.flashes = [];

    // Starting grid behind Start/Finish line (x: 380, y: 590)
    // 2x2 grid pointing East (rot: 0)
    const gridOffsets = [
      { dx: -55, dy: -20 },
      { dx: -55, dy: 20 },
      { dx: -115, dy: -20 },
      { dx: -115, dy: 20 },
      { dx: -175, dy: -20 },
      { dx: -175, dy: 20 },
      { dx: -235, dy: -20 },
      { dx: -235, dy: 20 }
    ];

    const startBaseX = 380;
    const startBaseY = 590;

    this.cars = playerList.map((p, idx) => {
      const offset = gridOffsets[idx % gridOffsets.length];
      const theme = this.palette[idx % this.palette.length];
      return {
        id: p.id,
        name: p.name || `Piloto_${idx + 1}`,
        number: idx + 1,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        color: theme.car,
        darkColor: theme.dark,
        glowColor: theme.glow,
        x: startBaseX + offset.dx,
        y: startBaseY + offset.dy,
        vx: 0,
        vy: 0,
        speed: 0,
        rot: 0, // Facing East (0 rad)
        steerInput: 0,
        gasInput: false,
        turboInput: false,
        turboRemaining: 0,
        spinRemaining: 0,
        offTrackTimer: 0,
        lap: 1,
        nextCheckpoint: 1, // Must hit CP1 first
        checkpointsCleared: 0,
        finished: false,
        finishTime: 0,
        totalProgress: 0,
        width: 38,
        height: 22
      };
    });

    this.prepareAvatars(playerList);

    // Audio cue
    if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
      soundEngine.playSoundByName('lol_match_found');
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animationId = requestAnimationFrame(this.loop);
  }

  handlePlayerInput(playerId, input) {
    if (!this.running) return;
    const car = this.cars.find(c => c.id === playerId);
    if (!car || car.finished) return;

    if (input.steer !== undefined) {
      car.steerInput = Math.max(-1, Math.min(1, input.steer));
    }
    if (input.left !== undefined) {
      car.steerInput = input.left ? -1 : (input.right ? 1 : 0);
    }
    if (input.right !== undefined) {
      car.steerInput = input.right ? 1 : (input.left ? -1 : 0);
    }
    if (input.gas !== undefined) {
      car.gasInput = !!input.gas;
    }
    if (input.drift !== undefined || input.turbo !== undefined) {
      car.turboInput = !!(input.drift || input.turbo);
    }
  }

  loop(currentTime) {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;
    this.elapsedTime += dt;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  getDistanceToTrack(x, y) {
    let minDist = Infinity;
    const pts = this.track.waypoints;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const d = this.distToSegment({ x, y }, p1, p2);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  checkIsOffTrack(x, y) {
    // Road half-width is 52px. Anything further is on grass/gravel!
    return this.getDistanceToTrack(x, y) > 52;
  }

  update(dt) {
    if (!this.running || this.gameState === 'finished') return;

    // 1. Countdown update
    if (this.gameState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.gameState = 'racing';
        if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
          soundEngine.playSoundByName('bocina');
        }
      }
      return;
    }

    // 2. Race physics parameters
    const maxSpeedNormal = 6.8;
    const maxSpeedTurbo = 10.5;
    const accelRate = 8.8;
    const frictionRate = 3.6;
    const turnRate = 3.8;

    this.cars.forEach(car => {
      // Bot Autopilot with adaptive cornering
      if (car.isBot && !car.finished && this.gameState === 'racing') {
        const cp = this.track.checkpoints[car.nextCheckpoint];
        if (cp) {
          const targetX = (cp.p1.x + cp.p2.x) / 2;
          const targetY = (cp.p1.y + cp.p2.y) / 2;
          const targetAngle = Math.atan2(targetY - car.y, targetX - car.x);
          let diff = targetAngle - car.rot;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          car.steerInput = Math.max(-1, Math.min(1, diff * 3.0));

          // Slow down slightly on sharp corners for realistic racing line
          if (Math.abs(diff) > 0.85) {
            car.gasInput = Math.random() < 0.7;
          } else {
            car.gasInput = true;
          }

          // Smart turbo on long straights
          if (Math.abs(diff) < 0.15 && car.speed > 4.5 && Math.random() < 0.02) {
            car.turboInput = true;
          } else {
            car.turboInput = false;
          }
        }
      }

      if (car.finished) {
        // Winner celebratory slow donut spin
        car.speed = Math.max(0, car.speed - frictionRate * dt);
        if (car === this.winner) {
          car.rot += 3.8 * dt;
        }
        return;
      }

      // Handle spin from oil slick
      if (car.spinRemaining > 0) {
        car.spinRemaining -= dt;
        car.rot += 15 * dt;
        car.speed = Math.max(1.0, car.speed - 9.0 * dt);
        car.x += Math.cos(car.rot) * car.speed;
        car.y += Math.sin(car.rot) * car.speed;
        return;
      }

      // Turbo booster
      const isBoosting = car.turboRemaining > 0 || (car.turboInput && car.speed > 2.0);
      const topSpeed = isBoosting ? maxSpeedTurbo : maxSpeedNormal;

      if (car.turboRemaining > 0) {
        car.turboRemaining -= dt;
      }

      // Acceleration / Coasting
      if (car.gasInput) {
        car.speed = Math.min(topSpeed, car.speed + accelRate * dt);

        // Exhaust Particles (sparks & blue flame when boosting)
        if (Math.random() < 0.65) {
          const rearDist = -19;
          const rx = car.x + Math.cos(car.rot) * rearDist;
          const ry = car.y + Math.sin(car.rot) * rearDist;
          this.particles.push({
            x: rx,
            y: ry,
            vx: (Math.random() - 0.5) * 1.5 - Math.cos(car.rot) * (isBoosting ? 3 : 1),
            vy: (Math.random() - 0.5) * 1.5 - Math.sin(car.rot) * (isBoosting ? 3 : 1),
            color: isBoosting ? '#38bdf8' : '#e2e8f0',
            size: isBoosting ? 6.5 : 4,
            life: 0.35,
            maxLife: 0.35
          });
        }
      } else {
        car.speed = Math.max(0, car.speed - frictionRate * dt);
      }

      // STRICT OFF-TRACK PENALTY (Severe grass friction, no easy shortcuts!)
      const isOffTrack = this.checkIsOffTrack(car.x, car.y);
      if (isOffTrack) {
        // Drops rapidly down to crawl speed of 0.85 (down from 6.8 max!)
        car.speed = Math.max(0.85, car.speed - 12.0 * dt);

        // Car loses steering traction and slips on turf
        car.rot += (Math.random() - 0.5) * 1.8 * dt;

        // Flying turf and mud particles
        if (Math.random() < 0.5) {
          this.particles.push({
            x: car.x + (Math.random() - 0.5) * 12,
            y: car.y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 3.5,
            vy: (Math.random() - 0.5) * 3.5,
            color: Math.random() < 0.6 ? '#14532d' : '#78350f',
            size: 3.5,
            life: 0.32,
            maxLife: 0.32
          });
        }
      }

      // Steering
      if (car.speed > 0.3 && car.steerInput !== 0) {
        const steerDir = car.steerInput;
        const speedRatio = Math.min(1.0, car.speed / 3.0);
        car.rot += steerDir * turnRate * speedRatio * dt;

        // Skidmarks on high-speed sharp turns
        if (car.speed > 4.2 || isBoosting) {
          this.addSkidmarks(car);
        }
      }

      // Position update
      car.vx = Math.cos(car.rot) * car.speed;
      car.vy = Math.sin(car.rot) * car.speed;
      car.x += car.vx;
      car.y += car.vy;

      // Keep within outer canvas bounds
      car.x = Math.max(30, Math.min(this.width - 30, car.x));
      car.y = Math.max(30, Math.min(this.height - 30, car.y));

      // Solid pit wall barrier separating the front straight from the grandstand
      if (car.y > 638 && car.x > 260 && car.x < 940) {
        car.y = 638;
        car.speed *= 0.55;
        // Bounce car up back into track
        if (car.vy > 0) car.vy = -Math.abs(car.vy) * 0.4;
      }

      // Solid Tire Barrier Collisions (Blocks shortcuts into the grass!)
      this.checkTireWallCollisions(car);

      // Check boost pads
      this.track.boostPads.forEach(bp => {
        const dist = Math.hypot(car.x - bp.x, car.y - bp.y);
        if (dist < 34) {
          car.turboRemaining = 1.3;
          car.speed = maxSpeedTurbo;
          this.addFloatingText('⚡ TURBO!', car.x, car.y - 20, '#38bdf8');
          if (Math.random() < 0.35 && window.soundEngine && typeof soundEngine.playHeeHee === 'function') {
            soundEngine.playHeeHee(0.85);
          } else if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
            soundEngine.playSoundByName('mario_coin');
          }
        }
      });

      // Check oil slicks
      this.track.oilSlicks.forEach(os => {
        const dist = Math.hypot(car.x - os.x, car.y - os.y);
        if (dist < os.r + 10 && car.spinRemaining <= 0) {
          car.spinRemaining = 0.70;
          this.addFloatingText('🛢️ ¡TROMPO!', car.x, car.y - 20, '#eab308');
        }
      });

      // Checkpoints and Lap Completion
      this.updateCarProgress(car);
    });

    // 3. Elastic Car vs Car Bumper Collisions
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const c1 = this.cars[i];
        const c2 = this.cars[j];
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 28;

        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          c1.x -= nx * overlap * 0.55;
          c1.y -= ny * overlap * 0.55;
          c2.x += nx * overlap * 0.55;
          c2.y += ny * overlap * 0.55;

          c1.rot += (Math.random() - 0.5) * 0.35;
          c2.rot += (Math.random() - 0.5) * 0.35;

          // Impact spark particles
          for (let p = 0; p < 4; p++) {
            this.particles.push({
              x: (c1.x + c2.x) / 2,
              y: (c1.y + c2.y) / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#facc15',
              size: 3,
              life: 0.25,
              maxLife: 0.25
            });
          }
        }
      }
    }

    // 4. Update particles and skidmarks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.skidmarks.length > 350) {
      this.skidmarks.splice(0, 50);
    }

    // Camera flash bursts in the grandstand
    if (Math.random() < 0.08) {
      this.flashes.push({
        x: 320 + Math.random() * 540,
        y: 675 + Math.random() * 35,
        life: 0.18,
        maxLife: 0.18,
        size: 14 + Math.random() * 12
      });
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const fl = this.flashes[i];
      fl.life -= dt;
      if (fl.life <= 0) this.flashes.splice(i, 1);
    }

    // 5. Finish state check
    if (this.gameState === 'racing') {
      const allFinished = this.cars.every(c => c.finished);
      if (allFinished || (this.rankings.length >= 1 && this.finishTimer > 6.0)) {
        this.finishRace();
      }
      if (this.rankings.length >= 1) {
        this.finishTimer += dt;
      }
    } else if (this.gameState === 'finished') {
      this.finishTimer += dt;
      if (Math.random() < 0.3) {
        this.confetti.push({
          x: Math.random() * this.width,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 4,
          color: ['#f43f5e', '#38bdf8', '#22c55e', '#facc15', '#a855f7'][Math.floor(Math.random() * 5)],
          size: 6 + Math.random() * 6,
          life: 4.0
        });
      }
      this.confetti.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.life -= dt;
      });
      this.confetti = this.confetti.filter(c => c.life > 0);
    }
  }

  checkTireWallCollisions(car) {
    this.track.tireWalls.forEach(tw => {
      const dx = car.x - tw.x;
      const dy = car.y - tw.y;
      const dist = Math.hypot(dx, dy);
      const minDist = 18 + tw.r;
      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        car.x += nx * overlap;
        car.y += ny * overlap;

        // Heavy speed loss and bounce
        car.speed = Math.max(0.5, car.speed * 0.4);
        car.rot += (Math.random() - 0.5) * 0.5;

        // Sparks
        for (let k = 0; k < 3; k++) {
          this.particles.push({
            x: car.x,
            y: car.y,
            vx: nx * 4 + (Math.random() - 0.5) * 2,
            vy: ny * 4 + (Math.random() - 0.5) * 2,
            color: '#facc15',
            size: 3,
            life: 0.22,
            maxLife: 0.22
          });
        }
      }
    });
  }

  updateCarProgress(car) {
    const cp = this.track.checkpoints[car.nextCheckpoint];
    if (!cp) return;

    // Check line segment crossing
    const d = this.distToSegment({ x: car.x, y: car.y }, cp.p1, cp.p2);
    if (d < 45) {
      car.checkpointsCleared++;
      car.totalProgress = (car.lap - 1) * this.track.checkpoints.length + car.checkpointsCleared;

      // Advance checkpoint
      car.nextCheckpoint = (car.nextCheckpoint + 1) % this.track.checkpoints.length;

      // Crossing Meta (CP0)
      if (car.nextCheckpoint === 1) {
        car.lap++;
        if (car.lap > this.totalLaps) {
          car.finished = true;
          car.finishTime = performance.now();
          this.rankings.push(car);

          if (!this.winner) {
            this.winner = car;
            this.addFloatingText('👑 ¡GANADOR!', car.x, car.y - 30, '#facc15');
            if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
              soundEngine.playSoundByName('oh_my_god');
            }
          } else {
            this.addFloatingText(`🏁 ${this.rankings.length}º PUESTO`, car.x, car.y - 25, '#ffffff');
          }
        } else {
          this.addFloatingText(`VUELTA ${car.lap}/${this.totalLaps}`, car.x, car.y - 25, '#4ade80');
          if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
            soundEngine.playSoundByName('mario_coin');
          }
        }
      }
    }
  }

  distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  addSkidmarks(car) {
    const rearDist = -14;
    const perpDist = 9;
    const cos = Math.cos(car.rot);
    const sin = Math.sin(car.rot);

    const rx = car.x + cos * rearDist;
    const ry = car.y + sin * rearDist;

    this.skidmarks.push({
      x1: rx - sin * perpDist,
      y1: ry + cos * perpDist,
      x2: rx + sin * perpDist,
      y2: ry - cos * perpDist,
      alpha: 0.35
    });
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, color, life: 1.2 });
  }

  finishRace() {
    if (this.completed) return;
    this.completed = true;
    this.gameState = 'finished';

    const unranked = this.cars.filter(c => !this.rankings.includes(c));
    unranked.sort((a, b) => b.totalProgress - a.totalProgress);
    const fullRankings = [...this.rankings, ...unranked];

    // Standard rank points: 1st=100, 2nd=75, 3rd=50, 4th=35, 5th=20, 6th+=15
    const rankLadder = [100, 75, 50, 35, 20];
    const getRankScore = (rankIdx) => (rankIdx < rankLadder.length ? rankLadder[rankIdx] : 15);
    const scores = {};
    fullRankings.forEach((c, idx) => {
      scores[c.id] = getRankScore(idx);
    });

    // Set running = false on game over and cancel animation loop
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (window.soundEngine) {
      if (typeof soundEngine.playSocialCreditVictory === 'function') {
        soundEngine.playSocialCreditVictory();
      } else if (typeof soundEngine.playCelebrationJump === 'function') {
        soundEngine.playCelebrationJump();
      }
    }

    this.render();

    const winnerId = this.winner ? this.winner.id : fullRankings[0].id;
    this.finishTimeout = setTimeout(() => {
      this.onComplete({
        gameType: 'race',
        winnerId,
        players: fullRankings.map((c, idx) => ({
          id: c.id,
          name: c.name,
          rank: idx + 1,
          score: scores[c.id]
        })),
        rankings: fullRankings.map((c, idx) => ({
          id: c.id,
          name: c.name,
          rank: idx + 1,
          score: scores[c.id]
        })),
        scores
      });
    }, 4500);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Infield Lawn Background & Scenery
    this.drawLawn(ctx);

    // 2. Asphalt Track Corridor with Candy Curbs & Center Line
    this.drawTrackSurface(ctx);

    // 3. Skidmarks
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    this.skidmarks.forEach(sm => {
      ctx.globalAlpha = sm.alpha;
      ctx.beginPath();
      ctx.arc(sm.x1, sm.y1, 1.8, 0, Math.PI * 2);
      ctx.arc(sm.x2, sm.y2, 1.8, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1.0;

    // 4. Boost Pads, Oil Slicks & Hazards
    this.drawHazards(ctx);

    // 5. Tire Barriers (Pilas de neumáticos) & Billboards
    this.drawTireWalls(ctx);
    this.drawBillboards(ctx);

    // 6. Starting Grid & Finish Line Banner
    this.drawFinishLine(ctx);

    // 7. Tribuna (Grandstand) with Cheering Fans & Camera Flashes
    this.drawGrandstand(ctx);

    // 8. Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 9. Cars with dynamic steering wheels, headlights & avatars
    this.cars.forEach(car => {
      this.drawCar(ctx, car);
    });

    // 10. Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = '900 20px "Titan One", "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 11. HUD Overlay
    this.drawHUD(ctx);

    // 12. Countdown / Victory Overlays
    if (this.gameState === 'countdown') {
      this.drawCountdownOverlay(ctx);
    } else if (this.gameState === 'finished') {
      this.drawVictoryOverlay(ctx);
    }
  }

  drawLawn(ctx) {
    ctx.save();

    // Two-tone striped lawn
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    for (let y = 0; y < this.height; y += 40) {
      ctx.fillRect(0, y, this.width, 20);
    }

    // Scenery: Cartoon Trees & Park Fountain
    this.track.scenery.forEach(item => {
      if (item.type === 'tree') {
        // Tree drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(item.x + 4, item.y + 6, item.r, 0, Math.PI * 2);
        ctx.fill();

        // Foliage layers
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(item.x - 3, item.y - 3, item.r * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(item.x - 5, item.y - 5, item.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'fountain') {
        // Decorative lake in hairpin
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(item.x + 3, item.y + 5, item.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Water ripple ring
        const ripple = Math.max(0.5, (this.elapsedTime * 15) % item.r);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(item.x, item.y, ripple, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  drawTrackSurface(ctx) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = this.track.waypoints;

    // Track path polygon
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    // 1. Outer 3D Candy Curbs (Red and White alternating blocks)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 124;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 124;
    ctx.setLineDash([20, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Dark Asphalt Core Road (Width 100px)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 100;
    ctx.stroke();

    // 3. Crisp Road Edge Boundary Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    // Inner edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 96;
    ctx.stroke();
    ctx.restore();

    // Dark asphalt fill inside edges
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 92;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();

    // 4. Center Dashed Lane Line (Yellow)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Painted Starting Grid Boxes on the Main Straight
    const gridBoxes = [
      { x: 325, y: 570, num: 1 },
      { x: 325, y: 610, num: 2 },
      { x: 265, y: 570, num: 3 },
      { x: 265, y: 610, num: 4 },
      { x: 205, y: 570, num: 5 },
      { x: 205, y: 610, num: 6 },
      { x: 145, y: 570, num: 7 },
      { x: 145, y: 610, num: 8 }
    ];

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '900 12px "Titan One", "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    gridBoxes.forEach(b => {
      ctx.strokeRect(b.x - 20, b.y - 12, 40, 24);
      ctx.fillText(`${b.num}`, b.x - 12, b.y);
    });

    ctx.restore();
  }

  drawTireWalls(ctx) {
    this.track.tireWalls.forEach(tw => {
      ctx.save();

      // Tire shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(tw.x + 3, tw.y + 4, tw.r, 0, Math.PI * 2);
      ctx.fill();

      // Alternating candy colored tire stacks (Red/White or Blue/White)
      const colors = ['#ef4444', '#ffffff', '#ef4444'];
      const stackH = 3;

      for (let s = 0; s < stackH; s++) {
        const sy = tw.y - s * 4;
        ctx.fillStyle = colors[s % colors.length];
        ctx.beginPath();
        ctx.arc(tw.x, sy, tw.r - s * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Black center hub
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(tw.x, sy, (tw.r - s * 1.5) * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawBillboards(ctx) {
    this.track.billboards.forEach(bb => {
      ctx.save();
      const w = 210;
      const h = 26;

      // Wooden legs shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(bb.x - w / 2 + 2, bb.y + 2, w, h);

      // Sign background
      ctx.fillStyle = bb.bg;
      ctx.beginPath();
      ctx.roundRect(bb.x - w / 2, bb.y - h / 2, w, h, 6);
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sign text
      ctx.font = '900 11px "Titan One", "Fredoka", sans-serif';
      ctx.fillStyle = bb.fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bb.text, bb.x, bb.y);

      ctx.restore();
    });
  }

  drawGrandstand(ctx) {
    ctx.save();
    const gx = 300;
    const gy = 665;
    const gw = 580;
    const gh = 50;

    // Concrete Pit Wall Barrier with warning stripes separating grandstand from road
    ctx.fillStyle = '#475569';
    ctx.fillRect(gx - 10, gy - 16, gw + 20, 12);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gx - 10, gy - 16, gw + 20, 12);

    // Hazard warning stripes on pit wall top
    const wallStripes = 24;
    const wsw = (gw + 20) / wallStripes;
    for (let k = 0; k < wallStripes; k++) {
      ctx.fillStyle = (k % 2 === 0) ? '#facc15' : '#0f172a';
      ctx.fillRect(gx - 10 + k * wsw, gy - 15, wsw, 10);
    }

    // Grandstand shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(gx + 4, gy + 4, gw, gh);

    // Concrete base
    ctx.fillStyle = '#334155';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(gx, gy, gw, gh);

    // Striped Candy Canopy Roof
    const stripes = 24;
    const sw = gw / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#dc2626' : '#ffffff';
      ctx.fillRect(gx + i * sw, gy, sw, 10);
    }

    // Animated Fans / Crowd (Heads with colorful caps)
    const fanColors = ['#f43f5e', '#38bdf8', '#22c55e', '#facc15', '#a855f7', '#fb923c'];
    for (let i = 0; i < 36; i++) {
      const fx = gx + 15 + i * 15.5;
      const fy = gy + 22 + (i % 2) * 14;
      const bob = Math.sin(this.elapsedTime * 4 + i) * 2;

      ctx.fillStyle = fanColors[i % fanColors.length];
      ctx.beginPath();
      ctx.arc(fx, fy + bob, 5, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fx - 2, fy + bob - 1, 1.5, 1.5);
      ctx.fillRect(fx + 1, fy + bob - 1, 1.5, 1.5);
    }

    // Camera flash sparkles
    this.flashes.forEach(fl => {
      const flR = Math.max(0.1, fl.size * (fl.life / fl.maxLife));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, flR, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  drawHazards(ctx) {
    // Boost Pads
    this.track.boostPads.forEach(bp => {
      ctx.save();
      ctx.translate(bp.x, bp.y);
      ctx.rotate(bp.rot);

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-bp.w / 2, -bp.h / 2, bp.w, bp.h);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(-bp.w / 2, -bp.h / 2, bp.w, bp.h);

      // Yellow chevron arrows pointing forward
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-12, -12);
      ctx.lineTo(12, 0);
      ctx.lineTo(-12, 12);
      ctx.fill();
      ctx.restore();
    });

    // Oil Slicks
    this.track.oilSlicks.forEach(os => {
      ctx.save();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(os.x, os.y, os.r, os.r * 0.72, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gloss sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(os.x - 4, os.y - 3, os.r * 0.4, os.r * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawFinishLine(ctx) {
    const cp = this.track.checkpoints[0];
    ctx.save();
    const x = cp.p1.x;
    const y1 = cp.p1.y;
    const y2 = cp.p2.y;

    // Checkered vertical strip
    const rows = 8;
    const h = (y2 - y1) / rows;
    for (let i = 0; i < rows; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1e293b';
      ctx.fillRect(x - 10, y1 + i * h, 10, h);
      ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#ffffff';
      ctx.fillRect(x, y1 + i * h, 10, h);
    }

    // Overhead Banner "🏁 GRAN PREMIO CHAVALIL"
    ctx.font = '900 15px "Titan One", "Fredoka", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.strokeText('🏁 META', x - 26, y1 - 8);
    ctx.fillText('🏁 META', x - 26, y1 - 8);

    ctx.restore();
  }

  drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.rot);

    // 1. Headlights projection beam (cones of soft yellow light)
    ctx.save();
    const beamLen = 95;
    const beamGrad = ctx.createRadialGradient(20, 0, 10, 20 + beamLen, 0, 70);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.12)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(18, -8);
    ctx.lineTo(18 + beamLen, -36);
    ctx.lineTo(18 + beamLen, 36);
    ctx.lineTo(18, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Drop shadow under car
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.beginPath();
    ctx.roundRect(-car.width / 2 + 3, -car.height / 2 + 5, car.width, car.height, 7);
    ctx.fill();

    // 3. Four Wheels (Front wheels visibly steer!)
    ctx.fillStyle = '#0f172a';
    const wheelW = 10;
    const wheelH = 5;
    const steerAngle = (car.steerInput || 0) * 0.42;

    // Front Left Wheel (steers)
    ctx.save();
    ctx.translate(11, -12);
    ctx.rotate(steerAngle);
    ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
    ctx.restore();

    // Front Right Wheel (steers)
    ctx.save();
    ctx.translate(11, 12);
    ctx.rotate(steerAngle);
    ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
    ctx.restore();

    // Rear Left Wheel (fixed)
    ctx.fillRect(-14 - wheelW / 2, -12 - wheelH / 2, wheelW, wheelH);
    // Rear Right Wheel (fixed)
    ctx.fillRect(-14 - wheelW / 2, 12 - wheelH / 2, wheelW, wheelH);

    // 4. Main Car Chassis
    ctx.fillStyle = car.color;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-car.width / 2, -car.height / 2, car.width, car.height, 8);
    ctx.fill();
    ctx.stroke();

    // Rear Spoiler
    ctx.fillStyle = car.darkColor;
    ctx.fillRect(-car.width / 2 - 3, -car.height / 2 + 2, 5, car.height - 4);
    ctx.strokeRect(-car.width / 2 - 3, -car.height / 2 + 2, 5, car.height - 4);

    // Windshield (cyan tinted glass)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(1, -7, 10, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Racing Number badge on the hood
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '900 8px "Titan One", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${car.number}`, 10, 0);

    // Glowing Red Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-car.width / 2 - 1, -car.height / 2 + 4, 2.5, 3.5);
    ctx.fillRect(-car.width / 2 - 1, car.height / 2 - 7.5, 2.5, 3.5);

    // Mini Avatar head in cockpit
    const img = this.avatarImages[car.id];
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(-4, 0, 9, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -13, -9, 18, 18);
      ctx.restore();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Floating Player Name & Current Lap Tag
    ctx.save();
    ctx.font = '800 12px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    const label = `${car.name} (V${Math.min(car.lap, this.totalLaps)}/${this.totalLaps})`;
    ctx.strokeText(label, car.x, car.y - 20);
    ctx.fillText(label, car.x, car.y - 20);
    ctx.restore();
  }

  drawHUD(ctx) {
    ctx.save();

    // Top Header Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(24, 16, 270, 48, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 18px "Titan One", "Fredoka", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🏎️ COCHES CHAVALIL', 38, 46);

    // Live Race Standings (Top-Right Leaderboard)
    const sorted = [...this.cars].sort((a, b) => b.totalProgress - a.totalProgress);
    const boxW = 270;
    const boxH = 34 + sorted.length * 24;
    const boxX = this.width - boxW - 24;
    const boxY = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 14px "Titan One", "Fredoka", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('🏆 POSICIONES (3 VUELTAS)', boxX + 16, boxY + 22);

    sorted.forEach((c, idx) => {
      const y = boxY + 44 + idx * 24;
      const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}º`));

      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(boxX + 22, y - 4, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '800 13px "Fredoka", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${medal} ${c.name}`, boxX + 36, y);

      ctx.font = '900 12px "Fredoka", sans-serif';
      ctx.fillStyle = c.finished ? '#4ade80' : '#94a3b8';
      const status = c.finished ? '¡META!' : `V${Math.min(c.lap, this.totalLaps)}/3`;
      ctx.textAlign = 'right';
      ctx.fillText(status, boxX + boxW - 14, y);
      ctx.textAlign = 'left';
    });

    ctx.restore();
  }

  drawCountdownOverlay(ctx) {
    ctx.save();
    const count = Math.ceil(this.countdownTimer);
    const text = count > 3 ? '¡ATENTOS!' : (count > 0 ? `${count}` : '¡GAS!');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = '900 76px "Titan One", "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = count === 0 ? '#4ade80' : '#facc15';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 10;
    ctx.strokeText(text, this.width / 2, this.height / 2);
    ctx.fillText(text, this.width / 2, this.height / 2);

    ctx.restore();
  }

  drawVictoryOverlay(ctx) {
    ctx.save();

    this.confetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size * 0.7);
    });

    if (this.winner) {
      const bannerW = 540;
      const bannerH = 120;
      const bx = (this.width - bannerW) / 2;
      const by = this.height / 2 - 60;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerW, bannerH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 32px "Titan One", "Fredoka", sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText('👑 ¡CAMPEÓN DEL CIRCUITO!', this.width / 2, by + 46);

      ctx.font = '900 36px "Fredoka", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.winner.name, this.width / 2, by + 92);
    }

    ctx.restore();
  }

  stop() {
    this.destroy();
  }

  destroy() {
    this.running = false;
    if (this.finishTimeout) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.MicroRacersEngine = MicroRacersEngine;
