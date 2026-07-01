/**
 * skills.js – Skill-Baum-Konfiguration (Level-basiert, neue Ressource: Essenz)
 *
 * Änderungen:
 *  - Jeder Tier hat eine Mindest-Level-Anforderung (minLevel).
 *  - Neue Ressource 'essence' (Lebensessenz) als Hochstufungs-Währung.
 *  - 3 Zweige + Cross-Skills, insgesamt 16 Skills.
 *  - levelRequired: Mindest-Creature-Level um den Skill freizuschalten.
 */

export const SKILL_TREE = [

  // ══ NATUR-ZWEIG 🌿 ══════════════════════════════════════════════════════
  {
    id: 'n1_lichtgespuer', branch: 'natur', tier: 1,
    name: 'Lichtgespür', emoji: '☀️',
    description: 'Du erinnerst dich an Sonnenbahnen. +10% Licht-Rate.',
    requires: [], levelRequired: 1,
    cost: { light: 50 },
    bonus: { lightRateBonus: 0.10 },
    pos: { col: 1, row: 0 },
  },
  {
    id: 'n2_sonnenritual', branch: 'natur', tier: 2,
    name: 'Sonnenritual', emoji: '🌞',
    description: '+18% Licht, +5% Alle Raten.',
    requires: ['n1_lichtgespuer'], levelRequired: 3,
    cost: { light: 100, essence: 10 },
    bonus: { lightRateBonus: 0.18, allRatesBonus: 0.05 },
    pos: { col: 0, row: 1 },
  },
  {
    id: 'n2_wurzeltiefe', branch: 'natur', tier: 2,
    name: 'Wurzeltiefe', emoji: '🪵',
    description: '+12% Wasser, +8% Nährstoffe.',
    requires: ['n1_lichtgespuer'], levelRequired: 3,
    cost: { water: 80, nutrients: 50, essence: 10 },
    bonus: { waterRateBonus: 0.12, nutrientsRateBonus: 0.08 },
    pos: { col: 2, row: 1 },
  },
  {
    id: 'n3_kronenentfaltung', branch: 'natur', tier: 3,
    name: 'Kronenentfaltung', emoji: '🌳',
    description: '+20% Licht, +10% Wasser.',
    requires: ['n2_sonnenritual'], levelRequired: 5,
    cost: { light: 150, water: 80, essence: 30 },
    bonus: { lightRateBonus: 0.20, waterRateBonus: 0.10 },
    pos: { col: 0, row: 2 },
  },
  {
    id: 'n3_erdgedaechtnis', branch: 'natur', tier: 3,
    name: 'Erdgedächtnis', emoji: '🪸',
    description: '+20% Nährstoffe, -20% Wasser-Drain.',
    requires: ['n2_wurzeltiefe'], levelRequired: 5,
    cost: { nutrients: 120, essence: 30 },
    bonus: { nutrientsRateBonus: 0.20, waterDrainReduction: 0.20 },
    pos: { col: 2, row: 2 },
  },
  {
    id: 'n4_urbaum', branch: 'natur', tier: 4,
    name: 'Geist des Urbaums', emoji: '🌲',
    description: '+15% Alle Raten, +30% Licht, Baum atmet Essenz.',
    requires: ['n3_kronenentfaltung', 'n3_erdgedaechtnis'], levelRequired: 8,
    cost: { light: 250, water: 200, nutrients: 200, essence: 80 },
    bonus: { allRatesBonus: 0.15, lightRateBonus: 0.30, essenceRate: 0.4 },
    pos: { col: 1, row: 3 },
  },

  // ══ WILD-ZWEIG 🐾 ═══════════════════════════════════════════════════════
  {
    id: 'w1_tierinstinkt', branch: 'wild', tier: 1,
    name: 'Tierinstinkt', emoji: '🐾',
    description: 'Quests 10% schneller.',
    requires: [], levelRequired: 1,
    cost: { nutrients: 40 },
    bonus: { questSpeedBonus: 0.10 },
    pos: { col: 4, row: 0 },
  },
  {
    id: 'w2_spurenleser', branch: 'wild', tier: 2,
    name: 'Spurenleser', emoji: '👣',
    description: 'Erkunden 20% schneller, +10% Item-Chance.',
    requires: ['w1_tierinstinkt'], levelRequired: 3,
    cost: { nutrients: 70, essence: 10 },
    bonus: { questTypeSpeedBonus: { explore: 0.20 }, itemChanceBonus: 0.10 },
    pos: { col: 3, row: 1 },
  },
  {
    id: 'w2_grabkraft', branch: 'wild', tier: 2,
    name: 'Grabkraft', emoji: '⛏️',
    description: 'Graben 20% schneller, +15% Nährstoff-Belohnung.',
    requires: ['w1_tierinstinkt'], levelRequired: 3,
    cost: { nutrients: 70, water: 30, essence: 10 },
    bonus: { questTypeSpeedBonus: { dig: 0.20 }, questResourceBonus: { nutrients: 0.15 } },
    pos: { col: 5, row: 1 },
  },
  {
    id: 'w3_beutenasenase', branch: 'wild', tier: 3,
    name: 'Beutennase', emoji: '👃',
    description: '+20% Item-Chance, seltene Items ab Level 5.',
    requires: ['w2_spurenleser'], levelRequired: 5,
    cost: { nutrients: 100, essence: 35 },
    bonus: { itemChanceBonus: 0.20, rarityUnlock: 3 },
    pos: { col: 3, row: 2 },
  },
  {
    id: 'w3_tiefengraber', branch: 'wild', tier: 3,
    name: 'Tiefengraber', emoji: '🪨',
    description: 'Alle Quests 15% schneller, +20% Wasser aus Quests.',
    requires: ['w2_grabkraft'], levelRequired: 5,
    cost: { nutrients: 120, water: 80, essence: 35 },
    bonus: { questSpeedBonus: 0.15, questResourceBonus: { water: 0.20 } },
    pos: { col: 5, row: 2 },
  },
  {
    id: 'w4_naturjaeger', branch: 'wild', tier: 4,
    name: 'Naturjäger', emoji: '🌊',
    description: 'Alle Quests 25% schneller, +30% Item-Chancen.',
    requires: ['w3_beutenasenase', 'w3_tiefengraber'], levelRequired: 8,
    cost: { nutrients: 200, water: 120, essence: 80 },
    bonus: { questSpeedBonus: 0.25, itemChanceBonus: 0.30 },
    pos: { col: 4, row: 3 },
  },

  // ══ HARMONIE-ZWEIG 🍄 ════════════════════════════════════════════════════
  {
    id: 'h1_myzelnetz', branch: 'harmonie', tier: 1,
    name: 'Myzel-Netz', emoji: '🍄',
    description: '+0.3 Symbiose/s passiv.',
    requires: [], levelRequired: 1,
    cost: { water: 40, nutrients: 30 },
    bonus: { symbiosisPassive: 0.3 },
    pos: { col: 7, row: 0 },
  },
  {
    id: 'h2_baumfluesterer', branch: 'harmonie', tier: 2,
    name: 'Baumflüsterer', emoji: '🌻',
    description: 'Jeder Waldbaum +0.4 extra Symbiose.',
    requires: ['h1_myzelnetz'], levelRequired: 3,
    cost: { water: 60, essence: 15 },
    bonus: { forestSymbiosisBonus: 0.4 },
    pos: { col: 6, row: 1 },
  },
  {
    id: 'h2_krisengeist', branch: 'harmonie', tier: 2,
    name: 'Krisengeist', emoji: '🆘',
    description: 'Krisen-Quests +20% Schutz, 15% schneller.',
    requires: ['h1_myzelnetz'], levelRequired: 3,
    cost: { nutrients: 50, essence: 15 },
    bonus: { crisisDamageReductionBonus: 0.20, crisisQuestSpeedBonus: 0.15 },
    pos: { col: 8, row: 1 },
  },
  {
    id: 'h3_waldweber', branch: 'harmonie', tier: 3,
    name: 'Waldweber', emoji: '🪼',
    description: 'Wald-Boni +25%, +0.5 Symbiose/s.',
    requires: ['h2_baumfluesterer'], levelRequired: 5,
    cost: { water: 100, essence: 40 },
    bonus: { forestBonusMultiplier: 0.25, symbiosisPassive: 0.5 },
    pos: { col: 6, row: 2 },
  },
  {
    id: 'h3_notfallinstinkt', branch: 'harmonie', tier: 3,
    name: 'Notfallinstinkt', emoji: '⚡',
    description: 'Krisenschaden -25%, Krisen-Quests sofort.',
    requires: ['h2_krisengeist'], levelRequired: 5,
    cost: { nutrients: 100, essence: 40 },
    bonus: { eventDamageReduction: 0.25, crisisQuestSpeedBonus: 0.25 },
    pos: { col: 8, row: 2 },
  },
  {
    id: 'h4_naturwaecher', branch: 'harmonie', tier: 4,
    name: 'Naturwächter', emoji: '🌍',
    description: 'Wald-Boni +40%, Krisenschaden -40%, +1 Essenz/s.',
    requires: ['h3_waldweber', 'h3_notfallinstinkt'], levelRequired: 8,
    cost: { water: 200, nutrients: 200, essence: 100 },
    bonus: { forestBonusMultiplier: 0.40, eventDamageReduction: 0.40, essenceRate: 1.0 },
    pos: { col: 7, row: 3 },
  },

  // ══ VERBINDUNGS-SKILLS ══════════════════════════════════════════════════
  {
    id: 'x1_lebendpfad', branch: 'cross', tier: 3,
    name: 'Lebendpfad', emoji: '🌟',
    description: '+12% Alle Raten, Quests 12% schneller.',
    requires: ['n2_sonnenritual', 'w2_spurenleser'], levelRequired: 6,
    cost: { light: 100, nutrients: 100, essence: 50 },
    bonus: { allRatesBonus: 0.12, questSpeedBonus: 0.12 },
    pos: { col: 2, row: 2 },
  },
  {
    id: 'x2_wurzelbund', branch: 'cross', tier: 3,
    name: 'Wurzelbund', emoji: '🪴',
    description: '+0.6 Symbiose/s, Grabe-Quests füllen Wald-Netz.',
    requires: ['w2_grabkraft', 'h2_baumfluesterer'], levelRequired: 6,
    cost: { nutrients: 120, essence: 50 },
    bonus: { symbiosisPassive: 0.6, questResourceBonus: { symbiosis: 0.20 } },
    pos: { col: 6, row: 2 },
  },
  {
    id: 'x3_oekoseele', branch: 'cross', tier: 5,
    name: 'Ökoseele', emoji: '🌌',
    description: 'Alle drei Zweige vereint. +20% Alle Raten, +20% Quests, -30% Krisen, +2 Essenz/s.',
    requires: ['n4_urbaum', 'w4_naturjaeger', 'h4_naturwaecher'], levelRequired: 12,
    cost: { light: 300, water: 300, nutrients: 300, essence: 400 },
    bonus: { allRatesBonus: 0.20, questSpeedBonus: 0.20, eventDamageReduction: 0.30, essenceRate: 2.0 },
    pos: { col: 4, row: 4 },
  },
];

export const SKILL_BRANCHES = {
  natur:    { label: '🌿 Natur',    color: '#80d060', bgColor: 0x0a1a08 },
  wild:     { label: '🐾 Wild',     color: '#d0a040', bgColor: 0x1a1008 },
  harmonie: { label: '🍄 Harmonie', color: '#60c0d0', bgColor: 0x081a1a },
  cross:    { label: '🌌 Verbund',  color: '#d0a0ff', bgColor: 0x120818 },
};
