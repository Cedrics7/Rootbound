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
   * Tick: jede Sekunde
   */
  tick(seasonId, treePhase, mutationBonuses = {}, eventEffect = { light: 0, water: 0, nutrients: 0 }) {
    const season = SEASONS.find(s => s.id === seasonId);
    const phaseMultiplier = 1 + treePhase * 0.3;
    const allBonus   = 1 + (mutationBonuses.allRatesBonus || 0);
    const drainFactor = 1 - (mutationBonuses.waterDrainReduction || 0);

    for (const key of Object.keys(this.resources)) {
      const res = this.resources[key];
      let rate = res.baseRate * season.resourceMultiplier[key] * phaseMultiplier * allBonus;

      if (key === 'light')     rate *= 1 + (mutationBonuses.lightRateBonus     || 0);
      if (key === 'water')     rate *= 1 + (mutationBonuses.waterRateBonus     || 0);
      if (key === 'nutrients') rate *= 1 + (mutationBonuses.nutrientsRateBonus || 0);

      if (key === 'water' && rate < 0) rate *= drainFactor;

      rate += (eventEffect[key] || 0);

      res.value = Math.max(0, Math.min(res.max, res.value + rate));
    }
  }

  /**
   * Ressourcen ausgeben (alle Mengen m\u00fcssen positiv sein und vorhanden)
   */
  spend(costs) {
    for (const [key, amount] of Object.entries(costs)) {
      if ((this.resources[key]?.value ?? 0) < amount) return false;
    }
    for (const [key, amount] of Object.entries(costs)) {
      if (this.resources[key]) this.resources[key].value -= amount;
    }
    return true;
  }

  /**
   * Ressourcen direkt hinzuf\u00fcgen (f\u00fcr Klick-Boost etc.)
   */
  add(amounts) {
    for (const [key, amount] of Object.entries(amounts)) {
      if (this.resources[key]) {
        this.resources[key].value = Math.min(
          this.resources[key].max,
          this.resources[key].value + amount
        );
      }
    }
  }

  getAll() { return this.resources; }
  get(key) { return this.resources[key]?.value ?? 0; }
}
