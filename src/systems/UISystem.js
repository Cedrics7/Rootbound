import { TREE_PHASES } from '../config/seasons.js';

/**
 * UISystem: verwaltet das gesamte HUD inkl. Mutations-Panel
 */
export class UISystem {
  constructor(scene, resources, seasons, tree, mutations) {
    this.scene = scene;
    this.resources = resources;
    this.seasons = seasons;
    this.tree = tree;
    this.mutations = mutations;

    this.panelOpen = false;
    this._panelElements = [];
    this._buildHUD();
  }

  _buildHUD() {
    const s = this.scene;
    const style = { fontFamily: 'Georgia, serif', fill: '#e8e0d0' };

    s.add.text(16, 14, '\uD83C\uDF3F Rootbound', { ...style, fontSize: '22px', fill: '#a0d878' });

    this.seasonText = s.add.text(16, 46, '', { ...style, fontSize: '15px' });
    this.yearText   = s.add.text(16, 66, '', { ...style, fontSize: '13px', fill: '#a09888' });
    this.phaseText  = s.add.text(16, 86, '', { ...style, fontSize: '12px', fill: '#88b870' });

    this.eventBanner = s.add.text(512, 720, '', {
      ...style, fontSize: '13px', fill: '#ffdd80',
      stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(5);

    // Ressourcen-Panel rechts oben
    const rx = 820;
    s.add.text(rx, 14, 'Ressourcen', { ...style, fontSize: '14px', fill: '#a0d878' });
    this.resTexts = {};
    this.resBars  = {};
    const resKeys = ['light', 'water', 'nutrients'];
    resKeys.forEach((key, i) => {
      const y = 36 + i * 38;
      const res = this.resources.getAll()[key];
      s.add.text(rx, y, res.emoji + ' ' + res.name, { ...style, fontSize: '13px' });
      this.resTexts[key] = s.add.text(rx + 140, y, '', { ...style, fontSize: '12px', fill: '#c0b8a8' });
      s.add.rectangle(rx, y + 17, 180, 8, 0x1a1a1a).setOrigin(0, 0);
      this.resBars[key] = s.add.rectangle(rx, y + 17, 0, 8, 0xffffff).setOrigin(0, 0);
    });
    this.resBars.light.fillColor     = 0xf0d840;
    this.resBars.water.fillColor     = 0x40a0f0;
    this.resBars.nutrients.fillColor = 0x70c030;

    // Jahreszeit-Fortschrittsbalken unten
    s.add.rectangle(200, 748, 624, 10, 0x1a1a1a).setOrigin(0, 0);
    this.seasonBar = s.add.rectangle(200, 748, 0, 10, 0x60a040).setOrigin(0, 0);
    s.add.text(200, 733, 'Jahreszeit', { ...style, fontSize: '11px', fill: '#888' });

    this.growthHint = s.add.text(512, 650, '', {
      ...style, fontSize: '12px', fill: '#a0d878', align: 'center',
    }).setOrigin(0.5).setDepth(5);

    this._buildMutationButton();
    this.update();
  }

  _buildMutationButton() {
    const s = this.scene;
    const btnX = 16, btnY = 110;

    const bg = s.add.rectangle(btnX, btnY, 160, 28, 0x1a2a1a, 0.85)
      .setOrigin(0, 0)
      .setInteractive({ cursor: 'pointer' })
      .setDepth(4);

    const label = s.add.text(btnX + 80, btnY + 14, '\uD83E\uDDEC Mutationen  \u25BC', {
      fontFamily: 'Georgia, serif', fontSize: '13px', fill: '#88d060',
    }).setOrigin(0.5).setDepth(5);

    bg.on('pointerover', () => bg.setFillStyle(0x2a3a2a, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a2a1a, 0.85));
    bg.on('pointerdown', () => {
      this.panelOpen ? this._closePanel(label) : this._openPanel(label);
    });
    this._mutBtn = { bg, label };
  }

  _openPanel(label) {
    this.panelOpen = true;
    label.setText('\uD83E\uDDEC Mutationen  \u25B2');
    this._renderPanel();
  }

  _closePanel(label) {
    this.panelOpen = false;
    label.setText('\uD83E\uDDEC Mutationen  \u25BC');
    this._clearPanel();
  }

  _clearPanel() {
    for (const el of this._panelElements) el.destroy();
    this._panelElements = [];
  }

  _renderPanel() {
    this._clearPanel();
    const s = this.scene;
    const available = this.mutations.getAvailable(this.tree.phaseIndex);

    const PX = 16, PY = 148, PW = 300, ROWH = 72;
    const PH = 16 + available.length * ROWH + 10;

    const panelBg = s.add.rectangle(PX, PY, PW, PH, 0x0d1a0d, 0.93)
      .setOrigin(0, 0).setDepth(20).setStrokeStyle(1, 0x3a6a2a, 0.8);
    this._panelElements.push(panelBg);

    const title = s.add.text(PX + 12, PY + 10, 'Mutationen & Skills', {
      fontFamily: 'Georgia, serif', fontSize: '14px', fill: '#a0d878',
    }).setDepth(21);
    this._panelElements.push(title);

    available.forEach((m, i) => {
      const ry = PY + 32 + i * ROWH;
      const bgColor = m.active ? 0x1a3a1a : m.unlocked ? 0x1a2a10 : 0x151510;
      const rowBg = s.add.rectangle(PX + 8, ry, PW - 16, ROWH - 6, bgColor, 0.9)
        .setOrigin(0, 0).setDepth(21)
        .setStrokeStyle(1, m.active ? 0x60d040 : 0x2a3a1a, 0.6);
      this._panelElements.push(rowBg);

      const nameText = s.add.text(PX + 14, ry + 6, m.emoji + ' ' + m.name, {
        fontFamily: 'Georgia, serif', fontSize: '13px',
        fill: m.active ? '#80ff60' : m.unlocked ? '#c0d890' : '#606050',
      }).setDepth(22);
      this._panelElements.push(nameText);

      const typeColors = { passive: '#a0c880', active: '#80c0f0', symbiosis: '#f0c040', crisis: '#f06040' };
      const typeBadge = s.add.text(PX + 14 + nameText.width + 8, ry + 8,
        '[' + m.type + ']',
        { fontFamily: 'Georgia, serif', fontSize: '10px', fill: typeColors[m.type] || '#888' }
      ).setDepth(22);
      this._panelElements.push(typeBadge);

      const desc = s.add.text(PX + 14, ry + 26, m.description, {
        fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#908880',
        wordWrap: { width: PW - 36 },
      }).setDepth(22);
      this._panelElements.push(desc);

      if (!m.active && m.type !== 'crisis') {
        const costStr = '\u26A1' + m.cost.light + '  \uD83D\uDCA7' + m.cost.water + '  \uD83C\uDF31' + m.cost.nutrients;
        const costText = s.add.text(PX + 14, ry + 50, costStr, {
          fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#c0a860',
        }).setDepth(22);
        this._panelElements.push(costText);
      } else if (m.active) {
        const al = s.add.text(PX + 14, ry + 50, '\u2713 Aktiv', {
          fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#60d040',
        }).setDepth(22);
        this._panelElements.push(al);
      } else if (m.type === 'crisis') {
        const encountered = this.mutations.crisesEncountered.has(m.requiredCrisis);
        const cl = s.add.text(PX + 14, ry + 50,
          encountered && !m.unlocked
            ? '\u2713 Krise erlebt \u2013 kann aktiviert werden'
            : '\uD83D\uDD12 Krise n\u00F6tig: ' + m.requiredCrisis,
          { fontFamily: 'Georgia, serif', fontSize: '10px', fill: encountered ? '#80d060' : '#806050' }
        ).setDepth(22);
        this._panelElements.push(cl);
      }

      if (!m.active && (m.type !== 'crisis' || this.mutations.crisesEncountered.has(m.requiredCrisis))) {
        const btnBg = s.add.rectangle(PX + PW - 70, ry + 30, 58, 22, 0x2a4a2a, 0.9)
          .setOrigin(0, 0).setDepth(22)
          .setInteractive({ cursor: 'pointer' })
          .setStrokeStyle(1, 0x4a8a3a);
        const btnTxt = s.add.text(PX + PW - 41, ry + 41, 'Aktivieren', {
          fontFamily: 'Georgia, serif', fontSize: '10px', fill: '#80d060',
        }).setOrigin(0.5).setDepth(23);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a6a3a, 0.95));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0x2a4a2a, 0.9));
        btnBg.on('pointerdown', () => {
          const result = this.mutations.activate(m.id, this.resources);
          if (result.ok) {
            this._renderPanel();
            this.scene.tree.draw(this.scene.seasons.current.id, this.mutations.getAll());
          } else {
            this._showFeedback(result.reason, '#ff8060');
          }
        });
        this._panelElements.push(btnBg, btnTxt);
      }
    });
  }

  _showFeedback(msg, color = '#f0d040') {
    const s = this.scene;
    const txt = s.add.text(180, 400, msg, {
      fontFamily: 'Georgia, serif', fontSize: '14px',
      fill: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30);
    s.tweens.add({
      targets: txt, y: 360, alpha: 0, duration: 1500,
      ease: 'Sine.easeOut', onComplete: () => txt.destroy(),
    });
  }

  // ── Update-Loop ────────────────────────────────────────────────────
  update() {
    const season = this.seasons.current;
    this.seasonText.setText(season.emoji + '  ' + season.name + '  \u2013  ' + season.description);
    this.yearText.setText('Jahr ' + this.seasons.year);

    const ni = this.tree.phaseIndex + 1;
    const nextP = ni < TREE_PHASES.length ? TREE_PHASES[ni] : null;

    if (nextP && !this.tree.isGrowing) {
      const cost = nextP.growthCost;
      const symReq = nextP.requiredSymbioses || 0;
      const symCur = this.mutations.getActiveSymbioses();
      const parts = [];
      if (cost) {
        if (this.resources.get('light')     < cost.light)     parts.push('\u2600\uFE0F ' + Math.floor(this.resources.get('light'))     + '/' + cost.light);
        if (this.resources.get('water')     < cost.water)     parts.push('\uD83D\uDCA7 ' + Math.floor(this.resources.get('water'))     + '/' + cost.water);
        if (this.resources.get('nutrients') < cost.nutrients) parts.push('\uD83C\uDF31 ' + Math.floor(this.resources.get('nutrients')) + '/' + cost.nutrients);
      }
      if (symReq > 0 && symCur < symReq) parts.push('\uD83E\uDDEC Symbiosen: ' + symCur + '/' + symReq);
      this.growthHint.setText(
        parts.length
          ? 'N\u00E4chste Phase braucht: ' + parts.join('  ')
          : '\u2713 Wachstum m\u00F6glich!'
      );
    } else if (!nextP) {
      this.growthHint.setText('\uD83C\uDF33 Voll ausgewachsen');
    } else {
      this.growthHint.setText('\uD83C\uDF31 W\u00E4chst...');
    }

    const phaseNames = ['S\u00E4mling', 'Junger Baum', 'Ausgewachsener Baum'];
    this.phaseText.setText(
      'Baum: ' + this.tree.phase.name +
      (ni < TREE_PHASES.length
        ? '  \u2192  ' + (this.tree.isGrowing ? 'w\u00E4chst...' : 'n\u00E4chste: ' + (phaseNames[ni] || ''))
        : '  \u2713')
    );

    for (const key of Object.keys(this.resources.getAll())) {
      const res = this.resources.getAll()[key];
      const pct = res.value / res.max;
      this.resTexts[key].setText(Math.floor(res.value) + ' / ' + res.max);
      this.resBars[key].width = Math.round(180 * pct);
    }
  }

  updateSeasonBar() {
    const progress = this.seasons.getProgress();
    this.seasonBar.width = Math.round(624 * progress);
    const colors = { spring: 0x80d040, summer: 0xf0d020, autumn: 0xe06010, winter: 0x80a8d0 };
    this.seasonBar.fillColor = colors[this.seasons.current.id];
  }

  showEventBanner(event) {
    if (!event) {
      this.scene.tweens.add({ targets: this.eventBanner, alpha: 0, duration: 600 });
      return;
    }
    this.eventBanner.setText(event.emoji + '  ' + event.name + ' \u2013 ' + event.description);
    this.eventBanner.setAlpha(1);
  }

  showClickFeedback(x, y, text, color = '#f0d840') {
    const s = this.scene;
    const txt = s.add.text(x, y, text, {
      fontFamily: 'Georgia, serif', fontSize: '16px',
      fill: color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(12);
    s.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 900,
      ease: 'Sine.easeOut', onComplete: () => txt.destroy(),
    });
  }

  showSeasonTransition(season) {
    const s = this.scene;
    const overlay = s.add.rectangle(512, 384, 1024, 768, 0xffffff, 0.18).setDepth(10);
    s.tweens.add({
      targets: overlay, alpha: 0, duration: 800,
      ease: 'Sine.easeOut', onComplete: () => overlay.destroy(),
    });
    const note = s.add.text(512, 340, season.emoji + '  ' + season.name, {
      fontFamily: 'Georgia, serif', fontSize: '28px', fill: '#f0e8d0',
      stroke: '#000000', strokeThickness: 3, alpha: 0,
    }).setOrigin(0.5).setDepth(11);
    s.tweens.add({
      targets: note, alpha: 1, y: 310, duration: 600,
      ease: 'Back.easeOut', yoyo: true, hold: 1200,
      onComplete: () => note.destroy(),
    });
  }
}
