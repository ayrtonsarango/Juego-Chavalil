---
name: anti-slop-copy
description: Auditoría y eliminación estricta de textos obvios, redundantes y AI-slop en Juego Chavalil. Usar para revisar cualquier pantalla o mensaje (TV y móvil), asegurando copys ultra directos estilo arcade, sin explicaciones innecesarias ni florituras.
---

# Anti-Slop Copy Skill — Juego Chavalil

Esta skill define el estándar de redacción (copywriting) para *Juego Chavalil*. En un party game de salón entre amigos, los textos deben ser directos, con jerga natural de cuadrilla o escuetos como un mueble arcade de los 90.

Cualquier texto que explique lo evidente, use relleno de IA o trate al jugador como si no supiera usar un mando es considerado **AI-Slop** y debe eliminarse.

---

## 🎯 Los 3 Mandamientos Anti-Slop

### 1. Si es obvio, SE BORRA
- Si el usuario tiene el smartphone en la mano, **no pongas** "Mando Chavalil" ni "En tu móvil". Ya sabe que es su móvil.
- Si un botón dice `🎯 ¡PULSA!`, **no añadas** un subtítulo diciendo `"1º Pulsa para fijar X · 2º Pulsa para fijar Y"`.
- Si alguien está en el podio, **no pongas** `"Mirando al televisor... El Admin avanzará al mapa"`. Basta con `"📺 Podio en TV"`.
- Si el banquillo tiene un campo de texto con un botón `"Mandar Grito"`, **no añadas** `"Calentando... Tu turno llegará en la siguiente ronda. ¡Manda un grito a la TV para que lo lea toda la sala!"`.

### 2. Copys Directos vs Copys de IA
| ❌ AI-Slop (Prohibido) | ✅ Copy Chavalil Arcade |
|---|---|
| `"Pulsa listo para jugar en tu móvil para entrar a la pista y saltar"` | `Pulsa "¡Listo para jugar!"` |
| `"¡Desafío por escuadras a máxima competición!"` | *(Vacío o nombre de la prueba)* |
| `"⚔️ ¡ESTÁS EN LA ARENA! (Ronda 1/1)"` | `⚔️ Ronda 1/1` |
| `"La Sala de la Cuadrilla"` | `Sala` |
| `"0 LISTOS EN LA SALA"` | `0 LISTOS` |
| `"¡Mira a la TV! Muévete y salta con la Cuadrilla"` | *(Eliminado, el mando habla solo)* |
| `placeholder="¡DALE!, ¡GOL!, ¡VAMOS!"` | `placeholder="Grito (máx 10)"` |
| `placeholder="Tu mote / Nombre"` | *(Sin placeholder, label `Mote:`)* |
| `"🍏 iOS" / "🤖 Android"` en cabecera de juego | *(Eliminado, no aporta nada al gameplay)* |

### 3. Toggles de Personaje ("Binarios") y Aleatorio
- Para personajes de la cuadrilla, el toggle es binario y directo (`🟢 Cara Loca`, `🟢 Gafas de Sol`, etc.).
- Para **Aleatorio**, el botón de acción no es un toggle binario: es **`🎲 Generar aleatorio`** (re-roll de avatar).

---

## 🔍 Checklist de Pasada Rápida (Ejecutar tras cada cambio de UI)

Antes de dar por cerrado cualquier cambio en `player.html`, `host.html`, `player.js` o `host.js`:
- [ ] ¿Hay alguna frase subordinada innecesaria? (*"para entrar a...", "en tu pantalla...", "recuerda que..."*) -> **Cortar**.
- [ ] ¿Hay algún banner que ocupe espacio vertical con texto obvio de ánimos o tutoriales? -> **Minimizar o borrar**.
- [ ] ¿Los placeholders de los inputs son cortos y funcionales (<= 15 caracteres)?
- [ ] ¿Los botones de estado (listo, entrar, siguiente) dicen la acción en 1 a 3 palabras?
