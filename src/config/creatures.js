/**
 * creatures.js – Tier-Archetypen, Evolution, Quests (phasenabhängig), Items
 */

export const CREATURE_ARCHETYPES = [
  {
    id: 'bird', emoji: '🐦', name: 'Vogel',
    description: 'Schnell und weitgereist. Entdeckt neue Orte und trägt Samen weit.',
    color: 0x60b8e0, shape: 'bird',
    questBonus: { explore: 0.25 },
    treeBonus:  { lightRateBonus: 0.08 },
    evolution: [
      { level: 1,  name: 'Spatz',         emoji: '🐦', scale: 0.80, colorTint: 0x60b8e0, wingSpan: 0 },
      { level: 4,  name: 'Waldvogel',     emoji: '🦚', scale: 0.95, colorTint: 0x3090c0, wingSpan: 1 },
      { level: 7,  name: 'Greifvogel',    emoji: '🦅', scale: 1.10, colorTint: 0x205888, wingSpan: 2 },
      { level: 10, name: 'Feuerphoenix',  emoji: '🦅', scale: 1.30, colorTint: 0xff6020, wingSpan: 3, metamorphosis: true,
        treeBonus: { lightRateBonus: 0.25, allRatesBonus: 0.10 }, unlocksMutation: 'sun_crown' },
    ],
  },
  {
    id: 'rodent', emoji: '🐭', name: 'Nagetier',
    description: 'Geduldig und stark. Gräbt tief und findet verborgene Ressourcen.',
    color: 0xc8a060, shape: 'rodent',
    questBonus: { dig: 0.25 },
    treeBonus:  { nutrientsRateBonus: 0.08 },
    evolution: [
      { level: 1,  name: 'Maus',       emoji: '🐭', scale: 0.80, colorTint: 0xc8a060, earSize: 1 },
      { level: 4,  name: 'Waldmaus',   emoji: '🐭', scale: 0.95, colorTint: 0xa07840, earSize: 1.2 },
      { level: 7,  name: 'Dachs',      emoji: '🦡', scale: 1.15, colorTint: 0x706050, earSize: 0.8 },
      { level: 10, name: 'Erdkönig',   emoji: '🦡', scale: 1.35, colorTint: 0x403020, earSize: 0.6, metamorphosis: true,
        treeBonus: { nutrientsRateBonus: 0.25, waterRateBonus: 0.12 }, unlocksMutation: 'deep_roots' },
    ],
  },
  {
    id: 'insect', emoji: '🐛', name: 'Insekt',
    description: 'Klein aber vernetzt. Bestäubt alles und webt das Myzel-Netz.',
    color: 0x80d060, shape: 'insect',
    questBonus: { pollinate: 0.25 },
    treeBonus:  { allRatesBonus: 0.05 },
    evolution: [
      { level: 1,  name: 'Larve',         emoji: '🐛', scale: 0.80, colorTint: 0x80d060, wingAlpha: 0 },
      { level: 4,  name: 'Käfer',         emoji: '🐞', scale: 0.95, colorTint: 0x50a040, wingAlpha: 0.3 },
      { level: 7,  name: 'Schmetterling', emoji: '🦋', scale: 1.12, colorTint: 0x30c080, wingAlpha: 0.7 },
      { level: 10, name: 'Riesenmotte',   emoji: '🦋', scale: 1.35, colorTint: 0x8040ff, wingAlpha: 1.0, metamorphosis: true,
        treeBonus: { allRatesBonus: 0.18, nutrientsRateBonus: 0.12 }, unlocksMutation: 'mycel_bridge' },
    ],
  },
];

export function getEvolutionStage(archetype, level) {
  const stages = [...archetype.evolution].reverse();
  return stages.find(s => level >= s.level) || archetype.evolution[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Quests: minPhase = minimale Baumphase zum Erscheinen
// tier: 'basic' | 'advanced' | 'elder' – nur für visuelle Kennzeichnung
// ─────────────────────────────────────────────────────────────────────────────
export const QUEST_TYPES = [

  // ─ Phase 0+ (Basis, immer verfügbar) ─────────────────────────────────
  {
    id: 'gather', name: 'Sammeln', emoji: '🌿', tier: 'basic',
    description: 'Sammle Ressourcen für den Wald.',
    duration: 25000, type: 'gather', minPhase: 0,
    reward: { resources: { light: 20, water: 15, nutrients: 10 }, xp: 12, itemChance: 0.12 },
  },
  {
    id: 'explore', name: 'Erkunden', emoji: '🗺️', tier: 'basic',
    description: 'Erforsche den Waldrand und finde Neues.',
    duration: 60000, type: 'explore', minPhase: 0,
    reward: { resources: { light: 10 }, xp: 30, itemChance: 0.35 },
  },
  {
    id: 'pollinate', name: 'Bestäuben', emoji: '🌸', tier: 'basic',
    description: 'Bestäube drei Bäume und stärke das Netz.',
    duration: 30000, type: 'pollinate', minPhase: 0,
    reward: { resources: { symbiosis: 25 }, xp: 18, itemChance: 0.18 },
  },
  {
    id: 'dig', name: 'Graben', emoji: '⛏️', tier: 'basic',
    description: 'Grabe tiefer und erschließe verborgene Schichten.',
    duration: 50000, type: 'dig', minPhase: 0,
    reward: { resources: { nutrients: 30, water: 20 }, xp: 22, itemChance: 0.22 },
  },

  // ─ Phase 1+ (Junger Baum) ───────────────────────────────────────────
  {
    id: 'deep_gather', name: 'Tiefensammlung', emoji: '🕸️', tier: 'advanced',
    description: 'Folge den Wurzeln tief hinab und häufe reiche Nährstoffe an.',
    duration: 40000, type: 'dig', minPhase: 1,
    reward: { resources: { nutrients: 60, water: 30 }, xp: 35, itemChance: 0.30 },
  },
  {
    id: 'symbiosis_run', name: 'Symbiose-Lauf', emoji: '🍄', tier: 'advanced',
    description: 'Verbinde benachbarte Bäume über das Myzel-Netz.',
    duration: 45000, type: 'pollinate', minPhase: 1,
    reward: { resources: { symbiosis: 55, nutrients: 20 }, xp: 40, itemChance: 0.28 },
  },

  // ─ Phase 2+ (Ausgewachsener Baum) ───────────────────────────────────
  {
    id: 'water_quest', name: 'Quell suchen', emoji: '💧', tier: 'advanced',
    description: 'Spüre versteckten Quellen nach und bringe Wasser zurück.',
    duration: 35000, type: 'gather', minPhase: 2,
    reward: { resources: { water: 80, light: 20 }, xp: 42, itemChance: 0.32 },
  },
  {
    id: 'scout_far', name: 'Fernkundschaft', emoji: '🏔️', tier: 'advanced',
    description: 'Erforsche weit entfernte Gebiete jenseits des bekannten Waldes.',
    duration: 90000, type: 'explore', minPhase: 2,
    reward: { resources: { light: 40, water: 30, nutrients: 30 }, xp: 65, itemChance: 0.50 },
  },

  // ─ Phase 3+ (Alter Baum) ──────────────────────────────────────────────
  {
    id: 'ancient_rite', name: 'Altes Ritual', emoji: '🌙', tier: 'elder',
    description: 'Vollziehe ein uraltes Ritual um das Ökosystem zu stärken.',
    duration: 70000, type: 'pollinate', minPhase: 3,
    reward: { resources: { symbiosis: 100, light: 50, nutrients: 50 }, xp: 80, itemChance: 0.55 },
  },
  {
    id: 'fossil_dig', name: 'Fossiliengrabung', emoji: '🦴', tier: 'elder',
    description: 'Grabe bis zur Fossilienschicht und entdecke uraltes Wissen.',
    duration: 80000, type: 'dig', minPhase: 3,
    reward: { resources: { nutrients: 120, water: 60 }, xp: 90, itemChance: 0.60 },
  },

  // ─ Phase 4 (Urbaum) ───────────────────────────────────────────────────
  {
    id: 'worldsong', name: 'Weltenlied', emoji: '🌍', tier: 'elder',
    description: 'Singe das Lied des Urwalds – alle Ressourcen fließen reich.',
    duration: 120000, type: 'gather', minPhase: 4,
    reward: { resources: { light: 120, water: 120, nutrients: 120, symbiosis: 80 }, xp: 130, itemChance: 0.75 },
  },
  {
    id: 'spirit_walk', name: 'Geisterwanderung', emoji: '✨', tier: 'elder',
    description: 'Wandere durch die Geisterwelt des Waldes und bringe Weisheit zurück.',
    duration: 150000, type: 'explore', minPhase: 4,
    reward: { resources: { symbiosis: 150 }, xp: 160, itemChance: 0.80 },
  },

  // ─ Einmalig ─────────────────────────────────────────────────────────
  {
    id: 'plant_seed', name: 'Samen pflanzen', emoji: '🌱', tier: 'basic',
    description: 'Du hast einen uralten Samen gefunden. Pflanze ihn hier.',
    duration: 8000, type: 'plant_seed', minPhase: 0,
    reward: { xp: 50, itemChance: 0 },
    unique: true,
  },
];

export const ITEM_DROPS = [
  // Gewöhnlich
  { id: 'moss_coat',   name: 'Moosmantel',   emoji: '🌿', rarity: 'common',   bonus: { treeBonus: { nutrientsRateBonus: 0.05 } } },
  { id: 'berry_pouch', name: 'Beerenbeutel', emoji: '🫐', rarity: 'common',   bonus: { questBonus: { gather: 0.10 } } },
  { id: 'mud_boots',   name: 'Lehmstiefel',  emoji: '🥾', rarity: 'common',   bonus: { questBonus: { dig: 0.10 } } },
  { id: 'feather',     name: 'Leichtfeder',  emoji: '🪶', rarity: 'common',   bonus: { questBonus: { explore: 0.10 } } },
  // Ungewöhnlich (ab Level 3)
  { id: 'spore_sack',  name: 'Sporenbeutel', emoji: '🍄', rarity: 'uncommon', bonus: { treeBonus: { allRatesBonus: 0.05 } } },
  { id: 'root_charm',  name: 'Wurzelamulett', emoji: '🪵', rarity: 'uncommon', bonus: { treeBonus: { waterRateBonus: 0.07, nutrientsRateBonus: 0.05 } } },
  // Selten (ab Level 6)
  { id: 'crystal_claws', name: 'Kristallkrallen', emoji: '💠', rarity: 'rare',
    bonus: { questBonus: { explore: 0.20, dig: 0.15 }, treeBonus: { nutrientsRateBonus: 0.08 } } },
  { id: 'silk_wings',    name: 'Seidenflügel',    emoji: '🦋', rarity: 'rare',
    bonus: { questBonus: { pollinate: 0.20 }, treeBonus: { allRatesBonus: 0.08 } } },
  { id: 'storm_seed',    name: 'Sturmsame',        emoji: '🌀', rarity: 'rare',
    bonus: { questBonus: { gather: 0.18, explore: 0.12 }, treeBonus: { lightRateBonus: 0.06 } } },
  // Episch (ab Metamorphose)
  { id: 'ancient_amulet', name: 'Urwurzel-Amulett', emoji: '🌟', rarity: 'epic',
    bonus: { treeBonus: { allRatesBonus: 0.15, lightRateBonus: 0.10 } } },
  { id: 'worldheart',     name: 'Weltenkern',        emoji: '🌍', rarity: 'epic',
    bonus: { questBonus: { explore: 0.25, pollinate: 0.25 }, treeBonus: { allRatesBonus: 0.12, nutrientsRateBonus: 0.10 } } },
];

export const LEVEL_XP = [0, 40, 90, 150, 220, 300, 390, 490, 600, 720, 999];
