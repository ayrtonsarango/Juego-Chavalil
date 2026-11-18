/**
 * BOMBERMAN CHAVALIL
 * Motor de acción en cuadrícula 2D en HTML5 Canvas estilo Bomberman clásico.
 * Bloques destructibles, bombas con mecha y ondas expansivas en cruz,
 * reacciones en cadena de bombas, power-ups (más bombas, más fuego, patines),
 * muerte súbita con bloques que caen e IA que esquiva explosiones.
 */

class BombermanEngine {
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

    // Cuadrícula clásica de 15 columnas x 9 filas
    this.grid = {
      cols: 15,
      rows: 9,
      tileSize: 68,
      offsetX: 130,
      offsetY: 80,
      tiles: [] // 0: vacio, 1: pilar indestructible, 2: bloque destructible
    };

    this.players = [];
    this.bombs = [];
    this.flames = []; // { x, y, life, maxLife }
    this.powerups = []; // { c, r, type }
    this.particles = [];
    this.floatingTexts = [];
    this.avatarImages = {};

    this.gameState = 'countdown'; // 'countdown' | 'playing' | 'round_over' | 'victory'
    this.countdownTimer = 3.0;
    this.roundOverTimer = 0;
    this.roundNumber = 1;
    this.maxRounds = 3;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.screenShake = 0;

    this.suddenDeathTimer = 55; // Segundos hasta la caída de bloques
    this.suddenDeathIndex = 0;
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

  generateGrid() {
    this.grid.tiles = [];
    for (let r = 0; r < this.grid.rows; r++) {
      const row = [];
      for (let c = 0; c < this.grid.cols; c++) {
        // Pilares indestructibles en posiciones impares alternas
        if (r % 2 === 1 && c % 2 === 1) {
          row.push(1);
        } else {
          // Bloques destructibles (salvando las esquinas de spawn)
          const isSpawnZone =
            (c <= 1 && r <= 1) ||
            (c >= this.grid.cols - 2 && r <= 1) ||
            (c <= 1 && r >= this.grid.rows - 2) ||
            (c >= this.grid.cols - 2 && r >= this.grid.rows - 2);

          if (!isSpawnZone && Math.random() < 0.65) {
            row.push(2); // Bloque destructible
          } else {
            row.push(0); // Libre
          }
        }
      }
      this.grid.tiles.push(row);
    }
  }

  init(playerList, teams = {}) {
    this.running = true;
    this.gameState = 'countdown';
    this.countdownTimer = 3.0;
    this.roundOverTimer = 0;
    this.roundNumber = 1;
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
        // Posición en píxeles y celda
        x: 0,
        y: 0,
        radius: 20,
        speed: 160,
        baseSpeed: 160,
        alive: true,
        // Bombas y stats
        maxBombs: 1,
        activeBombs: 0,
        flameRange: 2,
        // Inputs
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        facing: 'down',
        // IA
        aiTargetTile: null,
        aiTimer: Math.random() * 0.2
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
    this.generateGrid();
    this.bombs = [];
    this.flames = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.suddenDeathTimer = 55;
    this.suddenDeathIndex = 0;

    const { offsetX, offsetY, tileSize, cols, rows } = this.grid;

    // Spawns en las 4 esquinas de la cuadrícula
    const spawnCoords = [
      { c: 0, r: 0 },
      { c: cols - 1, r: rows - 1 },
      { c: cols - 1, r: 0 },
      { c: 0, r: rows - 1 },
      { c: Math.floor(cols / 2), r: 0 },
      { c: Math.floor(cols / 2), r: rows - 1 }
    ];

    this.players.forEach((p, idx) => {
      const sp = spawnCoords[idx % spawnCoords.length];
      p.x = offsetX + sp.c * tileSize + tileSize / 2;
      p.y = offsetY + sp.r * tileSize + tileSize / 2;
      p.alive = true;
      p.activeBombs = 0;
      p.maxBombs = 1;
      p.flameRange = 2;
      p.speed = p.baseSpeed;
      p.moveUp = false;
      p.moveDown = false;
      p.moveLeft = false;
      p.moveRight = false;
    });
  }

  handlePlayerInput(playerId, input) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p || !p.alive) return;

    if (typeof input.up === 'boolean') p.moveUp = input.up;
    if (typeof input.down === 'boolean') p.moveDown = input.down;
    if (typeof input.left === 'boolean') p.moveLeft = input.left;
    if (typeof input.right === 'boolean') p.moveRight = input.right;

    if (input.bomb || input.attack || input.item) {
      this.dropBomb(p);
    }
  }

  dropBomb(p) {
    if (p.activeBombs >= p.maxBombs) return;

    const c = Math.floor((p.x - this.grid.offsetX) / this.grid.tileSize);
    const r = Math.floor((p.y - this.grid.offsetY) / this.grid.tileSize);

    if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) return;

    // No soltar si ya hay una bomba en esa celda
    const existing = this.bombs.find(b => b.c === c && b.r === r);
    if (existing) return;

    p.activeBombs++;
    this.bombs.push({
      c,
      r,
      x: this.grid.offsetX + c * this.grid.tileSize + this.grid.tileSize / 2,
      y: this.grid.offsetY + r * this.grid.tileSize + this.grid.tileSize / 2,
      ownerId: p.id,
      range: p.flameRange,
      timer: 2.2, // segundos de mecha
      fuseMax: 2.2,
      radius: 20
    });

    if (window.soundEngine) {
      window.soundEngine.playStep();
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

    // Temporizador de Muerte Súbita
    if (this.suddenDeathTimer > 0) {
      this.suddenDeathTimer -= dt;
      if (this.suddenDeathTimer <= 0) {
        this.addFloatingText('¡MUERTE SÚBITA!', '#ef4444', 1.8, 1.8, this.width / 2, this.height / 2);
        this.screenShake = 12;
      }
    }

    // Actualizar IA de bots
    this.updateBots(dt);

    // Mover jugadores con colisión en cuadrícula
    this.players.forEach(p => {
      if (!p.alive) return;

      let vx = 0;
      let vy = 0;
      if (p.moveRight) { vx += 1; p.facing = 'right'; }
      if (p.moveLeft) { vx -= 1; p.facing = 'left'; }
      if (p.moveDown) { vy += 1; p.facing = 'down'; }
      if (p.moveUp) { vy -= 1; p.facing = 'up'; }

      if (vx !== 0 && vy !== 0) {
        vx *= 0.707;
        vy *= 0.707;
      }

      const nextX = p.x + vx * p.speed * dt;
      const nextY = p.y + vy * p.speed * dt;

      // Deslizamiento suave en esquinas
      if (!this.checkPlayerCollision(nextX, p.y, p.radius)) {
        p.x = nextX;
      }
      if (!this.checkPlayerCollision(p.x, nextY, p.radius)) {
        p.y = nextY;
      }

      // Recoger powerups
      this.checkPowerupPickup(p);
    });

    // Actualizar mechas de bombas
    this.updateBombs(dt);

    // Actualizar llamas de fuego
    this.updateFlames(dt);

    // Actualizar partículas
    this.updateParticles(dt);

    // Comprobar estado de la ronda
    this.checkRoundStatus();
  }

  updateBots(dt) {
    this.players.forEach(p => {
      if (!p.isBot || !p.alive) return;

      p.aiTimer -= dt;
      if (p.aiTimer > 0) return;
      p.aiTimer = 0.12 + Math.random() * 0.1;

      const myC = Math.floor((p.x - this.grid.offsetX) / this.grid.tileSize);
      const myR = Math.floor((p.y - this.grid.offsetY) / this.grid.tileSize);

      // 1. Prioridad: ¿Estoy en peligro por una bomba cercana?
      const inDanger = this.isCellInBombZone(myC, myR);

      if (inDanger) {
        // Huir hacia una celda segura vecina
        const safeDir = this.findSafeDirection(myC, myR);
        p.moveUp = safeDir === 'up';
        p.moveDown = safeDir === 'down';
        p.moveLeft = safeDir === 'left';
        p.moveRight = safeDir === 'right';
      } else {
        // 2. Si hay bloques destructibles cerca, plantar bomba para abrir camino
        const hasBlockAdjacent = this.hasDestructibleAdjacent(myC, myR);
        if (hasBlockAdjacent && p.activeBombs < p.maxBombs && Math.random() < 0.4) {
          this.dropBomb(p);
        } else {
          // 3. Explorar en busca de rivales
          const dirs = ['up', 'down', 'left', 'right'];
          const chosen = dirs[Math.floor(Math.random() * dirs.length)];
          p.moveUp = chosen === 'up';
          p.moveDown = chosen === 'down';
          p.moveLeft = chosen === 'left';
          p.moveRight = chosen === 'right';
        }
      }
    });
  }

  isCellInBombZone(c, r) {
    for (const b of this.bombs) {
      if (b.c === c && Math.abs(b.r - r) <= b.range) return true;
      if (b.r === r && Math.abs(b.c - c) <= b.range) return true;
    }
    return false;
  }

  findSafeDirection(c, r) {
    const deltas = [
      { dir: 'up', dc: 0, dr: -1 },
      { dir: 'down', dc: 0, dr: 1 },
      { dir: 'left', dc: -1, dr: 0 },
      { dir: 'right', dc: 1, dr: 0 }
    ];

    for (const d of deltas) {
      const nc = c + d.dc;
      const nr = r + d.dr;
      if (this.isWalkableCell(nc, nr) && !this.isCellInBombZone(nc, nr)) {
        return d.dir;
      }
    }
    return 'down';
  }

  hasDestructibleAdjacent(c, r) {
    const deltas = [{ dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }];
    for (const d of deltas) {
      const nc = c + d.dc;
      const nr = r + d.dr;
      if (nc >= 0 && nc < this.grid.cols && nr >= 0 && nr < this.grid.rows) {
        if (this.grid.tiles[nr][nc] === 2) return true;
      }
    }
    return false;
  }

  isWalkableCell(c, r) {
    if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) return false;
    return this.grid.tiles[r][c] === 0;
  }

  checkPlayerCollision(x, y, radius) {
    const { offsetX, offsetY, tileSize, cols, rows } = this.grid;

    // Borde exterior
    if (x - radius < offsetX || x + radius > offsetX + cols * tileSize ||
        y - radius < offsetY || y + radius > offsetY + rows * tileSize) {
      return true;
    }

    // Comprobar 4 esquinas de la caja de colisión del jugador
    const corners = [
      { cx: x - radius * 0.7, cy: y - radius * 0.7 },
      { cx: x + radius * 0.7, cy: y - radius * 0.7 },
      { cx: x - radius * 0.7, cy: y + radius * 0.7 },
      { cx: x + radius * 0.7, cy: y + radius * 0.7 }
    ];

    for (const cr of corners) {
      const c = Math.floor((cr.cx - offsetX) / tileSize);
      const r = Math.floor((cr.cy - offsetY) / tileSize);
      if (c >= 0 && c < cols && r >= 0 && r < rows) {
        if (this.grid.tiles[r][c] !== 0) return true;
      }
    }
    return false;
  }

  updateBombs(dt) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer -= dt;
      if (b.timer <= 0) {
        this.explodeBomb(b);
        this.bombs.splice(i, 1);
      }
    }
  }

  explodeBomb(b) {
    this.screenShake = 14;
    const owner = this.players.find(p => p.id === b.ownerId);
    if (owner) {
      owner.activeBombs = Math.max(0, owner.activeBombs - 1);
    }

    // Onda expansiva neón
    this.particles.push({
      x: b.x,
      y: b.y,
      type: 'shockwave',
      radius: 4,
      maxRadius: 38,
      color: '#f97316',
      life: 0.45,
      maxLife: 0.45
    });

    // Celda de origen
    this.createFlame(b.c, b.r);

    // Expansión en 4 direcciones
    const dirs = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 }
    ];

    dirs.forEach(d => {
      for (let dist = 1; dist <= b.range; dist++) {
        const c = b.c + d.dc * dist;
        const r = b.r + d.dr * dist;

        if (c < 0 || c >= this.grid.cols || r < 0 || r >= this.grid.rows) break;

        // Si choca con pilar sólido indestructible, se corta el fuego
        if (this.grid.tiles[r][c] === 1) break;

        // Si choca con bloque destructible, destruirlo y detener el rayo
        if (this.grid.tiles[r][c] === 2) {
          this.grid.tiles[r][c] = 0;
          this.createFlame(c, r);

          // Astillas y partículas de madera
          const bx = this.grid.offsetX + c * this.grid.tileSize + this.grid.tileSize / 2;
          const by = this.grid.offsetY + r * this.grid.tileSize + this.grid.tileSize / 2;
          for (let sp = 0; sp < 12; sp++) {
            this.particles.push({
              x: bx,
              y: by,
              vx: (Math.random() - 0.5) * 190,
              vy: (Math.random() - 0.5) * 190,
              color: Math.random() < 0.5 ? '#b45309' : '#f59e0b',
              size: 3 + Math.random() * 4,
              life: 0.45
            });
          }

          // Probabilidad de soltar un power-up
          if (Math.random() < 0.35) {
            this.spawnPowerupAt(c, r);
          }
          break;
        }

        // Casilla libre: crear fuego
        this.createFlame(c, r);

        // Reacción en cadena: si hay otra bomba, hacerla detonar
        const otherBomb = this.bombs.find(ob => ob.c === c && ob.r === r);
        if (otherBomb) {
          otherBomb.timer = 0.05;
        }
      }
    });

    if (window.soundEngine) {
      window.soundEngine.playDeathSound();
    }
  }

  createFlame(c, r) {
    const x = this.grid.offsetX + c * this.grid.tileSize + this.grid.tileSize / 2;
    const y = this.grid.offsetY + r * this.grid.tileSize + this.grid.tileSize / 2;

    this.flames.push({
      c,
      r,
      x,
      y,
      life: 0.55,
      maxLife: 0.55
    });

    // Partículas de chispa de fuego
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        color: Math.random() < 0.6 ? '#f97316' : '#facc15',
        size: 3 + Math.random() * 4,
        life: 0.3
      });
    }
  }

  updateFlames(dt) {
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.life -= dt;

      // Matar jugadores que toquen las llamas
      this.players.forEach(p => {
        if (!p.alive) return;
        const dist = Math.hypot(p.x - f.x, p.y - f.y);
        if (dist < p.radius + 18) {
          this.killPlayer(p);
        }
      });

      if (f.life <= 0) {
        this.flames.splice(i, 1);
      }
    }
  }

  killPlayer(p) {
    p.alive = false;
    this.screenShake = 16;
    this.addFloatingText('¡ELIMINADO!', p.teamColor, 1.2, 1.4, p.x, p.y - 25);

    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color: p.teamColor,
        size: 4 + Math.random() * 4,
        life: 0.6
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playDeathSound();
    }
  }

  spawnPowerupAt(c, r) {
    const types = ['bomb', 'fire', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      c,
      r,
      x: this.grid.offsetX + c * this.grid.tileSize + this.grid.tileSize / 2,
      y: this.grid.offsetY + r * this.grid.tileSize + this.grid.tileSize / 2,
      type,
      radius: 14
    });
  }

  checkPowerupPickup(p) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      if (Math.hypot(p.x - pw.x, p.y - pw.y) < p.radius + pw.radius) {
        if (pw.type === 'bomb') p.maxBombs++;
        if (pw.type === 'fire') p.flameRange++;
        if (pw.type === 'speed') p.speed = Math.min(240, p.speed + 30);

        this.powerups.splice(i, 1);
        const pwNames = { bomb: '+1 BOMBA!', fire: '+1 FUEGO!', speed: '¡MÁS VELOCIDAD!' };
        this.addFloatingText(pwNames[pw.type] || '¡POWER-UP!', '#facc15', 1.0, 1.25, p.x, p.y - 25);
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
        gameType: 'bomberman',
        winningTeam: this.winningTeam,
        scores: this.teamScores,
        players: this.players.map(p => ({ id: p.id, score: (p.team === this.winningTeam ? 100 : 20) }))
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

    // 1. Fondo de sala
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const { offsetX, offsetY, tileSize, cols, rows } = this.grid;

    // Suelo de la arena (ajedrezado oscuro)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#172554';
        this.ctx.fillRect(offsetX + c * tileSize, offsetY + r * tileSize, tileSize, tileSize);
      }
    }

    // 2. Bloques destructibles y Pilares sólidos
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = this.grid.tiles[r][c];
        const x = offsetX + c * tileSize;
        const y = offsetY + r * tileSize;

        if (t === 1) {
          // Pilar indestructible (bloque de piedra tallada y remaches metálicos)
          this.ctx.fillStyle = '#334155';
          this.ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          this.ctx.fillStyle = '#475569';
          this.ctx.fillRect(x + 5, y + 5, tileSize - 10, tileSize - 10);
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(x + 9, y + 9, tileSize - 18, tileSize - 18);
          this.ctx.strokeStyle = '#0f172a';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

          // Remaches en 4 esquinas
          this.ctx.fillStyle = '#94a3b8';
          [ [x + 8, y + 8], [x + tileSize - 8, y + 8], [x + 8, y + tileSize - 8], [x + tileSize - 8, y + tileSize - 8] ].forEach(([rx, ry]) => {
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
          });
        } else if (t === 2) {
          // Bloque destructible (caja de madera reforzada estilo retro)
          this.ctx.fillStyle = '#78350f';
          this.ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
          this.ctx.fillStyle = '#b45309';
          this.ctx.fillRect(x + 6, y + 6, tileSize - 12, tileSize - 12);

          // Tablas horizontales y refuerzo en cruz
          this.ctx.strokeStyle = '#78350f';
          this.ctx.lineWidth = 2;
          const midY = y + tileSize / 2;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 6, midY);
          this.ctx.lineTo(x + tileSize - 6, midY);
          this.ctx.moveTo(x + 8, y + 8);
          this.ctx.lineTo(x + tileSize - 8, y + tileSize - 8);
          this.ctx.stroke();

          this.ctx.strokeStyle = '#451a03';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 3, y + 3, tileSize - 6, tileSize - 6);
        }
      }
    }

    // Marco exterior de la arena
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(offsetX, offsetY, cols * tileSize, rows * tileSize);

    // 3. Powerups
    this.powerups.forEach(pw => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = pw.type === 'bomb' ? '#ea580c' : (pw.type === 'fire' ? '#ef4444' : '#38bdf8');
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const icon = pw.type === 'bomb' ? '💣' : (pw.type === 'fire' ? '🔥' : '👟');
      this.ctx.fillText(icon, pw.x, pw.y);
      this.ctx.restore();
    });

    // 4. Bombas activas
    const now = performance.now() * 0.006;
    this.bombs.forEach(b => {
      this.ctx.save();
      const pulse = Math.sin(now * 5) * 2;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius + pulse, 0, Math.PI * 2);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fill();
      this.ctx.strokeStyle = '#f97316';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Mecha chispeante
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillRect(b.x - 2, b.y - b.radius - 6, 4, 6);
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y - b.radius - 7, 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fill();
      this.ctx.restore();
    });

    // 5. Llamas y ondas expansivas anime multicapa
    this.flames.forEach(f => {
      this.ctx.save();
      const alpha = Math.max(0.2, f.life / f.maxLife);
      this.ctx.globalAlpha = alpha;
      // Capa exterior naranja fuego
      this.ctx.fillStyle = '#ea580c';
      this.ctx.fillRect(f.x - tileSize / 2 + 2, f.y - tileSize / 2 + 2, tileSize - 4, tileSize - 4);
      // Núcleo amarillo radiante
      this.ctx.fillStyle = '#facc15';
      this.ctx.fillRect(f.x - tileSize / 4, f.y - tileSize / 4, tileSize / 2, tileSize / 2);
      // Centro blanco incandescente
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(f.x - tileSize / 8, f.y - tileSize / 8, tileSize / 4, tileSize / 4);
      this.ctx.restore();
    });

    // 6. Jugadores con Avatar de la cuadrilla
    this.players.forEach(p => {
      if (!p.alive) return;

      this.ctx.save();
      // Base redonda con color de equipo
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
      this.ctx.fillStyle = p.teamColor;
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      const img = this.avatarImages[p.id];
      if (img && img.complete) {
        const size = p.radius * 2.3;
        this.ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
      }

      // Nombre sobre la cabeza
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(p.name, p.x, p.y - p.radius - 8);
      this.ctx.restore();
    });

    // 7. Partículas
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

    // 8. Textos Arcade Flotantes
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

    // 9. HUD y Marcador
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
    const { offsetX, tileSize, cols } = this.grid;
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(offsetX, 14, cols * tileSize, 48);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(offsetX, 14, cols * tileSize, 48);

    this.ctx.font = '900 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`💣 CHAVAL BOMBERMAN — RONDA ${this.roundNumber} / ${this.maxRounds}`, this.width / 2, 42);

    this.ctx.font = '900 15px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillText(`🔵 AZUL: ${this.teamScores.teamA} Victorias`, offsetX + 20, 42);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillText(`🔴 ROJO: ${this.teamScores.teamB} Victorias`, offsetX + cols * tileSize - 20, 42);
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

    const text = countNum > 0 ? `${countNum}` : '¡BOMBAS FUERA!';

    this.ctx.font = '900 78px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#d97706';
    this.ctx.shadowBlur = 22;
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();

    this.ctx.font = '800 22px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText('¡Usa la cruceta y el botón [💣 BOMBA] en tu móvil!', this.width / 2, this.height / 2 + 55);
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

window.BombermanEngine = BombermanEngine;
