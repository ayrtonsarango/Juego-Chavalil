/**
 * LOBBY ROOM - 2D INTERACTIVE WAITING ROOM (SALA)
 * Permite a los chavales que ya están listos moverse libremente, saltar
 * sobre el sofá, la máquina recreativa y plataformas mientras esperan.
 */

(function(window) {
  'use strict';

  let stageEl = null;
  let emptyStateEl = null;
  let readyBadgeEl = null;
  let isRunning = false;
  let animFrameId = null;
  let lastTime = performance.now();

  let stageWidth = 1200;
  let stageHeight = 700;
  let floorY = 620;

  // Active ready players on stage: Map<playerId, PlayerEntity>
  const playersMap = new Map();

  // Scenery Platforms (One-way jumpable platforms)
  let platforms = [];

  const PLAYER_COLOR_LABELS = ['P1 · AZUL', 'P2 · ROJO', 'P3 · VERDE', 'P4 · NARANJA', 'P5 · CIAN', 'P6 · MORADO', 'P7 · LIMA', 'P8 · ROSA'];
  const PLAYER_COLOR_CLASSES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];

  function init(stageSelector = '#lobby-room-stage') {
    stageEl = document.querySelector(stageSelector);
    if (!stageEl) return;

    emptyStateEl = document.getElementById('lounge-empty-state');
    readyBadgeEl = document.getElementById('lounge-ready-badge');

    setupScenery();
    updateDimensions();

    window.addEventListener('resize', () => {
      updateDimensions();
    });

    start();
  }

  function setupScenery() {
    if (!stageEl) return;
    // Clear any previous scenery props if re-initializing
    const oldProps = stageEl.querySelectorAll('.room-prop, .room-backdrop-element');
    oldProps.forEach(el => el.remove());

    // 1. Party Bunting Banner (Guirnaldas colgantes en el techo)
    const bunting = document.createElement('div');
    bunting.className = 'room-prop room-prop-bunting';
    bunting.innerHTML = `
      <div class="bunting-flags">
        <span class="flag f-cyan">★</span>
        <span class="flag f-yellow">●</span>
        <span class="flag f-pink">★</span>
        <span class="flag f-green">▲</span>
        <span class="flag f-orange">★</span>
        <span class="flag f-cyan">●</span>
        <span class="flag f-purple">★</span>
        <span class="flag f-yellow">▲</span>
        <span class="flag f-pink">★</span>
        <span class="flag f-green">●</span>
      </div>
    `;
    stageEl.appendChild(bunting);

    // 2. Arcade Machine Cabinet (Esquina derecha)
    const arcade = document.createElement('div');
    arcade.className = 'room-prop room-prop-arcade';
    arcade.id = 'room-prop-arcade';
    arcade.innerHTML = `
      <div class="arcade-top-marquee">CHAVALIL ARCADE</div>
      <div class="arcade-screen-box">
        <div class="arcade-screen-crt">
          <div class="crt-pixel-game">👾 1UP 🪙</div>
        </div>
      </div>
      <div class="arcade-control-panel">
        <div class="arcade-stick"></div>
        <div class="arcade-buttons">
          <span class="btn-dot dot-red"></span>
          <span class="btn-dot dot-blue"></span>
          <span class="btn-dot dot-yellow"></span>
        </div>
      </div>
      <div class="arcade-coin-door">🪙 25¢</div>
    `;
    stageEl.appendChild(arcade);

    // 3. Cozy Party Couch / Sofa (Esquina izquierda)
    const sofa = document.createElement('div');
    sofa.className = 'room-prop room-prop-sofa';
    sofa.id = 'room-prop-sofa';
    sofa.innerHTML = `
      <div class="sofa-backrest">
        <div class="sofa-cushion c-left">🛋️</div>
        <div class="sofa-cushion c-right">⭐</div>
      </div>
      <div class="sofa-seat"></div>
      <div class="sofa-armrest arm-left"></div>
      <div class="sofa-armrest arm-right"></div>
    `;
    stageEl.appendChild(sofa);

    // 4. Floating Candy Shelf / Trophy Platform (Centro elevado)
    const shelf = document.createElement('div');
    shelf.className = 'room-prop room-prop-shelf';
    shelf.id = 'room-prop-shelf';
    shelf.innerHTML = `
      <div class="shelf-plank">
        <div class="shelf-props">
          <span class="shelf-item trophy-item" title="Copa Chavalil">🏆</span>
          <span class="shelf-item boombox-item" title="Radio Beat">📻</span>
          <span class="shelf-item drink-item" title="Refresco">🥤</span>
        </div>
      </div>
    `;
    stageEl.appendChild(shelf);

    // 5. Floor Board
    const floor = document.createElement('div');
    floor.className = 'room-prop room-prop-floor';
    floor.id = 'room-prop-floor';
    stageEl.appendChild(floor);
  }

  function updateDimensions() {
    if (!stageEl) return;
    stageWidth = stageEl.clientWidth || 1200;
    stageHeight = stageEl.clientHeight || 700;
    floorY = stageHeight - 75; // Character feet alignment on floor

    // Platform bounding boxes:
    // 1. Sofa backrest:
    const sofaW = 240;
    const sofaH = 110;
    const sofaX = 60;
    const sofaPlatY = floorY - 55;

    // 2. Arcade machine top / panel:
    const arcadeW = 150;
    const arcadeX = stageWidth - arcadeW - 60;
    const arcadePlatY = floorY - 130;

    // 3. Center Shelf:
    const shelfW = Math.min(320, stageWidth * 0.28);
    const shelfX = (stageWidth / 2) - (shelfW / 2);
    const shelfPlatY = floorY - 145;

    platforms = [
      { id: 'sofa', x1: sofaX - 10, x2: sofaX + sofaW + 10, y: sofaPlatY },
      { id: 'arcade', x1: arcadeX - 10, x2: arcadeX + arcadeW + 10, y: arcadePlatY },
      { id: 'shelf', x1: shelfX - 10, x2: shelfX + shelfW + 10, y: shelfPlatY }
    ];

    // Position CSS props dynamically if needed
    const arcadeEl = document.getElementById('room-prop-arcade');
    if (arcadeEl) {
      arcadeEl.style.right = '60px';
      arcadeEl.style.bottom = '75px';
    }
    const sofaEl = document.getElementById('room-prop-sofa');
    if (sofaEl) {
      sofaEl.style.left = '60px';
      sofaEl.style.bottom = '75px';
    }
    const shelfEl = document.getElementById('room-prop-shelf');
    if (shelfEl) {
      shelfEl.style.left = `${shelfX}px`;
      shelfEl.style.width = `${shelfW}px`;
      shelfEl.style.bottom = `${floorY - shelfPlatY + 75}px`;
    }
  }

  function start() {
    if (isRunning) return;
    updateDimensions();
    isRunning = true;
    lastTime = performance.now();
    animFrameId = requestAnimationFrame(loop);
  }

  function stop() {
    isRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // Synchronize players with server state
  function syncPlayers(players = []) {
    if (!stageEl) return;
    updateDimensions();

    const readyPlayers = players.filter(p => p.ready);
    const readyIds = new Set(readyPlayers.map(p => p.id));

    // Remove players who are no longer ready or disconnected
    for (const [id, entity] of playersMap.entries()) {
      if (!readyIds.has(id)) {
        removePlayerEntity(id);
      }
    }

    // Add or update ready players
    readyPlayers.forEach((p, idx) => {
      let entity = playersMap.get(p.id);
      if (!entity) {
        entity = createPlayerEntity(p, idx);
        playersMap.set(p.id, entity);
      } else {
        updatePlayerEntityData(entity, p, idx);
      }
    });

    // Update empty state banner
    if (emptyStateEl) {
      emptyStateEl.style.display = readyPlayers.length === 0 ? 'flex' : 'none';
    }
    if (readyBadgeEl) {
      readyBadgeEl.textContent = `${readyPlayers.length} LISTOS`;
    }
  }

  function createPlayerEntity(playerData, index) {
    const colorClass = PLAYER_COLOR_CLASSES[index % PLAYER_COLOR_CLASSES.length];
    const colorLabel = PLAYER_COLOR_LABELS[index % PLAYER_COLOR_LABELS.length];

    const entityEl = document.createElement('div');
    entityEl.className = `room-player-entity ${colorClass} ${playerData.isJ1 ? 'is-j1' : ''}`;
    entityEl.id = `room-player-${playerData.id}`;

    // Spawn X position: distribute across the room
    const padding = 160;
    const availableWidth = Math.max(300, stageWidth - (padding * 2));
    const spawnX = padding + (Math.random() * availableWidth);
    const spawnY = floorY; // Spawns directly on the floor

    // Render Avatar SVG
    const avatarSvg = window.renderAvatarSVG ? window.renderAvatarSVG(playerData.avatar, 105) : '';
    const hasPet = playerData.avatar && playerData.avatar.pet && playerData.avatar.pet !== 'none';
    const petSvg = hasPet && window.renderPetSVG ? window.renderPetSVG(playerData.avatar.pet, 38) : '';

    entityEl.innerHTML = `
      <div class="room-emote-bubble" style="display: none;"></div>
      <div class="room-nameplate">
        <span class="room-crown">${playerData.isJ1 ? '👑' : ''}</span>
        <span class="room-player-name">${escapeHtml(playerData.name)}</span>
        <span class="room-color-tag">${colorLabel}</span>
      </div>
      <div class="room-avatar-graphic">
        ${avatarSvg}
      </div>
      ${hasPet ? `<div class="room-pet-graphic">${petSvg}</div>` : ''}
    `;

    stageEl.appendChild(entityEl);

    // Sound effect on entrance
    if (window.soundEngine && typeof soundEngine.playSwoosh === 'function') {
      try { soundEngine.playSwoosh(); } catch (_) {}
    }

    const entity = {
      id: playerData.id,
      name: playerData.name,
      isJ1: playerData.isJ1,
      isBot: Boolean(playerData.isBot),
      avatar: playerData.avatar,
      x: spawnX,
      y: spawnY,
      prevY: spawnY,
      vx: 0,
      vy: 0,
      facing: Math.random() > 0.5 ? 1 : -1,
      onGround: true,
      isJumping: false,
      walkTimer: 0,
      squashTimer: 0,
      inputs: { left: false, right: false, jump: false },
      // Pet trailing physics
      pet: {
        x: spawnX,
        y: spawnY,
        hasPet: Boolean(hasPet)
      },
      // Autonomous bot AI state
      botAi: {
        nextDirChange: performance.now() + 1000 + Math.random() * 2000,
        nextJumpCheck: performance.now() + 1500 + Math.random() * 2500,
        currentDir: 0
      },
      dom: {
        entity: entityEl,
        avatarGraphic: entityEl.querySelector('.room-avatar-graphic'),
        bubble: entityEl.querySelector('.room-emote-bubble'),
        nameplate: entityEl.querySelector('.room-player-name'),
        crown: entityEl.querySelector('.room-crown'),
        pet: entityEl.querySelector('.room-pet-graphic')
      }
    };

    return entity;
  }

  function updatePlayerEntityData(entity, p, idx) {
    entity.name = p.name;
    entity.isJ1 = p.isJ1;
    entity.isBot = Boolean(p.isBot);

    if (entity.dom.nameplate) {
      entity.dom.nameplate.textContent = p.name;
    }
    if (entity.dom.crown) {
      entity.dom.crown.textContent = p.isJ1 ? '👑' : '';
    }
    if (p.isJ1) {
      entity.dom.entity.classList.add('is-j1');
    } else {
      entity.dom.entity.classList.remove('is-j1');
    }
  }

  function removePlayerEntity(id) {
    const entity = playersMap.get(id);
    if (!entity) return;

    // Poof exit animation
    entity.dom.entity.classList.add('is-poofing');
    setTimeout(() => {
      if (entity.dom.entity && entity.dom.entity.parentNode) {
        entity.dom.entity.parentNode.removeChild(entity.dom.entity);
      }
    }, 280);

    playersMap.delete(id);
  }

  // Handle incoming mobile lobby controller packet
  function handleInput(playerId, inputData) {
    const entity = playersMap.get(playerId);
    if (!entity || !inputData) return;

    if (typeof inputData.left === 'boolean') {
      entity.inputs.left = inputData.left;
    }
    if (typeof inputData.right === 'boolean') {
      entity.inputs.right = inputData.right;
    }
    if (typeof inputData.jump === 'boolean') {
      if (inputData.jump && !entity.inputs.jump && entity.onGround) {
        // Trigger jump impulse
        entity.vy = -640;
        entity.onGround = false;
        entity.isJumping = true;
        entity.squashTimer = 0.12;
        if (window.soundEngine && typeof soundEngine.playJump === 'function') {
          soundEngine.playJump();
        }
      }
      entity.inputs.jump = inputData.jump;
    }
  }

  // Trigger emote comic bubble above character
  function triggerEmote(playerId, emote, sound) {
    const entity = playersMap.get(playerId);
    if (!entity || !entity.dom.bubble) return;

    const bubble = entity.dom.bubble;
    bubble.innerHTML = `<span class="bubble-emoji">${emote || '📢'}</span><span class="bubble-sound">${escapeHtml(sound || '')}</span>`;
    bubble.style.display = 'flex';
    bubble.classList.remove('pop-out');
    bubble.classList.add('pop-in');

    clearTimeout(entity.bubbleTimeout);
    entity.bubbleTimeout = setTimeout(() => {
      bubble.classList.remove('pop-in');
      bubble.classList.add('pop-out');
      setTimeout(() => {
        bubble.style.display = 'none';
      }, 200);
    }, 2400);
  }

  // Main 60 FPS Physics Simulation Loop
  function loop(currentTime) {
    if (!isRunning) return;

    if (stageEl) {
      const curW = stageEl.clientWidth;
      const curH = stageEl.clientHeight;
      if (curW > 0 && curH > 0 && (Math.abs(curW - stageWidth) > 6 || Math.abs(curH - stageHeight) > 6)) {
        updateDimensions();
      }
    }

    const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // Cap max dt to 50ms
    lastTime = currentTime;

    const gravity = 1550; // px/s^2
    const moveSpeed = 290; // px/s

    for (const entity of playersMap.values()) {
      // 1. Autonomous AI for bots
      if (entity.isBot) {
        updateBotAI(entity, currentTime);
      }

      // 2. Horizontal Velocity
      let moveDir = 0;
      if (entity.inputs.left) moveDir -= 1;
      if (entity.inputs.right) moveDir += 1;

      entity.vx = moveDir * moveSpeed;
      if (moveDir !== 0) {
        entity.facing = moveDir > 0 ? 1 : -1;
        entity.walkTimer += dt * 13;
      } else {
        entity.walkTimer = 0;
      }

      // 3. Vertical Velocity & Gravity
      entity.prevY = entity.y;
      entity.vy += gravity * dt;

      // 4. Integrate Position
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;

      // 5. Stage Wall Bounds
      const halfW = 42;
      if (entity.x < halfW) {
        entity.x = halfW;
        entity.vx = 0;
      } else if (entity.x > stageWidth - halfW) {
        entity.x = stageWidth - halfW;
        entity.vx = 0;
      }

      // 6. Platform Collisions (One-way jumpable platforms)
      let landedOnPlatform = false;
      for (const plat of platforms) {
        // Landing condition: moving downward, was above platform in previous frame, now at or below platform
        if (entity.vy >= 0 &&
            entity.prevY <= plat.y + 4 &&
            entity.y >= plat.y &&
            entity.x >= plat.x1 &&
            entity.x <= plat.x2) {
          entity.y = plat.y;
          entity.vy = 0;
          entity.onGround = true;
          entity.isJumping = false;
          landedOnPlatform = true;
          break;
        }
      }

      // 7. Floor Collision
      if (!landedOnPlatform) {
        if (entity.y >= floorY) {
          entity.y = floorY;
          entity.vy = 0;
          entity.onGround = true;
          entity.isJumping = false;
        } else {
          entity.onGround = false;
        }
      }

      // 8. Visual Animations: Walk Bobbing & Jump Stretch
      let bobY = 0;
      let rotZ = 0;
      let scaleX = entity.facing;
      let scaleY = 1;

      if (entity.onGround) {
        if (moveDir !== 0) {
          bobY = Math.sin(entity.walkTimer) * 4;
          rotZ = Math.sin(entity.walkTimer) * 3 * entity.facing;
        }
      } else {
        // In air: squash & stretch
        if (entity.vy < 0) {
          scaleY = 1.1; // Stretching upward
          scaleX = entity.facing * 0.92;
        } else {
          scaleY = 0.95; // Preparing to land
          scaleX = entity.facing * 1.05;
        }
      }

      // Update DOM transform
      entity.dom.entity.style.transform = `translate3d(${Math.round(entity.x)}px, ${Math.round(entity.y)}px, 0)`;
      if (entity.dom.avatarGraphic) {
        entity.dom.avatarGraphic.style.transform = `scale(${scaleX}, ${scaleY}) translateY(${bobY}px) rotate(${rotZ}deg)`;
      }

      // 9. Pet Trailing Physics
      if (entity.pet.hasPet && entity.dom.pet) {
        const targetPetX = entity.x - (entity.facing * 44);
        const targetPetY = entity.y + 12;
        entity.pet.x += (targetPetX - entity.pet.x) * 0.16;
        entity.pet.y += (targetPetY - entity.pet.y) * 0.22;

        const petBob = moveDir !== 0 ? Math.sin(entity.walkTimer * 1.2) * 3 : 0;
        entity.dom.pet.style.transform = `translate3d(${Math.round(entity.pet.x - entity.x)}px, ${Math.round(entity.pet.y - entity.y + petBob)}px, 0) scaleX(${entity.facing})`;
      }
    }

    animFrameId = requestAnimationFrame(loop);
  }

  // Simple autonomous behavior for test bots
  function updateBotAI(entity, now) {
    if (now > entity.botAi.nextDirChange) {
      entity.botAi.nextDirChange = now + 1500 + Math.random() * 2500;
      const rand = Math.random();
      if (rand < 0.42) {
        entity.inputs.left = false;
        entity.inputs.right = true;
      } else if (rand < 0.84) {
        entity.inputs.left = true;
        entity.inputs.right = false;
      } else {
        entity.inputs.left = false;
        entity.inputs.right = false;
      }
    }

    if (now > entity.botAi.nextJumpCheck) {
      entity.botAi.nextJumpCheck = now + 1800 + Math.random() * 3000;
      if (entity.onGround && Math.random() < 0.35) {
        entity.vy = -620;
        entity.onGround = false;
        entity.isJumping = true;
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Export to global scope
  window.LobbyRoom = {
    init,
    start,
    stop,
    syncPlayers,
    handleInput,
    triggerEmote,
    getDebug: () => ({ stageWidth, stageHeight, floorY, platforms, players: Array.from(playersMap.values()).map(p => ({ id: p.id, x: p.x, y: p.y, vy: p.vy, onGround: p.onGround })) })
  };

})(window);
