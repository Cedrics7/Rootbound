import { RESOURCES, SEASONS } from '../config/seasons.js';

export class ResourceSystem {
  constructor() {
    this.resources = {
      light:     { value: RESOURCES.light.max * 0.2,     ...RESOURCES.light },
      water:     { value: RESOURCES.water.max * 0.2,     ...RESOURCES.water },
      nutrients: { value: RESOURCES.nutrients.max * 0.2, ...RESOURCES.nutrients },
    };
  }

  /**
   * Tick: wird jede Sekunde aufgerufen
   * @param {string} seasonId
   * @param {number} treePhase
   * @param {object} mutationBonuses  - { lightRateBonus, waterRateBonus, nutrientsRateBonus, allRatesBonus, waterDrainReduction }
   * @param {object} eventEffect      - { light, water, nutrients } – additiver Bonus aus Saison-Event
   */
  tick(seasonId, treePhase, mutationBonuses = {}, eventEffect = { light: 0, water: 0, nutrients: 0 }) {
    const season = SEASONS.find(s => s.id === seasonId);
    const phaseMultiplier = 1 + treePhase * 0.3;

    const allBonus = 1 + (mutationBonuses.allRatesBonus || 0);
    const drainFactor = 1 - (mutationBonuses.waterDrainReduction || 0);

    for (const key of Object.keys(this.resources)) {
      const res = this.resources[key];

      // Basis-Rate
      let rate = res.baseRate * season.resourceMultiplier[key] * phaseMultiplier * allBonus;

      // Mutations-Boni (pro Ressource)
      if (key === 'light')     rate *= 1 + (mutationBonuses.lightRateBonus     || 0);
      if (key === 'water')     rate *= 1 + (mutationBonuses.waterRateBonus     || 0);
      if (key === 'nutrients') rate *= 1 + (mutationBonuses.nutrientsRateBonus || 0);

      // Dürre/Frost-Drain-Reduktion (nur wenn negativ)
      if (key === 'water' && rate < 0) rate *= drainFactor;

      // Ereignis-Effekt (additiv, kann negativ sein)
      rate += (eventEffect[key] || 0);

      res.value = Math.max(0, Math.min(res.max, res.value + rate));
    }
  }

  /**
   * Ressource ausgeben
   * @param {object} costs - { light, water, nutrients }
   * @returns {boolean}
   */
  spend(costs) {
    // Validierung
    for (const [key, amount] of Object.entries(costs)) {
      if (amount > 0 && (this.resources[key]?.value ?? 0) < amount) return false;
    }
    for (const [key, amount] of Object.entries(costs)) {
      if (this.resources[key]) this.resources[key].value -= amount;
    }
    return true;
  }

  getAll() { return this.resources; }
  get(key) { return this.resources[key]?.value ?? 0; }
}
