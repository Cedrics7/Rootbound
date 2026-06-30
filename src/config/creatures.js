/**
 * creatures.js – Tier-Archetypen, Quest-Definitionen, Item-Drops
 */

export const CREATURE_ARCHETYPES = [
  {
    id: 'bird',
    emoji: '🐦',
    name: 'Vogel',
    description: 'Schnell und weitgereist. Entdeckt neue Orte und trägt Samen weit.',
    color: 0x60b8e0,
    questBonus: { explore: 0.25 },   // 25% schneller bei Erkundung
    treeBonus:  { lightRateBonus: 0.08 },
    shape: 'bird',
  },
  {
    id: 'rodent',
    emoji: '🐭',
    name: 'Nagetier',
    description: 'Geduldig und stark. Gräbt tief und findet verborgene Ressourcen.',
    color: 0xc8a060,
    questBonus: { dig: 0.25 },
    treeBonus:  { nutrientsRateBonus: 0.08 },
    shape: 'rodent',
  },
  {
    id: 'insect',
    emoji: '🐛',
    name: 'Insekt',
    description: 'Klein aber vernetzt. Bestäubt alles und webt das Myzel-Netz.',
    color: 0x80d060,
    questBonus: { pollinate: 0.25 },
    treeBonus:  { allRatesBonus: 0.05 },
    shape: 'insect',
  },
];

// Quests: id, name, emoji, dauer (ms), typ, belohnung
export const QUEST_TYPES = [
  {
    id: 'gather',
    name: 'Sammeln',
    emoji: '🌿',
    description: 'Sammle Ressourcen für den Wald.',
    duration: 25000,
    type: 'gather',
    reward: { resources: { light: 20, water: 15, nutrients: 10 }, xp: 12, itemChance: 0.15 },
  },
  {
    id: 'explore',
    name: 'Erkunden',
    emoji: '🗺️',
    description: 'Erforsche den Waldrand und finde Neues.',
    duration: 60000,
    type: 'explore',
    reward: { resources: { light: 10 }, xp: 30, itemChance: 0.40 },
  },
  {
    id: 'pollinate',
    name: 'Bestäuben',
    emoji: '🌸',
    description: 'Bestäube drei Bäume und stärke das Netz.',
    duration: 30000,
    type: 'pollinate',
    reward: { resources: { symbiosis: 25 }, xp: 18, itemChance: 0.20 },
  },
  {
    id: 'dig',
    name: 'Graben',
    emoji: '⛏️',
    description: 'Grabe tiefer und erschließe verborgene Schichten.',
    duration: 50000,
    type: 'dig',
    reward: { resources: { nutrients: 30, water: 20 }, xp: 22, itemChance: 0.25 },
  },
  {
    id: 'plant_seed',
    name: 'Samen pflanzen',
    emoji: '🌱',
    description: 'Du hast einen uralten Samen gefunden. Pflanze ihn hier.',
    duration: 8000,
    type: 'plant_seed',
    reward: { xp: 50, itemChance: 0 },
    unique: true,   // erscheint nur einmal, schaltet Baum frei
  },
];

// Item-Drops (nur Gewöhnlich im MVP)
export const ITEM_DROPS = [
  { id: 'moss_coat',   name: 'Moosmantel',    emoji: '🌿', rarity: 'common',   bonus: { treeBonus: { nutrientsRateBonus: 0.05 } } },
  { id: 'berry_pouch', name: 'Beerenbeutel',  emoji: '🫐', rarity: 'common',   bonus: { questBonus: { gather: -0.10 } } }, // 10% schneller
  { id: 'mud_boots',   name: 'Lehmstiefel',   emoji: '🥾', rarity: 'common',   bonus: { questBonus: { dig: -0.10 } } },
  { id: 'feather',     name: 'Leichtfeder',   emoji: '🪶', rarity: 'common',   bonus: { questBonus: { explore: -0.10 } } },
  { id: 'spore_sack',  name: 'Sporenbeutel',  emoji: '🍄', rarity: 'uncommon', bonus: { treeBonus: { allRatesBonus: 0.05 } } },
];

// XP für nächstes Level (Index = aktuelles Level)
export const LEVEL_XP = [0, 40, 90, 150, 220, 300, 390, 490, 600];
