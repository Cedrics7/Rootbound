import { TREE_PHASES } from '../config/seasons.js';

/**
 * UISystem – HUD, Mutations-Panel, Event-Log, Codex-Panel.
 * Verwendet Cormorant Garamond als Display-Font (Symbiose/Natur-Feeling).
 */
export class UISystem {
  constructor(scene, resources, seasons, tree, mutations, codex) {
    this.scene     = scene;
    this.resources = resources;
    this.seasons   = seasons;
    this.tree      = tree;
    this.mutations = mutations;
    this.codex     = codex;

    this.panelOpen  = false;
    this.codexOpen  = false;
    this._panelElements = [];
    this._codexElements = [];
    this._logMessages   = [];   // { text, type, age }
    this._logTexts      = [];   // Phaser Text-Objekte

    this._buildHUD();
  }

  _buildHUD() {
    const s  = this.scene;
    const W  = s.scale.width;
    const H  = s.scale.height;
    // Schriften: Display = Cormorant Garamond, Body = sans-serif
    const displayStyle = { fontFamily: '"Cormorant Garamond", Georgia, serif', fill: '#e8e0d0' };
    const bodyStyle    = { fontFamily: 'sans-serif', fill: '#c8d8b0' };

    // ── Titel ──────────────────────────────────────────────────────
    s.add.text(16, 14, '🌳 Rootbound', { ...displayStyle, fontSize: '22px', fill: '#a0d878' }).setDepth(10);

    // ── Saison / Jahr ─────────────────────────────────────────────
    this.seasonText = s.add.text(16, 46, '', { ...displayStyle, fontSize: '15px' }).setDepth(10);
    this.yearText   = s.add.text(16, 66, '', { ...displayStyle, fontSize: '13px', fill: '#a09888' }).setDepth(10);
    this.phaseText  = s.add.text(16, 86, '', { ...displayStyle, fontSize: '12px', fill: '#88b870' }).setDepth(10);

    // ── Event-Banner ──────────────────────────────────────────────
    this.eventBanner = s.add.text(W / 2, H - 48, '', {
      ...displayStyle, fontSize: '13px', fill: '#ffdd80',
      stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(12);

    // ── Ressourcen rechts oben ─────────────────────────────────────
    const rx = W - 200;
    s.add.text(rx, 14, 'Ressourcen', { ...displayStyle, fontSize: '14px', fill: '#a0d878' }).setDepth(10);
    this.resTexts = {};
    this.resBars  = {};
    const resKeys = ['light', 'water', 'nutrients', 'symbiosis'];
    const resColors = { light: 0xf0d840, water: 0x40a0f0, nutrients: 0x70c030, symbiosis: 0x40d0a0 };
    resKeys.forEach((key, i) => {
      const y   = 36 + i * 34;
      const res = this.resources.getAll()[key];
      if (!res) return;
      s.add.text(rx, y, (res.emoji || '') + ' ' + res.name, { ...bodyStyle, fontSize: '12px' }).setDepth(10);
      this.resTexts[key] = s.add.text(rx + 150, y, '', { ...bodyStyle, fontSize: '11px', fill: '#c0b8a8' }).setDepth(10);
      s.add.rectangle(rx, y + 14, 180, 6, 0x1a1a1a).setOrigin(0, 0).setDepth(10);
      this.resBars[key] = s.add.rectangle(rx, y + 14, 0, 6, resColors[key] || 0xffffff).setOrigin(0, 0).setDepth(10);
    });

    // ── Jahreszeit-Fortschrittsbalken ──────────────────────────────
    s.add.rectangle(W * 0.2, H - 22, W * 0.6, 8, 0x1a1a1a).setOrigin(0, 0).setDepth(10);
    this.seasonBar = s.add.rectangle(W * 0.2, H - 22, 0, 8, 0x60a040).setOrigin(0, 0).setDepth(10);
    s.add.text(W * 0.2, H - 36, 'Jahreszeit-Fortschritt', { ...bodyStyle, fontSize: '10px', fill: '#666' }).setDepth(10);

    // ── Monat-Strip ────────────────────────────────────────────────
    this._buildMonthStrip();

    // ── Wachstum-Hinweis ───────────────────────────────────────────
    this.growthHint = s.add.text(W / 2, H * 0.88, '', {
      ...bodyStyle, fontSize: '11px', fill: '#a0d878', align: 'center',
    }).setOrigin(0.5).setDepth(10);

    // ── Mutation-Button ────────────────────────────────────────────
    this._buildMutationButton();

    // ── Codex-Button ───────────────────────────────────────────────
    this._buildCodexButton();

    // ── Event-Log ─────────────────────────────────────────────────
    this._buildEventLog();

    this.update();
  }

  // ── Monat-Strip ─────────────────────────────────────────────────────

  _buildMonthStrip() {
    const s = this.scene;
    const W = s.scale.width;
    const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    const MONTH_COLORS = [
      0x8ab8cc,0x9ac4d8,0xb0d4c0,0x5fcf6a,0x4db83a,0x2d9a20,
      0x2d8a10,0x3a9820,0x4aab30,0xc8691a,0xd4801a,0x7090a8,
    ];
    this._monthDots = [];
    const startX = W / 2 - (MONTHS.length * 18) / 2;
    MONTHS.forEach((m, i) => {
      const dot = s.add.circle(startX + i * 18, 26, 6, MONTH_COLORS[i]).setDepth(10).setAlpha(0.35);
      this._monthDots.push(dot);
    });
    this._currentMonthIndex = 0;
  }

  _updateMonthStrip() {
    // Monat aus Saison-Fortschritt ableiten
    const seasonOrder = ['spring', 'summer', 'autumn', 'winter'];
    const si = seasonOrder.indexOf(this.seasons.current.id);
    const progress = this.seasons.getProgress();
    const month = si * 3 + Math.min(2, Math.floor(progress * 3));
    this._monthDots.forEach((dot, i) => {
      dot.setAlpha(i < month ? 0.7 : i === month ? 1.0 : 0.3);
      dot.setScale(i === month ? 1.4 : 1.0);
    });
  }

  // ── Event-Log ───────────────────────────────────────────────────────

  _buildEventLog() {
    const s = this.scene;
    const W = s.scale.width;
    this._logContainer = s.add.container(W - 260, 160).setDepth(11);
  }

  addEventLog(msg, type = 'info') {
    const s   = this.scene;
    const W   = s.scale.width;
    const colors = {
      event:     '#ffdd80',
      discovery: '#80ffe0',
      growth:    '#a0ff80',
      season:    '#d0d8ff',
      crisis:    '#ff9080',
      info:      '#a0b8a0',
    };
    const color = colors[type] || colors.info;

    // Altes erstes Element entfernen wenn zu viele
    if (this._logTexts.length >= 5) {
      const old = this._logTexts.shift();
      this.scene.tweens.add({ targets: old, alpha: 0, duration: 300, onComplete: () => old.destroy() });
    }

    const yOffset = this._logTexts.length * 26;
    const txt = s.add.text(W - 260, 160 + yOffset, msg, {
      fontFamily: 'sans-serif', fontSize: '11px',
      fill: color,
      stroke: '#000', strokeThickness: 1,
      wordWrap: { width: 240 },
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 6, y: 3 },
    }).setAlpha(0).setDepth(11);

    s.tweens.add({ targets: txt, alpha: 1, duration: 300 });
    s.tweens.add({ targets: txt, alpha: 0, delay: 5000, duration: 800, onComplete: () => {
      txt.destroy();
      this._logTexts = this._logTexts.filter(t => t !== txt);
    }});

    this._logTexts.push(txt);
  }

  // ── Mutation-Button & Panel ─────────────────────────────────────────

  _buildMutationButton() {
    const s = this.scene;
    const btnX = 16, btnY = 110;
    const bg = s.add.rectangle(btnX, btnY, 160, 28, 0x1a2a1a, 0.88)
      .setOrigin(0, 0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x3a6a2a);
    const label = s.add.text(btnX + 80, btnY + 14, '🧬 Mutationen  ▼', {
      fontFamily: 'sans-serif', fontSize: '12px', fill: '#88d060',
    }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x2a3a2a, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a2a1a, 0.88));
    bg.on('pointerdown', () => {
      this.panelOpen ? this._closePanel(label) : this._openPanel(label);
    });
    this._mutBtn = { bg, label };
  }

  _buildCodexButton() {
    const s = this.scene;
    const btnX = 16, btnY = 146;
    const bg = s.add.rectangle(btnX, btnY, 160, 26, 0x0d1a2a, 0.88)
      .setOrigin(0, 0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x2a4a6a);
    s.add.text(btnX + 80, btnY + 13, '📖 Codex', {
      fontFamily: 'sans-serif', fontSize: '12px', fill: '#80c0f0',
    }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x152035, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0d1a2a, 0.88));
    bg.on('pointerdown', () => {
      this.codexOpen ? this._closeCodex() : this._openCodex();
    });
  }

  _openPanel(label) {
    this.panelOpen = true;
    label.setText('🧬 Mutationen  ▲');
    this._renderPanel();
  }

  _closePanel(label) {
    this.panelOpen = false;
    label.setText('🧬 Mutationen  ▼');
    this._clearPanel();
  }

  _clearPanel() {
    for (const el of this._panelElements) el.destroy();
    this._panelElements = [];
  }

  _renderPanel() {
    this._clearPanel();
    const s         = this.scene;
    const available = this.mutations.getAvailable(this.tree.phaseIndex);
    const PX = 16, PY = 178, PW = 310, ROWH = 74;
    const PH = 20 + available.length * ROWH + 10;

    const panelBg = s.add.rectangle(PX, PY, PW, PH, 0x0a160a, 0.94)
      .setOrigin(0, 0).setDepth(20).setStrokeStyle(1, 0x3a6a2a, 0.8);
    this._panelElements.push(panelBg);

    const title = s.add.text(PX + 12, PY + 10, 'Mutationen & Symbiosen', {
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '15px', fill: '#a0d878',
    }).setDepth(21);
    this._panelElements.push(title);

    available.forEach((m, i) => {
      const ry = PY + 34 + i * ROWH;
      const bgColor = m.active ? 0x1a3a1a : m.unlocked ? 0x1a2a10 : 0x12120e;
      const borderColor = m.active ? 0x60d040 : m.type === 'symbiosis' ? 0xc0a030 : 0x2a3a1a;
      const rowBg = s.add.rectangle(PX + 8, ry, PW - 16, ROWH - 6, bgColor, 0.92)
        .setOrigin(0, 0).setDepth(21).setStrokeStyle(1, borderColor, 0.7);
      this._panelElements.push(rowBg);

      const nameText = s.add.text(PX + 14, ry + 6, m.emoji + ' ' + m.name, {
        fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '13px',
        fill: m.active ? '#80ff60' : m.unlocked ? '#c0d890' : '#606050',
      }).setDepth(22);
      this._panelElements.push(nameText);

      const typeColors = { passive: '#a0c880', active: '#80c0f0', symbiosis: '#f0c040', crisis: '#f06040' };
      const typeBadge = s.add.text(PX + 14 + nameText.width + 8, ry + 8,
        '[' + m.type + ']',
        { fontFamily: 'sans-serif', fontSize: '10px', fill: typeColors[m.type] || '#888' }
      ).setDepth(22);
      this._panelElements.push(typeBadge);

      const desc = s.add.text(PX + 14, ry + 26, m.description, {
        fontFamily: 'sans-serif', fontSize: '10px', fill: '#909880',
        wordWrap: { width: PW - 36 },
      }).setDepth(22);
      this._panelElements.push(desc);

      if (!m.active && m.type !== 'crisis') {
        const costStr = '⚡' + m.cost.light + '  💧' + m.cost.water + '  🌱' + m.cost.nutrients;
        const costTxt = s.add.text(PX + 14, ry + 52, costStr, {
          fontFamily: 'sans-serif', fontSize: '10px', fill: '#c0a860',
        }).setDepth(22);
        this._panelElements.push(costTxt);
      } else if (m.active) {
        const al = s.add.text(PX + 14, ry + 52, '✓ Aktiv – wirkt jetzt', {
          fontFamily: 'sans-serif', fontSize: '10px', fill: '#60d040',
        }).setDepth(22);
        this._panelElements.push(al);
      } else {
        const encountered = this.mutations.crisesEncountered.has(m.requiredCrisis);
        const cl = s.add.text(PX + 14, ry + 52,
          encountered ? '✓ Krise erlebt – aktivierbar' : '🔒 Krise nötig: ' + m.requiredCrisis,
          { fontFamily: 'sans-serif', fontSize: '10px', fill: encountered ? '#80d060' : '#806050' }
        ).setDepth(22);
        this._panelElements.push(cl);
      }

      // Aktivieren-Button
      if (!m.active && (m.type !== 'crisis' || this.mutations.crisesEncountered.has(m.requiredCrisis))) {
        const btnBg = s.add.rectangle(PX + PW - 72, ry + 28, 62, 22, 0x2a4a2a, 0.92)
          .setOrigin(0, 0).setDepth(22).setInteractive({ cursor: 'pointer' }).setStrokeStyle(1, 0x4a8a3a);
        const btnTxt = s.add.text(PX + PW - 41, ry + 39, 'Aktivieren', {
          fontFamily: 'sans-serif', fontSize: '10px', fill: '#80d060',
        }).setOrigin(0.5).setDepth(23);
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a6a3a, 0.95));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0x2a4a2a, 0.92));
        btnBg.on('pointerdown', () => {
          const result = this.mutations.activate(m.id, this.resources);
          if (result.ok) {
            this._renderPanel();
            this.scene.tree.draw(this.scene.seasons.current.id, this.mutations.getAll());
            this.addEventLog('🧬 ' + m.emoji + ' ' + m.name + ' aktiviert!', 'growth');
          } else {
            this._showFeedback(result.reason, '#ff8060');
            this.addEventLog('❌ ' + result.reason, 'crisis');
          }
        });
        this._panelElements.push(btnBg, btnTxt);
      }
    });
  }

  // ── Codex-Panel ─────────────────────────────────────────────────────

  _openCodex() {
    this.codexOpen = true;
    this._renderCodex();
  }

  _closeCodex() {
    this.codexOpen = false;
    for (const el of this._codexElements) el.destroy();
    this._codexElements = [];
  }

  _renderCodex() {
    for (const el of this._codexElements) el.destroy();
    this._codexElements = [];

    const s   = this.scene;
    const W   = s.scale.width;
    const byCat = this.codex.getByCategory();
    const PX  = W / 2 - 200, PY = 80, PW = 400;

    const cats = Object.keys(byCat);
    let totalRows = cats.reduce((acc, c) => acc + byCat[c].length, 0);
    const PH = 40 + cats.length * 24 + totalRows * 44 + 20;

    const bg = s.add.rectangle(PX, PY, PW, PH, 0x060e06, 0.96)
      .setOrigin(0, 0).setDepth(30).setStrokeStyle(1, 0x2a5a3a);
    this._codexElements.push(bg);

    const title = s.add.text(PX + 16, PY + 12, '📖 Ökosystem-Codex', {
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '18px', fill: '#a0d8a0',
    }).setDepth(31);
    this._codexElements.push(title);

    const unlocked = this.codex.getUnlocked().length;
    const total    = this.codex.getAll().length;
    const stat = s.add.text(PX + PW - 16, PY + 16,
      unlocked + ' / ' + total + ' entdeckt',
      { fontFamily: 'sans-serif', fontSize: '11px', fill: '#60a070' }
    ).setOrigin(1, 0).setDepth(31);
    this._codexElements.push(stat);

    // Schließen-Button
    const closeBtn = s.add.text(PX + PW - 12, PY + 8, '✕', {
      fontFamily: 'sans-serif', fontSize: '14px', fill: '#808080',
    }).setOrigin(1, 0).setDepth(32).setInteractive({ cursor: 'pointer' });
    closeBtn.on('pointerdown', () => this._closeCodex());
    this._codexElements.push(closeBtn);

    let curY = PY + 40;
    for (const cat of cats) {
      const catTxt = s.add.text(PX + 16, curY, cat, {
        fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '13px', fill: '#7a9870',
      }).setDepth(31);
      this._codexElements.push(catTxt);
      curY += 20;

      const entries = byCat[cat];
      entries.forEach((e, ei) => {
        const ex = PX + 16 + (ei % 2) * (PW / 2 - 16);
        const ey = curY + Math.floor(ei / 2) * 44;
        const ebg = s.add.rectangle(ex, ey, PW / 2 - 24, 38, e.unlocked ? 0x1a3020 : 0x101210, 0.9)
          .setOrigin(0, 0).setDepth(31)
          .setStrokeStyle(1, e.unlocked ? 0x3a7050 : 0x1a2018);
        const eIcon = s.add.text(ex + 8,  ey + 5,  e.unlocked ? e.icon : '❓', { fontFamily: 'sans-serif', fontSize: '16px' }).setDepth(32);
        const eName = s.add.text(ex + 32, ey + 5,  e.unlocked ? e.name : '???', {
          fontFamily: 'sans-serif', fontSize: '11px', fill: e.unlocked ? '#c0d8b0' : '#505040',
        }).setDepth(32);
        const eCond = s.add.text(ex + 32, ey + 20, e.cond, {
          fontFamily: 'sans-serif', fontSize: '9px', fill: '#607060',
          wordWrap: { width: PW / 2 - 60 },
        }).setDepth(32);
        this._codexElements.push(ebg, eIcon, eName, eCond);
      });
      curY += Math.ceil(entries.length / 2) * 44 + 8;
    }
  }

  // ── Update-Loop ─────────────────────────────────────────────────────

  update() {
    const season = this.seasons.current;
    this.seasonText.setText(season.emoji + '  ' + season.name + '  –  ' + season.description);
    this.yearText.setText('Jahr ' + this.seasons.year);

    const ni    = this.tree.phaseIndex + 1;
    const nextP = ni < TREE_PHASES.length ? TREE_PHASES[ni] : null;

    if (nextP && !this.tree.isGrowing) {
      const cost = nextP.growthCost;
      const symReq = nextP.requiredSymbioses || 0;
      const symCur = this.mutations.getActiveSymbioses();
      const parts  = [];
      if (cost) {
        if (this.resources.get('light')     < cost.light)     parts.push('☀️ ' + Math.floor(this.resources.get('light'))     + '/' + cost.light);
        if (this.resources.get('water')     < cost.water)     parts.push('💧 ' + Math.floor(this.resources.get('water'))     + '/' + cost.water);
        if (this.resources.get('nutrients') < cost.nutrients) parts.push('🌱 ' + Math.floor(this.resources.get('nutrients')) + '/' + cost.nutrients);
      }
      if (symReq > 0 && symCur < symReq) parts.push('🧬 Symbiosen: ' + symCur + '/' + symReq);
      this.growthHint.setText(
        parts.length ? 'Nächste Phase: ' + parts.join('  ') : '✓ Wachstum möglich!'
      );
    } else if (!nextP) {
      this.growthHint.setText('🌳 Urbaum – vollständig');
    } else {
      this.growthHint.setText('🌱 Wächst...');
    }

    const phaseNames = ['Sämling', 'Junger Baum', 'Ausgewachsener Baum', 'Urbaum'];
    this.phaseText.setText(
      'Baum: ' + this.tree.phase.name +
      (ni < TREE_PHASES.length
        ? '  →  ' + (this.tree.isGrowing ? 'wächst...' : 'nächste: ' + (phaseNames[ni] || ''))
        : '  ✓')
    );

    for (const key of Object.keys(this.resources.getAll())) {
      const res = this.resources.getAll()[key];
      if (!this.resTexts[key]) continue;
      const pct = res.value / res.max;
      this.resTexts[key].setText(Math.floor(res.value) + ' / ' + res.max);
      this.resBars[key].width = Math.round(180 * pct);
    }

    this._updateMonthStrip();
  }

  updateSeasonBar() {
    const progress = this.seasons.getProgress();
    const W = this.scene.scale.width;
    this.seasonBar.width = Math.round(W * 0.6 * progress);
    const colors = { spring: 0x80d040, summer: 0xf0d020, autumn: 0xe06010, winter: 0x80a8d0 };
    this.seasonBar.fillColor = colors[this.seasons.current.id];
  }

  showEventBanner(event) {
    if (!event) {
      this.scene.tweens.add({ targets: this.eventBanner, alpha: 0, duration: 600 });
      return;
    }
    this.eventBanner.setText(event.emoji + '  ' + event.name + ' – ' + event.description);
    this.eventBanner.setAlpha(1);
  }

  showClickFeedback(x, y, text, color = '#f0d840') {
    const s   = this.scene;
    const txt = s.add.text(x, y, text, {
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '17px',
      fill: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);
    s.tweens.add({
      targets: txt, y: y - 55, alpha: 0, duration: 900,
      ease: 'Sine.easeOut', onComplete: () => txt.destroy(),
    });
  }

  showSeasonTransition(season) {
    const s = this.scene;
    const W = s.scale.width;
    const H = s.scale.height;
    const overlay = s.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.15).setDepth(12);
    s.tweens.add({ targets: overlay, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => overlay.destroy() });
    const note = s.add.text(W / 2, H * 0.38, season.emoji + '  ' + season.name, {
      fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '30px', fill: '#f0e8d0',
      stroke: '#000000', strokeThickness: 3, alpha: 0,
    }).setOrigin(0.5).setDepth(13);
    s.tweens.add({
      targets: note, alpha: 1, y: H * 0.34, duration: 600,
      ease: 'Back.easeOut', yoyo: true, hold: 1300,
      onComplete: () => note.destroy(),
    });
  }

  _showFeedback(msg, color = '#f0d040') {
    const s   = this.scene;
    const W   = s.scale.width;
    const txt = s.add.text(W * 0.28, 400, msg, {
      fontFamily: 'sans-serif', fontSize: '14px',
      fill: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30);
    s.tweens.add({ targets: txt, y: 355, alpha: 0, duration: 1500, ease: 'Sine.easeOut', onComplete: () => txt.destroy() });
  }
}
