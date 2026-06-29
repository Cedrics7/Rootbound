import { TREE_PHASES } from '../config/seasons.js';
import { SaveSystem } from './SaveSystem.js';

/**
 * UISystem – HUD, Mutations-Panel (mit Upgrade-Stufen), Event-Log, Codex-Panel.
 */
export class UISystem {
  constructor(scene, resources, seasons, tree, mutations, codex) {
    this.scene     = scene;
    this.resources = resources;
    this.seasons   = seasons;
    this.tree      = tree;
    this.mutations = mutations;
    this.codex     = codex;
    this.panelOpen = false;
    this.codexOpen = false;
    this._panelElements = [];
    this._codexElements = [];
    this._logTexts      = [];
    this._buildHUD();
  }

  _buildHUD() {
    const s = this.scene;
    const W = s.scale.width;
    const H = s.scale.height;
    const DS = { fontFamily: '"Cormorant Garamond", Georgia, serif', fill: '#e8e0d0' };
    const BS = { fontFamily: 'sans-serif', fill: '#c8d8b0' };

    s.add.text(16, 14, '🌳 Rootbound', { ...DS, fontSize: '22px', fill: '#a0d878' }).setDepth(10);
    this.seasonText = s.add.text(16, 46, '', { ...DS, fontSize: '15px' }).setDepth(10);
    this.yearText   = s.add.text(16, 66, '', { ...DS, fontSize: '13px', fill: '#a09888' }).setDepth(10);
    this.phaseText  = s.add.text(16, 86, '', { ...DS, fontSize: '12px', fill: '#88b870' }).setDepth(10);

    this.eventBanner = s.add.text(W / 2, H - 48, '', {
      ...DS, fontSize: '13px', fill: '#ffdd80', stroke: '#000', strokeThickness: 2, align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(12);

    // Ressourcen
    const rx = W - 205;
    s.add.text(rx, 14, 'Ressourcen', { ...DS, fontSize: '14px', fill: '#a0d878' }).setDepth(10);
    this.resTexts = {}; this.resBars = {};
    const resKeys = ['light','water','nutrients','symbiosis'];
    const resColors = { light: 0xf0d840, water: 0x40a0f0, nutrients: 0x70c030, symbiosis: 0x40d0a0 };
    resKeys.forEach((key, i) => {
      const y   = 36 + i * 34;
      const res = this.resources.getAll()[key];
      if (!res) return;
      s.add.text(rx, y, (res.emoji||'') + ' ' + res.name, { ...BS, fontSize: '12px' }).setDepth(10);
      this.resTexts[key] = s.add.text(rx + 148, y, '', { ...BS, fontSize: '11px', fill: '#c0b8a8' }).setDepth(10);
      s.add.rectangle(rx, y + 14, 180, 6, 0x1a1a1a).setOrigin(0,0).setDepth(10);
      this.resBars[key]  = s.add.rectangle(rx, y + 14, 0, 6, resColors[key]||0xffffff).setOrigin(0,0).setDepth(10);
    });

    // Jahreszeit-Fortschrittsbalken
    s.add.rectangle(W*0.2, H-22, W*0.6, 8, 0x1a1a1a).setOrigin(0,0).setDepth(10);
    this.seasonBar = s.add.rectangle(W*0.2, H-22, 0, 8, 0x60a040).setOrigin(0,0).setDepth(10);
    s.add.text(W*0.2, H-36, 'Jahreszeit-Fortschritt', { ...BS, fontSize: '10px', fill: '#555' }).setDepth(10);

    this._buildMonthStrip();

    this.growthHint = s.add.text(W/2, H*0.88, '', { ...BS, fontSize: '11px', fill: '#a0d878', align: 'center' }).setOrigin(0.5).setDepth(10);

    this._buildMutationButton();
    this._buildCodexButton();
    this._buildSaveButton();

    this.update();
  }

  // ── Save-Button ────────────────────────────────────────────────

  _buildSaveButton() {
    const s = this.scene;
    const W = s.scale.width;
    const bg = s.add.rectangle(W - 10, 14, 90, 24, 0x0a1a0a, 0.85)
      .setOrigin(1, 0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x2a5a2a);
    const lbl = s.add.text(W - 55, 26, '💾 Speichern', { fontFamily: 'sans-serif', fontSize: '11px', fill: '#70b060' })
      .setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x152515, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0a1a0a, 0.85));
    bg.on('pointerdown', () => {
      const scene = this.scene;
      SaveSystem.save(this.resources, this.mutations, this.seasons, this.codex, this.tree);
      lbl.setText('✓ Gespeichert');
      scene.time.delayedCall(1500, () => lbl.setText('💾 Speichern'));
      this.addEventLog('💾 Spielstand gespeichert.', 'info');
    });
  }

  // ── Monat-Strip ───────────────────────────────────────────────

  _buildMonthStrip() {
    const s = this.scene;
    const W = s.scale.width;
    const MONTH_COLORS = [0x8ab8cc,0x9ac4d8,0xb0d4c0,0x5fcf6a,0x4db83a,0x2d9a20,0x2d8a10,0x3a9820,0x4aab30,0xc8691a,0xd4801a,0x7090a8];
    this._monthDots = [];
    const startX = W / 2 - 99;
    for (let i = 0; i < 12; i++) {
      this._monthDots.push(s.add.circle(startX + i * 18, 26, 6, MONTH_COLORS[i]).setDepth(10).setAlpha(0.35));
    }
  }

  _updateMonthStrip() {
    const si       = ['spring','summer','autumn','winter'].indexOf(this.seasons.current.id);
    const progress = this.seasons.getProgress();
    const month    = si * 3 + Math.min(2, Math.floor(progress * 3));
    this._monthDots.forEach((dot, i) => {
      dot.setAlpha(i < month ? 0.7 : i === month ? 1.0 : 0.3);
      dot.setScale(i === month ? 1.4 : 1.0);
    });
  }

  // ── Event-Log ─────────────────────────────────────────────────

  addEventLog(msg, type = 'info') {
    const s = this.scene;
    const W = s.scale.width;
    const colors = { event:'#ffdd80', discovery:'#80ffe0', growth:'#a0ff80', season:'#d0d8ff', crisis:'#ff9080', info:'#a0b8a0' };
    if (this._logTexts.length >= 5) {
      const old = this._logTexts.shift();
      s.tweens.add({ targets: old, alpha: 0, duration: 300, onComplete: () => old.destroy() });
    }
    const yOff = this._logTexts.length * 26;
    const txt  = s.add.text(W - 265, 170 + yOff, msg, {
      fontFamily: 'sans-serif', fontSize: '11px', fill: colors[type]||colors.info,
      stroke: '#000', strokeThickness: 1, wordWrap: { width: 245 },
      backgroundColor: 'rgba(0,0,0,0.55)', padding: { x: 6, y: 3 },
    }).setAlpha(0).setDepth(11);
    s.tweens.add({ targets: txt, alpha: 1, duration: 300 });
    s.tweens.add({ targets: txt, alpha: 0, delay: 5000, duration: 800, onComplete: () => {
      txt.destroy();
      this._logTexts = this._logTexts.filter(t => t !== txt);
    }});
    this._logTexts.push(txt);
  }

  // ── Mutation-Button & Panel ───────────────────────────────────────

  _buildMutationButton() {
    const s = this.scene;
    const bg = s.add.rectangle(16, 110, 170, 28, 0x1a2a1a, 0.88)
      .setOrigin(0,0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x3a6a2a);
    const label = s.add.text(101, 124, '🧦 Mutationen  ▼', { fontFamily: 'sans-serif', fontSize: '12px', fill: '#88d060' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x2a3a2a, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a2a1a, 0.88));
    bg.on('pointerdown', () => this.panelOpen ? this._closePanel(label) : this._openPanel(label));
    this._mutBtn = { bg, label };
  }

  _buildCodexButton() {
    const s = this.scene;
    const bg = s.add.rectangle(16, 146, 170, 26, 0x0d1a2a, 0.88)
      .setOrigin(0,0).setInteractive({ cursor: 'pointer' }).setDepth(11).setStrokeStyle(1, 0x2a4a6a);
    s.add.text(101, 159, '📖 Codex', { fontFamily: 'sans-serif', fontSize: '12px', fill: '#80c0f0' }).setOrigin(0.5).setDepth(12);
    bg.on('pointerover', () => bg.setFillStyle(0x152035, 0.95));
    bg.on('pointerout',  () => bg.setFillStyle(0x0d1a2a, 0.88));
    bg.on('pointerdown', () => this.codexOpen ? this._closeCodex() : this._openCodex());
  }

  _openPanel(label)  { this.panelOpen = true;  label.setText('🧦 Mutationen  ▲'); this._renderPanel(); }
  _closePanel(label) { this.panelOpen = false; label.setText('🧦 Mutationen  ▼'); this._clearPanel(); }
  _clearPanel()      { for (const el of this._panelElements) el.destroy(); this._panelElements = []; }

  _renderPanel() {
    this._clearPanel();
    const s = this.scene;
    const available = this.mutations.getAvailable(this.tree.phaseIndex);
    const slots     = TREE_PHASES[this.tree.phaseIndex]?.upgradeSlots ?? 1;
    const active    = this.mutations.getAll().filter(m => m.active).length;
    const PX = 16, PY = 180, PW = 330, ROWH = 84;
    const PH = 28 + available.length * ROWH + 16;

    const panelBg = s.add.rectangle(PX, PY, PW, PH, 0x080e08, 0.95).setOrigin(0,0).setDepth(20).setStrokeStyle(1, 0x3a6a2a, 0.8);
    this._panelElements.push(panelBg);

    // Slot-Anzeige
    const slotTxt = s.add.text(PX + 12, PY + 8,
      'Aktive Mutationen: ' + active + ' / ' + slots + ' Slots (Phase ' + (this.tree.phaseIndex + 1) + ')',
      { fontFamily: 'sans-serif', fontSize: '11px', fill: active >= slots ? '#ff8060' : '#70a050' }
    ).setDepth(21);
    this._panelElements.push(slotTxt);

    available.forEach((m, i) => {
      const ry = PY + 28 + i * ROWH;
      const bgColor = m.level > 0 ? (m.level === 3 ? 0x1a3a0a : 0x142a0e) : 0x0e110a;
      const borderColor = m.level === 3 ? 0x80ff40 : m.level > 0 ? 0x50c030 : m.type === 'symbiosis' ? 0xc0a030 : 0x2a3a1a;
      const rowBg = s.add.rectangle(PX+6, ry, PW-12, ROWH-6, bgColor, 0.92).setOrigin(0,0).setDepth(21).setStrokeStyle(1, borderColor, 0.7);
      this._panelElements.push(rowBg);

      // Name + Stufe-Punkte
      const nameColor = m.level === 3 ? '#a0ff60' : m.level > 0 ? '#70d040' : m.unlocked ? '#b0d080' : '#505040';
      const nameTxt = s.add.text(PX+14, ry+6, m.emoji + ' ' + m.name, {
        fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '13px', fill: nameColor,
      }).setDepth(22);
      this._panelElements.push(nameTxt);

      // Stufen-Punkte (Kreise)
      const maxLvl = m.upgrades.length;
      for (let lvl = 0; lvl < maxLvl; lvl++) {
        const dotX = PX + 14 + nameTxt.width + 12 + lvl * 12;
        const filled = lvl < m.level;
        const dot = s.add.circle(dotX, ry + 12, 4, filled ? 0x70ff40 : 0x303020, filled ? 1 : 0.5).setDepth(22);
        this._panelElements.push(dot);
      }

      // Typ-Badge
      const typeColors = { passive:'#a0c880', active:'#80c0f0', symbiosis:'#f0c040', crisis:'#f06040' };
      const badge = s.add.text(PX + PW - 70, ry + 8, '[' + m.type + ']',
        { fontFamily: 'sans-serif', fontSize: '10px', fill: typeColors[m.type] || '#888' }
      ).setDepth(22);
      this._panelElements.push(badge);

      // Beschreibung der nächsten oder aktuellen Stufe
      const showLevel  = m.level < maxLvl ? m.level : m.level - 1;
      const upgradeData = m.upgrades[showLevel];
      const desc = s.add.text(PX+14, ry+26, upgradeData.description, {
        fontFamily: 'sans-serif', fontSize: '10px', fill: '#909880', wordWrap: { width: PW - 40 },
      }).setDepth(22);
      this._panelElements.push(desc);

      // Status-Zeile
      let statusText, statusColor;
      if (m.level === maxLvl) {
        statusText = '★★★ Maximale Stufe erreicht';
        statusColor = '#a0ff60';
      } else if (m.active) {
        const cost = m.upgrades[m.level].cost;
        const costStr = Object.entries(cost).filter(([,v])=>v>0).map(([k,v])=>{
          const icons = {light:'☀️',water:'💧',nutrients:'🌱'};
          return (icons[k]||k)+v;
        }).join('  ');
        statusText  = '▲ Stufe ' + (m.level + 1) + ': ' + (costStr || 'Kostenlos');
        statusColor = '#c0d060';
      } else if (m.type === 'crisis' && !m.unlocked) {
        statusText  = '🔒 Krise nötig: ' + m.requiredCrisis;
        statusColor = '#806050';
      } else {
        const cost = m.upgrades[0].cost;
        const costStr = Object.entries(cost).filter(([,v])=>v>0).map(([k,v])=>{
          const icons = {light:'☀️',water:'💧',nutrients:'🌱'};
          return (icons[k]||k)+v;
        }).join('  ');
        statusText  = 'Aktivieren: ' + (costStr || 'Kostenlos');
        statusColor = '#a0c860';
      }
      const statusTxt = s.add.text(PX+14, ry+56, statusText, {
        fontFamily: 'sans-serif', fontSize: '10px', fill: statusColor,
      }).setDepth(22);
      this._panelElements.push(statusTxt);

      // Slot-Limit prüfen
      const slotFull = active >= slots && !m.active;

      // Aktivieren/Upgrade-Button
      if (m.level < maxLvl && (m.type !== 'crisis' || m.unlocked) && !slotFull) {
        const btnLabel = m.level === 0 ? 'Aktivieren' : 'Upgrade Stufe ' + (m.level + 1);
        const btnBg = s.add.rectangle(PX+PW-80, ry+34, 72, 22, 0x1a3a1a, 0.92)
          .setOrigin(0,0).setDepth(22).setInteractive({ cursor: 'pointer' }).setStrokeStyle(1, 0x4a8a3a);
        const btnTxt = s.add.text(PX+PW-44, ry+45, btnLabel, {
          fontFamily: 'sans-serif', fontSize: '9px', fill: '#80d060',
        }).setOrigin(0.5).setDepth(23);
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x2a5a2a, 0.95));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0x1a3a1a, 0.92));
        btnBg.on('pointerdown', () => {
          const result = this.mutations.activate(m.id, this.resources);
          if (result.ok) {
            this.scene.tree.draw(this.scene.seasons.current.id, this.mutations.getVisuals());
            this._renderPanel();
            const lvlStr = result.level === 3 ? ' (MAX!)' : ' (Stufe '+result.level+')';
            this.addEventLog('🧦 ' + m.emoji + ' ' + m.name + lvlStr, 'growth');
          } else {
            this._showFeedback(result.reason, '#ff8060');
            this.addEventLog('❌ ' + result.reason, 'crisis');
          }
        });
        this._panelElements.push(btnBg, btnTxt);
      } else if (slotFull && m.level === 0) {
        const lock = s.add.text(PX+PW-74, ry+44, '🔒 Slot voll', {
          fontFamily: 'sans-serif', fontSize: '9px', fill: '#806040',
        }).setDepth(22);
        this._panelElements.push(lock);
      }
    });
  }

  // ── Codex-Panel ───────────────────────────────────────────────

  _openCodex()  { this.codexOpen = true;  this._renderCodex(); }
  _closeCodex() {
    this.codexOpen = false;
    for (const el of this._codexElements) el.destroy();
    this._codexElements = [];
  }

  _renderCodex() {
    for (const el of this._codexElements) el.destroy();
    this._codexElements = [];
    const s = this.scene;
    const W = s.scale.width;
    const byCat = this.codex.getByCategory();
    const PX = W/2 - 200, PY = 80, PW = 400;
    const cats = Object.keys(byCat);
    const totalRows = cats.reduce((a, c) => a + byCat[c].length, 0);
    const PH = 40 + cats.length * 24 + totalRows * 44 + 20;
    const bg = s.add.rectangle(PX, PY, PW, PH, 0x060e06, 0.96).setOrigin(0,0).setDepth(30).setStrokeStyle(1, 0x2a5a3a);
    this._codexElements.push(bg);
    s.add.text && this._codexElements.push(
      s.add.text(PX+16, PY+12, '📖 Ökosystem-Codex', { fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'18px', fill:'#a0d8a0' }).setDepth(31),
      s.add.text(PX+PW-16, PY+16, this.codex.getUnlocked().length+' / '+this.codex.getAll().length+' entdeckt', { fontFamily:'sans-serif', fontSize:'11px', fill:'#60a070' }).setOrigin(1,0).setDepth(31)
    );
    const closeBtn = s.add.text(PX+PW-12, PY+8, '✕', { fontFamily:'sans-serif', fontSize:'14px', fill:'#808080' }).setOrigin(1,0).setDepth(32).setInteractive({ cursor:'pointer' });
    closeBtn.on('pointerdown', () => this._closeCodex());
    this._codexElements.push(closeBtn);
    let curY = PY + 40;
    for (const cat of cats) {
      this._codexElements.push(s.add.text(PX+16, curY, cat, { fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'13px', fill:'#7a9870' }).setDepth(31));
      curY += 20;
      const entries = byCat[cat];
      entries.forEach((e, ei) => {
        const ex = PX + 16 + (ei%2)*(PW/2-16);
        const ey = curY + Math.floor(ei/2)*44;
        this._codexElements.push(
          s.add.rectangle(ex, ey, PW/2-24, 38, e.unlocked?0x1a3020:0x101210, 0.9).setOrigin(0,0).setDepth(31).setStrokeStyle(1, e.unlocked?0x3a7050:0x1a2018),
          s.add.text(ex+8,  ey+5,  e.unlocked?e.icon:'❓', { fontFamily:'sans-serif', fontSize:'16px' }).setDepth(32),
          s.add.text(ex+32, ey+5,  e.unlocked?e.name:'???', { fontFamily:'sans-serif', fontSize:'11px', fill:e.unlocked?'#c0d8b0':'#505040' }).setDepth(32),
          s.add.text(ex+32, ey+20, e.cond, { fontFamily:'sans-serif', fontSize:'9px', fill:'#607060', wordWrap:{width:PW/2-60} }).setDepth(32)
        );
      });
      curY += Math.ceil(entries.length/2)*44 + 8;
    }
  }

  // ── Update-Loop ───────────────────────────────────────────────

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
      const parts = [];
      if (cost) {
        if (this.resources.get('light')     < cost.light)     parts.push('☀️ '+Math.floor(this.resources.get('light'))+'/'+cost.light);
        if (this.resources.get('water')     < cost.water)     parts.push('💧 '+Math.floor(this.resources.get('water'))+'/'+cost.water);
        if (this.resources.get('nutrients') < cost.nutrients) parts.push('🌱 '+Math.floor(this.resources.get('nutrients'))+'/'+cost.nutrients);
      }
      if (symReq > 0 && symCur < symReq) parts.push('🧦 Symbiosen: '+symCur+'/'+symReq);
      this.growthHint.setText(parts.length ? 'Nächste Phase: '+parts.join('  ') : '✓ Wachstum möglich!');
    } else if (!nextP) {
      this.growthHint.setText('🌳 Urbaum – vollständig');
    } else {
      this.growthHint.setText('🌱 Wächst...');
    }
    this.phaseText.setText('Baum: ' + this.tree.phase.name + (ni < TREE_PHASES.length
      ? '  →  ' + (this.tree.isGrowing ? 'wächst...' : TREE_PHASES[ni]?.name || '')
      : '  ✓'));
    for (const key of Object.keys(this.resources.getAll())) {
      const res = this.resources.getAll()[key];
      if (!this.resTexts[key]) continue;
      this.resTexts[key].setText(Math.floor(res.value)+' / '+res.max);
      this.resBars[key].width = Math.round(180 * (res.value / res.max));
    }
    this._updateMonthStrip();
  }

  updateSeasonBar() {
    const p = this.seasons.getProgress();
    const W = this.scene.scale.width;
    this.seasonBar.width = Math.round(W * 0.6 * p);
    const colors = { spring:0x80d040, summer:0xf0d020, autumn:0xe06010, winter:0x80a8d0 };
    this.seasonBar.fillColor = colors[this.seasons.current.id];
  }

  showEventBanner(event) {
    if (!event) { this.scene.tweens.add({ targets: this.eventBanner, alpha: 0, duration: 600 }); return; }
    this.eventBanner.setText(event.emoji + '  ' + event.name + ' – ' + event.description);
    this.eventBanner.setAlpha(1);
  }

  showClickFeedback(x, y, text, color = '#f0d840') {
    const s   = this.scene;
    const txt = s.add.text(x, y, text, { fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'17px', fill:color, stroke:'#000', strokeThickness:2 }).setOrigin(0.5).setDepth(12);
    s.tweens.add({ targets:txt, y:y-55, alpha:0, duration:900, ease:'Sine.easeOut', onComplete:()=>txt.destroy() });
  }

  showSeasonTransition(season) {
    const s=this.scene, W=s.scale.width, H=s.scale.height;
    const ov=s.add.rectangle(W/2,H/2,W,H,0xffffff,0.15).setDepth(12);
    s.tweens.add({ targets:ov, alpha:0, duration:900, ease:'Sine.easeOut', onComplete:()=>ov.destroy() });
    const note=s.add.text(W/2,H*0.38,season.emoji+'  '+season.name, { fontFamily:'"Cormorant Garamond",Georgia,serif', fontSize:'30px', fill:'#f0e8d0', stroke:'#000000', strokeThickness:3, alpha:0 }).setOrigin(0.5).setDepth(13);
    s.tweens.add({ targets:note, alpha:1, y:H*0.34, duration:600, ease:'Back.easeOut', yoyo:true, hold:1300, onComplete:()=>note.destroy() });
  }

  _showFeedback(msg, color='#f0d040') {
    const s=this.scene, W=s.scale.width;
    const txt=s.add.text(W*0.28,400,msg,{fontFamily:'sans-serif',fontSize:'14px',fill:color,stroke:'#000',strokeThickness:2}).setOrigin(0.5).setDepth(30);
    s.tweens.add({ targets:txt, y:355, alpha:0, duration:1500, ease:'Sine.easeOut', onComplete:()=>txt.destroy() });
  }
}
