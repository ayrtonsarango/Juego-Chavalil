# CONTROLLER LAYOUTS SPECIFICATION (MANDOS MÓVILES)

Este documento define el catálogo de plantillas táctiles reutilizables para los mandos de *Juego Chavalil*.
Cada minijuego declara qué plantilla utiliza y personaliza únicamente sus etiquetas/iconos de acción.

---

## 🚫 Reglas de Oro del Mando Táctil

1. **PROHIBIDO dibujar un mando físico**: Jamás renderizar siluetas de mandos de consola (PlayStation, Xbox, Switch o Game Boy) con bordes decorativos o carcasas simuladas. La pantalla del móvil *es* la superficie de control.
2. **Zonas táctiles sobredimensionadas**: El área receptora de eventos táctiles (`pointerdown`, `pointermove`, `pointerup`) es significativamente mayor que el glifo visual del botón para garantizar que nunca se pierda una pulsación mientras el jugador mira a la TV.
3. **No es una página web**:
   - `touch-action: none;`
   - `user-select: none; -webkit-user-select: none;`
   - Desactivación de menú contextual (`oncontextmenu="return false;"`).
   - `height: 100dvh;` (no `100vh`) para absorber barras dinámicas en Safari y Chrome móvil.
   - Respeto a zonas seguras: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);`.
4. **Respuesta local instantánea (Zero Lag UI)**: Al tocar, el botón cambia de elevación visual, color y sombra en el microsegundo 0 sin esperar respuesta del servidor Socket.IO. Se emite vibración táctil (`navigator.vibrate([25])`) en plataformas compatibles.
5. **Diferenciación por Forma, Posición y Color**: Los botones de acción no son 4 círculos idénticos con una letra pintada; se diferencian por geometría (cápsula alargada para salto/turbo, hexágono o círculo para golpe primario, pastilla de escudo, etc.), altura visual y posición ergónomica.

---

## 📐 Catálogo de Plantillas Oficiales

### 1. `navegacion` (Menús y Mapa Overworld)
- **Orientación**: Vertical (portrait) u Horizontal (landscape).
- **Pulgar Izquierdo**: D-Pad direccional continuo (flechas geométricas con relieve 3D).
- **Pulgar Derecho**:
  - Botón Primario: `ACEPTAR / ENTRAR` (geométricamente destacado, color acento positivo).
  - Botón Secundario: `VOLVER / LLAMAR PELOTÓN` (geométricamente más plano, color neutro).
- **Barra Superior**: Identificador de jugador (color del chaval, nombre y estado).

### 2. `cruceta-2` (Plataformas y Juegos Simples)
- **Orientación**: Horizontal obligatoria.
- **Pulgar Izquierdo**: D-Pad de 4 direcciones con zona central neutra.
- **Pulgar Derecho**: 2 botones principales en diagonal ergonómica:
  - Botón A (Acción principal / Salto / Chutar) — circular grande.
  - Botón B (Acción secundaria / Pase) — pastilla angular.

### 3. `stick-4` (Brawler / Estilo Super Smash Bros)
- **Orientación**: Horizontal obligatoria.
- **Pulgar Izquierdo**: Joystick analógico virtual flotante (se centra donde el pulgar aterriza en toda la mitad izquierda). Zona muerta del 15% para evitar deriva.
- **Pulgar Derecho**: Clúster de 4 acciones diferenciadas:
  - **Ataque Normal**: Botón circular prominente rojo / carmesí.
  - **Ataque Especial**: Botón romboide azul eléctrico.
  - **Salto**: Botón cápsula superior amarillo ámbar.
  - **Escudo / Defensa**: Botón pastilla lateral turquesa / esmeralda.

### 4. `doble-stick` (Shooters Cenitales / Tanques Avanzados)
- **Orientación**: Horizontal obligatoria.
- **Pulgar Izquierdo**: Joystick virtual de movimiento / aceleración.
- **Pulgar Derecho**: Joystick virtual de puntería con disparo al soltar o botón de gatillo contiguo.

### 5. `kart` (Carreras / Mario Kart)
- **Orientación**: Horizontal obligatoria.
- **Pulgar Izquierdo**: Botón gigante `◀ IZQ` y `DER ▶` con división nítida y área de tacto que cubre el 45% izquierdo del ancho.
- **Pulgar Derecho**:
  - `ACELERAR (GAS)`: Botón dominante ergonómico en la posición natural del pulgar derecho.
  - `DERRAPE (DRIFT)`: Botón superior derecho.
  - `OBJETO (ITEM)`: Botón inferior con icono reactivo del objeto actual recogido.

### 6. `un-boton` (Reflejos, Party Broma "Button Bash", Minijuegos de Trivial)
- **Orientación**: Vertical u Horizontal indistinto.
- **Interacción**: Prácticamente el 80% de la superficie útil de la pantalla se convierte en un botón masivo con relieve mecánico 3D y el color temático del jugador.
- **Feedback**: El botón se hunde físicamente con un golpe visual contundente y genera estela de partículas táctiles locales.

### 7. `soundboard` (Reacciones y Efectos Meme)
- **Orientación**: Vertical u Horizontal.
- **Interacción**: Rejilla de 6 botones táctiles con relieve, icono SVG temático, etiqueta en mayúsculas de alto contraste y cooldown visual (desvanecimiento + barra de recarga de 4s).

---

## 🔒 Mecanismos del Anfitrión (J1 / Host Protection)
- Para acciones críticas (Iniciar Partida, Pausar, Forzar Entrada de Nivel), el botón requiere una pulsación mantenida de **750 ms (Long Press)** con barra/anillo de progreso visual (`.hold-progress-bar`), micro-pulsaciones hápticas a los 250ms y 500ms, y confirmación final de 100ms (`safeVibrate([60, 40, 100])`) para prevenir arranques accidentales con la palma de la mano.

---

## 🕹️ Joystick Flotante Dinámico (`stick-4`)
- **Superficie de Contacto**: Toda la mitad izquierda del smartphone actúa como sensor de contacto continuo (`smash-dpad-container`).
- **Anclaje Dinámico**: La base del joystick (`.floating-joy-base`) se centra exactamente en el punto de contacto inicial del pulgar (`clientX, clientY`), evitando que el jugador tenga que reposicionar la mano.
- **Zona Muerta & Radio Máximo**: Zona muerta interna de `14px` para prevenir micro-temblores; radio de recorrido limitado a `45px` para garantizar retorno inmediato al soltar.
- **Concurrencia**: Convive de forma transparente con los botones clásicos de la cruceta D-Pad.

---

## 🎭 Cascada de Broma Interactiva en Smartphone (`un-boton` / Button Bash)
Durante el minijuego de broma Button Bash (Nivel 9), el móvil del jugador recibe eventos Socket.IO sincronizados desde la pantalla TV (`minigame_event_broadcast` con tipo `buttonbash_event`):
1. **Fase Normal**: Buzzer circular de 220px (`1º Fija X · 2º Fija Y`) con botones secundarios de ánimo (`¡VAMOS!`, `¡DIANA!`).
2. **Fase A (Windows Vista Error)**: Diálogo con barra superior clásica de Windows, aviso de retraso de 4.382 horas y botón "Cerrar aviso".
3. **Fase A2 (GangBang Ramen)**: Tarjeta con oferta absurda de 40L de caldo y 2 gatos. Si pulsa "No", muta a chantaje de culpabilidad ("¿Dejarías a una mamá de 2 gatos sin comida?") con botones obligatorios "Vale, voy".
4. **Fase C (Badostáin & Captcha)**: Aviso de maduritas en bajera a menos de 3 km y captcha de selección de "Kalimotxo Don Simón tibio en vaso de tubo".
5. **Fase D (Apagón de 7s)**: Pantalla completa `#000000` con scanlines CRT verdes parpadeantes, contador de tiempo y cita célebre *"Mierda, Violeta, se ha quedado sin batería"*.
6. **Fase Final (Fake Ranking)**: Celebración con coronación de `alvarito.tracasa.lover.69` (999.999.999 pts) y puntuación de usuario en `NaN / undefined / ¯\_(ツ)_/¯`.

---

## 📱 Modo PWA (Progressive Web App Standalone)
- **Manifest**: `public/manifest.json` con `display: standalone` y `orientation: any`.
- **Experiencia de App Nativa**: Añadiendo el mando a la pantalla de inicio ("Añadir a pantalla de inicio" en Safari iOS o Chrome Android), se eliminan por completo las barras de navegación del navegador, obteniendo el 100% del área de pantalla útil (`100dvh`).

