---
name: party-ui
description: Sistema de diseño oficial y framework de interfaces de Juego Chavalil (Light-Theme Doodle Pop Candy-Arcade). Usar siempre que se modifiquen pantallas de TV (lobby, overworld, resultados, podio), marcos de minijuegos, mandos táctiles móviles o soundboards.
---

# Party UI Skill — Juego Chavalil

Esta skill rige todas las interfaces de usuario de *Juego Chavalil*, tanto en la pantalla comunitaria compartida (TV a 2–4 metros) como en los mandos táctiles de smartphone (móviles de los chavales).

---

## 📖 Qué leer antes de tocar cualquier interfaz

Antes de escribir una sola línea de HTML, CSS o JS de UI, el agente debe leer:
1. `design/DESIGN.md`: Sistema de diseño oficial (paleta Candy-Arcade, tipografía, botones 3D con falda, reglas de prohibición anti-slop).
2. `design/PRODUCT.md`: Contexto del producto y reglas de experiencia salón/party game.
3. `design/CONTROLLER_LAYOUTS.md`: Catálogo estricto de plantillas táctiles reutilizables (`navegacion`, `kart`, `stick-4`, `doble-stick`, `un-boton`, `soundboard`).

---

## 🎯 Cuándo se aplica y qué NO tocar

### ✅ Se aplica a:
- Pantalla de código QR y Sala de Espera (Lobby).
- Marco común de la TV (cabecera con URL y contador, avisos J1, marcador general).
- Mapa del Mundo (Overworld) y placards de nivel.
- Pantallas de resultados, podio y celebraciones de victoria.
- Modales del sistema (Alarma Android, advertencias de giro de pantalla).
- Mandos móviles completos: creador de avatares, mandos táctiles de todos los minijuegos, modo banquillo/espectador y soundboards.

### ❌ QUEDA ESTRICTAMENTE PROHIBIDO TOCAR:
- El interior/canvas visual de los minijuegos replicados en la TV (`mario-kart.js`, `super-smash.js`, `head-soccer.js`, `curve-fever.js`, `tank-trouble.js`, `bomberman.js`, `haxball.js`). Solo se tocan sus marcos perimetrales (marcador exterior superpuesto y entrada/salida).

---

## 🎨 Principios Fundamentales del Diseño

1. **Light-Theme Doodle Pop**: Fondo `#f1f7fe` con ondas doodle y confeti sutil. Cero fondos negros genéricos o morados de neón.
2. **Botones Candy-Arcade con Relieve 3D**:
   - Borde grueso azul marino (`#1e293b`).
   - Arco superior de brillo especular.
   - Sombra sólida inferior ("falda" o skirt de 6px a 8px) que se comprime (`transform: translateY(4px)`) al presionar.
3. **Mando Móvil Táctil**:
   - `touch-action: none;` y `height: 100dvh;`.
   - Zonas de pulsación sobredimensionadas.
   - En horizontal, reparto estricto: 50% izquierdo para dirección / 50% derecho para clúster de acciones.
4. **Cero Emojis del Sistema**:
   - Los emojis solo se permiten en el Soundboard y reacciones de podio/banquillo, y siempre usando el set local homogéneo (Microsoft Fluent Emoji Flat SVG).
   - Flechas, cruces, estados y navegación se hacen con SVG o CSS geométrico limpio.

---

## ✅ Lista de Comprobación Final (Checklist)

Antes de dar por buena cualquier pantalla o mando:
- [ ] ¿Se adapta a pantallas desde 360×640 hasta 430×932 sin barras de scroll verticales ni horizontales?
- [ ] ¿Usa `100dvh` y `env(safe-area-inset-*)` para no quedar tapado por el notch o la barra de inicio del iPhone?
- [ ] ¿La TV es legible sin forzar la vista a 3 metros (texto mínimo de 28px–32px a 1080p)?
- [ ] ¿Los botones tienen feedback táctil visual instantáneo al tocarse (`:active`)?
- [ ] ¿Hay contraste suficiente (mínimo WCAG AA / AAA)?
- [ ] ¿Todos los colores de jugador están reforzados por etiquetas de texto o pines (`P1 · AZUL`), accesibles para daltónicos?
