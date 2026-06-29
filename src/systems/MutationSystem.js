import { MUTATIONS } from '../config/seasons.js';

/**
 * Verwaltet Mutationen: Freischalten, Aktivieren, Boni berechnen
 */
export class MutationSystem {
  constructor() {
    // Deep-Copy aller Mutations-Definitionen
    this.mutations = MUTATIONS.map(m => ({ ...m }));
    this.crisesEncountered = new Set(); // gesehen Krisentypen
  }

  /** Setzt eine Krise als erlebt – schaltet Krisen-Mutationen frei */
  onCrisis(eventId) {
    this.crisesEncountered.add(eventId);
    // Krisen-Mutationen freischalten
    for (const m of this.mutations) {
      if (m.type === 'crisis' && m.requiredCrisis === eventId) {
        m.unlocked = true;
      }
    }
  }

  /** Gibt alle Mutationen zurück, die für die aktuelle Phase sichtbar sind */
  getAvailable(phaseIndex) {
    return this.mutations.filter(m => m.requiredPhase <= phaseIndex);
  }

  /** Versucht, eine Mutation zu aktivieren */
  activate(mutationId, resources) {
    const m = this.mutations.find(m => m.id === mutationId);
    if (!m || m.active) return { ok: false, reason: 'Bereits aktiv' };
    if (!m.unlocked && m.type !== 'crisis') {
      // Normales Freischalten: Kosten bezahlen
      const ok = resources.spend(m.cost);
      if (!ok) return { ok: false, reason: 'Nicht genug Ressourcen' };
      m.unlocked = true;
    } else if (m.type === 'crisis' && !m.unlocked) {
      return { ok: false, reason: 'Benötigt Krisen-Erfahrung' };
    }

    // Exklusivitäts-Check
    for (const exId of m.exclusiveWith) {
      const other = this.mutations.find(o => o.id === exId);
      if (other && other.active) {
        return { ok: false, reason: `Schließt ${other.name} aus` };
      }
    }

    m.active = true;
    return { ok: true };
  }

  /** Gibt die kombinierten Boni aller aktiven Mutationen zurück */
  getBonuses() {
    const bonuses = {
      lightRateBonus: 0,
      waterRateBonus: 0,
      nutrientsRateBonus: 0,
      allRatesBonus: 0,
      waterDrainReduction: 0,
    };
    for (const m of this.mutations) {
      if (!m.active) continue;
      const e = m.effect;
      if (e.lightRateBonus)      bonuses.lightRateBonus      += e.lightRateBonus;
      if (e.waterRateBonus)      bonuses.waterRateBonus      += e.waterRateBonus;
      if (e.nutrientsRateBonus)  bonuses.nutrientsRateBonus  += e.nutrientsRateBonus;
      if (e.allRatesBonus)       bonuses.allRatesBonus       += e.allRatesBonus;
      if (e.waterDrainReduction) bonuses.waterDrainReduction += e.waterDrainReduction;
    }
    return bonuses;
  }

  /** Anzahl aktiver Symbiose-Mutationen */
  getActiveSymbioses() {
    return this.mutations.filter(m => m.active && m.type === 'symbiosis').length;
  }

  getAll() { return this.mutations; }
}
