# REPOSITORIO DE REFERENCIAS VISUALES (PARTY GAME UI)

Este documento cataloga las 10 fuentes de inspiración y capturas de referencia analizadas para la creación del sistema de diseño `/design/DESIGN.md` de *Juego Chavalil*, contrastando los patrones de cada juego con las necesidades de nuestra pantalla compartida (TV a 2–4 m) y mandos móviles (smartphones).

---

## 📸 Catálogo de Referencias Analizadas

### 1. Button Bash (HotBunnies) — Portada Oficial
- **Archivo**: `button_bash_cover.jpg`
- **Fuente**: Captura directa proporcionada por la cuadrilla.
- **Patrones clave**:
  - Fondo orgánico doodle con líneas onduladas curvas sobre azul pastel muy suave (`#e0e7ff`).
  - Logotipo circular central azul marino profundo (`#1e293b`) con tipografía condensada a mano y relieve.
  - Bolitas de personajes con colores planos saturados (rojo, cian, ámbar) y expresiones ultra-minimalistas (`:)`, `:P`, cara con dientes).
- **Lección para el proyecto**: Máxima expresividad con la mínima complejidad gráfica. Los avatares simplificados funcionan perfecto tanto a 4K en TV como a 48px en móvil.

### 2. Button Bash — Pantallas de Minijuegos
- **Archivo**: `button_bash_minigames.jpg`
- **Fuente**: Captura directa del catálogo de 10 minijuegos.
- **Patrones clave**:
  - Marcos de interfaz con estilo arcade mecánico: bordes gruesos de chapa metálica con remaches/tornillos en las 4 esquinas.
  - Tipografía pixel / display bold para preguntas y números de cuenta atrás.
  - Composición clara con la mascota / host interactivo (robot con pajarita y micrófono) en el centro inferior guiando la acción.

### 3. Jackbox Party Packs (Jackbox Games)
- **Fuente**: Game UI Database / Jackbox.tv architecture.
- **Categoría**: Mando de Smartphone + Sala de TV con Room Code.
- **Patrones clave**:
  - La TV nunca satura con párrafos largos: muestra el código QR grande, la lista de avatares que van entrando con animación de "pop" y un botón claro para que el VIP arranque.
  - El móvil se comporta como un mando, no como un sitio web: botones gigantes, cero scroll, contraste brutal y respuesta instantánea.
  - Los jugadores desconectados se marcan en gris tenue con aviso de reconexión automática sin reiniciar la sala.

### 4. Fall Guys: Ultimate Knockout (Mediatonic)
- **Fuente**: Game UI Database (Season Pass, Lobby & Results Screen).
- **Categoría**: Neobrutalismo Lúdico (Chunky UI).
- **Patrones clave**:
  - Contornos negros gruesos (3px a 4px) con sombras sólidas desplazadas (Drop Shadow de 4px a 8px sin desenfoque gaussiano).
  - Colores ultra-vivos que no cansan la vista gracias a fondos ligeramente desaturados.
  - Sensación táctil física: los botones tienen una base oscura ("la falda del botón") que simula altura mecánica y desaparece cuando el botón se presiona.

### 5. Mario Party Superstars (Nintendo)
- **Fuente**: Nintendo Switch UI Analysis.
- **Categoría**: Selección de Personaje & Overworld Board.
- **Patrones clave**:
  - Fichas circulares y cuadradas con marco biselado donde cada jugador tiene asignado un color primario indeleble (P1 Azul, P2 Rojo, P3 Verde, P4 Amarillo).
  - Indicador de J1 con insignia dorada prominente pero elegante.
  - Mapa del mundo con casillas claras y feedback visual de avance del grupo ("pelotón").

### 6. Overcooked! All You Can Eat (Ghost Town Games)
- **Fuente**: Team17 / Ghost Town Games UI.
- **Categoría**: Mapa de Niveles (Overworld Bus).
- **Patrones clave**:
  - Progresión secuencial estricta: los niveles no jugados aparecen con cadenas o interrogantes, generando anticipación y sorpresa.
  - Cartelera de nivel con 3 ranuras de estrellas o monedas coleccionables.
  - Animación de rebote ("bouncy squish") cuando el grupo se posiciona encima de una fase.

### 7. WarioWare: Get It Together! (Nintendo)
- **Fuente**: Nintendo Switch UI Analysis.
- **Categoría**: Transiciones de Minijuegos Ultra-Rápidas.
- **Patrones clave**:
  - Reglas en 1 sola frase o verbo imperativo ("¡CHUTA!", "¡ESQUIVA!", "¡DISPARA!").
  - Pantallas de carga no superiores a 1.5 segundos con cuenta atrás sonora rítmica (3, 2, 1, ¡YA!).
  - El mando del móvil vibra al unísono con el "¡YA!".

### 8. Super Smash Bros. Ultimate (Nintendo)
- **Fuente**: Bandai Namco / Nintendo UI.
- **Categoría**: Podio de Resultados y Marcador de Fin de Ronda.
- **Patrones clave**:
  - Ganador destacado en el centro o izquierda con foco de victoria y avatar a gran escala.
  - Lista de puntuaciones a la derecha ordenada numéricamente de mayor a menor con medallas (🥇, 🥈, 🥉).
  - Botón de avance con temporizador regresivo automático por si nadie interactúa en 10 segundos.

### 9. JHAMELA — Retro Arcade Party Game UI
- **Fuente**: Dribbble (Party Game UI Concept: TV + Phone Controllers).
- **Categoría**: Arquitectura de Mandos Táctiles Móviles.
- **Patrones clave**:
  - División estricta de la pantalla del smartphone: 50% izquierdo para dirección y 50% derecho para acciones.
  - Franja superior delgada reservada para el avatar del jugador y su color de equipo.
  - Sin distracciones decorativas: cada píxel en el móvil tiene propósito de entrada táctil.

### 10. Pikmin 4 (Batallas Dandori)
- **Fuente**: Nintendo Switch UI Analysis.
- **Categoría**: División por Equipos (Azul vs Rojo).
- **Patrones clave**:
  - Marcador de pantalla dividida con contraste cromático adaptado para daltónicos (Azul Eléctrico vs Rojo Escarlata/Naranja).
  - Los nombres de jugador se muestran con fondo en pastilla de alto contraste para ser legibles a 3 metros de distancia.
