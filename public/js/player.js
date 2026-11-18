/**
 * PLAYER CONTROLLER - MANDO MÓVIL
 * Personalizador de Avatar South Park, mandos de J1, soundboard de reacciones y controles.
 */

const socket = io();
window.socket = socket;

// Saved preferences or defaults
const savedName = localStorage.getItem('chaval_name');
const matchedPreset = (typeof AVATAR_PRESETS !== 'undefined')
  ? (AVATAR_PRESETS.find(p => p.name.toLowerCase() === (savedName || '').toLowerCase()) || null)
  : null;

let selectedPresetId = matchedPreset ? matchedPreset.id : 'random';
let currentAvatar = matchedPreset
  ? JSON.parse(JSON.stringify(matchedPreset.config))
  : getRandomAvatar();
let myPlayerId = null;
let isJoined = false;
function detectIsAndroid() {
  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  if (ua.includes('android')) return true;
  if (navigator.userAgentData?.platform?.toLowerCase()?.includes('android')) return true;
  return false;
}
let isAndroidDevice = detectIsAndroid();

function safeVibrate(pattern) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
        return;
      }
      navigator.vibrate(pattern);
    }
  } catch (e) {}
}

// Screen Wake Lock API (keeps mobile screen awake during party game)
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    }
  } catch (err) {
    // Wake lock may fail if battery saver is on or document not visible
  }
}

document.addEventListener('pointerdown', () => {
  if (!wakeLock) requestWakeLock();
}, { once: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !wakeLock) {
    requestWakeLock();
  }
});

let lastHeatData = null;
let currentMinigameType = 'race';

function showActiveGamepad(gType) {
  const padRace = document.getElementById('pad-race');
  const padSmash = document.getElementById('pad-smash');
  const padCurve = document.getElementById('pad-curve');
  const padTank = document.getElementById('pad-tank');
  const padHead = document.getElementById('pad-headsoccer');
  const padBomb = document.getElementById('pad-bomberman');
  const padHax = document.getElementById('pad-haxball');
  const padBash = document.getElementById('pad-buttonbash');

  const pads = [padRace, padSmash, padCurve, padTank, padHead, padBomb, padHax, padBash];
  pads.forEach(p => { if (p) p.style.display = 'none'; });

  if (gType === 'curve') {
    if (padCurve) padCurve.style.display = 'flex';
  } else if (gType === 'tank') {
    if (padTank) padTank.style.display = 'flex';
  } else if (gType === 'headsoccer') {
    if (padHead) padHead.style.display = 'flex';
    const headTeamBadge = document.getElementById('head-team-badge');
    const myTeam = (currentGameState?.teams?.teamB || []).some(p => p.id === socket.id) ? 'teamB' : 'teamA';
    if (headTeamBadge) {
      if (myTeam === 'teamB') {
        headTeamBadge.textContent = '🔴 EQUIPO ROJO';
        headTeamBadge.style.background = '#ef4444';
      } else {
        headTeamBadge.textContent = '🔵 EQUIPO AZUL';
        headTeamBadge.style.background = '#3b82f6';
      }
    }
  } else if (gType === 'bomberman') {
    if (padBomb) padBomb.style.display = 'flex';
  } else if (gType === 'haxball') {
    if (padHax) padHax.style.display = 'flex';
  } else if (gType === 'buttonbash' || gType === 'bash') {
    if (typeof resetBashPrankState === 'function') resetBashPrankState();
    if (padBash) padBash.style.display = 'flex';
  } else if (gType === 'brawler' || gType === 'smash' || gType === 'opensmash') {
    if (padSmash) padSmash.style.display = 'flex';
  } else {
    if (padRace) padRace.style.display = 'flex';
  }
}
const screenCreator = document.getElementById('screen-creator');
const screenLobbyPad = document.getElementById('screen-lobby-pad');
const screenController = document.getElementById('screen-controller');
const previewAvatarBox = document.getElementById('preview-avatar-box');
const inputPlayerName = document.getElementById('input-player-name');
const btnRandomAvatar = document.getElementById('btn-random-avatar');
const creatorTabs = document.getElementById('creator-tabs');
const optionsScroller = document.getElementById('options-scroller');
const btnToggleReady = document.getElementById('btn-toggle-ready');
const readyStatusBanner = document.getElementById('ready-status-banner');
const nameValidationMsg = document.getElementById('name-validation-msg');
let isPlayerReady = false;

// Screen 1B: Lobby Lounge Controller Elements
const lobbyPadAvatarThumb = document.getElementById('lobby-pad-avatar-thumb');
const lobbyPadPlayerName = document.getElementById('lobby-pad-player-name');
const btnLobbyUnready = document.getElementById('btn-lobby-unready');
const btnLobbyLeft = document.getElementById('btn-lobby-left');
const btnLobbyRight = document.getElementById('btn-lobby-right');
const btnLobbyJump = document.getElementById('btn-lobby-jump');
let lobbyInput = { left: false, right: false, jump: false };

// Controller screen elements
const playerTopBadge = document.getElementById('player-top-badge');
const controllerAvatarThumb = document.getElementById('controller-avatar-thumb');
const controllerPlayerName = document.getElementById('controller-player-name');
const controllerRoleBadge = document.getElementById('controller-role-badge');
const controllerDeviceBadge = document.getElementById('controller-device-badge');
const boxAndroidMeme = document.getElementById('box-android-meme');
const boxJ1Controls = document.getElementById('box-j1-controls');
const btnJ1StartGame = document.getElementById('btn-j1-start-game');
const boxPlayerMapNav = document.getElementById('box-player-map-nav');
const playerMyNodeBadge = document.getElementById('player-my-node-badge');
const btnPlayerMovePrev = document.getElementById('btn-player-move-prev');
const btnPlayerMoveNext = document.getElementById('btn-player-move-next');
const gatherCount = document.getElementById('gather-count');
const j1MapActions = document.getElementById('j1-map-actions');
const btnJ1EnterLevel = document.getElementById('btn-j1-enter-level');
const btnJ1GatherAll = document.getElementById('btn-j1-gather-all');
const boxMinigameControls = document.getElementById('box-minigame-controls');
const minigameTeamBanner = document.getElementById('minigame-team-banner');

// Pre-fill name if stored or match preset name, otherwise random chaval name
const defaultRandomName = `Chaval_${Math.floor(Math.random() * 90 + 10)}`;
inputPlayerName.value = savedName || (matchedPreset ? matchedPreset.name : defaultRandomName);

let activeGlobalTab = 'handItem';

// Preset chips scroller & specific customizer elements
const presetChipsScroll = document.getElementById('preset-chips-scroll');
const characterSpecificBox = document.getElementById('character-specific-box');
const characterSpecificTitle = document.getElementById('character-specific-title');
const specificOptionsContainer = document.getElementById('specific-options-container');

// 3D Champion Carousel State & Elements
let currentChampionIndex = 0;
const championNameTitle = document.getElementById('champion-name-title');
const slotChampLeft = document.getElementById('slot-champ-left');
const slotChampCenter = document.getElementById('slot-champ-center');
const slotChampRight = document.getElementById('slot-champ-right');
const btnChampPrev = document.getElementById('btn-champ-prev');
const btnChampNext = document.getElementById('btn-champ-next');
const btnEditGamertag = document.getElementById('btn-edit-gamertag');
const gamertagEditHint = document.getElementById('gamertag-edit-hint');

function initChampionCarousel() {
  if (typeof AVATAR_PRESETS === 'undefined' || AVATAR_PRESETS.length === 0) return;

  const matchIdx = AVATAR_PRESETS.findIndex(p => p.id === selectedPresetId);
  currentChampionIndex = matchIdx >= 0 ? matchIdx : 0;

  if (btnChampPrev) {
    btnChampPrev.addEventListener('click', () => {
      if (isPlayerReady) return;
      navigateChampion(-1);
    });
  }
  if (btnChampNext) {
    btnChampNext.addEventListener('click', () => {
      if (isPlayerReady) return;
      navigateChampion(1);
    });
  }

  if (slotChampLeft) {
    slotChampLeft.addEventListener('click', () => {
      if (isPlayerReady) return;
      navigateChampion(-1);
    });
  }
  if (slotChampRight) {
    slotChampRight.addEventListener('click', () => {
      if (isPlayerReady) return;
      navigateChampion(1);
    });
  }

  // Touch swipe support on carousel stage
  const carouselStage = document.getElementById('champion-carousel-stage');
  if (carouselStage) {
    let touchStartX = 0;
    let touchEndX = 0;
    carouselStage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    carouselStage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          navigateChampion(-1);
        } else {
          navigateChampion(1);
        }
      }
    }, { passive: true });
  }

  // Pencil edit focus
  if (btnEditGamertag) {
    btnEditGamertag.addEventListener('click', () => {
      if (inputPlayerName) {
        inputPlayerName.focus();
        inputPlayerName.select();
      }
    });
  }
  if (gamertagEditHint) {
    gamertagEditHint.addEventListener('click', () => {
      if (inputPlayerName) {
        inputPlayerName.focus();
        inputPlayerName.select();
      }
    });
  }

  renderChampionCarousel();
}

function navigateChampion(direction) {
  if (isPlayerReady) return;
  const prevChamp = AVATAR_PRESETS[currentChampionIndex];
  const total = AVATAR_PRESETS.length;
  currentChampionIndex = (currentChampionIndex + direction + total) % total;
  const newChamp = AVATAR_PRESETS[currentChampionIndex];

  selectedPresetId = newChamp.id;
  currentAvatar = JSON.parse(JSON.stringify(newChamp.config));

  // If current name is empty, starts with Chaval_, or matches previous champion name, update to new champion name!
  const currentVal = (inputPlayerName.value || '').trim();
  if (!currentVal || currentVal.startsWith('Chaval_') || (prevChamp && currentVal.toLowerCase() === prevChamp.name.toLowerCase())) {
    inputPlayerName.value = newChamp.name;
    localStorage.setItem('chaval_name', newChamp.name);
  }

  renderChampionCarousel();
  renderCharacterSpecificOptions();
  renderGlobalTabOptions(activeGlobalTab);

  if (window.soundEngine && typeof soundEngine.playStep === 'function') {
    soundEngine.playStep();
  }

  socket.emit('player_toggle_ready', {
    ready: false,
    name: inputPlayerName.value || newChamp.name,
    avatar: currentAvatar,
    isAndroid: isAndroidDevice
  });
}

function renderChampionCarousel() {
  if (typeof AVATAR_PRESETS === 'undefined' || AVATAR_PRESETS.length === 0) return;
  const total = AVATAR_PRESETS.length;
  const current = AVATAR_PRESETS[currentChampionIndex];
  const prevIdx = (currentChampionIndex - 1 + total) % total;
  const nextIdx = (currentChampionIndex + 1) % total;
  const prevPreset = AVATAR_PRESETS[prevIdx];
  const nextPreset = AVATAR_PRESETS[nextIdx];

  if (championNameTitle) {
    championNameTitle.textContent = current.name.toUpperCase();
  }

  if (slotChampLeft && typeof renderAvatarSVG === 'function') {
    slotChampLeft.innerHTML = renderAvatarSVG(prevPreset.config, 85);
    slotChampLeft.setAttribute('title', prevPreset.name);
  }

  updateAvatarPreview();

  if (slotChampRight && typeof renderAvatarSVG === 'function') {
    slotChampRight.innerHTML = renderAvatarSVG(nextPreset.config, 85);
    slotChampRight.setAttribute('title', nextPreset.name);
  }
}

// Legacy helper for backwards compatibility
function initPresetChips() {
  initChampionCarousel();
}

// 1. Render Avatar Preview
function updateAvatarPreview() {
  const avatarSvg = renderAvatarSVG(currentAvatar, 165);
  const petSvg = currentAvatar.pet && currentAvatar.pet !== 'none' ? renderPetSVG(currentAvatar.pet, 58) : '';

  previewAvatarBox.innerHTML = `
    <div class="avatar-preview-stage" style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
      <div class="avatar-hero-wrap" style="display: flex; align-items: center; justify-content: center;">${avatarSvg}</div>
      ${petSvg ? `<div class="preview-pet-wrap" style="position: absolute; right: -26px; bottom: 4px; z-index: 4; animation: bounce 1.8s infinite ease-in-out; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">${petSvg}</div>` : ''}
    </div>
  `;
}

// 2. Render Character-Specific Options (Toggles binarios directos, sin placeholders innecesarios)
function renderCharacterSpecificOptions() {
  if (!specificOptionsContainer || typeof CHARACTER_SPECIFIC_OPTIONS === 'undefined') return;
  specificOptionsContainer.innerHTML = '';

  const specToggles = CHARACTER_SPECIFIC_OPTIONS[selectedPresetId] || [];
  if (specToggles.length === 0) {
    if (characterSpecificBox) characterSpecificBox.style.display = 'none';
    return;
  }

  if (characterSpecificBox) characterSpecificBox.style.display = 'block';

  const rowEl = document.createElement('div');
  rowEl.className = 'specific-toggles-row';

  specToggles.forEach(toggle => {
    const isActive = currentAvatar[toggle.prop] === toggle.on;
    const btn = document.createElement('button');
    btn.className = `toggle-pill ${isActive ? 'active' : ''} ${isPlayerReady ? 'is-locked' : ''}`;
    btn.innerHTML = `<span class="toggle-indicator">${isActive ? '🟢' : '⚪'}</span> <span>${toggle.label}</span>`;
    btn.addEventListener('click', () => {
      if (isPlayerReady) return;
      const willBeActive = currentAvatar[toggle.prop] !== toggle.on;
      currentAvatar[toggle.prop] = willBeActive ? toggle.on : toggle.off;
      if (typeof toggle.sideEffect === 'function') {
        toggle.sideEffect(currentAvatar, willBeActive);
      }
      updateAvatarPreview();
      renderCharacterSpecificOptions();
      socket.emit('player_toggle_ready', {
        ready: false,
        name: inputPlayerName.value.trim() || 'Chaval',
        avatar: currentAvatar,
        isAndroid: isAndroidDevice
      });
    });
    rowEl.appendChild(btn);
  });

  specificOptionsContainer.appendChild(rowEl);
}

// 3. Render Global Tab Options (En Mano & Mascota)
function renderGlobalTabOptions(tabKey) {
  activeGlobalTab = tabKey;
  if (!optionsScroller) return;
  optionsScroller.innerHTML = '';

  if (tabKey === 'handItem') {
    (AVATAR_OPTIONS.handItems || []).forEach(opt => {
      const pill = document.createElement('button');
      const isSelected = (currentAvatar.handItem || 'none') === opt.id;
      pill.className = `pill-option ${isSelected ? 'active' : ''} ${isPlayerReady ? 'is-locked' : ''}`;
      pill.innerHTML = `<span>${opt.icon || '✋'}</span> <span>${opt.label}</span>`;
      pill.title = opt.desc || opt.label;
      pill.addEventListener('click', () => {
        if (isPlayerReady) return;
        currentAvatar.handItem = opt.id;
        updateAvatarPreview();
        renderGlobalTabOptions('handItem');
        socket.emit('player_toggle_ready', {
          ready: false,
          name: inputPlayerName.value.trim() || 'Chaval',
          avatar: currentAvatar,
          isAndroid: isAndroidDevice
        });
      });
      optionsScroller.appendChild(pill);
    });
  } else if (tabKey === 'pet') {
    (AVATAR_OPTIONS.pets || []).forEach(opt => {
      const pill = document.createElement('button');
      const isSelected = (currentAvatar.pet || 'none') === opt.id;
      pill.className = `pill-option pill-pet ${isSelected ? 'active' : ''} ${isPlayerReady ? 'is-locked' : ''}`;
      pill.innerHTML = `<span>${opt.icon}</span> <span>${opt.label}</span>`;
      pill.title = opt.desc || opt.breed || opt.label;
      pill.addEventListener('click', () => {
        if (isPlayerReady) return;
        currentAvatar.pet = opt.id;
        updateAvatarPreview();
        renderGlobalTabOptions('pet');
        socket.emit('player_toggle_ready', {
          ready: false,
          name: inputPlayerName.value.trim() || 'Chaval',
          avatar: currentAvatar,
          isAndroid: isAndroidDevice
        });
      });
      optionsScroller.appendChild(pill);
    });
  }
}

// Tab Buttons click
if (creatorTabs) {
  creatorTabs.addEventListener('click', (e) => {
    if (isPlayerReady) return;
    const btn = e.target.closest('.tab-btn');
    if (btn) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGlobalTabOptions(btn.dataset.tab);
    }
  });
}

// Function to update UI locking state based on isPlayerReady
let currentServerStatus = 'lobby';

function updateLobbyScreenRouting() {
  if (currentServerStatus !== 'lobby') return;
  if (isPlayerReady) {
    if (screenCreator) screenCreator.classList.remove('active');
    if (screenLobbyPad) screenLobbyPad.classList.add('active');
    if (lobbyPadPlayerName) lobbyPadPlayerName.textContent = (inputPlayerName.value || '').trim() || 'Chaval';
    if (lobbyPadAvatarThumb) lobbyPadAvatarThumb.innerHTML = renderAvatarSVG(currentAvatar, 44);
  } else {
    if (screenLobbyPad) screenLobbyPad.classList.remove('active');
    if (screenCreator) screenCreator.classList.add('active');
  }
}

function setPlayerReadyUI(ready) {
  isPlayerReady = ready;
  if (isPlayerReady) {
    if (btnToggleReady) {
      btnToggleReady.innerHTML = '↩️ Deshacer Listo (Modificar)';
      btnToggleReady.className = 'btn btn-warning btn-big-action';
    }
    if (readyStatusBanner) readyStatusBanner.style.display = 'block';
    if (inputPlayerName) inputPlayerName.disabled = true;
    if (btnRandomAvatar) btnRandomAvatar.classList.add('is-locked');
    document.querySelectorAll('.preset-chip-btn, .pill-option, .tab-btn').forEach(el => el.classList.add('is-locked'));
  } else {
    if (btnToggleReady) {
      btnToggleReady.innerHTML = '✅ ¡LISTO PARA JUGAR!';
      btnToggleReady.className = 'btn btn-success btn-big-action';
    }
    if (readyStatusBanner) readyStatusBanner.style.display = 'none';
    if (inputPlayerName) inputPlayerName.disabled = false;
    if (btnRandomAvatar) btnRandomAvatar.classList.remove('is-locked');
    document.querySelectorAll('.preset-chip-btn, .pill-option, .tab-btn').forEach(el => el.classList.remove('is-locked'));
  }
  updateLobbyScreenRouting();
}

// Nickname Live Validation & Sync
if (inputPlayerName) {
  inputPlayerName.addEventListener('input', () => {
    const name = (inputPlayerName.value || '').trim();
    if (name.length < 2 || name.length > 15) {
      if (nameValidationMsg) nameValidationMsg.style.display = 'block';
    } else {
      if (nameValidationMsg) nameValidationMsg.style.display = 'none';
      localStorage.setItem('chaval_name', name);
      socket.emit('player_toggle_ready', {
        ready: isPlayerReady,
        name,
        avatar: currentAvatar,
        isAndroid: isAndroidDevice
      });
    }
  });
}

// Toggle Ready Button click
if (btnToggleReady) {
  btnToggleReady.addEventListener('click', () => {
    const name = (inputPlayerName.value || '').trim();
    if (name.length < 2 || name.length > 15) {
      if (nameValidationMsg) nameValidationMsg.style.display = 'block';
      inputPlayerName.focus();
      return;
    }
    if (nameValidationMsg) nameValidationMsg.style.display = 'none';

    localStorage.setItem('chaval_name', name);
    const nextReady = !isPlayerReady;
    setPlayerReadyUI(nextReady);

    const isAndroid = isAndroidDevice;
    socket.emit('player_toggle_ready', {
      ready: isPlayerReady,
      name,
      avatar: currentAvatar,
      isAndroid
    });

    // El sonido temático del personaje asignado se reproduce al darle a LISTO
    if (nextReady) {
      if (window.soundEngine) {
        soundEngine.playCharacterTheme(selectedPresetId, name);
      }
      socket.emit('player_character_selected', {
        characterId: selectedPresetId,
        characterName: name
      });

      // Si es Android real, reproducir también la bocina goofy de Android detectado en el móvil y en el admin
      if (isAndroid) {
        setTimeout(() => {
          if (window.soundEngine) soundEngine.playAndroidAlert();
        }, 600);
        socket.emit('android_ready_alert', {
          playerName: name,
          characterId: selectedPresetId
        });
      }
    }
  });
}

// Auto-register on socket connection
function sendCurrentRegistration(ready = isPlayerReady) {
  const name = (inputPlayerName.value || '').trim() || 'Chaval';
  const isAndroid = isAndroidDevice;
  socket.emit('player_join', {
    name,
    avatar: currentAvatar,
    isAndroid,
    ready
  });
}

socket.on('connect', () => {
  sendCurrentRegistration(isPlayerReady);
});

socket.on('player_kicked', (data) => {
  alert(data?.reason || 'Has sido expulsado por el Administrador.');
  window.location.reload();
});

// Render Dedicated Mobile Podium Screen (Large Winner Card & Cuadrilla Ranking)
function renderMobilePodium(gameState, players, me) {
  const winnerAvatarEl = document.getElementById('podium-mobile-winner-avatar');
  const winnerNameEl = document.getElementById('podium-mobile-winner-name');
  const winnerScoreEl = document.getElementById('podium-mobile-winner-score');
  const rankingListEl = document.getElementById('podium-mobile-ranking-list');
  const levelTagEl = document.getElementById('podium-mobile-level-tag');
  const btnJ1Continue = document.getElementById('btn-podium-j1-continue');
  const lockedMsg = document.getElementById('podium-locked-msg');

  const podiumData = gameState.lastPodium || {};
  const completedLevel = podiumData.completedLevel || gameState.minigameActive;
  if (levelTagEl && completedLevel) {
    levelTagEl.textContent = completedLevel.title || 'NIVEL COMPLETADO';
  }

  // Winner spotlight
  const winner = podiumData.winner || (players.slice().sort((a, b) => b.score - a.score)[0]);
  if (winner) {
    if (winnerAvatarEl && typeof renderAvatarSVG === 'function') {
      winnerAvatarEl.innerHTML = renderAvatarSVG(winner.avatar, 95);
    }
    if (winnerNameEl) winnerNameEl.textContent = winner.name;
    if (winnerScoreEl) winnerScoreEl.textContent = `${winner.score || 100} PTS`;
  }

  // Cuadrilla leaderboard ranking rows
  if (rankingListEl) {
    rankingListEl.innerHTML = '';
    const sorted = (podiumData.ranking || players.slice()).sort((a, b) => (b.score || 0) - (a.score || 0));
    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'podium-mobile-row';
      const medal = medals[idx] || `#${idx + 1}`;
      const isMe = p.id === (me ? me.id : socket.id);
      if (isMe) {
        row.style.background = '#fef08a';
        row.style.borderColor = '#0284c7';
      }
      const avatarSvg = (p.avatar && typeof renderAvatarSVG === 'function') ? renderAvatarSVG(p.avatar, 28) : '';
      row.innerHTML = `
        <div class="podium-mobile-row-left">
          <span class="podium-mobile-medal">${medal}</span>
          <div class="podium-mobile-avatar-mini">${avatarSvg}</div>
          <span class="podium-mobile-row-name">${escapeHtml(p.name || 'Chaval')} ${isMe ? '(Tú)' : ''}</span>
        </div>
        <span class="podium-mobile-row-score">${p.score || 0} pts</span>
      `;
      rankingListEl.appendChild(row);
    });
  }

  // J1 Leader Button to continue to map
  if (me && me.isJ1 && btnJ1Continue) {
    btnJ1Continue.style.display = 'block';
    if (lockedMsg) lockedMsg.textContent = '👑 Avanzar al mapa (J1):';
  } else {
    if (btnJ1Continue) btnJ1Continue.style.display = 'none';
    if (lockedMsg) lockedMsg.textContent = '📺 Podio en TV';
  }
}

// Update Mobile Controller View according to state
function updateControllerState(gameState, players) {
  const me = players.find(p => p.id === socket.id);
  if (!me) return;

  currentServerStatus = gameState.status || 'lobby';

  const screenPodiumMobile = document.getElementById('screen-podium-mobile');

  // View routing based on gameState.status
  if (gameState.status === 'podium') {
    if (screenCreator) screenCreator.classList.remove('active');
    if (screenLobbyPad) screenLobbyPad.classList.remove('active');
    if (screenController) screenController.classList.remove('active');
    if (screenPodiumMobile) screenPodiumMobile.classList.add('active');
    if (playerTopBadge) playerTopBadge.style.display = 'inline-flex';
    renderMobilePodium(gameState, players, me);
  } else if (gameState.status === 'map' || gameState.status === 'minigame') {
    if (screenCreator) screenCreator.classList.remove('active');
    if (screenLobbyPad) screenLobbyPad.classList.remove('active');
    if (screenPodiumMobile) screenPodiumMobile.classList.remove('active');
    if (screenController) screenController.classList.add('active');
    if (playerTopBadge) playerTopBadge.style.display = 'inline-flex';
  } else {
    // In lobby: route between screen-creator and screen-lobby-pad based on isPlayerReady
    if (screenController) screenController.classList.remove('active');
    if (screenPodiumMobile) screenPodiumMobile.classList.remove('active');
    if (playerTopBadge) playerTopBadge.style.display = 'none';
    if (me.ready !== isPlayerReady) {
      setPlayerReadyUI(Boolean(me.ready));
    } else {
      updateLobbyScreenRouting();
    }
  }

  // Header meta
  controllerAvatarThumb.innerHTML = renderAvatarSVG(me.avatar, 50);
  controllerPlayerName.textContent = me.name;

  if (me.isJ1) {
    controllerRoleBadge.textContent = '👑 J1 (Líder)';
    controllerRoleBadge.className = 'badge badge-j1';
  } else {
    controllerRoleBadge.textContent = 'Jugador';
    controllerRoleBadge.className = 'badge';
  }

  if (controllerDeviceBadge) {
    controllerDeviceBadge.style.display = 'none';
  }
  if (boxAndroidMeme) {
    boxAndroidMeme.style.display = 'none';
  }

  let myCurrentMapNode = 0;

  // Adjust J1 & Map Navigation visibility by game status
  if (gameState.status === 'lobby') {
    if (boxJ1Controls) boxJ1Controls.style.display = me.isJ1 ? 'block' : 'none';
    if (btnJ1StartGame) btnJ1StartGame.style.display = 'none'; // El Admin inicia la partida desde el host
    if (boxPlayerMapNav) boxPlayerMapNav.style.display = 'none';
    if (boxMinigameControls) boxMinigameControls.style.display = 'none';
  } else if (gameState.status === 'podium') {
    if (boxJ1Controls) boxJ1Controls.style.display = 'none';
    if (btnJ1StartGame) btnJ1StartGame.style.display = 'none';
    if (boxPlayerMapNav) boxPlayerMapNav.style.display = 'none';
    if (j1MapActions) j1MapActions.style.display = 'none';
    if (boxMinigameControls) boxMinigameControls.style.display = 'none';
  } else if (gameState.status === 'map') {
    if (boxJ1Controls) boxJ1Controls.style.display = 'none';
    if (btnJ1StartGame) btnJ1StartGame.style.display = 'none';
    if (boxMinigameControls) boxMinigameControls.style.display = 'none';
    if (boxPlayerMapNav) boxPlayerMapNav.style.display = 'block';
    if (j1MapActions) j1MapActions.style.display = me.isJ1 ? 'flex' : 'none';

    // Player node display & level lock progression
    const myNode = (gameState.playerPositions && gameState.playerPositions[me.id] !== undefined)
      ? gameState.playerPositions[me.id]
      : (myCurrentMapNode || 0);
    myCurrentMapNode = myNode;
    if (playerMyNodeBadge) {
      playerMyNodeBadge.textContent = `📍 Mi posición: Mundo 1-${myNode + 1}`;
    }

    const maxUnlocked = typeof gameState.maxUnlockedNode === 'number' ? gameState.maxUnlockedNode : 0;
    if (btnPlayerMoveNext) {
      if (myCurrentMapNode >= maxUnlocked) {
        btnPlayerMoveNext.disabled = true;
        btnPlayerMoveNext.style.opacity = '0.5';
        btnPlayerMoveNext.style.cursor = 'not-allowed';
        btnPlayerMoveNext.innerHTML = '🔒 Bloqueado';
      } else {
        btnPlayerMoveNext.disabled = false;
        btnPlayerMoveNext.style.opacity = '1';
        btnPlayerMoveNext.style.cursor = 'pointer';
        btnPlayerMoveNext.innerHTML = 'Siguiente ➡️';
      }
    }
    if (btnPlayerMovePrev) {
      if (myCurrentMapNode <= 0) {
        btnPlayerMovePrev.disabled = true;
        btnPlayerMovePrev.style.opacity = '0.5';
        btnPlayerMovePrev.style.cursor = 'not-allowed';
      } else {
        btnPlayerMovePrev.disabled = false;
        btnPlayerMovePrev.style.opacity = '1';
        btnPlayerMovePrev.style.cursor = 'pointer';
      }
    }
  } else if (gameState.status === 'minigame') {
    if (boxJ1Controls) boxJ1Controls.style.display = 'none';
    if (btnJ1StartGame) btnJ1StartGame.style.display = 'none';
    if (boxPlayerMapNav) boxPlayerMapNav.style.display = 'none';
    if (j1MapActions) j1MapActions.style.display = 'none';
    if (boxMinigameControls) boxMinigameControls.style.display = 'flex';

    // Find my team
    const teamA = gameState.teams?.teamA || [];
    const inTeamA = teamA.some(p => p.id === me.id);

    if (inTeamA) {
      minigameTeamBanner.textContent = '🔵 AZUL';
      minigameTeamBanner.style.background = '#1e3a8a';
      minigameTeamBanner.style.color = '#93c5fd';
    } else {
      minigameTeamBanner.textContent = '🔴 ROJO';
      minigameTeamBanner.style.background = '#7f1d1d';
      minigameTeamBanner.style.color = '#fca5a5';
    }

    const boxBench = document.getElementById('box-bench-spectator');
    currentMinigameType = gameState.minigameActive?.gameType || (gameState.currentLevelIndex === 0 ? 'race' : 'brawler');

    if (lastHeatData && lastHeatData.activePlayerIds && !lastHeatData.activePlayerIds.includes(me.id)) {
      if (boxBench) boxBench.style.display = 'flex';
      minigameTeamBanner.textContent = `🛋️ BANQUILLO (${lastHeatData.heatIndex}/${lastHeatData.totalHeats})`;
      const pads = ['pad-race', 'pad-smash', 'pad-curve', 'pad-tank', 'pad-headsoccer', 'pad-bomberman', 'pad-haxball'];
      pads.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    } else {
      if (boxBench) boxBench.style.display = 'none';
      showActiveGamepad(currentMinigameType);
    }
  } else {
    const boxBench = document.getElementById('box-bench-spectator');
    if (boxBench) boxBench.style.display = 'none';
    lastHeatData = null;
  }
}

// Socket Listeners
socket.on('state_update', (data) => {
  myPlayerId = socket.id;
  updateControllerState(data.gameState, data.players || []);
});

// Pelotón status from server
socket.on('map_peloton_status', (data) => {
  if (data.playerPositions && myPlayerId && data.playerPositions[myPlayerId] !== undefined) {
    if (playerMyNodeBadge) {
      playerMyNodeBadge.textContent = `📍 Mi posición: Mundo 1-${data.playerPositions[myPlayerId] + 1}`;
    }
  }

  if (gatherCount) {
    const atMyNode = data.countsByNode ? (data.countsByNode[data.targetNode !== null ? data.targetNode : 0] || 1) : (data.readyCount || 1);
    gatherCount.textContent = `${data.readyCount || 1} / ${data.totalPlayers || 1}`;
    if (data.allAtNode) {
      gatherCount.style.color = '#4ade80';
    } else {
      gatherCount.style.color = '#60a5fa';
    }
  }

  if (btnJ1EnterLevel) {
    const textSpan = document.getElementById('j1-enter-text');
    if (data.allAtNode) {
      if (textSpan) textSpan.innerHTML = '✨ ¡PELOTÓN REUNIDO! MANTÉN (750ms)';
      btnJ1EnterLevel.className = 'btn btn-success btn-big-action btn-hold-protected';
    } else {
      if (textSpan) textSpan.innerHTML = `🏁 MANTÉN PARA ENTRAR (${data.readyCount || 1}/${data.totalPlayers || 1})`;
      btnJ1EnterLevel.className = 'btn btn-warning btn-big-action btn-hold-protected';
    }
  }
});

// Listener when player attempts to advance to a locked level
socket.on('map_move_blocked', (data) => {
  safeVibrate([60, 40, 60]);
  if (playerMyNodeBadge) {
    const originalText = playerMyNodeBadge.textContent;
    playerMyNodeBadge.textContent = data.reason || '🔒 ¡Nivel bloqueado!';
    playerMyNodeBadge.style.color = '#ef4444';
    setTimeout(() => {
      playerMyNodeBadge.textContent = originalText;
      playerMyNodeBadge.style.color = '#fbbf24';
    }, 2400);
  }
});

// J1 Button Actions
if (btnJ1StartGame) {
  btnJ1StartGame.addEventListener('click', () => {
    socket.emit('start_game');
  });
}

if (btnPlayerMoveNext) {
  btnPlayerMoveNext.addEventListener('click', () => {
    socket.emit('player_move_node', { direction: 'next' });
    safeVibrate(25);
  });
}

if (btnPlayerMovePrev) {
  btnPlayerMovePrev.addEventListener('click', () => {
    socket.emit('player_move_node', { direction: 'prev' });
    safeVibrate(25);
  });
}

if (btnJ1GatherAll) {
  btnJ1GatherAll.addEventListener('click', () => {
    socket.emit('map_gather_squad');
    safeVibrate(40);
  });
}

// Protected Hold-to-Confirm for J1 (750ms with progress bar & haptics)
function bindProtectedHoldAction(btnEl, durationMs = 750, onConfirm) {
  if (!btnEl) return;
  let holdTimer = null;
  let tickInterval = null;
  let startTime = 0;

  function cancelHold() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    btnEl.classList.remove('is-holding');
    const progressBar = btnEl.querySelector('.hold-progress-bar');
    if (progressBar) progressBar.style.width = '0%';
  }

  btnEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startTime = Date.now();
    btnEl.classList.add('is-holding');
    safeVibrate(20);

    const progressBar = btnEl.querySelector('.hold-progress-bar');

    tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (elapsed >= 250 && elapsed < 280) safeVibrate(25);
      if (elapsed >= 500 && elapsed < 530) safeVibrate(35);
    }, 25);

    holdTimer = setTimeout(() => {
      cancelHold();
      btnEl.classList.add('is-confirmed');
      const pb = btnEl.querySelector('.hold-progress-bar');
      if (pb) pb.style.width = '100%';
      safeVibrate([60, 40, 100]);
      if (window.soundEngine && typeof soundEngine.playMarioCoin === 'function') {
        soundEngine.playMarioCoin();
      }
      if (typeof onConfirm === 'function') onConfirm();

      setTimeout(() => {
        btnEl.classList.remove('is-confirmed');
        if (pb) pb.style.width = '0%';
      }, 600);
    }, durationMs);
  });

  btnEl.addEventListener('pointerup', cancelHold);
  btnEl.addEventListener('pointercancel', cancelHold);
  btnEl.addEventListener('pointerleave', cancelHold);
}

if (btnJ1EnterLevel) {
  bindProtectedHoldAction(btnJ1EnterLevel, 750, () => {
    socket.emit('map_enter_level');
  });
}

// Soundboard Meme de la Cuadrilla con Cooldown de 4 segundos
let soundboardCooldownActive = false;
let soundboardCooldownTimer = null;
const soundboardCooldownBadge = document.getElementById('soundboard-cooldown-badge');

function triggerSoundboardCooldown(durationMs = 4000) {
  soundboardCooldownActive = true;
  const buttons = document.querySelectorAll('.btn-emote');
  buttons.forEach(b => {
    b.disabled = true;
    b.classList.add('is-cooldown');
  });

  const badges = document.querySelectorAll('.soundboard-cooldown-badge, #soundboard-cooldown-badge');
  let remainingSec = Math.ceil(durationMs / 1000);
  badges.forEach(b => {
    b.style.display = 'inline-block';
    b.textContent = `⏳ ${remainingSec}s`;
  });

  const interval = setInterval(() => {
    remainingSec--;
    if (remainingSec > 0) {
      badges.forEach(b => {
        b.textContent = `⏳ ${remainingSec}s`;
      });
    } else {
      clearInterval(interval);
    }
  }, 1000);

  clearTimeout(soundboardCooldownTimer);
  soundboardCooldownTimer = setTimeout(() => {
    soundboardCooldownActive = false;
    buttons.forEach(b => {
      b.disabled = false;
      b.classList.remove('is-cooldown');
    });
    badges.forEach(b => {
      b.style.display = 'none';
    });
  }, durationMs);
}

document.querySelectorAll('.btn-emote').forEach(btn => {
  btn.addEventListener('click', () => {
    if (soundboardCooldownActive) return;

    btn.classList.add('is-pressed');
    setTimeout(() => btn.classList.remove('is-pressed'), 140);

    const emote = btn.dataset.emote || '📢';
    const soundName = btn.dataset.sound || 'bocina';

    // Reproducir en local
    if (window.soundEngine) {
      soundEngine.playSoundByName(soundName);
    }

    // Emitir a la sala para que suene en la pantalla grande
    socket.emit('player_emote', {
      emote,
      sound: soundName,
      playerName: inputPlayerName.value || 'Chaval'
    });

    // Activar cooldown de 4s
    triggerSoundboardCooldown(4000);

    // Haptic feedback
    safeVibrate(40);
  });
});

// Socket listeners para eventos del minijuego y temas de personajes
socket.on('character_theme_broadcast', (data) => {
  if (data && window.soundEngine) {
    if (data.playerId !== socket.id) {
      soundEngine.playCharacterTheme(data.characterId, data.characterName || data.playerName);
    }
  }
});

socket.on('minigame_event_broadcast', (data) => {
  if (!data) return;
  if (data.type === 'buttonbash_turn') {
    const isMyTurn = data.activePlayerId === socket.id;
    const bashTurnTitle = document.getElementById('bash-turn-title');
    const bashTurnSub = document.getElementById('bash-turn-sub');
    const btnBashTarget = document.getElementById('btn-bash-target');
    const mobilePrankOverlay = document.getElementById('bash-mobile-prank-overlay');

    if (isMyTurn) {
      if (bashTurnTitle) bashTurnTitle.textContent = '🎯 ¡TU TURNO!';
      if (bashTurnSub) bashTurnSub.textContent = '';
      if (btnBashTarget) {
        btnBashTarget.disabled = false;
        btnBashTarget.classList.remove('locked');
      }
      if (mobilePrankOverlay) mobilePrankOverlay.style.display = 'none';
      safeVibrate([80, 40, 80]);
    } else {
      if (bashTurnTitle) bashTurnTitle.textContent = `Turno: ${data.activePlayerName || 'Compañero'}`;
      if (bashTurnSub) bashTurnSub.textContent = '';
      if (btnBashTarget) {
        btnBashTarget.disabled = true;
        btnBashTarget.classList.add('locked');
      }
    }
    return;
  }
  if (data.type === 'buttonbash_event') {
    handleButtonBashMobilePrank(data);
    return;
  }
  if (window.soundEngine) {
    if (data.type === 'kill') {
      soundEngine.playDeathSound(data.isFirst);
    } else if (data.type === 'danger_alarm') {
      soundEngine.playDangerAlarm();
    }
  }
  safeVibrate([100, 50, 100]);
});

socket.on('level_completed_celebration', () => {
  if (window.soundEngine) {
    soundEngine.playSocialCreditVictory();
  }
  const boxBench = document.getElementById('box-bench-spectator');
  if (boxBench) boxBench.style.display = 'none';
  lastHeatData = null;
});

// Heats & Spectator Mode on Phone
socket.on('minigame_heat_update', (data) => {
  lastHeatData = data;
  const boxBench = document.getElementById('box-bench-spectator');
  const benchHeatStatus = document.getElementById('bench-heat-status');
  const padContainers = ['pad-race', 'pad-smash', 'pad-curve', 'pad-tank', 'pad-headsoccer', 'pad-bomberman', 'pad-haxball'];

  if (!data || !data.activePlayerIds) return;

  const isActive = data.activePlayerIds.includes(myPlayerId);

  if (isActive) {
    if (boxBench) boxBench.style.display = 'none';
    safeVibrate([100, 50, 100]);
    if (minigameTeamBanner) {
      minigameTeamBanner.textContent = `⚔️ Ronda ${data.heatIndex}/${data.totalHeats}`;
    }
    showActiveGamepad(currentMinigameType);
  } else {
    if (screenCreator && screenController) {
      screenCreator.classList.remove('active');
      screenController.classList.add('active');
    }
    if (boxMinigameControls) {
      boxMinigameControls.style.display = 'flex';
    }
    if (boxJ1Controls) boxJ1Controls.style.display = 'none';
    if (boxPlayerMapNav) boxPlayerMapNav.style.display = 'none';

    if (boxBench) {
      boxBench.style.display = 'flex';
      if (benchHeatStatus) {
        benchHeatStatus.textContent = `Ronda ${data.heatIndex}/${data.totalHeats}`;
      }
    }
    if (minigameTeamBanner) {
      minigameTeamBanner.textContent = `🛋️ BANQUILLO (${data.heatIndex}/${data.totalHeats})`;
    }
    padContainers.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
});

// Banquillo Spectator Shouts (max 10 chars, 15s cooldown)
const benchShoutInput = document.getElementById('bench-shout-input');
const benchCharCounter = document.getElementById('bench-char-counter');
const btnBenchSend = document.getElementById('btn-bench-send');
const benchCooldownNotice = document.getElementById('bench-cooldown-notice');
const benchCooldownTimer = document.getElementById('bench-cooldown-timer');
let benchCooldownRemaining = 0;
let benchTimerInterval = null;

if (benchShoutInput) {
  benchShoutInput.addEventListener('input', () => {
    const len = benchShoutInput.value.length;
    if (benchCharCounter) benchCharCounter.textContent = `${len}/10`;
  });
  benchShoutInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (btnBenchSend) btnBenchSend.click();
    }
  });
}

if (btnBenchSend) {
  btnBenchSend.addEventListener('click', () => {
    if (benchCooldownRemaining > 0) return;
    const txt = (benchShoutInput ? benchShoutInput.value : '').trim().substring(0, 10);
    if (!txt) return;

    socket.emit('player_bench_shout', { text: txt });
    if (benchShoutInput) benchShoutInput.value = '';
    if (benchCharCounter) benchCharCounter.textContent = '0/10';

    benchCooldownRemaining = 15;
    btnBenchSend.disabled = true;
    if (benchCooldownNotice) benchCooldownNotice.style.display = 'block';
    if (benchCooldownTimer) benchCooldownTimer.textContent = '15';

    if (benchTimerInterval) clearInterval(benchTimerInterval);
    benchTimerInterval = setInterval(() => {
      benchCooldownRemaining--;
      if (benchCooldownTimer) benchCooldownTimer.textContent = String(benchCooldownRemaining);
      if (benchCooldownRemaining <= 0) {
        clearInterval(benchTimerInterval);
        benchTimerInterval = null;
        btnBenchSend.disabled = false;
        if (benchCooldownNotice) benchCooldownNotice.style.display = 'none';
      }
    }, 1000);
    safeVibrate(40);
  });
}

socket.on('bench_shout_error', (data) => {
  if (data && typeof data.remainingSec === 'number') {
    benchCooldownRemaining = data.remainingSec;
    if (btnBenchSend) btnBenchSend.disabled = true;
    if (benchCooldownNotice) benchCooldownNotice.style.display = 'block';
    if (benchCooldownTimer) benchCooldownTimer.textContent = String(benchCooldownRemaining);
  }
});

// Podium J1 Continue button
const btnPodiumJ1Continue = document.getElementById('btn-podium-j1-continue');
if (btnPodiumJ1Continue) {
  btnPodiumJ1Continue.addEventListener('click', () => {
    socket.emit('podium_continue_to_map');
  });
}

// Interactive Minigame Touch Gamepad Helpers (Mario Kart & Super Smash Bros)
function bindHoldButton(el, onDown, onUp) {
  if (!el) return;
  const start = (e) => {
    e.preventDefault();
    el.classList.add('is-pressed');
    safeVibrate(25);
    onDown();
  };
  const end = (e) => {
    e.preventDefault();
    el.classList.remove('is-pressed');
    onUp();
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('pointerleave', end);
}

function bindTapButton(el, onTap) {
  if (!el) return;
  let lastTapTime = 0;
  const tap = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const now = Date.now();
    if (now - lastTapTime < 350) return;
    lastTapTime = now;
    el.classList.add('is-pressed');
    safeVibrate(35);
    onTap();
    setTimeout(() => el.classList.remove('is-pressed'), 120);
  };
  el.addEventListener('pointerdown', tap);
  el.addEventListener('click', tap);
}

// 1. Mario Kart Mobile Bindings
bindHoldButton(document.getElementById('btn-kart-left'),
  () => socket.emit('player_input', { steer: -1 }),
  () => socket.emit('player_input', { steer: 0 })
);
bindHoldButton(document.getElementById('btn-kart-right'),
  () => socket.emit('player_input', { steer: 1 }),
  () => socket.emit('player_input', { steer: 0 })
);
bindHoldButton(document.getElementById('btn-kart-gas'),
  () => socket.emit('player_input', { gas: true }),
  () => socket.emit('player_input', { gas: false })
);
bindHoldButton(document.getElementById('btn-kart-drift'),
  () => socket.emit('player_input', { drift: true }),
  () => socket.emit('player_input', { drift: false })
);
bindTapButton(document.getElementById('btn-kart-item'),
  () => socket.emit('player_input', { item: true })
);

// 2. Super Smash Bros Mobile Bindings
bindHoldButton(document.getElementById('btn-smash-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-smash-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);
bindHoldButton(document.getElementById('btn-smash-up'),
  () => socket.emit('player_input', { up: true }),
  () => socket.emit('player_input', { up: false })
);
bindHoldButton(document.getElementById('btn-smash-down'),
  () => socket.emit('player_input', { down: true }),
  () => socket.emit('player_input', { down: false })
);
bindTapButton(document.getElementById('btn-smash-jump-x'),
  () => {
    socket.emit('player_input', { up: true });
    setTimeout(() => socket.emit('player_input', { up: false }), 120);
  }
);
bindTapButton(document.getElementById('btn-smash-attack'),
  () => socket.emit('player_input', { attack: true })
);
bindTapButton(document.getElementById('btn-smash-special'),
  () => socket.emit('player_input', { special: true })
);
bindHoldButton(document.getElementById('btn-smash-shield'),
  () => socket.emit('player_input', { shield: true }),
  () => socket.emit('player_input', { shield: false })
);

// 3. Curve Fever Mobile Bindings
bindHoldButton(document.getElementById('btn-curve-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-curve-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);

// 4. Tank Trouble Mobile Bindings
bindHoldButton(document.getElementById('btn-tank-up'),
  () => socket.emit('player_input', { up: true }),
  () => socket.emit('player_input', { up: false })
);
bindHoldButton(document.getElementById('btn-tank-down'),
  () => socket.emit('player_input', { down: true }),
  () => socket.emit('player_input', { down: false })
);
bindHoldButton(document.getElementById('btn-tank-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-tank-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);
bindTapButton(document.getElementById('btn-tank-fire'),
  () => socket.emit('player_input', { fire: true })
);

// 5. Head Soccer Mobile Bindings
bindHoldButton(document.getElementById('btn-head-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-head-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);
bindHoldButton(document.getElementById('btn-head-jump'),
  () => socket.emit('player_input', { up: true }),
  () => socket.emit('player_input', { up: false })
);
bindTapButton(document.getElementById('btn-head-kick'),
  () => socket.emit('player_input', { kick: true })
);

// 6. Bomberman Mobile Bindings
bindHoldButton(document.getElementById('btn-bomb-up'),
  () => socket.emit('player_input', { up: true }),
  () => socket.emit('player_input', { up: false })
);
bindHoldButton(document.getElementById('btn-bomb-down'),
  () => socket.emit('player_input', { down: true }),
  () => socket.emit('player_input', { down: false })
);
bindHoldButton(document.getElementById('btn-bomb-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-bomb-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);
bindTapButton(document.getElementById('btn-bomb-drop'),
  () => socket.emit('player_input', { bomb: true })
);

// 7. HaxBall Mobile Bindings
bindHoldButton(document.getElementById('btn-hax-up'),
  () => socket.emit('player_input', { up: true }),
  () => socket.emit('player_input', { up: false })
);
bindHoldButton(document.getElementById('btn-hax-down'),
  () => socket.emit('player_input', { down: true }),
  () => socket.emit('player_input', { down: false })
);
bindHoldButton(document.getElementById('btn-hax-left'),
  () => socket.emit('player_input', { left: true }),
  () => socket.emit('player_input', { left: false })
);
bindHoldButton(document.getElementById('btn-hax-right'),
  () => socket.emit('player_input', { right: true }),
  () => socket.emit('player_input', { right: false })
);
bindTapButton(document.getElementById('btn-hax-kick'),
  () => socket.emit('player_input', { kick: true })
);

// 8. Button Bash (Diana Buzzer) Bindings
bindTapButton(document.getElementById('btn-bash-target'), () => {
  safeVibrate(50);
  socket.emit('player_input', { bash: true, shoot: true, timestamp: Date.now() });
});
bindTapButton(document.getElementById('btn-bash-react-left'), () => {
  socket.emit('player_input', { bash_cheer: 'vamos' });
});
bindTapButton(document.getElementById('btn-bash-react-right'), () => {
  socket.emit('player_input', { bash_cheer: 'diana' });
});

// ============================================================================
// 9. DYNAMIC FLOATING JOYSTICK FOR SMASH / BRAWLER
// ============================================================================
const smashDpadContainer = document.getElementById('smash-dpad-container');
const smashFloatingBase = document.getElementById('smash-floating-base');
const smashFloatingStick = document.getElementById('smash-floating-stick');

if (smashDpadContainer && smashFloatingBase && smashFloatingStick) {
  let activeJoyPointerId = null;
  let joyOriginX = 0;
  let joyOriginY = 0;
  const maxJoyDist = 45;
  const deadZone = 14;
  let currentJoyState = { left: false, right: false, up: false, down: false };

  smashDpadContainer.addEventListener('pointerdown', (e) => {
    // Only capture if not clicking directly on one of the action buttons
    if (e.target.closest('.btn-dpad-horiz, .btn-jump, .btn-drop')) return;
    activeJoyPointerId = e.pointerId;
    smashDpadContainer.setPointerCapture(e.pointerId);

    const rect = smashDpadContainer.getBoundingClientRect();
    joyOriginX = e.clientX - rect.left;
    joyOriginY = e.clientY - rect.top;

    smashFloatingBase.style.left = `${joyOriginX}px`;
    smashFloatingBase.style.top = `${joyOriginY}px`;
    smashFloatingStick.style.transform = `translate(0px, 0px)`;
    smashFloatingBase.style.display = 'flex';
  });

  smashDpadContainer.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeJoyPointerId) return;
    const rect = smashDpadContainer.getBoundingClientRect();
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;

    const dx = currX - joyOriginX;
    const dy = currY - joyOriginY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxJoyDist);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;
    smashFloatingStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

    const newState = {
      left: dx < -deadZone,
      right: dx > deadZone,
      up: dy < -deadZone,
      down: dy > deadZone
    };

    if (newState.left !== currentJoyState.left ||
        newState.right !== currentJoyState.right ||
        newState.up !== currentJoyState.up ||
        newState.down !== currentJoyState.down) {
      currentJoyState = newState;
      socket.emit('player_input', currentJoyState);
    }
  });

  function releaseSmashJoy(e) {
    if (e.pointerId !== activeJoyPointerId) return;
    activeJoyPointerId = null;
    smashFloatingBase.style.display = 'none';
    smashFloatingStick.style.transform = `translate(0px, 0px)`;
    currentJoyState = { left: false, right: false, up: false, down: false };
    socket.emit('player_input', currentJoyState);
  }

  smashDpadContainer.addEventListener('pointerup', releaseSmashJoy);
  smashDpadContainer.addEventListener('pointercancel', releaseSmashJoy);
}

// ============================================================================
// 10. BUTTON BASH INTERACTIVE MOBILE PRANK LOGIC
// ============================================================================
const bashNormalControls = document.getElementById('bash-normal-controls');
const bashMobilePrank = document.getElementById('bash-mobile-prank-overlay');
const prankStepVista = document.getElementById('prank-step-vista');
const prankStepRamen = document.getElementById('prank-step-ramen');
const ramenMsgStage1 = document.getElementById('ramen-msg-stage1');
const ramenMsgStage2 = document.getElementById('ramen-msg-stage2');
const prankStepBadostain = document.getElementById('prank-step-badostain');
const prankStepCaptcha = document.getElementById('prank-step-captcha');
const bashBlackoutScreen = document.getElementById('bash-blackout-fullscreen');
const blackoutSecTimer = document.getElementById('blackout-sec-timer');
const bashFakeRankingMobile = document.getElementById('bash-fake-ranking-mobile');

function resetBashPrankState() {
  if (bashNormalControls) bashNormalControls.style.display = 'flex';
  if (bashMobilePrank) bashMobilePrank.style.display = 'none';
  if (prankStepVista) prankStepVista.style.display = 'none';
  if (prankStepRamen) prankStepRamen.style.display = 'none';
  if (ramenMsgStage1) ramenMsgStage1.style.display = 'block';
  if (ramenMsgStage2) ramenMsgStage2.style.display = 'none';
  if (prankStepBadostain) prankStepBadostain.style.display = 'none';
  if (prankStepCaptcha) prankStepCaptcha.style.display = 'none';
  if (bashBlackoutScreen) bashBlackoutScreen.style.display = 'none';
  if (bashFakeRankingMobile) bashFakeRankingMobile.style.display = 'none';
}

function handleButtonBashMobilePrank(data) {
  if (data.stage === 'intro' || data.stage === 'finish') {
    resetBashPrankState();
  } else if (data.stage === 'prank_a') {
    if (bashNormalControls) bashNormalControls.style.display = 'none';
    if (bashMobilePrank) bashMobilePrank.style.display = 'flex';
    if (prankStepVista) prankStepVista.style.display = 'block';
    safeVibrate([60, 40, 60]);
  } else if (data.stage === 'prank_c_badostain') {
    if (bashMobilePrank) bashMobilePrank.style.display = 'flex';
    if (prankStepBadostain) prankStepBadostain.style.display = 'block';
    safeVibrate([40, 40, 80]);
  } else if (data.stage === 'blackout') {
    if (bashMobilePrank) bashMobilePrank.style.display = 'none';
    if (bashNormalControls) bashNormalControls.style.display = 'none';
    if (bashBlackoutScreen) bashBlackoutScreen.style.display = 'flex';
    let secLeft = Math.round(data.duration || 7);
    if (blackoutSecTimer) blackoutSecTimer.textContent = secLeft;
    const bTimer = setInterval(() => {
      secLeft--;
      if (blackoutSecTimer) blackoutSecTimer.textContent = Math.max(0, secLeft);
      if (secLeft <= 0) clearInterval(bTimer);
    }, 1000);
    safeVibrate([100, 50, 100, 50, 200]);
  } else if (data.stage === 'fake_ranking') {
    if (bashBlackoutScreen) bashBlackoutScreen.style.display = 'none';
    if (bashMobilePrank) bashMobilePrank.style.display = 'none';
    if (bashFakeRankingMobile) bashFakeRankingMobile.style.display = 'flex';
    safeVibrate([80, 50, 150]);
  }
}

// Vista close button -> Gangbang ramen offer
const btnPrankCloseVista = document.getElementById('btn-prank-close-vista');
if (btnPrankCloseVista) {
  btnPrankCloseVista.addEventListener('click', () => {
    safeVibrate(40);
    if (prankStepVista) prankStepVista.style.display = 'none';
    if (prankStepRamen) prankStepRamen.style.display = 'block';
    if (window.soundEngine) soundEngine.playDangerAlarm();
  });
}

// Gangbang Ramen: No -> "¿Por qué no? Mamá de 2 gatos..."
const btnRamenNo = document.getElementById('btn-ramen-no');
if (btnRamenNo) {
  btnRamenNo.addEventListener('click', () => {
    safeVibrate(50);
    if (ramenMsgStage1) ramenMsgStage1.style.display = 'none';
    if (ramenMsgStage2) ramenMsgStage2.style.display = 'block';
    if (window.soundEngine) soundEngine.playAndroidAlert();
  });
}

// Gangbang Ramen: Yes / Forced -> Captcha
function handleRamenAccepted() {
  safeVibrate(60);
  if (window.soundEngine) soundEngine.playMarioCoin();
  if (prankStepRamen) prankStepRamen.style.display = 'none';
  if (prankStepCaptcha) prankStepCaptcha.style.display = 'block';
}

const btnRamenYes = document.getElementById('btn-ramen-yes');
const btnRamenForce1 = document.getElementById('btn-ramen-force-1');
const btnRamenForce2 = document.getElementById('btn-ramen-force-2');
if (btnRamenYes) btnRamenYes.addEventListener('click', handleRamenAccepted);
if (btnRamenForce1) btnRamenForce1.addEventListener('click', handleRamenAccepted);
if (btnRamenForce2) btnRamenForce2.addEventListener('click', handleRamenAccepted);

// Badostáin Bizum
const btnBadostainBizum = document.getElementById('btn-badostain-bizum');
if (btnBadostainBizum) {
  btnBadostainBizum.addEventListener('click', () => {
    safeVibrate(50);
    btnBadostainBizum.textContent = '💸 Bizum Enviado (0.01€)';
    if (window.soundEngine) soundEngine.playMarioCoin();
    setTimeout(() => {
      if (prankStepBadostain) prankStepBadostain.style.display = 'none';
    }, 1200);
  });
}

// Captcha kalimotxo options
document.querySelectorAll('.btn-captcha-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    safeVibrate(40);
    if (btn.dataset.correct === 'true') {
      btn.style.background = '#22c55e';
      btn.style.color = '#ffffff';
      btn.textContent = '✅ ¡CORRECTO! Don Simón tibio aprobado';
      if (window.soundEngine) soundEngine.playMarioCoin();
      setTimeout(() => {
        if (prankStepCaptcha) prankStepCaptcha.style.display = 'none';
      }, 1000);
    } else {
      btn.style.background = '#ef4444';
      btn.style.color = '#ffffff';
      btn.textContent = '❌ ERROR: Eso no es de cuadrilla';
      if (window.soundEngine) soundEngine.playAndroidAlert();
    }
  });
});

// Fallback keyboard on phone / browser
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') socket.emit('player_input', { steer: -1, left: true });
  if (e.key === 'ArrowRight') socket.emit('player_input', { steer: 1, right: true });
  if (e.key === 'ArrowUp' || e.key === ' ') socket.emit('player_input', { gas: true, up: true });
  if (e.key === 'ArrowDown') socket.emit('player_input', { down: true });
  if (e.key === 'z' || e.key === 'j') socket.emit('player_input', { attack: true, item: true, fire: true, kick: true, bomb: true });
  if (e.key === 'x' || e.key === 'k') socket.emit('player_input', { special: true, drift: true, kick: true });
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') socket.emit('player_input', { steer: 0, left: false, right: false });
  if (e.key === 'ArrowUp' || e.key === ' ') socket.emit('player_input', { gas: false, up: false });
  if (e.key === 'ArrowDown') socket.emit('player_input', { down: false });
  if (e.key === 'x' || e.key === 'k') socket.emit('player_input', { drift: false });
});

// ============================================================================
// LOBBY LOUNGE PAD BUTTON BINDINGS & KEYBOARD CONTROLS
// ============================================================================
function emitLobbyInput() {
  socket.emit('lobby_input', lobbyInput);
}

function bindLobbyControl(btn, key) {
  if (!btn) return;
  const press = (e) => {
    if (e.cancelable) e.preventDefault();
    btn.classList.add('is-pressed');
    if (!lobbyInput[key]) {
      lobbyInput[key] = true;
      emitLobbyInput();
      if (navigator.vibrate) {
        try { navigator.vibrate(key === 'jump' ? 25 : 15); } catch (_) {}
      }
    }
  };
  const release = (e) => {
    if (e && e.cancelable) e.preventDefault();
    btn.classList.remove('is-pressed');
    if (lobbyInput[key]) {
      lobbyInput[key] = false;
      emitLobbyInput();
    }
  };

  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('touchcancel', release, { passive: false });
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
}

bindLobbyControl(btnLobbyLeft, 'left');
bindLobbyControl(btnLobbyRight, 'right');
bindLobbyControl(btnLobbyJump, 'jump');

// Un-ready button in Lobby Pad
if (btnLobbyUnready) {
  btnLobbyUnready.addEventListener('click', () => {
    setPlayerReadyUI(false);
    const name = (inputPlayerName.value || '').trim() || 'Chaval';
    socket.emit('player_toggle_ready', {
      ready: false,
      name,
      avatar: currentAvatar,
      isAndroid: isAndroidDevice
    });
  });
}

// Soundboard in Lobby Pad (delegation)
const lobbyPadSoundboard = document.querySelector('.lobby-pad-soundboard');
if (lobbyPadSoundboard) {
  lobbyPadSoundboard.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-emote');
    if (!btn) return;
    const soundKey = btn.dataset.sound;
    const emoteChar = btn.dataset.emote;
    if (window.soundEngine && soundKey) {
      soundEngine.playMemeEmote(soundKey);
    }
    const name = (inputPlayerName.value || '').trim() || 'Chaval';
    socket.emit('player_emote', {
      emote: emoteChar,
      sound: soundKey,
      playerName: name
    });
    if (navigator.vibrate) {
      try { navigator.vibrate(25); } catch (_) {}
    }
  });
}

// Keyboard controls fallback for desktop browser testing in Lobby
window.addEventListener('keydown', (e) => {
  if (currentServerStatus !== 'lobby' || !isPlayerReady) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    if (!lobbyInput.left) {
      lobbyInput.left = true;
      if (btnLobbyLeft) btnLobbyLeft.classList.add('is-pressed');
      emitLobbyInput();
    }
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    if (!lobbyInput.right) {
      lobbyInput.right = true;
      if (btnLobbyRight) btnLobbyRight.classList.add('is-pressed');
      emitLobbyInput();
    }
  } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    if (!lobbyInput.jump) {
      lobbyInput.jump = true;
      if (btnLobbyJump) btnLobbyJump.classList.add('is-pressed');
      emitLobbyInput();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (currentServerStatus !== 'lobby' || !isPlayerReady) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    lobbyInput.left = false;
    if (btnLobbyLeft) btnLobbyLeft.classList.remove('is-pressed');
    emitLobbyInput();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    lobbyInput.right = false;
    if (btnLobbyRight) btnLobbyRight.classList.remove('is-pressed');
    emitLobbyInput();
  } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    lobbyInput.jump = false;
    if (btnLobbyJump) btnLobbyJump.classList.remove('is-pressed');
    emitLobbyInput();
  }
});

// Initial boot
initPresetChips();
renderCharacterSpecificOptions();
updateAvatarPreview();
renderGlobalTabOptions('handItem');
