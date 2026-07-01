import { SKILL_TREE } from '../config/skills.js';

/**
 * SkillSystem – Level-basierter Skill-Baum.
 * Ressourcen: light, water, nutrients, symbiosis, essence (Lebensessenz).
 * Jeder Skill hat ein levelRequired – das Creature-Level muss erreicht sein.
 */
export class SkillSystem {
  constructor() {
    this.unlocked    = new Set();
    this._bonusCache = null;
  }

  getAll()       { return SKILL_TREE; }
  isUnlocked(id) { return this.unlocked.has(id); }
  getUnlocked()  { return [...this.unlocked]; }

  canUnlock(skillId, resources, creatureLevel) {
    const skill = SKILL_TREE.find(s => s.id === skillId);
    if (!skill)                     return { ok: false, reason: 'Unbekannter Skill.' };
    if (this.unlocked.has(skillId)) return { ok: false, reason: 'Bereits freigeschaltet.' };

    // Level-Gate (primäre Hürde)
    const minLvl = skill.levelRequired ?? 1;
    if ((creatureLevel ?? 0) < minLvl)
      return { ok: false, reason: `Benötigt Level ${minLvl}. (Aktuell: ${creatureLevel ?? 0})` };

    // Abhängigkeiten
    for (const req of (skill.requires || [])) {
      if (!this.unlocked.has(req)) {
        const dep = SKILL_TREE.find(s => s.id === req);
        return { ok: false, reason: 'Benötigt: ' + (dep?.name ?? req) };
      }
    }

    // Ressourcen
    const missing = [];
    for (const [k, v] of Object.entries(skill.cost)) {
      if ((resources.get(k) ?? 0) < v) missing.push(`${v} ${k}`);
    }
    if (missing.length) return { ok: false, reason: 'Braucht: ' + missing.join(', ') };

    return { ok: true };
  }

  unlock(skillId, resources, creatureLevel) {
    const check = this.canUnlock(skillId, resources, creatureLevel);
    if (!check.ok) return check;
    const skill = SKILL_TREE.find(s => s.id === skillId);
    for (const [k, v] of Object.entries(skill.cost)) {
      resources.add({ [k]: -v });
    }
    this.unlocked.add(skillId);
    this._bonusCache = null;
    return { ok: true, skill };
  }

  getBonuses() {
    if (this._bonusCache) return this._bonusCache;
    const b = {
      lightRateBonus: 0, waterRateBonus: 0, nutrientsRateBonus: 0,
      allRatesBonus: 0, waterDrainReduction: 0, eventDamageReduction: 0,
      questSpeedBonus: 0, itemChanceBonus: 0, symbiosisPassive: 0,
      forestSymbiosisBonus: 0, forestBonusMultiplier: 0,
      crisisDamageReductionBonus: 0, crisisQuestSpeedBonus: 0,
      essenceRate: 0,
      questTypeSpeedBonus:  { explore: 0, dig: 0, pollinate: 0, gather: 0 },
      questResourceBonus:   { light: 0, water: 0, nutrients: 0, symbiosis: 0 },
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
          b[k] = v;
        }
      }
    }
    this._bonusCache = b;
    return b;
  }

  /** Für SkillTreeUI: gibt alle Skills mit Status zurück */
  getSkillsWithStatus(resources, creatureLevel) {
    return SKILL_TREE.map(skill => {
      const unlocked  = this.unlocked.has(skill.id);
      const check     = unlocked ? { ok: true } : this.canUnlock(skill.id, resources, creatureLevel);
      const lvlOk     = (creatureLevel ?? 0) >= (skill.levelRequired ?? 1);
      return { ...skill, unlocked, canUnlock: check.ok, reason: check.reason, lvlOk };
    });
  }

  serialize()  { return { unlocked: [...this.unlocked] }; }
  restore(data) {
    if (!data?.unlocked) return;
    this.unlocked    = new Set(data.unlocked);
    this._bonusCache = null;
  }
}
