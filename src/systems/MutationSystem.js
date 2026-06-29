import { MUTATIONS } from '../config/seasons.js';

export class MutationSystem {
  constructor() {
    this.mutations = MUTATIONS.map(m => ({ ...m }));
    this.crisesEncountered = new Set();
  }

  onCrisis(eventId) {
    this.crisesEncountered.add(eventId);
    for (const m of this.mutations) {
      if (m.type === 'crisis' && m.requiredCrisis === eventId) {
        m.unlocked = true; // Krise erlebt → freischalten
      }
    }
  }

  getAvailable(phaseIndex) {
    return this.mutations.filter(m => m.requiredPhase <= phaseIndex);
  }

  activate(mutationId, resources) {
    const m = this.mutations.find(m => m.id === mutationId);
    if (!m || m.active) return { ok: false, reason: 'Bereits aktiv' };

    // Exklusivitäts-Check
    for (const exId of (m.exclusiveWith || [])) {
      const other = this.mutations.find(o => o.id === exId);
      if (other?.active) return { ok: false, reason: `Schließt ${other.name} aus` };
    }

    if (m.type === 'crisis') {
      // Krise-Mutationen kosten nichts, müssen nur erlebt worden sein
      if (!m.unlocked) return { ok: false, reason: 'Benötigt Krisen-Erfahrung: ' + m.requiredCrisis };
    } else {
      const ok = resources.spend(m.cost);
      if (!ok) return { ok: false, reason: 'Nicht genug Ressourcen' };
      m.unlocked = true;
    }

    m.active = true;
    return { ok: true };
  }

  getBonuses() {
    const b = { lightRateBonus: 0, waterRateBonus: 0, nutrientsRateBonus: 0, allRatesBonus: 0, waterDrainReduction: 0 };
    for (const m of this.mutations) {
      if (!m.active) continue;
      const e = m.effect;
      if (e.lightRateBonus)      b.lightRateBonus      += e.lightRateBonus;
      if (e.waterRateBonus)      b.waterRateBonus      += e.waterRateBonus;
      if (e.nutrientsRateBonus)  b.nutrientsRateBonus  += e.nutrientsRateBonus;
      if (e.allRatesBonus)       b.allRatesBonus       += e.allRatesBonus;
      if (e.waterDrainReduction) b.waterDrainReduction += e.waterDrainReduction;
    }
    return b;
  }

  getActiveSymbioses() {
    return this.mutations.filter(m => m.active && m.type === 'symbiosis').length;
  }

  getAll() { return this.mutations; }
}
