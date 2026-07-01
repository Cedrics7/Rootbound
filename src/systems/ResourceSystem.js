/**
 * ResourceSystem – verwaltet light, water, nutrients, symbiosis, essence.
 * 'essence' (Lebensessenz) wird durch hohe Baum-Phasen und Skills generiert.
 *
 * API:
 *   get(key)        → number
 *   getAll()        → { [key]: { value, max, emoji, name } }  (UISystem-kompatibel)
 *   add(delta)      → void
 *   spend(cost)     → void
 *   tick(...)       → void
 *   serialize()     → plain object
 *   restore(data)   → void
 */
export class ResourceSystem {
  constructor() {
    this._res = {
      light:     100,
      water:     100,
      nutrients: 100,
      symbiosis: 0,
      essence:   0,
    };
    this._max = {
      light:     500,
      water:     500,
      nutrients: 500,
      symbiosis: 200,
      essence:   300,
    };
    // Metadaten für UISystem-Kompatibilität (getAll)
    this._meta = {
      light:     { emoji: '☀️',  name: 'Licht'     },
      water:     { emoji: '💧',  name: 'Wasser'    },
      nutrients: { emoji: '🌱',  name: 'Nährstoffe'},
      symbiosis: { emoji: '🔮',  name: 'Symbiose'  },
      essence:   { emoji: '💎',  name: 'Essenz'    },
    };
  }

  /** Einzelwert lesen */
  get(key) { return this._res[key] ?? 0; }

  /** Maximum lesen */
  getMax(key) { return this._max[key] ?? 999; }

  /**
   * getAll() – UISystem-kompatibles Format.
   * Gibt { [key]: { value, max, emoji, name } } zurück.
   */
  getAll() {
    const out = {};
    for (const key of Object.keys(this._res)) {
      out[key] = {
        value: this._res[key],
        max:   this._max[key],
        emoji: this._meta[key]?.emoji ?? '',
        name:  this._meta[key]?.name  ?? key,
      };
    }
    return out;
  }

  /** Ressourcen hinzufügen (positiv oder negativ) */
  add(delta) {
    for (const [k, v] of Object.entries(delta)) {
      if (!(k in this._res)) continue;
      this._res[k] = Math.max(0, Math.min(this._max[k], (this._res[k] ?? 0) + v));
    }
  }

  /** Kosten abziehen */
  spend(cost) {
    for (const [k, v] of Object.entries(cost)) {
      if (!(k in this._res)) continue;
      this._res[k] = Math.max(0, (this._res[k] ?? 0) - v);
    }
  }

  /**
   * tick() – wird jede Sekunde aus GameScene aufgerufen.
   * Berechnet Ressourcen-Generierung basierend auf Saison, Baum-Phase,
   * Boni (Mutationen, Wald, Tier, Skills) und Event-Effekten.
   */
  tick(seasonId, treePhaseIndex, bonuses = {}, eventEffect = {}) {
    // Basis-Raten pro Baum-Phase
    const phaseBase = [
      { light: 4,  water: 2,  nutrients: 1 },  // Phase 0
      { light: 7,  water: 3,  nutrients: 2 },  // Phase 1
      { light: 11, water: 5,  nutrients: 3 },  // Phase 2
      { light: 16, water: 8,  nutrients: 5 },  // Phase 3
      { light: 22, water: 12, nutrients: 8 },  // Phase 4
    ];
    const base = phaseBase[Math.min(treePhaseIndex, phaseBase.length - 1)];

    // Saison-Multiplikatoren
    const seasonMult = {
      spring: { light: 1.2, water: 1.1, nutrients: 1.0 },
      summer: { light: 1.4, water: 0.8, nutrients: 0.9 },
      autumn: { light: 0.9, water: 1.2, nutrients: 1.3 },
      winter: { light: 0.4, water: 0.5, nutrients: 0.6 },
    };
    const sm = seasonMult[seasonId] || seasonMult.spring;

    // Gesamt-Multiplikator aus Boni
    const allBonus = 1 + (bonuses.allRatesBonus || 0);

    const lightRate = base.light * sm.light * allBonus
      * (1 + (bonuses.lightRateBonus || 0))
      + (eventEffect.light || 0);

    const waterBase = base.water * sm.water * allBonus
      * (1 + (bonuses.waterRateBonus || 0));
    const waterDrain = waterBase * (bonuses.waterDrainReduction || 0);
    const waterRate  = waterBase - waterDrain + (eventEffect.water || 0);

    const nutrientsRate = base.nutrients * sm.nutrients * allBonus
      * (1 + (bonuses.nutrientsRateBonus || 0))
      + (eventEffect.nutrients || 0);

    // Essenz-Generierung: ab Baum-Phase 2, durch Skills beschleunigt
    const essenceRate = (treePhaseIndex >= 2 ? (treePhaseIndex - 1) * 0.15 : 0)
      + (bonuses.essenceRate || 0);

    this.add({
      light:     Math.max(0, lightRate),
      water:     Math.max(0, waterRate),
      nutrients: Math.max(0, nutrientsRate),
      essence:   essenceRate,
    });
  }

  serialize() { return { ...this._res }; }
  restore(data) {
    if (!data) return;
    for (const k of Object.keys(this._res)) {
      if (data[k] !== undefined) this._res[k] = data[k];
    }
  }
}
