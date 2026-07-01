import { MUTATIONS } from '../config/seasons.js';

/**
 * MutationSystem – verwaltet 14 Mutationen mit je 3 Upgrade-Stufen.
 * level 0 = nicht aktiv, 1/2/3 = aktiviert/upgegraded
 */
export class MutationSystem {
  constructor() {
    this.mutations = MUTATIONS.map(m => ({ ...m, upgrades: m.upgrades.map(u => ({ ...u })) }));
    this.crisesEncountered = new Set();
    this._geneticLightBonus = 0;
    this._tempBonuses = {};
  }

  onCrisis(eventId) {
    this.crisesEncountered.add(eventId);
    for (const m of this.mutations) {
      if (m.type === 'crisis' && m.requiredCrisis === eventId) {
        m.unlocked = true;
      }
    }
  }

  getAvailable(phaseIndex) {
    return this.mutations.filter(m => m.requiredPhase <= phaseIndex);
  }

  activate(mutationId, resources) {
    const m = this.mutations.find(m => m.id === mutationId);
    if (!m) return { ok: false, reason: 'Unbekannte Mutation' };

    const targetLevel = m.level + 1;
    if (targetLevel > m.upgrades.length) return { ok: false, reason: 'Maximale Stufe erreicht' };

    const upgrade = m.upgrades[targetLevel - 1];

    if (targetLevel === 1) {
      for (const exId of (m.exclusiveWith || [])) {
        const other = this.mutations.find(o => o.id === exId);
        if (other?.active) return { ok: false, reason: `Schließt ${other.name} aus` };
      }
    }

    if (m.type === 'crisis') {
      if (!m.unlocked) return { ok: false, reason: 'Benötigt Krise: ' + m.requiredCrisis };
      if (targetLevel > 1) {
        if (!resources.spend(upgrade.cost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
      }
    } else {
      if (!resources.spend(upgrade.cost)) return { ok: false, reason: 'Nicht genug Ressourcen' };
      m.unlocked = true;
    }

    m.level = targetLevel;
    m.active = true;
    return { ok: true, level: targetLevel };
  }

  getBonuses() {
    const b = {
      lightRateBonus: 0, waterRateBonus: 0, nutrientsRateBonus: 0,
      allRatesBonus: 0, waterDrainReduction: 0, eventDamageReduction: 0,
      winterMalusReduction: 0, stormDamageReduction: 0, symbiosisBonus: 0,
      lightFloor: 0, waterFloor: 0, resourceFloor: 0, immortal: false,
    };
    for (const m of this.mutations) {
      if (!m.active || m.level === 0) continue;
      const e = m.upgrades[m.level - 1].effect;
      if (e.lightRateBonus)        b.lightRateBonus        += e.lightRateBonus;
      if (e.waterRateBonus)        b.waterRateBonus        += e.waterRateBonus;
      if (e.nutrientsRateBonus)    b.nutrientsRateBonus    += e.nutrientsRateBonus;
      if (e.allRatesBonus)         b.allRatesBonus         += e.allRatesBonus;
      if (e.waterDrainReduction)   b.waterDrainReduction   += e.waterDrainReduction;
      if (e.eventDamageReduction)  b.eventDamageReduction  += e.eventDamageReduction;
      if (e.winterMalusReduction)  b.winterMalusReduction  += e.winterMalusReduction;
      if (e.stormDamageReduction)  b.stormDamageReduction  += e.stormDamageReduction;
      if (e.symbiosisBonus)        b.symbiosisBonus        += e.symbiosisBonus;
      if (e.lightFloor)            b.lightFloor             = Math.max(b.lightFloor, e.lightFloor);
      if (e.waterFloor)            b.waterFloor             = Math.max(b.waterFloor, e.waterFloor);
      if (e.resourceFloor)         b.resourceFloor          = Math.max(b.resourceFloor, e.resourceFloor);
      if (e.immortal)              b.immortal               = true;
    }
    return b;
  }

  getActiveSymbioses() {
    return this.mutations.filter(m => m.active && m.type === 'symbiosis').length;
  }

  getVisuals() {
    const v = {
      leafColor: null, leafGlow: false, leafSizeBonus: 0,
      crownTilt: false, trunkColorTint: null, trunkGlow: null,
      rootExtra: 0, rootGlow: false,
      showMycel: false, mycelDensity: 1, mycelGlow: false,
      lichens: false, lichenDense: false, lichenGlow: false,
      symbionts: [],
    };
    for (const m of this.mutations) {
      if (!m.active || m.level === 0) continue;
      const vis = m.upgrades[m.level - 1].visual || {};
      if (vis.leafColor != null)   v.leafColor      = vis.leafColor;
      if (vis.leafGlow)            v.leafGlow        = true;
      if (vis.leafSizeBonus)       v.leafSizeBonus  += vis.leafSizeBonus;
      if (vis.crownTilt)           v.crownTilt       = true;
      if (vis.trunkColorTint)      v.trunkColorTint  = vis.trunkColorTint;
      if (vis.trunkGlow)           v.trunkGlow       = vis.trunkGlow;
      if (vis.rootExtra)           v.rootExtra      += vis.rootExtra;
      if (vis.rootGlow)            v.rootGlow        = true;
      if (vis.showMycel)           v.showMycel       = true;
      if (vis.mycelDensity)        v.mycelDensity    = Math.max(v.mycelDensity, vis.mycelDensity);
      if (vis.mycelGlow)           v.mycelGlow       = true;
      if (vis.lichens)             v.lichens         = true;
      if (vis.lichenDense)         v.lichenDense     = true;
      if (vis.lichenGlow)          v.lichenGlow      = true;
      if (vis.symbionts)           v.symbionts.push(...vis.symbionts);
    }
    return v;
  }

  getAll() { return this.mutations; }

  serialize() {
    return {
      mutations: this.mutations.map(m => ({
        id: m.id, level: m.level, active: m.active, unlocked: m.unlocked
      })),
      crisesEncountered: [...this.crisesEncountered],
      geneticLightBonus: this._geneticLightBonus || 0,
    };
  }

  restore(data) {
    if (data.crisesEncountered) this.crisesEncountered = new Set(data.crisesEncountered);
    if (data.geneticLightBonus) this._geneticLightBonus = data.geneticLightBonus;
    if (data.mutations) {
      for (const saved of data.mutations) {
        const m = this.mutations.find(m => m.id === saved.id);
        if (m) {
          m.level    = saved.level    ?? 0;
          m.active   = saved.active   ?? false;
          m.unlocked = saved.unlocked ?? false;
        }
      }
    }
  }
}
