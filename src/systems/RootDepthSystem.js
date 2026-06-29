import { ROOT_DEPTH_LEVELS } from '../config/seasons.js';

/**
 * RootDepthSystem – verwaltet 6 Tiefenebenen der Wurzeln.
 * Jede Ebene schaltet permanente Ressourcen-Boni + Codex-Entdeckungen frei.
 */
export class RootDepthSystem {
  constructor() {
    this._levels = ROOT_DEPTH_LEVELS.map(l => ({ ...l, reached: false }));
    // Humus ist von Anfang an erreicht
    this._levels[0].reached = true;
    this._currentDepth = 0;
  }

  get currentDepth() { return this._currentDepth; }
  get levels() { return this._levels; }

  /** Prüft, ob die nächste Tiefe erschlossen werden kann */
  canUnlock(phaseIndex, resources) {
    const next = this._levels[this._currentDepth + 1];
    if (!next) return { can: false, reason: 'Maximale Tiefe erreicht' };
    if (phaseIndex < next.unlockPhase) return { can: false, reason: next.name + ' erst ab Phase ' + (next.unlockPhase + 1) };
    if (next.unlockCost) {
      for (const [k, v] of Object.entries(next.unlockCost)) {
        if ((resources.get(k) ?? 0) < v) return { can: false, reason: 'Nicht genug ' + k };
      }
    }
    return { can: true, next };
  }

  /** Erschließt die nächste Tiefenebene */
  unlock(phaseIndex, resources) {
    const check = this.canUnlock(phaseIndex, resources);
    if (!check.can) return { ok: false, reason: check.reason };
    if (check.next.unlockCost) resources.spend(check.next.unlockCost);
    this._currentDepth++;
    this._levels[this._currentDepth].reached = true;
    return { ok: true, level: this._levels[this._currentDepth] };
  }

  /** Gesamtboni aller erreichten Ebenen pro Sekunde */
  getTotalBonus() {
    const total = { light: 0, water: 0, nutrients: 0, symbiosis: 0, allRatesBonus: 0 };
    for (const lvl of this._levels) {
      if (!lvl.reached) continue;
      for (const [k, v] of Object.entries(lvl.passiveBonus || {})) {
        total[k] = (total[k] ?? 0) + v;
      }
      if (lvl.allRatesBonus) total.allRatesBonus += lvl.allRatesBonus;
    }
    return total;
  }

  /** Wasser-Floor aus Grundwasser-Ebene */
  getWaterFloor() {
    const gwLevel = this._levels.find(l => l.id === 'groundwater');
    return (gwLevel?.reached && gwLevel?.waterFloor) ? gwLevel.waterFloor : 0;
  }

  getReachedLevels() { return this._levels.filter(l => l.reached); }
  getNextLevel()    { return this._levels[this._currentDepth + 1] ?? null; }

  // ── Serialisierung ─────────────────────────────────────────────────

  serialize() { return { currentDepth: this._currentDepth, reached: this._levels.map(l => l.reached) }; }
  restore(data) {
    if (!data) return;
    this._currentDepth = data.currentDepth ?? 0;
    if (data.reached) data.reached.forEach((r, i) => { if (this._levels[i]) this._levels[i].reached = r; });
  }
}
