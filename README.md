# 🎮 JUEGO CHAVALIL (Versión 0)

Juego party multijugador estilo *Jackbox Party / Mario Party / WarioWare* creado a medida para el grupo de amigos, con avatares estilo South Park, controles en el móvil por código QR, mecánicas parodia con lore propio y memes internos.

---

## 🚀 Cómo Jugar Ahora Mismo (Sin cuentas ni servicios de pago)

El servidor ya está en marcha en tu máquina:

1. **Pantalla Principal (PC / Proyector / TV)**:
   - Abre en tu navegador del PC:
     👉 [http://localhost:3000/host](http://localhost:3000/host)
   - Verás la sala de espera con el **código QR gigante**, el estado de la sala y el panel de administración inferior.

2. **Mando Móvil (iPhone / Android)**:
   - Conecta tu teléfono a la **misma red Wi-Fi** de casa.
   - Abre la cámara del móvil y escanea el código QR de la pantalla (o escribe en Safari/Chrome: `http://192.168.0.26:3000/player`).
   - ¡Sin instalar apps, sin registros y sin coste!

---

## ✨ Qué Incluye la Versión 0

### 1. 🎨 Creador de Avatares estilo "South Park" (SVG Procedural)
- Generación de personajes vectoriales ligeros, nítidos en cualquier pantalla y fácilmente manipulables por ordenador e IA.
- Personalización completa desde el móvil:
  - **Tono de piel**: Melocotón, moreno, alien, gamba...
  - **Peinados y colores**: Despeinado, afro, gorra hacia atrás, engominado, emo, calvo reluciente...
  - **Ojos**: South park clásico, bizco, gafas de sol "Deal with it", resaca/ojeras, anime...
  - **Bocas**: Sonrisa, grito, lengua derp, bigotillo, barba...
  - **Ropa y colores**: Sudaderas y camisetas personalizables.
  - **Accesorios meme**: Cadena de oro con `$`, chapa de Bizum Boy, cascos de gamer con micro, nariz de payaso, gorrito de papel aluminio de conspiración, corona, etc.

### 2. 🚨 La "Alarma de Android" (Inside Joke)
- Si un jugador entra desde un dispositivo Android (o si activas la casilla *"🤖 Simular que soy Android"* en tu iPhone):
  - **En la pantalla grande**: Salta una alarma sonora estridente y un lamento goofy ("auuuu" / trombón triste), la pantalla tiembla y aparece un banner gigante:
    > *"¡[Nombre] se ha unido desde un ANDROID! 🙏 Oremos por él... Alguien que le haga un Bizum urgente para un iPhone"*
  - **En el móvil del afectado**: Aparece un aviso compasivo:
    > *"Ya lo siento amigo Android... 🥀 Te queremos igual (casi)"*
  - Incluye botón de prueba rápida en el panel Admin para probarlo cuando quieras.

### 3. 🗺️ Mapa Overworld estilo Mario Bros y "La Piña de Avatares"
- 5 niveles conectados por caminos sinuosos estilo Super Mario World.
- **La Piña de Avatares**: Todos los personajes de la sala se agrupan en un pelotón físico visible en el mapa.
- **Rol de J1**: El primer jugador en unirse (o asignado por el admin) es el líder y tiene los mandos en su móvil para avanzar (`Siguiente ➡️`, `⬅️ Anterior`) y `🏁 ENTRAR AL NIVEL`.
- Pasos animados con efectos de sonido retro sintetizados por Web Audio API.

### 4. ⚖️ Equilibrador de Equipos Inteligente (4 vs 4)
- Al entrar a un minigame, el sistema divide a los amigos en dos equipos equilibrados (**Equipo Azul 🔵 vs Equipo Rojo 🔴**), evitando que alguien quede aislado en una desventaja ridícula (ej: 4vs4vs2).
- Muestra las fichas de los avatares en sus respectivos colores de equipo.

### 5. 🏆 Prueba de Minijuego Funcional
- Botón para simular la prueba resuelta: otorga puntos, reproduce fanfarria de victoria, desbloquea el siguiente nivel en el mapa con estrellas (⭐) y devuelve al pelotón al mapa.

### 6. 🔊 Soundboard de Reacciones en Directo
- Cualquier amigo puede tocar botones desde su móvil en cualquier momento (`📢 BOCINA`, `😂 RISAS`, `🔥 FUEGO`, `🍕 PIZZA`, `💀 MUERTO`, `💸 BIZUM`) para hacer sonar bocinas y lanzar emoticonos flotantes a la pantalla principal.

### 7. 🛠️ Panel de Administración (Host)
- Botón `🤖 +1 Bot` y `🤖 +4 Bots` para llenar la sala y probar las piñas de avatares y divisiones 4v4 al instante.
- Botón `📱 Probar Meme Android`.
- Botón `👑 Rotar J1` para cambiar quién tiene el mando.
- Botón `🔄 Reiniciar Todo`.

---

## 📁 Estructura del Proyecto

- [CONSTITUTION.md](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/CONSTITUTION.md): Documento maestro de reglas, filosofía de diseño y arquitectura.
- [docs/LORE_AND_IDEAS.md](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/docs/LORE_AND_IDEAS.md): Cuaderno con los chistes, personajes y reglas goofy (Ayrton con la ulti aleatoria de Warwick, controles invertidos, etc.).
- [server.js](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/server.js): Servidor Express + Socket.IO con autodetección de IP local LAN Wi-Fi y generador de QR.
- [public/js/avatar-engine.js](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/js/avatar-engine.js): Motor vectorial SVG modular para los personajes South Park.
- [public/js/sound-engine.js](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/js/sound-engine.js): Sintetizador Web Audio API para música retro y bocinas meme sin depender de archivos de audio externos.
- [public/host.html](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/host.html) y [public/js/host.js](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/js/host.js): Pantalla grande para proyector o TV.
- [public/player.html](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/player.html) y [public/js/player.js](file:///c:/Users/ayrton/Documents/10_Juego-Chavalil/public/js/player.js): Mando táctil responsive para teléfonos móviles.
