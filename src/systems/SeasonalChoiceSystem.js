/**
 * SeasonalChoiceSystem.js
 * Beim Jahreszeitenwechsel erscheint ein modales Entscheidungsfenster
 * mit 2 Optionen – jede hat einen Bonus und einen Malus.
 */

const CHOICES = {
  spring: [
    {
      id: 'sp_roots_vs_sun',
      prompt: 'Die Schmelze beginnt. Der Boden öffnet sich.',
      options: [
        {
          label: '🌱 Tief wurzeln',
          desc:  'Nährstoffe +40% für diese Saison. Licht -15%.',
          effect: { nutrientsRateBonus: 0.40, lightRateBonus: -0.15 },
        },
        {
          label: '☀️ Krone entfalten',
          desc:  'Licht +50% für diese Saison. Nährstoffe -20%.',
          effect: { lightRateBonus: 0.50, nutrientsRateBonus: -0.20 },
        },
      ],
    },
    {
      id: 'sp_rain_vs_blossom',
      prompt: 'Frühlingsregen naht. Was nutzt du?',
      options: [
        {
          label: '🌧️ Regen sammeln',
          desc:  'Wasser +50 sofort. Symbiose -10.',
          effect: { instant: { water: 50, symbiosis: -10 } },
        },
        {
          label: '🌸 Blüte fördern',
          desc:  'Symbiose +40 sofort. Wasser +0.',
          effect: { instant: { symbiosis: 40 } },
        },
      ],
    },
    {
      id: 'sp_early_growth',
      prompt: 'Erste Wärme. Frühwachstum oder Geduld?',
      options: [
        {
          label: '⚡ Frühwachstum',
          desc:  'Alle Raten +20% – aber Wasser -25% dieser Saison.',
          effect: { allRatesBonus: 0.20, waterRateBonus: -0.25 },
        },
        {
          label: '🧘 Geduld',
          desc:  'Keine Boni, aber Ressourcen sinken 10% weniger.',
          effect: { eventDamageReduction: 0.10 },
        },
      ],
    },
  ],
  summer: [
    {
      id: 'su_drought_prep',
      prompt: 'Die Hitze kommt. Wie rüstest du dich?',
      options: [
        {
          label: '💧 Wasserreserve',
          desc:  'Wasser +60 sofort. Licht -20% diese Saison.',
          effect: { instant: { water: 60 }, lightRateBonus: -0.20 },
        },
        {
          label: '🔥 Hitzehärtung',
          desc:  'Dürre-Schaden -50% diese Saison. Nährstoffe -15%.',
          effect: { droughtDamageReduction: 0.50, nutrientsRateBonus: -0.15 },
        },
      ],
    },
    {
      id: 'su_pollinator',
      prompt: 'Bienenzeit. Fördere das Leben – oder spar Kraft?',
      options: [
        {
          label: '🐝 Bestäuber locken',
          desc:  'Symbiose +60 sofort. Nährstoffe -20.',
          effect: { instant: { symbiosis: 60, nutrients: -20 } },
        },
        {
          label: '🌿 Kraftreserve',
          desc:  'Nährstoffe +30 sofort. Symbiose wächst 10% langsamer.',
          effect: { instant: { nutrients: 30 }, symbiosisRateBonus: -0.10 },
        },
      ],
    },
    {
      id: 'su_open_canopy',
      prompt: 'Die Krone ist voll. Öffnen oder schließen?',
      options: [
        {
          label: '🌞 Krone öffnen',
          desc:  'Licht +35% – aber Wasserverlust +20% (Hitze).',
          effect: { lightRateBonus: 0.35, waterRateBonus: -0.20 },
        },
        {
          label: '🐚 Krone schließen',
          desc:  'Wasser -10% Verlust. Licht +0%.',
          effect: { waterRateBonus: 0.10 },
        },
      ],
    },
  ],
  autumn: [
    {
      id: 'au_harvest',
      prompt: 'Die Blätter fallen. Ernte oder Vorbereitung?',
      options: [
        {
          label: '🍂 Ernteansturm',
          desc:  'Nährstoffe +70 sofort. Alle Raten -10% diesen Winter.',
          effect: { instant: { nutrients: 70 }, winterMalus: 0.10 },
        },
        {
          label: '🌊 Wintervorbereitung',
          desc:  'Winter-Mali -30%. Kein Sofort-Bonus.',
          effect: { winterMalusReduction: 0.30 },
        },
      ],
    },
    {
      id: 'au_migration',
      prompt: 'Vögel ziehen durch. Schick dein Tier mit?',
      options: [
        {
          label: '🐦 Ziehen lassen',
          desc:  'Tier bekommt +40 XP. Nächste Quest 20% länger.',
          effect: { creatureXP: 40, questSpeedMalus: 0.20 },
        },
        {
          label: '🦊 Zurückhalten',
          desc:  'Symbiose +30 sofort. Tier-XP unverändert.',
          effect: { instant: { symbiosis: 30 } },
        },
      ],
    },
    {
      id: 'au_deep_roots_2',
      prompt: 'Letztes Licht vor dem Winter. Nutzen?',
      options: [
        {
          label: '☀️ Licht aufsaugen',
          desc:  'Licht +50 sofort. Nährstoffe -15.',
          effect: { instant: { light: 50, nutrients: -15 } },
        },
        {
          label: '🌱 Wurzel stärken',
          desc:  'Nährstoffe +45 sofort. Licht -10.',
          effect: { instant: { nutrients: 45, light: -10 } },
        },
      ],
    },
  ],
  winter: [
    {
      id: 'wi_frost_choice',
      prompt: 'Frost kriecht näher. Energie sparen oder kämpfen?',
      options: [
        {
          label: '🧘 Tiefschlaf',
          desc:  'Alle Verluste -20%. Keine Ressourcen-Gewinne aktiv.',
          effect: { allRatesMalus: -0.30, eventDamageReduction: 0.20 },
        },
        {
          label: '🔥 Inneres Feuer',
          desc:  'Alle Raten +15% – aber Krisenschaden +10%.',
          effect: { allRatesBonus: 0.15, crisisDamageMalus: 0.10 },
        },
      ],
    },
    {
      id: 'wi_snow_melt',
      prompt: 'Kurzes Tauwetter. Nutzen oder schonen?',
      options: [
        {
          label: '💧 Wasser zapfen',
          desc:  'Wasser +80 sofort. Nächster Frost -0% Schutz.',
          effect: { instant: { water: 80 } },
        },
        {
          label: '🦴 Tiefenschicht suchen',
          desc:  'Nährstoffe +50 sofort. Wasser +10.',
          effect: { instant: { nutrients: 50, water: 10 } },
        },
      ],
    },
    {
      id: 'wi_symbiosis_winter',
      prompt: 'Tiere suchen Schutz. Teilen oder sparen?',
      options: [
        {
          label: '🦊 Zuflucht geben',
          desc:  'Symbiose +50 sofort. Wasser -20.',
          effect: { instant: { symbiosis: 50, water: -20 } },
        },
        {
          label: '⚡ Reserven halten',
          desc:  'Nährstoffe +25, Wasser +15 sofort.',
          effect: { instant: { nutrients: 25, water: 15 } },
        },
      ],
    },
  ],
};

export class SeasonalChoiceSystem {
  constructor(scene, resources, creature) {
    this.scene     = scene;
    this.resources = resources;
    this.creature  = creature;
    this._lastId   = null;     // verhindert direkte Wiederholung
    this._active   = false;    // läuft gerade ein Modal?
    this._seasonBonuses = {};  // aktive temporäre Boni (laufen bis nächste Saison)
    this._els      = [];
  }

  // Wird von GameScene._onSeasonChange() aufgerufen
  onSeasonChange(newSeasonId) {
    // Alte temporäre Boni löschen
    this._seasonBonuses = {};
    // Nur wenn Baum vorhanden
    if (!this.scene.creature?.treeUnlocked) return;
    const pool = CHOICES[newSeasonId];
    if (!pool) return;
    // Zufallswahl, nie dieselbe wie zuletzt
    const candidates = pool.filter(c => c.id !== this._lastId);
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    if (!choice) return;
    // Kurze Verzögerung damit Saison-Transition-Screen zuerst erscheint
    this.scene.time.delayedCall(1800, () => this._showModal(choice));
  }

  // Gibt aktive temporäre Boni zurück (GameScene merged diese in bonuses)
  getSeasonBonuses() { return { ...this._seasonBonuses }; }

  _showModal(choice) {
    if (this._active) return;
    this._active = true;
    this._lastId = choice.id;
    const s = this.scene, W = s.scale.width, H = s.scale.height;
    const push = (el) => { this._els.push(el); return el; };

    // Overlay
    const ov = push(s.add.rectangle(W/2, H/2, W, H, 0x000000, 0.60).setDepth(60).setInteractive());

    // Panel
    const PW = Math.min(320, W - 32), PH = 230;
    const px = W/2 - PW/2, py = H/2 - PH/2;
    push(s.add.rectangle(W/2, H/2, PW, PH, 0x070f07, 0.97)
      .setDepth(61).setStrokeStyle(2, 0x4a7a2a));

    // Titel
    push(s.add.text(W/2, py + 18, '🌀 Entscheidung', {
      fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '16px', fill: '#a0d878',
    }).setOrigin(0.5).setDepth(62));

    // Prompt
    push(s.add.text(W/2, py + 46, choice.prompt, {
      fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '13px', fill: '#d0c8a0',
      wordWrap: { width: PW - 32 }, align: 'center',
    }).setOrigin(0.5).setDepth(62));

    // Optionen
    choice.options.forEach((opt, i) => {
      const bx = px + 16 + i * (PW/2 - 4);
      const bw = PW/2 - 24;
      const by = py + 90;
      const bh = 110;

      const btn = push(s.add.rectangle(bx, by, bw, bh, 0x0c160c, 0.95)
        .setOrigin(0, 0).setDepth(62).setStrokeStyle(1, 0x2a4a1a)
        .setInteractive({ cursor: 'pointer' })
      );
      push(s.add.text(bx + bw/2, by + 16, opt.label, {
        fontFamily: 'sans-serif', fontSize: '11px', fill: '#90e060', align: 'center',
        wordWrap: { width: bw - 12 },
      }).setOrigin(0.5, 0).setDepth(63));
      push(s.add.text(bx + bw/2, by + 46, opt.desc, {
        fontFamily: 'sans-serif', fontSize: '9px', fill: '#708060', align: 'center',
        wordWrap: { width: bw - 12 },
      }).setOrigin(0.5, 0).setDepth(63));

      btn.on('pointerover', () => btn.setFillStyle(0x182818, 0.98));
      btn.on('pointerout',  () => btn.setFillStyle(0x0c160c, 0.95));
      btn.on('pointerdown', () => this._applyChoice(opt, choice));
    });
  }

  _applyChoice(opt, choice) {
    const eff = opt.effect || {};

    // Sofort-Ressourcen
    if (eff.instant) {
      const add = {};
      for (const [k, v] of Object.entries(eff.instant)) add[k] = v;
      this.resources.add(add);
    }

    // Tier-XP
    if (eff.creatureXP && this.creature?.isReady()) {
      this.creature._addXP(eff.creatureXP);
    }

    // Temporäre Saison-Boni (laufen bis nächste Saison)
    const rateKeys = ['lightRateBonus','waterRateBonus','nutrientsRateBonus',
                      'allRatesBonus','allRatesMalus','eventDamageReduction',
                      'winterMalusReduction','symbiosisRateBonus'];
    for (const k of rateKeys) {
      if (eff[k] !== undefined) this._seasonBonuses[k] = (this._seasonBonuses[k] || 0) + eff[k];
    }
    // Spezialeffekte
    if (eff.winterMalus)       this._seasonBonuses.winterMalus       = eff.winterMalus;
    if (eff.droughtDamageReduction) this._seasonBonuses.droughtDamageReduction = eff.droughtDamageReduction;
    if (eff.questSpeedMalus)   this.creature._memoryQuestHaste = -(eff.questSpeedMalus);

    // Log
    const msg = opt.label + ': ' + opt.desc;
    if (this.scene.ui) this.scene.ui.addEventLog('🌀 ' + msg, 'discovery');

    this._closeModal();
  }

  _closeModal() {
    this._active = false;
    for (const el of this._els) { el.destroy(); }
    this._els = [];
  }

  destroy() { this._closeModal(); }
}
