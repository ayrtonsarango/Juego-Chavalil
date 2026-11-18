# 📜 CONSTITUCIÓN DEL PROYECTO: JUEGO CHAVALIL 🎮

Bienvenido a la **Constitución de Juego Chavalil**, el documento maestro que rige el diseño, la arquitectura técnica, las mecánicas de juego, la filosofía humorística y el mapa de ruta de este juego party multijugador para el grupo de amigos.

---

## 🎯 1. Filosofía y Visión
- **Objetivo**: Crear una experiencia estilo *Jackbox Party / Mario Party / WarioWare*, pero 100% personalizada con los lores, memes internos y anécdotas del grupo de amigos.
- **Acceso universal e instantáneo**:
  - Pantalla principal (PC / Proyector / TV): Muestra la sala, el mapa de niveles, las cinemáticas, los minijuegos y el caos general.
  - Mandos (Móviles de los amigos): Se conectan escaneando un **código QR** o entrando a la URL local (sin instalar ninguna app ni crear cuentas).
  - Controles táctiles sencillos y reactivos.
- **Tono**: Goofy, paródico, cutre a propósito con cariño ("shitty on purpose"), mecánicas inesperadas, troleos de diseño y gags como la alerta Android.

---

## 🏛️ 2. Arquitectura Técnica (v0)
- **Servidor**: Node.js + Express + Socket.IO.
- **Comunicación en Tiempo Real**: WebSockets bidireccionales con eventos de estado sincronizados.
- **Zero Cost / Zero Signup**: Funciona en red local Wi-Fi (`http://192.168.X.X:3000`). No requiere servicios cloud de pago ni registros.
- **Motor de Avatares**: Sistema modular de vectores **SVG tipo South Park / Chibi**.
  - Permite mezclar: tonos de piel, peinados, ojos/gafas, bocas/barbas, vestimentas y accesorios meme (gorros, cadenas, headset, bizum, etc.).
  - 100% procedimental, sin imágenes externas pesadas, ultra rápido para IA y navegadores.
- **Motor de Sonido**: **Web Audio API** sintetizado. Sonidos procedurales (chismes retro, bocina de angustia de Android, fanfarria, pasos) sin depender de archivos de audio externos que puedan fallar por CORS o enlaces caídos.

---

## 🗺️ 3. Flujo del Juego
```
[ PANTALLA PRINCIPAL ]                          [ MÓVILES AMIGOS ]
        │                                               │
   Lobby con QR  ◄─────── Conexión Socket.IO ──────── Escanear QR
        │                                               │
  Muestra jugadores                               Elegir Nombre
  con avatares South Park                         Personalizar Avatar
        │                                               │
  Alerta Android (Meme) ◄────── User-Agent / Toggle ─── "Ya lo siento..."
        │                                               │
    Lobby Listo                                     Listo para jugar
        │ (J1 o Admin pulsa Iniciar)                    │
  Overworld Mario                                 Mando Móvil:
  (Avatares en Piña) ◄── J1 pulsa "Avanzar/Entrar" ── Controles J1
        │                                         (Otros: Emojis/Bocinas)
  Minijuego (Réplica)                                    │
  (Equipos 4v4 equilibrados) ◄─ Controles del Juego ──── Botones de acción
        │                                               │
  Puntuación y Vuelta al Mapa (Siguiente nivel desbloqueado)
```

---

## 🎭 4. Mecánicas de Lore y Gags Identitarios
1. **La Alarma Android**:
   - Detección de Android (o simulador de prueba).
   - Suena sirena/bocina de angustia en la pantalla grande.
   - Mensaje gigante: *"🚨 ANDROID DETECTADO! Oremos por él 🙏 / Alguien que le haga un Bizum a [Jugador]"*.
   - El móvil de la víctima muestra una pantalla compasiva: *"Ya lo siento amigo Android... 🥀"*.
2. **La Piña de Avatares**:
   - En el mapa de niveles (estilo Mario World), todos los personajes se mueven juntos en pelotón ("en piña") de un círculo a otro.
3. **El Rol de J1**:
   - El primer jugador conectado (o asignado por el admin) tiene el timón para decidir cuándo avanzar por el mapa o iniciar pruebas.
4. **Equilibrador de Grupos Inteligente**:
   - Distribución automática de partidas (evita situaciones absurdas como 4 vs 4 vs 1 descompensado, equilibrando equipos con comodines o repescas).

---

## 🚀 5. Roadmap de Minijuegos Parodia (Próximas Fases)
1. **Mario Kart "Goofy Grand Prix"**:
   - Vista superior / pseudo-3D mode 7.
   - Coches que derrapan demasiado, plátanos que invierten los controles (izquierda es derecha).
2. **Super Smash "Chavalil Bros"**:
   - Plataforma 2D con físicas exageradas donde los amigos se pegan empujones y se tiran fuera de la pantalla.
3. **League of Chavalil**:
   - Minijuego MOBA cutre.
   - *Ayrton Pick*: Habilidad definitiva de Warwick (salto salvaje), ¡pero sale disparada en una dirección completamente aleatoria!
4. **GTA "Barrio Chavalil"**:
   - Escapar de la policía de pueblo o robar el coche a un colega esquivando conos.

---

## 🛠️ 6. Guía de Administración y Pruebas
- El Host cuenta con un panel de control rápido para:
  - Añadir bots de prueba (1 o 4 bots de golpe) para probar salas llenas y la piña de avatares.
  - Expulsar jugadores trol.
  - Transferir el rol de J1 a cualquier jugador.
  - Activar el simulador de alerta Android.
  - Reiniciar estado del mapa y partidas.
