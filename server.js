const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const { AVATAR_PRESETS, getRandomAvatar } = require('./public/js/avatar-engine.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3000;

// Helper: detect local LAN IPv4 address prioritizing physical Wi-Fi / Ethernet
function getAvailableIps() {
  const ifaces = os.networkInterfaces();
  const candidates = [];

  for (const dev in ifaces) {
    const isVirtual = /warp|vpn|tap|virtual|vethernet|hyper-v|loopback/i.test(dev);
    for (const details of ifaces[dev]) {
      if (details.family === 'IPv4' && !details.internal) {
        candidates.push({
          dev,
          ip: details.address,
          isVirtual,
          isHomeLan: details.address.startsWith('192.168.') || details.address.startsWith('10.')
        });
      }
    }
  }

  // Sort: Home LAN physical first, then others, virtual last
  candidates.sort((a, b) => {
    if (a.isHomeLan && !a.isVirtual && (!b.isHomeLan || b.isVirtual)) return -1;
    if (b.isHomeLan && !b.isVirtual && (!a.isHomeLan || a.isVirtual)) return 1;
    if (!a.isVirtual && b.isVirtual) return -1;
    if (a.isVirtual && !b.isVirtual) return 1;
    return 0;
  });

  return candidates;
}

function getLocalIp() {
  const ips = getAvailableIps();
  return ips.length > 0 ? ips[0].ip : 'localhost';
}

let localIp = getLocalIp();

// Serve static assets with no-cache in local development to avoid stale avatar SVGs
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use(express.json());

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/api/info', async (req, res) => {
  const isCloud = Boolean(process.env.K_SERVICE || process.env.PUBLIC_URL || req.headers['x-forwarded-host']);
  let joinUrl;

  if (process.env.PUBLIC_URL) {
    joinUrl = `${process.env.PUBLIC_URL}/player`;
  } else if (req.headers.host && (req.headers.host.includes('.run.app') || req.headers['x-forwarded-proto'])) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    joinUrl = `${proto}://${req.headers.host}/player`;
  } else {
    const selectedIp = req.query.ip || localIp;
    joinUrl = `http://${selectedIp}:${PORT}/player`;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      margin: 1,
      scale: 8,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    res.json({
      localIp: req.query.ip || localIp,
      availableIps: getAvailableIps(),
      port: PORT,
      joinUrl,
      qrDataUrl,
      isCloud
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
});

// Initial game state
const INITIAL_LEVELS = [
  {
    id: 1,
    title: '🌀 Curvas Chavalil',
    gameType: 'curve',
    lore: 'Curve Fever multijugador: solo 2 botones en móvil. Traza tu estela, esquiva las de tus amigos y sobrevive.',
    completed: false,
    stars: 0,
  },
  {
    id: 2,
    title: '🎯 Tank Trouble Chavalil',
    gameType: 'tank',
    lore: 'Guerra de tanques en laberinto. ¡Tus balas rebotan 5 veces en las paredes!',
    completed: false,
    stars: 0,
  },
  {
    id: 3,
    title: '⚽ Cabezones: Sports Heads',
    gameType: 'headsoccer',
    lore: 'Fútbol 2D lateral con cabezones de la cuadrilla, saltos y chutasos al travesaño.',
    completed: false,
    stars: 0,
  },
  {
    id: 4,
    title: '💣 Chaval Bomberman',
    gameType: 'bomberman',
    lore: 'Acción en cuadrícula con bombas, explosiones en cruz y power-ups de fuego y velocidad.',
    completed: false,
    stars: 0,
  },
  {
    id: 5,
    title: '🥅 HaxBall Chavalil',
    gameType: 'haxball',
    lore: 'Fútbol cenital en tiempo real con físicas de disco, pases medidos y disparos con potencia.',
    completed: false,
    stars: 0,
  },
  {
    id: 6,
    title: '🏎️ Mario Kart: Gran Premio Chavalil',
    gameType: 'race',
    lore: 'Carrera por equipos a máxima velocidad con derrapes, turbos y cajas de objetos.',
    completed: false,
    stars: 0,
  },
  {
    id: 7,
    title: '💥 Super Smash Chavalil',
    gameType: 'brawler',
    lore: 'Pelea campal por equipos sobre plataforma suspendida Battlefield con knockback exponencial.',
    completed: false,
    stars: 0,
  },
  {
    id: 8,
    title: '⚔️ OpenSmash: Destino Final',
    gameType: 'opensmash',
    lore: 'El coliseo definitivo sin plataformas blandas. Solo los más rápidos sobreviven al knockback en el vacío espacial.',
    completed: false,
    stars: 0,
  },
  {
    id: 9,
    title: '🎯 Diana de Dardos HotBunnies',
    gameType: 'buttonbash',
    lore: 'Torneo de dardos de precisión en la barra del bar HotBunnies. (Aviso: Marta y Violeta están de administradoras).',
    completed: false,
    stars: 0,
    isPrank: true
  }
];

let gameState = {
  status: 'lobby', // 'lobby' | 'map' | 'minigame' | 'minigame_result'
  currentLevelIndex: 0,
  levels: JSON.parse(JSON.stringify(INITIAL_LEVELS)),
  minigameActive: null,
  teams: { teamA: [], teamB: [], solo: [] }
};

// Players map: socketId -> Player
const players = new Map();

// Calculate highest unlocked node (Super Mario Bros rule: you cannot advance to level N unless level N-1 is completed)
function getMaxUnlockedNode() {
  let max = 0;
  for (let i = 0; i < gameState.levels.length - 1; i++) {
    if (gameState.levels[i].completed) {
      max = i + 1;
    } else {
      break;
    }
  }
  return max;
}

// Helper to sanitize game state and hide secret level names
function getSanitizedGameState() {
  const maxUnlocked = getMaxUnlockedNode();
  const sanitizedLevels = gameState.levels.map((lvl, idx) => {
    const isUnlocked = idx <= maxUnlocked;
    if (isUnlocked) {
      return { ...lvl, isSecret: false, isLocked: false };
    }
    return {
      id: lvl.id,
      title: `❓ Mundo 1-${lvl.id}: Enigma`,
      gameType: 'secret',
      lore: '🔒 Nivel bloqueado. ¡Debes superar el nivel anterior para abrir el camino!',
      completed: false,
      stars: 0,
      isSecret: true,
      isLocked: true
    };
  });

  return {
    ...gameState,
    maxUnlockedNode: maxUnlocked,
    levels: sanitizedLevels,
    pelotonStatus: getPelotonStatus(),
    playerPositions: getPelotonStatus().playerPositions
  };
}

// Helper: Get squad consensus on overworld map (Super Mario Bros Wii peloton)
function getPelotonStatus() {
  const playerList = Array.from(players.values());
  if (playerList.length === 0) {
    return {
      allAtNode: true,
      targetNode: gameState.currentLevelIndex,
      countsByNode: {},
      totalPlayers: 0,
      readyCount: 0,
      playerPositions: {}
    };
  }

  const countsByNode = {};
  const playerPositions = {};
  playerList.forEach(p => {
    if (typeof p.mapNodeIndex !== 'number') {
      p.mapNodeIndex = gameState.currentLevelIndex || 0;
    }
    const node = p.mapNodeIndex;
    countsByNode[node] = (countsByNode[node] || 0) + 1;
    playerPositions[p.id] = node;
  });

  const firstNode = playerList[0].mapNodeIndex;
  const allAtNode = playerList.every(p => p.mapNodeIndex === firstNode);

  if (allAtNode) {
    gameState.currentLevelIndex = firstNode;
  }

  return {
    allAtNode,
    targetNode: gameState.currentLevelIndex,
    countsByNode,
    totalPlayers: playerList.length,
    readyCount: countsByNode[gameState.currentLevelIndex] || 0,
    playerPositions
  };
}

// Helper to determine J1
function refreshJ1() {
  const playerList = Array.from(players.values());
  const currentJ1 = playerList.find(p => p.isJ1);
  if (!currentJ1 && playerList.length > 0) {
    playerList[0].isJ1 = true;
  }
}

// Global state broadcaster that enforces mystery masking on locked levels
function broadcastState(targetSocket = null) {
  const payload = {
    gameState: getSanitizedGameState(),
    players: Array.from(players.values())
  };
  if (targetSocket) {
    targetSocket.emit('state_update', { ...payload, myId: targetSocket.id });
  } else {
    io.emit('state_update', payload);
  }
}

// Balance teams for minigame (e.g. 4v4, avoiding 4v4v2 or unbalanced groups)
function balanceTeams(playerList) {
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);
  const total = shuffled.length;

  if (total <= 1) {
    return { teamA: shuffled, teamB: [], solo: [] };
  }

  const half = Math.floor(total / 2);
  const teamA = shuffled.slice(0, half);
  const teamB = shuffled.slice(half, half * 2);
  const solo = total % 2 !== 0 ? [shuffled[total - 1]] : [];

  return { teamA, teamB, solo };
}

io.on('connection', (socket) => {
  // Emit current state to newly connected client
  broadcastState(socket);

  // Player joins lobby or toggles ready state
  socket.on('player_join', (data) => {
    const isFirst = players.size === 0;
    const player = {
      id: socket.id,
      name: data?.name || `Chaval_${players.size + 1}`,
      avatar: data?.avatar || {},
      isAndroid: Boolean(data?.isAndroid),
      isJ1: isFirst,
      isBot: false,
      score: 0,
      ready: Boolean(data?.ready),
      mapNodeIndex: gameState.currentLevelIndex || 0,
      joinedAt: Date.now()
    };

    players.set(socket.id, player);
    refreshJ1();

    // Trigger Android inside joke if player is Android!
    if (player.isAndroid) {
      io.emit('android_detected_alert', {
        playerName: player.name,
        playerId: player.id,
        timestamp: Date.now()
      });
    }

    broadcastState();
  });

  socket.on('player_toggle_ready', (data) => {
    let player = players.get(socket.id);
    if (!player) {
      const isFirst = players.size === 0;
      player = {
        id: socket.id,
        name: data?.name || `Chaval_${players.size + 1}`,
        avatar: data?.avatar || {},
        isAndroid: Boolean(data?.isAndroid),
        isJ1: isFirst,
        isBot: false,
        score: 0,
        ready: Boolean(data?.ready),
        mapNodeIndex: gameState.currentLevelIndex || 0,
        joinedAt: Date.now()
      };
      players.set(socket.id, player);
      refreshJ1();
    } else {
      player.ready = Boolean(data?.ready);
      if (data?.name) player.name = data.name;
      if (data?.avatar) player.avatar = data.avatar;
      if (data?.isAndroid !== undefined) player.isAndroid = Boolean(data.isAndroid);
    }
    broadcastState();
  });

  // Update avatar
  socket.on('player_update_avatar', (avatarConfig) => {
    const player = players.get(socket.id);
    if (player) {
      player.avatar = avatarConfig;
      broadcastState();
    }
  });

  // Emote / Soundboard from phone
  socket.on('player_emote', (payload) => {
    const player = players.get(socket.id);
    let emote = typeof payload === 'string' ? payload : (payload?.emote || '📢');
    let sound = typeof payload === 'object' ? payload?.sound : null;

    io.emit('player_emoted', {
      playerId: player ? player.id : socket.id,
      playerName: player ? player.name : (payload?.playerName || 'Chaval'),
      emote,
      sound
    });
  });

  // Character Pick Easter Egg Theme broadcast
  socket.on('player_character_selected', (data) => {
    const player = players.get(socket.id);
    io.emit('character_theme_broadcast', {
      playerId: socket.id,
      playerName: player ? player.name : (data?.characterName || 'Chaval'),
      characterId: data?.characterId,
      characterName: data?.characterName
    });
  });

  // Android Ready Alert broadcast (goofy horn on host + mobile)
  socket.on('android_ready_alert', (data) => {
    const player = players.get(socket.id);
    io.emit('android_ready_sound', {
      playerId: socket.id,
      playerName: player ? player.name : (data?.playerName || 'Chaval'),
      characterId: data?.characterId
    });
  });

  // Minigame Event broadcast (kill, danger_alarm, etc.)
  socket.on('minigame_trigger_event', (data) => {
    io.emit('minigame_event_broadcast', data);
  });

  socket.on('minigame_heat_update', (data) => {
    io.emit('minigame_heat_update', data);
  });

  // Minigame real-time player input packet (Mario Kart & Super Smash mobile controls)
  socket.on('player_input', (inputData) => {
    io.emit('host_player_input', {
      playerId: socket.id,
      data: inputData
    });
  });

  // Admin / Host Actions (Injects canonical friends from cuadrilla)
  socket.on('admin_add_bot', (count = 1) => {
    // Select from canonical friend presets (Eneko, Lucía, Manu, DJ, Violeta, Marta, Asier, Santi)
    const availablePresets = AVATAR_PRESETS.filter(pr => {
      // Don't duplicate names already in the room
      return !Array.from(players.values()).some(p => p.name.toLowerCase().startsWith(pr.name.toLowerCase()));
    });

    for (let i = 0; i < count; i++) {
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      let chosenPreset = availablePresets.shift();
      let name, avatar;

      if (chosenPreset) {
        name = chosenPreset.name;
        avatar = JSON.parse(JSON.stringify(chosenPreset.config));
      } else {
        const fallbackPresets = AVATAR_PRESETS.slice(1); // skip Ayrton for extra random bots
        const randPreset = fallbackPresets[Math.floor(Math.random() * fallbackPresets.length)];
        name = `${randPreset.name}_${players.size + 1}`;
        avatar = JSON.parse(JSON.stringify(randPreset.config));
      }

      const isBotAndroid = Math.random() < 0.35; // random Android chance

      const botPlayer = {
        id: botId,
        name,
        isAndroid: isBotAndroid,
        isJ1: players.size === 0,
        isBot: true,
        score: 0,
        ready: true,
        avatar,
        mapNodeIndex: gameState.currentLevelIndex || 0
      };

      players.set(botId, botPlayer);

      if (isBotAndroid) {
        io.emit('android_detected_alert', {
          playerName: botPlayer.name,
          playerId: botPlayer.id,
          timestamp: Date.now()
        });
      }
    }

    refreshJ1();
    broadcastState();
  });

  socket.on('admin_kick_player', (playerId) => {
    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) {
      targetSocket.emit('player_kicked', { reason: 'Has sido expulsado por el Administrador.' });
      targetSocket.disconnect(true);
    }
    players.delete(playerId);
    refreshJ1();
    broadcastState();
  });

  socket.on('admin_set_j1', (playerId) => {
    for (const [id, p] of players) {
      p.isJ1 = (id === playerId);
    }
    broadcastState();
  });

  socket.on('admin_test_android_alert', (targetName) => {
    io.emit('android_detected_alert', {
      playerName: targetName || 'Simulador Android',
      playerId: socket.id,
      timestamp: Date.now()
    });
  });

  // Game Flow Actions (Solo el Admin / Host puede arrancar la partida desde el lobby)
  socket.on('start_game', () => {
    const player = players.get(socket.id);
    // Solo permitir si proviene de la pantalla de Host (socket no registrado como jugador)
    if (!player) {
      gameState.status = 'map';
      players.forEach(p => {
        p.mapNodeIndex = gameState.currentLevelIndex || 0;
      });
      broadcastState();
    }
  });

  socket.on('admin_start_game', () => {
    gameState.status = 'map';
    players.forEach(p => {
      p.mapNodeIndex = gameState.currentLevelIndex || 0;
    });
    broadcastState();
  });

  // Individual player movements on Overworld Map (Super Mario Bros Wii style)
  socket.on('player_move_node', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const fromNode = typeof player.mapNodeIndex === 'number' ? player.mapNodeIndex : (gameState.currentLevelIndex || 0);
    const maxUnlocked = getMaxUnlockedNode();
    let toNode = fromNode;

    if (data && data.direction === 'next') {
      toNode = Math.min(maxUnlocked, fromNode + 1);
      if (fromNode >= maxUnlocked) {
        socket.emit('map_move_blocked', {
          reason: `🔒 ¡Mundo 1-${fromNode + 2} bloqueado! Debes superar el Mundo 1-${fromNode + 1} primero.`,
          maxUnlocked
        });
        return;
      }
    } else if (data && data.direction === 'prev') {
      toNode = Math.max(0, fromNode - 1);
    } else if (data && typeof data.targetNode === 'number') {
      toNode = Math.max(0, Math.min(maxUnlocked, data.targetNode));
      if (data.targetNode > maxUnlocked) {
        socket.emit('map_move_blocked', {
          reason: `🔒 ¡Nivel bloqueado! Debes superar los niveles anteriores primero.`,
          maxUnlocked
        });
        return;
      }
    }

    if (toNode !== fromNode) {
      player.mapNodeIndex = toNode;

      io.emit('player_node_moved', {
        playerId: player.id,
        playerName: player.name,
        fromNode,
        toNode
      });

      const peloton = getPelotonStatus();
      io.emit('map_peloton_status', peloton);
      broadcastState();
    }
  });

  // Gather squad command (J1 or Host can call everyone to their node)
  socket.on('map_gather_squad', () => {
    const caller = players.get(socket.id);
    const maxUnlocked = getMaxUnlockedNode();
    const callerNode = (caller && typeof caller.mapNodeIndex === 'number') ? caller.mapNodeIndex : gameState.currentLevelIndex;
    const targetNode = Math.min(maxUnlocked, callerNode);

    players.forEach(p => {
      const fromNode = typeof p.mapNodeIndex === 'number' ? p.mapNodeIndex : 0;
      if (fromNode !== targetNode) {
        p.mapNodeIndex = targetNode;
        io.emit('player_node_moved', {
          playerId: p.id,
          playerName: p.name,
          fromNode,
          toNode: targetNode
        });
      }
    });

    gameState.currentLevelIndex = targetNode;
    const peloton = getPelotonStatus();
    io.emit('map_peloton_status', peloton);
    broadcastState();
  });

  // Legacy J1 next/prev forwarder (moves J1's player avatar)
  socket.on('map_move_next', () => {
    const player = players.get(socket.id) || Array.from(players.values()).find(p => p.isJ1);
    if (player) {
      const fromNode = player.mapNodeIndex || 0;
      const maxUnlocked = getMaxUnlockedNode();
      if (fromNode < maxUnlocked) {
        const toNode = fromNode + 1;
        player.mapNodeIndex = toNode;
        io.emit('player_node_moved', {
          playerId: player.id,
          playerName: player.name,
          fromNode,
          toNode
        });
        const peloton = getPelotonStatus();
        io.emit('map_peloton_status', peloton);
        broadcastState();
      } else {
        socket.emit('map_move_blocked', {
          reason: `🔒 ¡Mundo 1-${fromNode + 2} bloqueado!`,
          maxUnlocked
        });
      }
    }
  });

  socket.on('map_move_prev', () => {
    const player = players.get(socket.id) || Array.from(players.values()).find(p => p.isJ1);
    if (player) {
      const fromNode = player.mapNodeIndex || 0;
      if (fromNode > 0) {
        const toNode = fromNode - 1;
        player.mapNodeIndex = toNode;
        io.emit('player_node_moved', {
          playerId: player.id,
          playerName: player.name,
          fromNode,
          toNode
        });
        const peloton = getPelotonStatus();
        io.emit('map_peloton_status', peloton);
        broadcastState();
      }
    }
  });

  // Enter level: Super Mario Bros Wii rule: ONLY enters when ALL players are gathered on the level!
  socket.on('map_enter_level', (data) => {
    const player = players.get(socket.id);
    const force = Boolean(data && data.force);
    const isHost = !player;
    const isJ1 = player && player.isJ1;

    if (isHost || isJ1) {
      const peloton = getPelotonStatus();
      if (!peloton.allAtNode && !force && peloton.totalPlayers > 1) {
        io.emit('map_enter_blocked', {
          reason: '¡El pelotón no está reunido! Todos los chavales deben estar encima del nivel para entrar.',
          peloton
        });
        return;
      }

      const currentLevel = gameState.levels[gameState.currentLevelIndex];
      const playerList = Array.from(players.values());
      const teams = balanceTeams(playerList);

      gameState.status = 'minigame';
      gameState.minigameActive = currentLevel;
      gameState.teams = teams;

      broadcastState();
    }
  });

  // Minigame simulated resolution (completes test, crowns winners, unlocks next level, shows podium)
  socket.on('minigame_complete', (data) => {
    const currentLevel = gameState.levels[gameState.currentLevelIndex];
    if (currentLevel) {
      currentLevel.completed = true;
      currentLevel.stars = 3;
    }

    // Award points to team or players (unless it's a prank minigame like Button Bash)
    const isPrank = Boolean(data?.isPrank || currentLevel?.isPrank);
    const winningTeam = data?.winningTeam || 'teamA';
    if (!isPrank) {
      if (data?.isFFA && Array.isArray(data?.scores)) {
        data.scores.forEach(s => {
          const p = players.get(s.id);
          if (p) p.score += (s.score || 0);
        });
      } else if (gameState.teams[winningTeam]) {
        gameState.teams[winningTeam].forEach(member => {
          const p = players.get(member.id);
          if (p) p.score += 100;
        });
      }
    }

    // Calculate ordered rankings
    const ranking = Array.from(players.values()).sort((a, b) => b.score - a.score);
    const winner = (data?.winnerId && players.get(data.winnerId))
      || (gameState.teams[winningTeam] && players.get(gameState.teams[winningTeam][0]?.id))
      || ranking[0];

    // Unlock next level if available and auto-advance squad positions
    if (gameState.currentLevelIndex < gameState.levels.length - 1) {
      gameState.currentLevelIndex++;
    }
    players.forEach(p => {
      p.mapNodeIndex = gameState.currentLevelIndex;
    });

    gameState.status = 'podium';
    gameState.minigameActive = null;
    gameState.lastPodium = {
      completedLevel: currentLevel,
      winningTeam,
      winner,
      ranking,
      nextLevelIndex: gameState.currentLevelIndex
    };

    io.emit('level_completed_celebration', gameState.lastPodium);

    const peloton = getPelotonStatus();
    io.emit('map_peloton_status', peloton);
    broadcastState();
  });

  // Action to continue from podium back to map
  socket.on('podium_continue_to_map', () => {
    if (gameState.status === 'podium') {
      gameState.status = 'map';
      const peloton = getPelotonStatus();
      io.emit('map_peloton_status', peloton);
      broadcastState();
    }
  });

  // Reset to Lobby
  socket.on('admin_reset_game', () => {
    gameState.status = 'lobby';
    gameState.currentLevelIndex = 0;
    gameState.levels = JSON.parse(JSON.stringify(INITIAL_LEVELS));
    gameState.minigameActive = null;
    gameState.teams = { teamA: [], teamB: [], solo: [] };

    // Remove any test bots so reset returns to a clean lobby
    for (const [id, p] of players) {
      if (p.isBot) {
        players.delete(id);
      } else {
        p.score = 0;
        p.mapNodeIndex = 0;
      }
    }
    refreshJ1();
    broadcastState();
  });

  // Admin Arcade Mode Direct Minigame Launcher
  socket.on('admin_launch_minigame', (data) => {
    const targetType = data?.gameType || 'curve';
    let targetLevel = gameState.levels.find(l => l.gameType === targetType);
    if (!targetLevel && typeof data?.levelIndex === 'number') {
      targetLevel = gameState.levels[data.levelIndex];
    }
    if (!targetLevel) {
      targetLevel = {
        id: 99,
        title: data?.title || '🎮 Minijuego Arcade',
        gameType: targetType,
        lore: 'Modo Arcade directo para pruebas y partidas rápidas.',
        completed: false,
        stars: 3
      };
    }

    const playerList = Array.from(players.values());
    const teams = balanceTeams(playerList);

    gameState.status = 'minigame';
    gameState.minigameActive = targetLevel;
    gameState.teams = teams;

    broadcastState();
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      players.delete(socket.id);
      refreshJ1();
      broadcastState();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🎮 JUEGO CHAVALIL INICIADO CON ÉXITO!`);
  console.log(`🖥️ PANTALLA PRINCIPAL (HOST): http://localhost:${PORT}/host`);
  console.log(`📱 MÓVIL (MISMA RED WI-FI):   http://${localIp}:${PORT}/player`);
  console.log(`======================================================\n`);
});
