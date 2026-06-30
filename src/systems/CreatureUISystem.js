import { CREATURE_ARCHETYPES, QUEST_TYPES } from '../config/creatures.js';

const TIER_STYLE = {
  basic:    { fill: '#a0d060', prefix: '' },
  advanced: { fill: '#60d0d0', prefix: '★ ' },
  elder:    { fill: '#ffd060', prefix: '★★ ' },
};

export class CreatureUISystem {
  constructor(scene, creatureSystem, onArchetypeChosen, geneticSummary = null) {
    this.scene    = scene;
    this.creature = creatureSystem;
    this._onArchetypeChosen = onArchetypeChosen;
    this._geneticSummary    = geneticSummary;
    this._elements      = [];
    this._questPanel    = [];
    this._crisisEls     = [];
    this._built         = false;
    this._questBtn      = null;
    this._questPanelOpen = false;
    this._xpBar         = null;
    this._xpText        = null;
    this._levelText     = null;
    this._invLabel      = null;
    this._crisisOffered = false;
  }

  // ── Archetyp-Wahl ────────────────────────────────────────────────────
  showArchetypeChoice() {
    this._clearAll();
    const s = this.scene, W = s.scale.width, H = s.scale.height;
    const push = el => { this._elements.push(el); return el; };

    push(s.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75).setDepth(40));
    push(s.add.text(W/2, H*0.12, '🌿 Rootbound', {
      fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '28px', fill: '#a0d878',
    }).setOrigin(0.5).setDepth(41));
    push(s.add.text(W/2, H*0.21, 'Du erwachst in einem leeren Wald.\nWer bist du?', {
      fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '17px', fill: '#d0c8a0', align: 'center',
    }).setOrigin(0.5).setDepth(41));

    if (this._geneticSummary?.runs > 0) {
      const gs = this._geneticSummary;
      push(s.add.text(W/2, H*0.29,
        '🧬 Run #' + gs.runs + '  ·  Erbe: ' + (gs.bonus?.label ?? '–'),
        { fontFamily: 'sans-serif', fontSize: '10px', fill: '#80d0a0' }
      ).setOrigin(0.5).setDepth(41));
    }

    const cardW  = Math.min(160, (W - 80) / 3);
    const cardH  = 180;
    const totalW = 3 * cardW + 2 * 16;
    const startX = W/2 - totalW/2;

    CREATURE_ARCHETYPES.forEach((arch, i) => {
      const cx = startX + i * (cardW + 16);
      const cy = H * 0.50;
      const card = push(
        s.add.rectangle(cx, cy, cardW, cardH, 0x0a1a0a, 0.93)
          .setOrigin(0, 0.5).setDepth(41).setStrokeStyle(2, 0x3a6a2a)
          .setInteractive({ cursor: 'pointer' })
      );
      push(s.add.text(cx + cardW/2, cy - 58, arch.emoji, { fontSize: '36px' }).setOrigin(0.5).setDepth(42));
      push(s.add.text(cx + cardW/2, cy - 14, arch.name, {
        fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '16px', fill: '#c0d870',
      }).setOrigin(0.5).setDepth(42));
      push(s.add.text(cx + cardW/2, cy + 12, arch.description, {
        fontFamily: 'sans-serif', fontSize: '10px', fill: '#909878',
        wordWrap: { width: cardW - 16 }, align: 'center',
      }).setOrigin(0.5).setDepth(42));
      const btn = push(
        s.add.rectangle(cx + cardW/2, cy + 66, cardW - 20, 26, 0x1a3a1a, 0.95)
          .setOrigin(0.5).setDepth(42).setInteractive({ cursor: 'pointer' }).setStrokeStyle(1, 0x4a8a3a)
      );
      push(s.add.text(cx + cardW/2, cy + 66, 'Wählen', {
        fontFamily: 'sans-serif', fontSize: '11px', fill: '#80d060',
      }).setOrigin(0.5).setDepth(43));
      card.on('pointerover', () => card.setStrokeStyle(2, 0x80ff40));
      card.on('pointerout',  () => card.setStrokeStyle(2, 0x3a6a2a));
      const choose = () => { this._clearAll(); this._onArchetypeChosen(arch.id); };
      card.on('pointerdown', choose);
      btn.on('pointerdown',  choose);
    });
  }

  // ── HUD ──────────────────────────────────────────────────────────────
  buildHUD() {
    if (this._built) return;
    this._built = true;
    const s = this.scene;
    const push = el => { this._elements.push(el); return el; };

    const bg = push(
      s.add.rectangle(16, 214, 170, 26, 0x0a140a, 0.90)
        .setOrigin(0, 0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x3a5a1a)
    );
    const lbl = push(
      s.add.text(101, 227, this.creature.archetype.emoji + ' Quest starten  ▼', {
        fontFamily: 'sans-serif', fontSize: '11px', fill: '#90c060',
      }).setOrigin(0.5).setDepth(12)
    );
    bg.on('pointerover', () => bg.setFillStyle(0x151e10, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0a140a, 0.90));
    bg.on('pointerdown', () => this._questPanelOpen ? this._closeQuestPanel(lbl) : this._openQuestPanel(lbl));
    this._questBtn = { bg, lbl };

    push(s.add.text(16, 248, 'Tier Lv.', { fontFamily: 'sans-serif', fontSize: '10px', fill: '#607850' }).setDepth(11));
    this._levelText = push(s.add.text(56, 248, '1', { fontFamily: 'sans-serif', fontSize: '10px', fill: '#a0d060' }).setDepth(11));
    push(s.add.rectangle(16, 260, 140, 6, 0x1a1a1a).setOrigin(0, 0).setDepth(11));
    this._xpBar  = push(s.add.rectangle(16, 260, 0, 6, 0xa0ff60).setOrigin(0, 0).setDepth(11));
    this._xpText = push(s.add.text(160, 258, '', { fontFamily: 'sans-serif', fontSize: '9px', fill: '#607850' }).setDepth(11));
    this._invLabel = push(s.add.text(16, 272, '', { fontFamily: 'sans-serif', fontSize: '9px', fill: '#708060', wordWrap: { width: 170 } }).setDepth(11));

    this.updateHUD();
  }

  updateHUD() {
    if (!this._built) return;
    const c = this.creature;
    this._levelText.setText(c.level);
    this._xpBar.width = Math.round(140 * c.getXPProgress());
    this._xpText.setText(c.xp + '/' + c.getXPNeeded() + ' XP');
    this._invLabel.setText(c.inventory.length ? c.inventory.map(i => i.emoji).join(' ') : '');
    if (this._questBtn) {
      if (c.isOnQuest()) {
        const pct = Math.floor(c.getQuestProgress() * 100);
        this._questBtn.lbl.setText(c.currentQuest().emoji + ' ' + c.currentQuest().name + ' ' + pct + '%');
      } else {
        this._questBtn.lbl.setText(c.archetype.emoji + ' Quest starten  ▼');
      }
    }
  }

  // ── Krisen-Quest-Banner ──────────────────────────────────────────────
  // FIX: kein Tween auf dem interaktiven bg-Rect (blockierte Pointer-Events),
  //      stattdessen Tween nur auf dem Rahmen-Rechteck dahinter.
  //      Button wird sofort erstellt (kein delayedCall).
  //      Fehler-Feedback sichtbar wenn accept() fehlschlägt.
  offerCrisisQuest(questDef) {
    this.clearCrisisOffer();
    if (!this._built) return;
    this._crisisOffered = true;
    const s = this.scene;
    const push = el => { this._crisisEls.push(el); return el; };

    const BX = 16, BY = 290, BW = 170, BH = 52;

    // Pulsierendes Glow-Rect HINTER dem interaktiven Bereich (kein Input)
    const glow = push(
      s.add.rectangle(BX + BW/2, BY + BH/2, BW + 6, BH + 6, 0xff4010, 0)
        .setDepth(12)
    );
    s.tweens.add({
      targets: glow, fillAlpha: { from: 0, to: 0.35 },
      yoyo: true, repeat: -1, duration: 650,
    });

    // Hintergrund (statisch, kein Tween → Input immer stabil)
    push(
      s.add.rectangle(BX, BY, BW, BH, 0x3a0a00, 0.96)
        .setOrigin(0, 0).setDepth(13).setStrokeStyle(1.5, 0xff4010)
    );

    push(
      s.add.text(BX + BW/2, BY + 10, '🆘 ' + questDef.emoji + ' ' + questDef.name,
        { fontFamily: 'sans-serif', fontSize: '10px', fill: '#ff8060' }
      ).setOrigin(0.5).setDepth(14)
    );

    // Fehler-Text (unsichtbar bis accept() fehlschlägt)
    const errTxt = push(
      s.add.text(BX + BW/2, BY + BH + 14, '',
        { fontFamily: 'sans-serif', fontSize: '9px', fill: '#ff6040' }
      ).setOrigin(0.5).setDepth(14)
    );

    // Annehmen-Button – sofort erstellt, Depth 15 (über allem)
    const btn = push(
      s.add.rectangle(BX + BW/2, BY + 36, BW - 20, 22, 0x5a1000, 0.97)
        .setOrigin(0.5).setDepth(15).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0xff6030)
    );
    const bTxt = push(
      s.add.text(BX + BW/2, BY + 36, '⚡ Annehmen',
        { fontFamily: 'sans-serif', fontSize: '10px', fill: '#ffb080' }
      ).setOrigin(0.5).setDepth(16)
    );

    btn.on('pointerover', () => { btn.setFillStyle(0x7a2000, 0.98); bTxt.setStyle({ fill: '#ffd0a0' }); });
    btn.on('pointerout',  () => { btn.setFillStyle(0x5a1000, 0.97); bTxt.setStyle({ fill: '#ffb080' }); });
    btn.on('pointerdown', () => {
      const result = s.crisisQ?.accept();
      if (result?.ok) {
        // Button zu "läuft" umwandeln
        btn.disableInteractive();
        btn.setFillStyle(0x2a0800, 0.8).setStrokeStyle(1, 0xff8040);
        bTxt.setText('🆘 ' + questDef.emoji + ' Läuft...');
        errTxt.setText('');
      } else {
        // Sichtbares Feedback warum es nicht klappt
        const reason = result?.reason ?? 'Nicht verfügbar.';
        errTxt.setText('⚠ ' + reason);
        s.tweens.add({ targets: errTxt, alpha: { from: 1, to: 0 }, delay: 2500, duration: 500 });
      }
    });

    push(
      s.add.text(BX, BY + BH + 4, '🛡 ' + Math.round(questDef.damageReduction * 100) + '% Krisenschutz',
        { fontFamily: 'sans-serif', fontSize: '9px', fill: '#ff9060' }
      ).setDepth(13)
    );
  }

  clearCrisisOffer() {
    this._crisisOffered = false;
    for (const el of this._crisisEls) {
      try { this.scene.tweens?.killTweensOf(el); el.destroy(); } catch(e) {}
    }
    this._crisisEls = [];
  }

  // ── Quest-Panel ──────────────────────────────────────────────────────
  _openQuestPanel(lbl) {
    if (this.creature.isOnQuest()) return;
    this._questPanelOpen = true;
    lbl.setText(this.creature.archetype.emoji + ' Quest starten  ▲');
    this._renderQuestPanel();
  }

  _closeQuestPanel(lbl) {
    this._questPanelOpen = false;
    lbl.setText(this.creature.archetype.emoji + ' Quest starten  ▼');
    for (const el of this._questPanel) el.destroy();
    this._questPanel = [];
  }

  _renderQuestPanel() {
    for (const el of this._questPanel) el.destroy();
    this._questPanel = [];
    const s = this.scene;
    const quests = this.creature.getAvailableQuests();
    const PX = 16, PY = 284, PW = 210, ROWH = 60;
    const push = el => { this._questPanel.push(el); return el; };

    push(s.add.rectangle(PX, PY, PW, quests.length * ROWH + 12, 0x060e06, 0.95)
      .setOrigin(0, 0).setDepth(22).setStrokeStyle(1, 0x304020));

    quests.forEach((q, i) => {
      const ry = PY + 6 + i * ROWH;
      const ts = TIER_STYLE[q.tier] || TIER_STYLE.basic;
      const durationSec = Math.round(q.duration / 1000);
      const row = push(
        s.add.rectangle(PX + 4, ry, PW - 8, ROWH - 4, 0x0c120a, 0.92)
          .setOrigin(0, 0).setDepth(23)
          .setStrokeStyle(1, q.tier === 'elder' ? 0x806020 : 0x283818, 0.8)
          .setInteractive({ cursor: 'pointer' })
      );
      push(s.add.text(PX + 12, ry + 5, ts.prefix + q.emoji + ' ' + q.name, {
        fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '12px', fill: ts.fill,
      }).setDepth(24));
      push(s.add.text(PX + 12, ry + 22, q.description, {
        fontFamily: 'sans-serif', fontSize: '9px', fill: '#708060', wordWrap: { width: PW - 24 },
      }).setDepth(24));
      const resStr = q.reward.resources
        ? Object.entries(q.reward.resources).map(([k, v]) => '+' + v + ' ' + { light: '☀️', water: '💧', nutrients: '🌱', symbiosis: '🪼' }[k]).join('  ')
        : '';
      push(s.add.text(PX + 12, ry + 42, '⏱ ' + durationSec + 's  +' + q.reward.xp + 'XP  ' + resStr, {
        fontFamily: 'sans-serif', fontSize: '9px', fill: '#506840',
      }).setDepth(24));

      row.on('pointerover', () => row.setFillStyle(0x18241a, 0.95));
      row.on('pointerout',  () => row.setFillStyle(0x0c120a, 0.92));
      row.on('pointerdown', () => {
        const r = this.creature.startQuest(q.id);
        if (r.ok) { this._closeQuestPanel(this._questBtn.lbl); this.updateHUD(); }
      });
    });
  }

  _clearAll() {
    for (const el of this._elements)   { try { el.destroy(); } catch(e) {} }
    for (const el of this._questPanel) { try { el.destroy(); } catch(e) {} }
    this.clearCrisisOffer();
    this._elements    = [];
    this._questPanel  = [];
    this._built       = false;
    this._questBtn    = null;
  }

  destroy() { this._clearAll(); }
}
