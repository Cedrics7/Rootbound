import { SKILL_TREE } from '../config/skills.js';

/**
 * SkillSystem – verwaltet freigeschaltete Skills und aggregiert Boni.
 *
 * Boni die SkillSystem liefert (werden in GameScene in den Bonus-Objekt eingemischt):
 *   lightRateBonus, waterRateBonus, nutrientsRateBonus, allRatesBonus,
 *   waterDrainReduction, eventDamageReduction,
 *   questSpeedBonus, itemChanceBonus,
 *   symbiosisPassive      – extra Symbiose pro Tick
 *   forestSymbiosisBonus  – extra Symbiose pro Waldbaum
 *   forestBonusMultiplier – Multiplikator auf Wald-Boni
 *   crisisDamageReductionBonus
 *   crisisQuestSpeedBonus
 *   questTypeSpeedBonus   – { explore, dig, pollinate, gather }
 *   questResourceBonus    – { light, water, nutrients, symbiosis }
 */
export class SkillSystem {
  constructor() {
    // Set der freigeschalteten Skill-IDs
    this.unlocked = new Set();
    // Gecachte Boni (werden nach jedem Unlock neu berechnet)
    this._bonusCache = null;
  }

  // ── Abfragen ────────────────────────────────────────────────────────────
  getAll()           { return SKILL_TREE; }
  isUnlocked(id)     { return this.unlocked.has(id); }
  getUnlocked()      { return [...this.unlocked]; }

  canUnlock(skillId, resources, creatureLevel) {
    const skill = SKILL_TREE.find(s => s.id === skillId);
    if (!skill)                        return { ok: false, reason: 'Unbekannter Skill.' };
    if (this.unlocked.has(skillId))    return { ok: false, reason: 'Bereits freigeschaltet.' };

    // Abhängigkeiten prüfen
    for (const req of skill.requires) {
      if (!this.unlocked.has(req)) {
        const dep = SKILL_TREE.find(s => s.id === req);
        return { ok: false, reason: 'Benötigt: ' + (dep?.name ?? req) };
      }
    }

    // XP-Kosten gegen Level prüfen (XP = kumulativ investiert)
    if (skill.cost.xp && creatureLevel < this._xpTierMinLevel(skill.tier)) {
      return { ok: false, reason: 'Mind. Level ' + this._xpTierMinLevel(skill.tier) + ' benötigt.' };
    }

    // Ressourcen prüfen
    const missing = [];
    for (const [k, v] of Object.entries(skill.cost)) {
      if (k === 'xp') continue;
      if ((resources.get(k) ?? 0) < v) missing.push(v + ' ' + k);
    }
    if (missing.length) return { ok: false, reason: 'Braucht: ' + missing.join(', ') };

    return { ok: true };
  }

  // Level-Mindestanforderung pro Tier
  _xpTierMinLevel(tier) {
    return [0, 1, 3, 6, 9, 12][tier] ?? 1;
  }

  // ── Skill freischalten ────────────────────────────────────────────────────
  unlock(skillId, resources, creatureLevel) {
    const check = this.canUnlock(skillId, resources, creatureLevel);
    if (!check.ok) return check;

    const skill = SKILL_TREE.find(s => s.id === skillId);
    // Ressourcen abziehen
    for (const [k, v] of Object.entries(skill.cost)) {
      if (k === 'xp') continue;
      resources.add({ [k]: -v });
    }
    this.unlocked.add(skillId);
    this._bonusCache = null; // Cache invalidieren
    return { ok: true, skill };
  }

  // ── Boni aggregieren ─────────────────────────────────────────────────────
  getBonuses() {
    if (this._bonusCache) return this._bonusCache;

    const b = {
      lightRateBonus:          0,
      waterRateBonus:          0,
      nutrientsRateBonus:      0,
      allRatesBonus:           0,
      waterDrainReduction:     0,
      eventDamageReduction:    0,
      questSpeedBonus:         0,
      itemChanceBonus:         0,
      symbiosisPassive:        0,
      forestSymbiosisBonus:    0,
      forestBonusMultiplier:   0,
      crisisDamageReductionBonus: 0,
      crisisQuestSpeedBonus:   0,
      questTypeSpeedBonus:     { explore: 0, dig: 0, pollinate: 0, gather: 0 },
      questResourceBonus:      { light: 0, water: 0, nutrients: 0, symbiosis: 0 },
    };

    for (const id of this.unlocked) {
      const skill = SKILL_TREE.find(s => s.id === id);
      if (!skill) continue;
      for (const [k, v] of Object.entries(skill.bonus)) {
        if (k === 'questTypeSpeedBonus' || k === 'questResourceBonus') {
          for (const [type, val] of Object.entries(v)) {
            b[k][type] = (b[k][type] ?? 0) + val;
          }
        } else if (typeof b[k] === 'number') {
          b[k] += v;
        } else {
          b[k] = v; // z.B. rarityUnlock
        }
      }
    }

    this._bonusCache = b;
    return b;
  }

  // ── Save / Restore ──────────────────────────────────────────────────────
  serialize()  { return { unlocked: [...this.unlocked] }; }
  restore(data) {
    if (!data?.unlocked) return;
    this.unlocked = new Set(data.unlocked);
    this._bonusCache = null;
  }
}
