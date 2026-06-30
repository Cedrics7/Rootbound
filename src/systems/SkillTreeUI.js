import { SKILL_TREE, SKILL_BRANCHES } from '../config/skills.js';

/**
 * SkillTreeUI – interaktives Skill-Baum-Panel
 *
 * Öffnen/Schließen via open() / close().
 * Zeigt alle Skills in 3 Zweig-Tabs, Verbindungslinien zwischen Abhängigkeiten,
 * Kosten und Voraussetzungen. Freischalten per Klick.
 */
export class SkillTreeUI {
  constructor(scene, skillSystem, resourceSystem, creatureSystem) {
    this.scene    = scene;
    this.skills   = skillSystem;
    this.res      = resourceSystem;
    this.creature = creatureSystem;
    this._els     = [];
    this._open    = false;
    this._tab     = 'natur';
  }

  get isOpen() { return this._open; }

  open() {
    if (this._open) return;
    this._open = true;
    this._render();
  }

  close() {
    this._open = false;
    this._clear();
  }

  toggle() { this._open ? this.close() : this.open(); }

  // ── Render ────────────────────────────────────────────────────────────
  _render() {
    this._clear();
    const s  = this.scene;
    const W  = s.scale.width;
    const H  = s.scale.height;
    const PW = Math.min(520, W - 20);
    const PH = Math.min(480, H - 20);
    const PX = W / 2 - PW / 2;
    const PY = H / 2 - PH / 2;
    const push = el => { this._els.push(el); return el; };

    // ── Hintergrund-Overlay
    const ov = push(s.add.rectangle(W/2, H/2, W, H, 0x000000, 0.55).setDepth(30)
      .setInteractive());
    ov.on('pointerdown', () => this.close());

    // ── Panel
    push(s.add.rectangle(W/2, H/2, PW, PH, 0x080e08, 0.97)
      .setDepth(31).setStrokeStyle(1.5, 0x3a6a2a));

    // ── Titel + Schließen
    push(s.add.text(PX + 12, PY + 10, '🌳 Skill-Baum – Wurzeln des Wissens', {
      fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '16px', fill: '#a0d878',
    }).setDepth(32));
    const closeBtn = push(s.add.text(PX + PW - 14, PY + 10, '×', {
      fontFamily: 'sans-serif', fontSize: '18px', fill: '#607850',
    }).setOrigin(1, 0).setDepth(32).setInteractive({ cursor: 'pointer' }));
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ff8060' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#607850' }));
    closeBtn.on('pointerdown', () => this.close());

    // ── Branch-Tabs
    const tabs = Object.entries(SKILL_BRANCHES);
    const tabW = (PW - 24) / tabs.length;
    tabs.forEach(([branch, meta], i) => {
      const tx   = PX + 12 + i * tabW + tabW / 2;
      const ty   = PY + 34;
      const active = branch === this._tab;
      const tabBg = push(s.add.rectangle(tx, ty, tabW - 4, 22,
        active ? 0x1a3a1a : 0x0a1a0a, active ? 0.95 : 0.75)
        .setDepth(32).setStrokeStyle(1, active ? 0x60a030 : 0x2a3a1a)
        .setInteractive({ cursor: 'pointer' }));
      push(s.add.text(tx, ty, meta.label, {
        fontFamily: 'sans-serif', fontSize: '11px', fill: active ? meta.color : '#506040',
      }).setOrigin(0.5).setDepth(33));
      if (!active) {
        tabBg.on('pointerdown', () => { this._tab = branch; this._render(); });
        tabBg.on('pointerover', () => tabBg.setFillStyle(0x142a14, 0.9));
        tabBg.on('pointerout',  () => tabBg.setFillStyle(0x0a1a0a, 0.75));
      }
    });

    // ── Skills des aktiven Tabs
    const skills = SKILL_TREE.filter(sk =>
      sk.branch === this._tab ||
      // Cross-Skills im Verbund-Tab
      (this._tab === 'cross' && sk.branch === 'cross')
    );

    // Grid: col 0-8 übergreifend, Tab-spezifische Cols
    const colMap = { natur: [0,1,2], wild: [3,4,5], harmonie: [6,7,8], cross: [0,1,2,3,4,5,6,7,8] };
    const cols   = colMap[this._tab] ?? [0,1,2];
    const ROWS   = 5;
    const cellW  = (PW - 24) / cols.length;
    const cellH  = (PH - 80) / ROWS;
    const gridX  = PX + 12;
    const gridY  = PY + 62;

    // Verbindungslinien zuerst (Depth 31)
    const gfx = push(s.add.graphics().setDepth(31));
    skills.forEach(skill => {
      skill.requires.forEach(reqId => {
        const req = SKILL_TREE.find(r => r.id === reqId);
        if (!req) return;
        const sCol = cols.indexOf(skill.pos.col);
        const rCol = cols.indexOf(req.pos.col);
        if (sCol < 0 || rCol < 0) return; // nicht im Tab sichtbar
        const x1 = gridX + rCol   * cellW + cellW / 2;
        const y1 = gridY + req.pos.row   * cellH + cellH / 2;
        const x2 = gridX + sCol   * cellW + cellW / 2;
        const y2 = gridY + skill.pos.row * cellH + cellH / 2;
        const bothUnlocked = this.skills.isUnlocked(skill.id) && this.skills.isUnlocked(reqId);
        const lineColor = bothUnlocked ? 0x60a030 : 0x2a3a2a;
        gfx.lineStyle(1.5, lineColor, bothUnlocked ? 0.8 : 0.4);
        gfx.beginPath();
        gfx.moveTo(x1, y1);
        gfx.lineTo(x2, y2);
        gfx.strokePath();
      });
    });

    // Skill-Karten
    skills.forEach(skill => {
      const colIdx = cols.indexOf(skill.pos.col);
      if (colIdx < 0) return;
      const cx = gridX + colIdx * cellW + cellW / 2;
      const cy = gridY + skill.pos.row * cellH + cellH / 2;
      const cW = Math.min(cellW - 8, 110);
      const cH = Math.min(cellH - 8, 72);

      const unlocked = this.skills.isUnlocked(skill.id);
      const check    = this.skills.canUnlock(skill.id, this.res, this.creature.level);
      const canBuy   = check.ok;

      const cardColor = unlocked ? 0x1a3a0a :
                        canBuy   ? 0x1a1a0a : 0x0a0e0a;
      const strokeCol = unlocked ? 0x60d030 :
                        canBuy   ? 0x807020 : 0x2a3a2a;

      const card = push(s.add.rectangle(cx, cy, cW, cH, cardColor, 0.95)
        .setDepth(32).setStrokeStyle(1.5, strokeCol)
        .setInteractive({ cursor: unlocked ? 'default' : 'pointer' }));

      push(s.add.text(cx, cy - cH/2 + 12, skill.emoji + ' ' + skill.name, {
        fontFamily: '"Cormorant Garamond",Georgia,serif',
        fontSize: '11px',
        fill: unlocked ? '#a0ff60' : canBuy ? '#d0c060' : '#4a6040',
      }).setOrigin(0.5).setDepth(33));

      // Kurzbeschreibung (erste 40 Zeichen)
      push(s.add.text(cx, cy - 4, skill.description.substring(0, 38) + (skill.description.length > 38 ? '…' : ''), {
        fontFamily: 'sans-serif', fontSize: '8px', fill: '#607850',
        wordWrap: { width: cW - 8 }, align: 'center',
      }).setOrigin(0.5).setDepth(33));

      if (unlocked) {
        push(s.add.text(cx, cy + cH/2 - 10, '✓ Freigeschaltet', {
          fontFamily: 'sans-serif', fontSize: '8px', fill: '#60a030',
        }).setOrigin(0.5).setDepth(33));
      } else {
        // Kostenzeile
        const costStr = Object.entries(skill.cost)
          .map(([k, v]) => k === 'xp' ? 'Lv' + this.skills._xpTierMinLevel(skill.tier) :
            v + ' ' + { light: '☀️', water: '💧', nutrients: '🌱', symbiosis: '🪼' }[k])
          .join(' ');
        push(s.add.text(cx, cy + cH/2 - 10, costStr, {
          fontFamily: 'sans-serif', fontSize: '8px',
          fill: canBuy ? '#a09030' : '#503820',
        }).setOrigin(0.5).setDepth(33));

        if (!canBuy && !unlocked) {
          push(s.add.text(cx, cy + 10, check.reason, {
            fontFamily: 'sans-serif', fontSize: '7px', fill: '#604030',
            wordWrap: { width: cW - 8 }, align: 'center',
          }).setOrigin(0.5).setDepth(33));
        }
      }

      if (!unlocked) {
        card.on('pointerover', () => canBuy && card.setStrokeStyle(1.5, 0xd0c030));
        card.on('pointerout',  () => card.setStrokeStyle(1.5, strokeCol));
        card.on('pointerdown', () => {
          const result = this.skills.unlock(skill.id, this.res, this.creature.level);
          if (result.ok) {
            // Feedback
            const fb = s.add.text(cx, cy - 20, '✨ ' + skill.name + ' freigeschaltet!', {
              fontFamily: 'sans-serif', fontSize: '11px', fill: '#a0ff60',
              stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5).setDepth(40);
            s.tweens.add({ targets: fb, y: cy - 50, alpha: 0, duration: 1200, onComplete: () => fb.destroy() });
            this._render(); // Panel neu rendern
          } else {
            const fb = s.add.text(cx, cy, '⚠ ' + result.reason, {
              fontFamily: 'sans-serif', fontSize: '10px', fill: '#ff8040',
              stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5).setDepth(40);
            s.tweens.add({ targets: fb, y: cy - 30, alpha: 0, duration: 1500, onComplete: () => fb.destroy() });
          }
        });
      }
    });

    // ── Freigeschaltete Boni Zusammenfassung (unten)
    const bonuses = this.skills.getBonuses();
    const activeBonusLines = [];
    if (bonuses.allRatesBonus > 0)         activeBonusLines.push('+' + Math.round(bonuses.allRatesBonus*100) + '% Alle');
    if (bonuses.lightRateBonus > 0)        activeBonusLines.push('+' + Math.round(bonuses.lightRateBonus*100) + '% Licht');
    if (bonuses.waterRateBonus > 0)        activeBonusLines.push('+' + Math.round(bonuses.waterRateBonus*100) + '% Wasser');
    if (bonuses.nutrientsRateBonus > 0)    activeBonusLines.push('+' + Math.round(bonuses.nutrientsRateBonus*100) + '% Nähr.');
    if (bonuses.questSpeedBonus > 0)       activeBonusLines.push('+' + Math.round(bonuses.questSpeedBonus*100) + '% Quest');
    if (bonuses.eventDamageReduction > 0)  activeBonusLines.push('-' + Math.round(bonuses.eventDamageReduction*100) + '% Krisen');
    if (bonuses.symbiosisPassive > 0)      activeBonusLines.push('+' + bonuses.symbiosisPassive.toFixed(1) + ' Sym/s');
    const summary = activeBonusLines.length ? activeBonusLines.join('  ·  ') : 'Noch keine Boni aktiv.';
    push(s.add.text(W/2, PY + PH - 12, summary, {
      fontFamily: 'sans-serif', fontSize: '9px', fill: '#60a040',
    }).setOrigin(0.5).setDepth(32));
  }

  _clear() {
    for (const el of this._els) { try { el.destroy(); } catch(e) {} }
    this._els = [];
  }
}
