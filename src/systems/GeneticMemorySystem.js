/**
 * GeneticMemorySystem
 * Beim Game Over: Tier flüchtet, speichert 1 Item + permanenten Bonus.
 * Beim nächsten Run: Startbonus + Item werden übergeben.
 * Persistiert in localStorage unter 'rootbound_genes'.
 */

const STORAGE_KEY = 'rootbound_genes';

// Welche Boni können vererbt werden (pro Typ)
const HERITABLE_BONUSES = [
  { id: 'xp_head_start',   label: '🧬 XP-Vorsprung',      description: 'Startet mit 30 XP',          apply: (c) => c._addXP(30) },
  { id: 'resource_boost',  label: '🌿 Ressourcen-Erbe',   description: '+20 auf alle Startressourcen', apply: (_, r) => r.add({ light: 20, water: 20, nutrients: 20 }) },
  { id: 'quest_haste',     label: '⚡ Quest-Erinnerung',  description: 'Erste Quest 30% schneller',    apply: (c) => { c._memoryQuestHaste = 0.30; } },
  { id: 'tree_whisper',    label: '🌳 Baum-Flüstern',     description: '+10% Licht dauerhaft',         apply: (_, r, m) => { m._geneticLightBonus = (m._geneticLightBonus||0) + 0.10; } },
];

export class GeneticMemorySystem {
  constructor() {
    this.memory = this._load();
    // memory = { runs: number, items: string[], bonus: string|null, archetypeId: string|null }
  }

  // Gibt zurück ob ein Erbe vorhanden ist
  hasMemory() {
    return !!this.memory?.bonus || (this.memory?.items?.length > 0);
  }

  getRuns() { return this.memory?.runs ?? 0; }

  // ── Game Over: speichern ──────────────────────────────────────────────────
  onGameOver(creature, treePhaseIndex, year) {
    const runs     = (this.memory?.runs ?? 0) + 1;
    // Das wertvollste Item behalten (epic > rare > uncommon > common)
    const rarityOrder = { epic: 4, rare: 3, uncommon: 2, common: 1 };
    const best = creature.inventory
      .sort((a, b) => (rarityOrder[b.rarity] ?? 0) - (rarityOrder[a.rarity] ?? 0))[0] ?? null;

    // Bonus wählen basierend auf wie weit man kam
    let bonusId;
    if (treePhaseIndex >= 4)      bonusId = 'tree_whisper';
    else if (treePhaseIndex >= 2) bonusId = 'resource_boost';
    else if (year >= 3)           bonusId = 'quest_haste';
    else                          bonusId = 'xp_head_start';

    this.memory = {
      runs,
      items:       best ? [best.id] : [],
      bonus:       bonusId,
      archetypeId: creature.archetype?.id ?? null,
      treePhase:   treePhaseIndex,
      year,
    };
    this._save();
    return { item: best, bonus: HERITABLE_BONUSES.find(b => b.id === bonusId) };
  }

  // ── Neuer Run: Bonus anwenden ─────────────────────────────────────────────
  applyToNewRun(creature, resources, mutations) {
    if (!this.memory) return null;
    const bonusDef = HERITABLE_BONUSES.find(b => b.id === this.memory.bonus);
    if (bonusDef) bonusDef.apply(creature, resources, mutations);
    return {
      bonusDef,
      itemIds: this.memory.items ?? [],
      runs:    this.memory.runs,
      prevArchetypeId: this.memory.archetypeId,
    };
  }

  // Gibt hübsche Anzeigetexte für Game-Over-Screen zurück
  getSummary() {
    if (!this.memory) return null;
    const bonusDef = HERITABLE_BONUSES.find(b => b.id === this.memory.bonus);
    return {
      runs:    this.memory.runs,
      bonus:   bonusDef ?? null,
      itemIds: this.memory.items ?? [],
    };
  }

  clearMemory() {
    this.memory = { runs: 0, items: [], bonus: null, archetypeId: null };
    this._save();
  }

  _load()  { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
  _save()  { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memory)); } catch {} }
}
