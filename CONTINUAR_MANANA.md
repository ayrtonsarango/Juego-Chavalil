# 📋 ESTADO DEL PROYECTO Y GUÍA DE REANUDACIÓN (SESIÓN 4 COMPLETADA)

Documento actualizado tras completar la **Sesión 4**, con la renovación visual y mecánica de **Coches Chavalil (Micro Racers)** (circuito técnico difícil, anti-atajos estricto con frenado masivo en hierba, barreras de neumáticos 3D y tribuna animada) y la **Diana de Dardos en Bar HotBunnies (Button Bash)** (diana gigante de torneo sobre la foto real del bar, física de 20 sectores, dobles, triples y bullseye).

---

## 🧭 1. Resumen de Cambios Completados en esta Sesión

### 🎯 1. Diana de Dardos Bar HotBunnies (Button Bash)
- **Diana de Torneo Gigante y Nítida (`radius: 175px`, diámetro 350px)**:
  - Se sustituyó el tenue aro de 72px por una diana de proporciones completas de torneo, dibujada directamente sobre la fotografía del bar HotBunnies cubriendo por completo la antigua diana pequeña de la pared de ladrillo.
  - Marco exterior de goma mate con borde dorado (`#f59e0b`) y placa superior: `★ BAR HOTBUNNIES · PRO DARTS ★`.
  - Anillo oficial de los 20 números en orden reglamentario `[20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]` con tipografía Titan One / Fredoka blanca y sombra 3D.
  - Sectores alternos en grafito oscuro y crema sisal, anillo de dobles exterior (rojo/verde), anillo de triples (rojo/verde), diana exterior 25 pts (verde esmeralda) y Bullseye central 50 pts (rojo candy con centro dorado).
  - Malla de alambre metálico (spider mesh) con brillo plateado y reflejo de iluminación del local.
- **Punteros Láser y Mira Dinámica**:
  - Ticker horizontal azul cian y vertical amarillo que abarcan todo el diámetro de la diana.
  - Al bloquear X, la línea se fija en verde esmeralda y aparece una retícula pulsante en la intersección de disparo.
- **Puntuación Real y Dardos Clavados**:
  - Detección geométrica exacta de sector: sencillos, dobles (`2x`), triples (`3x`), diana exterior (`25`), Bullseye (`50`), marco (`5`) o corcho (`0`).
  - Dardo clavado con sombra arrojada, aguja metálica, cuerpo de latón, plumas en el color del chaval y etiqueta identificativa con su mote y puntos sumados.

### 🏎️ 2. Coches Chavalil (Micro Racers)
- **Circuito Técnico Difícil y Atractivo**:
  - Trazado completo de 16 waypoints que aprovecha la pantalla al máximo: recta de meta de alta velocidad, Curva 1 de Badostáin, Chicana Técnica en S con cambio de rasante y virajes rápidos, y Horquilla del Bar HotBunnies con estanque decorativo.
  - Asfalto oscuro con pianos bicolores 3D en rojo/blanco y azul/blanco, líneas perimetrales blancas continuas y línea central discontinua amarilla.
  - Parrilla de salida numerada (1 al 8) pintada sobre el asfalto detrás de la línea de meta ajedrezada con pancarta elevada `🏁 META`.
- **Sistema Estricto Anti-Atajos y Fricción Fuera de Pista**:
  - Detección precisa de distancia a la línea central del trazado (`getDistanceToTrack`).
  - Al salirse del asfalto a la hierba o tierra, la velocidad se desploma instantáneamente hasta un máximo de **0.85** (reducción del 88% respecto a la velocidad máxima normal de 6.8 y turbo de 10.5).
  - Pérdida de tracción, derrapes inestables en el césped y expulsión continua de terrones de tierra y hierba.
- **Barreras Físicas de Neumáticos 3D (`tireWalls`)**:
  - Pilas de neumáticos candy en los vértices interiores de todas las curvas y chicanas.
  - Línea divisoria de barreras de neumáticos en el centro de la pista que bloquea físicamente cualquier intento de cruzar en línea recta entre sectores.
  - Colisión elástica: chocar contra una barrera frena el coche un 45% y lo empuja hacia la pista con chispas de impacto.
- **13 Checkpoints Secuenciales Obligatorios**:
  - Los coches deben cruzar obligatoriamente CP0 -> CP1 -> ... -> CP12 -> CP0 en orden. Es matemáticamente imposible registrar una vuelta recortando.
- **Ambiente de Competición Arcade**:
  - **Tribuna de Público (Grandstand)** a lo largo de la recta principal con techo de lona a rayas, aficionados animados saludando y destellos de flashes de cámaras fotográficas.
  - Muro de boxes de hormigón con franjas amarillas y negras de seguridad.
  - Vallas publicitarias integradas: *Bar HotBunnies · Kalimotxo GP*, *Pipas Facundo · Aguasal Speed*, *Tracasa Speedway* y *Badostáin Grand Prix*.
  - Coches mejorados con haz de luz de faros delanteros proyectados sobre el asfalto, ruedas delanteras que giran con la dirección, luces traseras rojas y estela de turbo.

---

## 🧪 2. Resultados de Verificación Automatizada (Puppeteer + Edge)

1. **Auditoría Integral Coches + Diana (`scripts/verify_racers_and_darts_revamped.js`)**:
   - Coches Chavalil (arranque, semáforo, aceleración, circuito técnico, trazado de pianos): **✅ PASS (0 errores)**
   - Diana de Dardos gigante sobre foto del bar + fijado X/Y + impacto y puntuación: **✅ PASS (0 errores)**
   - Errores de consola en Host y Móviles: **0 errores**
2. **Suite Completa de los 8 Minijuegos (`scripts/verify_all_8_minigames_e2e.js`)**:
   - Curvas Chavalil: **✅ PASS**
   - Tank Trouble: **✅ PASS**
   - Cabezones Soccer: **✅ PASS**
   - Chaval Bomberman: **✅ PASS**
   - HaxBall Chavalil: **✅ PASS**
   - Mario Kart (Micro Racers): **✅ PASS**
   - Super Smash Battlefield: **✅ PASS**
   - OpenSmash Destino Final: **✅ PASS**
   - **Estado Global**: **✅ ALL 8 MINIGAMES PASSED WITH 0 ERRORS**
3. **Turn-by-Turn y Banquillo con Nubes (`scripts/verify_button_bash_turn_by_turn.js`)**:
   - Turno 1 activo/banquillo + gritos en TV + Turno 2 activo/banquillo: **✅ PASS (0 errores)**

---

## 📸 3. Capturas de Verificación Generadas

- `01_coches_chavalil_parrilla.png`: Parrilla de salida con los coches en sus cajetines, línea de meta, tribuna y circuito técnico.
- `02_coches_chavalil_carrera_activa.png`: Carrera en marcha con faros delanteros, trazada de derrapes, público con flashes, muro de boxes y barreras de neumáticos.
- `03_diana_dardos_gigante_tv.png`: Diana gigante de 20 números reglamentarios cubriendo la diana pequeña de la foto con punteros láser de precisión.
- `04_dardo_clavado_puntos.png`: Dardo clavado en el sector con cálculo de puntos (`★ 6 PUNTOS (S6)`), sombra y chapa identificativa del tirador.

---

## 📌 4. Siguiente Paso

- Probar una partida de carreras y dardos en vivo con los smartphones reales de la cuadrilla.
- El servidor `node server.js` continúa activo en el puerto 3000.
