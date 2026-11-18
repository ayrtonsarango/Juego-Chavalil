# 📋 ESTADO DEL PROYECTO Y GUÍA DE REANUDACIÓN (SESIÓN 3 COMPLETADA)

Documento actualizado tras completar la **Sesión 3**, incluyendo el sistema **Turn-by-Turn** y **Banquillo con Nubes Flotantes en TV** en Button Bash, el nuevo juego **Coches Chavalil (Micro Racers)** reemplazando Mario Kart, el **Contador Dinámico del Lobby** (sin número 8 hardcodeado), la eliminación de AI-slop en copys según `anti-slop-copy`, y la verificación E2E automatizada con **0 errores en todos los 8 minigames**.

---

## 🧭 1. Resumen de Cambios Completados en esta Sesión

### 🎯 1. Button Bash (Dardos Bar HotBunnies)
- **Modo por Turnos Estricto (Turn-by-Turn)**:
  - Los chavales de la cuadrilla juegan de uno en uno, en cola rotativa (`this.playerQueue`): Jugador 1 -> Jugador 2 -> ... -> Jugador N.
  - La TV muestra con total claridad de quién es el turno en la cabecera candy: `🎯 TURNO: [NOMBRE] (1/2)` y el número de turno.
  - Al tirar, el dardo queda clavado en la diana con su efecto de puntos (`🎯 ¡¡DIANAZO 50!!`, `★ 25 PUNTOS`, etc.) y permanece visible en la diana mientras los demás tiran.
  - Tras 2.2 segundos de celebración del impacto, el turno pasa automáticamente al siguiente jugador en cola.
  - Al completar la ronda de todos los chavales, se dispara la cascada de bromas cómicas (Windows Vista, dardos rebotando, maduritas en Badostáin, gangbang de ramen solidario, incidencia Tracasa, apagón de 7s y podio falso).
- **Mando Móvil Limpio (Tactile Arcade Buzzer)**:
  - Se eliminaron todos los botones secundarios (`¡VAMOS!`, `¡DIANA!`) y solapamientos de otros mandos.
  - La pantalla móvil muestra **ÚNICAMENTE el pulsador gigante de diana** (`#btn-bash-target`, `¡PULSA!`) centrado con relieve 3D Candy-Arcade.
- **Banquillo Activo y Nubes Flotantes en TV**:
  - Mientras un jugador tira, **todos los demás chavales pasan automáticamente al Banquillo (`#box-bench-spectator`)**.
  - En su móvil ven el estado: `🛋️ BANQUILLO · Turno de: [Compañero]`, campo de texto (máx. 10 caracteres) y botón `📢 Mandar Grito` con cooldown de 15 segundos.
  - Los gritos enviados aparecen en el televisor como **nubes flotantes translúcidas** (`.bench-shout-pill`, blur 8px, borde cómic, sombra 3D) en **posiciones aleatorias por toda la pantalla** (`top: 12%..74%`, `left: 8%..76%`), derivando suavemente hacia arriba sin tapar el juego.

### 👥 2. Contador Dinámico del Lobby
- Se eliminó el `0 / 8 LISTOS` hardcodeado.
- Si no hay nadie conectado: muestra `ESPERANDO CHAVALES...` (o `0 LISTOS` en la sala).
- Cuando entran jugadores: muestra dinámicamente `${readyCount} / ${players.length} LISTOS` (ej: `0 / 2 LISTOS`, `1 / 2 LISTOS`, `2 / 2 LISTOS`) tanto en la cabecera de la TV, como en el panel de la Sala y en el botón de arranque del Admin.

### 🏎️ 3. Coches Chavalil (Micro Racers)
- Reemplazo limpio de Mario Kart Mode 7 por un juego de carreras 2D vista cenital arcade multijugador en pantalla única (`public/js/minigames/micro-racers.js`).
- Pista con bordillos candy, charcos de aceite que hacen trompear, bandas turbo de velocidad, rebote en muros y 3 vueltas completas.
- Soporte para bots con waypoints de conducción autónoma y avatares oficiales de la cuadrilla en los cockpits.

### 🎵 4. Audio LoL Match Found & Anti-Slop Copy
- SFX de "Partida Encontrada de League of Legends" (~7s) integrado en las transiciones de ronda.
- Auditoría estricta de textos según `anti-slop-copy`: eliminadas explicaciones obvias ("1º Fija X · 2º Fija Y", "En tu móvil", "La sala de la cuadrilla").

---

## 🧪 2. Resultados de Verificación E2E Automatizada (Puppeteer + Edge)

1. **Lobby Dynamic Counter (`scripts/verify_lobby_dynamic_counter.js`)**:
   - `0 / 2 LISTOS` -> `1 / 2 LISTOS` -> `2 / 2 LISTOS`: **✅ PASS**
   - Sin '8' hardcodeado: **✅ PASS**
2. **Button Bash Turn-by-Turn & Banquillo (`scripts/verify_button_bash_turn_by_turn.js`)**:
   - Turno 1 (P1 activo / P2 banquillo): **✅ PASS**
   - Grito de banquillo en TV en coordenadas aleatorias (`top: 510px, left: 651px`): **✅ PASS**
   - Turno 2 (P2 activo / P1 banquillo): **✅ PASS**
   - Errores de consola (Host, P1, P2): **0 errores**
3. **Suite Completa de los 8 Minijuegos (`scripts/verify_all_8_minigames_e2e.js`)**:
   - Curvas Chavalil: **✅ PASS** (0 errores)
   - Tank Trouble: **✅ PASS** (0 errores)
   - Cabezones Soccer: **✅ PASS** (0 errores)
   - Chaval Bomberman: **✅ PASS** (0 errores)
   - HaxBall Chavalil: **✅ PASS** (0 errores)
   - Coches Chavalil: **✅ PASS** (0 errores)
   - Super Smash Battlefield: **✅ PASS** (0 errores)
   - OpenSmash Destino Final: **✅ PASS** (0 errores)

---

## 📌 3. Tareas para Revisar Mañana con la Cuadrilla

1. **Partida de prueba con móviles reales en la Wi-Fi local**:
   - Conectar 3 o 4 smartphones reales a `http://192.168.0.29:3000/player`.
   - Probar el nuevo picker rotatorio de avatares South Park y el botón `🎲 Generar aleatorio`.
2. **Torneo completo Mundo 1-1 a 1-9**:
   - Recorrer el mapa Overworld desde el nivel 1 hasta el 9 sin interrupción.
   - Comprobar la experiencia de Button Bash con todos mandando gritos desde el banquillo mientras le toca tirar al compañero.
3. **Soundboard en directo**:
   - Verificar que los 6 botones de memes (`BOCINA`, `AUUUU`, `BING`, `FAAAH`, `OMG`, `ALLAH`) tienen el cooldown de 4s con badge visual activo.

---

> [!NOTE]
> El servidor `node server.js` sigue activo en el puerto 3000. El PC **NO se apagará ni suspenderá** para que el entorno quede listo para arrancar la sesión de mañana.
