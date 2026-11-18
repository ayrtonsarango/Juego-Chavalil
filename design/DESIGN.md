# SISTEMA DE DISEÑO: DOODLE POP CANDY-ARCADE (JUEGO CHAVALIL)

> **Dirección Visual Oficial**: *Light-Theme Doodle Pop Candy-Arcade*
> Inspirada en la portada original de Button Bash, la estética lúdica de Katamari Damacy, y la contundencia táctil física de Fall Guys / WarioWare.

---

## 🎨 1. Filosofía y Personalidad Visual

1. **Juego, no App**: Cero estética de panel de control administrativo o SaaS. Se priorizan los contornos negros/marinos de 3.5px a 4.5px, sombras sólidas desplazadas ("skirt" inferior), botones con volumen mecánico 3D que se comprimen al tocarlos y avatares South Park canónicos.
2. **Light-Theme Amigable**: Fondo celeste/crema con garabatos ondulados doodle y confeti lúdico (puntos de color pastel). Elimina la fatiga visual de los fondos negros planos conservando un contraste óptico superior (AAA) tanto para la TV a 3 metros como para pantallas OLED de móvil a plena luz.
3. **Botones de Caramelo (Candy Buttons)**:
   - Arco de brillo especular superior semi-transparente (`linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)`).
   - Borde grueso de trazo continuo azul marino (`#1e293b`).
   - "Falda" o extrusión física inferior de 6px a 8px en tono más oscuro que se comprime (`transform: translateY(4px)`) al presionar.
4. **Accesibilidad para Daltónicos**: Cada chaval y jugador tiene asignado un color primario indeleble siempre reforzado por **texto de identificación** (`P1 · AZUL`) y pines geométricos, nunca únicamente por color.

---

## 🌈 2. Paleta Cromática Oficial

### Paleta Base de Superficie
| Rol | Nombre | Hex | Propósito |
|---|---|---|---|
| **Fondo Global** | Doodle Blue Canvas | `#f1f7fe` | Fondo con micro-garabatos vectoriales y confeti |
| **Borde / Texto Primario** | Deep Navy | `#1e293b` | Contornos gruesos (3.5px–4.5px), títulos y texto |
| **Superficie de Tarjetas** | Pure White | `#ffffff` | Paneles principales y tarjetas de jugadores |
| **Superficie Secundaria** | Slate Tint | `#f8fafc` | Fondos de controles, D-pads y cajones |
| **Separadores** | Doodle Dashed | `#cbd5e1` | Líneas punteadas lúdicas |

### Paleta de Acentos de Juego (Candy Palette)
| Color | Top Gradient | Base Fill | Skirt (Sombra 3D) | Uso |
|---|---|---|---|---|
| **Cyan** | `#7dd3fc` | `#38bdf8` | `#0284c7` | J1 / Jugador 1, giro izquierdo, salto (X), buzzer diana |
| **Green** | `#86efac` | `#22c55e` | `#15803d` | Confirmar, Acelerar (Gas), escudo (Y), opción B |
| **Pink / Coral** | `#fda4af` | `#f43f5e` | `#be123c` | Jugador 2, ¡Entrar al nivel!, derrape, ataque (A) |
| **Yellow / Gold** | `#fef08a` | `#facc15` | `#ca8a04` | Jugador 4, llamar pelotón, objetos, especial (B) |
| **Orange** | `#fed7aa` | `#fb923c` | `#c2410c` | ¡Arrancar! botón de host, alertas secundarias |
| **Lime** | `#d9f99d` | `#84cc16` | `#4d7c0f` | Jugador 3 (Marta) |

---

## 🔤 3. Tipografía

Máximo 2 familias tipográficas en todo el juego:
1. **Titulares y Botones de Acción**: **`Fredoka`** (Google Fonts / local OFL).
   - Pesos: `800` (Bold) y `900` (Black).
   - Trazos redondeados, punchy, sin serifas aburridas, con peso de videojuego arcade.
2. **Cuerpo de Texto y Metadatos**: **`Outfit`** (Google Fonts / local OFL).
   - Pesos: `700` (Bold) y `800` (ExtraBold).
   - Ultra legible a distancia (TV a 3 metros) y en pantallas móviles pequeñas.

---

## 🚫 4. Reglas de Prohibiciones (Anti-AI-Slop)

1. ❌ **PROHIBIDO** el glassmorphism, transparencias difusas y sombras de neón moradas/azules genéricas.
2. ❌ **PROHIBIDO** el uso de emojis del sistema operativo para navegación, flechas, o estados.
3. ❌ **PROHIBIDO** botones circulares idénticos con un icono flotando en medio sin etiqueta ni identidad.
4. ❌ **PROHIBIDO** dibujar siluetas de mandos de consola (Game Boy / Switch / PlayStation).
5. ❌ **PROHIBIDO** texto gris claro con bajo contraste o etiquetas minúsculas en mayúsculas encima de cada título.

---

## 😀 5. Política de Emojis e Iconos

- **Iconos funcionales**: Dibujados en CSS o SVG geométrico limpio (flechas `▲ ◀ ▶ ▼`, engranajes, pines).
- **Emojis permitidos**:
  - Soundboard meme (6 memes canónicos): `📢`, `🐺`, `🍦`, `🗣️`, `😱`, `💣`.
  - Reacciones de banquillo/espectador: `👏`, `🔥`, `💀`, `🏆`.
  - Podio / Celebraciones: `🏆`, `🥇`, `🥈`, `🥉`.
- **Regla estricta**: Los emojis permitidos provienen de un **set único vectorial homogéneo** (Microsoft Fluent Emoji Flat SVG) alojado localmente en `/design/assets/emoji/`.

---

## 📱 6. Reglas de Mandos Móviles (Ergonomía Táctil)

1. **Touch-Action**: `touch-action: none;` y `height: 100dvh;` para evitar desplazamientos accidentales y rebotes en Safari / Android.
2. **Zonas Seguras**: `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);`.
3. **División 50% / 50% en Horizontal**:
   - Mitad izquierda: Zona de dirección (Steer paddles o D-Pad de combate).
   - Mitad derecha: Clúster de acciones (Pedal Acelerar o Diamante de acciones X/Y/A/B).
4. **Botón Diana / Buzzer (Button Bash)**:
   - Cúpula de 260px a 290px en el centro de la pantalla con relieve de domo arcade, indicador de target concéntrico y retroalimentación háptica (`navigator.vibrate([35])`).
