# Análisis Técnico: Integración de OpenSmash en Juego Chavalil

## 1. Resumen Ejecutivo
Se ha analizado en profundidad el repositorio oficial [`turtlesoupy/opensmash`](https://github.com/turtlesoupy/opensmash) clonando su código y evaluando sus motores (`engines/ssb64`, `engines/melee`, `web-prototype`).

El proyecto **no es un minijuego web ligero en JavaScript**, sino una cadena de compilación completa en **C++ / WebAssembly / WebGPU** (basada en BattleShip para N64 y Melee-PC) con un pipeline de IA (PyTorch) para generar luchadores 3D a partir de fotos.

---

## 2. Bloqueos Técnicos para su Inclusión como Minijuego 8

1. **Barrera de ROM Propietaria (ROM Gate Obligatorio)**:
   - Por motivos legales de derechos de autor de Nintendo, OpenSmash **no contiene ningún sprite, modelo 3D, escenario ni audio en el repositorio ni en el servidor**.
   - El navegador ejecuta un módulo WASM (`Torch`) que obliga al usuario a **subir una ROM original limpia de Super Smash Bros (USA v1.0 .z64)** o una ISO de Melee.
   - Si no se valida el hash SHA-1 de la ROM, el servidor devuelve `401 Unauthorized` y el juego no arranca. En una fiesta entre amigos, no es viable exigir subir una ROM cada vez que se juega el nivel 8.

2. **Falta de Capa Multijugador Web / Socket.io**:
   - El motor compilado en WASM solo acepta entradas de teclado local o mandos USB GameCube conectados físicamente al PC host.
   - No expone una API para recibir comandos de botones desde 8 smartphones a través de WebSockets / Socket.io en tiempo real.

3. **Dependencias del Entorno y Peso**:
   - Requiere Emscripten SDK (`emsdk`), compiladores C++, Python 3 con PyTorch, y múltiples subrepositorios de más de 2 GB (`BattleShip`, `libultraship`, `ssb-decomp-re`, `Torch`, `melee-pc`).

---

## 3. Mejores Alternativas Web Recomendadas

### Alternativa 1 (Recomendada - Nivel 8 Dedicado): "Super Smash Stadium / Coliseo Chavalil"
- Utilizar la base nativa Canvas de combate que ya tenemos optimizada en `public/js/minigames/`, creando `public/js/minigames/opensmash-arena.js` como Nivel 8 sin tocar `super-smash.js`.
- **Ventajas**:
  * Carga instantánea (<100ms) sin ROMs ni plugins externos.
  * Compatibilidad 100% nativa con los 8 mandos móviles táctiles ya calibrados.
  * Avatares de la cuadrilla (South Park) en el combate con físicas de knockback (0-300%), ledge-grab, Up-B recovery, escudos y blast zones.
  * Escenario exclusivo: *Destino Final* con meteoritos y plataformas dinámicas.

### Alternativa 2: EmulatorJS con Core N64 / WebAssembly
- Integrar `emulatorjs` en un iframe apuntando a una ROM homebrew o romhack desensamblada.
- **Inconveniente**: Alto uso de CPU en el navegador TV y latencia de mapeo de controles web a gamepad virtual.

### Alternativa 3: Acceso Directo a `smash.fun`
- Si Ayrton o la cuadrilla quieren jugar con el OpenSmash oficial con modelos 3D y ROM propia, se añade una tarjeta de lanzamiento en el menú que abre `https://smash.fun` en una pestaña dedicada.
