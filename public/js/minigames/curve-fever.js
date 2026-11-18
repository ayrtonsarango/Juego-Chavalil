/**
 * CURVE FEVER / CURVYTRON (CURVAS CHAVALIL)
 * Motor 2D en HTML5 Canvas estilo Achtung die Kurve / Curve Fever.
 * Jugabilidad con solo 2 botones en móvil ([IZQUIERDA] y [DERECHA]).
 * MODO: TODOS CONTRA TODOS (Free-For-All) con agrupación en packs parejos (Heats)
 * y Gran Final de clasificados si hay más de 4 jugadores.
 * Sonido de "LoL Match Found" entre rondas y heats.
 */

class CurveFeverEngine {
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

    // Arena bounds (con margen estético y marco neón)
    this.bounds = {
      x: 60,
      y: 60,
      w: 1160,
      h: 600
    };

    // Offscreen canvas para almacenar el rastro permanente de líneas
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = this.width;
    this.trailCanvas.height = this.height;
    this.trailCtx = this.trailCanvas.getContext('2d', { willReadFrequently: true });

    this.allPlayers = [];
    this.packs = [];
    this.phases = [];
    this.currentPhaseIndex = 0;
    this.currentRoundInPhase = 1;
    this.activePlayers = [];

    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.avatarImages = {};

    this.gameState = 'countdown'; // 'countdown' | 'playing' | 'round_over' | 'victory'
    this.countdownTimer = 3.5;
    this.roundOverTimer = 0;
    this.grandWinner = null;

    // Paleta Candy-Arcade de colores individuales vibrantes
    this.palette = [
      '#38bdf8', '#f43f5e', '#22c55e', '#eab308',
      '#a855f7', '#fb923c', '#06b6d4', '#ec4899',
      '#f472b6', '#4ade80'
    ];
    this.screenShake = 0;
  }

  /**
   * Particiona N jugadores en K grupos parejos (ej. 6 -> [3, 3], 7 -> [4, 3], 8 -> [4, 4]).
   */
  static partitionIntoBalancedPacks(players, maxPerPack = 4) {
    const n = players.length;
    if (n <= maxPerPack) return [players.slice()];
    const numPacks = Math.ceil(n / maxPerPack);
    const baseSize = Math.floor(n / numPacks);
    const remainder = n % numPacks;

    const packs = [];
    let offset = 0;
    for (let i = 0; i < numPacks; i++) {
      const size = baseSize + (i < remainder ? 1 : 0);
      packs.push(players.slice(offset, offset + size));
      offset += size;
    }
    return packs;
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
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.grandWinner = null;

    // 1. Instanciar todos los jugadores en modo Free-For-All
    this.allPlayers = playerList.map((p, idx) => {
      const personalColor = this.palette[idx % this.palette.length];
      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        lineColor: personalColor,
        totalScore: 0,
        roundWins: 0,
        // Estado físico y controles
        x: 0,
        y: 0,
        angle: 0,
        speed: 130,
        baseSpeed: 130,
        turnSpeed: 3.4,
        radius: 3.5,
        alive: true,
        drawing: true,
        drawTimer: 0,
        gapTimer: 0,
        drawDuration: 2.2 + Math.random() * 1.5,
        gapDuration: 0.35,
        turnLeft: false,
        turnRight: false,
        speedMultiplier: 1.0,
        reverseControls: false,
        effectTimer: 0,
        invulnerableTimer: 1.0
      };
    });

    // 2. Particionar en packs parejos (máximo 4 por pista)
    this.packs = CurveFeverEngine.partitionIntoBalancedPacks(this.allPlayers, 4);

    // 3. Diseñar fases del torneo
    this.phases = [];
    if (this.packs.length === 1) {
      // 1 solo grupo: 3 rondas directas todos contra todos
      this.phases.push({
        title: 'TODOS CONTRA TODOS',
        isFinal: true,
        packIndex: 0,
        maxRounds: 3
      });
    } else {
      // Múltiples grupos: heats clasificatorios de 2 rondas cada uno
      this.packs.forEach((pack, pIdx) => {
        this.phases.push({
          title: `GRUPO ${pIdx + 1} / ${this.packs.length}`,
          isFinal: false,
          packIndex: pIdx,
          maxRounds: 2
        });
      });
      // Gran Final de 2 rondas entre los clasificados
      this.phases.push({
        title: '⚔️ GRAN FINAL',
        isFinal: true,
        packIndex: -1,
        maxRounds: 2
      });
    }

    this.prepareAvatars(this.allPlayers);

    // Iniciar Fase 0
    this.startPhase(0);

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.loop);
  }

  startPhase(phaseIndex) {
    this.currentPhaseIndex = phaseIndex;
    this.currentRoundInPhase = 1;
    const phase = this.phases[phaseIndex];

    if (!phase.isFinal) {
      // Activar los jugadores del pack correspondiente
      this.activePlayers = this.packs[phase.packIndex];
    } else if (this.packs.length === 1) {
      this.activePlayers = this.allPlayers;
    } else {
      // Seleccionar clasificados para la Gran Final:
      // Los 2 mejores de cada pack (o top 4 por puntos totales)
      const finalists = [];
      this.packs.forEach(pack => {
        const sorted = pack.slice().sort((a, b) => b.totalScore - a.totalScore);
        finalists.push(...sorted.slice(0, 2));
      });
      // En caso de desempate o grupo impar, garantizar entre 3 y 4 finalistas
      this.activePlayers = Array.from(new Set(finalists)).slice(0, 4);
      if (this.activePlayers.length < 3) {
        // Fallback a los top 4 por puntos globales
        this.activePlayers = this.allPlayers.slice().sort((a, b) => b.totalScore - a.totalScore).slice(0, 4);
      }
    }

    // Notificar a los mandos móviles (los que juegan están en la arena, el resto en banquillo)
    this.notifyHeatUpdate();

    // Audio LoL Match Found al iniciar cada heat/grupo
    if (window.soundEngine) {
      window.soundEngine.playLolMatchFound(0.95);
    }

    this.gameState = 'countdown';
    this.countdownTimer = 3.5;
    this.spawnPlayersForRound();
  }

  notifyHeatUpdate() {
    if (typeof socket !== 'undefined' && socket) {
      const activeIds = this.activePlayers.map(p => p.id);
      socket.emit('minigame_heat_update', {
        heatIndex: this.currentPhaseIndex + 1,
        totalHeats: this.phases.length,
        activePlayerIds: activeIds,
        minigameName: 'Curvas Chavalil'
      });
    }
  }

  clearTrailCanvas() {
    this.trailCtx.fillStyle = '#0b0f19';
    this.trailCtx.fillRect(0, 0, this.width, this.height);

    // Rejilla cibernética sutil dentro de los límites
    this.trailCtx.save();
    this.trailCtx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    this.trailCtx.lineWidth = 1;
    const gridStep = 40;
    for (let x = this.bounds.x; x <= this.bounds.x + this.bounds.w; x += gridStep) {
      this.trailCtx.beginPath();
      this.trailCtx.moveTo(x, this.bounds.y);
      this.trailCtx.lineTo(x, this.bounds.y + this.bounds.h);
      this.trailCtx.stroke();
    }
    for (let y = this.bounds.y; y <= this.bounds.y + this.bounds.h; y += gridStep) {
      this.trailCtx.beginPath();
      this.trailCtx.moveTo(this.bounds.x, y);
      this.trailCtx.lineTo(this.bounds.x + this.bounds.w, y);
      this.trailCtx.stroke();
    }
    this.trailCtx.restore();

    // Marco exterior de la arena
    this.trailCtx.strokeStyle = '#334155';
    this.trailCtx.lineWidth = 4;
    this.trailCtx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
  }

  spawnPlayersForRound() {
    this.clearTrailCanvas();
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    const count = this.activePlayers.length;

    this.activePlayers.forEach((p, idx) => {
      // Spawn repartido radialmente alrededor del centro de la arena
      const angle = (idx / Math.max(1, count)) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 180 + Math.random() * 70;
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      p.x = centerX + Math.cos(angle) * dist;
      p.y = centerY + Math.sin(angle) * dist;
      // Apuntar hacia el centro de la arena
      p.angle = angle + Math.PI + (Math.random() * 0.5 - 0.25);
      p.alive = true;
      p.drawing = true;
      p.drawTimer = 0;
      p.gapTimer = 0;
      p.drawDuration = 2.0 + Math.random() * 1.2;
      p.gapDuration = 0.35;
      p.speedMultiplier = 1.0;
      p.reverseControls = false;
      p.effectTimer = 0;
      p.invulnerableTimer = 1.0;
      p.turnLeft = false;
      p.turnRight = false;
    });
  }

  handlePlayerInput(playerId, input) {
    const p = this.allPlayers.find(pl => pl.id === playerId);
    if (!p) return;

    if (typeof input.left === 'boolean') {
      p.turnLeft = p.reverseControls ? !input.left : input.left;
    }
    if (typeof input.right === 'boolean') {
      p.turnRight = p.reverseControls ? !input.right : input.right;
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
        const phase = this.phases[this.currentPhaseIndex];
        if (this.currentRoundInPhase < phase.maxRounds) {
          // Siguiente ronda dentro de la misma fase
          this.currentRoundInPhase++;
          this.gameState = 'countdown';
          this.countdownTimer = 3.5;
          // Audio LoL Match Found entre rondas
          if (window.soundEngine) {
            window.soundEngine.playLolMatchFound(0.95);
          }
          this.spawnPlayersForRound();
        } else {
          // Fase completada: avanzar a la siguiente fase (siguiente grupo o Gran Final)
          if (this.currentPhaseIndex < this.phases.length - 1) {
            this.startPhase(this.currentPhaseIndex + 1);
          } else {
            // Torneo de Curvas finalizado
            this.gameState = 'victory';
            this.resolveTournamentWinner();
          }
        }
      }
      return;
    }

    if (this.gameState === 'victory') {
      return;
    }

    // Actualizar Textos Flotantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 32;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Spawn periódico de power-ups
    if (Math.random() < 0.015 && this.powerups.length < 4) {
      this.spawnPowerup();
    }

    // Actualizar bots e inputs
    this.updateBots(dt);

    // Mover jugadores activos y comprobar colisiones
    let aliveCount = 0;
    let lastAlivePlayer = null;

    this.activePlayers.forEach(p => {
      if (!p.alive) return;
      aliveCount++;
      lastAlivePlayer = p;

      // Inmunidad temporal inicial
      if (p.invulnerableTimer > 0) {
        p.invulnerableTimer -= dt;
      }

      // Efectos temporales
      if (p.effectTimer > 0) {
        p.effectTimer -= dt;
        if (p.effectTimer <= 0) {
          p.speedMultiplier = 1.0;
          p.reverseControls = false;
        }
      }

      // Giro
      const turnDir = (p.turnRight ? 1 : 0) - (p.turnLeft ? 1 : 0);
      p.angle += turnDir * p.turnSpeed * dt;

      // Movimiento
      const currentSpeed = p.baseSpeed * p.speedMultiplier;
      const prevX = p.x;
      const prevY = p.y;
      p.x += Math.cos(p.angle) * currentSpeed * dt;
      p.y += Math.sin(p.angle) * currentSpeed * dt;

      // Partícula de estela
      if (p.drawing && Math.random() < 0.25) {
        this.particles.push({
          x: p.x - Math.cos(p.angle) * 4,
          y: p.y - Math.sin(p.angle) * 4,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          color: p.lineColor,
          size: 2,
          life: 0.35,
          maxLife: 0.35
        });
      }

      // Ciclo de dibujo vs hueco (gap)
      if (p.drawing) {
        p.drawTimer += dt;
        if (p.drawTimer >= p.drawDuration) {
          p.drawing = false;
          p.drawTimer = 0;
          p.gapTimer = 0;
        }
      } else {
        p.gapTimer += dt;
        if (p.gapTimer >= p.gapDuration) {
          p.drawing = true;
          p.gapTimer = 0;
          p.drawTimer = 0;
          p.drawDuration = 2.0 + Math.random() * 1.5;
        }
      }

      // Colisión con paredes de la arena
      if (
        p.x <= this.bounds.x + p.radius ||
        p.x >= this.bounds.x + this.bounds.w - p.radius ||
        p.y <= this.bounds.y + p.radius ||
        p.y >= this.bounds.y + this.bounds.h - p.radius
      ) {
        this.killPlayer(p, 'pared', aliveCount);
        return;
      }

      // Colisión con estelas en trailCanvas (sólo si no es inmune)
      if (p.invulnerableTimer <= 0) {
        const checkDist = p.radius + 1.8;
        const checkX = Math.round(p.x + Math.cos(p.angle) * checkDist);
        const checkY = Math.round(p.y + Math.sin(p.angle) * checkDist);

        if (checkX >= 0 && checkX < this.width && checkY >= 0 && checkY < this.height) {
          const pixel = this.trailCtx.getImageData(checkX, checkY, 1, 1).data;
          const isBackground = (pixel[0] < 22 && pixel[1] < 30 && pixel[2] < 50);
          if (!isBackground) {
            this.killPlayer(p, 'estela', aliveCount);
            return;
          }
        }
      }

      // Dibujar trazo en trailCanvas
      if (p.drawing) {
        this.trailCtx.strokeStyle = p.lineColor;
        this.trailCtx.lineWidth = p.radius * 2;
        this.trailCtx.lineCap = 'round';
        this.trailCtx.beginPath();
        this.trailCtx.moveTo(prevX, prevY);
        this.trailCtx.lineTo(p.x, p.y);
        this.trailCtx.stroke();
      }

      // Recoger power-ups
      this.checkPowerupCollection(p);
    });

    // Actualizar partículas
    this.updateParticles(dt);

    // Condición de final de ronda: queda 1 jugador superviviente (o 0 si murieron a la vez)
    const requiredAlive = this.activePlayers.length > 1 ? 1 : 0;
    if (aliveCount <= requiredAlive) {
      this.finishRound(lastAlivePlayer);
    }
  }

  updateBots(dt) {
    this.activePlayers.forEach(p => {
      if (!p.isBot || !p.alive) return;

      const rayDist = 28;
      const leftAngle = p.angle - 0.65;
      const rightAngle = p.angle + 0.65;

      const frontHit = this.checkPointCollision(p.x + Math.cos(p.angle) * rayDist, p.y + Math.sin(p.angle) * rayDist);
      const leftHit = this.checkPointCollision(p.x + Math.cos(leftAngle) * rayDist, p.y + Math.sin(leftAngle) * rayDist);
      const rightHit = this.checkPointCollision(p.x + Math.cos(rightAngle) * rayDist, p.y + Math.sin(rightAngle) * rayDist);

      if (frontHit || leftHit || rightHit) {
        if (leftHit && !rightHit) {
          p.turnLeft = false;
          p.turnRight = true;
        } else if (rightHit && !leftHit) {
          p.turnLeft = true;
          p.turnRight = false;
        } else {
          p.turnLeft = Math.random() < 0.5;
          p.turnRight = !p.turnLeft;
        }
      } else {
        if (Math.random() < 0.04) {
          const r = Math.random();
          p.turnLeft = r < 0.35;
          p.turnRight = r > 0.65;
        }
      }
    });
  }

  checkPointCollision(x, y) {
    if (x <= this.bounds.x + 8 || x >= this.bounds.x + this.bounds.w - 8 ||
        y <= this.bounds.y + 8 || y >= this.bounds.y + this.bounds.h - 8) {
      return true;
    }
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return true;
    const pixel = this.trailCtx.getImageData(px, py, 1, 1).data;
    return !(pixel[0] < 22 && pixel[1] < 30 && pixel[2] < 50);
  }

  killPlayer(p, reason = '', currentAliveCount = 1) {
    p.alive = false;
    this.screenShake = 14;

    // Puntos individuales según los rivales a los que ha sobrevivido
    const outlastedCount = Math.max(0, this.activePlayers.length - currentAliveCount);
    const pts = outlastedCount * 10;
    p.totalScore += pts;

    this.addFloatingText(pts > 0 ? `+${pts} PTS` : '¡ELIMINADO!', p.lineColor, 1.2, 1.4, p.x, p.y - 24);

    // Onda expansiva neón
    this.particles.push({
      x: p.x,
      y: p.y,
      type: 'shockwave',
      radius: 4,
      maxRadius: 46,
      color: p.lineColor,
      life: 0.55,
      maxLife: 0.55
    });

    // Explosión de partículas
    for (let i = 0; i < 24; i++) {
      const spd = 60 + Math.random() * 140;
      const ang = Math.random() * Math.PI * 2;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: p.lineColor,
        size: 3 + Math.random() * 4,
        life: 0.6 + Math.random() * 0.4
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playDeathSound();
    }
  }

  spawnPowerup() {
    const types = ['speed', 'slow', 'reverse', 'clear'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const margin = 80;
    this.powerups.push({
      x: this.bounds.x + margin + Math.random() * (this.bounds.w - margin * 2),
      y: this.bounds.y + margin + Math.random() * (this.bounds.h - margin * 2),
      radius: 12,
      type: chosenType,
      pulse: 0
    });
  }

  checkPowerupCollection(p) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      const dist = Math.hypot(p.x - pw.x, p.y - pw.y);
      if (dist < p.radius + pw.radius) {
        this.applyPowerup(p, pw.type);
        this.powerups.splice(i, 1);
        if (window.soundEngine) {
          window.soundEngine.playMarioCoin();
        }
      }
    }
  }

  applyPowerup(collector, type) {
    switch (type) {
      case 'speed':
        collector.speedMultiplier = 1.5;
        collector.effectTimer = 4.0;
        break;
      case 'slow':
        this.activePlayers.forEach(pl => {
          if (pl.id !== collector.id && pl.alive) {
            pl.speedMultiplier = 0.65;
            pl.effectTimer = 4.0;
          }
        });
        break;
      case 'reverse':
        this.activePlayers.forEach(pl => {
          if (pl.id !== collector.id && pl.alive) {
            pl.reverseControls = true;
            pl.effectTimer = 3.5;
          }
        });
        break;
      case 'clear':
        this.clearTrailCanvas();
        break;
    }

    const pwNames = { speed: '¡TURBO!', slow: '¡LENTO A RIVALES!', reverse: '¡INVERSIÓN!', clear: '¡ARENA LIMPIA!' };
    this.addFloatingText(pwNames[type] || '¡POWER-UP!', '#38bdf8', 1.0, 1.25, collector.x, collector.y - 24);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  finishRound(winnerPlayer) {
    this.gameState = 'round_over';
    this.roundOverTimer = 2.8;

    if (winnerPlayer) {
      winnerPlayer.roundWins = (winnerPlayer.roundWins || 0) + 1;
      winnerPlayer.totalScore = (winnerPlayer.totalScore || 0) + 50;

      this.addFloatingText('¡SUPERVIVIENTE! +50 PTS', winnerPlayer.lineColor, 2.0, 1.5, this.width / 2, this.height / 2);

      if (window.soundEngine) {
        window.soundEngine.playCelebrationJump();
      }
    }
  }

  resolveTournamentWinner() {
    const sorted = this.allPlayers.slice().sort((a, b) => b.totalScore - a.totalScore);
    this.grandWinner = sorted[0];

    if (window.soundEngine) {
      window.soundEngine.playSocialCreditVictory();
    }

    setTimeout(() => {
      this.onComplete({
        gameType: 'curve',
        isFFA: true,
        winnerId: this.grandWinner ? this.grandWinner.id : null,
        scores: this.allPlayers.map(p => ({ id: p.id, score: p.totalScore })),
        ranking: sorted.map(p => ({ id: p.id, name: p.name, score: p.totalScore }))
      });
    }, 4000);
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();

    // Screen Shake
    if (this.screenShake > 0.2) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
      this.screenShake *= 0.88;
    }

    // 1. Fondo y estelas acumuladas
    this.ctx.drawImage(this.trailCanvas, 0, 0);

    // Marco neón de la arena
    this.ctx.save();
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);

    // Esquinas reforzadas
    const cLen = 20;
    const bx = this.bounds.x, by = this.bounds.y, bw = this.bounds.w, bh = this.bounds.h;
    this.ctx.strokeStyle = '#00f2fe';
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(bx, by + cLen); this.ctx.lineTo(bx, by); this.ctx.lineTo(bx + cLen, by);
    this.ctx.moveTo(bx + bw - cLen, by); this.ctx.lineTo(bx + bw, by); this.ctx.lineTo(bx + bw, by + cLen);
    this.ctx.moveTo(bx, by + bh - cLen); this.ctx.lineTo(bx, by + bh); this.ctx.lineTo(bx + cLen, by + bh);
    this.ctx.moveTo(bx + bw - cLen, by + bh); this.ctx.lineTo(bx + bw, by + bh); this.ctx.lineTo(bx + bw, by + bh - cLen);
    this.ctx.stroke();
    this.ctx.restore();

    // 2. Power-ups
    const now = performance.now() * 0.005;
    this.powerups.forEach(pw => {
      this.ctx.save();
      const pulseR = pw.radius + Math.sin(now + pw.x) * 2;
      this.ctx.beginPath();
      this.ctx.arc(pw.x, pw.y, pulseR, 0, Math.PI * 2);
      this.ctx.fillStyle = pw.type === 'speed' ? '#eab308' :
                           pw.type === 'slow' ? '#06b6d4' :
                           pw.type === 'reverse' ? '#ec4899' : '#22c55e';
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.shadowBlur = 12;
      this.ctx.fill();

      // Icono
      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const icon = pw.type === 'speed' ? '⚡' : pw.type === 'slow' ? '❄️' : pw.type === 'reverse' ? '🔄' : '🧹';
      this.ctx.fillText(icon, pw.x, pw.y);
      this.ctx.restore();
    });

    // 3. Cabezas y avatares de jugadores activos
    this.activePlayers.forEach(p => {
      if (!p.alive) return;

      this.ctx.save();
      const img = this.avatarImages[p.id];
      if (img) {
        const headSize = 26;
        this.ctx.drawImage(img, p.x - headSize / 2, p.y - headSize / 2, headSize, headSize);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
        this.ctx.fillStyle = p.lineColor;
        this.ctx.fill();
      }

      // Nombre del jugador en su color
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = p.lineColor;
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(p.name, p.x, p.y - 16);
      this.ctx.restore();
    });

    // 4. Partículas
    this.particles.forEach(part => {
      this.ctx.save();
      if (part.type === 'shockwave') {
        const prog = 1.0 - (part.life / part.maxLife);
        const r = prog * part.maxRadius + part.radius;
        this.ctx.globalAlpha = Math.max(0, part.life / part.maxLife);
        this.ctx.strokeStyle = part.color;
        this.ctx.shadowColor = part.color;
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(part.x, part.y, r, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        this.ctx.fillStyle = part.color;
        this.ctx.globalAlpha = Math.max(0, part.life);
        this.ctx.fill();
      }
      this.ctx.restore();
    });

    // 5. Textos Arcade Flotantes
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

    // 6. HUD Superior Arcade (Todos Contra Todos y Marcador Individual)
    this.renderHUD();

    // 7. Overlays de estado
    if (this.gameState === 'countdown') {
      this.renderCountdown();
    } else if (this.gameState === 'round_over') {
      this.renderRoundOver();
    } else if (this.gameState === 'victory') {
      this.renderVictory();
    }

    this.ctx.restore();
  }

  renderHUD() {
    this.ctx.save();
    const phase = this.phases[this.currentPhaseIndex] || { title: 'CURVAS CHAVALIL', maxRounds: 3 };

    // Barra superior estilo Candy Arcade
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(this.bounds.x, 8, this.bounds.w, 46);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.bounds.x, 8, this.bounds.w, 46);

    // Título de la Fase y Ronda
    this.ctx.font = '900 16px "Impact", "Arial Black", sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`🌀 CURVAS CHAVALIL — ${phase.title}  ·  RONDA ${this.currentRoundInPhase} / ${phase.maxRounds}`, this.bounds.x + 16, 36);

    // Badges de puntuación individual para los jugadores activos en este heat
    let chipX = this.bounds.x + this.bounds.w - 16;
    this.activePlayers.slice().reverse().forEach(p => {
      this.ctx.textAlign = 'right';
      this.ctx.font = '900 13px sans-serif';
      const statusIcon = p.alive ? '●' : '✕';
      const text = `${statusIcon} ${p.name}: ${p.totalScore} pts`;

      this.ctx.fillStyle = p.alive ? p.lineColor : '#64748b';
      this.ctx.fillText(text, chipX, 36);
      chipX -= (this.ctx.measureText(text).width + 18);
    });

    this.ctx.restore();
  }

  renderCountdown() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const phase = this.phases[this.currentPhaseIndex] || { title: 'CURVAS' };
    const countNum = Math.ceil(this.countdownTimer);
    const frac = this.countdownTimer - Math.floor(this.countdownTimer);
    const bounceScale = 1.0 + Math.sin(Math.max(0, frac) * Math.PI) * 0.3;

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2 - 20);
    this.ctx.scale(bounceScale, bounceScale);

    const text = countNum > 0 ? `${countNum}` : '¡DERRAPA!';

    this.ctx.font = '900 84px "Impact", "Arial Black", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#d97706';
    this.ctx.shadowBlur = 24;
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();

    // Subtítulo con el grupo activo
    this.ctx.font = '900 24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText(`★ ${phase.title} ★`, this.width / 2, this.height / 2 + 55);

    // Controles
    this.ctx.font = '700 16px sans-serif';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText('Pulsa [◀ IZQUIERDA] y [DERECHA ▶] en tu móvil para esquivar estelas', this.width / 2, this.height / 2 + 88);

    this.ctx.restore();
  }

  renderRoundOver() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const phase = this.phases[this.currentPhaseIndex] || { title: 'CURVAS' };

    this.ctx.font = '900 52px "Impact", "Arial Black", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#0284c7';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(`FIN DE LA RONDA ${this.currentRoundInPhase}`, this.width / 2, this.height / 2 - 40);

    // Tabla de puntuaciones del grupo
    this.ctx.font = '900 22px sans-serif';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(`Clasificación de ${phase.title}:`, this.width / 2, this.height / 2 + 10);

    const sortedActive = this.activePlayers.slice().sort((a, b) => b.totalScore - a.totalScore);
    const summary = sortedActive.map((p, i) => `${i + 1}º ${p.name} (${p.totalScore} pts)`).join('  ·  ');

    this.ctx.font = '800 18px sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(summary, this.width / 2, this.height / 2 + 50);

    this.ctx.restore();
  }

  renderVictory() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const champ = this.grandWinner || this.allPlayers[0];

    this.ctx.font = '900 56px "Impact", "Arial Black", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#d97706';
    this.ctx.shadowBlur = 25;
    this.ctx.fillText(`🏆 ¡VICTORIA DE ${champ ? champ.name.toUpperCase() : 'CHAVAL'}!`, this.width / 2, this.height / 2 - 60);

    // Avatar del campeón
    if (champ && this.avatarImages[champ.id]) {
      const aSize = 90;
      this.ctx.drawImage(this.avatarImages[champ.id], this.width / 2 - aSize / 2, this.height / 2 - 20, aSize, aSize);
    }

    this.ctx.font = '900 26px sans-serif';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowBlur = 12;
    this.ctx.fillText(`Puntuación Ganadora: ${champ ? champ.totalScore : 0} PUNTOS`, this.width / 2, this.height / 2 + 95);

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

// Exportación global
window.CurveFeverEngine = CurveFeverEngine;
