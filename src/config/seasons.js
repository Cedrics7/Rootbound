// Jahreszeiten-Konfiguration
export const SEASON_DURATION_MS = 60_000;

export const SEASONS = [
  {
    id: 'spring', name: 'Frühling', emoji: '🌸',
    skyTop: '#1a2e1a', skyBottom: '#2d5a27', groundColor: '#3d6b2a', ambientLight: '#a8d878',
    resourceMultiplier: { light: 1.2, water: 1.4, nutrients: 1.0, symbiosis: 1.3 },
    events: [
      { id: 'bloom',    name: 'Blütenpracht', emoji: '🌸', chance: 0.004, duration: 8000,
        effect: { light: +1.5, water: -0.3, nutrients: +0.5, symbiosis: +0.8 },
        description: 'Eine Blütenpracht verstärkt die Photosynthese!', color: 0xffb8d0 },
      { id: 'rain',     name: 'Frühlingsregen', emoji: '🌧️', chance: 0.005, duration: 9000,
        effect: { light: -0.4, water: +2.2, nutrients: +0.5, symbiosis: +0.3 },
        description: 'Warmer Regen nährt Wurzeln und Pilze.', color: 0x6090e0 },
    ],
    description: 'Schnelles Wachstum. Neue Arten wandern ein.',
  },
  {
    id: 'summer', name: 'Sommer', emoji: '☀️',
    skyTop: '#0a1a0a', skyBottom: '#1e4a10', groundColor: '#4a7a1e', ambientLight: '#f0e060',
    resourceMultiplier: { light: 1.5, water: 0.7, nutrients: 1.2, symbiosis: 1.6 },
    events: [
      { id: 'drought',   name: 'Dürre',      emoji: '🔥', chance: 0.006, duration: 10000,
        effect: { light: +0.5, water: -1.8, nutrients: -0.5, symbiosis: -0.3 },
        description: 'Extreme Hitze! Wasser verdunstet rapide.', color: 0xff6020 },
      { id: 'heatwave',  name: 'Hitzewelle', emoji: '🌡️', chance: 0.003, duration: 6000,
        effect: { light: +0.3, water: -1.2, nutrients: 0, symbiosis: 0 },
        description: 'Sengend heiß – Wasser ist knapp.', color: 0xffa040 },
      { id: 'pollinator', name: 'Bestäuber-Schwarm', emoji: '🐝', chance: 0.004, duration: 7000,
        effect: { light: 0, water: 0, nutrients: +0.8, symbiosis: +1.5 },
        description: 'Bienen und Schmetterlinge erhöhen die Symbiose.', color: 0xf0d020 },
    ],
    description: 'Maximale Symbiose. Aber Brandgefahr.',
  },
  {
    id: 'autumn', name: 'Herbst', emoji: '🍂',
    skyTop: '#1a1005', skyBottom: '#3d2a10', groundColor: '#5a3a0a', ambientLight: '#e08030',
    resourceMultiplier: { light: 0.9, water: 1.1, nutrients: 1.5, symbiosis: 0.9 },
    events: [
      { id: 'windstorm', name: 'Herbststurm', emoji: '🌪️', chance: 0.005, duration: 7000,
        effect: { light: -0.8, water: +1.0, nutrients: -0.6, symbiosis: -0.5 },
        description: 'Ein Sturm fegt über das Land – Ressourcen schwinden!', color: 0xd07020 },
      { id: 'harvest',   name: 'Erntesegen',  emoji: '🍄', chance: 0.004, duration: 6000,
        effect: { light: 0, water: 0, nutrients: +2.5, symbiosis: +1.0 },
        description: 'Gefallene Blätter nähren den Boden.', color: 0x90c040 },
      { id: 'migration', name: 'Vogelzug',    emoji: '🐦', chance: 0.003, duration: 5000,
        effect: { light: 0, water: 0, nutrients: +0.5, symbiosis: +1.2 },
        description: 'Ziehende Vögel verbreiten Samen und stärken das Netz.', color: 0xc0d0f0 },
    ],
    description: 'Ressourcen sammeln für den Winter.',
  },
  {
    id: 'winter', name: 'Winter', emoji: '❄️',
    skyTop: '#050a14', skyBottom: '#0a1a2e', groundColor: '#c8d8e8', ambientLight: '#6090c0',
    resourceMultiplier: { light: 0.5, water: 0.6, nutrients: 0.4, symbiosis: 0.3 },
    events: [
      { id: 'blizzard', name: 'Schneesturm', emoji: '❄️', chance: 0.005, duration: 12000,
        effect: { light: -1.0, water: -0.8, nutrients: -1.0, symbiosis: -0.8 },
        description: 'Ein Blizzard zieht auf! Alle Ressourcen sinken.', color: 0xa0c8f0 },
      { id: 'frost',    name: 'Frost',       emoji: '🧊', chance: 0.007, duration: 8000,
        effect: { light: -0.5, water: -0.5, nutrients: -0.8, symbiosis: -0.4 },
        description: 'Tiefer Frost – Nährstoffe gefrieren im Boden.', color: 0x80a8ff },
      { id: 'thaw',     name: 'Tauwetter',   emoji: '💧', chance: 0.003, duration: 5000,
        effect: { light: +0.3, water: +1.5, nutrients: +0.3, symbiosis: +0.2 },
        description: 'Ein kurzes Tauwetter – nutze die Chance!', color: 0x80c0f0 },
    ],
    description: 'Überlebensmodus. Falsche Mutationen töten Arten.',
  },
];

// ── Baum-Phasen (5 Stufen) ────────────────────────────────────────────────
export const TREE_PHASES = [
  {
    id: 'seedling', name: 'Sämling',
    trunkHeight: 60,  trunkWidth: 8,  levels: 2, branchSpread: 40,
    growthCost: null, requiredSymbioses: 0, leafColor: 0x4a9a3a,
    description: 'Ein kleines Bäumchen. Voller Potenzial.',
    upgradeSlots: 1,   // Anzahl aktivierbarer Mutationen in dieser Phase
  },
  {
    id: 'young', name: 'Junger Baum',
    trunkHeight: 120, trunkWidth: 14, levels: 3, branchSpread: 70,
    growthCost: { light: 80, water: 40, nutrients: 20 },
    requiredSymbioses: 0, leafColor: 0x3a8a2a,
    description: 'Die Krone wird sichtbar. Erste Wurzeln greifen tief.',
    upgradeSlots: 2,
  },
  {
    id: 'grown', name: 'Ausgewachsener Baum',
    trunkHeight: 200, trunkWidth: 22, levels: 4, branchSpread: 110,
    growthCost: { light: 200, water: 100, nutrients: 80 },
    requiredSymbioses: 2, leafColor: 0x2a7a1a,
    description: 'Breite Krone. Das Netzwerk beginnt.',
    upgradeSlots: 3,
  },
  {
    id: 'elder', name: 'Alter Baum',
    trunkHeight: 260, trunkWidth: 28, levels: 5, branchSpread: 140,
    growthCost: { light: 350, water: 200, nutrients: 160 },
    requiredSymbioses: 3, leafColor: 0x1e6a14,
    description: 'Jahrzehnte alt. Symbionten siedeln sich an.',
    upgradeSlots: 4,
  },
  {
    id: 'ancient', name: 'Urbaum',
    trunkHeight: 330, trunkWidth: 36, levels: 6, branchSpread: 170,
    growthCost: { light: 600, water: 350, nutrients: 280 },
    requiredSymbioses: 5, leafColor: 0x1a6010,
    description: 'Ein Jahrtausende alter Riese. Das Ökosystem zentriert sich um dich.',
    upgradeSlots: 6,
  },
];

// ── Ressourcen ────────────────────────────────────────────────────────────
export const RESOURCES = {
  light:     { name: 'Licht',      emoji: '☀️', color: '#f0e060', max: 500, baseRate: 0.8 },
  water:     { name: 'Wasser',     emoji: '💧', color: '#60a0f0', max: 500, baseRate: 0.5 },
  nutrients: { name: 'Nährstoffe', emoji: '🌱', color: '#80c040', max: 500, baseRate: 0.3 },
  symbiosis: { name: 'Symbiose',   emoji: '🪸', color: '#40d0a0', max: 500, baseRate: 0.15 },
};

// ── Mutationen (14 total, mit Upgrade-Stufen) ─────────────────────────────
// level: aktuelle Stufe (0 = nicht aktiv, 1–3 = aktiviert/upgegraded)
// upgrades: Array von Stufe-1, Stufe-2, Stufe-3 Definitionen
export const MUTATIONS = [
  // ── PASSIVE ──────────────────────────────────────────────────────────
  {
    id: 'deep_roots', name: 'Tiefe Wurzeln', emoji: '🌿', type: 'passive',
    requiredPhase: 0, exclusiveWith: [],
    lore: 'Unter der Erde träumt der Baum von Meeren, die längst verschwunden sind.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Tiefere Wurzeln. Wasser +40%.', cost: { light: 60, water: 20, nutrients: 30 },
        effect: { waterRateBonus: 0.4 }, visual: { rootExtra: 2 } },
      { level: 2, description: 'Wurzeln erreichen Grundwasser. Wasser +70%. Dürre-Schutz -20%.', cost: { light: 100, water: 40, nutrients: 60 },
        effect: { waterRateBonus: 0.7, droughtReduction: 0.2 }, visual: { rootExtra: 4 } },
      { level: 3, description: 'Uralte Wasseradern angezapft. Wasser +120%. Kein Verdursten.', cost: { light: 200, water: 80, nutrients: 120 },
        effect: { waterRateBonus: 1.2, waterFloor: 5 }, visual: { rootExtra: 7, rootGlow: true } },
    ],
  },
  {
    id: 'thick_bark', name: 'Dicke Rinde', emoji: '🪵', type: 'passive',
    requiredPhase: 1, exclusiveWith: ['bioluminescence'],
    lore: 'Jahresringe erzählen von Stürmen, die der Baum überstand.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Dickere Rinde. Alle Verluste durch Events -15%.', cost: { light: 50, water: 30, nutrients: 50 },
        effect: { eventDamageReduction: 0.15 }, visual: {} },
      { level: 2, description: 'Gehärtete Rinde. Event-Verluste -30%. Stamm sieht vernarbt aus.', cost: { light: 120, water: 60, nutrients: 100 },
        effect: { eventDamageReduction: 0.30 }, visual: { trunkScar: true } },
      { level: 3, description: 'Steinrinde. Event-Verluste -50%. Immun gegen Frost.', cost: { light: 250, water: 120, nutrients: 200 },
        effect: { eventDamageReduction: 0.50, frostImmune: true }, visual: { trunkScar: true, trunkColorTint: 0x605040 } },
    ],
  },
  {
    id: 'photosynthesis_plus', name: 'Sonnenblätter', emoji: '☀️', type: 'passive',
    requiredPhase: 0, exclusiveWith: [],
    lore: 'Manche Blätter sind so groß, dass Vögel darunter schlafen.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Breitere Blätter. Licht +30%.', cost: { light: 40, water: 20, nutrients: 15 },
        effect: { lightRateBonus: 0.3 }, visual: {} },
      { level: 2, description: 'Riesige Blätter. Licht +60%. Blätter werden heller.', cost: { light: 100, water: 40, nutrients: 50 },
        effect: { lightRateBonus: 0.6 }, visual: { leafSizeBonus: 0.3 } },
      { level: 3, description: 'Photosynthetische Perfektion. Licht +100%. Licht nie unter 10.', cost: { light: 220, water: 80, nutrients: 100 },
        effect: { lightRateBonus: 1.0, lightFloor: 10 }, visual: { leafSizeBonus: 0.6, leafGlow: true, leafColor: 0xf8f040 } },
    ],
  },
  // ── AKTIV ─────────────────────────────────────────────────────────────
  {
    id: 'bioluminescence', name: 'Biolumineszenz', emoji: '✨', type: 'active',
    requiredPhase: 1, exclusiveWith: ['fire_bark', 'thick_bark'],
    lore: 'In der Nacht leuchtet der Wald wie ein lebendiger Sternenhimmel.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Blätter leuchten. Nährstoffe +50%, Wasser -20%.', cost: { light: 120, water: 50, nutrients: 40 },
        effect: { nutrientsRateBonus: 0.5, waterRateBonus: -0.2 }, visual: { leafGlow: true, leafColor: 0x40ff80 } },
      { level: 2, description: 'Pulsierendes Leuchten. Nährstoffe +90%, Wasser -15%. Lockt Tiere.', cost: { light: 220, water: 60, nutrients: 80 },
        effect: { nutrientsRateBonus: 0.9, waterRateBonus: -0.15, symbiosis: 0.3 }, visual: { leafGlow: true, leafColor: 0x20ff60, glowRadius: 1.8 } },
      { level: 3, description: 'Geisterlicht. Nährstoffe +150%. Symbionten werden magisch angezogen.', cost: { light: 400, water: 80, nutrients: 160 },
        effect: { nutrientsRateBonus: 1.5, waterRateBonus: -0.1, symbiosisBonus: 0.6 }, visual: { leafGlow: true, leafColor: 0x00ffaa, glowRadius: 2.5 } },
    ],
  },
  {
    id: 'sun_crown', name: 'Sonnen-Krone', emoji: '🌞', type: 'active',
    requiredPhase: 1, exclusiveWith: [],
    lore: 'Manche Bäume verbiegen ihr ganzes Leben, um dem Licht zu folgen.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Krone zur Sonne. Licht +60%.', cost: { light: 150, water: 30, nutrients: 60 },
        effect: { lightRateBonus: 0.6 }, visual: { leafColor: 0xf0d020, crownTilt: true } },
      { level: 2, description: 'Goldene Krone. Licht +110%. Blätter glänzen golden.', cost: { light: 280, water: 50, nutrients: 120 },
        effect: { lightRateBonus: 1.1 }, visual: { leafColor: 0xffc000, crownTilt: true, leafSizeBonus: 0.2 } },
      { level: 3, description: 'Sonnengott-Krone. Licht +180%. Treibt Symbionten an.', cost: { light: 500, water: 80, nutrients: 220 },
        effect: { lightRateBonus: 1.8, allRatesBonus: 0.1 }, visual: { leafColor: 0xffe000, crownTilt: true, leafSizeBonus: 0.5, leafGlow: true } },
    ],
  },
  {
    id: 'rain_call', name: 'Regenruf', emoji: '🌧️', type: 'active',
    requiredPhase: 2, exclusiveWith: [],
    lore: 'Die Transpiration des Baumes verändert das lokale Klima.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Baum zieht leichten Regen an. Wasser +35%.', cost: { light: 100, water: 80, nutrients: 60 },
        effect: { waterRateBonus: 0.35 }, visual: {} },
      { level: 2, description: 'Regenwolken entstehen. Wasser +70%. Frühlingsereignisse häufiger.', cost: { light: 200, water: 150, nutrients: 120 },
        effect: { waterRateBonus: 0.7, eventChanceBonus: { rain: 0.5 } }, visual: { cloudParticles: true } },
      { level: 3, description: 'Meister des Wetters. Wasser +120%. Dürren 50% seltener.', cost: { light: 380, water: 280, nutrients: 220 },
        effect: { waterRateBonus: 1.2, eventSuppression: { drought: 0.5, heatwave: 0.5 } }, visual: { cloudParticles: true } },
    ],
  },
  // ── SYMBIOSE ──────────────────────────────────────────────────────────
  {
    id: 'mycel_bridge', name: 'Myzelbrücke', emoji: '🍄', type: 'symbiosis',
    requiredPhase: 1, exclusiveWith: [],
    lore: 'Unter jedem Wald schlägt ein zweites Herz aus Pilzfäden.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Pilznetzwerk verbindet Ressourcen. Alle Raten +20%.', cost: { light: 80, water: 80, nutrients: 100 },
        effect: { allRatesBonus: 0.2 }, visual: { showMycel: true } },
      { level: 2, description: 'Dichtes Netz. Alle Raten +40%. Mehr Pilze sichtbar.', cost: { light: 160, water: 150, nutrients: 200 },
        effect: { allRatesBonus: 0.4 }, visual: { showMycel: true, mycelDensity: 2 } },
      { level: 3, description: 'Weltennetz. Alle Raten +70%. Symbionten teilen Ressourcen aktiv.', cost: { light: 320, water: 280, nutrients: 380 },
        effect: { allRatesBonus: 0.7, symbiosisPassiveBonus: 0.5 }, visual: { showMycel: true, mycelDensity: 3, mycelGlow: true } },
    ],
  },
  {
    id: 'root_network', name: 'Wurzelnetz', emoji: '🌐', type: 'symbiosis',
    requiredPhase: 2, exclusiveWith: [],
    lore: 'Ein Wald ist kein Wettbewerb – er ist ein Gespräch.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Wurzeln teilen Wasser. Symbiose +35%, Wasser +25%.', cost: { light: 60, water: 120, nutrients: 80 },
        effect: { allRatesBonus: 0.1, waterRateBonus: 0.25 }, visual: { rootExtra: 3 } },
      { level: 2, description: 'Weitverzweigtes Netz. Symbiose +60%, Alle +20%.', cost: { light: 140, water: 220, nutrients: 160 },
        effect: { allRatesBonus: 0.2, waterRateBonus: 0.4 }, visual: { rootExtra: 5 } },
      { level: 3, description: 'Lebendiges Erdnetz. Alle Raten +35%. Ressourcen können nicht auf 0 fallen.', cost: { light: 300, water: 400, nutrients: 300 },
        effect: { allRatesBonus: 0.35, waterRateBonus: 0.6, resourceFloor: 1 }, visual: { rootExtra: 8, rootGlow: true } },
    ],
  },
  {
    id: 'lichen_coat', name: 'Flechtenkranz', emoji: '🧫', type: 'symbiosis',
    requiredPhase: 2, exclusiveWith: [],
    lore: 'Flechten sind die ältesten Lebensformen — sie kennen Geduld.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Flechten auf der Rinde. Nährstoffe +30%, Wasser +15%.', cost: { light: 70, water: 60, nutrients: 90 },
        effect: { nutrientsRateBonus: 0.3, waterRateBonus: 0.15 }, visual: { lichens: true } },
      { level: 2, description: 'Dicker Flechtenteppich. Nährstoffe +60%. Symbiose +25%.', cost: { light: 160, water: 120, nutrients: 180 },
        effect: { nutrientsRateBonus: 0.6, symbiosisBonus: 0.25 }, visual: { lichens: true, lichenDense: true } },
      { level: 3, description: 'Uralte Flechten-Symbiose. Nährstoffe +100%. Alle Wintermalus halbiert.', cost: { light: 320, water: 240, nutrients: 360 },
        effect: { nutrientsRateBonus: 1.0, winterMalusReduction: 0.5 }, visual: { lichens: true, lichenDense: true, lichenGlow: true } },
    ],
  },
  // ── KRISEN ────────────────────────────────────────────────────────────
  {
    id: 'fire_bark', name: 'Feuerfeste Rinde', emoji: '🔥', type: 'crisis',
    requiredPhase: 1, requiredCrisis: 'drought', exclusiveWith: ['bioluminescence'],
    lore: 'Was das Feuer nicht bricht, macht es unsterblich.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Feuerfeste Rinde. Wasser-Verlust bei Dürre -30%.', cost: { light: 0, water: 0, nutrients: 0 },
        effect: { waterDrainReduction: 0.3 }, visual: { trunkColorTint: 0x8a2010 } },
      { level: 2, description: 'Ascheschicht. Wasser-Verlust -55%. Dürren dauern kürzer.', cost: { light: 80, water: 0, nutrients: 40 },
        effect: { waterDrainReduction: 0.55, droughtDurationReduction: 0.3 }, visual: { trunkColorTint: 0x6a1808 } },
      { level: 3, description: 'Phönix-Rinde. Wasser-Verlust -80%. Dürren geben Licht-Bonus.', cost: { light: 200, water: 0, nutrients: 100 },
        effect: { waterDrainReduction: 0.8, droughtLightBonus: 0.5 }, visual: { trunkColorTint: 0x501006, trunkGlow: 0xff4010 } },
    ],
  },
  {
    id: 'storm_roots', name: 'Sturmwurzeln', emoji: '🌪️', type: 'crisis',
    requiredPhase: 2, requiredCrisis: 'windstorm', exclusiveWith: [],
    lore: 'Der Sturm biegt – aber der Baum bricht nicht.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Sturmwurzeln. Sturm-Verluste -40%.', cost: { light: 0, water: 0, nutrients: 0 },
        effect: { stormDamageReduction: 0.4 }, visual: { rootExtra: 3 } },
      { level: 2, description: 'Stürme stärken den Baum. Sturm-Verluste -60%, danach Nährstoffe +20% für 30s.', cost: { light: 100, water: 50, nutrients: 60 },
        effect: { stormDamageReduction: 0.6, stormAfterBonus: { nutrients: 0.2, duration: 30000 } }, visual: { rootExtra: 5 } },
      { level: 3, description: 'Sturmmeister. Immun gegen Windschäden. Stürme laden Symbiose auf.', cost: { light: 250, water: 100, nutrients: 150 },
        effect: { stormDamageReduction: 1.0, stormSynergyBonus: 0.5 }, visual: { rootExtra: 7, rootGlow: true } },
    ],
  },
  {
    id: 'frost_heart', name: 'Frostherz', emoji: '🧊', type: 'crisis',
    requiredPhase: 1, requiredCrisis: 'frost', exclusiveWith: [],
    lore: 'Im Kern des Eises schlägt ein warmes Herz.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Frostresistenz. Alle Winter-Mali -25%.', cost: { light: 0, water: 0, nutrients: 0 },
        effect: { winterMalusReduction: 0.25 }, visual: {} },
      { level: 2, description: 'Eiskristall-Zellen. Winter-Mali -50%. Frost gibt Nährstoff-Bonus.', cost: { light: 60, water: 40, nutrients: 80 },
        effect: { winterMalusReduction: 0.5, frostNutrientsBonus: 0.3 }, visual: { leafColor: 0xc0e8ff } },
      { level: 3, description: 'Polarer Kern. Immun gegen Frost. Winter wie Herbst (Ressourcen).', cost: { light: 160, water: 100, nutrients: 200 },
        effect: { frostImmune: true, winterAsAutumn: true }, visual: { leafColor: 0xa0d0ff, leafGlow: true } },
    ],
  },
  // ── ELDER-EXCLUSIVE (Phase 3+) ─────────────────────────────────────────
  {
    id: 'ancient_wisdom', name: 'Uraltes Wissen', emoji: '🌍', type: 'passive',
    requiredPhase: 3, exclusiveWith: [],
    lore: 'Der Baum erinnert sich an Kontinente, die es nicht mehr gibt.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Jahrtausende Erfahrung. Alle Basisraten +25%.', cost: { light: 300, water: 200, nutrients: 200 },
        effect: { allRatesBonus: 0.25 }, visual: {} },
      { level: 2, description: 'Weltgedächtnis. Alle Basisraten +50%. Neue Arten erscheinen.', cost: { light: 600, water: 400, nutrients: 400 },
        effect: { allRatesBonus: 0.5, codexUnlockSpeed: 2 }, visual: { symbionts: ['owl', 'moss'] } },
      { level: 3, description: 'Lebende Legende. Alle Raten +80%. Symbionten agieren autonom.', cost: { light: 1200, water: 800, nutrients: 800 },
        effect: { allRatesBonus: 0.8, autonomousSymbionts: true }, visual: { symbionts: ['owl', 'moss', 'deer'] } },
    ],
  },
  {
    id: 'world_root', name: 'Weltenwurzel', emoji: '🌏', type: 'symbiosis',
    requiredPhase: 4, exclusiveWith: [],
    lore: 'Wenn der Urbaum atmet, bewegt sich die Welt.',
    unlocked: false, active: false, level: 0,
    upgrades: [
      { level: 1, description: 'Wurzeln verbinden alle Kontinente. Symbiose +100%.', cost: { light: 500, water: 500, nutrients: 500 },
        effect: { symbiosisBonus: 1.0, allRatesBonus: 0.3 }, visual: { rootExtra: 10, rootGlow: true } },
      { level: 2, description: 'Das Netz ist vollständig. Ressourcen regenerieren auch bei 0.', cost: { light: 1000, water: 1000, nutrients: 1000 },
        effect: { symbiosisBonus: 1.5, allRatesBonus: 0.5, resourceFloor: 5 }, visual: { rootExtra: 14, rootGlow: true, mycelGlow: true } },
      { level: 3, description: '🌍 ENDZIEL: Der Baum ist unsterblich. Das Ökosystem ist komplett.', cost: { light: 2000, water: 2000, nutrients: 2000 },
        effect: { immortal: true, allRatesBonus: 1.0 }, visual: { rootExtra: 20, rootGlow: true, mycelGlow: true, leafGlow: true } },
    ],
  },
];

// ── Symbionten-Definitionen ────────────────────────────────────────────────
export const SYMBIONTS = [
  { id: 'moss',     name: 'Moos',        emoji: '🌿', unlockCondition: 'lichen_coat_1',   visual: 'moss'   },
  { id: 'mushroom', name: 'Pilz',        emoji: '🍄', unlockCondition: 'mycel_bridge_1',  visual: 'mushroom' },
  { id: 'owl',      name: 'Eule',        emoji: '🦉', unlockCondition: 'ancient_wisdom_2', visual: 'owl'    },
  { id: 'deer',     name: 'Hirsch',      emoji: '🦌', unlockCondition: 'ancient_wisdom_3', visual: 'deer'   },
  { id: 'firefly',  name: 'Glühwürmchen',emoji: '🪲', unlockCondition: 'bioluminescence_2', visual: 'firefly' },
  { id: 'bee',      name: 'Biene',       emoji: '🐝', unlockCondition: 'sun_crown_2',     visual: 'bee'    },
];

// ── Codex-Einträge ─────────────────────────────────────────────────────────
export const CODEX_ENTRIES = [
  { id: 'myzel',       name: 'Myzel',             icon: '🍄', cat: 'Pilznetzwerke', cond: 'Bodenfeuchte ≥ 70%',           unlocked: false },
  { id: 'glowshroom',  name: 'Geisterpilz',        icon: '🟣', cat: 'Pilznetzwerke', cond: 'Biolumineszenz aktiv',         unlocked: false },
  { id: 'fireswamp',   name: 'Feuerschwamm',       icon: '🔴', cat: 'Pilznetzwerke', cond: 'Dürre-Event überleben',        unlocked: false },
  { id: 'firefly',     name: 'Glühwürmchen',       icon: '🪲', cat: 'Tiere',         cond: 'Biolumineszenz + Sommer',      unlocked: false },
  { id: 'boar',        name: 'Wildschwein',        icon: '🐗', cat: 'Tiere',         cond: '5+ Jahre, Nährstoffe > 300',   unlocked: false },
  { id: 'moth',        name: 'Riesenmotte',        icon: '🦋', cat: 'Tiere',         cond: 'Myzelbrücke + Nacht',          unlocked: false },
  { id: 'owl',         name: 'Eule',               icon: '🦉', cat: 'Tiere',         cond: 'Alter Baum + Winter',          unlocked: false },
  { id: 'deer',        name: 'Hirsch',             icon: '🦌', cat: 'Tiere',         cond: 'Urbaum erreicht',              unlocked: false },
  { id: 'bee',         name: 'Biene',              icon: '🐝', cat: 'Tiere',         cond: 'Bestäuber-Schwarm + Sommer',   unlocked: false },
  { id: 'sundew',      name: 'Sonnentau',          icon: '🌿', cat: 'Pflanzen',      cond: 'Frühling + Wasser > 350',      unlocked: false },
  { id: 'titan_arum',  name: 'Titanenwurz',        icon: '🌺', cat: 'Pflanzen',      cond: 'Jahr 10+, Symbiose > 300',     unlocked: false },
  { id: 'moonflower',  name: 'Mondblume',          icon: '🌙', cat: 'Pflanzen',      cond: 'Winter überleben + Biolum',    unlocked: false },
  { id: 'lichen',      name: 'Uralte Flechte',     icon: '🧫', cat: 'Pflanzen',      cond: 'Flechtenkranz Stufe 3',        unlocked: false },
  { id: 'parasite',    name: 'Schmarotzerpflanze', icon: '🦠', cat: 'Parasiten',     cond: 'Krisen-Event überleben',        unlocked: false },
  { id: 'eternal',     name: 'Ewiger Schwamm',     icon: '♾️', cat: 'Legendarys',    cond: 'Alle Pilze entdeckt',           unlocked: false },
  { id: 'worldroot',   name: 'Weltenwurzel',       icon: '🌍', cat: 'Legendarys',    cond: 'Weltenwurzel Stufe 3',          unlocked: false },
];
