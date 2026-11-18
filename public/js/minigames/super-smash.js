/**
 * SUPER SMASH CHAVALIL (ULTRA RÉPLICA SMASH BROS BATTLEFIELD)
 * 
 * Motor de combate en plataformas 2D estilo Super Smash Bros Melee / Ultimate:
 * - Plataforma flotante Battlefield: isla rocosa ancestral con cristales antigravedad pulsantes,
 *   fisuras de roca, 3 plataformas blandas con bordes de neón y fondo celestial con nebulosa parallax.
 * - Físicas y combate Smash auténticos:
 *   - Ledge Grab: agarre al borde del escenario con invulnerabilidad temporal y salto de recuperación.
 *   - Up-B Recovery: especial hacia arriba para volver a la plataforma tras ser lanzado.
 *   - Ataques Smash direccionales (Forward Smash cargado, Jab rápido, Down-Air Meteor Spike).
 *   - Escudo Burbuja con desgaste, stun y rotura de escudo (Shield Break con estrellas de mareo).
 *   - Blast Zones con explosiones K.O. auténticas de borde de pantalla y pantalla sacudida.
 *   - Porcentajes de daño (0% - 300%) con knockback exponencial y D.I.
 * - Sistema de Rondas / Heats Multijugador:
 *   - Si hay > 4 jugadores, divide en Rondas de 4 luchadores (2 Azul vs 2 Rojo por ronda)
 *     para que toda la cuadrilla luche con máxima fluidez y los puntos sumen al marcador global de equipo.
 * - Integración completa con mandos móviles y teclado PC.
 */

class SuperSmashEngine {
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

    // Stage Geometry (Battlefield Layout)
    this.stage = {
      main: { x: 290, y: 500, w: 700, h: 45, undersideH: 150 },
      platforms: [
        { x: 340, y: 370, w: 170, h: 14, id: 'plat_left' },
        { x: 770, y: 370, w: 170, h: 14, id: 'plat_right' },
        { x: 550, y: 240, w: 180, h: 14, id: 'plat_top' }
      ],
      ledges: [
        { x: 290, y: 500, side: 'left' },
        { x: 990, y: 500, side: 'right' }
      ],
      blastLeft: -120,
      blastRight: 1400,
      blastTop: -160,
      blastBottom: 820
    };

    // All Players & Tournament Heats
    this.allPlayers = [];
    this.teams = { teamA: [], teamB: [] };
    this.heats = [];
    this.currentHeatIndex = 0;
    this.activeFighters = []; // Active 2-4 players in current heat

    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.avatarImages = {};
    this.screenShake = 0;
    this.camera = { x: 640, y: 360, zoom: 1.0, targetZoom: 1.0 };

    this.gameState = 'countdown'; // 'countdown' | 'brawl' | 'heat_over' | 'victory'
    this.countdownTimer = 3.2;
    this.heatOverTimer = 0;
    this.teamScores = { teamA: 0, teamB: 0 };
    this.winningTeam = null;

    // Nebula parallax stars
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 1 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.3
      });
    }
  }

  async prepareAvatars(playerList) {
    const promises = playerList.map(p => {
      return new Promise((resolve) => {
        if (!p.avatar || typeof renderAvatarSVG === 'undefined') {
          resolve();
          return;
        }
        const svg = renderAvatarSVG(p.avatar, 70);
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

    // Build Tournament Heats (Max 4 players per heat for authentic 2v2 Smash combat)
    const teamA = (teams.teamA || []).map(p => p.id);
    const playersTeamA = playerList.filter(p => teamA.includes(p.id));
    const playersTeamB = playerList.filter(p => !teamA.includes(p.id));

    this.heats = [];
    if (playerList.length <= 4) {
      // Single Heat with all players
      this.heats.push(playerList);
    } else {
      // Split into 2 or 3 balanced heats (2 Team Azul vs 2 Team Rojo per heat)
      const numHeats = Math.ceil(playerList.length / 4);
      for (let h = 0; h < numHeats; h++) {
        const heatGroup = [];
        // Add up to 2 from Team A
        const a1 = playersTeamA[h * 2];
        const a2 = playersTeamA[h * 2 + 1];
        if (a1) heatGroup.push(a1);
        if (a2) heatGroup.push(a2);

        // Add up to 2 from Team B
        const b1 = playersTeamB[h * 2];
        const b2 = playersTeamB[h * 2 + 1];
        if (b1) heatGroup.push(b1);
        if (b2) heatGroup.push(b2);

        if (heatGroup.length > 0) this.heats.push(heatGroup);
      }
    }

    this.prepareAvatars(playerList);
    this.startHeat(0);

    this.lastTime = performance.now();
    this.loop();
  }

  startHeat(heatIndex) {
    this.currentHeatIndex = heatIndex;
    this.gameState = 'countdown';
    this.countdownTimer = 3.0;
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;

    const heatPlayers = this.heats[heatIndex] || this.allPlayers;
    const teamAIds = (this.teams.teamA || []).map(p => p.id);
    const teamBIds = (this.teams.teamB || []).map(p => p.id);

    // Staggered Spawns on Battlefield
    const spawnSlots = [
      { x: 380, y: 460 },
      { x: 900, y: 460 },
      { x: 420, y: 320 },
      { x: 860, y: 320 }
    ];

    this.activeFighters = heatPlayers.map((p, idx) => {
      let inTeamA;
      if (heatPlayers.length === 2) {
        inTeamA = (idx === 0);
      } else if (teamAIds.length > 0 || teamBIds.length > 0) {
        if (teamAIds.includes(p.id)) inTeamA = true;
        else if (teamBIds.includes(p.id)) inTeamA = false;
        else inTeamA = (idx % 2 === 0);
      } else {
        inTeamA = (idx % 2 === 0);
      }
      const spawn = spawnSlots[idx % spawnSlots.length];

      return {
        id: p.id,
        name: p.name || `Chaval_${idx + 1}`,
        avatar: p.avatar,
        isBot: Boolean(p.isBot),
        isAndroid: Boolean(p.isAndroid),
        team: inTeamA ? 'teamA' : 'teamB',
        teamColor: inTeamA ? '#3b82f6' : '#ef4444',
        teamName: inTeamA ? 'AZUL' : 'ROJO',

        // Position & Movement
        x: spawn.x,
        y: spawn.y,
        vx: 0,
        vy: 0,
        w: 42,
        h: 56,
        facing: inTeamA ? 1 : -1,
        grounded: false,
        jumpsLeft: 2,
        maxJumps: 2,
        dropThroughTimer: 0,

        // Combat Attributes
        stocks: 2,
        damagePercent: 0,
        shieldHp: 100,
        isShielding: false,
        shieldBroken: false,
        shieldBreakTimer: 0,
        hitstun: 0,
        invulnerableTimer: 60, // 1s invulnerability on spawn

        // Ledge Grab
        isHanging: false,
        hangTimer: 0,

        // Attacks
        attackType: null, // 'jab' | 'fsmash' | 'up_b' | 'dair' | 'special'
        attackTimer: 0,
        attackCooldown: 0,
        specialCooldown: 0,

        // Inputs
        inputLeft: false,
        inputRight: false,
        inputUp: false,
        inputDown: false,
        inputAttack: false,
        inputSpecial: false,
        inputShield: false,

        // Respawn
        isRespawning: false,
        respawnTimer: 0,

        // Bot AI
        aiActionTimer: Math.random() * 0.4
      };
    });

    if (window.socket) {
      window.socket.emit('minigame_heat_update', {
        heatIndex: heatIndex + 1,
        totalHeats: this.heats.length,
        activePlayerIds: this.activeFighters.map(p => p.id),
        minigameName: 'Super Smash Chavalil'
      });
    }
  }

  handlePlayerInput(playerId, data) {
    const f = this.activeFighters.find(p => p.id === playerId);
    if (!f || f.stocks <= 0 || f.isRespawning) return;

    if (data.left !== undefined) f.inputLeft = Boolean(data.left);
    if (data.right !== undefined) f.inputRight = Boolean(data.right);

    if (data.up !== undefined) {
      if (data.up && !f.inputUp) this.triggerJump(f);
      f.inputUp = Boolean(data.up);
    }
    if (data.down !== undefined) {
      if (data.down) {
        f.dropThroughTimer = 18; // Drop through soft platform
        if (!f.grounded && f.vy > 0) f.vy = 14; // Fast Fall!
      }
      f.inputDown = Boolean(data.down);
    }

    if (data.attack) {
      // Determine attack variant based on direction
      if (f.inputDown && !f.grounded) {
        this.triggerAttack(f, 'dair'); // Down-Air Meteor Spike
      } else if (f.inputLeft || f.inputRight) {
        this.triggerAttack(f, 'fsmash'); // Heavy Forward Smash
      } else {
        this.triggerAttack(f, 'jab'); // Rapid Jab
      }
    }

    if (data.special) {
      if (f.inputUp || !f.grounded) {
        this.triggerUpBRecovery(f); // Up-B Recovery Special
      } else {
        this.triggerSpecial(f); // Character Signature Projectile
      }
    }

    if (data.shield !== undefined) {
      f.inputShield = Boolean(data.shield);
    }
  }

  triggerJump(f) {
    if (f.hitstun > 0 || f.isShielding || f.shieldBroken) return;

    // Ledge jump
    if (f.isHanging) {
      f.isHanging = false;
      f.vy = -12.5;
      f.vx = f.facing * 4;
      this.createSmoke(f.x, f.y, 4);
      return;
    }

    if (f.grounded) {
      f.vy = -13.0;
      f.grounded = false;
      f.jumpsLeft = f.maxJumps - 1;
      this.createSmoke(f.x, f.y + f.h / 2, 4);
      if (window.soundEngine) soundEngine.playMarioWalk();
    } else if (f.jumpsLeft > 0) {
      // Double Jump with expanding energy ring
      f.vy = -11.8;
      f.jumpsLeft--;
      this.createDoubleJumpRing(f.x, f.y + f.h / 2);
      if (window.soundEngine) soundEngine.playCelebrationJump();
    }
  }

  // Up-B Recovery Move (Super Mario / Fox style rising recovery uppercut)
  triggerUpBRecovery(f) {
    if (f.attackCooldown > 0 || f.hitstun > 0 || f.isShielding || f.shieldBroken) return;
    f.attackType = 'up_b';
    f.attackTimer = 22;
    f.attackCooldown = 40;

    // Launch upwards with directional drift!
    f.vy = -15.5;
    f.vx = (f.inputLeft ? -4 : (f.inputRight ? 4 : f.facing * 2.5));
    f.grounded = false;
    f.isHanging = false;

    if (window.soundEngine) soundEngine.playLevelStartFanfare();

    // Spawn rising flame & energy particles
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: f.x + (Math.random() - 0.5) * 20,
        y: f.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 50,
        vy: Math.random() * 60 + 30,
        color: f.teamColor === '#3b82f6' ? '#38bdf8' : '#f97316',
        size: 5 + Math.random() * 5,
        life: 0.55
      });
    }

    // Up-B multi-hit hitbox
    this.checkHitbox(f, f.x, f.y - 20, 36, 12, 11);
  }

  triggerAttack(f, type = 'jab') {
    if (f.attackCooldown > 0 || f.hitstun > 0 || f.isShielding || f.shieldBroken) return;
    f.attackType = type;
    f.attackTimer = type === 'fsmash' ? 20 : (type === 'dair' ? 16 : 10);
    f.attackCooldown = type === 'fsmash' ? 26 : (type === 'dair' ? 22 : 14);

    if (window.soundEngine) soundEngine.playStep();

    let hitX = f.x + f.facing * 34;
    let hitY = f.y;
    let hitRadius = 24;
    let damage = 8;
    let baseKnock = 7;

    if (type === 'fsmash') {
      // Forward Smash (heavy punch)
      hitX = f.x + f.facing * 42;
      hitRadius = 38;
      damage = 18 + Math.random() * 4;
      baseKnock = 14;
    } else if (type === 'dair') {
      // Down-Air Meteor Spike
      hitX = f.x;
      hitY = f.y + 36;
      hitRadius = 30;
      damage = 14;
      baseKnock = 12;
    }

    this.checkHitbox(f, hitX, hitY, hitRadius, damage, baseKnock, type === 'dair');
  }

  triggerSpecial(f) {
    if (f.specialCooldown > 0 || f.hitstun > 0 || f.isShielding || f.shieldBroken) return;
    f.attackType = 'special';
    f.attackTimer = 16;
    f.specialCooldown = 45; // 0.75s

    const charPreset = (f.avatar?.id || f.name || '').toLowerCase();
    let projectileType = 'energy_ball';
    let icon = '⚡';
    let speed = 10.5;
    let damage = 12;

    if (charPreset.includes('manu')) {
      projectileType = 'mandarina';
      icon = '🍊';
      damage = 13;
    } else if (charPreset.includes('asier')) {
      projectileType = 'eneryeti';
      icon = '⚡';
      speed = 13.0;
      damage = 14;
    } else if (charPreset.includes('adriachi')) {
      projectileType = 'air_jordan';
      icon = '👟';
      speed = 12.0;
      damage = 15;
    } else if (charPreset.includes('dj')) {
      projectileType = 'bass_drop';
      icon = '🥗';
      damage = 12;
    } else if (charPreset.includes('ayrton')) {
      projectileType = 'crazy_tongue';
      icon = '🤪';
      speed = 11.0;
      damage = 14;
    } else if (charPreset.includes('marta')) {
      projectileType = 'brat_cap';
      icon = '🧢';
      damage = 12;
    } else if (charPreset.includes('alel')) {
      projectileType = 'spain_ball';
      icon = '⚽';
      speed = 12.5;
      damage = 14;
    } else if (charPreset.includes('yago')) {
      projectileType = 'rgb_keyboard';
      icon = '⌨️';
      speed = 13.0;
      damage = 15;
    } else if (charPreset.includes('hua')) {
      projectileType = 'anime_star';
      icon = '🌸';
      speed = 12.0;
      damage = 13;
    }

    if (window.soundEngine) soundEngine.playMarioCoin();

    this.projectiles.push({
      x: f.x + f.facing * 28,
      y: f.y - 4,
      vx: f.facing * speed,
      vy: 0,
      radius: 14,
      damage,
      ownerId: f.id,
      ownerTeam: f.team,
      icon,
      type: projectileType,
      life: 2.2
    });
  }

  checkHitbox(attacker, hx, hy, radius, damage, baseKnockback, isMeteor = false) {
    this.activeFighters.forEach(target => {
      if (target.id === attacker.id || target.team === attacker.team || target.stocks <= 0 || target.invulnerableTimer > 0) return;

      const dist = Math.hypot(target.x - hx, target.y - hy);
      if (dist < radius + target.w / 2) {
        // Check Shielding
        if (target.isShielding && !target.shieldBroken) {
          target.shieldHp -= damage * 1.8;
          target.vx = attacker.facing * 3.5;
          target.shieldStun = 10;
          this.createSpark(hx, hy, '#facc15', 6);
          if (target.shieldHp <= 0) {
            // SHIELD BREAK!
            this.breakShield(target);
          }
          return;
        }

        // Apply Damage %
        target.damagePercent = Math.min(999, Math.round(target.damagePercent + damage));
        target.hitstun = Math.min(35, Math.round(10 + target.damagePercent * 0.12));

        // Floating combat texts
        if (isMeteor) {
          this.addFloatingText('¡METEOR SPIKE!', '#ef4444', 1.1, 1.4, target.x, target.y - 45);
        } else if (damage > 15) {
          this.addFloatingText('¡SMASH!', '#facc15', 1.0, 1.35, target.x, target.y - 40);
        } else if (target.damagePercent > 120) {
          this.addFloatingText('¡CRITICAL!', '#f87171', 0.9, 1.25, target.x, target.y - 35);
        }

        // Exponential Knockback formula: Base + Damage% * Scaling
        const knockScale = 0.08 + (target.damagePercent / 100) * 0.14;
        const totalKnock = (baseKnockback + target.damagePercent * knockScale);

        this.screenShake = Math.min(22, 5 + totalKnock * 0.6);

        if (isMeteor) {
          // Downward Meteor Spike!
          target.vx = (Math.random() - 0.5) * 4;
          target.vy = totalKnock * 1.25;
        } else {
          // Smash launch vector
          const launchAngle = attacker.attackType === 'up_b' ? -Math.PI / 2 : (attacker.facing === 1 ? -Math.PI / 4 : -3 * Math.PI / 4);
          target.vx = Math.cos(launchAngle) * totalKnock;
          target.vy = Math.sin(launchAngle) * totalKnock;
        }

        target.grounded = false;
        target.isHanging = false;

        // Visual Impact FX
        this.createImpactFlash(target.x, target.y, damage > 15 ? 42 : 28);
        this.createSpark(target.x, target.y, damage > 15 ? '#ef4444' : '#facc15', 12);

        if (damage > 15 && window.soundEngine) {
          soundEngine.playFirstBlood();
        } else if (window.soundEngine) {
          soundEngine.playBocina();
        }
      }
    });
  }

  breakShield(target) {
    target.isShielding = false;
    target.shieldBroken = true;
    target.shieldBreakTimer = 210; // ~3.5s dizzy stun
    target.shieldHp = 20;
    target.vy = -8.0;
    this.screenShake = 16;
    this.addFloatingText('¡SHIELD BREAK!', '#facc15', 1.2, 1.4, target.x, target.y - 45);

    if (window.soundEngine) soundEngine.playOhMyGod();

    // Glass Shatter Particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: target.x,
        y: target.y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color: '#fef08a',
        size: 4 + Math.random() * 4,
        life: 0.6
      });
    }
  }

  createImpactFlash(x, y, size) {
    this.particles.push({
      x,
      y,
      size,
      life: 1.0,
      decay: 0.08,
      type: 'impact_flash'
    });
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

  createSpark(x, y, color = '#facc15', count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        color,
        size: 3 + Math.random() * 4,
        life: 0.45
      });
    }
  }

  createSmoke(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 25,
        vy: -Math.random() * 20,
        color: '#cbd5e1',
        size: 5 + Math.random() * 4,
        life: 0.4
      });
    }
  }

  createDoubleJumpRing(x, y) {
    this.particles.push({
      x,
      y,
      radius: 8,
      maxRadius: 36,
      life: 1.0,
      decay: 0.06,
      type: 'jump_ring'
    });
  }

  update(dt) {
    if (!this.running) return;

    // Countdown
    if (this.gameState === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.gameState = 'brawl';
        if (window.soundEngine) soundEngine.playCelebrationJump();
      }
      return;
    }

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

    // Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 28);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 38;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      // Projectile hit detection
      const owner = this.activeFighters.find(f => f.id === p.ownerId);
      if (owner) {
        this.checkHitbox(owner, p.x, p.y, p.radius, p.damage, 9);
      }

      if (p.life <= 0 || p.x < this.stage.blastLeft || p.x > this.stage.blastRight) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      if (pt.vx) pt.x += pt.vx * dt;
      if (pt.vy) pt.y += pt.vy * dt;
      pt.life -= (pt.decay || dt);
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Update Fighters
    this.activeFighters.forEach(f => {
      if (f.stocks <= 0) return;

      // Respawning
      if (f.isRespawning) {
        f.respawnTimer -= dt;
        if (f.respawnTimer <= 0) {
          f.isRespawning = false;
          f.invulnerableTimer = 90; // 1.5s invulnerability
        }
        return;
      }

      if (f.invulnerableTimer > 0) f.invulnerableTimer--;
      if (f.attackCooldown > 0) f.attackCooldown--;
      if (f.specialCooldown > 0) f.specialCooldown--;
      if (f.attackTimer > 0) f.attackTimer--;

      // High Damage Danger Aura (> 100%)
      if (f.damagePercent >= 100 && Math.random() < 0.35) {
        this.particles.push({
          x: f.x + (Math.random() - 0.5) * 26,
          y: f.y + f.h / 2 - 4,
          vx: (Math.random() - 0.5) * 25,
          vy: -40 - Math.random() * 50,
          color: Math.random() < 0.6 ? '#ef4444' : '#f97316',
          size: 3 + Math.random() * 3,
          life: 0.45
        });
      }

      // Shield Break Dizziness
      if (f.shieldBroken) {
        f.shieldBreakTimer -= dt * 60;
        f.inputLeft = false;
        f.inputRight = false;
        f.inputShield = false;
        if (f.shieldBreakTimer <= 0) {
          f.shieldBroken = false;
          f.shieldHp = 60;
        }
      }

      // Shield Regen & Decay
      if (f.inputShield && !f.shieldBroken && f.grounded) {
        f.isShielding = true;
        f.shieldHp = Math.max(0, f.shieldHp - dt * 22);
        f.vx *= 0.8;
        if (f.shieldHp <= 0) this.breakShield(f);
      } else {
        f.isShielding = false;
        if (!f.shieldBroken && f.shieldHp < 100) {
          f.shieldHp = Math.min(100, f.shieldHp + dt * 14);
        }
      }

      // Ledge Hang
      if (f.isHanging) {
        f.hangTimer -= dt * 60;
        f.vx = 0;
        f.vy = 0;
        if (f.hangTimer <= 0) f.isHanging = false; // Must act or fall off!
        return;
      }

      // Hitstun Stagger
      if (f.hitstun > 0) {
        f.hitstun--;
        // Gravity still applies
        f.vy += 0.52;
        f.x += f.vx;
        f.y += f.vy;
        this.checkStageCollisions(f);
        this.checkBlastZones(f);
        return;
      }

      // Bot AI
      if (f.isBot) {
        this.updateBotAI(f, dt);
      }

      // Horizontal Run & Drift
      if (!f.isShielding && !f.shieldBroken) {
        if (f.inputLeft) {
          f.vx = Math.max(-5.8, f.vx - 0.75);
          f.facing = -1;
        } else if (f.inputRight) {
          f.vx = Math.min(5.8, f.vx + 0.75);
          f.facing = 1;
        } else {
          f.vx *= f.grounded ? 0.82 : 0.94;
        }
      }

      // Gravity
      f.vy += 0.55;
      if (f.vy > 14.0) f.vy = 14.0; // Terminal fall velocity

      // Move
      f.x += f.vx;
      f.y += f.vy;

      // Platform & Ledge Collisions
      this.checkStageCollisions(f);
      this.checkLedgeSnap(f);
      this.checkBlastZones(f);
    });

    this.updateCamera();
    this.checkHeatStatus();
  }

  checkStageCollisions(f) {
    const m = this.stage.main;
    const feetY = f.y + f.h / 2;

    // Main Stage Solid Top
    if (f.x >= m.x - 10 && f.x <= m.x + m.w + 10) {
      if (feetY >= m.y && f.y <= m.y + 15 && f.vy >= 0) {
        f.y = m.y - f.h / 2;
        f.vy = 0;
        f.grounded = true;
        f.jumpsLeft = f.maxJumps;
        return;
      }
    }

    // Soft Upper Platforms (Pass-through from below, drop through with Down)
    f.grounded = false;
    if (f.dropThroughTimer > 0) {
      f.dropThroughTimer--;
    } else {
      this.stage.platforms.forEach(plat => {
        if (f.x >= plat.x - 12 && f.x <= plat.x + plat.w + 12) {
          if (feetY >= plat.y && feetY <= plat.y + plat.h + 8 && f.vy >= 0) {
            f.y = plat.y - f.h / 2;
            f.vy = 0;
            f.grounded = true;
            f.jumpsLeft = f.maxJumps;
          }
        }
      });
    }
  }

  checkLedgeSnap(f) {
    if (f.grounded || f.isHanging || f.vy <= 0) return;

    this.stage.ledges.forEach(ledge => {
      const dist = Math.hypot(f.x - ledge.x, (f.y - f.h / 2) - ledge.y);
      if (dist < 26) {
        // Snap to ledge!
        f.isHanging = true;
        f.hangTimer = 45; // 0.75s invulnerable hang
        f.x = ledge.x + (ledge.side === 'left' ? -12 : 12);
        f.y = ledge.y + 18;
        f.vx = 0;
        f.vy = 0;
        f.facing = ledge.side === 'left' ? 1 : -1;
        f.jumpsLeft = f.maxJumps;
        this.createSmoke(f.x, f.y, 4);
      }
    });
  }

  checkBlastZones(f) {
    const b = this.stage;
    if (f.x < b.blastLeft || f.x > b.blastRight || f.y < b.blastTop || f.y > b.blastBottom) {
      // K.O.! BLAST EXPLOSION!
      f.stocks--;
      this.screenShake = 24;

      if (window.soundEngine) soundEngine.playDeathSound(true);

      // Massive Blast Screen-Edge Particle Explosion
      this.createBlastExplosion(f.x, f.y, f.teamColor);
      const clampX = Math.max(80, Math.min(this.width - 80, f.x));
      const clampY = Math.max(80, Math.min(this.height - 80, f.y));
      this.addFloatingText('¡K.O.!', '#ef4444', 1.5, 2.2, clampX, clampY);

      if (f.stocks > 0) {
        // Respawn Angel Cloud
        f.isRespawning = true;
        f.respawnTimer = 2.0;
        f.x = 640 + (f.team === 'teamA' ? -120 : 120);
        f.y = 280;
        f.vx = 0;
        f.vy = 0;
        f.damagePercent = 0;
      }
    }
  }

  createBlastExplosion(x, y, color) {
    // Clamp to visible edge for dramatic screen-edge explosion
    const clampX = Math.max(30, Math.min(this.width - 30, x));
    const clampY = Math.max(30, Math.min(this.height - 30, y));

    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: clampX,
        y: clampY,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.5) * 260,
        color: i % 2 === 0 ? color : '#facc15',
        size: 6 + Math.random() * 8,
        life: 0.8
      });
    }
  }

  checkHeatStatus() {
    const teamAAlive = this.activeFighters.filter(p => p.team === 'teamA' && p.stocks > 0).length;
    const teamBAlive = this.activeFighters.filter(p => p.team === 'teamB' && p.stocks > 0).length;

    if (teamAAlive === 0 || teamBAlive === 0) {
      this.gameState = 'heat_over';
      this.heatOverTimer = 3.0;

      if (teamAAlive > 0) this.teamScores.teamA += 100;
      else if (teamBAlive > 0) this.teamScores.teamB += 100;

      if (window.soundEngine) soundEngine.playCelebrationJump();
    }
  }

  resolveMatchWinner() {
    this.gameState = 'victory';
    this.winningTeam = this.teamScores.teamA >= this.teamScores.teamB ? 'teamA' : 'teamB';

    if (window.soundEngine) soundEngine.playSocialCreditVictory();

    setTimeout(() => {
      this.onComplete({
        gameType: 'brawler',
        winningTeam: this.winningTeam,
        scores: this.teamScores,
        players: this.allPlayers.map(p => ({
          id: p.id,
          score: p.team === this.winningTeam ? 100 : 25
        }))
      });
    }, 4500);
  }

  updateBotAI(f, dt) {
    const opponents = this.activeFighters.filter(p => p.team !== f.team && p.stocks > 0 && !p.isRespawning);
    if (opponents.length === 0) return;

    let nearest = opponents[0];
    let minDist = Infinity;
    opponents.forEach(op => {
      const d = Math.hypot(op.x - f.x, op.y - f.y);
      if (d < minDist) {
        minDist = d;
        nearest = op;
      }
    });

    // Ledge recovery
    if (f.isHanging) {
      if (Math.random() < 0.08) this.triggerJump(f);
      return;
    }

    // Off-stage recovery: Up-B Special or jump towards center
    const m = this.stage.main;
    const isOffstage = f.x < m.x - 25 || f.x > m.x + m.w + 25 || f.y > m.y + 40;
    if (isOffstage) {
      f.inputLeft = f.x > 640;
      f.inputRight = f.x < 640;
      if (f.vy > 1.2 && f.jumpsLeft > 0) {
        this.triggerJump(f);
      } else if (f.vy > 2.5 && f.jumpsLeft === 0) {
        this.triggerUpBRecovery(f);
      }
      return;
    }

    // Combat approach & combat moves
    const dx = nearest.x - f.x;
    const dy = nearest.y - f.y;

    f.inputLeft = dx < -28;
    f.inputRight = dx > 28;

    if (dy < -60 && f.grounded && Math.random() < 0.06) {
      this.triggerJump(f);
    }

    if (dy > 60 && Math.random() < 0.06) {
      f.dropThroughTimer = 18;
    }

    if (Math.abs(dx) < 65 && Math.abs(dy) < 45) {
      if (Math.random() < 0.08) {
        this.triggerAttack(f, Math.random() < 0.4 ? 'fsmash' : 'jab');
      } else if (Math.random() < 0.04) {
        this.triggerSpecial(f);
      }
    } else if (Math.abs(dx) > 130 && Math.random() < 0.03) {
      this.triggerSpecial(f);
    }
  }

  updateCamera() {
    const fighters = this.activeFighters.filter(p => p.stocks > 0 && !p.isRespawning);
    if (fighters.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    fighters.forEach(f => {
      if (f.x < minX) minX = f.x;
      if (f.x > maxX) maxX = f.x;
      if (f.y < minY) minY = f.y;
      if (f.y > maxY) maxY = f.y;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const spanX = Math.max(740, maxX - minX + 280);
    const spanY = Math.max(480, maxY - minY + 220);

    const zoomX = this.width / spanX;
    const zoomY = this.height / spanY;
    const targetZoom = Math.max(0.78, Math.min(1.15, Math.min(zoomX, zoomY)));

    this.camera.x += (centerX - this.camera.x) * 0.09;
    this.camera.y += (centerY - this.camera.y) * 0.09;
    this.camera.zoom += (targetZoom - this.camera.zoom) * 0.09;
  }

  // ================= RENDERING =================

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();

    // Screen Shake
    if (this.screenShake > 0.4) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Celestial Space Nebula & Parallax Stars
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.4, '#0f172a');
    skyGrad.addColorStop(0.75, '#1e1b4b');
    skyGrad.addColorStop(1, '#3b0764');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Starfield
    ctx.fillStyle = '#ffffff';
    this.stars.forEach(st => {
      st.x = (st.x + st.speed) % this.width;
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });

    // Camera Transform for World Objects
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 2. Draw Floating Battlefield Island
    this.renderBattlefieldStage(ctx);

    // 3. Draw Projectiles
    this.renderProjectiles(ctx);

    // 4. Draw Particles (Smoke, Sparks, Jump Rings)
    this.renderParticles(ctx);

    // 5. Draw Active Fighters
    this.renderFighters(ctx);

    // 6. Draw World Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      const alpha = Math.max(0, ft.life / ft.duration);
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(24 * ft.scale)}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#020617';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore(); // Restore camera transform

    // 7. Draw Smash HUD (Damage % dials, stocks, team scores & heat info)
    this.renderHUD(ctx);

    // 7. Overlays
    if (this.gameState === 'countdown') {
      this.renderCountdownOverlay(ctx);
    } else if (this.gameState === 'heat_over') {
      this.renderHeatOverOverlay(ctx);
    } else if (this.gameState === 'victory') {
      this.renderVictoryOverlay(ctx);
    }

    ctx.restore();
  }

  renderBattlefieldStage(ctx) {
    const m = this.stage.main;

    // Rock Island Underside (Ancient polygonal rock)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(m.x, m.y + m.h);
    ctx.lineTo(m.x + 60, m.y + m.h + m.undersideH * 0.7);
    ctx.lineTo(m.x + m.w / 2, m.y + m.h + m.undersideH);
    ctx.lineTo(m.x + m.w - 60, m.y + m.h + m.undersideH * 0.7);
    ctx.lineTo(m.x + m.w, m.y + m.h);
    ctx.closePath();

    const rockGrad = ctx.createLinearGradient(0, m.y, 0, m.y + m.undersideH + m.h);
    rockGrad.addColorStop(0, '#334155');
    rockGrad.addColorStop(0.6, '#1e293b');
    rockGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = rockGrad;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Floating Power Crystal beneath stage (pulsing glow)
    const pulse = 10 + Math.sin(performance.now() * 0.005) * 4;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = pulse + 8;
    ctx.beginPath();
    ctx.moveTo(m.x + m.w / 2, m.y + m.h + m.undersideH - 12);
    ctx.lineTo(m.x + m.w / 2 - 16, m.y + m.h + m.undersideH + 32);
    ctx.lineTo(m.x + m.w / 2 + 16, m.y + m.h + m.undersideH + 32);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Main Stage Surface (Stone slab with lush green grass)
    ctx.fillStyle = '#475569';
    ctx.fillRect(m.x, m.y, m.w, m.h);

    ctx.fillStyle = '#22c55e'; // Green grass
    ctx.beginPath();
    ctx.roundRect(m.x, m.y, m.w, 14, [6, 6, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ledge indicators
    ctx.fillStyle = '#eab308';
    ctx.fillRect(m.x - 2, m.y, 4, 14);
    ctx.fillRect(m.x + m.w - 2, m.y, 4, 14);

    // 3 Soft Upper Platforms
    this.stage.platforms.forEach(p => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      ctx.stroke();

      // Top glowing energy line
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(p.x + 4, p.y + 1, p.w - 8, 3);
    });

    ctx.restore();
  }

  renderProjectiles(ctx) {
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon || '⚡', 0, 0);
      ctx.restore();
    });
  }

  renderParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'jump_ring') {
        const r = (1.0 - p.life) * p.maxRadius + p.radius;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'impact_flash') {
        const rad = p.size * (1.0 - p.life * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 18;
        // Comic action starburst
        ctx.beginPath();
        const spikes = 8;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? rad : rad * 0.45;
          const a = (i * Math.PI) / spikes;
          const sx = p.x + Math.cos(a) * r;
          const sy = p.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color || '#facc15';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderFighters(ctx) {
    this.activeFighters.forEach(f => {
      if (f.stocks <= 0) return;

      ctx.save();
      ctx.translate(f.x, f.y);

      // Respawning Angel Cloud
      if (f.isRespawning) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      // Invulnerability halo
      if (f.invulnerableTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Shadow
      if (f.grounded) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, f.h / 2 + 2, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Facing scale
      ctx.scale(f.facing, 1);

      // Bubble Shield 🟡
      if (f.isShielding && !f.shieldBroken) {
        const shieldSize = 22 + (f.shieldHp / 100) * 14;
        const shieldGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, shieldSize);
        shieldGrad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
        shieldGrad.addColorStop(0.85, 'rgba(234, 179, 8, 0.65)');
        shieldGrad.addColorStop(1, 'rgba(253, 224, 71, 0.9)');
        ctx.fillStyle = shieldGrad;
        ctx.beginPath();
        ctx.arc(0, 0, shieldSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Shield Break Dizzy Stars 💫
      if (f.shieldBroken) {
        const starAng = performance.now() * 0.006;
        for (let s = 0; s < 3; s++) {
          const a = starAng + (s * Math.PI * 2) / 3;
          const sx = Math.cos(a) * 22;
          const sy = -f.h / 2 - 12 + Math.sin(a) * 6;
          ctx.font = '14px Arial';
          ctx.fillText('💫', sx, sy);
        }
      }

      // Hitstun Stagger Shake
      if (f.hitstun > 0) {
        ctx.rotate((Math.random() - 0.5) * 0.35);
      }

      // Danger Flame Aura (> 100%)
      if (f.damagePercent >= 100) {
        ctx.save();
        const firePulse = 8 + Math.sin(performance.now() * 0.015) * 4;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = firePulse + 10;
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.strokeRect(-28, -f.h / 2 - 4, 56, 56);
        ctx.restore();
      }

      // Avatar Sprite
      const avatarImg = this.avatarImages[f.id];
      if (avatarImg && avatarImg.complete) {
        ctx.drawImage(avatarImg, -28, -f.h / 2 - 4, 56, 56);
      } else {
        ctx.fillStyle = f.teamColor;
        ctx.beginPath();
        ctx.roundRect(-16, -24, 32, 48, 8);
        ctx.fill();
      }

      // Attack Swipe Slash Arc
      if (f.attackTimer > 0) {
        ctx.save();
        ctx.shadowColor = f.attackType === 'fsmash' ? '#facc15' : '#38bdf8';
        ctx.shadowBlur = 16;
        ctx.fillStyle = f.attackType === 'fsmash' ? '#fde047' : '#e0f2fe';
        ctx.beginPath();
        const rOuter = f.attackType === 'fsmash' ? 36 : 24;
        const rInner = f.attackType === 'fsmash' ? 14 : 8;
        ctx.arc(18, 0, rOuter, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.arc(18, 0, rInner, Math.PI / 2.5, -Math.PI / 2.5, true);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // Restore facing

      // Player Name & Percentage Tag
      ctx.save();
      ctx.translate(f.x, f.y - f.h / 2 - 20);
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';

      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      const textW = ctx.measureText(f.name).width;
      ctx.fillRect(-textW / 2 - 6, -12, textW + 12, 16);

      ctx.fillStyle = f.teamColor === '#3b82f6' ? '#93c5fd' : '#fca5a5';
      ctx.fillText(f.name, 0, 0);

      // Percentage
      ctx.font = 'bold 16px monospace';
      const pctColor = f.damagePercent < 50 ? '#ffffff' : (f.damagePercent < 110 ? '#facc15' : '#ef4444');
      ctx.fillStyle = pctColor;
      ctx.fillText(`${f.damagePercent}%`, 0, -14);

      ctx.restore();
    });
  }

  renderHUD(ctx) {
    // Top Bar: Tournament Heat & Team Scores
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 220, 16, 440, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`RONDA ${this.currentHeatIndex + 1} / ${this.heats.length} (BRAWL POR EQUIPOS)`, this.width / 2, 34);

    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(`AZUL: ${this.teamScores.teamA} PTS`, this.width / 2 - 110, 52);
    ctx.fillStyle = '#f87171';
    ctx.fillText(`ROJO: ${this.teamScores.teamB} PTS`, this.width / 2 + 110, 52);

    // Bottom Smash Fighter Dials
    const dialW = 160;
    const dialH = 74;
    const totalW = this.activeFighters.length * (dialW + 16);
    const startX = Math.max(24, (this.width - totalW) / 2);
    const startY = this.height - dialH - 18;

    this.activeFighters.forEach((f, idx) => {
      const x = startX + idx * (dialW + 16);
      const y = startY;

      ctx.save();
      if (f.damagePercent >= 100 && f.stocks > 0) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10 + Math.sin(performance.now() * 0.01) * 6;
      }
      ctx.fillStyle = f.stocks <= 0 ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = f.damagePercent >= 100 && f.stocks > 0 ? '#ef4444' : f.teamColor;
      ctx.lineWidth = f.damagePercent >= 100 && f.stocks > 0 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y, dialW, dialH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const avatarImg = this.avatarImages[f.id];
      if (avatarImg && avatarImg.complete) {
        ctx.drawImage(avatarImg, x + 8, y + 10, 48, 48);
      }

      ctx.fillStyle = f.teamColor === '#3b82f6' ? '#93c5fd' : '#fca5a5';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(f.name, x + 62, y + 24);

      const pctColor = f.damagePercent < 50 ? '#f8fafc' : (f.damagePercent < 110 ? '#facc15' : '#ef4444');
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = pctColor;
      ctx.fillText(`${f.damagePercent}%${f.damagePercent >= 100 ? ' 🔥' : ''}`, x + 62, y + 50);

      ctx.font = '12px Arial';
      let stockStr = '';
      for (let s = 0; s < f.stocks; s++) stockStr += '❤️ ';
      ctx.fillText(stockStr || '💀 FUERA', x + 62, y + 66);
    });

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
      ctx.font = 'bold 90px Arial';
      ctx.fillStyle = remaining === 3 ? '#ef4444' : (remaining === 2 ? '#eab308' : '#22c55e');
      ctx.fillText(remaining, this.width / 2, this.height / 2 - 20);
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`¡RONDA ${this.currentHeatIndex + 1}: LISTOS PARA LUCHAR!`, this.width / 2, this.height / 2 + 60);
    } else {
      ctx.font = 'bold 90px Arial';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('¡YA!', this.width / 2, this.height / 2);
    }
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
    ctx.fillText(`💥 ¡RONDA ${this.currentHeatIndex + 1} COMPLETADA! 💥`, this.width / 2, this.height / 2 - 40);

    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Cargando siguiente ronda de combatientes...', this.width / 2, this.height / 2 + 30);
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
    ctx.fillText('💥 ¡TORNEO SMASH BROS FINALIZADO! 💥', this.width / 2, this.height / 2 - 90);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = winnerColor;
    ctx.fillText(`🏆 ¡VICTORIA DEL ${winnerName}!`, this.width / 2, this.height / 2 - 10);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Volviendo al mapa overworld de New Super Mario Bros...', this.width / 2, this.height / 2 + 60);

    ctx.restore();
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

window.SuperSmashEngine = SuperSmashEngine;
