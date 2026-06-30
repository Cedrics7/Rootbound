/**
 * skills.js – Skill-Baum-Konfiguration
 *
 * 3 Zweige:
 *   NATUR    🌿  – Baum-Ressourcen-Boni
 *   WILD     🐾  – Quest-Geschwindigkeit, Item-Chancen
 *   HARMONIE 🍄  – Symbiose, Wald, Krisenresistenz
 *
 * Kosten: { xp, light?, water?, nutrients?, symbiosis? }
 * requires: [skillId, ...]  – alle müssen freigeschaltet sein
 * bonus: passt zu ResourceSystem / CreatureSystem / CrisisQuestSystem
 */

export const SKILL_TREE = [

  // ══ NATUR-ZWEIG 🌿 (Baum-Ressourcen) ══════════════════════════════════════
  {
    id: 'n1_lichtgespuer', branch: 'natur', tier: 1,
    name: 'Lichtgespür', emoji: '☀️',
    description: 'Du erinnerst dich an Sonnenbahnen. +10% Licht-Rate.',
    requires: [],
    cost: { xp: 30, light: 40 },
    bonus: { lightRateBonus: 0.10 },
    pos: { col: 1, row: 0 },
  },
  {
    id: 'n2_sonnenritual', branch: 'natur', tier: 2,
    name: 'Sonnenritual', emoji: '🌞',
    description: 'Morgenliche Rituale verdoppeln die Lichtaufnahme. +18% Licht, +5% Alle.',
    requires: ['n1_lichtgespuer'],
    cost: { xp: 60, light: 80, nutrients: 30 },
    bonus: { lightRateBonus: 0.18, allRatesBonus: 0.05 },
    pos: { col: 0, row: 1 },
  },
  {
    id: 'n2_wurzeltiefe', branch: 'natur', tier: 2,
    name: 'Wurzeltiefe', emoji: '🪵',
    description: 'Tiefe Wurzeln erschließen verborgenes Wasser. +12% Wasser, +8% Nährstoffe.',
    requires: ['n1_lichtgespuer'],
    cost: { xp: 60, water: 60, nutrients: 40 },
    bonus: { waterRateBonus: 0.12, nutrientsRateBonus: 0.08 },
    pos: { col: 2, row: 1 },
  },
  {
    id: 'n3_kronenentfaltung', branch: 'natur', tier: 3,
    name: 'Kronenentfaltung', emoji: '🌳',
    description: 'Die Krone entfaltet sich voll. +20% Licht, +10% Wasser.',
    requires: ['n2_sonnenritual'],
    cost: { xp: 100, light: 120, water: 60 },
    bonus: { lightRateBonus: 0.20, waterRateBonus: 0.10 },
    pos: { col: 0, row: 2 },
  },
  {
    id: 'n3_erdgedaechtnis', branch: 'natur', tier: 3,
    name: 'Erdgedächtnis', emoji: '🪸',
    description: 'Jahrtausende im Boden gespeichertes Wissen. +20% Nährstoffe, -20% Wasser-Drain.',
    requires: ['n2_wurzeltiefe'],
    cost: { xp: 100, nutrients: 100, water: 40 },
    bonus: { nutrientsRateBonus: 0.20, waterDrainReduction: 0.20 },
    pos: { col: 2, row: 2 },
  },
  {
    id: 'n4_urbaum', branch: 'natur', tier: 4,
    name: 'Geist des Urbaums', emoji: '🌲',
    description: 'Der Baum erwacht als lebendes Wesen. +15% Alle Raten, +30% Licht.',
    requires: ['n3_kronenentfaltung', 'n3_erdgedaechtnis'],
    cost: { xp: 200, light: 200, water: 150, nutrients: 150 },
    bonus: { allRatesBonus: 0.15, lightRateBonus: 0.30 },
    pos: { col: 1, row: 3 },
  },

  // ══ WILD-ZWEIG 🐾 (Quests & Items) ══════════════════════════════════════
  {
    id: 'w1_tierinstinkt', branch: 'wild', tier: 1,
    name: 'Tierinstinkt', emoji: '🐾',
    description: 'Deine Sinne schärfen sich. Quests 10% schneller.',
    requires: [],
    cost: { xp: 30, nutrients: 30 },
    bonus: { questSpeedBonus: 0.10 },
    pos: { col: 4, row: 0 },
  },
  {
    id: 'w2_spurenleser', branch: 'wild', tier: 2,
    name: 'Spurenleser', emoji: '👣',
    description: 'Du liest Spuren wie ein Buch. Erkundungs-Quests 20% schneller, +10% Item-Chance.',
    requires: ['w1_tierinstinkt'],
    cost: { xp: 60, light: 30, nutrients: 50 },
    bonus: { questTypeSpeedBonus: { explore: 0.20 }, itemChanceBonus: 0.10 },
    pos: { col: 3, row: 1 },
  },
  {
    id: 'w2_grabkraft', branch: 'wild', tier: 2,
    name: 'Grabkraft', emoji: '⛏️',
    description: 'Deine Klauen graben tiefer. Grabe-Quests 20% schneller, +15% Nährstoff-Belohnung.',
    requires: ['w1_tierinstinkt'],
    cost: { xp: 60, nutrients: 60, water: 20 },
    bonus: { questTypeSpeedBonus: { dig: 0.20 }, questResourceBonus: { nutrients: 0.15 } },
    pos: { col: 5, row: 1 },
  },
  {
    id: 'w3_beutenasenase', branch: 'wild', tier: 3,
    name: 'Beutennase', emoji: '👃',
    description: 'Du riechst seltene Items aus der Ferne. +20% Item-Chance, seltene Items ab Level 4.',
    requires: ['w2_spurenleser'],
    cost: { xp: 100, light: 60, nutrients: 80 },
    bonus: { itemChanceBonus: 0.20, rarityUnlock: 3 },
    pos: { col: 3, row: 2 },
  },
  {
    id: 'w3_tiefengraber', branch: 'wild', tier: 3,
    name: 'Tiefengraber', emoji: '🪨',
    description: 'Du gehörst zur Erde. Alle Quests 15% schneller, +20% Wasser aus Quests.',
    requires: ['w2_grabkraft'],
    cost: { xp: 100, nutrients: 100, water: 70 },
    bonus: { questSpeedBonus: 0.15, questResourceBonus: { water: 0.20 } },
    pos: { col: 5, row: 2 },
  },
  {
    id: 'w4_naturjaeger', branch: 'wild', tier: 4,
    name: 'Naturjäger', emoji: '🌊',
    description: 'Das Tier und der Wald sind eins. Alle Quests 25% schneller, +30% alle Item-Chancen.',
    requires: ['w3_beutenasenase', 'w3_tiefengraber'],
    cost: { xp: 200, light: 100, nutrients: 150, water: 100 },
    bonus: { questSpeedBonus: 0.25, itemChanceBonus: 0.30 },
    pos: { col: 4, row: 3 },
  },

  // ══ HARMONIE-ZWEIG 🍄 (Symbiose, Wald, Krisen) ═════════════════════
  {
    id: 'h1_myzelnetz', branch: 'harmonie', tier: 1,
    name: 'Myzel-Netz', emoji: '🍄',
    description: 'Erste Verbindungen im Untergrund. +0.3 Symbiose/s passiv.',
    requires: [],
    cost: { xp: 30, water: 30, nutrients: 20 },
    bonus: { symbiosisPassive: 0.3 },
    pos: { col: 7, row: 0 },
  },
  {
    id: 'h2_baumfluesterer', branch: 'harmonie', tier: 2,
    name: 'Baumflüsterer', emoji: '🌻',
    description: 'Du sprichst die Sprache der Bäume. Jeder Waldbaum gibt +0.4 extra Symbiose.',
    requires: ['h1_myzelnetz'],
    cost: { xp: 60, water: 50, symbiosis: 30 },
    bonus: { forestSymbiosisBonus: 0.4 },
    pos: { col: 6, row: 1 },
  },
  {
    id: 'h2_krisengeist', branch: 'harmonie', tier: 2,
    name: 'Krisengeist', emoji: '🆘',
    description: 'Krisen-Quests geben 20% mehr Schutz und enden 15% schneller.',
    requires: ['h1_myzelnetz'],
    cost: { xp: 60, nutrients: 40, symbiosis: 25 },
    bonus: { crisisDamageReductionBonus: 0.20, crisisQuestSpeedBonus: 0.15 },
    pos: { col: 8, row: 1 },
  },
  {
    id: 'h3_waldweber', branch: 'harmonie', tier: 3,
    name: 'Waldweber', emoji: '🪼',
    description: 'Dein Netz verbindet jeden Baum. Wald-Boni +25%, Symbiose-Tick +0.5/s.',
    requires: ['h2_baumfluesterer'],
    cost: { xp: 100, water: 80, symbiosis: 80 },
    bonus: { forestBonusMultiplier: 0.25, symbiosisPassive: 0.5 },
    pos: { col: 6, row: 2 },
  },
  {
    id: 'h3_notfallinstinkt', branch: 'harmonie', tier: 3,
    name: 'Notfallinstinkt', emoji: '⚡',
    description: 'Du spürst Krisen bevor sie kommen. Krisenschaden -25%, Krisen-Quests sofort verfügbar.',
    requires: ['h2_krisengeist'],
    cost: { xp: 100, nutrients: 80, symbiosis: 70 },
    bonus: { eventDamageReduction: 0.25, crisisQuestSpeedBonus: 0.25 },
    pos: { col: 8, row: 2 },
  },
  {
    id: 'h4_naturwaecher', branch: 'harmonie', tier: 4,
    name: 'Naturwächter', emoji: '🌍',
    description: 'Höchste Stufe: Der Wald atmet durch dich. Alle Wald-Boni +40%, Krisenschaden -40%, +1 Symbiose/s.',
    requires: ['h3_waldweber', 'h3_notfallinstinkt'],
    cost: { xp: 200, water: 150, nutrients: 150, symbiosis: 200 },
    bonus: { forestBonusMultiplier: 0.40, eventDamageReduction: 0.40, symbiosisPassive: 1.0 },
    pos: { col: 7, row: 3 },
  },

  // ══ VERBINDUNGS-SKILLS (zweig-übergreifend, Tier 3) ═════════════════════
  {
    id: 'x1_lebendpfad', branch: 'cross', tier: 3,
    name: 'Lebendpfad', emoji: '🌟',
    description: 'Natur und Wild vereint: +12% Alle Raten, Quests 12% schneller.',
    requires: ['n2_sonnenritual', 'w2_spurenleser'],
    cost: { xp: 120, light: 80, nutrients: 80 },
    bonus: { allRatesBonus: 0.12, questSpeedBonus: 0.12 },
    pos: { col: 2, row: 2 },
  },
  {
    id: 'x2_wurzelbund', branch: 'cross', tier: 3,
    name: 'Wurzelbund', emoji: '🪴',
    description: 'Wild und Harmonie vereint: +0.6 Symbiose/s, Grabe-Quests füllen Wald-Netz.',
    requires: ['w2_grabkraft', 'h2_baumfluesterer'],
    cost: { xp: 120, nutrients: 100, symbiosis: 50 },
    bonus: { symbiosisPassive: 0.6, questResourceBonus: { symbiosis: 0.20 } },
    pos: { col: 6, row: 2 },
  },
  {
    id: 'x3_oekoseele', branch: 'cross', tier: 4,
    name: 'Ökoseele', emoji: '🌌',
    description: 'Alle drei Zweige vereint: +20% Alle Raten, +20% alle Quests, -30% Krisenschaden.',
    requires: ['n4_urbaum', 'w4_naturjaeger', 'h4_naturwaecher'],
    cost: { xp: 400, light: 300, water: 300, nutrients: 300, symbiosis: 300 },
    bonus: { allRatesBonus: 0.20, questSpeedBonus: 0.20, eventDamageReduction: 0.30 },
    pos: { col: 4, row: 4 },
  },
];

// Branch-Metadaten für UI
export const SKILL_BRANCHES = {
  natur:    { label: '🌿 Natur',    color: '#80d060', bgColor: 0x0a1a08 },
  wild:     { label: '🐾 Wild',     color: '#d0a040', bgColor: 0x1a1008 },
  harmonie: { label: '🍄 Harmonie', color: '#60c0d0', bgColor: 0x081a1a },
  cross:    { label: '🌌 Verbund',  color: '#d0a0ff', bgColor: 0x120818 },
};
