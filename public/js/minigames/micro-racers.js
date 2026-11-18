/**
 * COCHES CHAVALIL (MICRO RACERS)
 * Minijuego de carreras arcade multijugador 2D en pantalla única (1280x720).
 * Inspirado en Micro Machines, GeneRally e Indy Heat.
 * Circuito cerrado de asfalto con pianos caramelo, turbos, charcos de aceite y choques elásticos.
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
    this.animationId = null;
    this.lastTime = performance.now();

    this.cars = [];
    this.avatarImages = {};
    this.particles = [];
    this.skidmarks = [];
    this.floatingTexts = [];
    this.confetti = [];

    this.totalLaps = 3;
    this.gameState = 'countdown'; // 'countdown' | 'racing' | 'finished'
    this.countdownTimer = 3.8;
    this.finishTimer = 0;
    this.winner = null;
    this.rankings = [];

    // Track definition: Spline/polygon track with centerline, checkpoints and hazards
    this.track = this.initTrack();

    // Palette for player cars
    this.palette = [
      { car: '#2563eb', dark: '#1d4ed8', glow: '#60a5fa' }, // Blue
      { car: '#e11d48', dark: '#be123c', glow: '#fb7185' }, // Red/Pink
      { car: '#16a34a', dark: '#15803d', glow: '#4ade80' }, // Green
      { car: '#ca8a04', dark: '#a16207', glow: '#fde047' }, // Yellow
      { car: '#9333ea', dark: '#7e22ce', glow: '#c084fc' }, // Purple
      { car: '#ea580c', dark: '#c2410c', glow: '#fb923c' }, // Orange
      { car: '#0891b2', dark: '#0e7490', glow: '#22d3ee' }, // Cyan
      { car: '#475569', dark: '#334155', glow: '#94a3b8' }  // Slate
    ];
  }

  initTrack() {
    // Closed-loop racetrack with 8 checkpoints
    // Center-line waypoints for track loop
    const waypoints = [
      { x: 300, y: 580 }, // Start / Finish line area
      { x: 640, y: 580 },
      { x: 980, y: 580 },
      { x: 1140, y: 520 },
      { x: 1150, y: 360 },
      { x: 1040, y: 200 },
      { x: 820, y: 210 },
      { x: 740, y: 340 },
      { x: 620, y: 340 },
      { x: 540, y: 200 },
      { x: 320, y: 150 },
      { x: 160, y: 220 },
      { x: 140, y: 460 },
      { x: 200, y: 560 }
    ];

    // Checkpoint gate segments (orthogonal lines across track width)
    const checkpoints = [
      { id: 0, p1: { x: 420, y: 500 }, p2: { x: 420, y: 660 }, name: 'META' },
      { id: 1, p1: { x: 780, y: 500 }, p2: { x: 780, y: 660 }, name: 'CP1' },
      { id: 2, p1: { x: 1060, y: 540 }, p2: { x: 1220, y: 440 }, name: 'CP2' },
      { id: 3, p1: { x: 1080, y: 140 }, p2: { x: 1000, y: 270 }, name: 'CP3' },
      { id: 4, p1: { x: 680, y: 280 }, p2: { x: 680, y: 410 }, name: 'CP4' },
      { id: 5, p1: { x: 480, y: 120 }, p2: { x: 560, y: 260 }, name: 'CP5' },
      { id: 6, p1: { x: 240, y: 90 }, p2: { x: 340, y: 210 }, name: 'CP6' },
      { id: 7, p1: { x: 70, y: 380 }, p2: { x: 220, y: 380 }, name: 'CP7' }
    ];

    // Hazards and Boost pads
    const boostPads = [
      { x: 850, y: 580, w: 46, h: 42, rot: 0 },
      { x: 240, y: 160, w: 46, h: 42, rot: -0.5 }
    ];

    const oilSlicks = [
      { x: 1100, y: 450, r: 24 },
      { x: 680, y: 340, r: 22 },
      { x: 150, y: 300, r: 22 }
    ];

    return { waypoints, checkpoints, boostPads, oilSlicks };
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
    this.gameState = 'countdown';
    this.countdownTimer = 3.6;
    this.finishTimer = 0;
    this.winner = null;
    this.rankings = [];
    this.particles = [];
    this.skidmarks = [];
    this.floatingTexts = [];
    this.confetti = [];

    // Grid starting positions behind Finish line (x: 420, y: 580)
    // Cars lined up in 2x2 grid pointing east (rot: 0)
    const gridOffsets = [
      { dx: -60, dy: -28 },
      { dx: -60, dy: 28 },
      { dx: -130, dy: -28 },
      { dx: -130, dy: 28 },
      { dx: -200, dy: -28 },
      { dx: -200, dy: 28 },
      { dx: -270, dy: -28 },
      { dx: -270, dy: 28 }
    ];

    const startBaseX = 420;
    const startBaseY = 580;

    this.cars = playerList.map((p, idx) => {
      const offset = gridOffsets[idx % gridOffsets.length];
      const theme = this.palette[idx % this.palette.length];
      return {
        id: p.id,
        name: p.name || `Piloto_${idx + 1}`,
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
        rot: 0, // 0 rad = facing right (East)
        steerInput: 0,
        gasInput: false,
        turboInput: false,
        turboRemaining: 0,
        spinRemaining: 0,
        lap: 1,
        nextCheckpoint: 1, // Must hit CP1 first
        checkpointsCleared: 0,
        finished: false,
        finishTime: 0,
        totalProgress: 0,
        width: 38,
        height: 22,
        wobble: 0
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

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  update(dt) {
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

    // 2. Race physics update
    const maxSpeedNormal = 6.8;
    const maxSpeedTurbo = 10.5;
    const accelRate = 8.5;
    const frictionRate = 3.5;
    const turnRate = 3.6;

    this.cars.forEach(car => {
      // Bot Autopilot Steering
      if (car.isBot && !car.finished && this.gameState === 'racing') {
        const cp = this.track.checkpoints[car.nextCheckpoint];
        if (cp) {
          const targetX = (cp.p1.x + cp.p2.x) / 2;
          const targetY = (cp.p1.y + cp.p2.y) / 2;
          const targetAngle = Math.atan2(targetY - car.y, targetX - car.x);
          let diff = targetAngle - car.rot;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          car.steerInput = Math.max(-1, Math.min(1, diff * 2.8));
          car.gasInput = true;
          // Random turbo on straights
          if (Math.abs(diff) < 0.2 && Math.random() < 0.02) {
            car.turboInput = true;
          } else {
            car.turboInput = false;
          }
        }
      }

      if (car.finished) {
        // Slow down and do victory donuts if winner
        car.speed = Math.max(0, car.speed - frictionRate * dt);
        if (car === this.winner) {
          car.rot += 3.5 * dt;
        }
        return;
      }

      // Handle spin from oil
      if (car.spinRemaining > 0) {
        car.spinRemaining -= dt;
        car.rot += 14 * dt;
        car.speed = Math.max(1.0, car.speed - 8.0 * dt);
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

      // Acceleration / Braking
      if (car.gasInput) {
        car.speed = Math.min(topSpeed, car.speed + accelRate * dt);
        // Exhaust particle
        if (Math.random() < 0.6) {
          const rearDist = -18;
          const rx = car.x + Math.cos(car.rot) * rearDist;
          const ry = car.y + Math.sin(car.rot) * rearDist;
          this.particles.push({
            x: rx,
            y: ry,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            color: isBoosting ? '#38bdf8' : '#e2e8f0',
            size: isBoosting ? 6 : 4,
            life: 0.35,
            maxLife: 0.35
          });
        }
      } else {
        car.speed = Math.max(0, car.speed - frictionRate * dt);
      }

      // Off-track grass penalty (outside bounds)
      const isOffTrack = this.checkIsOffTrack(car.x, car.y);
      if (isOffTrack && car.speed > 2.4) {
        car.speed = Math.max(2.4, car.speed - 7.0 * dt);
        // Grass particles
        if (Math.random() < 0.4) {
          this.particles.push({
            x: car.x,
            y: car.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: '#15803d',
            size: 3.5,
            life: 0.3,
            maxLife: 0.3
          });
        }
      }

      // Steering (only when moving)
      if (car.speed > 0.3 && car.steerInput !== 0) {
        const steerDir = car.steerInput;
        const speedRatio = Math.min(1.0, car.speed / 3.0);
        car.rot += steerDir * turnRate * speedRatio * dt;

        // Skidmarks on high-speed sharp turns
        if (car.speed > 4.5 || isBoosting) {
          this.addSkidmarks(car);
        }
      }

      // Position update
      car.vx = Math.cos(car.rot) * car.speed;
      car.vy = Math.sin(car.rot) * car.speed;
      car.x += car.vx;
      car.y += car.vy;

      // Keep within canvas bounds
      car.x = Math.max(30, Math.min(this.width - 30, car.x));
      car.y = Math.max(30, Math.min(this.height - 30, car.y));

      // Check boost pads
      this.track.boostPads.forEach(bp => {
        const dist = Math.hypot(car.x - bp.x, car.y - bp.y);
        if (dist < 32) {
          car.turboRemaining = 1.2;
          car.speed = maxSpeedTurbo;
          this.addFloatingText('⚡ TURBO!', car.x, car.y - 20, '#38bdf8');
          if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
            soundEngine.playSoundByName('mario_coin');
          }
        }
      });

      // Check oil slicks
      this.track.oilSlicks.forEach(os => {
        const dist = Math.hypot(car.x - os.x, car.y - os.y);
        if (dist < os.r + 10 && car.spinRemaining <= 0) {
          car.spinRemaining = 0.65;
          this.addFloatingText('🛢️ ¡TROMPO!', car.x, car.y - 20, '#eab308');
        }
      });

      // Check checkpoints and lap completion
      this.updateCarProgress(car);
    });

    // 3. Car vs Car Bumper Collisions
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const c1 = this.cars[i];
        const c2 = this.cars[j];
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 28;

        if (dist < minDist && dist > 0.001) {
          // Elastic separation
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          c1.x -= nx * overlap * 0.55;
          c1.y -= ny * overlap * 0.55;
          c2.x += nx * overlap * 0.55;
          c2.y += ny * overlap * 0.55;

          // Bounce reaction
          c1.rot += (Math.random() - 0.5) * 0.35;
          c2.rot += (Math.random() - 0.5) * 0.35;

          // Spark particles
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

    // Decay old skidmarks
    if (this.skidmarks.length > 350) {
      this.skidmarks.splice(0, 50);
    }

    // 5. Check finish state
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
      // Spawn confetti
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

  checkIsOffTrack(x, y) {
    // Infield bounds check (simplified smooth track corridor)
    // Outside boundary
    if (x < 70 || x > 1210 || y < 60 || y > 660) return true;
    // Island center cuts
    if (x > 320 && x < 960 && y > 380 && y < 510) return true;
    if (x > 750 && x < 1000 && y > 230 && y < 350) return true;
    if (x > 260 && x < 500 && y > 220 && y < 350) return true;
    return false;
  }

  updateCarProgress(car) {
    const cp = this.track.checkpoints[car.nextCheckpoint];
    if (!cp) return;

    // Check line segment crossing
    const d = this.distToSegment({ x: car.x, y: car.y }, cp.p1, cp.p2);
    if (d < 50) {
      car.checkpointsCleared++;
      car.totalProgress = (car.lap - 1) * this.track.checkpoints.length + car.checkpointsCleared;

      // Advance checkpoint
      car.nextCheckpoint = (car.nextCheckpoint + 1) % this.track.checkpoints.length;

      // Crossing Meta (CP0)
      if (car.nextCheckpoint === 1) {
        car.lap++;
        if (car.lap > this.totalLaps) {
          // Completed the race!
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
    if (this.gameState === 'finished') return;
    this.gameState = 'finished';

    // Build complete rankings
    const unranked = this.cars.filter(c => !this.rankings.includes(c));
    unranked.sort((a, b) => b.totalProgress - a.totalProgress);
    const fullRankings = [...this.rankings, ...unranked];

    // Scores allocation: 100, 75, 55, 40, 25, 15...
    const scoreLadder = [100, 75, 55, 40, 25, 15, 10, 10];
    const scores = {};
    fullRankings.forEach((c, idx) => {
      scores[c.id] = scoreLadder[idx] || 10;
    });

    setTimeout(() => {
      this.destroy();
      this.onComplete(this.winner ? this.winner.id : fullRankings[0].id, {
        winnerId: this.winner ? this.winner.id : fullRankings[0].id,
        rankings: fullRankings.map(c => ({ id: c.id, name: c.name, score: scores[c.id] })),
        scores
      });
    }, 4500);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Infield & Lawn Background
    ctx.fillStyle = '#15803d'; // Rich grass green
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle lawn stripes
    ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
    for (let y = 0; y < this.height; y += 40) {
      ctx.fillRect(0, y, this.width, 20);
    }

    // 2. Draw Asphalt Track Road Corridor
    this.drawTrackSurface(ctx);

    // 3. Draw Skidmarks
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    this.skidmarks.forEach(sm => {
      ctx.globalAlpha = sm.alpha;
      ctx.beginPath();
      ctx.arc(sm.x1, sm.y1, 1.8, 0, Math.PI * 2);
      ctx.arc(sm.x2, sm.y2, 1.8, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1.0;

    // 4. Draw Boost Pads and Oil Slicks
    this.drawHazards(ctx);

    // 5. Draw Start / Finish Line Banner
    this.drawFinishLine(ctx);

    // 6. Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 7. Draw Cars with mini avatar heads
    this.cars.forEach(car => {
      this.drawCar(ctx, car);
    });

    // 8. Draw Floating Texts
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

    // 9. Draw HUD Overlay
    this.drawHUD(ctx);

    // 10. Draw Countdown / Victory Overlays
    if (this.gameState === 'countdown') {
      this.drawCountdownOverlay(ctx);
    } else if (this.gameState === 'finished') {
      this.drawVictoryOverlay(ctx);
    }
  }

  drawTrackSurface(ctx) {
    ctx.save();

    // Road outer line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = this.track.waypoints;

    // Outer kerb border (Candy red/white dashes)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 142;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 142;
    ctx.setLineDash([20, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dark Asphalt Core Road
    ctx.strokeStyle = '#1e293b'; // Navy/dark asphalt
    ctx.lineWidth = 120;
    ctx.stroke();

    // Center dash line (Yellow)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 16]);
    ctx.stroke();
    ctx.setLineDash([]);

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

      // Yellow arrows pointing forward
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(10, 0);
      ctx.lineTo(-10, 12);
      ctx.fill();
      ctx.restore();
    });

    // Oil Slicks
    this.track.oilSlicks.forEach(os => {
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(os.x, os.y, os.r, os.r * 0.7, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  drawFinishLine(ctx) {
    const cp = this.track.checkpoints[0]; // Start/finish line
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

    // Overhead Banner "🏁 META"
    ctx.font = '900 16px "Titan One", "Fredoka", sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeText('🏁 META', x - 26, y1 - 8);
    ctx.fillText('🏁 META', x - 26, y1 - 8);

    ctx.restore();
  }

  drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.rot);

    // Drop shadow under car
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-car.width / 2 + 2, -car.height / 2 + 4, car.width, car.height, 6);
    ctx.fill();

    // 4 Wheels
    ctx.fillStyle = '#0f172a';
    const wheelW = 10;
    const wheelH = 5;
    // Front wheels
    ctx.fillRect(8, -13, wheelW, wheelH);
    ctx.fillRect(8, 8, wheelW, wheelH);
    // Rear wheels
    ctx.fillRect(-14, -13, wheelW, wheelH);
    ctx.fillRect(-14, 8, wheelW, wheelH);

    // Main Car Chassis
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

    // Windshield (front windshield glass)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(1, -7, 10, 14, 3);
    ctx.fill();
    ctx.stroke();

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
      // Helmet fallback
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(24, 16, 260, 48, 14);
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

    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
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

    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
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

    // Confetti
    this.confetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size * 0.7);
    });

    // Winner Banner
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.MicroRacersEngine = MicroRacersEngine;
