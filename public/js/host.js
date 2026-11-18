/**
 * HOST CONTROLLER - PANTALLA PRINCIPAL
 * Gestiona el lobby, QR, vista del mapa Overworld con la piña de avatares, y minijuegos.
 */

const socket = io();
window.socket = socket;

// Node coordinates in percentage mapped directly onto the 3D golden ring pads of New Super Mario Bros
const MAP_NODE_POSITIONS = [
  { x: 47.4, y: 63.6, icon: '🌀', name: 'Mundo 1-1' }, // Mario 1-1 pad (Curvas)
  { x: 68.4, y: 62.7, icon: '🎯', name: 'Mundo 1-2' }, // Pad directly after wooden canyon bridge (Tank)
  { x: 89.3, y: 62.7, icon: '⚽', name: 'Mundo 1-3' }, // Pad at lower right near fence (Head Soccer)
  { x: 86.7, y: 49.5, icon: '💣', name: 'Mundo 1-4' }, // Pad near star mushroom house (Bomberman)
  { x: 66.1, y: 41.5, icon: '🥅', name: 'Mundo 1-5' }, // Pad in front of red mushroom house (HaxBall)
  { x: 45.8, y: 41.2, icon: '🏎️', name: 'Mundo 1-6' }, // Pad along northern plateau (Mario Kart)
  { x: 26.2, y: 38.5, icon: '💥', name: 'Castillo 1-7' } // Castle final platform (Super Smash Bros)
];

// Dirt path segments connecting adjacent nodes strictly on the visible dirt road:
const DIRT_PATH_SEGMENTS = {
  // 0 -> 1: From Mundo 1-1 across the wooden bridge to Mundo 1-2
  '0-1': [
    { x: 47.4, y: 63.6 },
    { x: 52.6, y: 63.3 },
    { x: 57.8, y: 63.0 },
    { x: 63.1, y: 62.8 },
    { x: 68.4, y: 62.7 }
  ],
  // 1 -> 2: Horizontal dirt road past wooden fence to Mundo 1-3
  '1-2': [
    { x: 68.4, y: 62.7 },
    { x: 73.6, y: 62.7 },
    { x: 78.8, y: 62.7 },
    { x: 84.0, y: 62.7 },
    { x: 89.3, y: 62.7 }
  ],
  // 2 -> 3: Dirt road curving UP around the berry bush towards Star House
  '2-3': [
    { x: 89.3, y: 62.7 },
    { x: 90.5, y: 59.8 },
    { x: 90.8, y: 56.4 },
    { x: 89.6, y: 53.0 },
    { x: 88.0, y: 50.8 },
    { x: 86.7, y: 49.5 }
  ],
  // 3 -> 4: Dirt road heading west along the plateau above the canyon towards Red Mushroom Castle
  '3-4': [
    { x: 86.7, y: 49.5 },
    { x: 82.5, y: 47.9 },
    { x: 78.4, y: 46.3 },
    { x: 74.3, y: 44.7 },
    { x: 70.2, y: 43.1 },
    { x: 66.1, y: 41.5 }
  ],
  // 4 -> 5: From Mundo 1-5 west along plateau to Mundo 1-6
  '4-5': [
    { x: 66.1, y: 41.5 },
    { x: 61.0, y: 41.4 },
    { x: 55.9, y: 41.3 },
    { x: 50.8, y: 41.2 },
    { x: 45.8, y: 41.2 }
  ],
  // 5 -> 6: From Mundo 1-6 west across castle bridge to Castillo 1-7
  '5-6': [
    { x: 45.8, y: 41.2 },
    { x: 40.9, y: 40.5 },
    { x: 36.0, y: 39.8 },
    { x: 31.1, y: 39.1 },
    { x: 26.2, y: 38.5 }
  ]
};

// Spatial offsets on the circular pad (Mario in front center, companions spread in natural arc)
function getSquadFormationOffset(idx, total = 1) {
  if (idx === 0) return { dx: 0, dy: -1.2, zIndex: 32 }; // Mario / J1 Leader (Front-Center)
  if (idx === 1) return { dx: -3.2, dy: -2.8, zIndex: 28 }; // Luigi (Left)
  if (idx === 2) return { dx: 3.2, dy: -2.8, zIndex: 28 };  // Yellow Toad (Right)
  if (idx === 3) return { dx: -1.8, dy: -4.6, zIndex: 24 }; // Blue Toad (Center-Left back)
  if (idx === 4) return { dx: 1.8, dy: -4.6, zIndex: 24 };  // 5th Chaval
  if (idx === 5) return { dx: -4.8, dy: -4.0, zIndex: 22 }; // 6th Chaval
  if (idx === 6) return { dx: 4.8, dy: -4.0, zIndex: 22 };  // 7th Chaval
  if (idx === 7) return { dx: 0, dy: -6.2, zIndex: 20 };    // 8th Chaval

  // If there are more than 8 players (big party or bots):
  const crowdIdx = idx - 8;
  const row = Math.floor(crowdIdx / 6) + 1;
  const col = crowdIdx % 6;
  const angle = (col / 5) * Math.PI;
  const radiusX = 6.2 + row * 2.2;
  const radiusY = 3.6 + row * 1.6;
  const dx = -Math.cos(angle) * radiusX;
  const dy = -4.5 - Math.sin(angle) * radiusY;
  const zIndex = Math.max(10, 20 - row * 3);
  return { dx, dy, zIndex };
}

let currentGameState = null;
let currentPlayers = [];
let currentPiñaNodeIndex = 0;
let isSquadMarching = false;
let marchAnimationReq = null;

// DOM Elements
const headerJoinUrl = document.getElementById('header-join-url');
const selectNetworkIp = document.getElementById('select-network-ip');
const headerPlayerCount = document.getElementById('header-player-count');
const lobbyQrImg = document.getElementById('lobby-qr-img');
const lobbyUrlSubtext = document.getElementById('lobby-url-subtext');
const lobbyPlayersGrid = document.getElementById('lobby-players-grid');
const lobbyReadyHint = document.getElementById('lobby-ready-hint');

// NSMB Map Elements
const nsmbNodesLayer = document.getElementById('nsmb-nodes-layer');
const nsmbSquadLayer = document.getElementById('nsmb-squad-layer');
const j1MapPrompt = document.getElementById('j1-map-prompt');
const nsmbStatusWorldTitle = document.getElementById('nsmb-status-world-title');
const btnHostEnterLevel = document.getElementById('btn-host-enter-level');

// NSMB Placard & Wii Buttons Elements
const nsmbWorldNum = document.getElementById('nsmb-world-num');
const starCoin1 = document.getElementById('star-coin-1');
const starCoin2 = document.getElementById('star-coin-2');
const starCoin3 = document.getElementById('star-coin-3');
const nsmbLivesCount = document.getElementById('nsmb-lives-count');
const nsmbLivesAvatar = document.getElementById('nsmb-lives-avatar');
const btnNsmbQuickAndroid = document.getElementById('btn-nsmb-quick-android');
const btnNsmbBot = document.getElementById('btn-nsmb-bot');
const btnNsmbGather = document.getElementById('btn-nsmb-gather');

// Cinematic Level Intro Splash Elements
const nsmbLevelIntroOverlay = document.getElementById('nsmb-level-intro-overlay');
const introWorldBadge = document.getElementById('intro-world-badge');
const introLevelTitle = document.getElementById('intro-level-title');
const introLevelLore = document.getElementById('intro-level-lore');
const introTeamsPreview = document.getElementById('intro-teams-preview');
const introCountdown = document.getElementById('intro-countdown');
let isLevelIntroPlaying = false;

// Minigame Elements
const minigameBannerTitle = document.getElementById('minigame-banner-title');
const minigameBannerLore = document.getElementById('minigame-banner-lore');
const listTeamA = document.getElementById('list-team-a');
const listTeamB = document.getElementById('list-team-b');
const countTeamA = document.getElementById('count-team-a');
const countTeamB = document.getElementById('count-team-b');
const btnCompleteMinigame = document.getElementById('btn-complete-minigame');

// Android Alert Modal
const androidAlertModal = document.getElementById('android-alert-modal');
const androidAlertText = document.getElementById('android-alert-text');
const btnDismissAndroidAlert = document.getElementById('btn-dismiss-android-alert');

// Admin Elements
const btnAdminAdd1Bot = document.getElementById('btn-admin-add-1-bot');
const btnAdminAdd4Bots = document.getElementById('btn-admin-add-4-bots');
const btnAdminTestAndroid = document.getElementById('btn-admin-test-android');
const btnAdminTestBench = document.getElementById('btn-admin-test-bench');
const btnAdminCycleJ1 = document.getElementById('btn-admin-cycle-j1');
const btnAdminReset = document.getElementById('btn-admin-reset');
const btnAdminStartGame = document.getElementById('btn-admin-start-game');

// 1. Fetch server & QR code info
async function initNetworkInfo(customIp) {
  try {
    const url = customIp ? `/api/info?ip=${encodeURIComponent(customIp)}` : '/api/info';
    const res = await fetch(url);
    const data = await res.json();
    headerJoinUrl.textContent = data.joinUrl;
    lobbyUrlSubtext.textContent = data.joinUrl;
    lobbyQrImg.src = data.qrDataUrl;

    if (data.availableIps && data.availableIps.length > 1) {
      selectNetworkIp.style.display = 'inline-block';
      selectNetworkIp.innerHTML = '';
      data.availableIps.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.ip;
        opt.textContent = `${item.ip} (${item.dev})`;
        if (item.ip === data.localIp) opt.selected = true;
        selectNetworkIp.appendChild(opt);
      });
      selectNetworkIp.onchange = (e) => {
        initNetworkInfo(e.target.value);
      };
    }
  } catch (err) {
    console.error('Error fetching network info', err);
  }
}

let activeMinigameEngine = null;

// 2. View Switcher
function switchView(viewName) {
  if (viewName !== 'minigame') {
    document.body.classList.remove('standalone-game-active');
    const standaloneHud = document.getElementById('standalone-arcade-hud');
    if (standaloneHud) standaloneHud.style.display = 'none';
    if (activeMinigameEngine) {
      activeMinigameEngine.stop();
      activeMinigameEngine = null;
    }
  }

  // Lobby 2D Lounge Room lifecycle
  if (viewName === 'lobby') {
    if (window.LobbyRoom && typeof LobbyRoom.start === 'function') {
      LobbyRoom.start();
    }
  } else {
    if (window.LobbyRoom && typeof LobbyRoom.stop === 'function') {
      LobbyRoom.stop();
    }
  }

  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const activeSec = document.getElementById(`view-${viewName}`);
  if (activeSec) {
    activeSec.classList.add('active');
  }
}

// 3. Render Lobby Players & 2D Lounge
function renderLobbyPlayers(players) {
  const readyPlayers = players.filter(p => p.ready);
  const unreadyPlayers = players.filter(p => !p.ready);
  const readyCount = readyPlayers.length;

  if (headerPlayerCount) {
    headerPlayerCount.textContent = `${readyCount} / ${players.length || 8} LISTOS`;
  }

  // Update J1 pill & hint
  const j1Player = players.find(p => p.isJ1);
  if (j1Player) {
    if (lobbyReadyHint) {
      lobbyReadyHint.innerHTML = `👑 <strong>${escapeHtml(j1Player.name)}</strong> tiene el mando · Listos en la sala: <strong style="color: ${readyCount === players.length && players.length > 0 ? '#16a34a' : '#0284c7'};">${readyCount}/${players.length}</strong>`;
    }
    const j1Pill = document.getElementById('lobby-j1-pill');
    if (j1Pill) {
      j1Pill.textContent = `👑 ${escapeHtml(j1Player.name)} tiene el mando (J1)`;
    }
  } else {
    if (lobbyReadyHint) {
      lobbyReadyHint.textContent = '';
    }
    const j1Pill = document.getElementById('lobby-j1-pill');
    if (j1Pill) {
      j1Pill.textContent = '👑 Esperando J1...';
    }
  }

  if (btnAdminStartGame) {
    btnAdminStartGame.innerHTML = `¡ARRANCAR! ▶ (${readyCount}/${players.length} Listos)`;
  }

  // 1. Sync 2D Lounge Physics Room
  if (window.LobbyRoom && typeof LobbyRoom.syncPlayers === 'function') {
    LobbyRoom.syncPlayers(players);
  }

  // 2. Render Dressing Room (En el vestidor) Sidebar List
  const lobbyUnreadyList = document.getElementById('lobby-unready-list');
  const unreadyCountBadge = document.getElementById('unready-count-badge');
  if (unreadyCountBadge) {
    unreadyCountBadge.textContent = unreadyPlayers.length;
  }

  if (lobbyUnreadyList) {
    lobbyUnreadyList.innerHTML = '';
    if (unreadyPlayers.length === 0) {
      lobbyUnreadyList.innerHTML = players.length === 0
        ? '<div class="unready-empty-msg">📱 Esperando a que escaneen el código QR...</div>'
        : '<div class="unready-empty-msg">🎉 Todos listos</div>';
    } else {
      unreadyPlayers.forEach(p => {
        const chip = document.createElement('div');
        chip.className = `unready-player-chip ${p.isJ1 ? 'is-j1' : ''}`;
        const avatarSvg = window.renderAvatarSVG ? renderAvatarSVG(p.avatar, 38) : '';
        chip.innerHTML = `
          <div class="unready-avatar-wrap">${avatarSvg}</div>
          <div class="unready-player-info">
            <span class="unready-player-name">${p.isJ1 ? '👑 ' : ''}${escapeHtml(p.name)}</span>
            <span class="unready-status-tag">⏳ Modificando avatar...</span>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="btn-card-action btn-crown-j1" data-player-id="${p.id}" title="Hacer J1" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 8px; border: 2px solid #1e293b; background: ${p.isJ1 ? '#fde047' : '#ffffff'}; color: #1e293b; cursor: pointer; font-weight: 900;">
              👑
            </button>
            <button class="btn-card-action btn-kick-player" data-player-id="${p.id}" data-player-name="${escapeHtml(p.name)}" title="Expulsar" style="padding: 4px 8px; font-size: 0.72rem; border-radius: 8px; border: 2px solid #1e293b; background: #ffffff; color: #ef4444; cursor: pointer; font-weight: 900;">
              ✕
            </button>
          </div>
        `;
        const crownBtn = chip.querySelector('.btn-crown-j1');
        if (crownBtn) {
          crownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundEngine.playMarioCoin();
            socket.emit('admin_set_j1', p.id);
          });
        }
        const kickBtn = chip.querySelector('.btn-kick-player');
        if (kickBtn) {
          kickBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            socket.emit('admin_kick_player', p.id);
          });
        }
        lobbyUnreadyList.appendChild(chip);
      });
    }
  }
}

// 4. Render New Super Mario Bros 2.5D Overworld Map
function renderOverworldMap(levels, currentIndex, players) {
  if (!nsmbNodesLayer) return;
  nsmbNodesLayer.innerHTML = '';

  const peloton = currentGameState?.pelotonStatus || { allAtNode: true, targetNode: currentIndex };
  const allGathered = Boolean(peloton.allAtNode);

  // 1. Update NSMB Placard (Top Left - Exact 1:1 Scale)
  const completedStars = levels.filter(lvl => lvl.completed).length;
  if (nsmbWorldNum) nsmbWorldNum.textContent = `1 - ${currentIndex + 1}`;
  if (starCoin1) starCoin1.classList.toggle('filled', completedStars >= 1);
  if (starCoin2) starCoin2.classList.toggle('filled', completedStars >= 2);
  if (starCoin3) starCoin3.classList.toggle('filled', completedStars >= 3);

  // Update Lives Box (covers original Mario x 03)
  if (nsmbLivesCount) {
    nsmbLivesCount.textContent = String(players.length).padStart(2, '0');
  }
  const j1Player = players.find(p => p.isJ1) || players[0];
  if (nsmbLivesAvatar && j1Player) {
    nsmbLivesAvatar.innerHTML = renderAvatarSVG(j1Player.avatar, 30);
  }

  // 2. Render 3D mapped level nodes directly over the golden ring pads (ZERO CLUTTER)
  levels.forEach((lvl, idx) => {
    const pos = MAP_NODE_POSITIONS[idx] || MAP_NODE_POSITIONS[MAP_NODE_POSITIONS.length - 1];
    if (!pos) return;
    const isCompleted = lvl.completed;
    const isCurrent = idx === currentIndex;
    const playersHere = players.filter(p => (typeof p.mapNodeIndex === 'number' ? p.mapNodeIndex : 0) === idx).length;

    const nodeEl = document.createElement('div');
    nodeEl.style.left = `${pos.x}%`;
    nodeEl.style.top = `${pos.y}%`;
    nodeEl.className = 'nsmb-node-item';

    if (isCurrent) {
      nodeEl.classList.add('active');
      if (allGathered) {
        nodeEl.classList.add('gathered');
        nodeEl.innerHTML = `<div class="nsmb-ground-halo gathered"></div>`;
      } else {
        nodeEl.innerHTML = `<div class="nsmb-ground-halo"></div>`;
      }
    } else if (playersHere > 0) {
      nodeEl.classList.add('active');
      nodeEl.innerHTML = `<div class="nsmb-ground-halo" style="border-color:#38bdf8; box-shadow:0 0 14px rgba(56,189,248,0.7);"></div>`;
    } else if (isCompleted) {
      nodeEl.classList.add('completed');
      nodeEl.innerHTML = `<div class="nsmb-cleared-flag">🏁</div>`;
    }

    // Click on node to play coin chime
    nodeEl.addEventListener('click', () => {
      soundEngine.playMarioCoin();
    });

    nsmbNodesLayer.appendChild(nodeEl);
  });

  // 3. Update Bottom Wii HUD Status with Peloton Information
  updatePelotonHUD(peloton, currentIndex, players);

  // 4. Position Avatar Squad Runners at their respective nodes
  ensureSquadRunners(players);
  positionPlayersOnMap(players);
}

// 5. SQUAD OVERWORLD SYSTEM (MARIO, LUIGI, TOADS WALKING IN SINGLE FILE)

// Build high-resolution smooth waypoints along the visible dirt road
function getSplinePathBetweenNodes(fromIndex, toIndex, sampleCount = 75) {
  if (fromIndex === toIndex) {
    const p = MAP_NODE_POSITIONS[fromIndex] || MAP_NODE_POSITIONS[0];
    return Array(sampleCount).fill({ x: p.x, y: p.y });
  }

  const forward = toIndex > fromIndex;
  const step = forward ? 1 : -1;
  const rawPoints = [];

  for (let i = fromIndex; i !== toIndex; i += step) {
    const nextI = i + step;
    const segKey = forward ? `${i}-${nextI}` : `${nextI}-${i}`;
    let seg = DIRT_PATH_SEGMENTS[segKey];
    if (!seg) {
      const pA = MAP_NODE_POSITIONS[i] || MAP_NODE_POSITIONS[0];
      const pB = MAP_NODE_POSITIONS[nextI] || MAP_NODE_POSITIONS[MAP_NODE_POSITIONS.length - 1];
      seg = [pA, pB];
    }
    const pointsToAdd = forward ? [...seg] : [...seg].reverse();
    if (rawPoints.length > 0) {
      pointsToAdd.shift(); // avoid duplicate join points
    }
    rawPoints.push(...pointsToAdd);
  }

  const spline = [];
  for (let s = 0; s < sampleCount; s++) {
    const progress = s / (sampleCount - 1);
    const floatIdx = progress * (rawPoints.length - 1);
    const idx0 = Math.floor(floatIdx);
    const idx1 = Math.min(idx0 + 1, rawPoints.length - 1);
    const t = floatIdx - idx0;

    const pt0 = rawPoints[idx0];
    const pt1 = rawPoints[idx1];

    spline.push({
      x: pt0.x + (pt1.x - pt0.x) * t,
      y: pt0.y + (pt1.y - pt0.y) * t
    });
  }

  return spline;
}

// Spawn cartoon dust clouds on dirt path
function spawnSquadDust(x, y) {
  const viewport = document.getElementById('nsmb-map-viewport');
  if (!viewport) return;
  const dust = document.createElement('div');
  dust.className = 'nsmb-dirt-dust';
  dust.textContent = '💨';
  dust.style.left = `${x}%`;
  dust.style.top = `${y + 1.2}%`;
  viewport.appendChild(dust);
  setTimeout(() => dust.remove(), 400);
}

// Ensure each player has an independent character runner and pet companion element in DOM
function ensureSquadRunners(players, nodeIndex) {
  const squadLayer = document.getElementById('nsmb-squad-layer');
  if (!squadLayer) return;

  // Remove excess player runners if players left
  const existingRunners = squadLayer.querySelectorAll('.nsmb-chaval-runner');
  existingRunners.forEach(r => {
    const idx = parseInt(r.getAttribute('data-index'), 10);
    if (idx >= players.length) r.remove();
  });

  // Remove excess pet runners if players left
  const existingPetRunners = squadLayer.querySelectorAll('.nsmb-pet-runner');
  existingPetRunners.forEach(r => {
    const idx = parseInt(r.getAttribute('data-index'), 10);
    if (idx >= players.length) r.remove();
  });

  // Create or update each runner and their pet
  players.forEach((p, idx) => {
    let runnerEl = document.getElementById(`runner-player-${idx}`);
    let tagClass = 'tag-chaval';
    let tagLabel = escapeHtml(p.name);

    if (p.isJ1) {
      tagClass = 'tag-j1';
      tagLabel = `1P ${escapeHtml(p.name)}`;
    } else if (idx === 1) {
      tagClass = 'tag-luigi';
      tagLabel = `2P ${escapeHtml(p.name)}`;
    } else if (idx === 2) {
      tagClass = 'tag-toad-yellow';
      tagLabel = `3P ${escapeHtml(p.name)}`;
    } else if (idx === 3) {
      tagClass = 'tag-toad-blue';
      tagLabel = `4P ${escapeHtml(p.name)}`;
    } else {
      tagClass = 'tag-chaval';
      tagLabel = `${idx + 1}P ${escapeHtml(p.name)}`;
    }

    // Hide tags beyond the 4th runner to avoid overlapping clutter in big groups
    const showTag = idx < 4 || p.isJ1;
    const hideClass = showTag ? '' : 'tag-hidden';

    if (!runnerEl) {
      runnerEl = document.createElement('div');
      runnerEl.id = `runner-player-${idx}`;
      runnerEl.setAttribute('data-index', idx);
      runnerEl.className = `nsmb-chaval-runner ${p.isJ1 ? 'is-leader' : 'is-companion'} is-idle`;
      runnerEl.innerHTML = `
        <div class="runner-name-tag ${tagClass} ${hideClass}">${tagLabel}</div>
        <div class="runner-ground-shadow"></div>
        <div class="runner-avatar-wrapper face-right">${renderAvatarSVG(p.avatar, 68)}</div>
      `;
      squadLayer.appendChild(runnerEl);
    } else {
      const tagEl = runnerEl.querySelector('.runner-name-tag');
      if (tagEl) {
        tagEl.className = `runner-name-tag ${tagClass} ${hideClass}`;
        tagEl.innerHTML = tagLabel;
      }
    }

    // Pet Companion Runner
    let petRunnerEl = document.getElementById(`runner-pet-${idx}`);
    const hasPet = p.avatar && p.avatar.pet && p.avatar.pet !== 'none';
    if (!hasPet) {
      if (petRunnerEl) petRunnerEl.remove();
    } else {
      const petInfo = typeof AVATAR_OPTIONS !== 'undefined' ? AVATAR_OPTIONS.pets.find(pet => pet.id === p.avatar.pet) : null;
      const petLabel = petInfo ? petInfo.label : 'Mascota';
      if (!petRunnerEl) {
        petRunnerEl = document.createElement('div');
        petRunnerEl.id = `runner-pet-${idx}`;
        petRunnerEl.setAttribute('data-index', idx);
        petRunnerEl.setAttribute('data-pet', p.avatar.pet);
        petRunnerEl.className = 'nsmb-pet-runner is-idle';
        petRunnerEl.innerHTML = `
          <div class="pet-ground-shadow"></div>
          <div class="pet-avatar-wrapper face-right">${renderPetSVG(p.avatar.pet, 40)}</div>
          <div class="pet-name-tag">${escapeHtml(petLabel)}</div>
        `;
        squadLayer.appendChild(petRunnerEl);
      } else {
        if (petRunnerEl.getAttribute('data-pet') !== p.avatar.pet) {
          petRunnerEl.setAttribute('data-pet', p.avatar.pet);
          const pWrap = petRunnerEl.querySelector('.pet-avatar-wrapper');
          if (pWrap) pWrap.innerHTML = renderPetSVG(p.avatar.pet, 40);
          const pTag = petRunnerEl.querySelector('.pet-name-tag');
          if (pTag) pTag.textContent = petLabel;
        }
      }
    }
  });
}

// Update Bottom Wii HUD Status with Peloton Information (Super Mario Bros Wii style)
function updatePelotonHUD(peloton, currentIndex, players) {
  const allGathered = Boolean(peloton?.allAtNode);
  const j1Player = players.find(p => p.isJ1) || players[0];

  if (j1MapPrompt) {
    j1MapPrompt.textContent = j1Player ? `${j1Player.name} guía el avance` : 'J1 guía el avance';
  }

  if (nsmbStatusWorldTitle) {
    if (allGathered) {
      nsmbStatusWorldTitle.textContent = `MUNDO 1 - ${currentIndex + 1}`;
    } else {
      const ready = peloton?.readyCount || 1;
      const total = peloton?.totalPlayers || players.length;
      nsmbStatusWorldTitle.textContent = `PELOTÓN (${ready}/${total})`;
    }
  }

  if (btnHostEnterLevel) {
    if (allGathered) {
      btnHostEnterLevel.className = 'nsmb-wii-enter-btn gathered';
      btnHostEnterLevel.innerHTML = `<span class="wii-circle-badge">①</span><span class="wii-enter-text">ENTRAR AL NIVEL</span>`;
    } else {
      const ready = peloton?.readyCount || 1;
      const total = peloton?.totalPlayers || players.length;
      btnHostEnterLevel.className = 'nsmb-wii-enter-btn dispersed';
      btnHostEnterLevel.innerHTML = `<span class="wii-circle-badge">⏳</span><span class="wii-enter-text">ESPERANDO (${ready}/${total})</span>`;
    }
  }
}

// Position all players on their respective nodes across the overworld map
function positionPlayersOnMap(players) {
  ensureSquadRunners(players);

  // Group players by node index
  const groups = {};
  players.forEach((p, idx) => {
    const node = typeof p.mapNodeIndex === 'number' ? p.mapNodeIndex : 0;
    if (!groups[node]) groups[node] = [];
    groups[node].push({ player: p, index: idx });
  });

  // Position each group with circular arc formation around their node
  for (const [nodeStr, group] of Object.entries(groups)) {
    const nodeIdx = parseInt(nodeStr, 10);
    const targetPos = MAP_NODE_POSITIONS[nodeIdx] || MAP_NODE_POSITIONS[0];

    group.forEach((item, subIdx) => {
      const runnerEl = document.getElementById(`runner-player-${item.index}`);
      const petEl = document.getElementById(`runner-pet-${item.index}`);
      const offset = getSquadFormationOffset(subIdx, group.length);

      if (runnerEl && !runnerEl.classList.contains('is-running')) {
        runnerEl.classList.remove('is-celebrating');
        runnerEl.classList.add('is-idle');
        runnerEl.style.left = `${targetPos.x + offset.dx}%`;
        runnerEl.style.top = `${targetPos.y + offset.dy}%`;
        runnerEl.style.zIndex = offset.zIndex;

        const wrapper = runnerEl.querySelector('.runner-avatar-wrapper');
        if (wrapper) wrapper.className = 'runner-avatar-wrapper face-right';
      }

      if (petEl && !petEl.classList.contains('is-running')) {
        petEl.classList.remove('is-celebrating');
        petEl.classList.add('is-idle');
        petEl.style.left = `${targetPos.x + offset.dx + 2.5}%`;
        petEl.style.top = `${targetPos.y + offset.dy + 0.8}%`;
        petEl.style.zIndex = offset.zIndex + 1;

        const petWrap = petEl.querySelector('.pet-avatar-wrapper');
        if (petWrap) petWrap.className = 'pet-avatar-wrapper face-right';
      }
    });
  }
}

// Individual runner animation along spline (Super Mario Bros Wii style)
function animatePlayerMove(playerId, fromNode, toNode) {
  const pIdx = currentPlayers.findIndex(p => p.id === playerId);
  if (pIdx === -1) return;
  const p = currentPlayers[pIdx];

  const runnerEl = document.getElementById(`runner-player-${pIdx}`);
  const petEl = document.getElementById(`runner-pet-${pIdx}`);
  if (!runnerEl) return;

  const spline = getSplinePathBetweenNodes(fromNode, toNode, 50);
  const targetPos = MAP_NODE_POSITIONS[toNode] || MAP_NODE_POSITIONS[0];
  let currentStep = 0;
  let lastSoundTime = 0;

  runnerEl.classList.remove('is-idle', 'is-celebrating');
  runnerEl.classList.add('is-running');
  if (petEl) {
    petEl.classList.remove('is-idle', 'is-celebrating');
    petEl.classList.add('is-running');
  }

  function runFrame() {
    currentStep++;
    const now = performance.now();

    if (currentStep < spline.length) {
      const pt = spline[currentStep];
      const nextPt = spline[Math.min(currentStep + 2, spline.length - 1)];

      runnerEl.style.left = `${pt.x}%`;
      runnerEl.style.top = `${pt.y}%`;
      runnerEl.style.zIndex = Math.floor(35 + pt.y * 0.5);

      const wrapper = runnerEl.querySelector('.runner-avatar-wrapper');
      if (wrapper) {
        if (nextPt.x > pt.x + 0.05) wrapper.className = 'runner-avatar-wrapper face-right';
        else if (nextPt.x < pt.x - 0.05) wrapper.className = 'runner-avatar-wrapper face-left';
      }

      if (currentStep % 4 === 0) spawnSquadDust(pt.x, pt.y);

      // Pet companion follows 4 ticks behind
      if (petEl) {
        const petStep = Math.max(0, currentStep - 4);
        const petPt = spline[petStep];
        const nextPetPt = spline[Math.min(petStep + 2, spline.length - 1)];

        petEl.style.left = `${petPt.x + 0.4}%`;
        petEl.style.top = `${petPt.y + 0.6}%`;
        petEl.style.zIndex = Math.floor(36 + petPt.y * 0.5);

        const petWrap = petEl.querySelector('.pet-avatar-wrapper');
        if (petWrap) {
          if (nextPetPt.x > petPt.x + 0.05) petWrap.className = 'pet-avatar-wrapper face-right';
          else if (nextPetPt.x < petPt.x - 0.05) petWrap.className = 'pet-avatar-wrapper face-left';
        }

        if (petStep % 5 === 0) spawnSquadDust(petPt.x + 0.4, petPt.y + 0.6);
      }

      if (now - lastSoundTime > 140) {
        soundEngine.playMarioRunTrot();
        lastSoundTime = now;
      }

      requestAnimationFrame(runFrame);
    } else {
      // Arrived at destination!
      runnerEl.classList.remove('is-running');
      runnerEl.classList.add('is-celebrating');
      soundEngine.playCelebrationJump();
      spawnSquadDust(targetPos.x, targetPos.y);

      if (petEl) {
        petEl.classList.remove('is-running');
        petEl.classList.add('is-celebrating');
      }

      setTimeout(() => {
        runnerEl.classList.remove('is-celebrating');
        runnerEl.classList.add('is-idle');
        if (petEl) {
          petEl.classList.remove('is-celebrating');
          petEl.classList.add('is-idle');
        }
        positionPlayersOnMap(currentPlayers);
      }, 500);
    }
  }

  requestAnimationFrame(runFrame);
}

// Fallback compatibility functions
function positionSquadAtNode(nodeIndex, players) {
  positionPlayersOnMap(players);
}

function startSquadMarch(fromIndex, toIndex, players) {
  players.forEach(p => {
    animatePlayerMove(p.id, fromIndex, toIndex);
  });
}

// 6. Render Minigame View (Balanced Teams 4v4 with Avatars & Interactive Canvas)
function updateStandaloneArcadeHud(level, teams) {
  const gType = level?.gameType;
  const neon = document.getElementById('standalone-hud-neon');
  const tag = document.getElementById('standalone-hud-tag');
  const center = document.getElementById('standalone-hud-center');
  const title = document.getElementById('standalone-hud-title');
  const sub = document.getElementById('standalone-hud-sub');
  const adminPill = document.getElementById('standalone-hud-admin-pill');

  if (!neon || !tag) return;

  const CONFIGS = {
    'buttonbash': {
      neon: '🐰 HOTBUNNIES BAR',
      neonBorder: '#f43f5e',
      tag: '★ MODO INDEPENDIENTE ★',
      title: '🎯 BUTTON BASH!',
      sub: 'Fija X y después fija Y desde tu móvil',
      showCenter: true,
      showAdmin: true
    },
    'bash': {
      neon: '🐰 HOTBUNNIES BAR',
      neonBorder: '#f43f5e',
      tag: '★ MODO INDEPENDIENTE ★',
      title: '🎯 BUTTON BASH!',
      sub: 'Fija X y después fija Y desde tu móvil',
      showCenter: true,
      showAdmin: true
    },
    'race': {
      neon: '🏎️ MARIO KART',
      neonBorder: '#22c55e',
      tag: '★ SNES MODE 7 ARCADE ★',
      title: '🏁 GP CHAVALIL',
      sub: 'Acelera, derrapa y machaca con caparazones',
      showCenter: false,
      showAdmin: false
    },
    'brawler': {
      neon: '💥 SUPER SMASH',
      neonBorder: '#eab308',
      tag: '★ BATTLEFIELD ★',
      title: '🥊 SUPER SMASH BROS',
      sub: 'Plataformas flotantes y tortas como panes',
      showCenter: false,
      showAdmin: false
    },
    'opensmash': {
      neon: '🌌 OPENSMASH',
      neonBorder: '#a855f7',
      tag: '★ DESTINO FINAL ★',
      title: '⚔️ FINAL DESTINATION',
      sub: 'Sin plataformas, combate puro de cuadrilla',
      showCenter: false,
      showAdmin: false
    },
    'headsoccer': {
      neon: '⚽ CABEZONES SOCCER',
      neonBorder: '#38bdf8',
      tag: '★ SALÓN DERBI ★',
      title: '⚽ CABEZONES SOCCER',
      sub: 'Salto, volea y pepinazo al fondo de la red',
      showCenter: false,
      showAdmin: false
    },
    'haxball': {
      neon: '🥅 HAXBALL CHAVALIL',
      neonBorder: '#3b82f6',
      tag: '★ TIKI-TAKA 2v2 ★',
      title: '🥅 HAXBALL CHAVALIL',
      sub: 'Pase corto, rebote en banda y golazo',
      showCenter: false,
      showAdmin: false
    },
    'bomberman': {
      neon: '💣 CHAVAL BOMBERMAN',
      neonBorder: '#ef4444',
      tag: '★ BATALLA DE BOMBAS ★',
      title: '💣 CHAVAL BOMBERMAN',
      sub: 'Planta dinamita y no te encierres a ti mismo',
      showNeon: false, // Canvas already has full-width top header
      showCenter: false,
      showAdmin: false
    },
    'tank': {
      neon: '🎯 TANK TROUBLE',
      neonBorder: '#f97316',
      tag: '★ REBOTE BALÍSTICO ★',
      title: '🎯 TANK TROUBLE',
      sub: 'Cuidado con el rebote de tu propia bala',
      showNeon: false, // Canvas already has full-width top header
      showCenter: false,
      showAdmin: false
    },
    'curve': {
      neon: '🌀 CURVAS CHAVALIL',
      neonBorder: '#06b6d4',
      tag: '★ ACHTUNG DIE KURVE ★',
      title: '🌀 CURVAS CHAVALIL',
      sub: 'Gira con izquierda y derecha y no toques los bordes',
      showNeon: false, // Canvas already has full-width top header
      showCenter: false,
      showAdmin: false
    }
  };

  const cfg = CONFIGS[gType] || {
    neon: '🎮 ARCADE CHAVALIL',
    neonBorder: '#38bdf8',
    tag: '★ EDICIÓN CUADRILLA ★',
    title: level?.title || 'MINIJUEGO',
    sub: level?.lore || '',
    showNeon: true,
    showCenter: false,
    showAdmin: false
  };

  const isNeonVisible = cfg.showNeon !== false;
  neon.style.display = isNeonVisible ? 'inline-flex' : 'none';
  tag.style.display = isNeonVisible ? 'inline-flex' : 'none';

  if (isNeonVisible) {
    neon.textContent = cfg.neon;
    neon.style.borderColor = cfg.neonBorder;
    neon.style.boxShadow = `0 0 15px ${cfg.neonBorder}88, 0 4px 10px rgba(0,0,0,0.5)`;
    tag.textContent = cfg.tag;
  }

  if (center) {
    center.style.display = cfg.showCenter ? 'flex' : 'none';
    if (title) title.textContent = cfg.title;
    if (sub) sub.textContent = cfg.sub;
  }

  if (adminPill) {
    adminPill.style.display = cfg.showAdmin ? 'inline-flex' : 'none';
  }
}

function renderMinigameView(level, teams) {
  if (!level) return;

  // ALL MINIGAMES RUN IN STANDALONE ARCADE FULLSCREEN (100vw x 100vh)
  document.body.classList.add('standalone-game-active');
  const standaloneHud = document.getElementById('standalone-arcade-hud');
  if (standaloneHud) {
    standaloneHud.style.display = 'flex';
    updateStandaloneArcadeHud(level, teams);
  }

  minigameBannerTitle.textContent = level.title;
  minigameBannerLore.textContent = level.lore;

  const teamA = teams.teamA || [];
  const teamB = teams.teamB || [];

  countTeamA.textContent = `${teamA.length} Jugadores`;
  countTeamB.textContent = `${teamB.length} Jugadores`;

  listTeamA.innerHTML = '';
  teamA.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'team-member-chip';
    const petSvg = p.avatar && p.avatar.pet && p.avatar.pet !== 'none' ? renderPetSVG(p.avatar.pet, 32) : '';
    chip.innerHTML = `
      <div style="position: relative; width: 70px; height: 70px;">
        ${renderAvatarSVG(p.avatar, 65)}
        ${petSvg ? `<div style="position: absolute; bottom: -2px; right: -2px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${petSvg}</div>` : ''}
      </div>
      <strong style="color: #60a5fa; font-size: 1.05rem;">${escapeHtml(p.name)}</strong>
      ${p.isAndroid ? '<span style="font-size:0.75rem; color:#86efac;">🤖 Android</span>' : ''}
    `;
    listTeamA.appendChild(chip);
  });

  listTeamB.innerHTML = '';
  teamB.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'team-member-chip';
    const petSvg = p.avatar && p.avatar.pet && p.avatar.pet !== 'none' ? renderPetSVG(p.avatar.pet, 32) : '';
    chip.innerHTML = `
      <div style="position: relative; width: 70px; height: 70px;">
        ${renderAvatarSVG(p.avatar, 65)}
        ${petSvg ? `<div style="position: absolute; bottom: -2px; right: -2px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${petSvg}</div>` : ''}
      </div>
      <strong style="color: #f87171; font-size: 1.05rem;">${escapeHtml(p.name)}</strong>
      ${p.isAndroid ? '<span style="font-size:0.75rem; color:#86efac;">🤖 Android</span>' : ''}
    `;
    listTeamB.appendChild(chip);
  });

  // Launch Active Minigame Engine
  if (activeMinigameEngine) {
    activeMinigameEngine.stop();
    activeMinigameEngine = null;
  }

  const gType = level.gameType;
  const onDone = (res) => {
    socket.emit('minigame_complete', res);
  };

  if (gType === 'curve' && typeof CurveFeverEngine !== 'undefined') {
    activeMinigameEngine = new CurveFeverEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if (gType === 'tank' && typeof TankTroubleEngine !== 'undefined') {
    activeMinigameEngine = new TankTroubleEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if (gType === 'headsoccer' && typeof HeadSoccerEngine !== 'undefined') {
    activeMinigameEngine = new HeadSoccerEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if (gType === 'bomberman' && typeof BombermanEngine !== 'undefined') {
    activeMinigameEngine = new BombermanEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if (gType === 'haxball' && typeof HaxballEngine !== 'undefined') {
    activeMinigameEngine = new HaxballEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if (gType === 'race' && typeof MarioKartEngine !== 'undefined') {
    activeMinigameEngine = new MarioKartEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if ((gType === 'brawler' || gType === 'opensmash') && typeof SuperSmashEngine !== 'undefined') {
    activeMinigameEngine = new SuperSmashEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else if ((gType === 'buttonbash' || gType === 'bash') && typeof ButtonBashEngine !== 'undefined') {
    activeMinigameEngine = new ButtonBashEngine('minigame-canvas', { onComplete: onDone });
    activeMinigameEngine.init(currentPlayers, teams);
  } else {
    // Fallback por defecto a Curvas si no coincide
    if (typeof CurveFeverEngine !== 'undefined') {
      activeMinigameEngine = new CurveFeverEngine('minigame-canvas', { onComplete: onDone });
      activeMinigameEngine.init(currentPlayers, teams);
    }
  }
  window.activeMinigameEngine = activeMinigameEngine;
}

// Helper de iconos para cada personaje de la cuadrilla
function getCharacterEmote(charId) {
  const map = {
    ayrton: '🐺',
    djon: '🍦',
    dj: '🍦',
    violeta: '🎯',
    asier: '⚡',
    lucia: '🪄',
    adriachi: '💵',
    eneko: '⚡',
    manu: '🍊',
    marta: '🧢',
    santi: '👔',
    lerga: '🏍️',
    alel: '🇪🇸',
    yago: '🎮',
    hua: '🌸'
  };
  return map[(charId || '').toLowerCase()] || '🎵';
}

// 7. Floating Meme Reactions
function triggerFloatingEmote(emote, playerName) {
  const layer = document.getElementById('floating-reactions-layer');
  if (!layer) return;
  const span = document.createElement('div');
  span.className = 'floating-emote';
  span.innerHTML = `<span>${emote}</span>${playerName ? `<small style="display:block; font-size:0.75rem; font-weight:800; color:#fef08a; text-shadow:0 1px 3px rgba(0,0,0,0.8);">${escapeHtml(playerName)}</small>` : ''}`;
  span.style.left = `${25 + Math.random() * 50}%`;
  span.style.top = `${35 + Math.random() * 30}%`;
  layer.appendChild(span);

  setTimeout(() => {
    span.remove();
  }, 1800);
}

// Contador de bajas en el minijuego activo
let minigameKillsCount = 0;

// Cinematic Level Intro Splash Animation (The Surprise Reveal!)
function triggerCinematicLevelIntro(activeLevel, teams, onComplete) {
  if (isLevelIntroPlaying || !nsmbLevelIntroOverlay) {
    if (onComplete) onComplete();
    return;
  }
  isLevelIntroPlaying = true;
  minigameKillsCount = 0;

  // Sonido Match Found de League of Legends durante la cuenta atrás y delay
  if (window.soundEngine) {
    soundEngine.playLolMatchFound();
  }
  soundEngine.playPipe();

  if (introWorldBadge) {
    introWorldBadge.textContent = `⭐ MUNDO 1 - ${(currentGameState?.currentLevelIndex || 0) + 1} ⭐`;
  }
  if (introLevelTitle) {
    introLevelTitle.textContent = '❓ DESAFÍO POR EQUIPOS';
  }
  if (introLevelLore) {
    introLevelLore.textContent = '¡Equipos asignados a suertes! El minijuego se revelará en el último segundo...';
  }

  if (introTeamsPreview && teams) {
    const teamA = teams.teamA || [];
    const teamB = teams.teamB || [];
    introTeamsPreview.innerHTML = `
      <div style="background: rgba(30,58,138,0.75); border:2px solid #3b82f6; border-radius:14px; padding:10px 18px; color:#93c5fd; font-weight:800;">
        🔵 EQUIPO AZUL (${teamA.length}): ${teamA.map(p => escapeHtml(p.name)).join(', ') || 'Nadie'}
      </div>
      <div style="background: rgba(127,29,29,0.75); border:2px solid #ef4444; border-radius:14px; padding:10px 18px; color:#fca5a5; font-weight:800;">
        🔴 EQUIPO ROJO (${teamB.length}): ${teamB.map(p => escapeHtml(p.name)).join(', ') || 'Nadie'}
      </div>
    `;
  }

  nsmbLevelIntroOverlay.classList.add('active');
  if (introCountdown) introCountdown.textContent = '🔥 ¡PARTIDA ENCONTRADA! (PREPARADOS...)';

  // Repetición rítmica de Match Found para extender el suspense
  setTimeout(() => {
    if (window.soundEngine) soundEngine.playLolMatchFound(0.85);
    if (introCountdown) introCountdown.textContent = '🎲 SORTEANDO DESAFÍO... 3...';
    soundEngine.playMarioWalk();
  }, 2000);

  setTimeout(() => {
    if (introCountdown) introCountdown.textContent = '⚔️ 2... ¡MINIJUEGO REVELADO!';
    if (introLevelTitle) introLevelTitle.textContent = activeLevel?.title || '¡DESAFÍO CHAVALIL!';
    if (introLevelLore) introLevelLore.textContent = activeLevel?.lore || '¡A darlo todo con la cuadrilla!';
    soundEngine.playMarioWalk();
  }, 3400);

  setTimeout(() => {
    if (introCountdown) introCountdown.textContent = '⏳ 1... ¡TODOS A SUS PUESTOS!';
    soundEngine.playMarioWalk();
  }, 4500);

  setTimeout(() => {
    if (introCountdown) introCountdown.textContent = '💥 ¡A PELEAR!';
    soundEngine.playCelebrationJump();
  }, 5300);

  setTimeout(() => {
    nsmbLevelIntroOverlay.classList.remove('active');
    isLevelIntroPlaying = false;
    if (onComplete) onComplete();
  }, 6000);
}

// Escape HTML helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ================= SOCKET EVENT LISTENERS =================

socket.on('state_update', (data) => {
  currentGameState = data.gameState;
  currentPlayers = data.players || [];

  renderLobbyPlayers(currentPlayers);

  if (currentGameState.status === 'lobby') {
    switchView('lobby');
  } else if (currentGameState.status === 'map') {
    switchView('map');
    renderOverworldMap(currentGameState.levels, currentGameState.currentLevelIndex, currentPlayers);
  } else if (currentGameState.status === 'minigame') {
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection && activeSection.id === 'view-map' && !isLevelIntroPlaying) {
      triggerCinematicLevelIntro(currentGameState.minigameActive, currentGameState.teams, () => {
        switchView('minigame');
        renderMinigameView(currentGameState.minigameActive, currentGameState.teams);
      });
    } else {
      switchView('minigame');
      renderMinigameView(currentGameState.minigameActive, currentGameState.teams);
    }
  }
});

socket.on('map_pina_moved', (data) => {
  if (data.levelIndex !== currentPiñaNodeIndex) {
    startSquadMarch(currentPiñaNodeIndex, data.levelIndex, currentPlayers);
  }
});

// Individual player movement along the dirt spline (Super Mario Bros Wii style)
socket.on('player_node_moved', (data) => {
  const p = currentPlayers.find(item => item.id === data.playerId);
  if (p) p.mapNodeIndex = data.toNode;
  animatePlayerMove(data.playerId, data.fromNode, data.toNode);
});

// Peloton consensus update
socket.on('map_peloton_status', (data) => {
  if (currentGameState) {
    currentGameState.pelotonStatus = data;
    if (typeof data.targetNode === 'number') {
      currentGameState.currentLevelIndex = data.targetNode;
    }
  }
  updatePelotonHUD(data, currentGameState ? currentGameState.currentLevelIndex : 0, currentPlayers);
  if (data.allAtNode) {
    soundEngine.playMysteryReveal();
  }

  // Update golden halos on map
  if (nsmbNodesLayer) {
    const nodes = nsmbNodesLayer.querySelectorAll('.nsmb-node-item');
    nodes.forEach((n, idx) => {
      const isTarget = idx === (currentGameState?.currentLevelIndex || 0);
      const halo = n.querySelector('.nsmb-ground-halo');
      if (halo) {
        if (isTarget && data.allAtNode) {
          halo.className = 'nsmb-ground-halo gathered';
        } else {
          halo.className = 'nsmb-ground-halo';
        }
      }
    });
  }
});

// Entry blocked if squad is scattered
socket.on('map_enter_blocked', (data) => {
  soundEngine.playHonk();
  if (btnHostEnterLevel) {
    btnHostEnterLevel.classList.add('shake-blocked');
    setTimeout(() => btnHostEnterLevel.classList.remove('shake-blocked'), 600);
  }
});

socket.on('player_emoted', (data) => {
  const emote = data?.emote || '📢';
  const sound = data?.sound;
  const name = data?.playerName || 'Chaval';

  if (sound && window.soundEngine) {
    soundEngine.playSoundByName(sound);
  } else if (window.soundEngine) {
    soundEngine.playBocina();
  }

  triggerFloatingEmote(emote, name);

  if (window.LobbyRoom && typeof LobbyRoom.triggerEmote === 'function') {
    LobbyRoom.triggerEmote(data?.playerId, emote, sound);
  }
});

// Broadcast cuando un chaval elige su personaje / easter egg theme
socket.on('character_theme_broadcast', (data) => {
  if (data && window.soundEngine) {
    const charId = data.characterId || '';
    const charName = data.characterName || data.playerName || '';
    soundEngine.playCharacterTheme(charId, charName);
    triggerFloatingEmote(getCharacterEmote(charId || charName), `¡${charName || charId} listo!`);
  }
});

// Eventos del minijuego (muerte, alarma, etc.)
socket.on('minigame_event_broadcast', (data) => {
  if (window.soundEngine) {
    if (data.type === 'kill') {
      soundEngine.playDeathSound(data.isFirst);
      triggerFloatingEmote(data.isFirst ? '🩸' : '💀', data.isFirst ? 'FIRST BLOOD!' : 'ELIMINADO');
    } else if (data.type === 'danger_alarm') {
      soundEngine.playDangerAlarm();
      triggerFloatingEmote('🚨', '¡ALARMA DE PELIGRO!');
    }
  }
});

// Minijuego abortado de forma segura por el Administrador (vuelve al mapa sin completar)
socket.on('minigame_aborted', (data) => {
  if (activeMinigameEngine) {
    activeMinigameEngine.stop();
    activeMinigameEngine = null;
  }
  document.body.classList.remove('standalone-game-active');
  if (window.soundEngine) soundEngine.playHonk();
  triggerFloatingEmote('🛑', data?.reason || 'Minijuego cancelado');
});

// Mensajes y gritos flotantes del Banquillo (espectadores en tiempo real)
socket.on('bench_message_broadcast', (data) => {
  if (!data || !data.text) return;
  const overlay = document.getElementById('bench-shouts-overlay');
  if (!overlay) return;

  const bubble = document.createElement('div');
  bubble.className = 'bench-shout-pill';
  const avatarSvg = data.avatar && typeof renderAvatarSVG === 'function' ? renderAvatarSVG(data.avatar, 36) : '';
  bubble.innerHTML = `
    <div class="bench-shout-avatar">${avatarSvg}</div>
    <div class="bench-shout-content">
      <span class="bench-shout-name">${escapeHtml(data.playerName || 'Banquillo')}:</span>
      <span class="bench-shout-text">"${escapeHtml(data.text)}"</span>
    </div>
  `;

  // Random staggered horizontal placement
  const randomX = 12 + Math.random() * 60;
  bubble.style.left = `${randomX}%`;

  overlay.appendChild(bubble);

  setTimeout(() => {
    bubble.classList.add('fade-out');
    setTimeout(() => bubble.remove(), 600);
  }, 3500);
});

// MEME: Android detected inside joke!
socket.on('android_detected_alert', (data) => {
  if (window.soundEngine) {
    soundEngine.playAndroidAlert();
  }

  androidAlertText.innerHTML = `
    ¡<strong>${escapeHtml(data.playerName)}</strong> acaba de unirse desde un <strong>ANDROID</strong>! 🙏<br>
    <span style="font-size: 1.1rem; color: #fef08a;">
      Alguien que le haga un Bizum solidario de inmediato...
    </span>
  `;
  androidAlertModal.classList.add('active');

  // Auto dismiss after 6 seconds
  setTimeout(() => {
    androidAlertModal.classList.remove('active');
  }, 6000);
});

// MEME: Android player pressed READY
socket.on('android_ready_sound', (data) => {
  if (window.soundEngine) {
    soundEngine.playAndroidAlert();
  }
  triggerFloatingEmote('🤖', `¡ANDROID LISTO! ${escapeHtml(data.playerName)} 🙏`);
});

// PODIUM & RANKINGS MODAL
const modalPodiumResults = document.getElementById('modal-podium-results');
const podiumSubtitle = document.getElementById('podium-subtitle');
const podiumWinnerAvatar = document.getElementById('podium-winner-avatar');
const podiumWinnerName = document.getElementById('podium-winner-name');
const podiumWinnerBadge = document.getElementById('podium-winner-badge');
const podiumRankingList = document.getElementById('podium-ranking-list');
const btnPodiumContinue = document.getElementById('btn-podium-continue');
const podiumAutoTimer = document.getElementById('podium-auto-timer');

let podiumCountdownInterval = null;

function showPodiumResults(data) {
  if (!modalPodiumResults) return;

  const winner = data?.winner || (data?.ranking && data.ranking[0]);
  const ranking = data?.ranking || [];
  const levelName = data?.completedLevel?.name || 'Minijuego';

  if (podiumSubtitle) {
    podiumSubtitle.textContent = `¡${levelName} superado con honores de la cuadrilla!`;
  }

  // 1. Ganador en medio (Spotlight)
  if (winner) {
    if (podiumWinnerName) podiumWinnerName.textContent = winner.name || 'Chaval';
    if (podiumWinnerAvatar) podiumWinnerAvatar.innerHTML = renderAvatarSVG(winner.avatar, 150);
    if (podiumWinnerBadge) podiumWinnerBadge.textContent = `⭐ +100 PUNTOS (${winner.score || 100} pts acumulados)`;
  }

  // 2. Ranking ordenado a la derecha
  if (podiumRankingList) {
    podiumRankingList.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉'];
    ranking.forEach((player, idx) => {
      const row = document.createElement('div');
      const medal = medals[idx] || `${idx + 1}º`;
      const isWinner = winner && player.id === winner.id;
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        margin-bottom: 8px;
        background: ${isWinner ? '#fef08a' : '#ffffff'};
        border: 3px solid #0f172a;
        border-radius: 16px;
        box-shadow: 0 4px 0 #0f172a;
        color: #0f172a;
      `;

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.35rem; font-weight: 900; width: 32px; text-align: center;">${medal}</span>
          <div style="width: 42px; height: 42px; border-radius: 50%; overflow: hidden; border: 2px solid #0f172a; background: #f8fafc;">${renderAvatarSVG(player.avatar, 42)}</div>
          <div>
            <div style="font-weight: 900; font-size: 1.05rem; color: #0f172a;">${escapeHtml(player.name)}</div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #64748b;">${player.isAndroid ? '🤖 Android' : '🍏 iOS'}</div>
          </div>
        </div>
        <div style="font-size: 1.15rem; font-weight: 900; color: #0f172a; background: ${isWinner ? '#fde047' : '#e0f2fe'}; padding: 4px 14px; border-radius: 9999px; border: 2px solid #0f172a; box-shadow: 0 2px 0 #0f172a;">
          ${player.score || 0} pts
        </div>
      `;
      podiumRankingList.appendChild(row);
    });
  }

  modalPodiumResults.style.display = 'flex';

  // 3. Audio de victoria
  minigameKillsCount = 0;
  if (window.soundEngine) {
    soundEngine.playSocialCreditVictory();
  }
  triggerFloatingEmote('🏆', '¡NIVEL COMPLETADO! +1000 SOCIAL CREDIT');

  // 4. Auto-countdown de 8s para avanzar automáticamente al mapa
  let seconds = 8;
  if (podiumAutoTimer) podiumAutoTimer.textContent = seconds;
  clearInterval(podiumCountdownInterval);
  podiumCountdownInterval = setInterval(() => {
    seconds--;
    if (podiumAutoTimer) podiumAutoTimer.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(podiumCountdownInterval);
      closePodiumAndContinue();
    }
  }, 1000);
}

function closePodiumAndContinue() {
  clearInterval(podiumCountdownInterval);
  if (modalPodiumResults) modalPodiumResults.style.display = 'none';
  socket.emit('podium_continue_to_map');
}

if (btnPodiumContinue) {
  btnPodiumContinue.addEventListener('click', closePodiumAndContinue);
}

// Celebración de fin de minijuego: Social Credit Music + Fanfarria + Podium
socket.on('level_completed_celebration', (data) => {
  showPodiumResults(data);
});

// ================= BUTTON EVENTS =================

btnDismissAndroidAlert.addEventListener('click', () => {
  androidAlertModal.classList.remove('active');
});

btnHostEnterLevel.addEventListener('click', () => {
  soundEngine.playMarioCoin();
  socket.emit('map_enter_level');
});

btnCompleteMinigame.addEventListener('click', () => {
  socket.emit('minigame_complete', { winningTeam: 'teamA' });
});

// Minigame Event Buttons (Eliminar Jugador & Alarma)
const btnMinigameKill = document.getElementById('btn-minigame-kill');
const btnMinigameDanger = document.getElementById('btn-minigame-danger');

if (btnMinigameKill) {
  btnMinigameKill.addEventListener('click', () => {
    minigameKillsCount++;
    const isFirst = minigameKillsCount === 1;
    if (window.soundEngine) {
      soundEngine.playDeathSound(isFirst);
    }
    triggerFloatingEmote(isFirst ? '🩸' : '💀', isFirst ? 'FIRST BLOOD!' : 'ELIMINADO');
    socket.emit('minigame_trigger_event', { type: 'kill', isFirst });
  });
}

if (btnMinigameDanger) {
  btnMinigameDanger.addEventListener('click', () => {
    if (window.soundEngine) {
      soundEngine.playDangerAlarm();
    }
    triggerFloatingEmote('🚨', '¡PELIGRO!');
    socket.emit('minigame_trigger_event', { type: 'danger_alarm' });
  });
}

// Admin buttons
btnAdminAdd1Bot.addEventListener('click', () => {
  soundEngine.playStep();
  socket.emit('admin_add_bot', 1);
});

btnAdminAdd4Bots.addEventListener('click', () => {
  soundEngine.playStep();
  socket.emit('admin_add_bot', 4);
});

btnAdminTestAndroid.addEventListener('click', () => {
  socket.emit('admin_test_android_alert', 'Ayrton_Android_Tester');
});

if (btnAdminTestBench) {
  btnAdminTestBench.addEventListener('click', () => {
    socket.emit('minigame_heat_update', {
      heatIndex: 1,
      totalHeats: 3,
      activePlayerIds: [],
      minigameName: 'Head Football'
    });
  });
}

if (btnNsmbQuickAndroid) {
  btnNsmbQuickAndroid.addEventListener('click', () => {
    socket.emit('admin_test_android_alert', 'Ayrton_Android_Tester');
  });
}

if (btnNsmbBot) {
  btnNsmbBot.addEventListener('click', () => {
    soundEngine.playStep();
    socket.emit('admin_add_bot', 1);
  });
}

if (btnNsmbGather) {
  btnNsmbGather.addEventListener('click', () => {
    soundEngine.playCelebrationJump();
    socket.emit('map_gather_squad');
  });
}

btnAdminCycleJ1.addEventListener('click', () => {
  if (currentPlayers.length > 1) {
    const currentJ1Index = currentPlayers.findIndex(p => p.isJ1);
    const nextIndex = (currentJ1Index + 1) % currentPlayers.length;
    socket.emit('admin_set_j1', currentPlayers[nextIndex].id);
  }
});

btnAdminReset.addEventListener('click', () => {
  socket.emit('admin_reset_game');
});

btnAdminStartGame.addEventListener('click', () => {
  soundEngine.playMarioCoin();
  socket.emit('start_game');
});

// Socket input relay from mobile controllers to active canvas engine
socket.on('host_player_input', (payload) => {
  if (activeMinigameEngine && payload) {
    activeMinigameEngine.handlePlayerInput(payload.playerId, payload.data);
  }
});

// Socket input relay for 2D Interactive Lobby Lounge Room
socket.on('host_lobby_input', (payload) => {
  if (window.LobbyRoom && payload) {
    LobbyRoom.handleInput(payload.playerId, payload.data);
  }
});

// Host Keyboard Navigation & Minigame Controls (PC testing & local play)
window.addEventListener('keydown', (e) => {
  if (currentGameState && currentGameState.status === 'map') {
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      soundEngine.playMarioWalk();
      socket.emit('map_move_next');
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      soundEngine.playMarioWalk();
      socket.emit('map_move_prev');
    } else if (e.key === 'Enter' || e.key === ' ') {
      soundEngine.playMarioCoin();
      socket.emit('map_enter_level');
    }
  } else if (activeMinigameEngine && currentPlayers.length > 0) {
    const firstPlayerId = currentPlayers[0].id;

    // 1. Curve Fever
    if (typeof CurveFeverEngine !== 'undefined' && activeMinigameEngine instanceof CurveFeverEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      }
    }
    // 2. Tank Trouble
    else if (typeof TankTroubleEngine !== 'undefined' && activeMinigameEngine instanceof TankTroubleEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: true });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: true });
      } else if (e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'Enter') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { fire: true });
      }
    }
    // 3. Head Soccer
    else if (typeof HeadSoccerEngine !== 'undefined' && activeMinigameEngine instanceof HeadSoccerEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: true });
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'Enter') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { kick: true });
      }
    }
    // 4. Bomberman
    else if (typeof BombermanEngine !== 'undefined' && activeMinigameEngine instanceof BombermanEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: true });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: true });
      } else if (e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'Enter') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { bomb: true });
      }
    }
    // 5. HaxBall
    else if (typeof HaxballEngine !== 'undefined' && activeMinigameEngine instanceof HaxballEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: true });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: true });
      } else if (e.key === ' ' || e.key === 'j' || e.key === 'J' || e.key === 'Enter') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { kick: true });
      }
    }
    // 6. Mario Kart Controls on PC
    else if (typeof MarioKartEngine !== 'undefined' && activeMinigameEngine instanceof MarioKartEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { steer: -1 });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { steer: 1 });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { gas: true });
      } else if (e.key === ' ' || e.key === 'Shift') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { drift: true });
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { item: true });
      }
    }
    // 7. Super Smash Bros Controls on PC
    else if (typeof SuperSmashEngine !== 'undefined' && activeMinigameEngine instanceof SuperSmashEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: true });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: true });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: true });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: true });
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { attack: true });
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'x' || e.key === 'X') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { special: true });
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'c' || e.key === 'C') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { shield: true });
      }
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (activeMinigameEngine && currentPlayers.length > 0) {
    const firstPlayerId = currentPlayers[0].id;

    // 1. Curve Fever
    if (typeof CurveFeverEngine !== 'undefined' && activeMinigameEngine instanceof CurveFeverEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      }
    }
    // 2. Tank Trouble
    else if (typeof TankTroubleEngine !== 'undefined' && activeMinigameEngine instanceof TankTroubleEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: false });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: false });
      }
    }
    // 3. Head Soccer
    else if (typeof HeadSoccerEngine !== 'undefined' && activeMinigameEngine instanceof HeadSoccerEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      }
    }
    // 4. Bomberman
    else if (typeof BombermanEngine !== 'undefined' && activeMinigameEngine instanceof BombermanEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: false });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: false });
      }
    }
    // 5. HaxBall
    else if (typeof HaxballEngine !== 'undefined' && activeMinigameEngine instanceof HaxballEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: false });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: false });
      }
    }
    // 6. Mario Kart
    else if (typeof MarioKartEngine !== 'undefined' && activeMinigameEngine instanceof MarioKartEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { steer: 0 });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { gas: false });
      } else if (e.key === ' ' || e.key === 'Shift') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { drift: false });
      }
    }
    // 7. Super Smash
    else if (typeof SuperSmashEngine !== 'undefined' && activeMinigameEngine instanceof SuperSmashEngine) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { left: false });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { right: false });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { up: false });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { down: false });
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'c' || e.key === 'C') {
        activeMinigameEngine.handlePlayerInput(firstPlayerId, { shield: false });
      }
    }
  }
});

// Arcade Minigame Selector Listener
const btnAdminLaunchArcade = document.getElementById('btn-admin-launch-arcade');
const selectArcadeMinigame = document.getElementById('select-arcade-minigame');
if (btnAdminLaunchArcade && selectArcadeMinigame) {
  btnAdminLaunchArcade.addEventListener('click', () => {
    const selectedType = selectArcadeMinigame.value;
    socket.emit('admin_launch_minigame', { gameType: selectedType });
  });
}

// Standalone Arcade Mode Exit Handlers
const btnStandaloneExit = document.getElementById('btn-standalone-exit');
if (btnStandaloneExit) {
  btnStandaloneExit.addEventListener('click', () => {
    document.body.classList.remove('standalone-game-active');
    socket.emit('podium_continue_to_map');
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('standalone-game-active')) {
    document.body.classList.remove('standalone-game-active');
    socket.emit('podium_continue_to_map');
  }
});

// Admin Safe Minigame Abort (Returns to map without completing level)
const btnAdminAbortMinigame = document.getElementById('btn-admin-abort-minigame');
if (btnAdminAbortMinigame) {
  btnAdminAbortMinigame.addEventListener('click', () => {
    socket.emit('admin_abort_minigame');
  });
}

// Admin Skip / Unlock Level
const btnAdminSkipLevel = document.getElementById('btn-admin-skip-level');
if (btnAdminSkipLevel) {
  btnAdminSkipLevel.addEventListener('click', () => {
    socket.emit('admin_skip_level');
  });
}

// Start initialization
initNetworkInfo();
if (window.LobbyRoom && typeof LobbyRoom.init === 'function') {
  LobbyRoom.init('#lobby-room-stage');
}
