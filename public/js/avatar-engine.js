/**
 * AVATAR ENGINE - South Park / Chibi Modular SVG Generator
 * Fácil de renderizar, ligero y 100% vectorial para agentes IA y navegadores.
 * Incluye presets personalizados de la cuadrilla (Ayrton, Eneko, Lucía, Manu, DJ, Violeta, Marta, Asier, Santi).
 */

const AVATAR_OPTIONS = {
  skins: [
    { id: '#fffbf7', label: 'Ultra Blanco' },
    { id: '#ffedd5', label: 'Porcelana' },
    { id: '#ffe0bd', label: 'Claro' },
    { id: '#f5d0b5', label: 'Melocotón' },
    { id: '#e2a378', label: 'Moreno' },
    { id: '#a3683a', label: 'Bronce' },
    { id: '#603813', label: 'Oscuro' },
    { id: '#a7f3d0', label: 'Alien' },
    { id: '#fecdd3', label: 'Gamba' }
  ],
  hairs: [
    { id: 'korean_long', label: 'Cantante Coreano' },
    { id: 'ayrton_messy', label: 'Despeinado' },
    { id: 'manu_tousled', label: 'Ondulado Textura' },
    { id: 'adri_crop', label: 'Crop Urbano' },
    { id: 'buzz', label: 'Rapado Pelirrojo' },
    { id: 'military', label: 'Militar' },
    { id: 'girl_long', label: 'Melena Larga' },
    { id: 'girl_short', label: 'Pelo Corto' },
    { id: 'girl_wavy', label: 'Ondulado' },
    { id: 'rocker_curly', label: 'Rizado Rockero' },
    { id: 'asier_curly_short', label: 'Rizado Corto' },
    { id: 'sparse_hair', label: 'Pelo Corto Clásico' },
    { id: 'spiky_up', label: 'En Punta' },
    { id: 'djon_quiff', label: 'Tupé Texturizado' },
    { id: 'girl_long_straight', label: 'Liso Largo' },
    { id: 'rocker_long', label: 'Melenón Metalero' },
    { id: 'slick', label: 'Engominado' },
    { id: 'cap', label: 'Gorra' },
    { id: 'afro', label: 'Afro' },
    { id: 'messy', label: 'Despeinado Clásico' },
    { id: 'bald', label: 'Calvo' }
  ],
  hairColors: [
    { id: '#1e293b', label: 'Negro' },
    { id: '#78350f', label: 'Castaño' },
    { id: '#ea580c', label: 'Pelirrojo Fuego' },
    { id: '#b45309', label: 'Pelirrojo Cobre' },
    { id: '#eab308', label: 'Rubio' },
    { id: '#06b6d4', label: 'Azul Neón' },
    { id: '#ec4899', label: 'Rosa' }
  ],
  eyes: [
    { id: 'korean_eyes', label: 'Coreano Idol' },
    { id: 'brown_light', label: 'Marrón Claro' },
    { id: 'amber', label: 'Ámbar' },
    { id: 'chinillo', label: 'Chinillo' },
    { id: 'crazy', label: 'Cara Loca' },
    { id: 'normal', label: 'South Park Clásico' },
    { id: 'goofy', label: 'Bizco Derp' },
    { id: 'meme_shades', label: 'Gafas Thug Deal With It' },
    { id: 'tired', label: 'Resaca' },
    { id: 'sparkle', label: 'Anime Brillante' },
    { id: 'squint', label: 'Sospechoso' }
  ],
  mouths: [
    { id: 'crazy_tongue', label: 'Lengua Fuera' },
    { id: 'perilla', label: 'Perilla' },
    { id: 'smile', label: 'Sonrisa' },
    { id: 'tongue', label: 'Lengua Derp' },
    { id: 'open', label: 'Grito' },
    { id: 'mustache', label: 'Bigotillo' },
    { id: 'beard', label: 'Barba' },
    { id: 'smirk', label: 'Chulo' }
  ],
  shirts: [
    { id: 'tracasa_red', label: 'Camiseta Tracasa' },
    { id: '#09090b', label: 'Camiseta Negra' },
    { id: 'tee_graphic', label: 'Camiseta Gráfica' },
    { id: 'biker_leather', label: 'Chupa de Cuero' },
    { id: 'polo_green', label: 'Polo Verde' },
    { id: 'polo_blue', label: 'Polo Azul' },
    { id: 'polo_pink', label: 'Polo Rosa' },
    { id: 'polo_yellow', label: 'Polo Amarillo' },
    { id: '#ef4444', label: 'Sudadera Roja' },
    { id: '#3b82f6', label: 'Azul' },
    { id: '#10b981', label: 'Verde' },
    { id: '#8b5cf6', label: 'Morado' },
    { id: '#f59e0b', label: 'Amarillo' },
    { id: '#0f172a', label: 'Sudadera Negra' },
    { id: 'spain_jersey', label: 'Camiseta España' },
    { id: 'gaming_hoodie', label: 'Sudadera Lolero' },
    { id: 'anime_cosplay', label: 'Atuendo Anime' },
    { id: '#ec4899', label: 'Rosa' }
  ],
  accessories: [
    { id: 'none', label: 'Ninguno' },
    { id: 'white_long_coat', label: 'Abrigo Blanco Largo' },
    { id: 'gorra_brat', label: 'Gorra Brat' },
    { id: 'black_glasses', label: 'Gafas de Pasta' },
    { id: 'tee_black_graphic', label: 'Camiseta Gráfica' },
    { id: 'tee_black_plain', label: 'Camiseta Negra' },
    { id: 'sunglasses', label: 'Gafas de Sol' },
    { id: 'red_glasses', label: 'Gafas Rojas' },
    { id: 'beanie', label: 'Gorro Beanie' },
    { id: 'headset', label: 'Cascos DJ' },
    { id: 'crown', label: 'Corona' },
    { id: 'gold_chain', label: 'Cadena Oro' },
    { id: 'bizum_coin', label: 'Bizum Boy' },
    { id: 'clown_nose', label: 'Nariz Payaso' },
    { id: 'propeller', label: 'Gorro Hélice' },
    { id: 'tin_foil', label: 'Gorro Plata' }
  ],
  handItems: [
    { id: 'none', label: 'Sin Objeto', icon: '✋' },
    { id: 'peruanita', label: 'Peruanita', icon: '👧' },
    { id: 'mandarina', label: 'Mandarina', icon: '🍊' },
    { id: 'movil_tiktok', label: 'Móvil TikTok', icon: '📱' },
    { id: 'eneryeti', label: 'Eneryeti', icon: '⚡' },
    { id: 'teclado_gaming', label: 'Teclado RGB', icon: '⌨️' },
    { id: 'sldcsar', label: 'sldcsar', icon: '🥗' }
  ],
  shoes: [
    { id: 'air_jordan', label: 'Air Jordan 1', icon: '👟' },
    { id: 'classic', label: 'Zapatos', icon: '👞' },
    { id: 'white_sneakers', label: 'Sneakers', icon: '👟' },
    { id: 'boots', label: 'Botas', icon: '🥾' }
  ],
  pets: [
    { id: 'none', label: 'Sin Mascota', icon: '❌' },
    { id: 'cocazero', label: 'Coca-Cola Zero', breed: 'Lata Helada', icon: '🥤' },
    { id: 'peruanita', label: 'Peruanita', breed: 'Hermanita Pequeña', icon: '👧' },
    { id: 'bembo', label: 'Bembo', breed: 'Caniche Naranja', icon: '🐩' },
    { id: 'hunter', label: 'Hunter', breed: 'Perro de Agua', icon: '🐶' },
    { id: 'tusa', label: 'Tusa', breed: 'Gatita B/N', icon: '🐱' },
    { id: 'cat', label: 'Cat', breed: 'Gatita Negra', icon: '🐈‍⬛' },
    { id: 'bichi', label: 'Bichi', breed: 'Golden Retriever', icon: '🦮' }
  ],
  heights: [
    { id: 'normal', label: 'Normal' },
    { id: 'tall', label: 'Alto' },
    { id: 'chubby', label: 'Robusto' }
  ]
};

// PRESETS CANÓNICOS DE LA CUADRILLA
const AVATAR_PRESETS = [
  {
    id: 'ayrton',
    name: 'Ayrton',
    chip: '🤪 Ayrton',
    config: {
      skin: '#ffe0bd',
      hair: 'ayrton_messy',
      hairColor: '#1e293b',
      eyes: 'chinillo',
      mouth: 'crazy_tongue',
      shirt: '#f59e0b',
      accessory: 'none',
      handItem: 'none',
      pet: 'bembo',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'eneko',
    name: 'Eneko',
    chip: '⚡ Eneko',
    config: {
      skin: '#ffedd5',
      hair: 'buzz',
      hairColor: '#ea580c',
      eyes: 'normal',
      mouth: 'smirk',
      shirt: 'shirt_dress_white',
      accessory: 'sunglasses',
      handItem: 'none',
      pet: 'hunter',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'lucia',
    name: 'Lucía',
    chip: '🌸 Lucía',
    config: {
      skin: '#ffe0bd',
      hair: 'girl_long',
      hairColor: '#1e293b',
      eyes: 'brown_light',
      mouth: 'smile',
      shirt: '#ec4899',
      accessory: 'none',
      handItem: 'none',
      pet: 'tusa',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'manu',
    name: 'Manu',
    chip: '👓 Manu',
    config: {
      skin: '#ffe0bd',
      hair: 'manu_tousled',
      hairColor: '#78350f',
      eyes: 'normal',
      mouth: 'smile',
      shirt: '#3b82f6',
      accessory: 'red_glasses',
      handItem: 'mandarina',
      shoes: 'classic',
      pet: 'bichi',
      height: 'tall',
      headShape: 'round'
    }
  },
  {
    id: 'djon',
    name: 'DJon',
    chip: '🎧 DJon',
    config: {
      skin: '#fffbf7',
      hair: 'djon_quiff',
      hairColor: '#78350f',
      eyes: 'meme_shades',
      mouth: 'smile',
      shirt: '#0f172a',
      accessory: 'headset_with_shades',
      handItem: 'sldcsar',
      shoes: 'white_sneakers',
      pet: 'cat',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'violeta',
    name: 'Violeta',
    chip: '🌺 Violeta',
    config: {
      skin: '#fffbf7',
      hair: 'girl_wavy',
      hairColor: '#ea580c',
      eyes: 'amber',
      mouth: 'smile',
      shirt: '#8b5cf6',
      accessory: 'none',
      handItem: 'none',
      pet: 'bichi',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'marta',
    name: 'Marta',
    chip: '🧢 Marta',
    config: {
      skin: '#ffe0bd',
      hair: 'girl_short',
      hairColor: '#1e293b',
      eyes: 'normal',
      mouth: 'smile',
      shirt: '#10b981',
      accessory: 'gorra_brat',
      handItem: 'movil_tiktok',
      shoes: 'white_sneakers',
      pet: 'tusa',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'asier',
    name: 'Asier',
    chip: '🎸 Asier',
    config: {
      skin: '#e2a378',
      hair: 'rocker_curly',
      hairColor: '#1e293b',
      eyes: 'normal',
      mouth: 'smirk',
      shirt: '#0f172a',
      accessory: 'gold_chain',
      handItem: 'movil_tiktok',
      shoes: 'classic',
      pet: 'hunter',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'lerga',
    name: 'Lerga',
    chip: '🏍️ Lerga',
    config: {
      skin: '#fffbf7',
      hair: 'short',
      hairColor: '#09090b',
      eyes: 'normal',
      mouth: 'smirk',
      shirt: 'tracasa_red',
      accessory: 'black_glasses',
      handItem: 'none',
      shoes: 'boots',
      pet: 'hunter',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'santi',
    name: 'Santi',
    chip: '👔 Santi',
    config: {
      skin: '#f5d0b5',
      hair: 'military',
      hairColor: '#78350f',
      eyes: 'normal',
      mouth: 'perilla',
      shirt: 'polo_green',
      accessory: 'none',
      handItem: 'none',
      shoes: 'classic',
      pet: 'bembo',
      height: 'tall',
      headShape: 'round'
    }
  },
  {
    id: 'adriachi',
    name: 'Adriachi',
    chip: '🥤 Adriachi',
    config: {
      skin: '#fed7aa',
      hair: 'adri_crop',
      hairColor: '#09090b',
      eyes: 'normal',
      mouth: 'smile',
      shirt: '#09090b',
      accessory: 'black_glasses',
      handItem: 'none',
      shoes: 'air_jordan',
      pet: 'cocazero',
      height: 'normal',
      headShape: 'square'
    }
  },
  {
    id: 'alel',
    name: 'Alel',
    chip: '🇪🇸 Alel',
    config: {
      skin: '#fffbf7',
      hair: 'sparse_hair',
      hairColor: '#451a03',
      eyes: 'normal',
      mouth: 'smile',
      shirt: 'spain_jersey',
      accessory: 'black_glasses',
      handItem: 'none',
      shoes: 'white_sneakers',
      pet: 'bembo',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'yago',
    name: 'Yago',
    chip: '🎮 Yago',
    config: {
      skin: '#ffe0bd',
      hair: 'spiky_up',
      hairColor: '#78350f',
      eyes: 'normal',
      mouth: 'smirk',
      shirt: 'gaming_hoodie',
      accessory: 'black_glasses',
      handItem: 'teclado_gaming',
      shoes: 'classic',
      pet: 'cat',
      height: 'normal',
      headShape: 'square'
    }
  },
  {
    id: 'hua',
    name: 'Hua',
    chip: '🌸 Hua',
    config: {
      skin: '#fffbf7',
      hair: 'girl_long_straight',
      hairColor: '#09090b',
      eyes: 'chinillo',
      mouth: 'smile',
      shirt: 'anime_cosplay',
      accessory: 'none',
      handItem: 'none',
      shoes: 'white_sneakers',
      pet: 'tusa',
      height: 'normal',
      headShape: 'round'
    }
  },
  {
    id: 'markel',
    name: 'Markel',
    chip: '🎤 Markel',
    config: {
      skin: '#fffbf7',
      hair: 'korean_long',
      hairColor: '#09090b',
      eyes: 'korean_eyes',
      mouth: 'smirk',
      shirt: '#09090b',
      accessory: 'none',
      handItem: 'none',
      shoes: 'classic',
      pet: 'none',
      height: 'tall',
      headShape: 'round'
    }
  },
  {
    id: 'random',
    name: 'Aleatorio',
    chip: '🎲 Aleatorio',
    isRandom: true,
    config: {
      skin: '#ffe0bd',
      hair: 'messy',
      hairColor: '#ea580c',
      eyes: 'crazy',
      mouth: 'crazy_tongue',
      shirt: '#3b82f6',
      accessory: 'none',
      handItem: 'none',
      shoes: 'classic',
      pet: 'none',
      height: 'normal',
      headShape: 'round'
    }
  }
];

// Opciones específicas y únicas por chaval (formato toggle binario limpio, sin textos redundantes)
const CHARACTER_SPECIFIC_OPTIONS = {
  markel: [
    {
      id: 'abrigo_blanco',
      label: 'Abrigo Blanco Largo',
      prop: 'accessory',
      on: 'white_long_coat',
      off: 'none'
    }
  ],
  ayrton: [
    {
      id: 'cara_loca',
      label: 'Cara Loca',
      prop: 'eyes',
      on: 'crazy',
      off: 'chinillo',
      sideEffect: (avatar, active) => {
        avatar.mouth = active ? 'crazy_tongue' : 'smile';
      }
    }
  ],
  asier: [
    {
      id: 'pelo_largo',
      label: 'Melena Larga',
      prop: 'hair',
      on: 'rocker_curly',
      off: 'asier_curly_short'
    }
  ],
  adriachi: [
    {
      id: 'jordans_xl',
      label: 'Jordans',
      prop: 'shoes',
      on: 'air_jordan_comic',
      off: 'air_jordan'
    }
  ],
  manu: [
    {
      id: 'gafas_rojas',
      label: 'Gafas Rojas',
      prop: 'accessory',
      on: 'red_glasses',
      off: 'none'
    }
  ],
  eneko: [
    {
      id: 'gafas_sol',
      label: 'Gafas de Sol',
      prop: 'accessory',
      on: 'sunglasses',
      off: 'none'
    }
  ],
  violeta: [
    {
      id: 'banador',
      label: 'Bañador',
      prop: 'shirt',
      on: 'swimsuit_pink',
      off: '#8b5cf6'
    }
  ],
  marta: [
    {
      id: 'gorra_brat',
      label: 'Gorra Brat',
      prop: 'accessory',
      on: 'gorra_brat',
      off: 'none'
    }
  ],
  lerga: [
    {
      id: 'chupa_cuero',
      label: 'Chupa de Cuero',
      prop: 'shirt',
      on: 'biker_leather',
      off: 'tracasa_red'
    }
  ],
  djon: [
    {
      id: 'cascos_y_gafas',
      label: 'Cascos y Gafas de Sol',
      prop: 'accessory',
      on: 'headset_with_shades',
      off: 'none',
      sideEffect: (avatar, active) => {
        avatar.eyes = active ? 'meme_shades' : 'normal';
      }
    }
  ],
  santi: [
    {
      id: 'polo_verde',
      label: 'Polo Verde',
      prop: 'shirt',
      on: 'polo_green',
      off: 'polo_blue'
    }
  ],
  lucia: [
    {
      id: 'melena_larga',
      label: 'Melena Larga',
      prop: 'hair',
      on: 'girl_long',
      off: 'girl_short'
    }
  ],
  alel: [
    {
      id: 'camiseta_espana',
      label: 'Camiseta España',
      prop: 'shirt',
      on: 'spain_jersey',
      off: '#0f172a'
    }
  ],
  yago: [
    {
      id: 'modo_gaming',
      label: 'Modo Gaming',
      prop: 'shirt',
      on: 'gaming_hoodie',
      off: '#1e293b',
      sideEffect: (avatar, active) => {
        avatar.handItem = active ? 'teclado_gaming' : 'none';
      }
    }
  ],
  hua: [
    {
      id: 'otaku',
      label: 'Atuendo Anime',
      prop: 'shirt',
      on: 'anime_cosplay',
      off: '#8b5cf6'
    }
  ]
};

function getRandomAvatar() {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    skin: rand(AVATAR_OPTIONS.skins).id,
    hair: rand(AVATAR_OPTIONS.hairs).id,
    hairColor: rand(AVATAR_OPTIONS.hairColors).id,
    eyes: rand(AVATAR_OPTIONS.eyes).id,
    mouth: rand(AVATAR_OPTIONS.mouths).id,
    shirt: rand(AVATAR_OPTIONS.shirts).id,
    accessory: rand(AVATAR_OPTIONS.accessories).id,
    handItem: rand(AVATAR_OPTIONS.handItems).id,
    shoes: Math.random() < 0.25 ? 'air_jordan' : 'classic',
    pet: rand(AVATAR_OPTIONS.pets).id,
    height: Math.random() < 0.2 ? 'chubby' : Math.random() < 0.35 ? 'tall' : 'normal',
    headShape: Math.random() < 0.2 ? 'square' : 'round'
  };
}

function renderAvatarSVG(config = {}, size = 120) {
  const c = {
    skin: config.skin || '#ffe0bd',
    hair: config.hair || 'messy',
    hairColor: config.hairColor || '#1e293b',
    eyes: config.eyes || 'normal',
    mouth: config.mouth || 'smile',
    shirt: config.shirt || '#ef4444',
    accessory: config.accessory || 'none',
    handItem: config.handItem || 'none',
    shoes: config.shoes || 'classic',
    height: config.height || 'normal',
    headShape: config.headShape || (config.height === 'chubby' ? 'square' : 'round')
  };

  // Eyes SVG components
  let eyesSvg = '';
  const hasHeadsetShades = c.accessory === 'headset_with_shades';
  const effectiveEyes = hasHeadsetShades ? 'meme_shades' : c.eyes;
  switch (effectiveEyes) {
    case 'korean_eyes':
    case 'korean_idol':
      eyesSvg = `
        <!-- Ojos coreanos estilizados, rasgados y pequeños (Markel) -->
        <path d="M 34 52 Q 44 47 52 52 Q 44 55 34 52 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="43.5" cy="51.5" rx="3.5" ry="3" fill="#0f172a"/>
        <circle cx="42.5" cy="50.5" r="1.2" fill="#ffffff"/>
        <path d="M 32 50.5 Q 43 45.5 53 50.5" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M 60 52 Q 68 47 78 52 Q 68 55 60 52 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <ellipse cx="68.5" cy="51.5" rx="3.5" ry="3" fill="#0f172a"/>
        <circle cx="67.5" cy="50.5" r="1.2" fill="#ffffff"/>
        <path d="M 59 50.5 Q 69 45.5 80 50.5" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
      `;
      break;
    case 'chinillo':
      eyesSvg = `
        <!-- Ojos chinillos / achinados pícaros (Ayrton) -->
        <path d="M 32 53 Q 44 46 54 54 Q 44 51 32 53 Z" fill="#0f172a" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 58 54 Q 68 46 80 53 Q 68 51 58 54 Z" fill="#0f172a" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Pestañita pícara sonriente -->
        <line x1="31" y1="52" x2="27" y2="49" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <line x1="81" y1="52" x2="85" y2="49" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      `;
      break;
    case 'crazy':
      eyesSvg = `
        <!-- Ojos desquiciados cara loca -->
        <ellipse cx="43" cy="51" rx="11" ry="13" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
        <ellipse cx="69" cy="51" rx="10" ry="11" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
        <!-- Pupilas descoordinadas -->
        <circle cx="39" cy="48" r="4.5" fill="#ef4444"/>
        <circle cx="40" cy="48" r="2.5" fill="#0f172a"/>
        <circle cx="72" cy="54" r="2.5" fill="#0f172a"/>
      `;
      break;
    case 'goofy':
      eyesSvg = `
        <!-- Ojos bizcos South Park -->
        <ellipse cx="44" cy="52" rx="9" ry="11" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <ellipse cx="68" cy="52" rx="9" ry="11" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <circle cx="49" cy="52" r="3.5" fill="#0f172a"/>
        <circle cx="63" cy="52" r="3.5" fill="#0f172a"/>
      `;
      break;
    case 'meme_shades':
      eyesSvg = `
        <!-- Gafas de sol Meme Deal With It -->
        <rect x="30" y="44" width="22" height="15" fill="#000000" rx="1"/>
        <rect x="60" y="44" width="22" height="15" fill="#000000" rx="1"/>
        <rect x="50" y="47" width="12" height="4" fill="#000000"/>
        <rect x="33" y="46" width="4" height="4" fill="#ffffff"/>
        <rect x="63" y="46" width="4" height="4" fill="#ffffff"/>
      `;
      break;
    case 'tired':
      eyesSvg = `
        <!-- Ojos de resaca con ojeras -->
        <path d="M 36 60 Q 44 65 52 60" stroke="#94a3b8" stroke-width="2" fill="none"/>
        <path d="M 60 60 Q 68 65 76 60" stroke="#94a3b8" stroke-width="2" fill="none"/>
        <ellipse cx="44" cy="52" rx="8" ry="7" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
        <ellipse cx="68" cy="52" rx="8" ry="7" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
        <circle cx="44" cy="53" r="2.5" fill="#ef4444"/>
        <circle cx="68" cy="53" r="2.5" fill="#ef4444"/>
      `;
      break;
    case 'brown_light':
      eyesSvg = `
        <!-- Ojos marrones claritos expresivos (Lucía) -->
        <ellipse cx="43" cy="52" rx="9.5" ry="12" fill="#8d5b2d" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="69" cy="52" rx="9.5" ry="12" fill="#8d5b2d" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="43" cy="54" rx="6.5" ry="5.5" fill="#b4743e"/>
        <ellipse cx="69" cy="54" rx="6.5" ry="5.5" fill="#b4743e"/>
        <circle cx="43" cy="52" r="3" fill="#18181b"/>
        <circle cx="69" cy="52" r="3" fill="#18181b"/>
        <circle cx="41" cy="48" r="3.5" fill="#ffffff"/>
        <circle cx="67" cy="48" r="3.5" fill="#ffffff"/>
        <circle cx="45" cy="55" r="1.5" fill="#ffffff"/>
        <circle cx="71" cy="55" r="1.5" fill="#ffffff"/>
      `;
      break;
    case 'amber':
      eyesSvg = `
        <!-- Ojos ámbar / miel luminosos (Violeta) -->
        <ellipse cx="43" cy="52" rx="9.5" ry="12" fill="#d97706" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="69" cy="52" rx="9.5" ry="12" fill="#d97706" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="43" cy="54" rx="6.5" ry="5.5" fill="#f59e0b"/>
        <ellipse cx="69" cy="54" rx="6.5" ry="5.5" fill="#f59e0b"/>
        <circle cx="43" cy="52" r="3" fill="#18181b"/>
        <circle cx="69" cy="52" r="3" fill="#18181b"/>
        <circle cx="41" cy="48" r="3.5" fill="#ffffff"/>
        <circle cx="67" cy="48" r="3.5" fill="#ffffff"/>
        <circle cx="45" cy="55" r="1.5" fill="#ffffff"/>
        <circle cx="71" cy="55" r="1.5" fill="#ffffff"/>
      `;
      break;
    case 'sparkle':
      eyesSvg = `
        <!-- Ojos brillantes Anime -->
        <ellipse cx="43" cy="52" rx="10" ry="12" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="69" cy="52" rx="10" ry="12" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
        <circle cx="41" cy="48" r="4" fill="#ffffff"/>
        <circle cx="67" cy="48" r="4" fill="#ffffff"/>
        <circle cx="46" cy="55" r="2" fill="#ffffff"/>
        <circle cx="72" cy="55" r="2" fill="#ffffff"/>
      `;
      break;
    case 'squint':
      eyesSvg = `
        <!-- Ojos sospechosos -->
        <path d="M 35 52 Q 44 48 53 53" stroke="#0f172a" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 59 53 Q 68 48 77 52" stroke="#0f172a" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      break;
    case 'normal':
    default:
      eyesSvg = `
        <!-- Ojos clásicos South Park -->
        <ellipse cx="43" cy="52" rx="9" ry="12" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <ellipse cx="69" cy="52" rx="9" ry="12" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        <circle cx="45" cy="52" r="3" fill="#0f172a"/>
        <circle cx="67" cy="52" r="3" fill="#0f172a"/>
      `;
      break;
  }

  // Mouth SVG components
  let mouthSvg = '';
  switch (c.mouth) {
    case 'crazy_tongue':
      mouthSvg = `
        <!-- Cara loca con lengua fuera desquiciada (Ayrton) -->
        <ellipse cx="56" cy="69" rx="12" ry="7" fill="#7f1d1d" stroke="#0f172a" stroke-width="2"/>
        <rect x="50" y="63" width="12" height="4" rx="1.5" fill="#ffffff"/>
        <!-- Lengua fuera cayendo hacia abajo -->
        <path d="M 49 69 C 48 84, 63 86, 62 70 Z" fill="#f43f5e" stroke="#0f172a" stroke-width="1.8"/>
        <line x1="55.5" y1="70" x2="55.5" y2="79" stroke="#be123c" stroke-width="1.2"/>
        <!-- Gotita de baba derp -->
        <circle cx="64" cy="80" r="1.5" fill="#38bdf8" opacity="0.8"/>
      `;
      break;
    case 'perilla':
      mouthSvg = `
        <!-- Perilla estilizada y bigotillo (Santi) -->
        <path d="M 45 66 Q 56 62 67 66 Q 56 69 45 66 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="1.2"/>
        <path d="M 48 68 Q 56 73 64 68" stroke="#1e293b" stroke-width="2" fill="none"/>
        <path d="M 51 74 Q 56 72 61 74 Q 59 86 56 88 Q 53 86 51 74 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="1.5"/>
      `;
      break;
    case 'open':
      mouthSvg = `
        <ellipse cx="56" cy="69" rx="8" ry="8" fill="#7f1d1d" stroke="#1e293b" stroke-width="2"/>
        <path d="M 50 68 Q 56 73 62 68" fill="#ef4444"/>
      `;
      break;
    case 'tongue':
      mouthSvg = `
        <path d="M 46 68 Q 56 75 66 68" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 53 70 Q 57 80 61 70 Z" fill="#f43f5e" stroke="#1e293b" stroke-width="1.5"/>
      `;
      break;
    case 'mustache':
      mouthSvg = `
        <path d="M 44 67 Q 56 63 68 67 Q 56 73 44 67 Z" fill="#3f2305" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M 50 71 Q 56 74 62 71" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'beard':
      mouthSvg = `
        <path d="M 40 68 Q 56 82 72 68 Q 56 77 40 68 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M 48 68 Q 56 73 64 68" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'smirk':
      mouthSvg = `
        <path d="M 47 69 Q 58 68 66 64" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      `;
      break;
    case 'smile':
    default:
      mouthSvg = `
        <path d="M 47 67 Q 56 74 65 67" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      `;
      break;
  }

  // Hair SVG components
  let hairSvg = '';
  switch (c.hair) {
    case 'korean_long':
      hairSvg = `
        <!-- Pelo Cantante Coreano Largo / Curtain Bangs K-Pop (Markel) -->
        <!-- Capa trasera / melena que cae por los hombros -->
        <path d="M 17 50 C 14 30, 26 10, 56 10 C 86 10, 98 30, 95 50 C 97 68, 92 84, 85 92 C 82 86, 84 72, 85 60 C 86 44, 82 32, 70 28 C 64 26, 48 26, 42 28 C 30 32, 26 44, 27 60 C 28 72, 30 86, 27 92 C 20 84, 15 68, 17 50 Z" fill="${c.hairColor}" stroke="#090d16" stroke-width="2.2"/>
        <!-- Masa principal superior con volumen sedoso -->
        <path d="M 20 44 C 18 28, 30 14, 56 14 C 82 14, 94 28, 92 44 C 88 34, 76 26, 68 28 C 60 30, 58 38, 56 42 C 54 38, 52 30, 44 28 C 36 26, 24 34, 20 44 Z" fill="${c.hairColor}" stroke="#090d16" stroke-width="2.2"/>
        <!-- Mechones frontales 'curtains' que enmarcan la cara -->
        <path d="M 56 22 C 51 28, 42 32, 33 46 C 30 52, 28 62, 29 68 C 32 64, 36 54, 42 46 C 48 38, 53 32, 56 22 Z" fill="${c.hairColor}" stroke="#090d16" stroke-width="2.0" stroke-linejoin="round"/>
        <path d="M 56 22 C 61 28, 70 32, 79 46 C 82 52, 84 62, 83 68 C 80 64, 76 54, 70 46 C 64 38, 59 32, 56 22 Z" fill="${c.hairColor}" stroke="#090d16" stroke-width="2.0" stroke-linejoin="round"/>
        <!-- Brillo sedoso superior de idol -->
        <path d="M 32 20 Q 42 16 50 19" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
        <path d="M 62 19 Q 70 16 80 20" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" opacity="0.6"/>
      `;
      break;
    case 'ayrton_messy':
      hairSvg = `
        <!-- Pelo Despeinado Chavalil (Ayrton) con mechones dinámicos y volumen -->
        <!-- Sombra base detrás de la silueta -->
        <path d="M 18 48 C 14 36, 18 24, 28 17 C 36 12, 48 11, 56 11 C 66 11, 76 13, 85 18 C 94 25, 98 36, 94 48 Q 78 30 56 30 Q 34 30 18 48 Z" fill="#090d16" opacity="0.45"/>
        <!-- Silueta principal texturada con picos naturales -->
        <path d="M 19 48 C 15 37, 18 27, 26 21 L 29 25 L 36 15 L 43 21 L 52 12 L 58 12 L 67 19 L 76 14 L 81 23 L 90 20 C 97 29, 97 39, 93 48 C 87 43, 81 42, 75 44 C 67 38, 57 39, 49 43 C 41 38, 31 39, 23 45 Z" fill="${c.hairColor}" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- Mechones frontales con caída sobre la frente -->
        <path d="M 27 43 Q 33 37 41 42 Q 49 36 57 41 Q 65 35 75 40 Q 82 36 86 43" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <!-- Mechones sueltos pícaros -->
        <path d="M 33 24 Q 38 18 44 23" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M 60 21 Q 66 16 71 22" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Brillo / highlight sutil superior -->
        <path d="M 38 19 Q 54 14 70 19" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" opacity="0.5"/>
      `;
      break;
    case 'manu_tousled':
      hairSvg = `
        <!-- Pelo ondulado con textura y raya desenfadada (Manu) -->
        <!-- Sombra base -->
        <path d="M 20 48 C 17 33, 22 22, 32 16 C 42 12, 54 12, 64 14 C 76 16, 88 23, 92 48 Q 78 32 56 32 Q 34 32 20 48 Z" fill="#3f1d0b" opacity="0.45"/>
        <!-- Masa principal con ondulación lateral hacia la izquierda/derecha -->
        <path d="M 21 48 C 18 36, 20 27, 28 20 C 35 14, 46 13, 56 14 C 67 12, 79 15, 87 22 C 94 28, 95 38, 92 48 C 86 42, 80 41, 74 43 C 68 37, 58 36, 50 41 C 42 36, 31 38, 24 45 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.2"/>
        <!-- Ondas y mechones suaves que enmarcan la frente -->
        <path d="M 28 42 C 34 36, 42 37, 48 42 C 54 36, 64 36, 72 41 C 78 37, 84 39, 88 44" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <path d="M 38 23 Q 48 19 56 22" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <path d="M 64 23 Q 74 21 82 25" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      `;
      break;
    case 'adri_crop':
      hairSvg = `
        <!-- French Crop / Fade Urbano con textura y sienes cuadradas (Adriachi) -->
        <!-- Sombra fade en los laterales y nuca que se adapta a la mandíbula Buford -->
        <path d="M 22 50 C 21 34, 30 22, 56 22 C 82 22, 91 34, 90 50 C 86 48, 80 44, 74 42 C 64 40, 48 40, 38 42 C 32 44, 26 48, 22 50 Z" fill="${c.hairColor}" opacity="0.55"/>
        <!-- Corte superior con textura recta y perfilado cuadrado -->
        <path d="M 23 48 L 24 33 C 26 21, 40 18, 56 18 C 72 18, 86 21, 88 33 L 89 48 C 84 44, 78 41, 70 41 L 42 41 C 34 41, 28 44, 23 48 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.2"/>
        <!-- Flequillo recto texturado estilo crop de barbería -->
        <line x1="38" y1="41" x2="74" y2="41" stroke="#0f172a" stroke-width="2.5" stroke-linecap="square"/>
        <!-- Micro texturas de corte a tijera en la parte superior -->
        <path d="M 36 28 L 40 24 L 46 27 L 52 23 L 58 27 L 64 24 L 70 28" stroke="#334155" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Perfilado nítido en las patillas y sienes cuadradas -->
        <line x1="24" y1="48" x2="24" y2="42" stroke="#0f172a" stroke-width="2"/>
        <line x1="88" y1="48" x2="88" y2="42" stroke="#0f172a" stroke-width="2"/>
      `;
      break;
    case 'buzz':
      hairSvg = `
        <!-- Rapado pelirrojo con degradado y puntitos / Buzzcut Fade (Eneko) -->
        <!-- Sombra base del cuero cabelludo rapado que abraza toda la cabeza -->
        <path d="M 23 52 C 22 34, 34 22, 56 22 C 78 22, 90 34, 89 52 C 86 50, 80 46, 72 43 C 64 41, 48 41, 40 43 C 32 46, 26 50, 23 52 Z" fill="${c.hairColor}" opacity="0.6"/>
        <path d="M 25 50 C 24 33, 36 21, 56 21 C 76 21, 88 33, 87 50 C 80 44, 68 40, 56 40 C 44 40, 32 44, 25 50 Z" fill="${c.hairColor}" opacity="0.75"/>
        <!-- Línea perfilada del corte barbería en la frente -->
        <path d="M 24 51 C 28 47, 34 44, 40 43 C 48 41.5, 64 41.5, 72 43 C 78 44, 84 47, 88 51" stroke="#1e293b" stroke-width="1.8" fill="none" opacity="0.8"/>
        <!-- Puntitos de pelo rapado / Folículos pelirrojos densos por toda la cabeza -->
        <g class="buzz-stubble" fill="${c.hairColor}" opacity="0.95">
          <!-- Corona superior -->
          <circle cx="56" cy="24" r="1.3"/><circle cx="50" cy="25" r="1.2"/><circle cx="62" cy="25" r="1.2"/>
          <circle cx="44" cy="27" r="1.2"/><circle cx="56" cy="27" r="1.3"/><circle cx="68" cy="27" r="1.2"/>
          <!-- Zona media alta -->
          <circle cx="36" cy="29" r="1.2"/><circle cx="48" cy="29" r="1.2"/><circle cx="64" cy="29" r="1.2"/><circle cx="76" cy="29" r="1.2"/>
          <circle cx="42" cy="32" r="1.3"/><circle cx="52" cy="32" r="1.3"/><circle cx="60" cy="32" r="1.3"/><circle cx="70" cy="32" r="1.3"/>
          <circle cx="32" cy="33" r="1.2"/><circle cx="80" cy="33" r="1.2"/>
          <!-- Zona central -->
          <circle cx="36" cy="35" r="1.2"/><circle cx="46" cy="35" r="1.3"/><circle cx="56" cy="35" r="1.4"/><circle cx="66" cy="35" r="1.3"/><circle cx="76" cy="35" r="1.2"/>
          <circle cx="30" cy="37" r="1.2"/><circle cx="40" cy="38" r="1.3"/><circle cx="50" cy="38" r="1.3"/><circle cx="62" cy="38" r="1.3"/><circle cx="72" cy="38" r="1.3"/><circle cx="82" cy="37" r="1.2"/>
          <!-- Zona frontal sobre la frente -->
          <circle cx="35" cy="41" r="1.2"/><circle cx="44" cy="41" r="1.2"/><circle cx="56" cy="40.5" r="1.3"/><circle cx="68" cy="41" r="1.2"/><circle cx="77" cy="41" r="1.2"/>
          <circle cx="40" cy="43.5" r="1.1"/><circle cx="48" cy="42.5" r="1.2"/><circle cx="56" cy="42" r="1.2"/><circle cx="64" cy="42.5" r="1.2"/><circle cx="72" cy="43.5" r="1.1"/>
          <!-- Sienes y patillas rapadas con fade -->
          <circle cx="26" cy="41" r="1.1"/><circle cx="25" cy="45" r="1.1"/><circle cx="26" cy="49" r="1.0"/>
          <circle cx="86" cy="41" r="1.1"/><circle cx="87" cy="45" r="1.1"/><circle cx="86" cy="49" r="1.0"/>
          <!-- Puntitos de contraste cobre oscuro para volumen 3D -->
          <circle cx="53" cy="26" r="0.9" fill="#9a3412"/><circle cx="45" cy="34" r="0.9" fill="#9a3412"/>
          <circle cx="67" cy="34" r="0.9" fill="#9a3412"/><circle cx="58" cy="37" r="0.9" fill="#9a3412"/>
          <circle cx="38" cy="36" r="0.9" fill="#9a3412"/><circle cx="74" cy="36" r="0.9" fill="#9a3412"/>
        </g>
      `;
      break;
    case 'military':
      hairSvg = `
        <!-- Corte militar cuadrado / High and tight fade (Santi) -->
        <path d="M 27 46 L 27 30 L 36 24 L 76 24 L 85 30 L 85 46 Q 74 34 56 34 Q 38 34 27 46 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <line x1="36" y1="24" x2="76" y2="24" stroke="#1e293b" stroke-width="2.5"/>
      `;
      break;
    case 'girl_long':
      hairSvg = `
        <!-- Melena larga femenina con flequillo y mechones sobre hombros (Lucía) -->
        <path d="M 20 48 C 14 75, 18 100, 28 105 L 26 80 C 24 55, 26 35, 36 26 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 92 48 C 98 75, 94 100, 84 105 L 86 80 C 88 55, 86 35, 76 26 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 22 46 C 22 18, 90 18, 90 46 Q 76 30 56 30 Q 36 30 22 46 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 28 42 Q 42 46 48 38 Q 54 48 64 38 Q 72 46 84 42" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'girl_short':
      hairSvg = `
        <!-- Pelo corto chic chica / Bob moderno (Marta) -->
        <path d="M 22 48 C 18 64, 20 74, 28 72 C 26 56, 26 40, 34 26 C 44 18, 68 18, 78 26 C 86 40, 86 56, 84 72 C 92 74, 94 64, 90 48 C 90 20, 22 20, 22 48 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 30 40 Q 52 46 68 34" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'girl_wavy':
      hairSvg = `
        <!-- Melena ondulada pelirroja con volumen (Violeta) -->
        <path d="M 18 52 C 10 70, 14 88, 22 96 C 28 88, 24 70, 26 56 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 94 52 C 102 70, 98 88, 90 96 C 84 88, 88 70, 86 56 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 20 46 C 18 16, 94 16, 92 46 Q 76 28 56 28 Q 36 28 20 46 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <circle cx="20" cy="44" r="8" fill="${c.hairColor}"/>
        <circle cx="92" cy="44" r="8" fill="${c.hairColor}"/>
      `;
      break;
    case 'rocker_curly':
      hairSvg = `
        <!-- Pelo rizado rockero / melena con bucles largos (Asier) -->
        <g fill="${c.hairColor}" stroke="#1e293b" stroke-width="1.8">
          <circle cx="24" cy="40" r="10"/>
          <circle cx="36" cy="28" r="11"/>
          <circle cx="56" cy="22" r="12"/>
          <circle cx="76" cy="28" r="11"/>
          <circle cx="88" cy="40" r="10"/>
          <circle cx="20" cy="54" r="9"/>
          <circle cx="92" cy="54" r="9"/>
          <circle cx="18" cy="68" r="8"/>
          <circle cx="94" cy="68" r="8"/>
        </g>
        <path d="M 46 32 Q 54 42 62 34" stroke="#1e293b" stroke-width="2.5" fill="none"/>
      `;
      break;
    case 'asier_curly_short':
      hairSvg = `
        <!-- Pelo rizado corto con bucles definidos (Asier corto) -->
        <g fill="${c.hairColor}" stroke="#1e293b" stroke-width="1.8">
          <circle cx="28" cy="38" r="9"/>
          <circle cx="40" cy="28" r="9.5"/>
          <circle cx="56" cy="23" r="10"/>
          <circle cx="72" cy="28" r="9.5"/>
          <circle cx="84" cy="38" r="9"/>
          <circle cx="34" cy="46" r="7.5"/>
          <circle cx="78" cy="46" r="7.5"/>
          <circle cx="56" cy="32" r="8"/>
        </g>
        <path d="M 46 34 Q 54 40 62 35" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'sparse_hair':
      hairSvg = `
        <!-- Pelo corto clásico castaño oscuro con buen volumen y textura (Alel) -->
        <path d="M 21 49 C 19 32, 27 18, 56 18 C 85 18, 93 32, 91 49 C 87 44, 82 41, 75 41 C 67 38, 59 41, 53 38 C 45 42, 36 38, 28 42 C 24 45, 22 47, 21 49 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.2"/>
        <path d="M 32 30 Q 42 23 54 25" stroke="#2d1305" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 48 24 Q 60 21 72 25" stroke="#2d1305" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 38 35 Q 48 30 60 33" stroke="#2d1305" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 62 33 Q 70 29 78 34" stroke="#2d1305" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 25 44 Q 31 38 37 42" stroke="#2d1305" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M 75 42 Q 81 38 87 44" stroke="#2d1305" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      `;
      break;
    case 'spiky_up':
      hairSvg = `
        <!-- Pelo hacia arriba en punta castaño (Yago) -->
        <!-- Sombra base -->
        <path d="M 21 46 C 18 34, 23 23, 32 17 C 42 12, 70 12, 80 17 C 89 23, 94 34, 91 46 Q 74 30 56 30 Q 38 30 21 46 Z" fill="#2d1305" opacity="0.45"/>
        <!-- Silueta con puntas enérgicas elevadas hacia arriba -->
        <path d="M 21 46 C 19 36, 23 27, 28 22 L 31 25 L 36 14 L 42 22 L 49 11 L 56 18 L 63 11 L 70 22 L 76 14 L 81 25 L 84 22 C 89 27, 93 36, 91 46 C 84 41, 78 39, 72 41 C 65 37, 57 38, 49 41 C 43 38, 33 39, 26 44 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- Textura de mechones en punta interiores -->
        <path d="M 37 24 L 43 17 L 46 25" stroke="#9a3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 50 21 L 56 14 L 62 21" stroke="#9a3412" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 66 25 L 69 17 L 75 24" stroke="#9a3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Mechón frontal sobre la frente -->
        <path d="M 34 42 Q 44 38 56 40 Q 68 38 78 42" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'djon_quiff':
      hairSvg = `
        <!-- Pelo peinado hacia arriba con textura marrón (DJon) - similar a Yago pero no tan alto -->
        <!-- Sombra base -->
        <path d="M 22 47 C 20 36, 25 26, 34 20 C 44 15, 68 15, 78 20 C 87 26, 92 36, 90 47 Q 74 33 56 33 Q 38 33 22 47 Z" fill="#2d1305" opacity="0.45"/>
        <!-- Silueta de pelo peinado hacia arriba con tupé moderado -->
        <path d="M 22 47 C 20 38, 24 30, 30 25 L 34 27 L 40 20 L 46 25 L 53 17 L 60 23 L 67 18 L 73 24 L 78 20 L 82 26 C 87 31, 91 39, 90 47 C 84 42, 78 40, 72 42 C 65 39, 57 39, 49 42 C 43 39, 33 40, 26 45 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- Textura de mechones peinados hacia arriba -->
        <path d="M 40 28 L 46 22 L 49 28" stroke="#9a3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 54 26 L 59 19 L 64 25" stroke="#9a3412" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 68 28 L 72 22 L 76 27" stroke="#9a3412" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <!-- Mechón frontal peinado -->
        <path d="M 32 44 Q 44 39 56 41 Q 68 39 80 44" stroke="#1e293b" stroke-width="2" fill="none"/>
      `;
      break;
    case 'girl_long_straight':
      hairSvg = `
        <!-- Melena negra lisa y larga con flequillo recto (Hua) -->
        <!-- Mechones largos que caen a los lados sobre los hombros -->
        <path d="M 18 46 L 15 76 C 14 88, 22 98, 26 98 C 30 98, 27 88, 28 75 L 29 48 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 94 46 L 97 76 C 98 88, 90 98, 86 98 C 82 98, 85 88, 84 75 L 83 48 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <!-- Parte superior redonda de la cabeza -->
        <path d="M 22 47 C 21 21, 91 21, 90 47 Q 75 34 56 34 Q 37 34 22 47 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <!-- Flequillo recto liso tradicional -->
        <path d="M 28 47 L 29 42 C 34 42, 40 40, 56 40 C 72 40, 78 42, 83 42 L 84 47 Q 56 43 28 47 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <line x1="33" y1="42" x2="79" y2="42" stroke="#1e293b" stroke-width="2.2"/>
        <!-- Brillo satinado de cabello liso estilo anime -->
        <path d="M 36 28 Q 56 24 76 28" stroke="#64748b" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>
        <line x1="20" y1="65" x2="20" y2="78" stroke="#64748b" stroke-width="1.8" opacity="0.5"/>
        <line x1="92" y1="65" x2="92" y2="78" stroke="#64748b" stroke-width="1.8" opacity="0.5"/>
      `;
      break;
    case 'rocker_long':
      hairSvg = `
        <!-- Melenón metalero largo (Asier) -->
        <path d="M 16 48 L 12 78 L 24 104 L 28 75 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 96 48 L 100 78 L 88 104 L 84 75 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
        <path d="M 20 44 L 26 24 L 38 28 L 56 16 L 74 28 L 86 24 L 92 44 Q 74 30 56 30 Q 38 30 20 44 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
      `;
      break;
    case 'afro':
      hairSvg = `
        <circle cx="56" cy="40" r="38" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2.5"/>
      `;
      break;
    case 'cap':
      hairSvg = `
        <!-- Gorra hacia atrás -->
        <path d="M 23 48 C 22 25, 88 25, 89 48 Z" fill="#dc2626" stroke="#1e293b" stroke-width="2.5"/>
        <path d="M 22 47 Q 10 52 14 56 Q 24 53 26 47 Z" fill="#991b1b" stroke="#1e293b" stroke-width="2"/>
        <circle cx="56" cy="27" r="4" fill="#ffffff"/>
      `;
      break;
    case 'slick':
      hairSvg = `
        <path d="M 25 45 C 25 18, 87 18, 87 45 Q 75 32 56 32 Q 37 32 25 45 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
      `;
      break;
    case 'bald':
      hairSvg = `
        <!-- Calvo con brillo -->
        <ellipse cx="44" cy="32" rx="6" ry="3" fill="#ffffff" opacity="0.6"/>
      `;
      break;
    case 'messy':
    default:
      hairSvg = `
        <!-- Pelo despeinado punky -->
        <path d="M 22 47 L 26 28 L 36 34 L 44 20 L 54 30 L 65 19 L 72 32 L 83 26 L 89 47 C 80 32, 32 32, 22 47 Z" fill="${c.hairColor}" stroke="#1e293b" stroke-width="2"/>
      `;
      break;
  }

  // Accessories SVG components
  let accSvg = '';
  switch (c.accessory) {
    case 'white_long_coat':
      // El abrigo largo blanco se renderiza en la capa de cuerpo/outerwear (debajo de la cabeza y envolviendo brazos y piernas)
      accSvg = '';
      break;
    case 'gorra_brat':
      accSvg = `
        <!-- Gorra verde fosforito BRAT (Charli XCX) de Marta -->
        <path d="M 22 45 C 22 22, 90 22, 90 45 Z" fill="#86efac" stroke="#16a34a" stroke-width="2.2"/>
        <path d="M 18 45 Q 56 36 98 45 L 94 49 Q 56 41 18 49 Z" fill="#4ade80" stroke="#16a34a" stroke-width="1.6"/>
        <text x="56" y="38" font-family="'Arial', 'Helvetica', sans-serif" font-size="8.5" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="-0.5">brat</text>
      `;
      break;
    case 'black_glasses':
    case 'tee_black_graphic':
    case 'tee_black_plain':
      accSvg = `
        <!-- Gafas de pasta negras cuadradas estilo Adriachi y Lerga -->
        <rect x="26" y="44" width="24" height="15" rx="3.5" fill="none" stroke="#09090b" stroke-width="3.2"/>
        <rect x="62" y="44" width="24" height="15" rx="3.5" fill="none" stroke="#09090b" stroke-width="3.2"/>
        <line x1="50" y1="48" x2="62" y2="48" stroke="#09090b" stroke-width="3.2"/>
        <line x1="26" y1="48" x2="19" y2="46" stroke="#09090b" stroke-width="2.6"/>
        <line x1="86" y1="48" x2="93" y2="46" stroke="#09090b" stroke-width="2.6"/>
        <line x1="30" y1="47" x2="38" y2="47" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
        <line x1="66" y1="47" x2="74" y2="47" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.6"/>
      `;
      break;
    case 'sunglasses':
      accSvg = `
        <!-- Gafas de sol negras de Eneko estilo Wayfarer -->
        <rect x="27" y="44" width="25" height="16" rx="3" fill="#0f172a" stroke="#000000" stroke-width="2"/>
        <rect x="60" y="44" width="25" height="16" rx="3" fill="#0f172a" stroke="#000000" stroke-width="2"/>
        <line x1="52" y1="48" x2="60" y2="48" stroke="#0f172a" stroke-width="3"/>
        <line x1="31" y1="46" x2="43" y2="46" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="64" y1="46" x2="76" y2="46" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
      `;
      break;
    case 'red_glasses':
      accSvg = `
        <!-- Gafas de ver rojas de pasta de Manu -->
        <rect x="28" y="44" width="23" height="16" rx="4" fill="none" stroke="#dc2626" stroke-width="3"/>
        <rect x="61" y="44" width="23" height="16" rx="4" fill="none" stroke="#dc2626" stroke-width="3"/>
        <path d="M 51 51 Q 56 48 61 51" stroke="#dc2626" stroke-width="3" fill="none"/>
        <line x1="28" y1="48" x2="21" y2="46" stroke="#b91c1c" stroke-width="2.5"/>
        <line x1="84" y1="48" x2="91" y2="46" stroke="#b91c1c" stroke-width="2.5"/>
        <line x1="33" y1="47" x2="40" y2="47" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
        <line x1="66" y1="47" x2="73" y2="47" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
      `;
      break;
    case 'beanie':
      accSvg = `
        <!-- Gorrito beanie moderno de Marta -->
        <path d="M 22 44 C 22 14, 90 14, 90 44 Z" fill="#334155" stroke="#1e293b" stroke-width="2.5"/>
        <rect x="20" y="38" width="72" height="9" rx="3" fill="#0284c7" stroke="#1e293b" stroke-width="2"/>
        <circle cx="56" cy="14" r="5" fill="#38bdf8"/>
      `;
      break;
    case 'headset_with_shades':
    case 'headset':
      accSvg = `
        <!-- Cascos de DJ / Gamer -->
        <path d="M 22 55 C 16 15, 96 15, 90 55" stroke="#334155" stroke-width="4.5" fill="none"/>
        <rect x="18" y="47" width="8" height="15" rx="3" fill="#10b981" stroke="#0f172a" stroke-width="1.5"/>
        <rect x="86" y="47" width="8" height="15" rx="3" fill="#10b981" stroke="#0f172a" stroke-width="1.5"/>
        <path d="M 22 58 Q 28 72 42 70" stroke="#334155" stroke-width="2.5" fill="none"/>
        <circle cx="43" cy="70" r="3" fill="#10b981"/>
      `;
      break;
    case 'crown':
      accSvg = `
        <!-- Corona dorada (Ayrton) -->
        <polygon points="34,36 34,22 45,30 56,16 67,30 78,22 78,36" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
        <circle cx="56" cy="22" r="2.5" fill="#ef4444"/>
        <circle cx="37" cy="25" r="2" fill="#3b82f6"/>
        <circle cx="75" cy="25" r="2" fill="#10b981"/>
      `;
      break;
    case 'gold_chain':
      accSvg = `
        <!-- Cadena de oro con $ -->
        <path d="M 40 86 Q 56 100 72 86" stroke="#fbbf24" stroke-width="3" fill="none"/>
        <circle cx="56" cy="95" r="7" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/>
        <text x="56" y="99" font-size="10" font-weight="900" text-anchor="middle" fill="#ffffff">$</text>
      `;
      break;
    case 'bizum_coin':
      accSvg = `
        <!-- Moneda flotante de Bizum -->
        <g transform="translate(74, 18)">
          <circle cx="10" cy="10" r="11" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
          <text x="10" y="14" font-size="8" font-weight="900" text-anchor="middle" fill="#ffffff">BIZ</text>
        </g>
      `;
      break;
    case 'clown_nose':
      accSvg = `
        <circle cx="56" cy="59" r="6" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <ellipse cx="54" cy="57" rx="2" ry="1" fill="#ffffff"/>
      `;
      break;
    case 'propeller':
      accSvg = `
        <ellipse cx="56" cy="28" rx="22" ry="7" fill="#f59e0b" stroke="#1e293b" stroke-width="2"/>
        <line x1="56" y1="28" x2="56" y2="18" stroke="#1e293b" stroke-width="2"/>
        <ellipse cx="50" cy="18" rx="10" ry="2.5" fill="#ef4444"/>
        <ellipse cx="62" cy="18" rx="10" ry="2.5" fill="#3b82f6"/>
      `;
      break;
    case 'tin_foil':
      accSvg = `
        <polygon points="56,12 28,38 84,38" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
        <line x1="56" y1="12" x2="56" y2="4" stroke="#94a3b8" stroke-width="2"/>
      `;
      break;
    case 'none':
    default:
      break;
  }

  // Shirt, Polo, Biker Leather, Dress Shirt & Swimsuit logic
  const isPolo = typeof c.shirt === 'string' && c.shirt.startsWith('polo');
  const isBikerLeather = c.shirt === 'biker_leather';
  const isTracasaRed = c.shirt === 'tracasa_red';
  const isGraphicTee = c.shirt === 'tee_graphic' || c.accessory === 'tee_black_graphic';
  const isPlainBlackTee = c.shirt === '#09090b' || c.accessory === 'tee_black_plain';
  const isDressShirt = c.shirt === 'shirt_dress_white' || c.shirt === 'shirt_dress';
  const isSwimsuitPink = c.shirt === 'swimsuit_pink';
  const isSpainJersey = c.shirt === 'spain_jersey';
  const isGamingHoodie = c.shirt === 'gaming_hoodie';
  const isAnimeCosplay = c.shirt === 'anime_cosplay';

  let shirtColor = c.shirt;
  if (isPolo) {
    if (c.shirt === 'polo_green') shirtColor = '#10b981';
    else if (c.shirt === 'polo_blue') shirtColor = '#0284c7';
    else if (c.shirt === 'polo_pink') shirtColor = '#ec4899';
    else if (c.shirt === 'polo_yellow') shirtColor = '#f59e0b';
    else shirtColor = '#3b82f6';
  } else if (isBikerLeather) {
    shirtColor = '#18181b';
  } else if (isTracasaRed) {
    shirtColor = '#dc2626';
  } else if (isGraphicTee || isPlainBlackTee) {
    shirtColor = '#09090b';
  } else if (isDressShirt) {
    shirtColor = '#f8fafc';
  } else if (isSwimsuitPink) {
    shirtColor = c.skin;
  } else if (isSpainJersey) {
    shirtColor = '#dc2626';
  } else if (isGamingHoodie) {
    shirtColor = '#18181b';
  } else if (isAnimeCosplay) {
    shirtColor = '#ffffff';
  }

  const poloCollarSvg = isSpainJersey ? `
    <!-- Camiseta de la Selección Española (Alel) -->
    <path d="M 44 80 L 56 89 L 68 80" stroke="#facc15" stroke-width="2.6" fill="none"/>
    <path d="M 46 81 L 56 88 L 66 81" stroke="#1e3a8a" stroke-width="1.2" fill="none"/>
    <line x1="31" y1="83" x2="42" y2="80" stroke="#facc15" stroke-width="2.2"/>
    <line x1="81" y1="83" x2="70" y2="80" stroke="#facc15" stroke-width="2.2"/>
    <g transform="translate(44, 86)">
      <polygon points="4,0 5,3 8,3 5.5,5 6.5,8 4,6 1.5,8 2.5,5 0,3 3,3" fill="#facc15"/>
      <path d="M 1 4 L 7 4 L 7 8 Q 4 11 1 8 Z" fill="#b91c1c" stroke="#facc15" stroke-width="0.8"/>
      <line x1="4" y1="4" x2="4" y2="9" stroke="#facc15" stroke-width="0.8"/>
    </g>
    <path d="M 64 89 L 68 85 L 68 89 Z" fill="#facc15"/>
  ` : isGamingHoodie ? `
    <!-- Sudadera Gaming Lolero RGB (Yago) -->
    <path d="M 44 80 Q 56 86 68 80" stroke="#22d3ee" stroke-width="2.2" fill="none"/>
    <line x1="50" y1="83" x2="50" y2="97" stroke="#f8fafc" stroke-width="1.4"/>
    <line x1="62" y1="83" x2="62" y2="97" stroke="#f8fafc" stroke-width="1.4"/>
    <circle cx="50" cy="98" r="1.3" fill="#22d3ee"/>
    <circle cx="62" cy="98" r="1.3" fill="#22d3ee"/>
    <path d="M 52 90 L 56 86 L 60 90 L 56 94 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.8"/>
    <line x1="32" y1="84" x2="42" y2="81" stroke="#a855f7" stroke-width="2"/>
    <line x1="80" y1="84" x2="70" y2="81" stroke="#a855f7" stroke-width="2"/>
  ` : isAnimeCosplay ? `
    <!-- Atuendo Anime / Cosplay Otaku con cuello marinero y lazo rojo (Hua) -->
    <path d="M 36 80 L 44 87 L 68 87 L 76 80 L 74 93 L 38 93 Z" fill="#1e3a8a" stroke="#172554" stroke-width="1.4"/>
    <path d="M 40 87 L 72 87" stroke="#ffffff" stroke-width="1.2"/>
    <path d="M 41 90 L 71 90" stroke="#ffffff" stroke-width="1.2"/>
    <g transform="translate(56, 88)">
      <polygon points="0,0 -8,-5 -8,5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
      <polygon points="0,0 8,-5 8,5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
      <polygon points="-2,1 -6,9 -2,8" fill="#dc2626"/>
      <polygon points="2,1 6,9 2,8" fill="#dc2626"/>
      <circle cx="0" cy="0" r="2.8" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
    </g>
  ` : isDressShirt ? `
    <!-- Camisa blanca de vestir elegante con cuello italiano y botones (Eneko) -->
    <path d="M 43 79 L 56 88 L 47 88 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
    <path d="M 69 79 L 56 88 L 65 88 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="56" y1="88" x2="56" y2="104" stroke="#94a3b8" stroke-width="1.8"/>
    <circle cx="56" cy="91" r="1.3" fill="#ffffff" stroke="#334155" stroke-width="0.8"/>
    <circle cx="56" cy="96" r="1.3" fill="#ffffff" stroke="#334155" stroke-width="0.8"/>
    <circle cx="56" cy="101" r="1.3" fill="#ffffff" stroke="#334155" stroke-width="0.8"/>
  ` : isSwimsuitPink ? `
    <!-- Bañador / Bikini fino rosa sobre cuerpo blanco (Violeta) -->
    <!-- Copas triangulares de bikini fino rosa -->
    <polygon points="43,84 52,84 48,91" fill="#ff1493" stroke="#be185d" stroke-width="1"/>
    <polygon points="60,84 69,84 64,91" fill="#ff1493" stroke="#be185d" stroke-width="1"/>
    <line x1="52" y1="87" x2="60" y2="87" stroke="#ff1493" stroke-width="1.6"/>
    <line x1="47" y1="84" x2="45" y2="79" stroke="#ff1493" stroke-width="1.4"/>
    <line x1="65" y1="84" x2="67" y2="79" stroke="#ff1493" stroke-width="1.4"/>
    <line x1="43" y1="87" x2="33" y2="90" stroke="#ff1493" stroke-width="1.4"/>
    <line x1="69" y1="87" x2="79" y2="90" stroke="#ff1493" stroke-width="1.4"/>
    <!-- Ombligo -->
    <ellipse cx="56" cy="95" rx="1.2" ry="1.5" fill="#fbcfe8" stroke="#f472b6" stroke-width="0.8"/>
    <!-- Tanga fino rosa en cadera -->
    <path d="M 32 100 Q 56 103 80 100" stroke="#ff1493" stroke-width="2" fill="none"/>
    <polygon points="50,101 62,101 56,104" fill="#ff1493" stroke="#be185d" stroke-width="0.8"/>
  ` : isPolo ? `
    <!-- Cuello de Polo y botones (Santi) -->
    <path d="M 44 80 L 56 89 L 47 88 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M 68 80 L 56 89 L 65 88 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="56" y1="89" x2="56" y2="99" stroke="#1e293b" stroke-width="1.8"/>
    <circle cx="56" cy="92" r="1.5" fill="#ffffff" stroke="#1e293b" stroke-width="0.8"/>
    <circle cx="56" cy="96" r="1.5" fill="#ffffff" stroke="#1e293b" stroke-width="0.8"/>
  ` : isTracasaRed ? `
    <!-- Camiseta roja de TRACASA (Lerga Default) -->
    <path d="M 45 80 Q 56 84 67 80" stroke="#991b1b" stroke-width="2.2" fill="none"/>
    <rect x="41" y="87" width="30" height="10" rx="1.5" fill="#991b1b" opacity="0.6"/>
    <text x="56" y="94.5" font-family="'Arial Black', 'Impact', sans-serif" font-size="4.2" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="0.6">TRACASA</text>
    <line x1="43" y1="96" x2="69" y2="96" stroke="#facc15" stroke-width="1.1"/>
  ` : isBikerLeather ? `
    <!-- Chupa de cuero motera abierta con camiseta roja de TRACASA debajo (Lerga) -->
    <polygon points="50,80 62,80 63,104 49,104" fill="#dc2626"/>
    <text x="56" y="93" font-family="'Arial Black', 'Impact', sans-serif" font-size="2.9" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="0.2">TRACASA</text>
    <line x1="51" y1="95" x2="61" y2="95" stroke="#facc15" stroke-width="0.8"/>
    <!-- Solapas de cuero negro abiertas con tachuelas plateadas y cremalleras -->
    <polygon points="44,80 51,80 49,97 42,92" fill="#27272a" stroke="#09090b" stroke-width="1.2"/>
    <polygon points="68,80 61,80 63,97 70,92" fill="#27272a" stroke="#09090b" stroke-width="1.2"/>
    <line x1="50" y1="80" x2="48" y2="104" stroke="#cbd5e1" stroke-width="1.8"/>
    <line x1="62" y1="80" x2="64" y2="104" stroke="#cbd5e1" stroke-width="1.8"/>
    <circle cx="46" cy="86" r="1.1" fill="#f8fafc"/>
    <circle cx="66" cy="86" r="1.1" fill="#f8fafc"/>
    <rect x="42" y="100" width="28" height="3" fill="#09090b"/>
  ` : isGraphicTee ? `
    <!-- Estampado gráfico urbano / rockero en camiseta negra (Adriachi) -->
    <path d="M 46 80 Q 56 84 66 80" stroke="#27272a" stroke-width="2.2" fill="none"/>
    <circle cx="56" cy="93" r="7.5" fill="#dc2626" opacity="0.95"/>
    <path d="M 51 92 L 56 87 L 54 92 L 61 92 L 53 98 L 55 93 Z" fill="#ffffff"/>
    <text x="56" y="101" font-family="'Impact', 'Arial Black', sans-serif" font-size="4.2" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="0.4">ZERO</text>
  ` : isPlainBlackTee ? `
    <!-- Cuello redondo de camiseta negra lisa de Adriachi -->
    <path d="M 45 80 Q 56 85 67 80" stroke="#27272a" stroke-width="2.4" fill="none"/>
    <circle cx="48" cy="94" r="1.5" fill="#27272a"/>
  ` : `
    <!-- Cremallera central de sudadera -->
    <line x1="56" y1="80" x2="56" y2="103" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 2"/>
  `;

  // Height & Body Build logic (Manu/Santi altos, Adriachi robusto con hombros cuadrados)
  const isTall = c.height === 'tall';
  const isChubby = c.height === 'chubby';
  let bodyScaleTransform = '';
  if (isTall) {
    bodyScaleTransform = 'transform="scale(0.96, 1.07) translate(2.2, -4)"';
  } else if (isChubby) {
    bodyScaleTransform = 'transform="scale(1.04, 0.99) translate(-2.2, 0.8)"';
  }

  // Shoes SVG generator (Nike Air Jordan 1 Chicago Blancas y Rojas de Adriachi u otros calzados)
  const isAirJordanComic = c.shoes === 'air_jordan_comic';
  const isAirJordanNormal = c.shoes === 'air_jordan';
  let shoesSvg = '';
  let airJordansOverlay = '';

  if (isAirJordanComic) {
    airJordansOverlay = `
      <!-- Nike Air Jordan 1 Chicago CÓMICAMENTE GRANDES superpuestas sobre la ropa de Adriachi -->
      <g class="avatar-feet avatar-air-jordans-comic" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.45));">
        <!-- Zapatilla Izquierda Gigante -->
        <g class="avatar-foot-left" style="transform-origin: 38px 105px;">
          <!-- Sombra bajo la zapa -->
          <ellipse cx="37" cy="111" rx="16" ry="4" fill="#000000" opacity="0.38"/>
          <!-- Suela exterior roja gruesa -->
          <path d="M 21 111 Q 38 113.5 55 111 L 55 107.5 Q 38 109 21 107.5 Z" fill="#dc2626" stroke="#991b1b" stroke-width="0.9"/>
          <!-- Media suela blanca gruesa estilo Jordan -->
          <rect x="21" y="103" width="34" height="5" rx="1.5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.3"/>
          <!-- Puntera / Upper blanco -->
          <path d="M 22 103 L 23 96 Q 32 94.5 41 98 L 41 103 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.1"/>
          <!-- Mudguard / Guardabarros rojo brillante -->
          <path d="M 21 103 L 22 98 Q 28 96 34 99.5 L 33 103 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1.1"/>
          <!-- Caña Alta High-Top (Tobillera que sube cómicamente por encima del pantalón hasta y:79) -->
          <path d="M 37 103 L 37 79 Q 47 77 55 83 L 54 103 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1.4"/>
          <path d="M 39 85 L 39 79 Q 47 77 53 83 L 51 86 Z" fill="#09090b"/>
          <!-- Panel lateral blanco del empeine -->
          <path d="M 36 103 L 37 91 L 49 91 L 52 103 Z" fill="#ffffff"/>
          <!-- Lengüeta alta con logo Nike Air rojo -->
          <path d="M 32 93 L 34 78 L 43 78 L 41 93 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
          <rect x="35" y="77" width="7" height="3.5" rx="0.5" fill="#dc2626"/>
          <!-- Cordones negros cruzados -->
          <line x1="33" y1="95" x2="40" y2="93" stroke="#09090b" stroke-width="1.5"/>
          <line x1="34" y1="90" x2="41" y2="88" stroke="#09090b" stroke-width="1.5"/>
          <line x1="35" y1="85" x2="42" y2="83" stroke="#09090b" stroke-width="1.5"/>
          <!-- Nike Swoosh negro icónico curvado -->
          <path d="M 36 97 Q 44 101 54 90 Q 48 95 40 96 Z" fill="#09090b"/>
        </g>
        <!-- Zapatilla Derecha Gigante -->
        <g class="avatar-foot-right" style="transform-origin: 74px 105px;">
          <!-- Sombra bajo la zapa -->
          <ellipse cx="75" cy="111" rx="16" ry="4" fill="#000000" opacity="0.38"/>
          <!-- Suela exterior roja gruesa -->
          <path d="M 57 111 Q 74 113.5 91 111 L 91 107.5 Q 74 109 57 107.5 Z" fill="#dc2626" stroke="#991b1b" stroke-width="0.9"/>
          <!-- Media suela blanca gruesa estilo Jordan -->
          <rect x="57" y="103" width="34" height="5" rx="1.5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.3"/>
          <!-- Puntera / Upper blanco -->
          <path d="M 71 103 L 71 98 Q 80 94.5 89 96 L 90 103 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.1"/>
          <!-- Mudguard / Guardabarros rojo brillante -->
          <path d="M 78 103 L 78 99.5 Q 84 96 90 98 L 91 103 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1.1"/>
          <!-- Caña Alta High-Top (Tobillera que sube cómicamente por encima del pantalón hasta y:79) -->
          <path d="M 58 103 L 57 83 Q 65 77 75 79 L 75 103 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1.4"/>
          <path d="M 59 86 L 59 83 Q 65 77 73 79 L 73 85 Z" fill="#09090b"/>
          <!-- Panel lateral blanco del empeine -->
          <path d="M 60 103 L 63 91 L 75 91 L 76 103 Z" fill="#ffffff"/>
          <!-- Lengüeta alta con logo Nike Air rojo -->
          <path d="M 71 93 L 69 78 L 78 78 L 80 93 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
          <rect x="70" y="77" width="7" height="3.5" rx="0.5" fill="#dc2626"/>
          <!-- Cordones negros cruzados -->
          <line x1="72" y1="93" x2="79" y2="95" stroke="#09090b" stroke-width="1.5"/>
          <line x1="71" y1="88" x2="78" y2="90" stroke="#09090b" stroke-width="1.5"/>
          <line x1="70" y1="83" x2="77" y2="85" stroke="#09090b" stroke-width="1.5"/>
          <!-- Nike Swoosh negro icónico curvado -->
          <path d="M 76 97 Q 68 101 58 90 Q 64 95 72 96 Z" fill="#09090b"/>
        </g>
      </g>
    `;
  } else if (isAirJordanNormal) {
    shoesSvg = `
      <!-- Nike Air Jordan 1 Chicago Grandes Estándar (Left Foot) -->
      <g class="avatar-foot-left" style="transform-origin: 40px 105px;">
        <ellipse cx="40" cy="107" rx="11" ry="3.8" fill="#000000" opacity="0.32"/>
        <path d="M 28 107 Q 40 109 52 107 L 52 104 Q 40 105 28 104 Z" fill="#dc2626"/>
        <rect x="28" y="102" width="24" height="3.5" rx="1" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
        <path d="M 29 102 L 30 96 Q 38 95 46 97 L 50 100 L 51 102 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1"/>
        <path d="M 30 102 L 31 98 Q 37 98 40 102 Z" fill="#ffffff"/>
        <path d="M 40 98 Q 45 101 49 97 Q 45 99 41 99.5 Z" fill="#09090b"/>
        <line x1="35" y1="97" x2="40" y2="98" stroke="#09090b" stroke-width="1.2"/>
      </g>
      <!-- Nike Air Jordan 1 Chicago Grandes Estándar (Right Foot) -->
      <g class="avatar-foot-right" style="transform-origin: 72px 105px;">
        <ellipse cx="72" cy="107" rx="11" ry="3.8" fill="#000000" opacity="0.32"/>
        <path d="M 60 107 Q 72 109 84 107 L 84 104 Q 72 105 60 104 Z" fill="#dc2626"/>
        <rect x="60" y="102" width="24" height="3.5" rx="1" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
        <path d="M 61 102 L 62 96 Q 70 95 78 97 L 82 100 L 83 102 Z" fill="#dc2626" stroke="#1e293b" stroke-width="1"/>
        <path d="M 62 102 L 63 98 Q 69 98 72 102 Z" fill="#ffffff"/>
        <path d="M 72 98 Q 77 101 81 97 Q 77 99 73 99.5 Z" fill="#09090b"/>
        <line x1="67" y1="97" x2="72" y2="98" stroke="#09090b" stroke-width="1.2"/>
      </g>
    `;
  } else if (c.shoes === 'white_sneakers') {
    shoesSvg = `
      <g class="avatar-foot-left" style="transform-origin: 42px 105px;">
        <ellipse cx="42" cy="106" rx="9" ry="3.5" fill="#000000" opacity="0.25"/>
        <path d="M 33 105 Q 42 107 50 105 L 50 100 Q 42 98 33 101 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
        <line x1="33" y1="104" x2="50" y2="104" stroke="#cbd5e1" stroke-width="1.5"/>
      </g>
      <g class="avatar-foot-right" style="transform-origin: 70px 105px;">
        <ellipse cx="70" cy="106" rx="9" ry="3.5" fill="#000000" opacity="0.25"/>
        <path d="M 62 105 Q 70 107 79 105 L 79 100 Q 70 98 62 101 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
        <line x1="62" y1="104" x2="79" y2="104" stroke="#cbd5e1" stroke-width="1.5"/>
      </g>
    `;
  } else if (c.shoes === 'boots') {
    shoesSvg = `
      <g class="avatar-foot-left" style="transform-origin: 42px 105px;">
        <ellipse cx="42" cy="106" rx="9" ry="3.5" fill="#000000" opacity="0.25"/>
        <path d="M 33 106 Q 42 108 50 106 L 50 99 L 33 100 Z" fill="#78350f" stroke="#451a03" stroke-width="1.2"/>
        <rect x="33" y="104" width="17" height="2.5" fill="#1e293b"/>
      </g>
      <g class="avatar-foot-right" style="transform-origin: 70px 105px;">
        <ellipse cx="70" cy="106" rx="9" ry="3.5" fill="#000000" opacity="0.25"/>
        <path d="M 62 106 Q 70 108 79 106 L 79 99 L 62 100 Z" fill="#78350f" stroke="#451a03" stroke-width="1.2"/>
        <rect x="62" y="104" width="17" height="2.5" fill="#1e293b"/>
      </g>
    `;
  } else {
    // Clásico oscuro
    shoesSvg = `
      <ellipse class="avatar-foot-left" cx="42" cy="105" rx="8.5" ry="5" fill="#0f172a"/>
      <ellipse class="avatar-foot-right" cx="70" cy="105" rx="8.5" ry="5" fill="#0f172a"/>
    `;
  }

  // Torso & Hands positions for normal vs sturdy/Buford
  const bodyTorsoPath = isChubby
    ? `M 27 77 C 21 86, 21 103, 30 105 L 82 105 C 91 103, 91 86, 85 77 Z`
    : `M 32 80 C 26 88, 24 102, 34 104 L 78 104 C 88 102, 86 88, 80 80 Z`;

  const handLeftCx = isChubby ? 24 : 28;
  const handRightCx = isChubby ? 88 : 84;
  const handRadius = isChubby ? 7.5 : 7;

  // Hand-Held Objects logic (Mandarina, Móvil TikTok, Eneryeti, sldcsar)
  let handItemSvg = '';
  switch (c.handItem) {
    case 'peruanita':
      handItemSvg = `
        <!-- Mini amuleto Peruanita en mano -->
        <g class="hand-item hand-item-peruanita" transform="translate(${handRightCx - 10}, 76) scale(0.48)">
          <polygon points="32,32 16,51 48,51" fill="#dc2626" stroke="#991b1b" stroke-width="1.6"/>
          <path d="M 19 44 L 45 44" stroke="#facc15" stroke-width="2"/>
          <circle cx="32" cy="27" r="12" fill="#fed7aa" stroke="#1e293b" stroke-width="1.8"/>
          <circle cx="27" cy="27" r="2.2" fill="#18181b"/>
          <circle cx="37" cy="27" r="2.2" fill="#18181b"/>
          <path d="M 30 30 Q 32 32 34 30" stroke="#1e293b" stroke-width="1.3" fill="none" stroke-linecap="round"/>
          <path d="M 19 23 C 19 8, 45 8, 45 23 Z" fill="#e11d48" stroke="#9f1239" stroke-width="1.6"/>
          <rect x="20" y="19" width="24" height="4" fill="#0284c7"/>
          <circle cx="32" cy="8" r="4.2" fill="#facc15"/>
        </g>
      `;
      break;
    case 'mandarina':
      handItemSvg = `
        <!-- Mandarina fresca pelada en la mano (Manu) -->
        <g class="hand-item hand-item-mandarina" transform="translate(${handRightCx - 3}, 85)">
          <circle cx="8" cy="8" r="7.5" fill="#f97316" stroke="#c2410c" stroke-width="1.4"/>
          <path d="M 5 4 Q 8 2 11 4 L 8 8 Z" fill="#fed7aa"/>
          <ellipse cx="8" cy="1.5" rx="3" ry="1.5" fill="#22c55e" transform="rotate(-25, 8, 1.5)"/>
          <circle cx="6" cy="6" r="1" fill="#ffffff" opacity="0.6"/>
        </g>
      `;
      break;
    case 'movil_tiktok':
      handItemSvg = `
        <!-- Smartphone con TikTok a toda pantalla (Asier/Marta - Ipadkid) -->
        <g class="hand-item hand-item-tiktok" transform="translate(${handRightCx - 6}, 74)">
          <rect x="0" y="0" width="16" height="26" rx="3" fill="#09090b" stroke="#334155" stroke-width="1.4"/>
          <rect x="1.5" y="2" width="13" height="22" rx="1.5" fill="#000000"/>
          <g transform="translate(3.5, 6) scale(0.68)">
            <path d="M 5 2 L 8 2 C 8 4, 10 5, 12 5 L 12 7 C 10 7, 8 6, 7 5 L 7 11 C 7 13.5, 4.5 15, 2.5 13.5 C 1 12, 1.5 9.5, 3.5 9 L 3.5 11 C 2.5 11.2, 2.5 12.5, 3.5 12.8 C 5 13, 5.5 11.8, 5.5 11 Z" fill="#06b6d4"/>
            <path d="M 5.8 2 L 8.8 2 C 8.8 4, 10.8 5, 12.8 5 L 12.8 7 C 10.8 7, 8.8 6, 7.8 5 L 7.8 11 C 7.8 13.5, 5.3 15, 3.3 13.5 C 1.8 12, 2.3 9.5, 4.3 9 L 4.3 11 C 3.3 11.2, 3.3 12.5, 4.3 12.8 C 5.8 13, 6.3 11.8, 6.3 11 Z" fill="#f43f5e" opacity="0.85"/>
          </g>
          <line x1="2" y1="22" x2="9" y2="22" stroke="#f43f5e" stroke-width="1.2"/>
        </g>
      `;
      break;
    case 'eneryeti':
      handItemSvg = `
        <!-- Lata de bebida energética Eneryeti (Asier) -->
        <g class="hand-item hand-item-eneryeti" transform="translate(${handRightCx - 4}, 76)">
          <rect x="0" y="3" width="13" height="23" rx="2.5" fill="#0284c7" stroke="#0369a1" stroke-width="1.2"/>
          <ellipse cx="6.5" cy="3" rx="6.5" ry="2" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8"/>
          <ellipse cx="6.5" cy="26" rx="6.5" ry="2" fill="#0369a1"/>
          <polygon points="6,6 3,13 6.5,13 4.5,20 10,12 6.5,12" fill="#facc15" stroke="#ca8a04" stroke-width="0.6"/>
          <text x="6.5" y="24" font-family="'Impact', sans-serif" font-size="3.5" text-anchor="middle" fill="#ffffff" letter-spacing="0.3">YETI</text>
        </g>
      `;
      break;
    case 'sldcsar':
      handItemSvg = `
        <!-- Bol de Ensalada César sldcsar (DJon) -->
        <g class="hand-item hand-item-sldcsar" transform="translate(${handRightCx - 8}, 82)">
          <path d="M 1 5 C 1 18, 21 18, 21 5 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.4"/>
          <ellipse cx="11" cy="5" rx="9.5" ry="3.5" fill="#22c55e"/>
          <circle cx="5" cy="4" r="2.5" fill="#4ade80"/>
          <circle cx="16" cy="4" r="2.5" fill="#4ade80"/>
          <rect x="6" y="3" width="2.8" height="2.8" fill="#d97706" rx="0.5"/>
          <rect x="13" y="3.5" width="2.8" height="2.8" fill="#d97706" rx="0.5"/>
          <ellipse cx="11" cy="4.5" rx="4" ry="1.2" fill="#fef08a"/>
          <path d="M 4 5 Q 11 3 18 5" stroke="#ffffff" stroke-width="1.4" fill="none" opacity="0.9"/>
          <text x="11" y="13" font-family="'Courier New', monospace" font-size="3.5" font-weight="900" text-anchor="middle" fill="#0f172a">sldcsar</text>
        </g>
      `;
      break;
    case 'teclado_gaming':
      handItemSvg = `
        <!-- Teclado Mecánico Gaming RGB con teclas retroiluminadas (Yago) -->
        <g class="hand-item hand-item-keyboard" transform="translate(${handRightCx - 8}, 75)">
          <rect x="0" y="3" width="22" height="15" rx="2" fill="#09090b" stroke="#38bdf8" stroke-width="1.2"/>
          <rect x="2" y="5" width="3" height="2" rx="0.5" fill="#f43f5e"/>
          <rect x="6" y="5" width="3" height="2" rx="0.5" fill="#fbbf24"/>
          <rect x="10" y="5" width="3" height="2" rx="0.5" fill="#4ade80"/>
          <rect x="14" y="5" width="3" height="2" rx="0.5" fill="#38bdf8"/>
          <rect x="18" y="5" width="2" height="2" rx="0.5" fill="#a855f7"/>
          <rect x="2" y="8" width="3" height="2" rx="0.5" fill="#f43f5e"/>
          <rect x="6" y="8" width="3" height="2" rx="0.5" fill="#fbbf24"/>
          <rect x="10" y="8" width="3" height="2" rx="0.5" fill="#4ade80"/>
          <rect x="14" y="8" width="3" height="2" rx="0.5" fill="#38bdf8"/>
          <rect x="18" y="8" width="2" height="2" rx="0.5" fill="#a855f7"/>
          <rect x="5" y="11" width="10" height="2" rx="0.5" fill="#38bdf8"/>
          <rect x="16" y="11" width="3" height="2" rx="0.5" fill="#a855f7"/>
          <path d="M 11 3 Q 11 -2 16 -1" stroke="#38bdf8" stroke-width="1" fill="none"/>
        </g>
      `;
      break;
    case 'none':
    default:
      break;
  }

  // Head shape logic (Buford Van Stomm square jaw vs Round Chibi)
  const isSquareHead = c.headShape === 'square';
  const headSvg = isSquareHead ? `
    <!-- Cabeza cuadrada estilo Buford Van Stomm (Adriachi) -->
    <path d="M 23 36 C 23 22, 89 22, 89 36 L 89 68 C 89 79, 78 84, 56 84 C 34 84, 23 79, 23 68 Z" fill="${c.skin}" stroke="#1e293b" stroke-width="2.6"/>
    <line x1="51" y1="80" x2="61" y2="80" stroke="#1e293b" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <circle cx="31" cy="63" r="5.5" fill="#f43f5e" opacity="0.25"/>
    <circle cx="81" cy="63" r="5.5" fill="#f43f5e" opacity="0.25"/>
  ` : `
    <!-- Cabeza redonda clásica South Park / Chibi -->
    <ellipse cx="56" cy="54" rx="34" ry="32" fill="${c.skin}" stroke="#1e293b" stroke-width="2.5"/>
    <circle cx="34" cy="62" r="5" fill="#f43f5e" opacity="0.25"/>
    <circle cx="78" cy="62" r="5" fill="#f43f5e" opacity="0.25"/>
  `;

  // Abrigo blanco oversize elegante hasta los pies (Markel)
  const isWhiteLongCoat = c.accessory === 'white_long_coat';
  const coatSvg = isWhiteLongCoat ? `
    <!-- Abrigo blanco oversize elegante hasta los pies (Markel) -->
    <!-- Cuerpo del abrigo largo blanco hasta los pies -->
    <path d="M 30 81 C 24 88, 22 102, 25 107 L 87 107 C 90 102, 88 88, 82 81 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="2.6" stroke-linejoin="round"/>

    <!-- Abertura central en V mostrando camisa negra interior -->
    <polygon points="48,85 56,97 64,85" fill="#09090b" stroke="#1e293b" stroke-width="1.8"/>

    <!-- Solapas elegantes de gabardina coreana -->
    <path d="M 46 86 L 41 93 L 45 94 L 56 98 L 52 86 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M 66 86 L 71 93 L 67 94 L 56 98 L 60 86 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" stroke-linejoin="round"/>

    <!-- Cinturón de abrigo con hebilla moderna -->
    <rect x="27" y="99" width="58" height="3.5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.6"/>
    <rect x="53" y="98" width="6" height="5.5" rx="1" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>

    <!-- Corte vertical inferior y botones oscuros -->
    <line x1="56" y1="102.5" x2="56" y2="107" stroke="#cbd5e1" stroke-width="1.8"/>
    <circle cx="56" cy="105" r="1.4" fill="#09090b"/>

    <!-- Botones dobles superiores en el pecho -->
    <circle cx="48" cy="94" r="1.4" fill="#09090b"/>
    <circle cx="64" cy="94" r="1.4" fill="#09090b"/>
  ` : '';

  return `
    <svg viewBox="0 0 112 112" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="avatar-svg ${isTall ? 'is-tall' : ''} ${isChubby ? 'is-chubby' : ''}">
      <!-- Sombra base -->
      <ellipse cx="56" cy="107" rx="${isChubby ? 31 : 28}" ry="4" fill="#000000" opacity="0.22" class="avatar-shadow"/>

      <!-- Contenedor con altura dinámica -->
      <g ${bodyScaleTransform}>
        <!-- Pies / Zapatos animados para correr estilo Mario -->
        <g class="avatar-feet">
          ${!isAirJordanComic ? shoesSvg : ''}
        </g>

        <!-- Cuerpo / Ropa (Sudadera, Polo, Chupa de Cuero o Camiseta Negra) -->
        <g id="body">
          <path d="${bodyTorsoPath}" fill="${shirtColor}" stroke="#1e293b" stroke-width="${isChubby ? 2.8 : 2.5}"/>
          ${poloCollarSvg}
          ${coatSvg}
        </g>

        <!-- Air Jordans CÓMICAMENTE GRANDES renderizadas por encima de la ropa si está activado -->
        ${isAirJordanComic ? airJordansOverlay : ''}

        <!-- Brazos / Manos animadas que bombean al correr -->
        <g class="avatar-arm-left">
          <circle class="avatar-hand-left" cx="${handLeftCx}" cy="94" r="${handRadius}" fill="${c.skin}" stroke="#1e293b" stroke-width="2"/>
        </g>
        <g class="avatar-arm-right">
          <circle class="avatar-hand-right" cx="${handRightCx}" cy="94" r="${handRadius}" fill="${c.skin}" stroke="#1e293b" stroke-width="2"/>
          ${handItemSvg}
        </g>

        <!-- Cabeza con silueta personalizada -->
        <g id="head" class="avatar-head">
          ${headSvg}
        </g>

        <!-- Pelo -->
        <g id="hair">${hairSvg}</g>

        <!-- Ojos -->
        <g id="eyes">${eyesSvg}</g>

        <!-- Boca -->
        <g id="mouth">${mouthSvg}</g>

        <!-- Accesorios -->
        <g id="accessories">${accSvg}</g>
      </g>
    </svg>
  `;
}

/**
 * PET ENGINE - Generador SVG de Mascotas de la Cuadrilla
 * 1. Bembo: Caniche mediano naranja
 * 2. Hunter: Perro de agua mediano peludito blanco y negro
 * 3. Tusa: Gatita de manchas blancas y negras
 * 4. Cat: Gatita negra entera
 * 5. Bichi: Perrita golden retriever
 */
function renderPetSVG(petId = 'none', size = 48) {
  if (!petId || petId === 'none') return '';

  let petContent = '';
  switch (petId) {
    case 'bembo':
      // Caniche mediano naranja risueño
      petContent = `
        <!-- Sombra suelo -->
        <ellipse cx="32" cy="58" rx="18" ry="4.5" fill="#000000" opacity="0.25" class="pet-shadow"/>
        
        <!-- Cola con pompón esponjoso naranja -->
        <g class="pet-tail-anim" style="transform-origin: 18px 42px;">
          <path d="M 18 42 Q 10 32 12 24" stroke="#ea580c" stroke-width="4.5" fill="none" stroke-linecap="round"/>
          <circle cx="12" cy="22" r="7" fill="#fb923c" stroke="#c2410c" stroke-width="2"/>
          <circle cx="10" cy="20" r="4" fill="#fed7aa"/>
        </g>

        <!-- Patitas de caniche con puños rizados -->
        <g class="pet-paws">
          <ellipse cx="20" cy="54" rx="5.5" ry="4" fill="#f97316" stroke="#c2410c" stroke-width="1.8"/>
          <ellipse cx="28" cy="55" rx="5.5" ry="4" fill="#f97316" stroke="#c2410c" stroke-width="1.8"/>
          <ellipse cx="38" cy="55" rx="5.5" ry="4" fill="#f97316" stroke="#c2410c" stroke-width="1.8"/>
          <ellipse cx="46" cy="54" rx="5.5" ry="4" fill="#f97316" stroke="#c2410c" stroke-width="1.8"/>
        </g>

        <!-- Cuerpo esponjoso naranja de caniche -->
        <path d="M 18 42 C 16 34, 26 30, 36 32 C 46 34, 50 42, 46 50 C 42 54, 22 54, 18 42 Z" fill="#f97316" stroke="#c2410c" stroke-width="2.2"/>
        <circle cx="38" cy="40" r="9" fill="#fb923c" stroke="#c2410c" stroke-width="1.6"/>
        <circle cx="34" cy="42" r="6" fill="#fed7aa"/>

        <!-- Orejas largas caídas de caniche con pompón rizado -->
        <g class="pet-ears-anim" style="transform-origin: 38px 24px;">
          <path d="M 27 24 C 20 24, 18 36, 23 41 C 26 43, 29 36, 29 26 Z" fill="#ea580c" stroke="#9a3412" stroke-width="2"/>
          <circle cx="23" cy="38" r="4.5" fill="#f97316"/>
          <path d="M 49 24 C 56 24, 58 36, 53 41 C 50 43, 47 36, 47 26 Z" fill="#ea580c" stroke="#9a3412" stroke-width="2"/>
          <circle cx="53" cy="38" r="4.5" fill="#f97316"/>
        </g>

        <!-- Cabeza redondeada -->
        <circle cx="38" cy="26" r="13" fill="#f97316" stroke="#c2410c" stroke-width="2.2"/>
        
        <!-- Tupé / Moño esponjoso rizado de caniche -->
        <circle cx="38" cy="15" r="7.5" fill="#fb923c" stroke="#c2410c" stroke-width="2"/>
        <circle cx="33" cy="17" r="5" fill="#fed7aa"/>
        <circle cx="43" cy="17" r="5" fill="#fed7aa"/>

        <!-- Hocico de caniche -->
        <ellipse cx="38" cy="30" rx="7.5" ry="5.5" fill="#fed7aa"/>
        <ellipse cx="38" cy="27.5" rx="2.8" ry="2.2" fill="#1e293b"/>
        
        <!-- Ojos negros con brillo travieso -->
        <circle cx="33" cy="24" r="2.8" fill="#1e293b"/>
        <circle cx="32" cy="23" r="1.2" fill="#ffffff"/>
        <circle cx="43" cy="24" r="2.8" fill="#1e293b"/>
        <circle cx="42" cy="23" r="1.2" fill="#ffffff"/>
        
        <!-- Lengüecita alegre de Bembo -->
        <path d="M 37 32 Q 38 37 39 32" stroke="#f43f5e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      `;
      break;

    case 'hunter':
      // Perro de agua mediano peludito blanco y negro
      petContent = `
        <ellipse cx="32" cy="58" rx="18" ry="4.5" fill="#000000" opacity="0.25" class="pet-shadow"/>
        
        <!-- Cola alegre peluda y corta -->
        <g class="pet-tail-anim" style="transform-origin: 16px 42px;">
          <path d="M 16 42 Q 10 34 13 28" stroke="#1e293b" stroke-width="5" fill="none" stroke-linecap="round"/>
          <circle cx="13" cy="27" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
        </g>

        <!-- Patitas lanudas blancas y negras -->
        <g class="pet-paws">
          <ellipse cx="20" cy="54" rx="5.5" ry="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="28" cy="55" rx="5.5" ry="4" fill="#0f172a" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="38" cy="55" rx="5.5" ry="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="46" cy="54" rx="5.5" ry="4" fill="#0f172a" stroke="#1e293b" stroke-width="1.8"/>
        </g>

        <!-- Cuerpo de perro de agua lanudo (blanco con gran mancha negra) -->
        <path d="M 18 42 C 16 34, 26 30, 36 32 C 46 34, 50 42, 46 50 C 42 54, 22 54, 18 42 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2.2"/>
        <path d="M 22 36 C 26 31, 35 32, 37 38 C 34 45, 23 45, 22 36 Z" fill="#0f172a"/>
        <circle cx="28" cy="46" r="4" fill="#e2e8f0"/>
        <circle cx="34" cy="44" r="4.5" fill="#cbd5e1"/>
        <circle cx="43" cy="42" r="5" fill="#e2e8f0"/>

        <!-- Orejas caídas y peludas (una negra, una blanca) -->
        <g class="pet-ears-anim" style="transform-origin: 38px 24px;">
          <path d="M 26 24 C 19 24, 17 37, 22 41 C 25 43, 28 36, 28 26 Z" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
          <path d="M 49 24 C 56 24, 58 37, 53 41 C 50 43, 47 36, 47 26 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
        </g>

        <!-- Cabeza con pelo rizado lanudo -->
        <circle cx="38" cy="27" r="13" fill="#ffffff" stroke="#1e293b" stroke-width="2.2"/>
        <path d="M 29 20 C 36 17, 39 25, 34 30 C 29 32, 27 25, 29 20 Z" fill="#0f172a"/>
        
        <!-- Flequillo rizado de perro de agua -->
        <circle cx="34" cy="17" r="5" fill="#0f172a"/>
        <circle cx="40" cy="16" r="6" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
        <circle cx="45" cy="18" r="4.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>

        <!-- Hocico ancho lanudo -->
        <ellipse cx="38" cy="32" rx="7.5" ry="5.5" fill="#f1f5f9"/>
        <ellipse cx="38" cy="29.5" rx="3.2" ry="2.4" fill="#0f172a"/>
        
        <!-- Ojos vivarachos -->
        <circle cx="33" cy="24" r="2.8" fill="#ffffff"/>
        <circle cx="33" cy="24" r="2" fill="#0f172a"/>
        <circle cx="43" cy="24" r="2.8" fill="#0f172a"/>
        <circle cx="42" cy="23" r="1.2" fill="#ffffff"/>
        
        <!-- Sonrisa amigable -->
        <path d="M 35 34 Q 38 37 41 34" stroke="#1e293b" stroke-width="1.8" fill="none"/>
      `;
      break;

    case 'tusa':
      // Gatita de manchas blancas y negras
      petContent = `
        <ellipse cx="32" cy="58" rx="16" ry="4" fill="#000000" opacity="0.25" class="pet-shadow"/>
        
        <!-- Cola erguida con punta curvada juguetona -->
        <g class="pet-tail-anim" style="transform-origin: 18px 48px;">
          <path d="M 18 48 C 10 46, 8 32, 14 23 C 18 19, 23 21, 19 27" stroke="#1e293b" stroke-width="3.8" fill="none" stroke-linecap="round"/>
          <circle cx="16" cy="22" r="2.8" fill="#ffffff"/>
        </g>

        <!-- Patitas de gatita blancas -->
        <g class="pet-paws">
          <ellipse cx="22" cy="55" rx="4.5" ry="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="30" cy="56" rx="4.5" ry="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="38" cy="56" rx="4.5" ry="3.5" fill="#1e293b" stroke="#1e293b" stroke-width="1.8"/>
          <ellipse cx="45" cy="55" rx="4.5" ry="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.8"/>
        </g>

        <!-- Cuerpo estilizado blanco con manchas tipo vaquita -->
        <path d="M 20 44 C 18 36, 26 34, 34 35 C 44 36, 48 44, 46 51 C 42 55, 24 55, 20 44 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2.2"/>
        <path d="M 23 38 C 28 34, 36 36, 38 42 C 34 47, 24 47, 23 38 Z" fill="#0f172a"/>
        <circle cx="44" cy="46" r="3.5" fill="#0f172a"/>

        <!-- Orejitas triangulares puntiagudas (una negra y una blanca) -->
        <g class="pet-ears-anim" style="transform-origin: 38px 24px;">
          <polygon points="26,24 23,11 33,18" fill="#0f172a" stroke="#0f172a" stroke-width="2"/>
          <polygon points="26,22 25,14 31,18" fill="#f472b6"/>
          <polygon points="44,18 54,11 50,24" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
          <polygon points="46,18 52,14 49,22" fill="#f472b6"/>
        </g>

        <!-- Cabeza de gatita -->
        <circle cx="38" cy="28" r="12" fill="#ffffff" stroke="#1e293b" stroke-width="2.2"/>
        <path d="M 28 20 C 35 18, 36 26, 30 29 Z" fill="#0f172a"/>

        <!-- Ojos de gata verde esmeralda con pupilas felinas -->
        <ellipse cx="33" cy="26" rx="3.6" ry="4.2" fill="#10b981"/>
        <ellipse cx="33" cy="26" rx="1.5" ry="3.6" fill="#064e3b"/>
        <circle cx="32" cy="24.5" r="1.2" fill="#ffffff"/>
        <ellipse cx="43" cy="26" rx="3.6" ry="4.2" fill="#10b981"/>
        <ellipse cx="43" cy="26" rx="1.5" ry="3.6" fill="#064e3b"/>
        <circle cx="42" cy="24.5" r="1.2" fill="#ffffff"/>

        <!-- Nariz rosa y boca en W -->
        <polygon points="38,30.5 36.5,29 39.5,29" fill="#f472b6"/>
        <path d="M 36 32 Q 38 33.5 38 31 Q 38 33.5 40 32" stroke="#1e293b" stroke-width="1.4" fill="none"/>
        
        <!-- Bigotitos -->
        <line x1="25" y1="30" x2="18" y2="28" stroke="#1e293b" stroke-width="1.2"/>
        <line x1="25" y1="32" x2="17" y2="33" stroke="#1e293b" stroke-width="1.2"/>
        <line x1="51" y1="30" x2="58" y2="28" stroke="#1e293b" stroke-width="1.2"/>
        <line x1="51" y1="32" x2="59" y2="33" stroke="#1e293b" stroke-width="1.2"/>
      `;
      break;

    case 'cat':
      // Gatita llamada "cat" que es negra entera
      petContent = `
        <ellipse cx="32" cy="58" rx="16" ry="4" fill="#000000" opacity="0.3" class="pet-shadow"/>
        
        <!-- Cola negra con movimiento elegante -->
        <g class="pet-tail-anim" style="transform-origin: 18px 48px;">
          <path d="M 18 48 C 10 46, 8 30, 14 22 C 18 18, 22 20, 19 25" stroke="#18181b" stroke-width="3.8" fill="none" stroke-linecap="round"/>
        </g>

        <!-- Patitas negras azabache -->
        <g class="pet-paws">
          <ellipse cx="22" cy="55" rx="4.5" ry="3.5" fill="#18181b" stroke="#27272a" stroke-width="1.6"/>
          <ellipse cx="30" cy="56" rx="4.5" ry="3.5" fill="#18181b" stroke="#27272a" stroke-width="1.6"/>
          <ellipse cx="38" cy="56" rx="4.5" ry="3.5" fill="#18181b" stroke="#27272a" stroke-width="1.6"/>
          <ellipse cx="45" cy="55" rx="4.5" ry="3.5" fill="#18181b" stroke="#27272a" stroke-width="1.6"/>
        </g>

        <!-- Cuerpo felino negro azabache -->
        <path d="M 20 44 C 18 36, 26 34, 34 35 C 44 36, 48 44, 46 51 C 42 55, 24 55, 20 44 Z" fill="#18181b" stroke="#27272a" stroke-width="2.2"/>
        
        <!-- Orejitas triangulares negras puntiagudas -->
        <g class="pet-ears-anim" style="transform-origin: 38px 24px;">
          <polygon points="26,24 23,10 33,18" fill="#18181b" stroke="#27272a" stroke-width="1.8"/>
          <polygon points="26,22 25,13 31,18" fill="#701a75" opacity="0.65"/>
          <polygon points="44,18 54,10 50,24" fill="#18181b" stroke="#27272a" stroke-width="1.8"/>
          <polygon points="46,18 52,13 49,22" fill="#701a75" opacity="0.65"/>
        </g>

        <!-- Cabeza de gatita negra -->
        <circle cx="38" cy="28" r="12" fill="#18181b" stroke="#27272a" stroke-width="2.2"/>

        <!-- Ojos dorados radiantes de Cat (resaltan intensamente sobre el negro) -->
        <ellipse cx="33" cy="26" rx="4" ry="4.4" fill="#facc15"/>
        <ellipse cx="33" cy="26" rx="1.6" ry="4" fill="#09090b"/>
        <circle cx="32" cy="24.2" r="1.3" fill="#ffffff"/>
        <ellipse cx="43" cy="26" rx="4" ry="4.4" fill="#facc15"/>
        <ellipse cx="43" cy="26" rx="1.6" ry="4" fill="#09090b"/>
        <circle cx="42" cy="24.2" r="1.3" fill="#ffffff"/>

        <!-- Nariz oscura y boquita -->
        <polygon points="38,30.5 36.8,29.2 39.2,29.2" fill="#71717a"/>
        <path d="M 36 32 Q 38 33.5 38 31 Q 38 33.5 40 32" stroke="#71717a" stroke-width="1.2" fill="none"/>
        
        <!-- Bigotitos plateados / claros -->
        <line x1="25" y1="30" x2="16" y2="28" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="25" y1="32" x2="15" y2="33" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="51" y1="30" x2="60" y2="28" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="51" y1="32" x2="61" y2="33" stroke="#cbd5e1" stroke-width="1.2"/>
      `;
      break;

    case 'bichi':
      // Perrita Golden Retriever
      petContent = `
        <ellipse cx="32" cy="58" rx="19" ry="4.5" fill="#000000" opacity="0.25" class="pet-shadow"/>
        
        <!-- Cola dorada suave y plumosa moviéndose feliz -->
        <g class="pet-tail-anim" style="transform-origin: 16px 44px;">
          <path d="M 16 44 Q 6 36 10 26 C 14 24, 16 32, 18 36" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
          <path d="M 11 29 Q 8 36 14 42" stroke="#fef08a" stroke-width="1.8" fill="none"/>
        </g>

        <!-- Patitas doradas de retriever -->
        <g class="pet-paws">
          <ellipse cx="20" cy="54" rx="5.5" ry="4" fill="#fbbf24" stroke="#b45309" stroke-width="1.8"/>
          <ellipse cx="28" cy="55" rx="5.5" ry="4" fill="#fbbf24" stroke="#b45309" stroke-width="1.8"/>
          <ellipse cx="38" cy="55" rx="5.5" ry="4" fill="#fbbf24" stroke="#b45309" stroke-width="1.8"/>
          <ellipse cx="47" cy="54" rx="5.5" ry="4" fill="#fbbf24" stroke="#b45309" stroke-width="1.8"/>
        </g>

        <!-- Cuerpo de Golden dorado suave -->
        <path d="M 18 42 C 16 33, 26 29, 36 31 C 47 33, 52 42, 48 51 C 44 55, 22 55, 18 42 Z" fill="#fbbf24" stroke="#b45309" stroke-width="2.2"/>
        <path d="M 28 36 C 34 32, 42 34, 44 42" stroke="#fef08a" stroke-width="3" fill="none" opacity="0.6"/>

        <!-- Collar rojo coqueto con medalla dorada -->
        <path d="M 32 38 Q 42 43 46 36" stroke="#ef4444" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="41" cy="41" r="3" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>

        <!-- Orejas caídas grandes y dulces de Golden Retriever -->
        <g class="pet-ears-anim" style="transform-origin: 38px 22px;">
          <path d="M 26 22 C 18 22, 17 38, 23 44 C 27 46, 29 38, 28 25 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
          <path d="M 50 22 C 58 22, 59 38, 53 44 C 49 46, 47 38, 48 25 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
        </g>

        <!-- Cabeza de Golden Retriever -->
        <circle cx="38" cy="27" r="13.5" fill="#fbbf24" stroke="#b45309" stroke-width="2.2"/>
        <ellipse cx="38" cy="33" rx="8" ry="6" fill="#fef08a"/>
        <ellipse cx="38" cy="29.5" rx="3.5" ry="2.5" fill="#1e293b"/>

        <!-- Ojos castaños llenos de amor y brillo -->
        <circle cx="32" cy="24" r="3.2" fill="#451a03"/>
        <circle cx="32" cy="24" r="2.2" fill="#1e293b"/>
        <circle cx="31" cy="22.5" r="1.2" fill="#ffffff"/>
        <circle cx="44" cy="24" r="3.2" fill="#451a03"/>
        <circle cx="44" cy="24" r="2.2" fill="#1e293b"/>
        <circle cx="43" cy="22.5" r="1.2" fill="#ffffff"/>

        <!-- Boca sonriente y lengua rosa feliz jadeando de Bichi -->
        <path d="M 34 33 Q 38 36 42 33" stroke="#1e293b" stroke-width="1.8" fill="none"/>
        <path d="M 36.5 34.5 C 36.5 39.5, 40 39.5, 40 34.5 Z" fill="#f43f5e" stroke="#be123c" stroke-width="1"/>
      `;
      break;

    case 'cocazero':
      // Lata de Coca-Cola Zero helada con gotitas de condensación y carita alegre (Compañero de Adriachi)
      petContent = `
        <!-- Sombra suelo -->
        <ellipse cx="32" cy="58" rx="14" ry="4" fill="#000000" opacity="0.3" class="pet-shadow"/>

        <!-- Patitas de zapatillas que dan botes -->
        <g class="pet-paws">
          <ellipse cx="24" cy="56" rx="5.5" ry="3.2" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
          <rect x="20" y="55" width="8" height="2" rx="0.5" fill="#ffffff"/>
          <ellipse cx="40" cy="56" rx="5.5" ry="3.2" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
          <rect x="36" y="55" width="8" height="2" rx="0.5" fill="#ffffff"/>
        </g>

        <!-- Cuerpo cilíndrico de la lata de Coca-Cola Zero -->
        <g class="pet-can-body">
          <!-- Borde inferior plateado de la lata -->
          <path d="M 20 49 C 20 53, 44 53, 44 49 L 44 46 L 20 46 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
          
          <!-- Cilindro principal negro satinado Zero -->
          <rect x="19" y="19" width="26" height="29" rx="3" fill="#09090b" stroke="#000000" stroke-width="1.8"/>
          
          <!-- Borde plateado superior / bisel de aluminio -->
          <ellipse cx="32" cy="19" rx="13" ry="4.5" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
          <ellipse cx="32" cy="18" rx="11" ry="3.5" fill="#94a3b8"/>
          <!-- Anilla de apertura (pull-tab) -->
          <path d="M 30 17 L 34 17 L 33 15 L 31 15 Z" fill="#f8fafc" stroke="#334155" stroke-width="1"/>
          <circle cx="32" cy="17.5" r="1" fill="#475569"/>

          <!-- Franja dinámica roja Coca-Cola (onda clásica) -->
          <path d="M 19 30 Q 26 25 33 32 Q 40 38 45 33 L 45 38 Q 38 43 31 36 Q 25 30 19 35 Z" fill="#dc2626"/>
          <path d="M 19 34 Q 26 29 33 36 Q 40 42 45 37" stroke="#ffffff" stroke-width="0.9" fill="none" opacity="0.85"/>

          <!-- Tipografía estilizada "zero" en blanco con fuente condensada -->
          <text x="32" y="45.5" font-family="'Impact', 'Arial Black', sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="0.5">zero</text>
          
          <!-- Marca Coca-Cola en cursiva arriba -->
          <text x="32" y="27" font-family="'Georgia', serif" font-style="italic" font-size="5" font-weight="bold" text-anchor="middle" fill="#ffffff" opacity="0.95">Coca-Cola</text>

          <!-- Gotitas de condensación helada y escarcha fría -->
          <circle cx="22" cy="24" r="1.3" fill="#38bdf8" opacity="0.9"/>
          <circle cx="21.5" cy="23.5" r="0.5" fill="#ffffff"/>
          <circle cx="42" cy="27" r="1.4" fill="#38bdf8" opacity="0.85"/>
          <circle cx="41.5" cy="26.5" r="0.6" fill="#ffffff"/>
          <circle cx="22" cy="40" r="1.2" fill="#38bdf8" opacity="0.8"/>
          <circle cx="42" cy="42" r="1.3" fill="#38bdf8" opacity="0.85"/>

          <!-- Ojos kawaii traviesos en la lata -->
          <circle cx="27" cy="31" r="2.4" fill="#ffffff"/>
          <circle cx="27.4" cy="31" r="1.5" fill="#0f172a"/>
          <circle cx="26.8" cy="30.3" r="0.7" fill="#ffffff"/>

          <circle cx="37" cy="31" r="2.4" fill="#ffffff"/>
          <circle cx="36.6" cy="31" r="1.5" fill="#0f172a"/>
          <circle cx="36.2" cy="30.3" r="0.7" fill="#ffffff"/>

          <!-- Sonrisita feliz de la lata helada -->
          <path d="M 30 34.5 Q 32 36.8 34 34.5" stroke="#ffffff" stroke-width="1.3" fill="none" stroke-linecap="round"/>
          <!-- Chofletes sonrosados por el frío polar -->
          <circle cx="24.5" cy="34" r="1.6" fill="#f43f5e" opacity="0.5"/>
          <circle cx="39.5" cy="34" r="1.6" fill="#f43f5e" opacity="0.5"/>
        </g>

        <!-- Burbujas refrescantes y vapor helado que flotan sobre la lata -->
        <g class="pet-tail-anim" style="transform-origin: 32px 14px;">
          <circle cx="34" cy="11" r="1.8" fill="#38bdf8" opacity="0.7"/>
          <circle cx="28" cy="8" r="1.2" fill="#bae6fd" opacity="0.8"/>
          <circle cx="35" cy="5" r="1" fill="#e0f2fe" opacity="0.9"/>
        </g>
      `;
      break;

    case 'peruanita':
      // Hermanita pequeña peruana con chullo andino y sonrisa tierna
      petContent = `
        <!-- Sombra suelo -->
        <ellipse cx="32" cy="58" rx="13" ry="3.8" fill="#000000" opacity="0.25" class="pet-shadow"/>

        <!-- Zapatillitas marrones dando saltitos -->
        <g class="pet-paws">
          <ellipse cx="26" cy="56" rx="4.5" ry="3" fill="#78350f" stroke="#451a03" stroke-width="1.2"/>
          <ellipse cx="38" cy="56" rx="4.5" ry="3" fill="#78350f" stroke="#451a03" stroke-width="1.2"/>
        </g>

        <!-- Poncho andino tradicional con rayas coloridas -->
        <g class="pet-poncho">
          <polygon points="32,32 16,51 48,51" fill="#dc2626" stroke="#991b1b" stroke-width="1.6"/>
          <path d="M 19 44 L 45 44" stroke="#facc15" stroke-width="2"/>
          <path d="M 21 47 L 43 47" stroke="#06b6d4" stroke-width="1.8"/>
          <!-- Flecos del poncho -->
          <line x1="20" y1="51" x2="20" y2="53" stroke="#facc15" stroke-width="1.2"/>
          <line x1="26" y1="51" x2="26" y2="53" stroke="#facc15" stroke-width="1.2"/>
          <line x1="32" y1="51" x2="32" y2="53" stroke="#facc15" stroke-width="1.2"/>
          <line x1="38" y1="51" x2="38" y2="53" stroke="#facc15" stroke-width="1.2"/>
          <line x1="44" y1="51" x2="44" y2="53" stroke="#facc15" stroke-width="1.2"/>
        </g>

        <!-- Manitas asomando -->
        <circle cx="21" cy="46" r="3" fill="#fed7aa" stroke="#991b1b" stroke-width="0.8"/>
        <circle cx="43" cy="46" r="3" fill="#fed7aa" stroke="#991b1b" stroke-width="0.8"/>

        <!-- Trencitas con pompones a los lados que se balancean -->
        <g class="pet-tail-anim" style="transform-origin: 20px 30px;">
          <path d="M 20 28 Q 14 36 17 44" stroke="#18181b" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="17" cy="45" r="3" fill="#ec4899"/>
          <circle cx="16" cy="47" r="2.2" fill="#facc15"/>
        </g>
        <g class="pet-tail-anim" style="transform-origin: 44px 30px;">
          <path d="M 44 28 Q 50 36 47 44" stroke="#18181b" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="47" cy="45" r="3" fill="#ec4899"/>
          <circle cx="48" cy="47" r="2.2" fill="#facc15"/>
        </g>

        <!-- Carita tierna redondita -->
        <circle cx="32" cy="27" r="12" fill="#fed7aa" stroke="#1e293b" stroke-width="1.8"/>
        <path d="M 22 23 Q 32 26 42 23 Q 32 19 22 23 Z" fill="#18181b"/>

        <!-- Ojos brillantes tiernos -->
        <circle cx="27" cy="27" r="2.2" fill="#18181b"/>
        <circle cx="26.4" cy="26.3" r="0.8" fill="#ffffff"/>
        <circle cx="37" cy="27" r="2.2" fill="#18181b"/>
        <circle cx="36.4" cy="26.3" r="0.8" fill="#ffffff"/>

        <!-- Mejillas sonrosadas y dulce sonrisa -->
        <circle cx="24" cy="29.5" r="2" fill="#f43f5e" opacity="0.45"/>
        <circle cx="40" cy="29.5" r="2" fill="#f43f5e" opacity="0.45"/>
        <path d="M 30 30 Q 32 32 34 30" stroke="#1e293b" stroke-width="1.3" fill="none" stroke-linecap="round"/>

        <!-- Chullo Andino tradicional (Gorro de lana con orejeras) -->
        <g class="pet-chullo">
          <path d="M 19 23 C 19 8, 45 8, 45 23 Z" fill="#e11d48" stroke="#9f1239" stroke-width="1.6"/>
          <rect x="20" y="19" width="24" height="4" fill="#0284c7"/>
          <path d="M 22 21 L 24 19 L 26 21 L 28 19 L 30 21 L 32 19 L 34 21 L 36 19 L 38 21 L 40 19 L 42 21" stroke="#facc15" stroke-width="1.2" fill="none"/>
          <polygon points="19,23 23,23 21,31" fill="#e11d48" stroke="#9f1239" stroke-width="1"/>
          <polygon points="41,23 45,23 43,31" fill="#e11d48" stroke="#9f1239" stroke-width="1"/>
          <line x1="21" y1="31" x2="20" y2="36" stroke="#facc15" stroke-width="1.4"/>
          <line x1="43" y1="31" x2="44" y2="36" stroke="#facc15" stroke-width="1.4"/>
          <circle cx="32" cy="8" r="4.2" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
          <circle cx="30.5" cy="7" r="1.5" fill="#fef08a"/>
        </g>
      `;
      break;

    default:
      return '';
  }

  return `
    <svg viewBox="0 0 64 64" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="pet-svg pet-${petId}">
      ${petContent}
    </svg>
  `;
}

// Export for browser and node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AVATAR_OPTIONS, AVATAR_PRESETS, CHARACTER_SPECIFIC_OPTIONS, getRandomAvatar, renderAvatarSVG, renderPetSVG };
}
