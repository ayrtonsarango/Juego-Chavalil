/**
 * BUTTON BASH - MINIJUEGO BROMA ULTRA GOOFY (BAR HOTBUNNIES & DIANA DE DARDOS)
 * - Fondo: Fotografía real del bar HotBunnies (ladrillo, neón y barra)
 * - Diana interactiva colocada exactamente sobre la diana real de la foto (cx: 638, cy: 356, r: 72)
 * - Marta y Violeta: Modelos SVG oficiales del motor de avatares (AvatarEngine) con auras shiny
 * - Broma ultra goofy: Popups amontonados uno encima de otro, textos descentrados, post-its torcidos
 * - 0 AI-SLOP: Chistes 100% auténticos de la cuadrilla (Tortilla en Tracasa, Badostáin, Pipas Facundo, Kalimotxos)
 * - Apagón de 7s y ranking falso que corona a alvarito.tracasa.lover.69 (isPrank: true)
 */

class ButtonBashEngine {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`ButtonBashEngine: Canvas #${canvasId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width || 1280;
    this.height = this.canvas.height || 720;
    this.options = options;
    this.onComplete = options.onComplete || (() => {});

    // Real Bar Photo Background
    this.bgImg = new Image();
    this.bgImg.src = '/images/hotbunnies_bar.jpg';
    this.bgLoaded = false;
    this.bgImg.onload = () => { this.bgLoaded = true; };

    // Real Marta & Violeta Avatars from AvatarEngine
    this.martaAvatarImg = null;
    this.violetaAvatarImg = null;
    this.alvaritoAvatarImg = null;
    this.initOfficialAvatars();

    // Coordinates measured to match the real dartboard in the photograph
    this.board = {
      cx: 638,
      cy: 356,
      radius: 72
    };

    // Game state
    this.running = false;
    this.animationId = null;
    this.lastTime = performance.now();
    this.elapsedGameTime = 0;

    // Phase: 'intro' | 'aiming_x' | 'aiming_y' | 'thrown' | 'prank_a' | 'prank_b' | 'prank_c' | 'blackout' | 'fake_ranking'
    this.phase = 'aiming_x';
    this.phaseTimer = 0;

    // Ticker values (0..1)
    this.tickerX = 0.5;
    this.tickerDirX = 1;
    this.tickerSpeedX = 1.1;

    this.tickerY = 0.5;
    this.tickerDirY = 1;
    this.tickerSpeedY = 1.35;

    this.lockedX = null;
    this.lockedY = null;

    // Thrown darts on board
    this.darts = [];
    this.crazyDarts = [];
    this.sparkles = [];
    this.hitEffects = [];

    // Pre-populate shiny sparkles for Marta & Violeta
    for (let i = 0; i < 40; i++) {
      this.sparkles.push({
        x: Math.random() * 200,
        y: Math.random() * 200,
        size: 3 + Math.random() * 5,
        speed: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Active goofy overlapping popups
    this.activePopups = [];
    this.jokes = null;
    this.loadJokes();

    // Blackout controller (7 seconds)
    this.blackoutRemaining = 7.0;

    // Players list for fake ranking
    this.players = [];
    this.teams = { teamA: [], teamB: [] };
  }

  initOfficialAvatars() {
    try {
      if (typeof renderAvatarSVG === 'function') {
        // Marta official model
        const martaSvg = renderAvatarSVG({
          skin: '#ffe0bd',
          hair: 'girl_short',
          hairColor: '#1e293b',
          eyes: 'normal',
          mouth: 'smile',
          shirt: '#10b981',
          accessory: 'gorra_brat',
          handItem: 'movil_tiktok'
        }, 160);
        this.martaAvatarImg = new Image();
        this.martaAvatarImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(martaSvg);

        // Violeta official model (pink swimsuit)
        const violetaSvg = renderAvatarSVG({
          skin: '#fffbf7',
          hair: 'girl_wavy',
          hairColor: '#ea580c',
          eyes: 'amber',
          mouth: 'smile',
          shirt: 'swimsuit_pink'
        }, 160);
        this.violetaAvatarImg = new Image();
        this.violetaAvatarImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(violetaSvg);

        // Alvarito official model (Lerga: red Tracasa shirt + black glasses)
        const alvaritoSvg = renderAvatarSVG({
          skin: '#fffbf7',
          hair: 'short',
          hairColor: '#09090b',
          eyes: 'normal',
          mouth: 'smirk',
          shirt: 'tracasa_red',
          accessory: 'black_glasses'
        }, 180);
        this.alvaritoAvatarImg = new Image();
        this.alvaritoAvatarImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(alvaritoSvg);
      }
    } catch (e) {
      console.warn('Avatar pre-render failed, fallback avatars will be used:', e);
    }
  }

  async loadJokes() {
    try {
      const res = await fetch('/data/button_bash_jokes.json');
      if (res.ok) {
        this.jokes = await res.json();
      }
    } catch (e) {
      console.warn('Could not load jokes JSON, using fallback jokes:', e);
    }
  }

  init(players = [], teams = { teamA: [], teamB: [] }) {
    this.players = players || [];
    this.teams = teams || { teamA: [], teamB: [] };
    this.running = true;
    this.lastTime = performance.now();
    this.elapsedGameTime = 0;
    this.activePopups = [];
    this.darts = [];
    this.crazyDarts = [];
    this.playerScores = {};

    // Build the turn-by-turn queue: human players first, then bots (or fallback)
    const humans = this.players.filter(p => !p.isBot);
    const bots = this.players.filter(p => p.isBot);
    this.playerQueue = (humans.length > 0)
      ? [...humans, ...bots]
      : (this.players.length > 0 ? [...this.players] : [{ id: 'p1', name: 'Chaval' }]);

    this.currentTurnIndex = 0;

    if (window.soundEngine && typeof soundEngine.playSoundByName === 'function') {
      soundEngine.playMysteryReveal();
    }

    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_event',
        stage: 'intro',
        message: '¡A jugar Button Bash!'
      });
    }

    this.startPlayerTurn();
    this.loop();
  }

  startPlayerTurn() {
    if (!this.running) return;
    this.activeShooter = this.playerQueue[this.currentTurnIndex] || this.playerQueue[0];
    this.activeShooterId = this.activeShooter.id;
    this.activeShooterName = this.activeShooter.name || 'Chaval';

    this.phase = 'aiming_x';
    this.phaseTimer = 0;
    this.lockedX = null;
    this.lockedY = null;
    this.tickerX = 0.5;
    this.tickerY = 0.5;
    this.tickerDirX = 1;
    this.tickerDirY = 1;

    if (window.soundEngine && typeof soundEngine.playMarioCoin === 'function') {
      soundEngine.playMarioCoin();
    }

    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_turn',
        activePlayerId: this.activeShooterId,
        activePlayerName: this.activeShooterName,
        turnIndex: this.currentTurnIndex + 1,
        totalTurns: this.playerQueue.length
      });
    }
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  handlePlayerInput(arg1, arg2) {
    if (!this.running) return;
    let playerId = null;
    let data = {};
    if (typeof arg1 === 'object' && arg1 !== null && arg1.data) {
      playerId = arg1.playerId;
      data = arg1.data;
    } else {
      playerId = arg1;
      data = arg2 || {};
    }

    // Only active shooter can lock and throw the dart!
    if (this.activeShooterId && playerId && playerId !== this.activeShooterId) {
      return;
    }

    // First tap locks X ticker, second tap locks Y ticker and launches dart
    const now = performance.now();
    if (data.bash || data.shoot || data.attack || data.gas) {
      if (this.phase === 'aiming_x') {
        this.lockedX = this.tickerX;
        this.phase = 'aiming_y';
        this.lastLockTime = now;
        if (window.soundEngine) soundEngine.playMarioCoin();
      } else if (this.phase === 'aiming_y' && (now - (this.lastLockTime || 0) > 300)) {
        this.lockedY = this.tickerY;
        this.phase = 'thrown';
        this.shootDart(playerId);
      }
    }

    // Reaction cheers
    if (data.bash_cheer) {
      if (data.bash_cheer === 'vamos') {
        if (window.soundEngine) soundEngine.playMarioCoin();
      } else if (data.bash_cheer === 'diana') {
        if (window.soundEngine) soundEngine.playHonk();
      }
    }
  }

  shootDart(playerId) {
    const { cx, cy, radius } = this.board;

    const hitX = (cx - radius) + this.lockedX * (radius * 2);
    const hitY = (cy - radius) + this.lockedY * (radius * 2);

    // Compute score based on distance from center
    const dist = Math.hypot(hitX - cx, hitY - cy);
    let pts = 0;
    let label = '¡FUERA!';

    if (dist < 10) {
      pts = 50;
      label = '🎯 ¡¡DIANAZO 50!!';
    } else if (dist < 26) {
      pts = 25;
      label = '★ 25 PUNTOS';
    } else if (dist < radius) {
      pts = 10;
      label = '+10 PTS';
    } else {
      pts = 0;
      label = '¡AL CORCHO! (0 PTS)';
    }

    const shooter = this.activeShooter || { id: playerId, name: 'Chaval' };
    const shooterColor = shooter.color || '#38bdf8';

    this.darts.push({
      x: hitX,
      y: hitY,
      pts,
      label,
      playerId: shooter.id,
      playerName: shooter.name,
      color: shooterColor
    });

    this.playerScores[shooter.id] = (this.playerScores[shooter.id] || 0) + pts;

    this.hitEffects.push({
      x: hitX,
      y: hitY,
      label,
      life: 1.8
    });

    if (window.soundEngine) {
      if (typeof soundEngine.playSwoosh === 'function') soundEngine.playSwoosh();
      if (typeof soundEngine.playHonk === 'function') setTimeout(() => soundEngine.playHonk(), 250);
    }

    // Wait 2.2s so everyone can see the dart hit and score on the board
    setTimeout(() => {
      if (!this.running) return;
      if (this.currentTurnIndex + 1 < this.playerQueue.length) {
        // Next player's turn!
        this.currentTurnIndex++;
        this.startPlayerTurn();
      } else {
        // All players have taken their turn! Trigger the goofy prank cascade
        this.triggerPrankA();
      }
    }, 2200);
  }

  // PRANK STAGE A: Windows Vista slow calculation error (Tilted & Goofy)
  triggerPrankA() {
    if (!this.running) return;
    this.phase = 'prank_a';

    const vistaJoke = this.jokes?.groupA?.[0] || {
      title: 'Windows Vista - Error de Barra',
      body: 'Calculando trayectoria del dardo...\nTiempo estimado restante: 4.382 horas, 14 minutos.',
      button: 'Esperar sentado con un zurito'
    };

    this.activePopups.push({
      id: 'vista_a',
      type: 'vista',
      title: vistaJoke.title,
      body: vistaJoke.body,
      btnText: vistaJoke.button,
      x: 310,
      y: 160,
      w: 620,
      h: 210,
      tilt: -0.04
    });

    if (window.soundEngine) soundEngine.playDangerAlarm();

    // Broadcast prank A to players
    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_event',
        stage: 'prank_a',
        title: vistaJoke.title,
        body: vistaJoke.body
      });
    }

    // Trigger Group B (crazy rogue darts & air current glitch) after 4 seconds
    setTimeout(() => {
      this.triggerPrankB();
    }, 4000);
  }

  // PRANK STAGE B: 3 Rogue bouncing darts & Air draft in the bar
  triggerPrankB() {
    if (!this.running) return;
    this.phase = 'prank_b';

    for (let i = 0; i < 3; i++) {
      this.crazyDarts.push({
        x: Math.random() * this.width,
        y: Math.random() * 200,
        vx: (Math.random() - 0.5) * 22,
        vy: 12 + Math.random() * 10,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.15 + Math.random() * 0.2
      });
    }

    const glitchText = this.jokes?.groupB?.glitch_texts?.[0] || 
      '¡DIOX! El dardo se ha desviado solo porque hay corriente de aire en la puerta del bar.';

    // Slap this banner overlapping slightly at an angle
    this.activePopups.push({
      id: 'glitch_b',
      type: 'bar_alert',
      title: '🍺 AVISO DE LA BARRA HOTBUNNIES',
      body: glitchText,
      x: 260,
      y: 430,
      w: 760,
      h: 110,
      tilt: 0.03
    });

    if (window.soundEngine) soundEngine.playBocina();

    // Trigger Group C popups cascade after 4 seconds
    setTimeout(() => {
      this.triggerPrankC();
    }, 4000);
  }

  // PRANK STAGE C: Overlapping Badostáin Maduritas, Facundo Threat, Gangbang Ramen
  triggerPrankC() {
    if (!this.running) return;
    this.phase = 'prank_c';

    // 1. Windows Defender pipas facundo (Tilted -0.05, overlapping on top left)
    const defenderJoke = this.jokes?.groupC?.[1] || {
      title: '🛡️ WINDOWS DEFENDER - AMENAZA GRAVE',
      body: 'Se ha detectado sal gorda de Pipas Facundo en la ranura de la diana.\nPor favor, sople fuerte para desinfectar.',
      badge: 'PELIGRO MÁXIMO',
      action: 'Limpiar con servilleta del bar'
    };
    this.activePopups.push({
      id: 'defender_c',
      type: 'defender',
      title: defenderJoke.title,
      body: defenderJoke.body,
      badge: defenderJoke.badge,
      btnText: defenderJoke.action,
      x: 160,
      y: 110,
      w: 520,
      h: 220,
      tilt: -0.06
    });

    // 2. Badostain Maduritas (Slapped right on top overlapping right side!)
    setTimeout(() => {
      if (!this.running) return;
      const badostainJoke = this.jokes?.groupC?.[0] || {
        title: '🔞 ¡AVISO DE PROXIMIDAD BADOSTÁIN!',
        body: '¡Maduritas a menos de 3 km de Badostáin quieren echar una partida de dardos contigo en la bajera!',
        badge: 'SOLTERAS CERCA',
        action: 'Mandar ubicación por Bizum'
      };
      this.activePopups.push({
        id: 'badostain_c',
        type: 'ad',
        title: badostainJoke.title,
        body: badostainJoke.body,
        badge: badostainJoke.badge,
        btnText: badostainJoke.action,
        x: 580,
        y: 180,
        w: 540,
        h: 230,
        tilt: 0.05
      });
      if (window.soundEngine) soundEngine.playDangerAlarm();
      if (window.socket) {
        window.socket.emit('minigame_trigger_event', {
          type: 'buttonbash_event',
          stage: 'prank_c_badostain'
        });
      }
    }, 1200);

    // 3. Gangbang Ramen Invite (Pasted across the center-bottom, overlapping both!)
    setTimeout(() => {
      if (!this.running) return;
      const ramenJoke = this.jokes?.groupA?.[1] || {
        title: '🍜 ¡URGENTE: GANGBANG DE RAMEN SOLIDARIO!',
        body: 'La mamá de los dos gatos ruega que vayáis por favor.\nEl viernes pasado sobraron 40 litros de caldo de cerdo 🐾🐾',
        badge: 'ASISTENCIA OBLIGATORIA',
        action: 'Voy de cabeza (+2 tuppers)'
      };
      this.activePopups.push({
        id: 'ramen_c',
        type: 'invite',
        title: ramenJoke.title,
        body: ramenJoke.body,
        badge: ramenJoke.badge,
        btnText: ramenJoke.action,
        x: 340,
        y: 330,
        w: 640,
        h: 240,
        tilt: -0.03
      });
      if (window.soundEngine) soundEngine.playBocina();
    }, 2400);

    // 4. Alvarito en Tracasa (slapped top center, 5.0s)
    setTimeout(() => {
      if (!this.running) return;
      this.activePopups.push({
        id: 'tracasa_alarm',
        type: 'alert',
        title: '⚠️ INCIDENCIA CRÍTICA EN TRACASA',
        body: 'Alvarito ha tirado el café sobre los servidores GIS.\nRogamos reiniciar el router de la cuadrilla inmediatamente.',
        badge: 'ERROR 500 SERVER',
        btnText: 'Reiniciar plomos',
        x: 290,
        y: 80,
        w: 620,
        h: 210,
        tilt: 0.04
      });
      if (window.soundEngine) soundEngine.playDangerAlarm();
    }, 5000);

    // 5. Chino Eneko Pipas Facundo (8.5s)
    setTimeout(() => {
      if (!this.running) return;
      this.activePopups.push({
        id: 'eneko_pipas',
        type: 'invite',
        title: '🌻 BAZAR ENEKO: OFERTA PIPAS FACUNDO',
        body: 'Pipas con sal y Monster Mango Loco a 1.20€.\nSolo pago en efectivo o bizum al número de la cuadrilla.',
        badge: 'OFERTA FLASH',
        btnText: 'Comprar 2 paquetes',
        x: 480,
        y: 250,
        w: 580,
        h: 220,
        tilt: -0.05
      });
      if (window.soundEngine) soundEngine.playHonk();
    }, 8500);

    // 6. Multa de la Mancomunidad (12.0s)
    setTimeout(() => {
      if (!this.running) return;
      this.activePopups.push({
        id: 'multa_manco',
        type: 'ad',
        title: '🚨 MULTA POR KALIMOTXO EN VÍA PÚBLICA',
        body: 'La Policía Municipal de Pamplona te ha pillado con la garrafa de 5L.\nPulsa aquí para alegar que estabas yendo a misa.',
        badge: 'SANCIÓN 600€',
        btnText: 'Alegar recurso',
        x: 180,
        y: 360,
        w: 600,
        h: 230,
        tilt: 0.03
      });
      if (window.soundEngine) soundEngine.playBocina();
    }, 12000);

    // 7. Aviso de plomos inminentes (15.5s)
    setTimeout(() => {
      if (!this.running) return;
      this.activePopups.push({
        id: 'plomos_warn',
        type: 'alert',
        title: '⚡ ALVARITO HA TOCADO EL CUADRO ELÉCTRICO',
        body: '¡CUIDADO! La luz de todo el bar está a punto de saltar.\n¡Marta y Violeta huyen de la barra!',
        badge: 'VOLTAJE CRÍTICO',
        btnText: '¡CORRED!',
        x: 350,
        y: 200,
        w: 640,
        h: 230,
        tilt: -0.02
      });
      if (window.soundEngine) soundEngine.playAndroidAlert();
    }, 15500);

    // Trigger Group D (7s Blackout) after 18 seconds (gives plenty of time to read jokes & popups!)
    setTimeout(() => {
      this.triggerBlackout();
    }, 18000);
  }

  triggerBlackout() {
    if (!this.running) return;
    this.phase = 'blackout';
    this.blackoutRemaining = 7.0;
    this.activePopups = []; // Clear popups behind darkness

    if (window.soundEngine) {
      soundEngine.playAndroidAlert();
    }

    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_event',
        stage: 'blackout',
        duration: 7.0
      });
    }

    const interval = setInterval(() => {
      if (!this.running) {
        clearInterval(interval);
        return;
      }
      this.blackoutRemaining -= 0.5;
      if (this.blackoutRemaining <= 0) {
        clearInterval(interval);
        this.triggerFakeRanking();
      }
    }, 500);
  }

  triggerFakeRanking() {
    if (!this.running) return;
    this.phase = 'fake_ranking';

    if (window.soundEngine) {
      if (typeof soundEngine.playFanfare === 'function') soundEngine.playFanfare();
      if (typeof soundEngine.playMysteryReveal === 'function') soundEngine.playMysteryReveal();
    }

    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_event',
        stage: 'fake_ranking'
      });
    }

    // Auto complete after laughing at the fake ranking
    setTimeout(() => {
      this.finishPrank();
    }, 8500);
  }

  finishPrank() {
    this.stop();
    if (window.socket) {
      window.socket.emit('minigame_trigger_event', {
        type: 'buttonbash_event',
        stage: 'finish'
      });
    }
    // Minijuego broma: NO suma puntos al torneo oficial de cuadrilla
    this.onComplete({
      isPrank: true,
      winningTeam: null,
      scores: {},
      comment: 'Partida trucada por Marta, Violeta y Alvarito (Tracasa)'
    });
  }

  update(dt) {
    this.elapsedGameTime += dt;

    // Ticker Oscillation
    if (this.phase === 'aiming_x') {
      this.tickerX += this.tickerDirX * this.tickerSpeedX * dt;
      if (this.tickerX >= 1) {
        this.tickerX = 1;
        this.tickerDirX = -1;
      } else if (this.tickerX <= 0) {
        this.tickerX = 0;
        this.tickerDirX = 1;
      }
    } else if (this.phase === 'aiming_y') {
      this.tickerY += this.tickerDirY * this.tickerSpeedY * dt;
      if (this.tickerY >= 1) {
        this.tickerY = 1;
        this.tickerDirY = -1;
      } else if (this.tickerY <= 0) {
        this.tickerY = 0;
        this.tickerDirY = 1;
      }
    }

    // Update Sparkles for Admins
    this.sparkles.forEach(s => {
      s.phase += dt * s.speed;
    });

    // Update Crazy Darts (bouncing wild)
    this.crazyDarts.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.8;
      d.rot += d.rotSpeed;

      if (d.x < 20 || d.x > this.width - 20) d.vx *= -0.85;
      if (d.y > this.height - 40) {
        d.y = this.height - 40;
        d.vy *= -0.6;
      }
    });

    // Update Hit Effects
    this.hitEffects.forEach(h => {
      h.life -= dt;
    });
    this.hitEffects = this.hitEffects.filter(h => h.life > 0);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Real Bar Photograph Background
    this.renderHotBunniesBackground(ctx);

    // 2. Marta & Violeta Admin Avatars (Real Models with Shiny Aura)
    this.renderAdmins(ctx);

    // 3. Interactive Dartboard targeting overlay over the real photo dartboard
    this.renderDartboardOverlay(ctx);

    // 4. Oscillating Tickers
    if (this.phase === 'aiming_x' || this.phase === 'aiming_y') {
      this.renderTickers(ctx);
    }

    // 5. Sticking & Crazy Darts
    this.renderDarts(ctx);

    // 6. Overlapping Goofy Popups ("una cosa sobre otra")
    if (this.activePopups.length > 0) {
      this.renderPopups(ctx);
    }

    // 7. Hit score popup labels
    this.renderHitEffects(ctx);

    // 7B. Active Shooter Turn Banner on TV
    this.renderTurnHeader(ctx);

    // 8. Opening Standalone Arcade Splash Banner (first 3.0 seconds)
    if (this.elapsedGameTime < 3.0 && (this.phase === 'aiming_x' || this.phase === 'intro')) {
      this.renderOpeningArcadeSplash(ctx);
    }

    // 9. Blackout (Apagón de 7s)
    if (this.phase === 'blackout') {
      this.renderBlackout(ctx);
    }

    // 10. Fake Ranking Ceremony (Zero AI-slop, Tracasa winner)
    if (this.phase === 'fake_ranking') {
      this.renderFakeRanking(ctx);
    }
  }

  renderOpeningArcadeSplash(ctx) {
    const t = this.elapsedGameTime;
    let alpha = 1.0;
    if (t > 2.2) {
      alpha = Math.max(0, (3.0 - t) / 0.8);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const bx = 280;
    const by = 80;
    const bw = 720;
    const bh = 175;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 24);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 ¡¡BUTTON BASH!!', bx + bw / 2, by + 60);

    ctx.fillStyle = '#e11d48';
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('★ EDICIÓN ESPECIAL BAR HOTBUNNIES · DARDOS & KALIMOTXO ★', bx + bw / 2, by + 100);

    ctx.fillStyle = '#0284c7';
    ctx.font = '800 17px system-ui, -apple-system, sans-serif';
    ctx.fillText('Marta & Violeta: "¡A por la diana, chavales!"', bx + bw / 2, by + 142);

    ctx.restore();
  }

  renderTurnHeader(ctx) {
    if (this.phase === 'blackout' || this.phase === 'fake_ranking') return;
    const name = (this.activeShooterName || 'Chaval').toUpperCase();
    const totalTurns = this.playerQueue ? this.playerQueue.length : 1;
    const currentTurn = (this.currentTurnIndex !== undefined ? this.currentTurnIndex : 0) + 1;
    ctx.save();
    const bw = 620;
    const bx = (this.width - bw) / 2;
    const by = 16;
    const bh = 54;

    // Card shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 27);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Icon & Text
    ctx.shadowColor = 'transparent';
    ctx.textBaseline = 'middle';
    ctx.font = '900 22px Fredoka, -apple-system, sans-serif';

    // Left label: 🎯 TURNO: [NAME]
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('🎯 TURNO: ', bx + 24, by + bh / 2);

    const nameOffset = ctx.measureText('🎯 TURNO: ').width;
    ctx.fillStyle = '#0284c7';
    ctx.fillText(name, bx + 24 + nameOffset, by + bh / 2);

    // Right badge: (1/3)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '900 20px Fredoka, -apple-system, sans-serif';
    ctx.fillText(`(${currentTurn}/${totalTurns})`, bx + bw - 24, by + bh / 2);

    ctx.restore();
  }

  renderHotBunniesBackground(ctx) {
    if (this.bgLoaded && this.bgImg.naturalWidth > 0) {
      // Draw real photograph filling the 1280x720 canvas
      ctx.drawImage(this.bgImg, 0, 0, this.width, this.height);
    } else {
      // Warm brick fallback while image is decoding
      ctx.fillStyle = '#261614';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Animated Neon Glow pulse over the real "HOTBUNNIES" sign
    ctx.save();
    const neonPulse = 0.5 + 0.5 * Math.sin(this.elapsedGameTime * 5);
    ctx.shadowColor = `rgba(244, 63, 94, ${neonPulse * 0.9})`;
    ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
    ctx.fillRect(400, 70, 480, 80);
    ctx.restore();

    // Chaotic crooked post-it notes slapped around the bar
    this.renderPostIt(ctx, 40, 210, -0.09, '#fef08a', '📌 MARTA:\nNo tocar los cables\nde la diana que dan\ncalambre ⚡');
    this.renderPostIt(ctx, 1070, 210, 0.08, '#fbcfe8', '📌 VIOLETA:\nAlvarito no ha venido\nhoy tampoco.\nSigue en Tracasa 🏍️');
  }

  renderPostIt(ctx, x, y, tilt, color, text) {
    ctx.save();
    ctx.translate(x + 60, y + 50);
    ctx.rotate(tilt);
    ctx.translate(-(x + 60), -(y + 50));

    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, 140, 110);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 140, 110);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "Comic Sans MS", cursive, sans-serif';
    const lines = text.split('\n');
    lines.forEach((l, idx) => {
      ctx.fillText(l, x + 8, y + 24 + idx * 18);
    });

    ctx.restore();
  }

  renderAdmins(ctx) {
    // 1. MARTA (Left side): Official Avatar + BRAT Cap + Shiny Golden Aura
    ctx.save();
    const martaX = 85;
    const martaY = 320;

    // Glowing shiny star particles around Marta
    this.sparkles.slice(0, 18).forEach(s => {
      const alpha = 0.4 + 0.6 * Math.sin(s.phase);
      ctx.fillStyle = `rgba(163, 230, 53, ${alpha})`;
      ctx.beginPath();
      ctx.arc(martaX - 20 + (s.x % 160), martaY - 40 + (s.y % 180), s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Official Marta SVG Model
    if (this.martaAvatarImg && this.martaAvatarImg.complete) {
      ctx.shadowColor = 'rgba(132, 204, 22, 0.8)';
      ctx.shadowBlur = 20;
      ctx.drawImage(this.martaAvatarImg, martaX, martaY, 135, 155);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ffe0bd';
      ctx.beginPath();
      ctx.arc(martaX + 65, martaY + 70, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slanted Comic Badge for Marta
    ctx.save();
    ctx.translate(martaX + 65, martaY + 165);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.roundRect(-75, -14, 150, 30, 8);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ MARTA [ADMIN]', 0, 6);
    ctx.restore();
    ctx.restore();

    // 2. VIOLETA (Right side): Official Avatar + Pink Swimsuit + Shiny Hot Pink Aura
    ctx.save();
    const violetaX = 1060;
    const violetaY = 320;

    // Glowing shiny star particles around Violeta
    this.sparkles.slice(18, 38).forEach(s => {
      const alpha = 0.4 + 0.6 * Math.sin(s.phase);
      ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
      ctx.beginPath();
      ctx.arc(violetaX - 20 + (s.x % 160), violetaY - 40 + (s.y % 180), s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Official Violeta SVG Model
    if (this.violetaAvatarImg && this.violetaAvatarImg.complete) {
      ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
      ctx.shadowBlur = 20;
      ctx.drawImage(this.violetaAvatarImg, violetaX, violetaY, 135, 155);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#fffbf7';
      ctx.beginPath();
      ctx.arc(violetaX + 65, violetaY + 70, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slanted Comic Badge for Violeta
    ctx.save();
    ctx.translate(violetaX + 65, violetaY + 165);
    ctx.rotate(0.06);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(-80, -14, 160, 30, 8);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌺 VIOLETA [ADMIN]', 0, 6);
    ctx.restore();
    ctx.restore();
  }

  renderDartboardOverlay(ctx) {
    const { cx, cy, radius } = this.board;

    ctx.save();

    // Subtle glowing arcade targeting ring over the real dartboard
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Bullseye subtle indicator ring
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Instruction banner above board (Tilted Comic Bubble)
    ctx.save();
    ctx.translate(cx, cy - radius - 45);
    ctx.rotate(-0.02);

    let instructionText = '🎯 ¡PULSA TU BOTÓN PARA DISPARAR!';
    if (this.phase === 'aiming_x') {
      instructionText = '🎯 ¡PULSA EL BOTÓN PARA FIJAR LA X!';
    } else if (this.phase === 'aiming_y') {
      instructionText = '🎯 ¡AHORA FIJA LA Y Y DISPARA!';
    }

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(-210, -20, 420, 38, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.font = '900 17px Fredoka, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(instructionText, 0, 6);
    ctx.restore();

    ctx.restore();
  }

  renderTickers(ctx) {
    const { cx, cy, radius } = this.board;

    ctx.save();

    // 1. Horizontal Ticker (Oscillating X axis)
    const currentX = (cx - radius) + this.tickerX * (radius * 2);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([5, 5]);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(currentX, cy - radius - 18);
    ctx.lineTo(currentX, cy + radius + 18);
    ctx.stroke();

    // Downward arrow above ticker X
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(currentX, cy - radius - 6);
    ctx.lineTo(currentX - 8, cy - radius - 20);
    ctx.lineTo(currentX + 8, cy - radius - 20);
    ctx.closePath();
    ctx.fill();

    // If locked X, draw solid green line
    if (this.lockedX !== null) {
      const fixedX = (cx - radius) + this.lockedX * (radius * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(fixedX, cy - radius - 15);
      ctx.lineTo(fixedX, cy + radius + 15);
      ctx.stroke();
    }

    // 2. Vertical Ticker (Oscillating Y axis when in aiming_y)
    if (this.phase === 'aiming_y') {
      const currentY = (cy - radius) + this.tickerY * (radius * 2);

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 18, currentY);
      ctx.lineTo(cx + radius + 18, currentY);
      ctx.stroke();

      // Rightward arrow on ticker Y
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - radius - 6, currentY);
      ctx.lineTo(cx - radius - 20, currentY - 8);
      ctx.lineTo(cx - radius - 20, currentY + 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderDarts(ctx) {
    // 1. Stuck Darts on the real board
    this.darts.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);

      // Dart Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(8, 8, 14, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Metallic Point
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, -18);
      ctx.stroke();

      // Flights (Flumas de dardo)
      ctx.fillStyle = d.color || '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(10, -18);
      ctx.lineTo(18, -32);
      ctx.lineTo(4, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    // 2. Crazy Rogue Darts (Bouncing around in prank stage B)
    this.crazyDarts.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 24);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.restore();
    });
  }

  // ULTRA GOOFY OVERLAPPING POPUPS ("Una cosa sobre otra", descentrado cómico)
  renderPopups(ctx) {
    this.activePopups.forEach(p => {
      ctx.save();

      // Apply comic tilt around center of popup
      const tilt = p.tilt || 0;
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(tilt);
      ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));

      // Comic Hard Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 10;

      if (p.type === 'vista') {
        // Windows Vista Error Box
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#0284c7';
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        // Vista Blue Titlebar
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(p.x, p.y, p.w, 36);

        ctx.font = '900 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('❌ ' + p.title, p.x + 14, p.y + 24);

        // Infinitely slow progress bar
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(p.x + 20, p.y + 115, p.w - 40, 22);
        ctx.fillStyle = '#22c55e';
        const progW = (p.w - 40) * (0.06 + 0.04 * Math.sin(this.elapsedGameTime * 3));
        ctx.fillRect(p.x + 20, p.y + 115, progW, 22);

        // Body text
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#0f172a';
        const lines = p.body.split('\n');
        lines.forEach((l, idx) => {
          ctx.fillText(l, p.x + 20, p.y + 68 + idx * 22);
        });

        // Button
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(p.x + p.w - 240, p.y + p.h - 46, 220, 34);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(p.x + p.w - 240, p.y + p.h - 46, 220, 34);
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 13px sans-serif';
        ctx.fillText(p.btnText || 'Aceptar', p.x + p.w - 225, p.y + p.h - 24);

      } else if (p.type === 'defender') {
        // Windows Defender Pipas Alert (Red Alert Box)
        ctx.fillStyle = '#fef2f2';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.x, p.y, p.w, 36);
        ctx.font = '900 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.title, p.x + 14, p.y + 24);

        // Badge poking out of corner
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(p.x + p.w - 140, p.y - 12, 130, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px sans-serif';
        ctx.fillText(p.badge || 'PELIGRO', p.x + p.w - 125, p.y + 5);

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#991b1b';
        const lines = p.body.split('\n');
        lines.forEach((l, idx) => {
          ctx.fillText(l, p.x + 18, p.y + 75 + idx * 22);
        });

        // Big Warning Label
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(p.x + 18, p.y + 125, p.w - 36, 30);
        ctx.font = '900 12px monospace';
        ctx.fillStyle = '#b91c1c';
        ctx.fillText('⚠️ DETECTADO: Trojan:Win32/PipasAguasalFacundo.A!rfn', p.x + 24, p.y + 145);

        // Action button
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(p.x + p.w - 240, p.y + p.h - 44, 220, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px sans-serif';
        ctx.fillText(p.btnText, p.x + p.w - 225, p.y + p.h - 23);

      } else if (p.type === 'ad') {
        // Badostain Sleazy Ad (Orange/Yellow Comic Box)
        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f97316';
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(p.x, p.y, p.w, 36);
        ctx.font = '900 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.title, p.x + 14, p.y + 24);

        // Badge poking out of corner
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(p.x + p.w - 150, p.y - 12, 140, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px sans-serif';
        ctx.fillText(p.badge || 'BADOSTÁIN', p.x + p.w - 138, p.y + 5);

        ctx.font = '900 17px "Comic Sans MS", cursive, sans-serif';
        ctx.fillStyle = '#c2410c';
        ctx.fillText(p.body, p.x + 16, p.y + 85);

        ctx.font = '26px sans-serif';
        ctx.fillText('🎯 💘 🍻 💃', p.x + 20, p.y + 145);

        ctx.fillStyle = '#f97316';
        ctx.fillRect(p.x + p.w - 250, p.y + p.h - 46, 230, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px sans-serif';
        ctx.fillText(p.btnText, p.x + p.w - 240, p.y + p.h - 24);

      } else if (p.type === 'invite') {
        // Gangbang Ramen Solidario (Purple/Pink Comic Box)
        ctx.fillStyle = '#fdf4ff';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#a855f7';
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#a855f7';
        ctx.fillRect(p.x, p.y, p.w, 36);
        ctx.font = '900 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.title, p.x + 14, p.y + 24);

        // Badge
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(p.x + p.w - 190, p.y - 12, 180, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px sans-serif';
        ctx.fillText(p.badge || 'SOLIDARIO', p.x + p.w - 175, p.y + 5);

        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#581c87';
        const lines = p.body.split('\n');
        lines.forEach((l, idx) => {
          ctx.fillText(l, p.x + 20, p.y + 78 + idx * 24);
        });

        ctx.font = '34px sans-serif';
        ctx.fillText('🍜 🐈 🐾 🥣', p.x + 20, p.y + 175);

        ctx.fillStyle = '#9333ea';
        ctx.fillRect(p.x + p.w - 240, p.y + p.h - 48, 220, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px sans-serif';
        ctx.fillText(p.btnText, p.x + p.w - 230, p.y + p.h - 25);

      } else if (p.type === 'bar_alert') {
        // Bar Air Current Alert (Navy/Indigo Banner)
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#818cf8';
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.font = '900 15px Fredoka, sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(p.title, p.x + 18, p.y + 32);

        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p.body, p.x + 18, p.y + 75);
      }

      ctx.restore();
    });
  }

  renderHitEffects(ctx) {
    this.hitEffects.forEach(h => {
      ctx.save();
      const alpha = Math.min(h.life, 1);
      ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.font = '900 24px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(h.label, h.x, h.y - 25);
      ctx.restore();
    });
  }

  // BLACKOUT SEQUENCE: 7s total darkness with wandering flashlight & tilted panic texts
  renderBlackout(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();

    // Wandering Flashlight Beam
    const flashX = this.width / 2 + Math.sin(this.elapsedGameTime * 2.5) * 180;
    const flashY = this.height / 2 + Math.cos(this.elapsedGameTime * 1.8) * 100;

    const grad = ctx.createRadialGradient(flashX, flashY, 20, flashX, flashY, 190);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
    grad.addColorStop(0.6, 'rgba(254, 240, 138, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Chaotic Tilted Texts scattered across the dark screen
    const blackoutLines = this.jokes?.groupD?.lines || [
      'Mierda, Violeta, se ha ido la luz del bar...',
      '¿Dónde está el enchufe del portátil de la barra?',
      'Alvarito, no toques los plomos de Tracasa...',
      '¡QUE ALGUIEN ENCHUFE LA NEVERA DE LOS KALIMOTXOS!'
    ];

    // Line 1: Tilted -3deg
    ctx.save();
    ctx.translate(160, 220);
    ctx.rotate(-0.05);
    ctx.font = '900 28px Fredoka, sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('⚠️ "' + (blackoutLines[0] || 'Se ha ido la luz...') + '"', 0, 0);
    ctx.restore();

    // Line 2: Tilted +4deg
    ctx.save();
    ctx.translate(220, 320);
    ctx.rotate(0.06);
    ctx.font = '800 24px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('• ' + (blackoutLines[1] || '¿Dónde está el cargador?'), 0, 0);
    ctx.restore();

    // Line 3: Tilted -4deg
    ctx.save();
    ctx.translate(260, 420);
    ctx.rotate(-0.04);
    ctx.font = '900 26px Fredoka, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('• ' + (blackoutLines[2] || 'Alvarito en Tracasa...'), 0, 0);
    ctx.restore();

    // Line 4: Giant Yellow Alert Text
    ctx.save();
    ctx.translate(140, 530);
    ctx.rotate(0.02);
    ctx.font = '900 32px Fredoka, sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('⚡ ' + (blackoutLines[3] || '¡ENCHUFAD EL KALIMOTXO!'), 0, 0);
    ctx.restore();

    // Countdown timer bottom right
    ctx.font = '900 18px monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(`Restableciendo plomos en: ${Math.max(0, this.blackoutRemaining).toFixed(1)}s`, this.width - 40, this.height - 30);

    ctx.restore();
  }

  // FAKE RANKING: Winner alvarito.tracasa.lover.69 (Zero AI-slop, 100% Cuadrilla Lore)
  renderFakeRanking(ctx) {
    ctx.save();

    // Dim background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Main Card (Tilted Comic Podio)
    const cardX = 140;
    const cardY = 50;
    const cardW = 1000;
    const cardH = 620;

    ctx.save();
    ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
    ctx.rotate(-0.015);
    ctx.translate(-(cardX + cardW / 2), -(cardY + cardH / 2));

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Card Header
    ctx.font = '900 28px Fredoka, cursive, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 ¡CLASIFICACIÓN FINAL DIANA DE DARDOS HOTBUNNIES!', cardX + cardW / 2, cardY + 48);

    // WINNER BANNER: alvarito.tracasa.lover.69
    const winX = cardX + 35;
    const winY = cardY + 80;
    const winW = cardW - 70;
    const winH = 150;

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 18);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Draw Official Alvarito Avatar (Lerga in Tracasa Red Shirt)
    if (this.alvaritoAvatarImg && this.alvaritoAvatarImg.complete) {
      ctx.drawImage(this.alvaritoAvatarImg, winX + 15, winY + 8, 120, 134);
    }

    // Crooked Golden Crown on Alvarito
    ctx.save();
    ctx.translate(winX + 75, winY + 12);
    ctx.rotate(0.25);
    ctx.font = '42px sans-serif';
    ctx.fillText('👑', 0, 0);
    ctx.restore();

    // Winner Details (100% Cuadrilla Lore)
    ctx.textAlign = 'left';
    ctx.font = '900 23px Fredoka, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('🥇 1º GANADOR ABSOLUTO: alvarito.tracasa.lover.69', winX + 150, winY + 40);

    ctx.font = '900 18px Fredoka, sans-serif';
    ctx.fillStyle = '#ca8a04';
    ctx.fillText('PUNTUACIÓN: 999.999.999 pts  (🥪 ¡EMPLEADO DEL MES EN TRACASA!)', winX + 150, winY + 70);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.fillText('¡Ha ganado el torneo de dardos sin levantarse de la silla comiéndose un pincho de tortilla!', winX + 150, winY + 100);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#92400e';
    ctx.fillText('• Dardos tirados: 0   • Horas cotizadas hoy: 8h 03min   • Puntos de torneo sumados: 0', winX + 150, winY + 126);

    // Absurd Scores List for Cuadrilla
    const absurdScores = [
      '-42.000 pts (Debe 3 rondas y 2 bravas)',
      '12,5 Pipas Facundo',
      'NaN pts (Se le cayó el dardo)',
      'undefined',
      '¯\\_(ツ)_/¯ pts',
      '404 Dardo Not Found',
      '[object Object]',
      'Infinito - 1'
    ];

    const displayPlayers = this.players.length > 0 ? this.players : [
      { name: 'Ayrton' }, { name: 'Adriachi' }, { name: 'Manu' }, { name: 'Eneko' }
    ];

    displayPlayers.slice(0, 5).forEach((p, idx) => {
      const rowY = winY + winH + 18 + idx * 56;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(winX, rowY, winW, 46, 12);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.font = '900 17px Fredoka, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${idx + 2}º  ${p.name || 'Chaval'}`, winX + 24, rowY + 30);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 16px monospace';
      ctx.fillText(absurdScores[idx % absurdScores.length], winX + winW - 24, rowY + 30);
      ctx.textAlign = 'left';
    });

    // Giant Red Comic Rubber Stamp: PARTIDA TRUCADA
    ctx.save();
    ctx.translate(cardX + cardW / 2, cardY + cardH - 45);
    ctx.rotate(-0.05);

    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.roundRect(-380, -22, 760, 44, 10);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    ctx.font = '900 16px Fredoka, sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.textAlign = 'center';
    ctx.fillText('❌ AVISO DEL BARMAN: Partida trucada por Marta y Violeta. 0 PUNTOS DE TORNEO.', 0, 6);
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(() => this.loop());
  }
}

window.ButtonBashEngine = ButtonBashEngine;
