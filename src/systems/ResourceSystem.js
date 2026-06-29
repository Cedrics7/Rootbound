import { RESOURCES, SEASONS } from '../config/seasons.js';

/**
 * ResourceSystem – verwaltet Licht, Wasser, Nährstoffe und Symbiose.
 */
export class ResourceSystem {
  constructor() {
    this._res = {};
    for (const [key, def] of Object.entries(RESOURCES)) {
      this._res[key] = {
        ...def,
        value: def.max * 0.3,
      };
    }
  }

  /**
   * Wird jede Sekunde aufgerufen.
   */
  tick(seasonId, phaseIndex, bonuses, eventEffect) {
    const season = SEASONS.find(s => s.id === seasonId);
    const mult   = season ? season.resourceMultiplier : { light: 1, water: 1, nutrients: 1, symbiosis: 1 };
    const phaseBonus = 1 + phaseIndex * 0.15;

    for (const [key, res] of Object.entries(this._res)) {
      let rate = res.baseRate * (mult[key] ?? 1) * phaseBonus;

      if (key === 'light')     rate *= (1 + (bonuses.lightRateBonus     ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'water')     rate *= (1 + (bonuses.waterRateBonus     ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'nutrients') rate *= (1 + (bonuses.nutrientsRateBonus ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'symbiosis') rate *= (1 + (bonuses.allRatesBonus ?? 0));

      // Wasser-Drain-Reduktion bei negativer Rate
      if (key === 'water' && rate < 0) rate *= (1 - (bonuses.waterDrainReduction ?? 0));

      // Event-Effekte
      rate += (eventEffect?.[key] ?? 0);

      res.value = Math.max(0, Math.min(res.max, res.value + rate));
    }
  }

  get(key)  { return this._res[key]?.value ?? 0; }
  getAll()  { return this._res; }

  add(delta) {
    for (const [key, val] of Object.entries(delta)) {
      if (this._res[key]) {
        this._res[key].value = Math.max(0, Math.min(this._res[key].max, this._res[key].value + val));
      }
    }
  }

  spend(cost) {
    for (const [key, amount] of Object.entries(cost)) {
      if ((this._res[key]?.value ?? 0) < amount) return false;
    }
    for (const [key, amount] of Object.entries(cost)) {
      this._res[key].value -= amount;
    }
    return true;
  }
}
