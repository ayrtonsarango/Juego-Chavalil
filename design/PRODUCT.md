# PRODUCT CONTEXT: Juego Chavalil

## 1. Visión y Propósito
**Juego Chavalil** es un party game multijugador local diseñado para partidas de amigos en el salón o proyector:
- **La TV** es la pantalla comunitaria visible a 2–4 metros (habitualmente desde un sofá).
- **El móvil de cada jugador es su mando**: acceso instantáneo escaneando un código QR en la pantalla de la TV, sin descargas, sin registros y sin instalación de apps.
- **Flujo de la experiencia**:
  1. Escaneo de QR en la TV.
  2. Sala de espera (Lobby): personalización de avatar South Park de la cuadrilla, selección de nombre y toggle de "Listo".
  3. Mapa del Mundo (Overworld): cada jugador mueve su personaje por el mapa estilo Super Mario World / Wii. Los jugadores se congregan sobre un nivel.
  4. Confirmación del Anfitrión (J1) para arrancar la prueba.
  5. Minijuego: la TV muestra el juego a 60–150 FPS mientras cada móvil conmuta a su plantilla táctil dedicada.
  6. Resultados y Podio: celebración del ganador de la ronda y ranking acumulativo.
  7. Retorno al mapa para continuar el viaje.

## 2. Minijuegos Replicados vs Interfaces Propias
- **Minijuegos Replicados (Intocables en su canvas/lógica interna)**: Mario Kart (SNES Mode 7), Super Smash Bros (Battlefield), Sports Heads Football, Curve Fever, Tank Trouble, Chaval Bomberman, HaxBall.
- **Interfaces Propias (Objetivo de rediseño y estilización con identidad propia)**:
  - Pantalla de QR y Sala de espera (Lobby).
  - Cabecera y marco común de la TV (marcador, estado de jugadores, alertas).
  - Mapa Overworld, placards de mundo y transiciones de nivel.
  - Modales de podio, victorias y alertas (Alarma Android meme).
  - Mando móvil completo (creador de avatares, navegación por mapa, mandos táctiles de cada juego, modo banquillo/espectador y soundboard).

## 3. Problema Actual que se Resuelve
El juego funciona a nivel técnico, pero su aspecto visual actual denota patrones típicos de "IA genérica":
- Botones circulares clónicos con emojis en el centro.
- Emojis del sistema operativo utilizados indiscriminadamente para navegación, estado e iconos.
- Degradados genéricos morado/azul y estética de panel administrativo (glassmorphism genérico, tarjetas idénticas).
- Tipografías de sistema sin carácter lúdico.

## 4. Filosofía de Diseño: "Juego", no "App"
- **Personalidad lúdica y táctil**: Bordes definidos, sombras sólidas desplazadas (estilo cómic/arcade), botones con relieve que se comprimen físicamente al ser pulsados.
- **Paleta con propósito**: Base sólida y contrastada, 1–2 acentos de marca contundentes, y un color canónico por jugador (hasta 8 jugadores activos) reforzado por formas geométricas y números para accesibilidad total (daltónicos).
- **Tipografía con pegada**: Títulos en tipografía display redondeada o punchy con peso de videojuego arcade/party, y tipografía limpia de alta legibilidad para textos secundarios e instrucciones.
- **Cero emojis del sistema**: Todos los emojis permitidos (soundboard, pegatinas de podio) provienen de un set único local SVG homogéneo.
