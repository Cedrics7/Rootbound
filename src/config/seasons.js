// Jahreszeiten-Konfiguration
<<<<<<< HEAD
export const SEASON_DURATION_MS = 60_000;
=======
// Alle Werte zentral änderbar – kein Magic-Number-Problem

export const SEASON_DURATION_MS = 60_000; // 60 Sekunden pro Jahreszeit
>>>>>>> origin/main

export const SEASONS = [
  {
    id: 'spring',
    name: 'Fr\u00fchling',
    emoji: '\uD83C\uDF38',
    skyTop: '#1a2e1a',
    skyBottom: '#2d5a27',
    groundColor: '#3d6b2a',
    ambientLight: '#a8d878',
    resourceMultiplier: { light: 1.2, water: 1.4, nutrients: 1.0, symbiosis: 1.3 },
    events: [
      {
        id: 'bloom',
<<<<<<< HEAD
        name: 'Bl\u00fctenpracht',
        emoji: '\uD83C\uDF38',
        chance: 0.004,
        duration: 8000,
        effect: { light: 1.5, water: -0.3, nutrients: 0.5, symbiosis: 0.8 },
        description: 'Eine Bl\u00fctenpracht verst\u00e4rkt die Photosynthese!',
=======
        name: 'Blütenpracht',
        emoji: '🌸',
        chance: 0.004,
        duration: 8000,
        effect: { light: +1.5, water: -0.3, nutrients: +0.5, symbiosis: +0.8 },
        description: 'Eine Blütenpracht verstärkt die Photosynthese!',
>>>>>>> origin/main
        color: 0xffb8d0,
      },
    ],
    description: 'Schnelles Wachstum. Neue Arten wandern ein.',
  },
  {
    id: 'summer',
    name: 'Sommer',
    emoji: '\u2600\uFE0F',
    skyTop: '#0a1a0a',
    skyBottom: '#1e4a10',
    groundColor: '#4a7a1e',
    ambientLight: '#f0e060',
<<<<<<< HEAD
    resourceMultiplier: { light: 1.5, water: 0.7, nutrients: 1.2, symbiosis: 1.5 },
=======
    resourceMultiplier: { light: 1.5, water: 0.7, nutrients: 1.2, symbiosis: 1.6 },
>>>>>>> origin/main
    events: [
      {
        id: 'drought',
        name: 'D\u00fcrre',
        emoji: '\uD83D\uDD25',
        chance: 0.006,
        duration: 10000,
<<<<<<< HEAD
        effect: { light: 0.5, water: -1.8, nutrients: -0.5, symbiosis: -0.3 },
=======
        effect: { light: +0.5, water: -1.8, nutrients: -0.5, symbiosis: -0.3 },
>>>>>>> origin/main
        description: 'Extreme Hitze! Wasser verdunstet rapide.',
        color: 0xff6020,
      },
      {
        id: 'heatwave',
        name: 'Hitzewelle',
        emoji: '\uD83C\uDF21\uFE0F',
        chance: 0.003,
        duration: 6000,
<<<<<<< HEAD
        effect: { light: 0.3, water: -1.2, nutrients: 0, symbiosis: 0 },
        description: 'Sengend hei\u00df \u2013 Wasser ist knapp.',
=======
        effect: { light: +0.3, water: -1.2, nutrients: 0, symbiosis: 0 },
        description: 'Sengend heiß – Wasser ist knapp.',
>>>>>>> origin/main
        color: 0xffa040,
      },
    ],
    description: 'Maximale Symbiose. Aber Brandgefahr.',
  },
  {
    id: 'autumn',
    name: 'Herbst',
    emoji: '\uD83C\uDF42',
    skyTop: '#1a1005',
    skyBottom: '#3d2a10',
    groundColor: '#5a3a0a',
    ambientLight: '#e08030',
    resourceMultiplier: { light: 0.9, water: 1.1, nutrients: 1.5, symbiosis: 0.9 },
    events: [
      {
        id: 'windstorm',
        name: 'Herbststurm',
        emoji: '\uD83C\uDF2A\uFE0F',
        chance: 0.005,
        duration: 7000,
<<<<<<< HEAD
        effect: { light: -0.8, water: 1.0, nutrients: -0.6, symbiosis: -0.4 },
        description: 'Ein Sturm fegt \u00fcber das Land \u2013 Ressourcen schwinden!',
=======
        effect: { light: -0.8, water: +1.0, nutrients: -0.6, symbiosis: -0.5 },
        description: 'Ein Sturm fegt über das Land!',
>>>>>>> origin/main
        color: 0xd07020,
      },
      {
        id: 'harvest',
        name: 'Erntesegen',
        emoji: '\uD83C\uDF44',
        chance: 0.004,
        duration: 6000,
<<<<<<< HEAD
        effect: { light: 0, water: 0, nutrients: 2.5, symbiosis: 1.0 },
        description: 'Gefallene Bl\u00e4tter n\u00e4hren den Boden.',
=======
        effect: { light: 0, water: 0, nutrients: +2.5, symbiosis: +1.0 },
        description: 'Gefallene Blätter nähren den Boden.',
>>>>>>> origin/main
        color: 0x90c040,
      },
    ],
    description: 'Ressourcen sammeln f\u00fcr den Winter.',
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '\u2744\uFE0F',
    skyTop: '#050a14',
    skyBottom: '#0a1a2e',
    groundColor: '#c8d8e8',
    ambientLight: '#6090c0',
    resourceMultiplier: { light: 0.5, water: 0.6, nutrients: 0.4, symbiosis: 0.3 },
    events: [
      {
        id: 'blizzard',
        name: 'Schneesturm',
        emoji: '\u2744\uFE0F',
        chance: 0.005,
        duration: 12000,
<<<<<<< HEAD
        effect: { light: -1.0, water: -0.8, nutrients: -1.0, symbiosis: -0.5 },
        description: 'Ein Blizzard zieht auf! Alle Ressourcen sinken schnell.',
=======
        effect: { light: -1.0, water: -0.8, nutrients: -1.0, symbiosis: -0.8 },
        description: 'Ein Blizzard zieht auf! Alle Ressourcen sinken.',
>>>>>>> origin/main
        color: 0xa0c8f0,
      },
      {
        id: 'frost',
        name: 'Frost',
        emoji: '\uD83E\uDDCA',
        chance: 0.007,
        duration: 8000,
<<<<<<< HEAD
        effect: { light: -0.5, water: -0.5, nutrients: -0.8, symbiosis: -0.3 },
        description: 'Tiefer Frost \u2013 N\u00e4hrstoffe gefrieren im Boden.',
=======
        effect: { light: -0.5, water: -0.5, nutrients: -0.8, symbiosis: -0.4 },
        description: 'Tiefer Frost – Nährstoffe gefrieren im Boden.',
>>>>>>> origin/main
        color: 0x80a8ff,
      },
    ],
    description: '\u00dcberlebensmodus. Falsche Mutationen t\u00f6ten Arten.',
  },
];

export const TREE_PHASES = [
  {
    id: 'seedling',
    name: 'S\u00e4mling',
    trunkHeight: 60,
    trunkWidth: 8,
    levels: 2,
    branchSpread: 40,
    growthCost: null,
    requiredSymbioses: 0,
    leafColor: 0x4a9a3a,
    description: 'Ein kleines B\u00e4umchen. Voller Potenzial.',
  },
  {
    id: 'young',
    name: 'Junger Baum',
    trunkHeight: 120,
    trunkWidth: 14,
    levels: 3,
    branchSpread: 70,
    growthCost: { light: 80, water: 40, nutrients: 20 },
    requiredSymbioses: 0,
    leafColor: 0x3a8a2a,
    description: 'Die Krone wird sichtbar. Erste Wurzeln greifen tief.',
  },
  {
    id: 'grown',
    name: 'Ausgewachsener Baum',
    trunkHeight: 200,
    trunkWidth: 22,
    levels: 4,
    branchSpread: 110,
    growthCost: { light: 200, water: 100, nutrients: 80 },
    requiredSymbioses: 2,
    leafColor: 0x2a7a1a,
    description: 'Breite Krone. Das Netzwerk beginnt.',
  },
  {
    id: 'ancient',
    name: 'Urbaum',
<<<<<<< HEAD
    trunkHeight: 310,
    trunkWidth: 34,
    levels: 5,
    branchSpread: 160,
    growthCost: { light: 500, water: 300, nutrients: 250 },
    requiredSymbioses: 4,
    leafColor: 0x1a6010,
    description: 'Jahrhundertealt. Ein ganzes \u00d6kosystem lebt in dir.',
=======
    trunkHeight: 300,
    trunkWidth: 34,
    levels: 5,
    branchSpread: 160,
    growthCost: { light: 400, water: 250, nutrients: 200 },
    requiredSymbioses: 4,
    leafColor: 0x1a6010,
    description: 'Ein Jahrtausende alter Riese. Das Ökosystem zentriert sich um dich.',
>>>>>>> origin/main
  },
];

export const RESOURCES = {
  light: {
    name: 'Licht',
    emoji: '\u2600\uFE0F',
    color: '#f0e060',
    max: 500,
    baseRate: 0.8,
  },
  water: {
    name: 'Wasser',
    emoji: '\uD83D\uDCA7',
    color: '#60a0f0',
    max: 500,
    baseRate: 0.5,
  },
  nutrients: {
    name: 'N\u00e4hrstoffe',
    emoji: '\uD83C\uDF31',
    color: '#80c040',
    max: 500,
    baseRate: 0.3,
  },
  symbiosis: {
    name: 'Symbiose',
<<<<<<< HEAD
    emoji: '\uD83E\uDEB8',
    color: '#40d0a0',
    max: 500,
=======
    emoji: '🌿',
    color: '#40d0a0',
    max: 300,
>>>>>>> origin/main
    baseRate: 0.15,
  },
};

export const MUTATIONS = [
  {
    id: 'deep_roots',
    name: 'Tiefe Wurzeln',
    emoji: '\uD83C\uDF3F',
    type: 'passive',
<<<<<<< HEAD
    description: 'Der Baum gr\u00e4bt tiefere Wurzeln. Wasser-Regeneration +40% dauerhaft.',
    lore: 'Unter der Erde tr\u00e4umt der Baum von Meeren, die l\u00e4ngst verschwunden sind.',
=======
    description: 'Tiefere Wurzeln. Wasser-Regeneration +40% dauerhaft. Sichtbar als extra Wurzeln.',
    lore: 'Unter der Erde träumt der Baum von Meeren, die längst verschwunden sind.',
>>>>>>> origin/main
    cost: { light: 60, water: 20, nutrients: 30 },
    requiredPhase: 0,
    exclusiveWith: [],
    effect: { waterRateBonus: 0.4 },
    visual: { trunkColorTint: 0x2a1a0a, rootExtra: 3 },
    unlocked: false,
    active: false,
  },
  {
    id: 'bioluminescence',
    name: 'Biolumineszenz',
    emoji: '\u2728',
    type: 'active',
<<<<<<< HEAD
    description: 'Leuchtende Bl\u00e4tter locken Nachtinsekten an. N\u00e4hrstoffe +50%, aber Wasser -20%.',
=======
    description: 'Leuchtende Blätter locken Nachtinsekten. Nährstoffe +50%, Wasser -20%. Blätter leuchten grün.',
>>>>>>> origin/main
    lore: 'In der Nacht leuchtet der Wald wie ein lebendiger Sternenhimmel.',
    cost: { light: 120, water: 50, nutrients: 40 },
    requiredPhase: 1,
    exclusiveWith: ['fire_bark'],
    effect: { nutrientsRateBonus: 0.5, waterRateBonus: -0.2 },
    visual: { leafGlow: true, leafColor: 0x40ff80 },
    unlocked: false,
    active: false,
  },
  {
    id: 'mycel_bridge',
<<<<<<< HEAD
    name: 'Myzelgef\u00fcge',
    emoji: '\uD83C\uDF44',
    type: 'symbiosis',
    description: 'Pilznetzwerk im Boden verbindet alle Ressourcen. Alle Raten +20%.',
    lore: 'Unter jedem Wald schl\u00e4gt ein zweites Herz aus Pilzf\u00e4den.',
=======
    name: 'Myzelbrücke',
    emoji: '🍄',
    type: 'symbiosis',
    description: 'Pilznetzwerk verbindet alle Ressourcen. Alle Raten +20%. Myzel sichtbar im Boden.',
    lore: 'Unter jedem Wald schlägt ein zweites Herz aus Pilzfäden.',
>>>>>>> origin/main
    cost: { light: 80, water: 80, nutrients: 100 },
    requiredPhase: 1,
    exclusiveWith: [],
    effect: { allRatesBonus: 0.2 },
    visual: { showMycel: true },
    unlocked: false,
    active: false,
  },
  {
    id: 'fire_bark',
    name: 'Feuerfeste Rinde',
    emoji: '\uD83D\uDD25',
    type: 'crisis',
<<<<<<< HEAD
    description: 'Nach dem \u00dcberstehen einer D\u00fcrre w\u00e4chst feuerfeste Rinde. Wasser-Verlust -30%.',
=======
    description: 'Nach einer Dürre wächst feuerfeste Rinde. Wasser-Verlust -30%. Stamm wird rötlich.',
>>>>>>> origin/main
    lore: 'Was das Feuer nicht bricht, macht es unsterblich.',
    cost: { light: 0, water: 0, nutrients: 0 },
    requiredPhase: 1,
    requiredCrisis: 'drought',
    exclusiveWith: ['bioluminescence'],
    effect: { waterDrainReduction: 0.3 },
    visual: { trunkColorTint: 0x8a2010 },
    unlocked: false,
    active: false,
  },
  {
    id: 'sun_crown',
    name: 'Sonnen-Krone',
    emoji: '\uD83C\uDF1E',
    type: 'active',
<<<<<<< HEAD
    description: 'Die Krone richtet sich zur Sonne aus. Licht +60%, aber langsames Wachstum.',
    lore: 'Manche B\u00e4ume verbiegen ihr ganzes Leben, um dem Licht zu folgen.',
=======
    description: 'Krone richtet sich zur Sonne. Licht +60%. Blätter werden golden.',
    lore: 'Manche Bäume verbiegen ihr ganzes Leben, um dem Licht zu folgen.',
>>>>>>> origin/main
    cost: { light: 150, water: 30, nutrients: 60 },
    requiredPhase: 1,
    exclusiveWith: [],
    effect: { lightRateBonus: 0.6 },
    visual: { leafColor: 0xf0d020, crownTilt: true },
    unlocked: false,
    active: false,
  },
  {
    id: 'root_network',
    name: 'Wurzelnetz',
    emoji: '\uD83C\uDF10',
    type: 'symbiosis',
    description: 'Weitverzweigte Wurzeln teilen Wasser mit Nachbarpflanzen. Symbiose +35%.',
    lore: 'Ein Wald ist kein Wettbewerb \u2013 er ist ein Gespr\u00e4ch.',
    cost: { light: 60, water: 120, nutrients: 80 },
    requiredPhase: 2,
    exclusiveWith: [],
    effect: { allRatesBonus: 0.1, waterRateBonus: 0.25 },
    visual: { rootExtra: 3 },
    unlocked: false,
    active: false,
  },
];

export const CODEX_ENTRIES = [
  // Pilze
  { id: 'myzel',      name: 'Myzel',          icon: '\uD83C\uDF44', cat: 'Pilznetzwerke', cond: 'Bodenfeuchte \u2265 70%',          unlocked: false },
  { id: 'glowshroom', name: 'Geisterpilz',    icon: '\uD83D\uDFE3', cat: 'Pilznetzwerke', cond: 'Biolumineszenz aktiv',            unlocked: false },
  { id: 'fireswamp',  name: 'Feuerschwamm',   icon: '\uD83D\uDD34', cat: 'Pilznetzwerke', cond: 'D\u00fcrre-Event \u00fcberleben', unlocked: false },
  // Tiere
  { id: 'firefly',    name: 'Gl\u00fchwürmchen', icon: '\uD83E\uDEB2', cat: 'Tiere',         cond: 'Biolumineszenz + Sommer',        unlocked: false },
  { id: 'boar',       name: 'Wildschwein',    icon: '\uD83D\uDC17', cat: 'Tiere',         cond: '5+ Jahre, N\u00e4hrstoffe > 300', unlocked: false },
  { id: 'moth',       name: 'Riesenmotte',    icon: '\uD83E\uDD8B', cat: 'Tiere',         cond: 'Myzelgef\u00fcge + Nacht',        unlocked: false },
  // Pflanzen
  { id: 'sundew',     name: 'Sonnentau',      icon: '\uD83C\uDF3F', cat: 'Pflanzen',      cond: 'Fr\u00fchling + Wasser > 350',   unlocked: false },
  { id: 'titan_arum', name: 'Titanenwurz',    icon: '\uD83C\uDF3A', cat: 'Pflanzen',      cond: 'Jahr 10+, Symbiose > 300',       unlocked: false },
  { id: 'moonflower', name: 'Mondblume',      icon: '\uD83C\uDF19', cat: 'Pflanzen',      cond: 'Winter \u00fcberleben + Biolum', unlocked: false },
  // Parasiten
  { id: 'parasite',   name: 'Schmarotzerpflanze', icon: '\uD83E\uDDA0', cat: 'Parasiten', cond: 'Krisen-Event \u00fcberleben',   unlocked: false },
  // Legendarys
  { id: 'eternal_shroom', name: 'Ewiger Schwamm', icon: '\u267E\uFE0F', cat: 'Legendarys', cond: 'Alle Pilze entdeckt',           unlocked: false },
  { id: 'worldroot',  name: 'Weltenwurzel',   icon: '\uD83C\uDF0D', cat: 'Legendarys',    cond: 'Alle Mutationen aktiv',          unlocked: false },
];
