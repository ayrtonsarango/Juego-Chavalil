/**
 * HAXBALL CHAVALIL (SOCCER 2D TOP-DOWN)
 * Motor cenital de fútbol multijugador en HTML5 Canvas estilo HaxBall / Soccer.js.
 * Físicas elásticas completas de discos, fricción en césped, rebotes en postes,
 * mecánicas de pase y disparo con potencia, avatares SVG de la cuadrilla integrados,
 * celebración de goles en pantalla grande y gamepad móvil optimizado.
 */

class HaxballEngine {
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

    // Geometría del campo de juego (turf)
    this.pitch = {
      x: 100,
      y: 70,
      w: 1080,
      h: 580,
      goalDepth: 55,
      goalHeight: 160
    };

    // Porterías (cajas detrás de las líneas de gol)
    const goalY = this.pitch.y + (this.pitch.h - this.pitch.goalHeight) / 2;
    this.goals = {
      red: {
        x: this.pitch.x - this.pitch.goalDepth,
        y: goalY,
        w: this.pitch.goalDepth,
        h: this.pitch.goalHeight,
        topPost: { x: this.pitch.x, y: goalY },
        bottomPost: { x: this.pitch.x, y: goalY + this.pitch.goalHeight }
      },
      blue: {
        x: this.pitch.x + this.pitch.w,
        y: goalY,
        w: this.pitch.goalDepth,
        h: this.pitch.goalHeight,
        topPost: { x: this.pitch.x + this.pitch.w, y: goalY },
        bottomPost: { x: this.pitch.x + this.pitch.w, y: goalY + this.pitch.goalHeight }
      }
    };

    // Balón físico de HaxBall
    this.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      radius: 12,
      restitution: 0.88,
      friction: 0.988,
      mass: 1.0,
      inGoal: false
    };

    this.players = [];
    this.particles = [];
    this.confetti = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.ballTrail = [];
    this.avatarImages = {};

    this.matchTime = 90; // 90 segundos de partido
    this.gameState = 'countdown'; // 'countdown' | 'match' | 'goal' | 'victory'
    this.countdownTimer = 3.0;
    this.goalCelebrationTimer = 0;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.lastScorer = null;
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
    this.matchTime = 90;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.particles = [];
    this.confetti = [];

    const teamAIds = (teams.teamA || []).map(p => p.id);

    this.players = playerList.map((p, idx) => {
      const isTeamA = teamAIds.includes(p.id) || (idx % 2 === 0);
      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        team: isTeamA ? 'teamA' : 'teamB',
        teamColor: isTeamA ? '#3b82f6' : '#ef4444',
        accentColor: isTeamA ? '#93c5fd' : '#fca5a5',
        teamName: isTeamA ? 'AZUL' : 'ROJO',
        // Disco físico de jugador
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 20,
        mass: 2.2,
        maxSpeed: 250,
        accel: 900,
        friction: 0.94,
        restitution: 0.5,
        // Acción de chut
        isKicking: false,
        kickTimer: 0,
        kickCooldown: 0,
        // Inputs
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false,
        // IA
        aiTimer: Math.random() * 0.2
      };
    });

    this.resetPositions();
    this.prepareAvatars(playerList);

    if (window.soundEngine) {
      window.soundEngine.playPreparationMatchFound();
    }

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.loop);
  }

  resetPositions() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.inGoal = false;

    const teamAPlayers = this.players.filter(p => p.team === 'teamA');
    const teamBPlayers = this.players.filter(p => p.team === 'teamB');

    // Posiciones en campo propio
    teamAPlayers.forEach((p, idx) => {
      p.x = this.pitch.x + 200 + (idx % 2) * 120;
      p.y = this.pitch.y + this.pitch.h / 2 + (idx - (teamAPlayers.length - 1) / 2) * 90;
      p.vx = 0;
      p.vy = 0;
    });

    teamBPlayers.forEach((p, idx) => {
      p.x = this.pitch.x + this.pitch.w - 200 - (idx % 2) * 120;
      p.y = this.pitch.y + this.pitch.h / 2 + (idx - (teamBPlayers.length - 1) / 2) * 90;
      p.vx = 0;
      p.vy = 0;
    });
  }

  handlePlayerInput(playerId, input) {
    const p = this.players.find(pl => pl.id === playerId);
    if (!p) return;

    if (typeof input.up === 'boolean') p.moveUp = input.up;
    if (typeof input.down === 'boolean') p.moveDown = input.down;
    if (typeof input.left === 'boolean') p.moveLeft = input.left;
    if (typeof input.right === 'boolean') p.moveRight = input.right;

    if (input.kick || input.attack || input.item) {
      this.triggerKick(p);
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

  triggerKick(p) {
    if (p.kickCooldown > 0) return;
    p.isKicking = true;
    p.kickTimer = 0.18;
    p.kickCooldown = 0.35;

    // Comprobar si el balón está en rango de disparo
    const dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
    const kickRange = p.radius + this.ball.radius + 16;

    if (dist < kickRange) {
      // Disparo con potencia en la dirección del jugador hacia el balón
      const angle = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
      const kickPower = 580;

      this.ball.vx = Math.cos(angle) * kickPower;
      this.ball.vy = Math.sin(angle) * kickPower;
      this.screenShake = 6;
      this.addFloatingText('¡CHUTAZO!', '#facc15', 0.8, 1.25, this.ball.x, this.ball.y - 25);

      // Anillo de onda expansiva del disparo (Shockwave)
      this.shockwaves.push({
        x: this.ball.x,
        y: this.ball.y,
        radius: 10,
        maxRadius: 45,
        color: p.teamColor,
        life: 0.3,
        maxLife: 0.3
      });
      if (this.screenShake < 5) this.screenShake = 4.5;

      // Partículas de impacto
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: this.ball.x,
          y: this.ball.y,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          color: '#ffffff',
          size: 3,
          life: 0.2
        });
      }

      if (window.soundEngine) {
        window.soundEngine.playBocina();
      }
    }
  }

  update(dt) {
    if (this.gameState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.gameState = 'match';
      }
      return;
    }

    if (this.gameState === 'goal') {
      this.goalCelebrationTimer -= dt;
      this.updateParticles(dt);
      this.updateConfetti(dt);

      if (this.goalCelebrationTimer <= 0) {
        if (this.matchTime <= 0 || this.teamScores.teamA >= 3 || this.teamScores.teamB >= 3) {
          this.gameState = 'victory';
          this.resolveMatchWinner();
        } else {
          this.gameState = 'match';
          this.resetPositions();
        }
      }
      return;
    }

    if (this.gameState === 'victory') {
      this.updateConfetti(dt);
      return;
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 36;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Update Ball Trail
    this.ballTrail.push({
      x: this.ball.x,
      y: this.ball.y,
      speed: Math.hypot(this.ball.vx, this.ball.vy)
    });
    if (this.ballTrail.length > 12) this.ballTrail.shift();

    // Cronómetro de partido
    this.matchTime -= dt;
    if (this.matchTime <= 0) {
      this.matchTime = 0;
      this.gameState = 'victory';
      this.resolveMatchWinner();
      return;
    }

    // Actualizar IA de bots
    this.updateBots(dt);

    // Mover jugadores con aceleración e inercia
    this.players.forEach(p => {
      if (p.kickCooldown > 0) p.kickCooldown -= dt;
      if (p.kickTimer > 0) {
        p.kickTimer -= dt;
        if (p.kickTimer <= 0) p.isKicking = false;
      }

      let ax = 0;
      let ay = 0;
      if (p.moveRight) ax += 1;
      if (p.moveLeft) ax -= 1;
      if (p.moveDown) ay += 1;
      if (p.moveUp) ay -= 1;

      if (ax !== 0 && ay !== 0) {
        ax *= 0.707;
        ay *= 0.707;
      }

      p.vx += ax * p.accel * dt;
      p.vy += ay * p.accel * dt;

      // Fricción
      p.vx *= Math.pow(p.friction, dt * 60);
      p.vy *= Math.pow(p.friction, dt * 60);

      // Limitar velocidad máxima
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > p.maxSpeed) {
        p.vx = (p.vx / spd) * p.maxSpeed;
        p.vy = (p.vy / spd) * p.maxSpeed;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Colisión con límites del campo
      this.constrainPlayerToPitch(p);
    });

    // Colisiones jugador vs jugador
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        this.resolvePlayerCollision(this.players[i], this.players[j]);
      }
    }

    // Físicas del balón
    this.updateBall(dt);

    // Colisión jugador vs balón
    this.players.forEach(p => {
      this.resolvePlayerBallCollision(p);
    });

    // Comprobar gol
    this.checkGoalDetection();

    // Actualizar partículas
    this.updateParticles(dt);

    // Actualizar ondas de choque
    this.updateShockwaves(dt);
  }

  updateShockwaves(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * (dt * 12);
      sw.life -= dt;
      if (sw.life <= 0) this.shockwaves.splice(i, 1);
    }
  }

  updateBots(dt) {
    const teamAPlayers = this.players.filter(p => p.team === 'teamA');
    const teamBPlayers = this.players.filter(p => p.team === 'teamB');

    this.players.forEach(p => {
      if (!p.isBot) return;

      p.aiTimer -= dt;
      if (p.aiTimer > 0) return;
      p.aiTimer = 0.08 + Math.random() * 0.06;

      const isTeamA = p.team === 'teamA';
      const myTeam = isTeamA ? teamAPlayers : teamBPlayers;
      const roleIdx = myTeam.indexOf(p); // 0: Portero, 1: Extremo Sup, 2: Extremo Inf, 3+: Delantero

      const enemyGoalX = isTeamA ? this.pitch.x + this.pitch.w : this.pitch.x;
      const ownGoalX = isTeamA ? this.pitch.x : this.pitch.x + this.pitch.w;
      const midY = this.pitch.y + this.pitch.h / 2;

      let targetX = this.ball.x;
      let targetY = this.ball.y;

      // 1. Portero / Último defensor (se queda protegiendo los 3 palos)
      if (roleIdx === 0) {
        targetX = ownGoalX + (isTeamA ? 75 : -75);
        // Sigue el balón en vertical pero acotado a la boca de gol
        targetY = Math.max(midY - 80, Math.min(midY + 80, this.ball.y));
        // Si el balón entra al área, sale a despejar
        const distOwnGoal = Math.abs(this.ball.x - ownGoalX);
        if (distOwnGoal < 160) {
          targetX = this.ball.x;
          targetY = this.ball.y;
        }
      }
      // 2. Extremo Superior (ocupa la banda superior y presiona)
      else if (roleIdx === 1) {
        targetX = isTeamA ? Math.min(this.pitch.x + this.pitch.w * 0.75, this.ball.x - 30) : Math.max(this.pitch.x + this.pitch.w * 0.25, this.ball.x + 30);
        targetY = Math.max(this.pitch.y + 60, Math.min(midY - 40, this.ball.y));
        if (Math.hypot(this.ball.x - p.x, this.ball.y - p.y) < 140) {
          targetX = this.ball.x;
          targetY = this.ball.y;
        }
      }
      // 3. Extremo Inferior (ocupa la banda inferior y presiona)
      else if (roleIdx === 2) {
        targetX = isTeamA ? Math.min(this.pitch.x + this.pitch.w * 0.75, this.ball.x - 30) : Math.max(this.pitch.x + this.pitch.w * 0.25, this.ball.x + 30);
        targetY = Math.max(midY + 40, Math.min(this.pitch.y + this.pitch.h - 60, this.ball.y));
        if (Math.hypot(this.ball.x - p.x, this.ball.y - p.y) < 140) {
          targetX = this.ball.x;
          targetY = this.ball.y;
        }
      }
      // 4. Delantero / Cazador de balón (presiona de lleno y encara a portería)
      else {
        targetX = this.ball.x;
        targetY = this.ball.y;
      }

      // Desplazarse al objetivo táctico
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      p.moveLeft = dx < -14;
      p.moveRight = dx > 14;
      p.moveUp = dy < -14;
      p.moveDown = dy > 14;

      // Chutar si el balón está a tiro
      const distBall = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
      if (distBall < p.radius + this.ball.radius + 18) {
        const aimedTowardsGoal = isTeamA ? (this.ball.x > p.x - 10) : (this.ball.x < p.x + 10);
        if (aimedTowardsGoal || Math.random() < 0.65) {
          this.triggerKick(p);
        }
      }
    });
  }

  constrainPlayerToPitch(p) {
    const r = p.radius;
    const minX = this.pitch.x + r;
    const maxX = this.pitch.x + this.pitch.w - r;
    const minY = this.pitch.y + r;
    const maxY = this.pitch.y + this.pitch.h - r;

    if (p.x < minX) { p.x = minX; p.vx = 0; }
    if (p.x > maxX) { p.x = maxX; p.vx = 0; }
    if (p.y < minY) { p.y = minY; p.vy = 0; }
    if (p.y > maxY) { p.y = maxY; p.vy = 0; }
  }

  resolvePlayerCollision(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = p1.radius + p2.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) / 2;

      p1.x -= nx * overlap;
      p1.y -= ny * overlap;
      p2.x += nx * overlap;
      p2.y += ny * overlap;

      // Velocidad de rebote elástica
      const kx = p1.vx - p2.vx;
      const ky = p1.vy - p2.vy;
      const p = 2 * (nx * kx + ny * ky) / (p1.mass + p2.mass);

      p1.vx -= p * p2.mass * nx * 0.8;
      p1.vy -= p * p2.mass * ny * 0.8;
      p2.vx += p * p1.mass * nx * 0.8;
      p2.vy += p * p1.mass * ny * 0.8;
    }
  }

  resolvePlayerBallCollision(p) {
    const dx = this.ball.x - p.x;
    const dy = this.ball.y - p.y;
    const dist = Math.hypot(dx, dy);
    const minDist = p.radius + this.ball.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      this.ball.x += nx * overlap;
      this.ball.y += ny * overlap;

      // Impulso físico elástico
      const rvx = this.ball.vx - p.vx;
      const rvy = this.ball.vy - p.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const impulse = -(1 + this.ball.restitution) * velAlongNormal;
        this.ball.vx += nx * impulse * 1.25;
        this.ball.vy += ny * impulse * 1.25;
      }
    }
  }

  updateBall(dt) {
    this.ball.vx *= Math.pow(this.ball.friction, dt * 60);
    this.ball.vy *= Math.pow(this.ball.friction, dt * 60);

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Rebote en paredes superior e inferior del campo
    const r = this.ball.radius;
    if (this.ball.y < this.pitch.y + r) {
      this.ball.y = this.pitch.y + r;
      this.ball.vy = -this.ball.vy * this.ball.restitution;
    }
    if (this.ball.y > this.pitch.y + this.pitch.h - r) {
      this.ball.y = this.pitch.y + this.pitch.h - r;
      this.ball.vy = -this.ball.vy * this.ball.restitution;
    }

    // Paredes de banda izquierda y derecha (excepto por la boca de la portería)
    const goalTop = this.goals.red.y;
    const goalBottom = this.goals.red.y + this.goals.red.h;

    // Banda izquierda
    if (this.ball.x < this.pitch.x + r) {
      const inMouth = this.ball.y > goalTop && this.ball.y < goalBottom;
      if (!inMouth) {
        this.ball.x = this.pitch.x + r;
        this.ball.vx = -this.ball.vx * this.ball.restitution;
      } else {
        // Dentro de la portería izquierda: rebotar en el fondo de la red
        if (this.ball.x < this.goals.red.x + r) {
          this.ball.x = this.goals.red.x + r;
          this.ball.vx = -this.ball.vx * 0.5;
        }
      }
    }

    // Banda derecha
    if (this.ball.x > this.pitch.x + this.pitch.w - r) {
      const inMouth = this.ball.y > goalTop && this.ball.y < goalBottom;
      if (!inMouth) {
        this.ball.x = this.pitch.x + this.pitch.w - r;
        this.ball.vx = -this.ball.vx * this.ball.restitution;
      } else {
        // Fondo de la red derecha
        if (this.ball.x > this.goals.blue.x + this.goals.blue.w - r) {
          this.ball.x = this.goals.blue.x + this.goals.blue.w - r;
          this.ball.vx = -this.ball.vx * 0.5;
        }
      }
    }

    // Postes de las porterías
    const posts = [
      this.goals.red.topPost,
      this.goals.red.bottomPost,
      this.goals.blue.topPost,
      this.goals.blue.bottomPost
    ];

    posts.forEach(post => {
      const dx = this.ball.x - post.x;
      const dy = this.ball.y - post.y;
      const dist = Math.hypot(dx, dy);
      const postRadius = 6;
      if (dist < r + postRadius && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        this.ball.x = post.x + nx * (r + postRadius);
        this.ball.y = post.y + ny * (r + postRadius);
        this.ball.vx = nx * Math.hypot(this.ball.vx, this.ball.vy) * 0.9;
        this.ball.vy = ny * Math.hypot(this.ball.vx, this.ball.vy) * 0.9;
      }
    });
  }

  checkGoalDetection() {
    if (this.ball.inGoal || this.gameState !== 'match') return;

    // Gol en portería izquierda (Punto para equipo Azul)
    if (this.ball.x < this.pitch.x - 8 &&
        this.ball.y > this.goals.red.y && this.ball.y < this.goals.red.y + this.goals.red.h) {
      this.triggerGoal('teamA', '¡GOL DEL EQUIPO AZUL!');
    }

    // Gol en portería derecha (Punto para equipo Rojo)
    if (this.ball.x > this.pitch.x + this.pitch.w + 8 &&
        this.ball.y > this.goals.blue.y && this.ball.y < this.goals.blue.y + this.goals.blue.h) {
      this.triggerGoal('teamB', '¡GOL DEL EQUIPO ROJO!');
    }
  }

  triggerGoal(scoringTeam, message) {
    this.ball.inGoal = true;
    this.gameState = 'goal';
    this.goalCelebrationTimer = 2.8;
    this.screenShake = 16;

    if (scoringTeam === 'teamA') {
      this.teamScores.teamA++;
    } else {
      this.teamScores.teamB++;
    }

    this.lastScorer = message;
    this.addFloatingText('¡¡¡GOOOOL!!!', scoringTeam === 'teamA' ? '#38bdf8' : '#ef4444', 2.2, 2.5, this.width / 2, this.height / 2);

    // Confeti
    for (let i = 0; i < 90; i++) {
      this.confetti.push({
        x: scoringTeam === 'teamA' ? this.pitch.x + this.pitch.w : this.pitch.x,
        y: this.height / 2,
        vx: (Math.random() - 0.5) * 450,
        vy: (Math.random() - 0.5) * 450,
        color: ['#facc15', '#38bdf8', '#f43f5e', '#22c55e', '#a855f7'][Math.floor(Math.random() * 5)],
        size: 5 + Math.random() * 6,
        life: 2.5
      });
    }

    if (window.soundEngine) {
      window.soundEngine.playLevelStartFanfare();
    }
  }

  resolveMatchWinner() {
    this.winningTeam = this.teamScores.teamA >= this.teamScores.teamB ? 'teamA' : 'teamB';
    if (window.soundEngine) {
      window.soundEngine.playSocialCreditVictory();
    }

    setTimeout(() => {
      this.onComplete({
        gameType: 'haxball',
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

  updateConfetti(dt) {
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0) this.confetti.splice(i, 1);
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

    // 1. Marco exterior
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Césped del campo de HaxBall (verde profesional con borde blanco)
    this.ctx.fillStyle = '#166534';
    this.ctx.fillRect(this.pitch.x, this.pitch.y, this.pitch.w, this.pitch.h);

    // Franjas de corte de césped
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.fillRect(this.pitch.x + i * 108, this.pitch.y, 108, this.pitch.h);
      }
    }

    // Líneas blancas reglamentarias de HaxBall
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3.5;

    // Borde exterior
    this.ctx.strokeRect(this.pitch.x, this.pitch.y, this.pitch.w, this.pitch.h);

    // Línea de medio campo
    const midX = this.pitch.x + this.pitch.w / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(midX, this.pitch.y);
    this.ctx.lineTo(midX, this.pitch.y + this.pitch.h);
    this.ctx.stroke();

    // Círculo central y punto central
    this.ctx.beginPath();
    this.ctx.arc(midX, this.pitch.y + this.pitch.h / 2, 75, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(midX, this.pitch.y + this.pitch.h / 2, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();

    // Áreas de penalti
    const areaW = 120;
    const areaH = 240;
    const areaY = this.pitch.y + (this.pitch.h - areaH) / 2;
    this.ctx.strokeRect(this.pitch.x, areaY, areaW, areaH);
    this.ctx.strokeRect(this.pitch.x + this.pitch.w - areaW, areaY, areaW, areaH);

    // 3. Porterías (redes y postes de color)
    this.renderGoals();

    // 4. Balón de HaxBall
    this.renderBall();

    // 5. Discos de los jugadores
    this.players.forEach(p => {
      this.renderPlayerDisk(p);
    });

    // 6. Partículas y confeti
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      this.ctx.restore();
    });

    this.confetti.forEach(c => {
      this.ctx.save();
      this.ctx.fillStyle = c.color;
      this.ctx.fillRect(c.x, c.y, c.size, c.size * 0.7);
      this.ctx.restore();
    });

    // 7. Ondas expansivas de chute (Shockwaves)
    this.shockwaves.forEach(sw => {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = sw.color;
      this.ctx.globalAlpha = Math.max(0, sw.life / sw.maxLife);
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.restore();
    });

    // 8. Textos Arcade Flotantes
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      const alpha = Math.max(0, ft.life / ft.duration);
      this.ctx.globalAlpha = alpha;
      this.ctx.font = `900 ${Math.round(26 * ft.scale)}px "Arial Black", Arial, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 16;
      this.ctx.lineWidth = 5;
      this.ctx.strokeStyle = '#020617';
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillStyle = ft.color;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 9. HUD y Marcador
    this.renderScoreboard();

    if (this.gameState === 'countdown') {
      this.renderCountdown();
    } else if (this.gameState === 'goal') {
      this.renderGoalSplash();
    } else if (this.gameState === 'victory') {
      this.renderVictory();
    }

    this.ctx.restore(); // Finaliza save de Screen Shake
  }

  renderGoals() {
    this.ctx.save();
    // Portería Roja (Izquierda)
    const gr = this.goals.red;
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    this.ctx.fillRect(gr.x, gr.y, gr.w, gr.h);
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(gr.x, gr.y, gr.w, gr.h);

    // Portería Azul (Derecha)
    const gb = this.goals.blue;
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    this.ctx.fillRect(gb.x, gb.y, gb.w, gb.h);
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(gb.x, gb.y, gb.w, gb.h);

    // Postes circulares metálicos
    [gr.topPost, gr.bottomPost, gb.topPost, gb.bottomPost].forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
    this.ctx.restore();
  }

  renderBall() {
    // Dynamic Fading Ball Speed Trail
    if (this.ballTrail && this.ballTrail.length > 1) {
      for (let i = 0; i < this.ballTrail.length; i++) {
        const pt = this.ballTrail[i];
        const progress = (i + 1) / this.ballTrail.length;
        if (pt.speed > 130) {
          this.ctx.save();
          this.ctx.globalAlpha = progress * 0.55;
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#0ea5e9';
          this.ctx.shadowBlur = 8;
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, this.ball.radius * progress * 0.85, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fill();
    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // Núcleo blanco
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, 4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fill();
    this.ctx.restore();
  }

  renderPlayerDisk(p) {
    this.ctx.save();

    // Sombra del disco
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y + 2, p.radius + 1, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fill();

    // Anillo exterior de chute si está pulsando
    if (p.isKicking) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    // Cuerpo del disco
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = p.teamColor;
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // Brillo superior acrílico estilo disco HaxBall
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y - p.radius * 0.35, p.radius * 0.65, Math.PI * 1.05, Math.PI * 1.95);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    this.ctx.lineWidth = 2.2;
    this.ctx.stroke();

    // Avatar SVG en miniatura
    const img = this.avatarImages[p.id];
    if (img && img.complete) {
      const size = p.radius * 2;
      this.ctx.drawImage(img, p.x - size / 2, p.y - size / 2, size, size);
    }

    // Nombre sobre el disco
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(p.name, p.x, p.y - p.radius - 6);
    this.ctx.restore();
  }

  renderScoreboard() {
    this.ctx.save();
    const boxW = 380;
    const boxH = 46;
    const boxX = this.width / 2 - boxW / 2;
    const boxY = 12;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Azul (Izquierda)
    this.ctx.font = '900 16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillText('AZUL', boxX + 18, boxY + 30);

    // Rojo (Derecha)
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillText('ROJO', boxX + boxW - 18, boxY + 30);

    // Marcador
    this.ctx.font = '900 24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText(`${this.teamScores.teamA}  -  ${this.teamScores.teamB}`, this.width / 2, boxY + 31);

    // Tiempo
    const secLeft = Math.ceil(this.matchTime);
    this.ctx.font = '800 12px sans-serif';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText(`⏱️ ${secLeft}s`, this.width / 2, boxY + 42);
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

    const text = countNum > 0 ? `${countNum}` : '¡SAQUE DE CENTRO!';

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
    this.ctx.fillText('¡Usa el pad de movimiento y el botón [⚽ CHUTAR] en tu móvil!', this.width / 2, this.height / 2 + 55);
    this.ctx.restore();
  }

  renderGoalSplash() {
    this.ctx.save();
    this.ctx.font = '900 72px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#facc15';
    this.ctx.shadowColor = '#d97706';
    this.ctx.shadowBlur = 30;
    this.ctx.fillText('⚽ ¡¡GOOOOOOOOOOL!! ⚽', this.width / 2, this.height / 2 - 30);

    this.ctx.font = '800 26px sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(this.lastScorer || '', this.width / 2, this.height / 2 + 40);
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

window.HaxballEngine = HaxballEngine;
