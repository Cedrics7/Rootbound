import { RESOURCES } from '../config/seasons.js';

/**
 * ResourceSystem – verwaltet Licht, Wasser, Nährstoffe und Symbiose.
 */
export class ResourceSystem {
  constructor() {
    // Deep-Copy der Ressourcen-Definitionen mit aktuellem Wert
    this._res = {};
    for (const [key, def] of Object.entries(RESOURCES)) {
      this._res[key] = {
        ...def,
        value: def.max * 0.3, // Startwert: 30%
      };
    }
  }

  /**
   * Wird jede Sekunde aufgerufen.
   * @param {string} seasonId
   * @param {number} phaseIndex - Baum-Phase (höhere Phasen produzieren mehr)
   * @param {object} bonuses - aus MutationSystem.getBonuses()
   * @param {object} eventEffect - aus SeasonSystem.getEventEffect()
   */
  tick(seasonId, phaseIndex, bonuses, eventEffect) {
    // Saisonmultiplikatoren aus SEASONS config
    const { SEASONS } = this._getSeasonConfig();
    const season = SEASONS.find(s => s.id === seasonId);
    const mult = season ? season.resourceMultiplier : { light: 1, water: 1, nutrients: 1, symbiosis: 1 };

    const phaseBonus = 1 + phaseIndex * 0.15; // höhere Phase = etwas mehr Produktion

    for (const [key, res] of Object.entries(this._res)) {
      let rate = res.baseRate * (mult[key] ?? 1) * phaseBonus;

      // Mutations-Boni
      if (key === 'light')     rate *= (1 + (bonuses.lightRateBonus     ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'water')     rate *= (1 + (bonuses.waterRateBonus     ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'nutrients') rate *= (1 + (bonuses.nutrientsRateBonus ?? 0) + (bonuses.allRatesBonus ?? 0));
      if (key === 'symbiosis') rate *= (1 + (bonuses.allRatesBonus ?? 0));

      // Wasser-Drain-Reduktion
      if (key === 'water' && rate < 0) rate *= (1 - (bonuses.waterDrainReduction ?? 0));

      // Event-Effekte (additive Rate-Änderung)
      rate += (eventEffect[key] ?? 0);

      res.value = Math.max(0, Math.min(res.max, res.value + rate));
    }

    // Symbiose wird auch durch Mutations-Aktivität gespeist
    this._res.symbiosis.value = Math.min(
      this._res.symbiosis.max,
      this._res.symbiosis.value
    );
  }

  _getSeasonConfig() {
    // Lazy import workaround (avoid circular at module load)
    return require('../config/seasons.js');
  }

  get(key)     { return this._res[key]?.value ?? 0; }
  getAll()     { return this._res; }

  add(delta) {
    for (const [key, val] of Object.entries(delta)) {
      if (this._res[key]) {
        this._res[key].value = Math.max(0, Math.min(this._res[key].max, this._res[key].value + val));
      }
    }
  }

  /**
   * Versucht Ressourcen auszugeben.
   * @returns {boolean} true wenn erfolgreich
   */
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
