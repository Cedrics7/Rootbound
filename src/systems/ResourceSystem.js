import { RESOURCES, SEASONS } from '../config/seasons.js';

export class ResourceSystem {
  constructor() {
    // Initialisierung mit 20% der Maximalwerte
    this.resources = {
      light:     { value: RESOURCES.light.max * 0.2,     ...RESOURCES.light },
      water:     { value: RESOURCES.water.max * 0.2,     ...RESOURCES.water },
      nutrients: { value: RESOURCES.nutrients.max * 0.2, ...RESOURCES.nutrients },
    };
  }

  /**
   * Tick: wird jede Sekunde aufgerufen
   * @param {string} seasonId - aktuelle Jahreszeit
   * @param {number} treePhase - 0/1/2 (Sämling/Jung/Ausgewachsen)
   */
  tick(seasonId, treePhase) {
    const season = SEASONS.find(s => s.id === seasonId);
    const phaseMultiplier = 1 + treePhase * 0.3; // größerer Baum = mehr Ressourcen

    for (const key of Object.keys(this.resources)) {
      const res = this.resources[key];
      const rate = res.baseRate
        * season.resourceMultiplier[key]
        * phaseMultiplier;

      res.value = Math.min(res.max, res.value + rate);
    }
  }

  /**
   * Ressource ausgeben (z.B. für Mutationen)
   * @returns {boolean} Erfolg
   */
  spend(costs) {
    for (const [key, amount] of Object.entries(costs)) {
      if (this.resources[key].value < amount) return false;
    }
    for (const [key, amount] of Object.entries(costs)) {
      this.resources[key].value -= amount;
    }
    return true;
  }

  getAll() {
    return this.resources;
  }

  get(key) {
    return this.resources[key].value;
  }
}
