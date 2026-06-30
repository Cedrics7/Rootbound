/**
 * creatures.js – Tier-Archetypen, Evolution, Quests, Items
 */

// ─ Evolution: Stufe 0..2 (alle 3 Level eine Stufe), Stufe 3 = Metamorphose ─
export const CREATURE_ARCHETYPES = [
  {
    id: 'bird', emoji: '🐦', name: 'Vogel',
    description: 'Schnell und weitgereist. Entdeckt neue Orte und trägt Samen weit.',
    color: 0x60b8e0, shape: 'bird',
    questBonus: { explore: 0.25 },
    treeBonus:  { lightRateBonus: 0.08 },
    evolution: [
      { level: 1, name: 'Spatz',        emoji: '🐦', scale: 0.80, colorTint: 0x60b8e0, wingSpan: 0 },
      { level: 4, name: 'Waldvogel',    emoji: '🦚', scale: 0.95, colorTint: 0x3090c0, wingSpan: 1 },
      { level: 7, name: 'Greifvogel',   emoji: '🦅', scale: 1.10, colorTint: 0x205888, wingSpan: 2 },
      { level: 10, name: 'Feuerphoenix', emoji: '🦅', scale: 1.30, colorTint: 0xff6020, wingSpan: 3, metamorphosis: true,
        treeBonus: { lightRateBonus: 0.25, allRatesBonus: 0.10 },
        unlocksMutation: 'sun_crown' },
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
        treeBonus: { nutrientsRateBonus: 0.25, waterRateBonus: 0.12 },
        unlocksMutation: 'deep_roots' },
    ],
  },
  {
    id: 'insect', emoji: '🐛', name: 'Insekt',
    description: 'Klein aber vernetzt. Bestäubt alles und webt das Myzel-Netz.',
    color: 0x80d060, shape: 'insect',
    questBonus: { pollinate: 0.25 },
    treeBonus:  { allRatesBonus: 0.05 },
    evolution: [
      { level: 1,  name: 'Larve',      emoji: '🐛', scale: 0.80, colorTint: 0x80d060, wingAlpha: 0 },
      { level: 4,  name: 'Käfer',      emoji: '🐞', scale: 0.95, colorTint: 0x50a040, wingAlpha: 0.3 },
      { level: 7,  name: 'Schmetterling', emoji: '🦋', scale: 1.12, colorTint: 0x30c080, wingAlpha: 0.7 },
      { level: 10, name: 'Riesenmotte', emoji: '🦋', scale: 1.35, colorTint: 0x8040ff, wingAlpha: 1.0, metamorphosis: true,
        treeBonus: { allRatesBonus: 0.18, nutrientsRateBonus: 0.12 },
        unlocksMutation: 'mycel_bridge' },
    ],
  },
];

// Gibt die aktuelle Evolutionsstufe für ein Level zurück
export function getEvolutionStage(archetype, level) {
  const stages = [...archetype.evolution].reverse();
  return stages.find(s => level >= s.level) || archetype.evolution[0];
}

export const QUEST_TYPES = [
  {
    id: 'gather', name: 'Sammeln', emoji: '🌿',
    description: 'Sammle Ressourcen für den Wald.',
    duration: 25000, type: 'gather',
    reward: { resources: { light: 20, water: 15, nutrients: 10 }, xp: 12, itemChance: 0.15 },
  },
  {
    id: 'explore', name: 'Erkunden', emoji: '🗺️',
    description: 'Erforsche den Waldrand und finde Neues.',
    duration: 60000, type: 'explore',
    reward: { resources: { light: 10 }, xp: 30, itemChance: 0.40 },
  },
  {
    id: 'pollinate', name: 'Bestäuben', emoji: '🌸',
    description: 'Bestäube drei Bäume und stärke das Netz.',
    duration: 30000, type: 'pollinate',
    reward: { resources: { symbiosis: 25 }, xp: 18, itemChance: 0.20 },
  },
  {
    id: 'dig', name: 'Graben', emoji: '⛏️',
    description: 'Grabe tiefer und erschließe verborgene Schichten.',
    duration: 50000, type: 'dig',
    reward: { resources: { nutrients: 30, water: 20 }, xp: 22, itemChance: 0.25 },
  },
  {
    id: 'plant_seed', name: 'Samen pflanzen', emoji: '🌱',
    description: 'Du hast einen uralten Samen gefunden. Pflanze ihn hier.',
    duration: 8000, type: 'plant_seed',
    reward: { xp: 50, itemChance: 0 },
    unique: true,
  },
];

export const ITEM_DROPS = [
  { id: 'moss_coat',   name: 'Moosmantel',   emoji: '🌿', rarity: 'common',   bonus: { treeBonus: { nutrientsRateBonus: 0.05 } } },
  { id: 'berry_pouch', name: 'Beerenbeutel', emoji: '🫐', rarity: 'common',   bonus: { questBonus: { gather: 0.10 } } },
  { id: 'mud_boots',   name: 'Lehmstiefel',  emoji: '🥾', rarity: 'common',   bonus: { questBonus: { dig: 0.10 } } },
  { id: 'feather',     name: 'Leichtfeder',  emoji: '🪶', rarity: 'common',   bonus: { questBonus: { explore: 0.10 } } },
  { id: 'spore_sack',  name: 'Sporenbeutel', emoji: '🍄', rarity: 'uncommon', bonus: { treeBonus: { allRatesBonus: 0.05 } } },
  // Selten (ab Level 6)
  { id: 'crystal_claws', name: 'Kristallkrallen', emoji: '💠', rarity: 'rare',
    bonus: { questBonus: { explore: 0.20, dig: 0.15 }, treeBonus: { nutrientsRateBonus: 0.08 } } },
  { id: 'silk_wings',    name: 'Seidenflügel',    emoji: '🦋', rarity: 'rare',
    bonus: { questBonus: { pollinate: 0.20 }, treeBonus: { allRatesBonus: 0.08 } } },
  // Episch (ab Metamorphose, Level 10)
  { id: 'ancient_amulet', name: 'Urwurzel-Amulett', emoji: '🌟', rarity: 'epic',
    bonus: { treeBonus: { allRatesBonus: 0.15, lightRateBonus: 0.10 } } },
];

// XP für nächstes Level (Index = aktuelles Level, 0 = unused)
export const LEVEL_XP = [0, 40, 90, 150, 220, 300, 390, 490, 600, 720, 999];
