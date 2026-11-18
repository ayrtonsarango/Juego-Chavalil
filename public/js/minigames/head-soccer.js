/**
 * SPORTS HEADS: FOOTBALL / HEAD SOCCER (ULTRA RÉPLICA CABEZONES CHAVALIL)
 * 
 * Motor de fútbol 2D lateral estilo Sports Heads / Head Ball:
 * - Cabezones flotantes con avatares SVG de la cuadrilla, bota oscilante de remate,
 *   balón físico con efecto, gravedad y rebotes precisos en travesaños y postes.
 * - Redes de portería animadas con deformación por impacto, cañones de confeti y sirenas de estadio.
 * - 6 Power-ups flotantes: Velocidad (⚡), Super Salto (🚀), Congelación (❄️), Cabeza Gigante (🗿),
 *   Balón de Fuego (🔥) y Balón Mini (⚽).
 * - Sistema de Rondas / Heats Multijugador:
 *   - Si hay > 2 jugadores, organiza el torneo en Duelos por Rondas (Heat 1, Heat 2, Heat 3...)
 *     o partidos 2v2 bien posicionados (Delantero + Portero sin solaparse), acumulando los goles
 *     en el marcador global del Equipo Azul vs Equipo Rojo para que todos jueguen su turno.
 * - Integración con mandos móviles y teclado PC.
 */

class HeadSoccerEngine {
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

    // Geometría del estadio
    this.groundY = 590;
    this.pitch = {
      left: 70,
      right: 1210,
      top: 50,
      bottom: this.groundY,
      goalWidth: 120,
      goalHeight: 180,
      crossbarH: 14
    };

    // Porterías izquierda y derecha
    this.goals = {
      left: { x: this.pitch.left, y: this.groundY - this.pitch.goalHeight, w: this.pitch.goalWidth, h: this.pitch.goalHeight },
      right: { x: this.pitch.right - this.pitch.goalWidth, y: this.groundY - this.pitch.goalHeight, w: this.pitch.goalWidth, h: this.pitch.goalHeight }
    };

    // Balón de fútbol
    this.ball = {
      x: this.width / 2,
      y: 300,
      vx: 0,
      vy: 0,
      radius: 18,
      rotation: 0,
      angularVel: 0,
      restitution: 0.78,
      gravity: 720,
      drag: 0.992,
      mass: 1.0,
      inGoal: false,
      isFireball: false
    };

    this.allPlayers = [];
    this.teams = { teamA: [], teamB: [] };
    this.heats = [];
    this.currentHeatIndex = 0;
    this.activePlayers = []; // Players currently on the pitch

    this.powerups = [];
    this.particles = [];
    this.confetti = [];
    this.floatingTexts = [];
    this.ballTrail = [];
    this.avatarImages = {};

    this.heatTime = 40; // 40 segundos por ronda
    this.gameState = 'countdown'; // 'countdown' | 'match' | 'goal' | 'heat_over' | 'victory'
    this.countdownTimer = 3.0;
    this.goalCelebrationTimer = 0;
    this.heatOverTimer = 0;
    this.lastScorer = null;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.screenShake = 0;
    this.netJiggle = 0;
  }

  async prepareAvatars(playerList) {
    const promises = playerList.map(p => {
      return new Promise((resolve) => {
        if (!p.avatar || typeof renderAvatarSVG === 'undefined') {
          resolve();
          return;
        }
        const svg = renderAvatarSVG(p.avatar, 90);
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
    this.allPlayers = playerList;
    this.teams = teams;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;
    this.currentHeatIndex = 0;

    const teamAIds = (teams.teamA || []).map(p => p.id);
    const teamBIds = (teams.teamB || []).map(p => p.id);
    let playersA = playerList.filter(p => teamAIds.includes(p.id));
    let playersB = playerList.filter(p => teamBIds.includes(p.id));

    // Fallback if teams were not populated
    if (playersA.length === 0 && playersB.length === 0) {
      playersA = playerList.filter((_, idx) => idx % 2 === 0);
      playersB = playerList.filter((_, idx) => idx % 2 !== 0);
    }

    // Formar Rondas (Heats): 1v1 o 2v2 por ronda
    this.heats = [];
    if (playerList.length <= 2) {
      // Strict 1v1 heat: ensure 1 player on team A and 1 player on team B
      const p1 = playersA[0] || playerList[0];
      const p2 = playersB[0] || playerList[1] || playerList[0];
      this.heats.push([p1, p2]);
    } else {
      // Duelos 1v1 por rondas acumulando marcador global
      const maxHeats = Math.max(playersA.length, playersB.length);
      for (let h = 0; h < maxHeats; h++) {
        const pair = [];
        if (playersA[h]) pair.push(playersA[h]);
        if (playersB[h]) pair.push(playersB[h]);
        if (pair.length > 0) this.heats.push(pair);
      }
    }

    this.prepareAvatars(playerList);
    this.startHeat(0);

    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame(this.loop);
  }

  startHeat(heatIndex) {
    this.currentHeatIndex = heatIndex;
    this.gameState = 'countdown';
    this.countdownTimer = 2.8;
    this.heatTime = 38; // 38 segundos de fútbol trepidante
    this.powerups = [];
    this.particles = [];
    this.confetti = [];
    this.floatingTexts = [];
    this.ballTrail = [];
    this.screenShake = 0;

    const heatPlayers = this.heats[heatIndex] || this.allPlayers;
    const teamAIds = (this.teams.teamA || []).map(p => p.id);
    const teamBIds = (this.teams.teamB || []).map(p => p.id);

    this.activePlayers = heatPlayers.map((p, idx) => {
      let isTeamA;
      if (heatPlayers.length === 2) {
        // En 1v1 el primer jugador es AZUL (izquierda) y el segundo es ROJO (derecha)
        isTeamA = (idx === 0);
      } else if (teamAIds.length > 0 || teamBIds.length > 0) {
        if (teamAIds.includes(p.id)) isTeamA = true;
        else if (teamBIds.includes(p.id)) isTeamA = false;
        else isTeamA = (idx % 2 === 0);
      } else {
        isTeamA = (idx % 2 === 0);
      }

      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        team: isTeamA ? 'teamA' : 'teamB',
        teamColor: isTeamA ? '#3b82f6' : '#ef4444',
        teamName: isTeamA ? 'AZUL' : 'ROJO',
        facingRight: isTeamA,

        // Físicas
        headRadius: 38,
        baseRadius: 38,
        x: isTeamA ? 340 : 940,
        y: this.groundY - 38,
        vx: 0,
        vy: 0,
        speed: 290,
        jumpPower: 600,
        gravity: 1250,
        isGrounded: true,

        // Bota
        bootAngle: 0,
        isKicking: false,
        kickTimer: 0,

        // Inputs
        moveLeft: false,
        moveRight: false,
        jump: false,
        kick: false,

        // Power-ups activos
        speedMult: 1.0,
        jumpMult: 1.0,
        frozen: false,
        buffTimer: 0,
        isGiant: false,

        // IA
        aiDecisionTimer: Math.random() * 0.25
      };
    });

    this.resetBall();
    if (window.soundEngine) soundEngine.playPreparationMatchFound();

    if (window.socket) {
      window.socket.emit('minigame_heat_update', {
        heatIndex: heatIndex + 1,
        totalHeats: this.heats.length,
        activePlayerIds: this.activePlayers.map(p => p.id),
        minigameName: 'Head Football'
      });
    }
  }

  resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = 260;
    this.ball.vx = (Math.random() - 0.5) * 60;
    this.ball.vy = -180;
    this.ball.angularVel = (Math.random() - 0.5) * 10;
    this.ball.inGoal = false;
    this.ball.isFireball = false;
  }

  handlePlayerInput(playerId, input) {
    const p = this.activePlayers.find(pl => pl.id === playerId);
    if (!p) return;

    if (typeof input.left === 'boolean') {
      p.moveLeft = input.left;
      if (input.left) p.facingRight = false;
    }
    if (typeof input.right === 'boolean') {
      p.moveRight = input.right;
      if (input.right) p.facingRight = true;
    }

    if (input.up || input.jump) {
      if (p.isGrounded && !p.frozen) {
        p.vy = -p.jumpPower * p.jumpMult;
        p.isGrounded = false;
        if (window.soundEngine) window.soundEngine.playStep();
      }
    }

    if (input.kick || input.attack || input.item) {
      this.triggerKick(p);
    }
  }

  triggerKick(p) {
    if (p.frozen || p.isKicking) return;
    p.isKicking = true;
    p.kickTimer = 0.22;
    if (window.soundEngine) window.soundEngine.playStep();
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
    if (!this.running) return;

    // Countdown
    if (this.gameState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.gameState = 'match';
        if (window.soundEngine) soundEngine.playCelebrationJump();
      }
      return;
    }

    // Goal celebration
    if (this.gameState === 'goal') {
      this.goalCelebrationTimer -= dt;
      if (this.goalCelebrationTimer <= 0) {
        this.gameState = 'match';
        this.resetRoundPositions();
      }
    }

    // Heat Over transition
    if (this.gameState === 'heat_over') {
      this.heatOverTimer -= dt;
      if (this.heatOverTimer <= 0) {
        if (this.currentHeatIndex < this.heats.length - 1) {
          this.startHeat(this.currentHeatIndex + 1);
        } else {
          this.resolveMatchWinner();
        }
      }
      return;
    }

    // Match Time countdown
    if (this.gameState === 'match') {
      this.heatTime -= dt;
      if (this.heatTime <= 0) {
        this.heatTime = 0;
        this.gameState = 'heat_over';
        this.heatOverTimer = 3.0;
        if (window.soundEngine) soundEngine.playCelebrationJump();
        return;
      }

      // Spawn periodic powerups
      if (Math.random() < 0.007 && this.powerups.length < 2) {
        this.spawnPowerup();
      }
    }

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
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
      isFireball: this.ball.isFireball,
      speed: Math.hypot(this.ball.vx, this.ball.vy)
    });
    if (this.ballTrail.length > 12) this.ballTrail.shift();

    // Net jiggle decay
    if (this.netJiggle > 0) {
      this.netJiggle = Math.max(0, this.netJiggle - dt * 0.8);
    }

    this.updateBall(dt);
    this.updatePlayers(dt);
    this.updatePowerups(dt);
    this.updateParticles(dt);
    this.updateConfetti(dt);
    this.checkGoalDetection();
  }

  updatePlayers(dt) {
    this.activePlayers.forEach(p => {
      // IA bot
      if (p.isBot && this.gameState === 'match') {
        this.updateBotAI(p, dt);
      }

      // Buff timers
      if (p.buffTimer > 0) {
        p.buffTimer -= dt;
        if (p.buffTimer <= 0) {
          p.speedMult = 1.0;
          p.jumpMult = 1.0;
          p.frozen = false;
          p.headRadius = p.baseRadius;
          p.isGiant = false;
        }
      }

      // Movimiento horizontal
      if (!p.frozen) {
        let dirX = 0;
        if (p.moveLeft) {
          dirX -= 1;
          p.facingRight = false;
        }
        if (p.moveRight) {
          dirX += 1;
          p.facingRight = true;
        }

        p.vx = dirX * p.speed * p.speedMult;
      } else {
        p.vx = 0;
      }

      // Gravedad
      p.vy += p.gravity * dt;

      // Integrar posición
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Colisión con suelo
      if (p.y >= this.groundY - p.headRadius) {
        p.y = this.groundY - p.headRadius;
        p.vy = 0;
        p.isGrounded = true;

        // Briznas de césped al correr
        if (Math.abs(p.vx) > 60 && Math.random() < 0.35) {
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 16,
            y: this.groundY - 2,
            vx: -p.vx * 0.2 + (Math.random() - 0.5) * 40,
            vy: -40 - Math.random() * 50,
            color: Math.random() < 0.6 ? '#16a34a' : '#22c55e',
            size: 2.5 + Math.random() * 2,
            life: 0.4
          });
        }
      }

      // Límites de la cancha (no salir de las porterías)
      const minX = this.pitch.left + this.pitch.goalWidth + p.headRadius - 10;
      const maxX = this.pitch.right - this.pitch.goalWidth - p.headRadius + 10;
      if (p.x < minX) p.x = minX;
      if (p.x > maxX) p.x = maxX;

      // Animación de la bota
      if (p.isKicking) {
        p.kickTimer -= dt;
        p.bootAngle = Math.sin((0.22 - p.kickTimer) / 0.22 * Math.PI) * 1.35;
        this.checkBootBallCollision(p);

        if (p.kickTimer <= 0) {
          p.isKicking = false;
          p.bootAngle = 0;
        }
      }

      // Colisión cabeza con balón
      this.checkHeadBallCollision(p);
    });
  }

  updateBotAI(p, dt) {
    p.aiDecisionTimer -= dt;
    if (p.aiDecisionTimer > 0) return;
    p.aiDecisionTimer = 0.08 + Math.random() * 0.08;

    const isTeamA = p.team === 'teamA';
    const targetGoalX = isTeamA ? this.pitch.right - 100 : this.pitch.left + 100;
    const ownGoalX = isTeamA ? this.pitch.left + 140 : this.pitch.right - 140;

    // Calcular distancia al balón
    const distToBall = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);

    // Defender si el balón está detrás
    const isBallBehind = isTeamA ? (this.ball.x < p.x - 20) : (this.ball.x > p.x + 20);

    if (isBallBehind) {
      // Retroceder hacia la portería propia
      p.moveLeft = isTeamA;
      p.moveRight = !isTeamA;
    } else if (distToBall < 180) {
      // Avanzar y presionar
      p.moveLeft = !isTeamA;
      p.moveRight = isTeamA;

      // Saltar para rematar de cabeza si el balón está alto
      if (this.ball.y < p.y - 20 && this.ball.y > p.y - 140 && Math.abs(this.ball.x - p.x) < 80) {
        if (p.isGrounded && Math.random() < 0.65) {
          p.vy = -p.jumpPower * p.jumpMult;
          p.isGrounded = false;
        }
      }

      // Chutar si el balón está a tiro de bota
      if (distToBall < 75 && Math.random() < 0.55) {
        this.triggerKick(p);
      }
    } else {
      // Mantener posición táctica media
      const midZoneX = isTeamA ? 480 : 800;
      p.moveLeft = p.x > midZoneX + 20;
      p.moveRight = p.x < midZoneX - 20;
    }
  }

  checkHeadBallCollision(p) {
    const dx = this.ball.x - p.x;
    const dy = this.ball.y - p.y;
    const dist = Math.hypot(dx, dy);
    const minDist = p.headRadius + this.ball.radius;

    if (dist < minDist) {
      // Vector de colisión normal
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);

      // Separar
      this.ball.x = p.x + nx * minDist;
      this.ball.y = p.y + ny * minDist;

      // Calcular rebote con impulso del jugador
      const relativeVelX = this.ball.vx - p.vx;
      const relativeVelY = this.ball.vy - p.vy;
      const velAlongNormal = relativeVelX * nx + relativeVelY * ny;

      if (velAlongNormal < 0) {
        const impulse = -(1 + this.ball.restitution) * velAlongNormal;
        this.ball.vx += nx * impulse * 1.15;
        this.ball.vy += ny * impulse * 1.15;

        // Impulso adicional si el jugador va saltando
        if (!p.isGrounded && p.vy < 0) {
          this.ball.vy -= 180;
        }

        this.ball.angularVel = (p.facingRight ? 1 : -1) * 12;

        if (window.soundEngine) window.soundEngine.playStep();
      }
    }
  }

  checkBootBallCollision(p) {
    if (!p.isKicking) return;

    const bootOffsetDist = 48;
    const bootAngle = p.facingRight ? (0.2 + p.bootAngle) : (Math.PI - 0.2 + p.bootAngle);
    const bootX = p.x + Math.cos(bootAngle) * bootOffsetDist;
    const bootY = p.y + 20 + Math.sin(bootAngle) * 20;

    const dx = this.ball.x - bootX;
    const dy = this.ball.y - bootY;
    const dist = Math.hypot(dx, dy);

    if (dist < 32 + this.ball.radius) {
      // Super chute hacia portería rival
      const kickSpeed = p.isGiant ? 850 : 720;
      const shootAngle = p.facingRight ? -0.42 : -Math.PI + 0.42;

      this.ball.vx = Math.cos(shootAngle) * kickSpeed;
      this.ball.vy = Math.sin(shootAngle) * kickSpeed;
      this.ball.angularVel = (p.facingRight ? 1 : -1) * 28;
      this.screenShake = 12;
      this.addFloatingText('¡CHUTAZO!', '#facc15', 0.9, 1.35, this.ball.x, this.ball.y - 25);

      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: bootX,
          y: bootY,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          color: '#ffffff',
          size: 3.5,
          life: 0.25
        });
      }

      if (window.soundEngine) window.soundEngine.playBocina();
    }
  }

  updateBall(dt) {
    this.ball.vy += this.ball.gravity * dt;
    this.ball.vx *= Math.pow(this.ball.drag, dt * 60);
    this.ball.vy *= Math.pow(this.ball.drag, dt * 60);

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    this.ball.rotation += this.ball.angularVel * dt;
    this.ball.angularVel *= 0.98;

    // Colisión con suelo
    if (this.ball.y >= this.groundY - this.ball.radius) {
      this.ball.y = this.groundY - this.ball.radius;
      this.ball.vy = -this.ball.vy * this.ball.restitution;
      this.ball.vx *= 0.96;
      this.ball.angularVel = this.ball.vx * 0.05;
    }

    // Colisión con techo
    if (this.ball.y <= this.pitch.top + this.ball.radius) {
      this.ball.y = this.pitch.top + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy) * this.ball.restitution;
    }

    // Travesaños de portería
    const goalLeft = this.goals.left;
    const goalRight = this.goals.right;

    // Travesaño izquierdo
    if (this.ball.x < goalLeft.x + goalLeft.w + this.ball.radius &&
        this.ball.y >= goalLeft.y - 12 && this.ball.y <= goalLeft.y + 16) {
      this.ball.vy = -Math.abs(this.ball.vy) * 0.85;
      this.ball.y = goalLeft.y - this.ball.radius;
      this.screenShake = 6;
    }

    // Travesaño derecho
    if (this.ball.x > goalRight.x - this.ball.radius &&
        this.ball.y >= goalRight.y - 12 && this.ball.y <= goalRight.y + 16) {
      this.ball.vy = -Math.abs(this.ball.vy) * 0.85;
      this.ball.y = goalRight.y - this.ball.radius;
      this.screenShake = 6;
    }

    // Fondos de cancha
    if (this.ball.x <= 20) {
      this.ball.x = 20;
      this.ball.vx = Math.abs(this.ball.vx) * this.ball.restitution;
    }
    if (this.ball.x >= this.width - 20) {
      this.ball.x = this.width - 20;
      this.ball.vx = -Math.abs(this.ball.vx) * this.ball.restitution;
    }
  }

  checkGoalDetection() {
    if (this.ball.inGoal || this.gameState !== 'match') return;

    // Gol en portería izquierda (Punto para equipo Rojo)
    if (this.ball.x <= this.goals.left.x + this.goals.left.w - 12 &&
        this.ball.y > this.goals.left.y && this.ball.y < this.groundY) {
      this.triggerGoal('teamB', '¡GOL DEL EQUIPO ROJO!');
    }

    // Gol en portería derecha (Punto para equipo Azul)
    if (this.ball.x >= this.goals.right.x + 12 &&
        this.ball.y > this.goals.right.y && this.ball.y < this.groundY) {
      this.triggerGoal('teamA', '¡GOL DEL EQUIPO AZUL!');
    }
  }

  triggerGoal(scoringTeam, message) {
    this.ball.inGoal = true;
    this.gameState = 'goal';
    this.goalCelebrationTimer = 2.6;
    this.screenShake = 18;
    this.netJiggle = 1.0;

    if (scoringTeam === 'teamA') {
      this.teamScores.teamA++;
    } else {
      this.teamScores.teamB++;
    }

    this.lastScorer = message;
    this.addFloatingText('¡¡¡GOOOOL!!!', scoringTeam === 'teamA' ? '#60a5fa' : '#f87171', 2.2, 2.5, this.width / 2, this.groundY - 140);

    // Explosión masiva de confeti de estadio
    for (let i = 0; i < 90; i++) {
      this.confetti.push({
        x: scoringTeam === 'teamA' ? this.goals.right.x : this.goals.left.x + this.goals.left.w,
        y: this.groundY - 100,
        vx: (Math.random() - 0.5) * 450,
        vy: -200 - Math.random() * 380,
        color: ['#facc15', '#38bdf8', '#f43f5e', '#22c55e', '#a855f7'][Math.floor(Math.random() * 5)],
        size: 5 + Math.random() * 6,
        life: 2.5
      });
    }

    if (window.soundEngine) soundEngine.playLevelStartFanfare();
  }

  resetRoundPositions() {
    this.resetBall();
    this.activePlayers.forEach((p, idx) => {
      const isTeamA = p.team === 'teamA';
      p.x = isTeamA ? 340 : 940;
      p.y = this.groundY - p.headRadius;
      p.vx = 0;
      p.vy = 0;
      p.isGrounded = true;
      p.isKicking = false;
      p.bootAngle = 0;
    });
  }

  spawnPowerup() {
    const types = ['speed', 'super_jump', 'freeze', 'giant', 'fireball'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: 380 + Math.random() * 520,
      y: 280 + Math.random() * 160,
      type,
      radius: 18
    });
  }

  updatePowerups(dt) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      // Check collision with ball or head
      const hitBall = Math.hypot(this.ball.x - pw.x, this.ball.y - pw.y) < this.ball.radius + pw.radius;

      let collector = null;
      if (hitBall) {
        // Collector is last player who kicked the ball or nearest player
        collector = this.activePlayers[0];
      } else {
        collector = this.activePlayers.find(p => Math.hypot(p.x - pw.x, p.y - pw.y) < p.headRadius + pw.radius);
      }

      if (collector) {
        if (pw.type === 'speed') {
          collector.speedMult = 1.45;
          collector.buffTimer = 8;
        } else if (pw.type === 'super_jump') {
          collector.jumpMult = 1.35;
          collector.buffTimer = 8;
        } else if (pw.type === 'giant') {
          collector.headRadius = 56;
          collector.isGiant = true;
          collector.buffTimer = 8;
        } else if (pw.type === 'freeze') {
          // Freeze opponents
          this.activePlayers.filter(p => p.team !== collector.team).forEach(op => {
            op.frozen = true;
            op.buffTimer = 3.2;
          });
        } else if (pw.type === 'fireball') {
          this.ball.isFireball = true;
          this.ball.vx *= 1.4;
        }

        this.powerups.splice(i, 1);
        const names = { speed: '¡SUPER VELOCIDAD!', super_jump: '¡SUPER SALTO!', giant: '¡CABEZA GIGANTE!', freeze: '¡CONGELACIÓN!', fireball: '¡BALÓN DE FUEGO!' };
        this.addFloatingText(names[pw.type] || '¡POWER-UP!', '#38bdf8', 1.0, 1.25, pw.x, pw.y - 25);
        if (window.soundEngine) soundEngine.playMarioCoin();
      }
    }
  }

  resolveMatchWinner() {
    this.gameState = 'victory';
    this.winningTeam = this.teamScores.teamA >= this.teamScores.teamB ? 'teamA' : 'teamB';
    if (window.soundEngine) soundEngine.playSocialCreditVictory();

    setTimeout(() => {
      this.onComplete({
        gameType: 'headsoccer',
        winningTeam: this.winningTeam,
        scores: this.teamScores,
        players: this.allPlayers.map(p => ({
          id: p.id,
          score: p.team === this.winningTeam ? 100 : 25
        }))
      });
    }, 4500);
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
      c.vy += 450 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0 || c.y > this.groundY + 20) this.confetti.splice(i, 1);
    }
  }

  // ================= RENDERING =================

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();

    if (this.screenShake > 0.4) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Fondo Estadio Premier League (Cielo atardecer + Gradas con público)
    this.renderStadiumBackground(ctx);

    // 2. Campo de Césped con franjas
    this.renderPitch(ctx);

    // 3. Porterías con redes dinámicas
    this.renderGoals(ctx);

    // 4. Power-ups flotantes
    this.renderPowerups(ctx);

    // 5. Partículas & Confeti
    this.renderParticles(ctx);

    // 6. Jugadores Cabezones
    this.renderPlayers(ctx);

    // 7. Balón de fútbol físico
    this.renderBall(ctx);

    // 8. Marcador Superior & Telemetría de Rondas
    this.renderScoreboard(ctx);

    // 9. Textos Arcade Flotantes
    this.floatingTexts.forEach(ft => {
      ctx.save();
      const alpha = Math.max(0, ft.life / ft.duration);
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(26 * ft.scale)}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#020617';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 10. Overlays
    if (this.gameState === 'countdown') {
      this.renderCountdownOverlay(ctx);
    } else if (this.gameState === 'goal') {
      this.renderGoalOverlay(ctx);
    } else if (this.gameState === 'heat_over') {
      this.renderHeatOverOverlay(ctx);
    } else if (this.gameState === 'victory') {
      this.renderVictoryOverlay(ctx);
    }

    ctx.restore();
  }

  renderStadiumBackground(ctx) {
    // Cielo de estadio
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#0c1b33');
    sky.addColorStop(0.5, '#1e3a8a');
    sky.addColorStop(1, '#3b82f6');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, 420);

    // Gradas con multitud
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 260, this.width, 160);

    // Focos de estadio volumétricos con balanceo suave
    const t = performance.now() * 0.001;
    const swayL = Math.sin(t) * 90;
    const swayR = Math.cos(t * 0.9) * 90;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(0 + swayL, this.groundY);
    ctx.lineTo(380 + swayL, this.groundY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.width - 100, 0);
    ctx.lineTo(this.width - 380 + swayR, this.groundY);
    ctx.lineTo(this.width + swayR, this.groundY);
    ctx.closePath();
    ctx.fill();
  }

  renderPitch(ctx) {
    const gy = this.groundY;

    // Césped con franjas alternadas
    const stripeW = 75;
    for (let x = 0; x < this.width; x += stripeW) {
      ctx.fillStyle = Math.floor(x / stripeW) % 2 === 0 ? '#16a34a' : '#15803d';
      ctx.fillRect(x, gy, stripeW, this.height - gy);
    }

    // Línea de cal blanca del suelo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, gy, this.width, 6);

    // Círculo central y punto
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.width / 2, gy, 80, Math.PI, 0);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.width / 2, gy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  renderGoals(ctx) {
    const gl = this.goals.left;
    const gr = this.goals.right;

    // Redes con deformación jiggle
    const jig = Math.sin(performance.now() * 0.02) * this.netJiggle * 8;

    // Red izquierda
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = gl.y; y <= this.groundY; y += 16) {
      ctx.moveTo(gl.x, y);
      ctx.lineTo(gl.x + gl.w + jig, y);
    }
    for (let x = gl.x; x <= gl.x + gl.w; x += 16) {
      ctx.moveTo(x + jig * 0.5, gl.y);
      ctx.lineTo(x, this.groundY);
    }
    ctx.stroke();

    // Red derecha
    ctx.beginPath();
    for (let y = gr.y; y <= this.groundY; y += 16) {
      ctx.moveTo(gr.x - jig, y);
      ctx.lineTo(gr.x + gr.w, y);
    }
    for (let x = gr.x; x <= gr.x + gr.w; x += 16) {
      ctx.moveTo(x - jig * 0.5, gr.y);
      ctx.lineTo(x, this.groundY);
    }
    ctx.stroke();

    // Postes blancos metálicos
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Poste izquierdo
    ctx.strokeRect(gl.x, gl.y, gl.w, gl.h);

    // Poste derecho
    ctx.strokeRect(gr.x, gr.y, gr.w, gr.h);
  }

  renderPowerups(ctx) {
    this.powerups.forEach(pw => {
      ctx.save();
      ctx.translate(pw.x, pw.y + Math.sin(performance.now() * 0.006) * 6);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pw.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const icons = { speed: '⚡', super_jump: '🚀', freeze: '❄️', giant: '🗿', fireball: '🔥' };
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[pw.type] || '⚽', 0, 0);

      ctx.restore();
    });
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.fillStyle = p.color || '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    this.confetti.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size * 1.5);
    });
  }

  renderPlayers(ctx) {
    this.activePlayers.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Sombra
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, p.headRadius + 6, p.headRadius * 0.75, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Efecto congelado
      if (p.frozen) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, p.headRadius + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cabeza Gigante (Avatar SVG) con orientación según dirección a la que mira
      const avatarImg = this.avatarImages[p.id];
      const r = p.headRadius;
      ctx.save();
      if (!p.facingRight) {
        ctx.scale(-1, 1);
      }
      if (avatarImg && avatarImg.complete) {
        ctx.drawImage(avatarImg, -r, -r, r * 2, r * 2);
      } else {
        ctx.fillStyle = p.teamColor;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Bota oscilante de remate (orientada según la dirección del jugador)
      ctx.save();
      const bootDist = p.headRadius * 0.75;
      const bootBaseAngle = p.facingRight ? 0.35 : Math.PI - 0.35;
      const finalAngle = bootBaseAngle + (p.facingRight ? p.bootAngle : -p.bootAngle);

      ctx.translate(Math.cos(finalAngle) * bootDist, p.headRadius * 0.6 + Math.sin(finalAngle) * 12);
      ctx.rotate(p.facingRight ? p.bootAngle : -p.bootAngle);

      // Dibujar bota deportiva de fútbol
      ctx.fillStyle = p.teamColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Puntera redondeada apuntando hacia adelante según facingRight
      if (p.facingRight) {
        ctx.roundRect(-4, -8, 28, 16, [4, 10, 4, 4]);
      } else {
        ctx.roundRect(-24, -8, 28, 16, [10, 4, 4, 4]);
      }
      ctx.fill();
      ctx.stroke();

      // Tacos de la bota
      ctx.fillStyle = '#ffffff';
      if (p.facingRight) {
        ctx.fillRect(4, 8, 4, 3);
        ctx.fillRect(14, 8, 4, 3);
      } else {
        ctx.fillRect(-18, 8, 4, 3);
        ctx.fillRect(-8, 8, 4, 3);
      }

      ctx.restore();

      ctx.restore();

      // Etiqueta flotante con el nombre del chaval
      ctx.save();
      ctx.translate(p.x, p.y - p.headRadius - 16);
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      const textW = ctx.measureText(p.name).width;
      ctx.fillStyle = p.teamColor === '#3b82f6' ? 'rgba(30, 64, 175, 0.85)' : 'rgba(185, 28, 28, 0.85)';
      ctx.beginPath();
      ctx.roundRect(-textW / 2 - 8, -12, textW + 16, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.name, 0, 2);
      ctx.restore();
    });
  }

  renderBall(ctx) {
    // Dynamic Fading Ball Speed Trail
    if (this.ballTrail && this.ballTrail.length > 1) {
      for (let i = 0; i < this.ballTrail.length; i++) {
        const pt = this.ballTrail[i];
        const progress = (i + 1) / this.ballTrail.length;
        if (pt.speed > 160 || pt.isFireball) {
          ctx.save();
          ctx.globalAlpha = progress * 0.55;
          ctx.fillStyle = pt.isFireball ? '#f97316' : '#93c5fd';
          ctx.shadowColor = pt.isFireball ? '#ef4444' : '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, this.ball.radius * progress * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    ctx.save();
    ctx.translate(this.ball.x, this.ball.y);
    ctx.rotate(this.ball.rotation);

    // Si es bola de fuego
    if (this.ball.isFireball) {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;
    }

    // Cuerpo blanco del balón
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Pentágonos clásicos de balón de fútbol
    ctx.fillStyle = this.ball.isFireball ? '#f97316' : '#0f172a';
    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      const px = Math.cos(ang) * (this.ball.radius * 0.55);
      const py = Math.sin(ang) * (this.ball.radius * 0.55);
      ctx.beginPath();
      ctx.arc(px, py, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderScoreboard(ctx) {
    // Marcador Central Superior
    const sbW = 540;
    const sbH = 68;
    const sbX = this.width / 2 - sbW / 2;
    const sbY = 18;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sbX, sbY, sbW, sbH, 12);
    ctx.fill();
    ctx.stroke();

    // Marcador de Goles Global
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(`${this.teamScores.teamA}`, sbX + 90, sbY + 46);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('-', sbX + sbW / 2, sbY + 44);
    ctx.fillStyle = '#f87171';
    ctx.fillText(`${this.teamScores.teamB}`, sbX + sbW - 90, sbY + 46);

    // Cronómetro de Ronda
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#facc15';
    const s = Math.ceil(this.heatTime);
    ctx.fillText(`${s}s`, sbX + sbW / 2, sbY + 46);

    // Indicador de Ronda
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`RONDA ${this.currentHeatIndex + 1} / ${this.heats.length} (CABEZONES CHAVALIL)`, sbX + sbW / 2, sbY + 16);

    ctx.restore();
  }

  renderCountdownOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 14;

    const remaining = Math.ceil(this.countdownTimer);
    if (remaining > 0) {
      ctx.font = 'bold 100px Arial';
      ctx.fillStyle = remaining === 3 ? '#ef4444' : (remaining === 2 ? '#eab308' : '#22c55e');
      ctx.fillText(remaining, this.width / 2, this.height / 2 - 20);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`¡RONDA ${this.currentHeatIndex + 1}: AL TERRENO DE JUEGO!`, this.width / 2, this.height / 2 + 65);
    } else {
      ctx.font = 'bold 100px Arial';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('¡PITIDO INICIAL!', this.width / 2, this.height / 2);
    }
    ctx.restore();
  }

  renderGoalOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 16;

    ctx.font = 'bold 74px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText('⚽ ¡GOOOOOOL! ⚽', this.width / 2, this.height / 2 - 30);

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.lastScorer || '', this.width / 2, this.height / 2 + 40);

    ctx.restore();
  }

  renderHeatOverOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`🏁 ¡RONDA ${this.currentHeatIndex + 1} FINALIZADA! 🏁`, this.width / 2, this.height / 2 - 40);

    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Cargando siguiente duelo de cabezones...', this.width / 2, this.height / 2 + 30);
    ctx.restore();
  }

  renderVictoryOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 18;

    const winnerName = this.winningTeam === 'teamA' ? 'EQUIPO AZUL' : 'EQUIPO ROJO';
    const winnerColor = this.winningTeam === 'teamA' ? '#60a5fa' : '#f87171';

    ctx.font = 'bold 58px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText('🏆 ¡PARTIDO FINALIZADO! 🏆', this.width / 2, this.height / 2 - 90);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = winnerColor;
    ctx.fillText(`¡VICTORIA DEL ${winnerName}!`, this.width / 2, this.height / 2 - 10);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`RESULTADO FINAL: AZUL ${this.teamScores.teamA} - ${this.teamScores.teamB} ROJO`, this.width / 2, this.height / 2 + 50);

    ctx.restore();
  }

  loop(timestamp = performance.now()) {
    if (!this.running) return;
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

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

window.HeadSoccerEngine = HeadSoccerEngine;
