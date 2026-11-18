# 📋 ESTADO DEL PROYECTO Y GUÍA DE REANUDACIÓN (SESIÓN 2 COMPLETADA)

Documento actualizado tras completar la **Sesión 2**, incluyendo el nuevo sistema de diseño visual **Doodle Pop Candy-Arcade**, la skill `party-ui`, la integración de **OpenSmash (Nivel 8)**, el minijuego de broma **Button Bash (Nivel 9)** y la verificación E2E con 0 errores de consola.

---

## 🧭 1. Resumen Ejecutivo del Proyecto
- **Proyecto**: *Juego Chavalil* — Party game multijugador web estilo Jackbox + Super Mario World + Mario Kart + Smash Bros + Button Bash.
- **Identidad Visual**: **Light-Theme Doodle Pop Candy-Arcade** (fondo ondulado doodle azul claro, botones táctiles 3D de caramelo, sombras sólidas de cómic `border: 3px solid #0f172a`, cero estética cyberpunk oscura genérica).
- **Flujo de Pantallas**:
  1. **Pantalla Principal (Host / TV)**: `http://localhost:3000/host`
     - Lobby tipo arcade con código QR de acceso en tarjeta destacada y tarjetas pastel para cada jugador conectado.
     - Detección automática de J1 (corona de mando).
     - Mapa Overworld interactivo con progresión secuencial estricta (Mundo 1-1 a 1-9).
     - Podio de celebración con ganador y clasificación por equipos (Azul vs Rojo).
  2. **Mando Móvil (Player / Smartphone)**: `http://localhost:3000/player`
     - Creador de avatar South Park con vista previa en halo circular.
     - Contenedor estricto `100dvh` sin barras de scroll en pantallas móviles.
     - 6 Plantillas de mandos táctiles dedicados con botones de caramelo de alto contraste.
     - Rotación automática a modo horizontal (`@media (orientation: landscape)`) estilo Nintendo Switch para juegos de conducción y combate.
     - Soundboard oficial de memes de la cuadrilla.

---

## 🎮 2. Catálogo Oficial de los 9 Minijuegos

1. **🌀 Curvas Chavalil (Curve Fever)**: `public/js/minigames/curve-fever.js`
   - Torneo de supervivencia trazando estelas. Mando móvil con dos botones gigantes (50% Izq / 50% Der).
2. **🎯 Tank Trouble Chavalil**: `public/js/minigames/tank-trouble.js`
   - Combate de tanques en laberinto procedural con balas que rebotan en las paredes.
3. **⚽ Cabezones: Sports Heads**: `public/js/minigames/head-soccer.js`
   - Duelos de fútbol 2D lateral con cabezones de la cuadrilla y potenciadores flotantes.
4. **💣 Chaval Bomberman**: `public/js/minigames/bomberman.js`
   - Cuadrícula con bombas, explosiones en cruz y muros rompibles.
5. **🥅 HaxBall Chavalil**: `public/js/minigames/haxball.js`
   - Físicas circulares de disco, pases medidos y disparos de potencia en tiempo real.
6. **🏎️ Mario Kart: Gran Premio Chavalil**: `public/js/minigames/mario-kart.js`
   - Proyección matemática SNES Mode 7 a 60 FPS, karts con rotación y cajas de objetos. Mando móvil optimizado para dos pulgares en horizontal.
7. **💥 Super Smash Chavalil**: `public/js/minigames/super-smash.js`
   - Pelea campal por equipos sobre escenario flotante Battlefield con 3 plataformas suaves y knockback acumulativo.
8. **⚔️ OpenSmash: Destino Final**: `public/js/minigames/super-smash.js` (Modo Coliseo Espacial)
   - Escenario sin plataformas suspendidas en el vacío interestelar (`stageTheme: 'final_destination'`). Máxima velocidad y duelos directos sin plataformas blandas. Coexiste 100% con Super Smash sin borrar nada.
9. **🎯 Diana de Dardos HotBunnies (Button Bash Broma)**: `public/js/minigames/button-bash.js`
   - Minijuego broma inspirado en Button Bash. Pared de bar HotBunnies con neones, kalimotxo y pipas Facundo.
   - Marta y Violeta como administradoras shiny con aura luminosa.
   - Diana con tickers oscilantes X/Y, bromas exclusivas por grupos (`gangbang ramen`, `maduritas en Badostáin`, `4382h en Vista`, captchas absurdos).
   - Apagón general de 7 segundos y ranking falso que corona a `alvarito.tracasa.lover.69` con 999.999.999 pts y puntuaciones `NaN`/`undefined`.
   - **Garantía de torneo**: Marcado como `isPrank: true`; no añade puntos a los marcadores oficiales de los equipos.

---

## 🎨 3. Sistema de Diseño & Skill `party-ui`
- **Guía de estilo completa**: `design/DESIGN.md`
- **Plantillas de mandos móviles**: `design/CONTROLLER_LAYOUTS.md`
- **Contexto de producto**: `design/PRODUCT.md`
- **Análisis técnico OpenSmash**: `design/OPENSMASH_ANALYSIS.md`
- **Skill oficial**: `.agents/skills/party-ui/SKILL.md` (y espejo en `~/.gemini/config/skills/party-ui/SKILL.md`).
- **Paleta Oficial**:
  - Fondo Doodle: `#e8f1f5` con patrón SVG ondulado `#c8d9e6`.
  - Botón Caramelo Azul: `#38bdf8` / borde `#0284c7`.
  - Botón Caramelo Verde: `#4ade80` / borde `#16a34a`.
  - Botón Caramelo Rosa: `#f472b6` / borde `#db2777`.
  - Botón Caramelo Amarillo: `#facc15` / borde `#ca8a04`.
  - Botón Caramelo Naranja: `#fb923c` / borde `#ea580c`.
  - Borde principal de componentes: `3px solid #0f172a`.
  - Sombra 3D: `0 6px 0 #0f172a` (en reposo) y `0 2px 0 #0f172a` (al pulsar).

---

## 🛡️ 4. Mecanismo Anti-Infinitos (Fase 0)
- **Timeouts en peticiones**: `scripts/telegram.js` y llamadas de red con límites de 8s/15s estrictos.
- **Haptic safety**: Helper `safeVibrate` en `public/js/player.js` que previene bloqueos de permisos de usuario (`navigator.userActivation`).
- **Control de procesos de fondo**: Gestión limpia mediante `manage_task` y reinicios sin solapamiento de puertos.

---

## 🧪 5. Verificación y Tests E2E
- **Scripts de prueba**:
  - `scripts/test_full_tournament_e2e.js`: Flujo completo de torneo con 4 jugadores conectados.
  - `scripts/test_button_bash_revamped.js`: Validación de la broma con foto real de HotBunnies, tickers y podio de Tracasa.
  - `scripts/test_mobile_prank_and_hold.js`: Validación de Hold-to-Confirm en J1, Floating Joystick en Smash y cascada de bromas en smartphone.
  - `scripts/verify_all_viewports.js`: Auditoría visual en 6 tamaños de móvil y 2 de TV.
- **Resultados de ejecución**:
  - Transición fluida Lobby → Mapa Overworld → OpenSmash → Podio TV → Button Bash → Ranking Falso → Mapa.
  - **0 errores de consola** (`Host: 0`, `Player: 0`).
  - **Screen Wake Lock API**: Pantalla del móvil mantenida activa automáticamente sin apagarse.
  - **Zonas seguras & Notch**: `viewport-fit=cover` y `env(safe-area-inset-*)` dinámico para iPhone y Android en vertical y horizontal.
  - **J1 Hold-to-Confirm**: Bloqueo contra toques accidentales con 750ms de pulsación continua, barra de progreso SVG/CSS y pulsaciones hápticas.
  - **Joystick Flotante Táctil**: Control analógico suave en la mitad izquierda de la pantalla para Super Smash / OpenSmash.
  - **Broma Interactiva en Móvil (Button Bash)**: Sincronización en tiempo real de popups Vista, oferta absurda GangBang Ramen (chantaje con 2 gatos), Badostáin Maduritas, Captcha Kalimotxo Don Simón, apagón CRT con cita de Violeta y podio delirante de Lerga.
  - **Modo Standalone Fullscreen Universal (Todos los Minijuegos)**: Se eliminó todo encapsulamiento web (`1100px`) en **TODOS los 9 minijuegos**. En TV, cada juego ocupa el 100% de la pantalla (`100vw × 100vh`, `1920x1080` / `3840x2160` 4K) sin cabeceras ni paneles de equipos que reduzcan la acción.
  - **HUD Flotante Arcade Inteligente**: Con insignias neón dinámicas por juego y prevención de colisiones en los juegos que ya cuentan con marcador en canvas (Curvas, Tanques, Bomberman). Botón `✕ (Esc)` siempre disponible en la esquina superior derecha.
  - **Mandos Móviles Rediseñados al 100% de las Fichas Oficiales**:
    * **Mario Kart (`pad-race`)**: 50% izquierdo para giro (`◀` y `▶`) + Clúster vertical derecho con 3 tarjetas de caramelo rectangulares con relieve 3D (`ACELERAR` verde, `DERRAPE` rosa, `OBJETO` amarillo).
    * **Super Smash & OpenSmash (`pad-smash`)**: Cruceta D-Pad arcade 3×3 a la izquierda + Diamante de 4 botones circulares de caramelo (`X` Salto azul, `Y` Escudo verde, `A` Golpe rosa, `B` Poder especial amarillo) a la derecha.
    * **Tanques (`pad-tank`), Bomberman (`pad-bomberman`) y HaxBall (`pad-haxball`)**: Cruceta D-Pad arcade 3×3 a la izquierda + Botón gigante de acción de caramelo a la derecha (`💥 DISPARAR` rosa, `💣 BOMBA` dorado, `⚽ CHUTAR` cian).
    * **Cabezones Soccer (`pad-headsoccer`)**: 2 columnas de giro a la izquierda + 2 botones apilados de caramelo (`▲ SALTAR` amarillo, `⚽ CHUTAR` verde) a la derecha.
    * **Curvas Chavalil (`pad-curve`)**: 2 botones gigantes verticales 50%/50% (`◀ IZQUIERDA` azul, `DERECHA ▶` naranja).
    * **Button Bash (`pad-buttonbash`)**: Buzzer circular equilibrado de 190px + Bromas interactivas en smartphone.
  - **Soporte PWA**: `public/manifest.json` instalado para jugar a pantalla completa 100% nativa sin barras de navegación ("Añadir a pantalla de inicio").
  - **Auditoría de Emojis (`design/EMOJI_INVENTORY.md`)**: Cero emojis de sistema en navegación o botones; emojis restringidos exclusivamente al soundboard y stickers sociales.
  - 18 capturas de auditoría visual generadas en `design/test-results/viewports/` cubriendo los 6 móviles y TV 1080p/4K, más auditoría completa de los 8 juegos en `design/test-results/all-games-audit/`.
- **Notificación por Telegram**: Reporte final y capturas clave enviadas exitosamente al bot `@antigravity_pc_home_bot`.

---

## 🚀 6. Próximos Pasos Recomendados
1. **Prueba presencial con la cuadrilla**: Jugar la partida completa con 6-8 móviles reales en la misma red Wi-Fi para disfrutar de la broma de Button Bash en vivo.
2. **Sonidos de voz personalizados (opcional)**: Grabar frases cortas reales de los chavales para añadirlas al soundboard.
3. **Despliegue opcional en la nube**: En caso de querer jugar fuera de la red local, montar en contenedor Cloud Run o VPS ligera con túnel HTTPS.
