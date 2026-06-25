// Jahreszeiten-Konfiguration
// Alle Werte zentral änderbar – kein Magic-Number-Problem

export const SEASON_DURATION_MS = 60_000; // 60 Sekunden pro Jahreszeit (anpassbar)

export const SEASONS = [
  {
    id: 'spring',
    name: 'Frühling',
    emoji: '🌸',
    skyTop: '#1a2e1a',
    skyBottom: '#2d5a27',
    groundColor: '#3d6b2a',
    ambientLight: '#a8d878',
    resourceMultiplier: { light: 1.2, water: 1.4, nutrients: 1.0 },
    description: 'Schnelles Wachstum. Neue Arten wandern ein.',
  },
  {
    id: 'summer',
    name: 'Sommer',
    emoji: '☀️',
    skyTop: '#0a1a0a',
    skyBottom: '#1e4a10',
    groundColor: '#4a7a1e',
    ambientLight: '#f0e060',
    resourceMultiplier: { light: 1.5, water: 0.7, nutrients: 1.2 },
    description: 'Maximale Symbiose. Aber Brandgefahr.',
  },
  {
    id: 'autumn',
    name: 'Herbst',
    emoji: '🍂',
    skyTop: '#1a1005',
    skyBottom: '#3d2a10',
    groundColor: '#5a3a0a',
    ambientLight: '#e08030',
    resourceMultiplier: { light: 0.9, water: 1.1, nutrients: 1.5 },
    description: 'Ressourcen sammeln für den Winter.',
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    skyTop: '#050a14',
    skyBottom: '#0a1a2e',
    groundColor: '#c8d8e8',
    ambientLight: '#6090c0',
    resourceMultiplier: { light: 0.5, water: 0.6, nutrients: 0.4 },
    description: 'Überlebensmodus. Falsche Mutationen töten Arten.',
  },
];

export const TREE_PHASES = [
  {
    id: 'seedling',
    name: 'Sämling',
    trunkHeight: 60,
    trunkWidth: 8,
    levels: 2,
    branchSpread: 40,
    requiredLight: 0,
    leafColor: 0x4a9a3a,
    description: 'Ein kleines Bäumchen. Voller Potenzial.',
  },
  {
    id: 'young',
    name: 'Junger Baum',
    trunkHeight: 120,
    trunkWidth: 14,
    levels: 3,
    branchSpread: 70,
    requiredLight: 80,
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
    requiredLight: 250,
    leafColor: 0x2a7a1a,
    description: 'Breite Krone. Das Netzwerk beginnt.',
  },
];

export const RESOURCES = {
  light: {
    name: 'Licht',
    emoji: '☀️',
    color: '#f0e060',
    max: 500,
    baseRate: 0.8, // pro Sekunde
  },
  water: {
    name: 'Wasser',
    emoji: '💧',
    color: '#60a0f0',
    max: 500,
    baseRate: 0.5,
  },
  nutrients: {
    name: 'Nährstoffe',
    emoji: '🌱',
    color: '#80c040',
    max: 500,
    baseRate: 0.3,
  },
};
