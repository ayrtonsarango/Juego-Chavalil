/**
 * CURVE FEVER / CURVYTRON (CURVAS CHAVALIL)
 * Motor 2D en HTML5 Canvas estilo Achtung die Kurve / Curve Fever.
 * Jugabilidad con solo 2 botones en móvil ([IZQUIERDA] y [DERECHA]).
 * Trazado de estelas continuas con huecos periódicos, colisiones pixel-perfect,
 * potenciadores en pista, avatares SVG de la cuadrilla y soporte para bots.
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

    this.players = [];
    this.powerups = [];
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

    // Colores vivos para jugadores individuales
    this.palette = [
      '#38bdf8', '#f43f5e', '#22c55e', '#eab308',
      '#a855f7', '#fb923c', '#06b6d4', '#ec4899'
    ];
    this.screenShake = 0;
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
    this.powerups = [];
    this.particles = [];
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;

    // Limpiar canvas de estelas
    this.clearTrailCanvas();

    const teamAIds = (teams.teamA || []).map(p => p.id);

    // Configurar jugadores
    this.players = playerList.map((p, idx) => {
      const inTeamA = teamAIds.includes(p.id) || (idx % 2 === 0);
      const color = inTeamA ? '#3b82f6' : '#ef4444';
      const personalColor = this.palette[idx % this.palette.length];

      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        team: inTeamA ? 'teamA' : 'teamB',
        teamColor: color,
        lineColor: personalColor,
        score: 0,
        // Estado físico
        x: 0,
        y: 0,
        angle: 0,
        speed: 130, // px por segundo
        baseSpeed: 130,
        turnSpeed: 3.4, // radianes por segundo
        radius: 3.5, // grosor de la línea
        alive: true,
        // Mecánica de huecos (gaps)
        drawing: true,
        drawTimer: 0,
        gapTimer: 0,
        drawDuration: 2.2 + Math.random() * 1.5,
        gapDuration: 0.35,
        // Inputs
        turnLeft: false,
        turnRight: false,
        // Efectos activos
        speedMultiplier: 1.0,
        reverseControls: false,
        effectTimer: 0,
        invulnerableTimer: 1.0 // breve inmunidad al spawn
      };
    });

    this.spawnPlayersForRound();
    this.prepareAvatars(playerList);

    // Audio match found / countdown
    if (window.soundEngine) {
      window.soundEngine.playPreparationMatchFound();
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.loop);
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
    const count = this.players.length;

    this.players.forEach((p, idx) => {
      // Spawn repartido en círculo alrededor del centro
      const angle = (idx / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 180 + Math.random() * 80;
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      p.x = centerX + Math.cos(angle) * dist;
      p.y = centerY + Math.sin(angle) * dist;
      // Apuntar hacia el centro con ligera desviación
      p.angle = angle + Math.PI + (Math.random() * 0.6 - 0.3);
      p.alive = true;
      p.drawing = true;
      p.drawTimer = 0;
      p.gapTimer = 0;
      p.drawDuration = 2.0 + Math.random() * 1.2;
      p.gapDuration = 0.32;
      p.speedMultiplier = 1.0;
      p.reverseControls = false;
      p.effectTimer = 0;
      p.invulnerableTimer = 1.0;
    });
  }

  handlePlayerInput(playerId, input) {
    const p = this.players.find(pl => pl.id === playerId);
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
        if (this.roundNumber < this.maxRounds) {
          this.roundNumber++;
          this.gameState = 'countdown';
          this.countdownTimer = 2.0;
          this.spawnPlayersForRound();
        } else {
          // Fin de partida
          this.gameState = 'victory';
          this.resolveMatchWinner();
        }
      }
      return;
    }

    if (this.gameState === 'victory') {
      return;
    }

    // Update Floating Texts
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

    // Mover jugadores y comprobar colisiones
    let aliveCount = 0;
    let lastAlivePlayer = null;

    this.players.forEach(p => {
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

      // Trailing jet spark
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
        this.killPlayer(p, 'pared');
        return;
      }

      // Colisión con estelas en trailCanvas (sólo si no es inmune)
      if (p.invulnerableTimer <= 0) {
        // Muestra de píxeles justo delante de la cabeza
        const checkDist = p.radius + 1.8;
        const checkX = Math.round(p.x + Math.cos(p.angle) * checkDist);
        const checkY = Math.round(p.y + Math.sin(p.angle) * checkDist);

        if (checkX >= 0 && checkX < this.width && checkY >= 0 && checkY < this.height) {
          const pixel = this.trailCtx.getImageData(checkX, checkY, 1, 1).data;
          // Si el píxel no es fondo oscuro (#0f172a es [15, 23, 42]), hay estela o marco
          const isBackground = (pixel[0] < 22 && pixel[1] < 30 && pixel[2] < 50);
          if (!isBackground) {
            this.killPlayer(p, 'estela');
            return;
          }
        }
      }

      // Dibujar trazo en trailCanvas si está en modo dibujo
      if (p.drawing) {
        this.trailCtx.strokeStyle = p.lineColor;
        this.trailCtx.lineWidth = p.radius * 2;
        this.trailCtx.lineCap = 'round';
        this.trailCtx.beginPath();
        this.trailCtx.moveTo(prevX, prevY);
        this.trailCtx.lineTo(p.x, p.y);
        this.trailCtx.stroke();

        // Partículas lumínicas sutiles en la estela
        if (Math.random() < 0.25) {
          this.particles.push({
            x: prevX,
            y: prevY,
            vx: (Math.random() - 0.5) * 25,
            vy: (Math.random() - 0.5) * 25,
            color: p.lineColor,
            size: 2,
            life: 0.35
          });
        }
      }

      // Recoger power-ups
      this.checkPowerupCollection(p);
    });

    // Actualizar partículas
    this.updateParticles(dt);

    // Condición de final de ronda: queda 1 jugador (o 0 si murieron a la vez)
    const requiredAlive = this.players.length > 1 ? 1 : 0;
    if (aliveCount <= requiredAlive) {
      this.finishRound(lastAlivePlayer);
    }
  }

  updateBots(dt) {
    this.players.forEach(p => {
      if (!p.isBot || !p.alive) return;

      // Raycast frontal, izquierda y derecha para evitar colisiones
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
          // Ambos lados amenazados: girar fuerte hacia el lado más abierto
          p.turnLeft = Math.random() < 0.5;
          p.turnRight = !p.turnLeft;
        }
      } else {
        // Navegación suave aleatoria para generar curvas bonitas
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

  killPlayer(p, reason = '') {
    p.alive = false;
    this.screenShake = 14;
    this.addFloatingText('¡ELIMINADO!', p.lineColor, 1.2, 1.4, p.x, p.y - 24);

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
        // Ralentizar a los rivales
        this.players.forEach(pl => {
          if (pl.id !== collector.id && pl.alive) {
            pl.speedMultiplier = 0.65;
            pl.effectTimer = 4.0;
          }
        });
        break;
      case 'reverse':
        // Invertir controles a los rivales
        this.players.forEach(pl => {
          if (pl.id !== collector.id && pl.alive) {
            pl.reverseControls = true;
            pl.effectTimer = 3.5;
          }
        });
        break;
      case 'clear':
        // Limpiar parcialmente estelas de la arena
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
    this.roundOverTimer = 2.5;

    if (winnerPlayer) {
      winnerPlayer.score += 100;
      if (winnerPlayer.team === 'teamA') {
        this.teamScores.teamA += 1;
      } else {
        this.teamScores.teamB += 1;
      }
      if (window.soundEngine) {
        window.soundEngine.playCelebrationJump();
      }
    }
  }

  resolveMatchWinner() {
    if (this.teamScores.teamA >= this.teamScores.teamB) {
      this.winningTeam = 'teamA';
    } else {
      this.winningTeam = 'teamB';
    }

    if (window.soundEngine) {
      window.soundEngine.playSocialCreditVictory();
    }

    setTimeout(() => {
      this.onComplete({
        gameType: 'curve',
        winningTeam: this.winningTeam,
        scores: this.teamScores,
        players: this.players.map(p => ({ id: p.id, score: p.score }))
      });
    }, 3500);
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

    // 1. Fondo y estelas acumuladas
    this.ctx.drawImage(this.trailCanvas, 0, 0);

    // Marco neón decorativo con esquinas tácticas
    this.ctx.save();
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);

    // Esquinas tácticas reforzadas
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
      const pulse = Math.sin(now * 3) * 2;
      this.ctx.beginPath();
      this.ctx.arc(pw.x, pw.y, pw.radius + pulse, 0, Math.PI * 2);

      let color = '#38bdf8';
      let icon = '⚡';
      if (pw.type === 'slow') { color = '#f43f5e'; icon = '🐢'; }
      if (pw.type === 'reverse') { color = '#a855f7'; icon = '🔄'; }
      if (pw.type === 'clear') { color = '#22c55e'; icon = '🧹'; }

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

    // 3. Cabezas de los jugadores con avatares
    this.players.forEach(p => {
      if (!p.alive) return;

      this.ctx.save();
      // Anillo de brillo alrededor de la cabeza
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
      this.ctx.fillStyle = p.lineColor;
      this.ctx.shadowColor = p.lineColor;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();

      // Mini avatar de la cabeza
      const img = this.avatarImages[p.id];
      if (img && img.complete) {
        const headSize = 24;
        this.ctx.drawImage(img, p.x - headSize / 2, p.y - headSize / 2, headSize, headSize);
      } else {
        // Fallback círculo blanco con inicial
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius + 1, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
      }

      // Nombre flotante pequeño
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(p.name, p.x, p.y - 14);
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

    // 6. HUD Superior (Rondas y Marcadores de Equipos)
    this.renderHUD();

    // 7. Overlays de estado (Countdown, Round Over, Victory)
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
    // Barra superior
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(this.bounds.x, 10, this.bounds.w, 42);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(this.bounds.x, 10, this.bounds.w, 42);

    // Título central y Ronda
    this.ctx.font = '900 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(`🌀 CURVAS CHAVALIL — RONDA ${this.roundNumber} / ${this.maxRounds}`, this.width / 2, 36);

    // Equipo Azul (Izquierda)
    this.ctx.font = '900 15px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillText(`🔵 EQUIPO AZUL: ${this.teamScores.teamA} Victorias`, this.bounds.x + 16, 36);

    // Equipo Rojo (Derecha)
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillText(`🔴 EQUIPO ROJO: ${this.teamScores.teamB} Victorias`, this.bounds.x + this.bounds.w - 16, 36);
    this.ctx.restore();
  }

  renderCountdown() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const countNum = Math.ceil(this.countdownTimer);
    const frac = this.countdownTimer - Math.floor(this.countdownTimer);
    const bounceScale = 1.0 + Math.sin(Math.max(0, frac) * Math.PI) * 0.35;

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height / 2 - 20);
    this.ctx.scale(bounceScale, bounceScale);

    const text = countNum > 0 ? `${countNum}` : '¡DERRAPA!';

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
    this.ctx.fillText('Usa [◀ IZQ] y [DER ▶] en el móvil para esquivar estelas', this.width / 2, this.height / 2 + 55);
    this.ctx.restore();
  }

  renderRoundOver() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = '900 48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText(`FIN DE LA RONDA ${this.roundNumber}`, this.width / 2, this.height / 2 - 20);

    this.ctx.font = '800 20px sans-serif';
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

// Exportación global
window.CurveFeverEngine = CurveFeverEngine;
