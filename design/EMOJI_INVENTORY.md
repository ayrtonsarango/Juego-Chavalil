# 📑 INVENTARIO Y AUDITORÍA DE EMOJIS (Juego Chavalil)

> **Norma Oficial del Sistema de Diseño (`party-ui` / `tareas.txt` Sección 4 & 8):**
> *Los emojis NO están prohibidos, pero se prohíbe usarlos de relleno o como iconos de interfaz genéricos. Solo se permiten cuando el emoji ES el contenido (soundboard, reacciones en directo del banquillo, celebraciones de podio).*
> *Ningún emoji del sistema operativo (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji) debe usarse para botones funcionales ni navegación.*

---

## 🟢 1. Emojis Mantenidos (Contextos Permitidos)

Los siguientes emojis han sido auditados y aprobados porque su uso es intrínseco al contenido social y humorístico del juego:

### A. Soundboard Meme de la Cuadrilla (`public/player.html` / `#soundboard-buttons`)
| Emoji | Etiqueta | Sonido Asociado | Justificación |
|---|---|---|---|
| `📢` | **BOCINA** | `bocina` | Representa la bocina de feria clásica. El emoji es el icono del sticker sonoro. |
| `🐺` | **AUUUU** | `auuu` | Aullido de lobo meme de la cuadrilla. |
| `🍦` | **BING** | `bing_chilling` | Meme viral Bing Chilling de John Cena. |
| `🗣️` | **FAAAH** | `faaah` | Exclamación meme de charla / salseo. |
| `😱` | **OMG** | `oh_my_god` | Grito dramático Joseph Joestar. |
| `💣` | **ALLAH** | `allah_akbar` | Sonido de explosión retro arcade. |

### B. Banquillo y Modo Espectador (`public/player.html` / `#box-bench-spectator`)
| Emoji | Etiqueta | Efecto | Justificación |
|---|---|---|---|
| `🛋️` | **EN EL BANQUILLO** | Cabecera del modo descanso | Distintivo visual del jugador en espera entre mangas. |
| `👏` | **¡VAMOOOS!** | Aplauso de apoyo en directo | Pegatina de reacción social mientras los compañeros juegan. |
| `🔥` | **¡DALE CAÑA!** | Fuego de motivación | Sticker de ánimo interactivo emitido hacia la pantalla TV. |
| `💀` | **¡VIGILA!** | Calavera de alerta | Reacción para avisar de peligro inminente. |
| `🏆` | **¡POR EL EQUIPO!** | Copa de victoria | Reacción de orgullo de equipo (Azul vs Rojo). |

### C. Podio TV y Celebración de Campeones (`public/host.html`, `public/js/host.js`)
| Emoji | Elemento | Función | Justificación |
|---|---|---|---|
| `🏆` | Corona y Trofeo del Campeón | Banner destacado de J1 y ganador de torneo | Icono de celebración y podio final. |
| `🥇` | 1º Puesto | Medalla de oro en ranking de chavales | Notación universal de podio deportivo. |
| `🥈` | 2º Puesto | Medalla de plata en ranking | Notación de clasificación. |
| `🥉` | 3º Puesto | Medalla de bronce en ranking | Notación de clasificación. |
| `✨` | Partículas de victoria | Efecto de brillo de estrellas | Feedback visual de nivel completado. |

### D. Minijuego Broma Button Bash (`public/js/minigames/button-bash.js` & `player.html`)
| Emoji | Uso | Contexto | Justificación |
|---|---|---|---|
| `🎯` | Diana de dardos | Botón buzzer del móvil y títulos de barra | Icono temático del juego de dardos del bar HotBunnies. |
| `🍜` | GangBang Ramen | Popup absurdo de la mamá de los dos gatos | Sticker intencionalmente cutre tipo anuncio de los 2000. |
| `🔞` | Aviso Badostáin | Popup absurdo de maduritas a 3 km | Broma retro de cuadrilla. |
| `🔒` | Captcha de verificación | Pop-up de verificación de humano | Parodia de seguridad informática de Windows. |
| `👑` | Corona de Alvarito Lerga | Ranking falso que corona a `alvarito.tracasa.lover.69` | Broma del ganador con 999.999.999 pts. |

---

## 🚫 2. Emojis Sustituidos o Prohibidos (UI & Navegación)

De acuerdo con las directrices de `tareas.txt`, los siguientes emojis fueron erradicados de componentes funcionales y sustituidos por estilos gráficos puros:

| Componente Anterior | Emoji Eliminado | Sustitución Implementada | Motivo |
|---|---|---|---|
| **Botones de Navegación del Mapa** | `⬅️` `➡️` | `◀ Anterior` / `Siguiente ▶` en botones con tipografía gruesa y borde 3D sólido | Los emojis de flechas del sistema se veían distintos en cada móvil y carecían de peso táctil. |
| **Botones de Movimiento Mando** | `⬆️` `⬇️` `⬅️` `➡️` | Botones cruceta D-Pad con glifos vectoriales geométricos `▲`, `▼`, `◀`, `▶` | Coherencia de proporciones con el mando físico de consola. |
| **Estado "Listo para Jugar"** | `✅` `❌` | Insignias pill CSS `.badge-success` con texto "¡LISTO PARA JUGAR!" | Evita el aspecto de app de productividad corporativa o To-Do list. |
| **Botón de Acelerar / Gas** | `🟢` / `🏎️` | Botón verde caramelo 3D con texto en negrita `ACELERAR` | Los mandos no deben usar emojis como botones de acción principal. |
| **Botón de Disparo en Tanques** | `💥` | Botón rojo de alto contraste con texto `DISPARAR` | Ergonomía táctil para dos pulgares. |
| **Botón de Golpe en Smash** | `🥊` | Botón de caramelo con borde grueso y letra `GOLPE (A)` | Distinguible por color, forma y posición en el diamante ABXY. |
| **Indicador J1 en Lobby** | `👑` en títulos sueltos | Badge formal dorado con borde `3px solid #0f172a` y texto `LÍDER DE LA SALA` | Estructura visual limpia tipo arcade. |

---

## 📦 3. Independencia de Red y Fuentes Locales

- **Cero dependencias de CDN en runtime**: Ningún recurso de interfaz depende de Google Fonts, Twemoji CDN o FontAwesome CDN.
- **Tipografías locales**: Fuentes incrustadas en el bundle del juego.
- **Vector Avatars**: Todos los avatares se generan y dibujan directamente en el cliente mediante `AvatarEngine` (SVG vectorial nativo puro), garantizando 60 FPS sin descargas externas.
- **Garantía Multiplataforma**: La interfaz se renderiza exactamente igual en Safari iOS, Chrome Android, Firefox y navegadores de Smart TV (Tizen, webOS, Android TV).
