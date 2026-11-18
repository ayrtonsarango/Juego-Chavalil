/**
 * TANK TROUBLE (TANQUES CHAVALIL)
 * Motor de combate de tanques en laberinto 2D en HTML5 Canvas.
 * Físicas completas de proyectiles con rebote balístico (hasta 5 rebotes en paredes),
 * torretas personalizadas con los avatares SVG de la cuadrilla, minas, láseres,
 * IA táctica de cálculo de rebotes y gamepad táctil optimizado para móvil.
 */

class TankTroubleEngine {
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

    // Laberinto de cuadrícula (11 columnas x 6 filas con paredes internas)
    this.maze = {
      cols: 11,
      rows: 6,
      cellW: 100,
      cellH: 95,
      offsetX: 90,
      offsetY: 85,
      walls: [] // { x1, y1, x2, y2 }
    };

    this.players = [];
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.avatarImages = {};
    this.floatingTexts = [];
    this.treadMarks = [];
    this.gameState = 'countdown'; // 'countdown' | 'playing' | 'round_over' | 'victory'
    this.countdownTimer = 3.0;
    this.roundOverTimer = 0;
    this.roundNumber = 1;
    this.maxRounds = 3;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.screenShake = 0;

    this.generateMazeWalls();
  }

  generateMazeWalls() {
    this.maze.walls = [];
    const { offsetX, offsetY, cellW, cellH, cols, rows } = this.maze;

    // 1. Marco exterior
    this.maze.walls.push({ x1: offsetX, y1: offsetY, x2: offsetX + cols * cellW, y2: offsetY });
    this.maze.walls.push({ x1: offsetX + cols * cellW, y1: offsetY, x2: offsetX + cols * cellW, y2: offsetY + rows * cellH });
    this.maze.walls.push({ x1: offsetX + cols * cellW, y1: offsetY + rows * cellH, x2: offsetX, y2: offsetY + rows * cellH });
    this.maze.walls.push({ x1: offsetX, y1: offsetY + rows * cellH, x2: offsetX, y2: offsetY });

    // 2. Paredes interiores diseñadas para generar rebotes divertidos
    const internalWalls = [
      // Paredes horizontales
      { c1: 1, r1: 1, c2: 3, r2: 1 },
      { c1: 4, r1: 1, c2: 6, r2: 1 },
      { c1: 8, r1: 1, c2: 10, r2: 1 },
      { c1: 2, r1: 2, c2: 4, r2: 2 },
      { c1: 7, r1: 2, c2: 9, r2: 2 },
      { c1: 0, r1: 3, c2: 2, r2: 3 },
      { c1: 5, r1: 3, c2: 7, r2: 3 },
      { c1: 9, r1: 3, c2: 11, r2: 3 },
      { c1: 2, r1: 4, c2: 5, r2: 4 },
      { c1: 6, r1: 4, c2: 8, r2: 4 },
      { c1: 1, r1: 5, c2: 4, r2: 5 },
      { c1: 7, r1: 5, c2: 10, r2: 5 },

      // Paredes verticales
      { c1: 2, r1: 0, c2: 2, r2: 2 },
      { c1: 4, r1: 1, c2: 4, r2: 3 },
      { c1: 7, r1: 1, c2: 7, r2: 3 },
      { c1: 9, r1: 0, c2: 9, r2: 2 },
      { c1: 3, r1: 3, c2: 3, r2: 5 },
      { c1: 5, r1: 2, c2: 5, r2: 4 },
      { c1: 6, r1: 2, c2: 6, r2: 4 },
      { c1: 8, r1: 3, c2: 8, r2: 5 }
    ];

    internalWalls.forEach(w => {
      this.maze.walls.push({
        x1: offsetX + w.c1 * cellW,
        y1: offsetY + w.r1 * cellH,
        x2: offsetX + w.c2 * cellW,
        y2: offsetY + w.r2 * cellH
      });
    });
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
    this.gameState = 'countdown';
    this.countdownTimer = 3.0;
    this.roundOverTimer = 0;
    this.roundNumber = 1;
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;

    const teamAIds = (teams.teamA || []).map(p => p.id);
    const teamBIds = (teams.teamB || []).map(p => p.id);

    this.players = playerList.map((p, idx) => {
      let inTeamA;
      if (playerList.length === 2) {
        inTeamA = (idx === 0);
      } else if (teamAIds.length > 0 || teamBIds.length > 0) {
        if (teamAIds.includes(p.id)) inTeamA = true;
        else if (teamBIds.includes(p.id)) inTeamA = false;
        else inTeamA = (idx % 2 === 0);
      } else {
        inTeamA = (idx % 2 === 0);
      }
      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        team: inTeamA ? 'teamA' : 'teamB',
        teamColor: inTeamA ? '#3b82f6' : '#ef4444',
        accentColor: inTeamA ? '#93c5fd' : '#fca5a5',
        score: 0,
        // Dimensiones del tanque
        x: 0,
        y: 0,
        angle: 0,
        radius: 18,
        width: 32,
        height: 24,
        speed: 0,
        maxSpeed: 140,
        rotateSpeed: 3.2,
        alive: true,
        // Balas y recarga
        cooldown: 0,
        fireRate: 0.5,
        maxActiveBullets: 4,
        weapon: 'normal', // 'normal' | 'laser' | 'gatling' | 'shotgun'
        weaponAmmo: 0,
        // Inputs
        forward: false,
        backward: false,
        turnLeft: false,
        turnRight: false,
        firePressed: false,
        // IA
        aiTargetAngle: 0,
        aiShootTimer: Math.random() * 2
      };
    });

    this.spawnPlayersForRound();
    this.prepareAvatars(playerList);

    if (window.soundEngine) {
      window.soundEngine.playPreparationMatchFound();
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.loop);
  }

  spawnPlayersForRound() {
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.floatingTexts = [];
    this.treadMarks = [];
    this.screenShake = 0;

    // Spawns fijos en las 8 zonas seguras del laberinto (soporta 8 jugadores simultáneos sin solapamiento)
    const spawns = [
      { x: this.maze.offsetX + 50, y: this.maze.offsetY + 48, a: 0 },
      { x: this.maze.offsetX + this.maze.cols * this.maze.cellW - 50, y: this.maze.offsetY + this.maze.rows * this.maze.cellH - 48, a: Math.PI },
      { x: this.maze.offsetX + this.maze.cols * this.maze.cellW - 50, y: this.maze.offsetY + 48, a: Math.PI },
      { x: this.maze.offsetX + 50, y: this.maze.offsetY + this.maze.rows * this.maze.cellH - 48, a: 0 },
      { x: this.maze.offsetX + 550, y: this.maze.offsetY + 48, a: Math.PI / 2 },
      { x: this.maze.offsetX + 550, y: this.maze.offsetY + this.maze.rows * this.maze.cellH - 48, a: -Math.PI / 2 },
      { x: this.maze.offsetX + 250, y: this.maze.offsetY + 285, a: 0 },
      { x: this.maze.offsetX + 850, y: this.maze.offsetY + 285, a: Math.PI }
    ];

    this.players.forEach((p, idx) => {
      const sp = spawns[idx % spawns.length];
      p.x = sp.x;
      p.y = sp.y;
      p.angle = sp.a;
      p.speed = 0;
      p.alive = true;
      p.cooldown = 0;
      p.weapon = 'normal';
      p.weaponAmmo = 0;
      p.forward = false;
      p.backward = false;
      p.turnLeft = false;
      p.turnRight = false;
      p.firePressed = false;
    });

    // Spawn 2 powerups iniciales
    this.spawnPowerup();
    this.spawnPowerup();
  }

  handlePlayerInput(playerId, input) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p || !p.alive) return;

    if (typeof input.up === 'boolean') p.forward = input.up;
    if (typeof input.down === 'boolean') p.backward = input.down;
    if (typeof input.left === 'boolean') p.turnLeft = input.left;
    if (typeof input.right === 'boolean') p.turnRight = input.right;

    // Botón de disparo
    if (input.fire || input.attack || input.item) {
      this.fireBullet(p);
    }
  }

  addFloatingText(text, color = '#facc15', duration = 1.0, scale = 1.0, x = 640, y = 360) {
    this.floatingTexts.push({
      text,
      color,
      x,
      y,
      scale,
      duration,
      life: duration
    });
  }

  fireBullet(p) {
    if (p.cooldown > 0) return;

    // Contar balas activas de este jugador
    const activeFromP = this.bullets.filter(b => b.ownerId === p.id).length;
    if (activeFromP >= p.maxActiveBullets && p.weapon === 'normal') return;

    p.cooldown = p.weapon === 'gatling' ? 0.18 : p.fireRate;

    // Posición del cañón (punta delantera)
    const cannonLen = 24;
    const startX = p.x + Math.cos(p.angle) * cannonLen;
    const startY = p.y + Math.sin(p.angle) * cannonLen;

    // Retroceso del tanque y sacudida leve
    p.x -= Math.cos(p.angle) * 3;
    p.y -= Math.sin(p.angle) * 3;
    this.screenShake = Math.max(this.screenShake, p.weapon === 'shotgun' ? 7 : 4);

    // Muzzle flash y chispas de pólvora
    for (let s = 0; s < 6; s++) {
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(p.angle) * (60 + Math.random() * 80) + (Math.random() - 0.5) * 40,
        vy: Math.sin(p.angle) * (60 + Math.random() * 80) + (Math.random() - 0.5) * 40,
        color: Math.random() < 0.6 ? '#facc15' : '#fb923c',
        size: 2.5 + Math.random() * 2,
        life: 0.22
      });
    }

    if (p.weapon === 'shotgun') {
      // 3 balas en abanico
      [-0.15, 0, 0.15].forEach(spread => {
        this.bullets.push({
          x: startX,
          y: startY,
          vx: Math.cos(p.angle + spread) * 320,
          vy: Math.sin(p.angle + spread) * 320,
          bouncesLeft: 4,
          ownerId: p.id,
          team: p.team,
          color: p.teamColor,
          radius: 4,
          life: 8.0
        });
      });
      p.weaponAmmo--;
      if (p.weaponAmmo <= 0) p.weapon = 'normal';
    } else if (p.weapon === 'laser') {
      // Proyectil láser súper rápido
      this.bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(p.angle) * 650,
        vy: Math.sin(p.angle) * 650,
        bouncesLeft: 2,
        ownerId: p.id,
        team: p.team,
        color: '#facc15',
        radius: 5,
        life: 5.0,
        isLaser: true
      });
      p.weaponAmmo--;
      if (p.weaponAmmo <= 0) p.weapon = 'normal';
    } else {
      // Bala estándar de tanque (rebota 5 veces)
      this.bullets.push({
        x: startX,
        y: startY,
        vx: Math.cos(p.angle) * 270,
        vy: Math.sin(p.angle) * 270,
        bouncesLeft: 5,
        ownerId: p.id,
        team: p.team,
        color: p.teamColor,
        radius: 4,
        life: 9.0
      });
      if (p.weapon === 'gatling') {
        p.weaponAmmo--;
        if (p.weaponAmmo <= 0) p.weapon = 'normal';
      }
    }

    // Pequeño retroceso físico al disparar
    p.x -= Math.cos(p.angle) * 2.5;
    p.y -= Math.sin(p.angle) * 2.5;

    // Destello de boca (Muzzle Flash) y chispas
    for (let i = 0; i < 7; i++) {
      const pAng = p.angle + (Math.random() - 0.5) * 0.7;
      const spd = 40 + Math.random() * 90;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(pAng) * spd,
        vy: Math.sin(pAng) * spd,
        color: Math.random() < 0.6 ? '#facc15' : '#f97316',
        size: 3,
        life: 0.18
      });
    }

    // Fogonazo de disparo
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(p.angle + (Math.random() - 0.5) * 0.8) * (80 + Math.random() * 80),
        vy: Math.sin(p.angle + (Math.random() - 0.5) * 0.8) * (80 + Math.random() * 80),
        color: '#facc15',
        size: 3,
        life: 0.15
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playStep();
    }
  }

  update(dt) {
    if (this.gameState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.gameState = 'playing';
      }
      return;
    }

    if (this.gameState === 'round_over') {
      this.roundOverTimer -= dt;
      if (this.roundOverTimer <= 0) {
        if (this.roundNumber < this.maxRounds) {
          this.roundNumber++;
          this.gameState = 'countdown';
          this.countdownTimer = 3.5;
          if (window.soundEngine) {
            window.soundEngine.playLolMatchFound(0.95);
          }
          this.spawnPlayersForRound();
        } else {
          this.gameState = 'victory';
          this.resolveMatchWinner();
        }
      }
      return;
    }

    if (this.gameState === 'victory') return;

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 32;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Spawn periódico de armas / powerups
    if (Math.random() < 0.008 && this.powerups.length < 3) {
      this.spawnPowerup();
    }

    // Actualizar IA de bots
    this.updateBots(dt);

    // Mover tanques
    this.players.forEach(p => {
      if (!p.alive) return;

      if (p.cooldown > 0) p.cooldown -= dt;

      // Giro
      const turn = (p.turnRight ? 1 : 0) - (p.turnLeft ? 1 : 0);
      p.angle += turn * p.rotateSpeed * dt;

      // Aceleración
      let targetSpeed = 0;
      if (p.forward) targetSpeed = p.maxSpeed;
      else if (p.backward) targetSpeed = -p.maxSpeed * 0.65;

      p.speed += (targetSpeed - p.speed) * 10 * dt;

      const nextX = p.x + Math.cos(p.angle) * p.speed * dt;
      const nextY = p.y + Math.sin(p.angle) * p.speed * dt;

      // Comprobar colisión con paredes del laberinto
      if (!this.checkTankWallCollision(nextX, nextY, p.radius)) {
        p.x = nextX;
        p.y = nextY;
      } else {
        // Deslizarse intentando sólo X o sólo Y
        if (!this.checkTankWallCollision(nextX, p.y, p.radius)) {
          p.x = nextX;
        } else if (!this.checkTankWallCollision(p.x, nextY, p.radius)) {
          p.y = nextY;
        } else {
          p.speed = 0;
        }
      }

      // Huellas de orugas al avanzar/retroceder
      if ((p.forward || p.backward) && Math.abs(p.speed) > 20 && Math.random() < 0.35) {
        this.treadMarks.push({
          x: p.x,
          y: p.y,
          angle: p.angle,
          w: p.width,
          h: p.height,
          alpha: 0.35
        });
        if (this.treadMarks.length > 90) this.treadMarks.shift();
      }

      // Recoger powerups
      this.checkPowerupPickup(p);
    });

    // Mover balas y procesar rebotes
    this.updateBullets(dt);

    // Actualizar partículas
    this.updateParticles(dt);

    // Comprobar victoria de ronda (queda 1 equipo o 1 jugador)
    this.checkRoundStatus();
  }

  updateBots(dt) {
    this.players.forEach(p => {
      if (!p.isBot || !p.alive) return;

      p.aiShootTimer -= dt;

      // Buscar rival más cercano
      let closestEnemy = null;
      let minDist = 9999;
      this.players.forEach(other => {
        if (other.id !== p.id && other.alive && other.team !== p.team) {
          const d = Math.hypot(other.x - p.x, other.y - p.y);
          if (d < minDist) {
            minDist = d;
            closestEnemy = other;
          }
        }
      });

      if (closestEnemy) {
        // Ángulo hacia el enemigo
        const desiredAngle = Math.atan2(closestEnemy.y - p.y, closestEnemy.x - p.x);
        let diff = desiredAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        p.turnLeft = diff < -0.15;
        p.turnRight = diff > 0.15;

        // Avanzar si está más o menos encarado
        p.forward = Math.abs(diff) < 0.6 && minDist > 120;
        p.backward = minDist < 70;

        // Disparar si el ángulo coincide o por timer
        if (Math.abs(diff) < 0.3 || p.aiShootTimer <= 0) {
          this.fireBullet(p);
          p.aiShootTimer = 0.8 + Math.random() * 1.4;
        }
      } else {
        // Deambular
        p.forward = true;
        if (Math.random() < 0.05) {
          p.turnLeft = Math.random() < 0.5;
          p.turnRight = !p.turnLeft;
        }
      }
    });
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      const nextX = b.x + b.vx * dt;
      const nextY = b.y + b.vy * dt;

      // Colisión con paredes y cálculo de vector reflejado (rebote)
      let bounced = false;
      for (const wall of this.maze.walls) {
        const hit = this.lineSegmentIntersection(b.x, b.y, nextX, nextY, wall.x1, wall.y1, wall.x2, wall.y2);
        if (hit) {
          b.bouncesLeft--;
          bounced = true;

          // Chispas del rebote mejoradas
          for (let p = 0; p < 8; p++) {
            this.particles.push({
              x: hit.x,
              y: hit.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              color: Math.random() < 0.5 ? '#fef08a' : '#f59e0b',
              size: 2.8,
              life: 0.25
            });
          }
          if (this.screenShake < 3) this.screenShake = 2.5;

          // Determinar normal de la pared
          const isHorizontal = Math.abs(wall.y1 - wall.y2) < 2;
          if (isHorizontal) {
            b.vy = -b.vy; // Invertir vertical
          } else {
            b.vx = -b.vx; // Invertir horizontal
          }

          b.x = hit.x + (b.vx > 0 ? 1 : -1);
          b.y = hit.y + (b.vy > 0 ? 1 : -1);
          break;
        }
      }

      if (!bounced) {
        b.x = nextX;
        b.y = nextY;
      }

      // Si se agotan los rebotes, destruir la bala
      if (b.bouncesLeft <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Comprobar impacto directo contra cualquier tanque
      for (const p of this.players) {
        if (!p.alive) return;
        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < p.radius + b.radius) {
          // Impacto! Destrucción del tanque
          this.destroyTank(p, b.ownerId);
          this.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  destroyTank(victim, killerId) {
    victim.alive = false;
    this.screenShake = 18;
    this.addFloatingText('¡BOOM!', '#ef4444', 1.2, 1.5, victim.x, victim.y - 25);

    // Onda expansiva de impacto
    this.particles.push({
      x: victim.x,
      y: victim.y,
      type: 'shockwave',
      radius: 6,
      maxRadius: 54,
      color: '#f97316',
      life: 0.55,
      maxLife: 0.55
    });

    // Puntuación
    const killer = this.players.find(p => p.id === killerId);
    if (killer && killer.id !== victim.id) {
      killer.score += 50;
    }

    // Gran explosión con fuego y humo
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 220;
      this.particles.push({
        x: victim.x,
        y: victim.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: Math.random() < 0.6 ? '#f97316' : (Math.random() < 0.5 ? '#facc15' : victim.teamColor),
        size: 3 + Math.random() * 5,
        life: 0.5 + Math.random() * 0.4
      });
    }

    // Nubes de humo denso
    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 60;
      this.particles.push({
        x: victim.x,
        y: victim.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: '#64748b',
        size: 6 + Math.random() * 8,
        life: 0.8 + Math.random() * 0.5
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playDeathSound();
    }
  }

  checkTankWallCollision(x, y, radius) {
    for (const wall of this.maze.walls) {
      const dist = this.distToSegment(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < radius + 3) return true;
    }
    return false;
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return { x: x1 + ua * (x2 - x1), y: y1 + ua * (y2 - y1) };
    }
    return null;
  }

  spawnPowerup() {
    const types = ['gatling', 'laser', 'shotgun'];
    const type = types[Math.floor(Math.random() * types.length)];
    const c = Math.floor(Math.random() * this.maze.cols);
    const r = Math.floor(Math.random() * this.maze.rows);

    this.powerups.push({
      x: this.maze.offsetX + c * this.maze.cellW + this.maze.cellW / 2,
      y: this.maze.offsetY + r * this.maze.cellH + this.maze.cellH / 2,
      type,
      radius: 12
    });
  }

  checkPowerupPickup(p) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      if (Math.hypot(p.x - pw.x, p.y - pw.y) < p.radius + pw.radius) {
        p.weapon = pw.type;
        p.weaponAmmo = pw.type === 'gatling' ? 15 : (pw.type === 'laser' ? 6 : 5);
        this.powerups.splice(i, 1);
        const pwNames = { gatling: '¡GATLING!', laser: '¡LÁSER!', shotgun: '¡ESCOPETA!' };
        this.addFloatingText(pwNames[pw.type] || '¡ARMA ESPECIAL!', '#facc15', 1.0, 1.25, p.x, p.y - 25);
        if (window.soundEngine) {
          window.soundEngine.playMarioCoin();
        }
      }
    }
  }

  checkRoundStatus() {
    const teamAAlive = this.players.filter(p => p.team === 'teamA' && p.alive).length;
    const teamBAlive = this.players.filter(p => p.team === 'teamB' && p.alive).length;

    if (teamAAlive === 0 || teamBAlive === 0) {
      this.finishRound(teamAAlive > 0 ? 'teamA' : (teamBAlive > 0 ? 'teamB' : null));
    }
  }

  finishRound(winningTeam) {
    this.gameState = 'round_over';
    this.roundOverTimer = 2.5;

    if (winningTeam === 'teamA') {
      this.teamScores.teamA++;
    } else if (winningTeam === 'teamB') {
      this.teamScores.teamB++;
    }

    if (window.soundEngine) {
      window.soundEngine.playCelebrationJump();
    }
  }

  resolveMatchWinner() {
    this.winningTeam = this.teamScores.teamA >= this.teamScores.teamB ? 'teamA' : 'teamB';
    if (window.soundEngine) {
      window.soundEngine.playSocialCreditVictory();
    }

    setTimeout(() => {
      this.onComplete({
        gameType: 'tank',
        winningTeam: this.winningTeam,
        scores: this.teamScores,
        players: this.players.map(p => ({ id: p.id, score: p.score }))
      });
    }, 3500);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();

    // Pantalla sacudida (Screen Shake)
    if (this.screenShake > 0.2) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
      this.screenShake *= 0.88;
    }

    // 1. Fondo de suelo técnico de arena
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Suelo interior del laberinto con rejilla sutil
    const { offsetX, offsetY, cellW, cellH, cols, rows } = this.maze;
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(offsetX, offsetY, cols * cellW, rows * cellH);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + c * cellW, offsetY);
      this.ctx.lineTo(offsetX + c * cellW, offsetY + rows * cellH);
      this.ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, offsetY + r * cellH);
      this.ctx.lineTo(offsetX + cols * cellW, offsetY + r * cellH);
      this.ctx.stroke();
    }

    // Huellas de orugas sobre el suelo
    this.treadMarks.forEach(tm => {
      this.ctx.save();
      this.ctx.translate(tm.x, tm.y);
      this.ctx.rotate(tm.angle);
      this.ctx.fillStyle = `rgba(15, 23, 42, ${tm.alpha})`;
      this.ctx.fillRect(-tm.w / 2 - 2, -tm.h / 2 - 4, tm.w + 4, 4);
      this.ctx.fillRect(-tm.w / 2 - 2, tm.h / 2, tm.w + 4, 4);
      this.ctx.restore();
    });

    // 2. Dibujar paredes del laberinto (con sombreado 3D y relieve)
    this.ctx.save();
    // Sombra proyectada inferior de las paredes
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.lineWidth = 10;
    this.ctx.lineCap = 'round';
    this.maze.walls.forEach(w => {
      this.ctx.beginPath();
      this.ctx.moveTo(w.x1 + 3, w.y1 + 4);
      this.ctx.lineTo(w.x2 + 3, w.y2 + 4);
      this.ctx.stroke();
    });

    // Base sólida metálica
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 8;
    this.maze.walls.forEach(w => {
      this.ctx.beginPath();
      this.ctx.moveTo(w.x1, w.y1);
      this.ctx.lineTo(w.x2, w.y2);
      this.ctx.stroke();
    });

    // Relieve superior con brillo metálico (Bevel top highlight)
    this.ctx.strokeStyle = '#64748b';
    this.ctx.lineWidth = 3.5;
    this.maze.walls.forEach(w => {
      this.ctx.beginPath();
      this.ctx.moveTo(w.x1, w.y1);
      this.ctx.lineTo(w.x2, w.y2);
      this.ctx.stroke();
    });

    // Remaches metálicos en extremos
    this.ctx.fillStyle = '#94a3b8';
    this.maze.walls.forEach(w => {
      this.ctx.beginPath();
      this.ctx.arc(w.x1, w.y1, 4, 0, Math.PI * 2);
      this.ctx.arc(w.x2, w.y2, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();

    // 3. Powerups en suelo
    const now = performance.now() * 0.005;
    this.powerups.forEach(pw => {
      this.ctx.save();
      const pulse = Math.sin(now * 3) * 2;
      this.ctx.beginPath();
      this.ctx.arc(pw.x, pw.y, pw.radius + pulse, 0, Math.PI * 2);

      let color = '#facc15';
      let icon = '⚡';
      if (pw.type === 'gatling') { color = '#38bdf8'; icon = '🔫'; }
      if (pw.type === 'laser') { color = '#ec4899'; icon = '💥'; }
      if (pw.type === 'shotgun') { color = '#a855f7'; icon = '🎯'; }

      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      this.ctx.font = '13px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(icon, pw.x, pw.y);
      this.ctx.restore();
    });

    // 4. Balas activas con estela luminosa
    this.bullets.forEach(b => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = b.color;
      this.ctx.shadowColor = b.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();

      // Centro blanco incandescente
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
      this.ctx.restore();
    });

    // 5. Tanques de los jugadores
    this.players.forEach(p => {
      if (!p.alive) return;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);

      // Orugas del tanque
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(-p.width / 2 - 2, -p.height / 2 - 4, p.width + 4, 6);
      this.ctx.fillRect(-p.width / 2 - 2, p.height / 2 - 2, p.width + 4, 6);

      // Chasis del tanque
      this.ctx.fillStyle = p.teamColor;
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      this.ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

      // Cañón
      this.ctx.fillStyle = '#334155';
      this.ctx.fillRect(0, -3.5, 22, 7);
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.strokeRect(0, -3.5, 22, 7);

      // Torreta circular con avatar de la cabeza
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 11, 0, Math.PI * 2);
      this.ctx.fillStyle = p.accentColor;
      this.ctx.fill();
      this.ctx.stroke();

      const img = this.avatarImages[p.id];
      if (img && img.complete) {
        this.ctx.drawImage(img, -10, -10, 20, 20);
      }
      this.ctx.restore();

      // Nombre y arma activa sobre el tanque
      this.ctx.save();
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      const weaponBadge = p.weapon !== 'normal' ? ` [${p.weapon.toUpperCase()} ${p.weaponAmmo}]` : '';
      this.ctx.fillText(`${p.name}${weaponBadge}`, p.x, p.y - 20);
      this.ctx.restore();
    });

    // 6. Partículas
    this.particles.forEach(p => {
      this.ctx.save();
      if (p.type === 'shockwave') {
        const prog = 1.0 - (p.life / p.maxLife);
        const r = prog * p.maxRadius + p.radius;
        this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        this.ctx.strokeStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // 7. Textos Arcade Flotantes
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      const alpha = Math.max(0, ft.life / ft.duration);
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `900 ${Math.round(24 * ft.scale)}px "Arial Black", Arial, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 16;
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#020617';
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 8. HUD y Overlays
    this.renderHUD();

    if (this.gameState === 'countdown') {
      this.renderCountdown();
    } else if (this.gameState === 'round_over') {
      this.renderRoundOver();
    } else if (this.gameState === 'victory') {
      this.renderVictory();
    }

    this.ctx.restore(); // Finaliza save de Screen Shake
  }

  renderHUD() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(this.maze.offsetX, 14, this.maze.cols * this.maze.cellW, 46);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(this.maze.offsetX, 14, this.maze.cols * this.maze.cellW, 46);

    this.ctx.font = '900 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`🎯 TANK TROUBLE CHAVALIL — RONDA ${this.roundNumber} / ${this.maxRounds}`, this.width / 2, 42);

    this.ctx.font = '900 15px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillText(`🔵 AZUL: ${this.teamScores.teamA} Victorias`, this.maze.offsetX + 20, 42);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillText(`🔴 ROJO: ${this.teamScores.teamB} Victorias`, this.maze.offsetX + this.maze.cols * this.maze.cellW - 20, 42);
    this.ctx.restore();
  }

  renderCountdown() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const countNum = Math.ceil(this.countdownTimer);
    const frac = this.countdownTimer - Math.floor(this.countdownTimer);
    const bounceScale = 1.0 + Math.sin(Math.max(0, frac) * Math.PI) * 0.35;

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2 - 20);
    this.ctx.scale(bounceScale, bounceScale);

    const text = countNum > 0 ? `${countNum}` : '¡FUEGO!';

    this.ctx.font = '900 78px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#d97706';
    this.ctx.shadowBlur = 22;
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();

    this.ctx.font = '800 20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText('¡Las balas rebotan 5 veces en las paredes del laberinto!', this.width / 2, this.height / 2 + 55);
    this.ctx.restore();
  }

  renderRoundOver() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = '900 48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText(`FIN DE LA RONDA ${this.roundNumber}`, this.width / 2, this.height / 2 - 20);

    this.ctx.font = '800 22px sans-serif';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`Azul: ${this.teamScores.teamA}  |  Rojo: ${this.teamScores.teamB}`, this.width / 2, this.height / 2 + 30);
    this.ctx.restore();
  }

  renderVictory() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const isAzul = this.winningTeam === 'teamA';
    const teamName = isAzul ? 'EQUIPO AZUL' : 'EQUIPO ROJO';
    const teamColor = isAzul ? '#3b82f6' : '#ef4444';

    this.ctx.font = '900 58px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = teamColor;
    this.ctx.shadowColor = teamColor;
    this.ctx.shadowBlur = 25;
    this.ctx.fillText(`🏆 ¡VICTORIA PARA EL ${teamName}!`, this.width / 2, this.height / 2 - 30);

    this.ctx.font = '800 24px sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Marcador Final: ${this.teamScores.teamA} - ${this.teamScores.teamB}`, this.width / 2, this.height / 2 + 40);
    this.ctx.restore();
  }

  loop(currentTime) {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.TankTroubleEngine = TankTroubleEngine;
