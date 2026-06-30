import { FOREST_TREE_TYPES, FOREST_SLOTS_PER_PHASE, ROOT_DEPTH_LEVELS } from '../config/forest.js';

/**
 * ForestSystem – verwaltet Waldbäume und Wurzel-Tiefenebenen.
 *
 * Waldbäume wachsen links/rechts vom Hauptbaum und geben
 * passive Ressourcen-Boni an den Hauptbaum weiter.
 *
 * Wurzeln graben sich mit der Zeit tiefer (Humus → Grundwasser → Erdadern).
 */
export class ForestSystem {
  constructor() {
    this.trees      = [];           // Gepflanzte Waldbäume: { type, slot, age, level }
    this.rootLevels = new Set(['humus']); // Freigeschaltete Tiefenebenen
    this._time      = 0;
  }

  // ── Wald-Bäume ──────────────────────────────────────────────────────────────

  getAvailableTypes(phaseIndex) {
    return FOREST_TREE_TYPES.filter(t => t.unlockPhase <= phaseIndex);
  }

  getSlots(phaseIndex) {
    return FOREST_SLOTS_PER_PHASE[Math.min(phaseIndex, FOREST_SLOTS_PER_PHASE.length - 1)];
  }

  canPlant(typeId, phaseIndex, resources) {
    if (this.trees.length >= this.getSlots(phaseIndex)) return { ok: false, reason: 'Kein freier Waldplatz' };
    const type = FOREST_TREE_TYPES.find(t => t.id === typeId);
    if (!type) return { ok: false, reason: 'Unbekannter Baumtyp' };
    if (type.unlockPhase > phaseIndex) return { ok: false, reason: 'Hauptbaum zu klein' };
    return { ok: true, type };
  }

  plant(typeId, phaseIndex, resources) {
    const check = this.canPlant(typeId, phaseIndex, resources);
    if (!check.ok) return check;
    if (!resources.spend(check.type.cost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
    const slot = this._nextSlot();
    this.trees.push({ id: typeId, type: check.type, slot, age: 0, level: 1, growthProgress: 0 });
    return { ok: true, tree: this.trees[this.trees.length - 1] };
  }

  _nextSlot() {
    const used = new Set(this.trees.map(t => t.slot));
    for (let i = 0; i < 12; i++) { if (!used.has(i)) return i; }
    return this.trees.length;
  }

  /** Passiver Ressourcen-Bonus aller Waldbäume für den Hauptbaum (pro Tick) */
  getForestBonus() {
    const bonus = { light: 0, water: 0, nutrients: 0, symbiosis: 0, allRatesBonus: 0, winterMalusReduction: 0 };
    for (const tree of this.trees) {
      for (const [key, val] of Object.entries(tree.type.passiveBonus)) {
        if (bonus[key] !== undefined) bonus[key] += val * tree.level;
      }
    }
    return bonus;
  }

  tick(delta) {
    this._time += delta;
    for (const tree of this.trees) {
      tree.age += delta;
      // Waldbäume wachsen langsam in Level 2 (nach 3 Minuten)
      if (tree.level < 2 && tree.age > 180_000) tree.level = 2;
    }
  }

  // ── Wurzel-Tiefenebenen ─────────────────────────────────────────────────────

  getAvailableDepths(phaseIndex) {
    return ROOT_DEPTH_LEVELS.filter(d => d.unlockPhase <= phaseIndex);
  }

  isUnlocked(depthId) {
    return this.rootLevels.has(depthId);
  }

  unlockDepth(depthId, phaseIndex, resources) {
    const level = ROOT_DEPTH_LEVELS.find(d => d.id === depthId);
    if (!level) return { ok: false, reason: 'Unbekannte Schicht' };
    if (this.rootLevels.has(depthId)) return { ok: false, reason: 'Bereits freigeschaltet' };
    if (level.unlockPhase > phaseIndex) return { ok: false, reason: 'Hauptbaum zu klein' };
    if (level.unlockCost && !resources.spend(level.unlockCost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
    this.rootLevels.add(depthId);
    return { ok: true, level };
  }

  /** Passiver Bonus aller freigeschalteten Tiefenebenen */
  getRootDepthBonus() {
    const bonus = { water: 0, nutrients: 0, symbiosis: 0, allRatesBonus: 0, waterFloor: 0, winterMalusReduction: 0 };
    for (const depthId of this.rootLevels) {
      const level = ROOT_DEPTH_LEVELS.find(d => d.id === depthId);
      if (!level) continue;
      for (const [key, val] of Object.entries(level.passiveBonus)) {
        if (bonus[key] !== undefined) bonus[key] += val;
        else if (key === 'waterFloor') bonus.waterFloor = Math.max(bonus.waterFloor, val);
      }
    }
    return bonus;
  }

  getUnlockedDepths() {
    return [...this.rootLevels].map(id => ROOT_DEPTH_LEVELS.find(d => d.id === id)).filter(Boolean);
  }

  // ── Serialisierung ──────────────────────────────────────────────────────────

  serialize() {
    return {
      trees: this.trees.map(t => ({ id: t.id, slot: t.slot, age: t.age, level: t.level })),
      rootLevels: [...this.rootLevels],
    };
  }

  restore(data) {
    this.rootLevels = new Set(data.rootLevels || ['humus']);
    this.trees = (data.trees || []).map(t => ({
      ...t,
      type: FOREST_TREE_TYPES.find(ft => ft.id === t.id),
    })).filter(t => t.type);
  }
}
