import { FOREST_TREE_TYPES } from '../config/seasons.js';

/**
 * ForestSystem – verwaltet Begleitbäume im Wald.
 * Maximal 6 Slots (3 links, 3 rechts vom Hauptbaum).
 * Jeder Baum gibt passiv Ressourcen an den Hauptbaum.
 */
export class ForestSystem {
  constructor() {
    // slots: Array von { typeId, level, x, side } oder null
    this._slots = Array(6).fill(null);
    this._types = FOREST_TREE_TYPES;
  }

  // ── Pflanzen / Leveln ───────────────────────────────────────────

  plant(slotIndex, typeId, resources, phaseIndex) {
    if (slotIndex < 0 || slotIndex >= 6) return { ok: false, reason: 'Ungültiger Slot' };
    if (this._slots[slotIndex]) return { ok: false, reason: 'Slot belegt' };
    const type = this._types.find(t => t.id === typeId);
    if (!type) return { ok: false, reason: 'Unbekannter Baumtyp' };
    if (phaseIndex < type.unlockPhase) return { ok: false, reason: type.name + ' erst ab Phase ' + (type.unlockPhase + 1) };
    if (!resources.spend(type.plantCost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
    this._slots[slotIndex] = { typeId, level: 1 };
    return { ok: true };
  }

  levelUp(slotIndex, resources) {
    const slot = this._slots[slotIndex];
    if (!slot) return { ok: false, reason: 'Kein Baum in diesem Slot' };
    const type = this._types.find(t => t.id === slot.typeId);
    if (!type) return { ok: false, reason: 'Unbekannter Typ' };
    if (slot.level >= type.maxLevel) return { ok: false, reason: 'Maximale Stufe erreicht' };
    const cost = type.levelUpCost[slot.level]; // levelUpCost[0]=null, [1]=cost für->2, [2]=cost für->3
    if (!cost) return { ok: false, reason: 'Kein Upgrade verfügbar' };
    if (!resources.spend(cost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
    slot.level++;
    return { ok: true, level: slot.level };
  }

  remove(slotIndex) {
    this._slots[slotIndex] = null;
  }

  // ── Ressourcen-Beitrag ───────────────────────────────────────────

  /** Gibt pro Sekunde-Tick zurück, wie viel jeder Baum dem Hauptbaum gibt */
  getTotalBonus() {
    const total = { light: 0, water: 0, nutrients: 0, symbiosis: 0 };
    for (const slot of this._slots) {
      if (!slot) continue;
      const type = this._types.find(t => t.id === slot.typeId);
      if (!type) continue;
      const bonus = type.bonusPerLevel[slot.level - 1];
      for (const key of Object.keys(total)) {
        total[key] += (bonus[key] ?? 0);
      }
    }
    // Synergie: Holunder verdoppelt alle Wald-Boni
    const hasElder = this._slots.some(s => s?.typeId === 'elder_tree');
    if (hasElder) {
      const elderSlot = this._slots.find(s => s?.typeId === 'elder_tree');
      const elderType = this._types.find(t => t.id === 'elder_tree');
      const elderBonus = elderType.bonusPerLevel[elderSlot.level - 1];
      // Holunder-Bonus selbst abziehen, dann doppelt
      for (const key of Object.keys(total)) {
        const without = total[key] - (elderBonus[key] ?? 0);
        total[key] = without * 2 + (elderBonus[key] ?? 0);
      }
    }
    return total;
  }

  /** Anzahl gepflanzter Bäume */
  getCount() { return this._slots.filter(Boolean).length; }

  /** Anzahl verschiedener Typen */
  getDistinctTypes() { return new Set(this._slots.filter(Boolean).map(s => s.typeId)).size; }

  getSlots() { return this._slots; }
  getTypes() { return this._types; }

  // ── Serialisierung ─────────────────────────────────────────────────

  serialize() { return { slots: this._slots }; }
  restore(data) { if (data?.slots) this._slots = data.slots.map(s => s ? { ...s } : null); }
}
