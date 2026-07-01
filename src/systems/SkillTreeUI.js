import { SKILL_BRANCHES } from '../config/skills.js';

/**
 * SkillTreeUI – Neues Level-basiertes Design.
 * Zeigt Creature-Level prominent, Skills sind nach Level-Gate gruppiert.
 * Essenz-Ressource wird angezeigt.
 */
export class SkillTreeUI {
  constructor(scene, skillSys, resources, creature) {
    this.scene    = scene;
    this.skillSys = skillSys;
    this.resources = resources;
    this.creature  = creature;
    this.isOpen    = false;
    this._els      = [];
    this._panel    = null;
    this._lastLevel = -1;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this._build();
  }

  close() {
    this.isOpen = false;
    for (const el of this._els) { try { el.destroy(); } catch(_) {} }
    this._els   = [];
    this._panel = null;
  }

  // ─── Hauptpanel ──────────────────────────────────────────────────────────

  _build() {
    this.close();
    this.isOpen = true;

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const lvl = this.creature?.level ?? 1;
    this._lastLevel = lvl;

    // Hintergrund-Overlay
    const overlay = this.scene.add.rectangle(W/2, H/2, W, H, 0x000000, 0.60)
      .setDepth(30).setInteractive();
    this._els.push(overlay);

    // Panel
    const pw = Math.min(W - 20, 520);
    const ph = Math.min(H - 30, 580);
    const px = W/2;
    const py = H/2;
    const panel = this.scene.add.rectangle(px, py, pw, ph, 0x0a120a, 0.97)
      .setDepth(31).setStrokeStyle(1.5, 0x3a6a28);
    this._els.push(panel);
    this._panel = panel;

    const left = px - pw/2;
    const top  = py - ph/2;

    // Titel + Schließen
    const title = this.scene.add.text(px, top + 18, '🌳 Skill-Baum', {
      fontFamily: '"Segoe UI", sans-serif', fontSize: '15px', fill: '#a0d878',
    }).setOrigin(0.5, 0).setDepth(32);
    this._els.push(title);

    const closeBtn = this.scene.add.text(left + pw - 14, top + 12, '✕', {
      fontFamily: 'sans-serif', fontSize: '14px', fill: '#80a060',
    }).setOrigin(1, 0).setDepth(32).setInteractive({ cursor: 'pointer' });
    closeBtn.on('pointerdown', () => this.close());
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#80a060' }));
    this._els.push(closeBtn);

    // Level-Banner
    const expNext = this.creature?.xpForNextLevel?.() ?? '?';
    const expCur  = this.creature?.xp ?? 0;
    const lvlBg   = this.scene.add.rectangle(px, top + 50, pw - 20, 32, 0x1a2e14, 1)
      .setDepth(32).setStrokeStyle(1, 0x4a8a30);
    this._els.push(lvlBg);
    const lvlTxt  = this.scene.add.text(px, top + 50,
      `⭐ Level ${lvl}  ·  XP: ${Math.floor(expCur)} / ${expNext}  ·  💎 Essenz: ${Math.floor(this.resources.get('essence'))}`,
      { fontFamily: 'sans-serif', fontSize: '11px', fill: '#d0ff80' }
    ).setOrigin(0.5).setDepth(33);
    this._els.push(lvlTxt);

    // XP-Balken
    const barW  = pw - 40;
    const xpPct = typeof expNext === 'number' && expNext > 0 ? Math.min(1, expCur / expNext) : 0;
    const barBg = this.scene.add.rectangle(left + 20 + barW/2, top + 68, barW, 5, 0x1a2a12, 1).setDepth(32);
    const barFg = this.scene.add.rectangle(left + 20 + barW * xpPct / 2, top + 68, barW * xpPct, 5, 0x60c030, 1).setDepth(33).setOrigin(0, 0.5);
    this._els.push(barBg, barFg);

    // Ressourcen-Zeile
    const resY = top + 83;
    const resTxt = this.scene.add.text(left + 10, resY,
      `☀️ ${Math.floor(this.resources.get('light'))}  💧 ${Math.floor(this.resources.get('water'))}  🌱 ${Math.floor(this.resources.get('nutrients'))}  🔮 ${Math.floor(this.resources.get('symbiosis'))}`,
      { fontFamily: 'sans-serif', fontSize: '10px', fill: '#90b878' }
    ).setDepth(32);
    this._els.push(resTxt);

    // Trennlinie
    const div = this.scene.add.rectangle(px, top + 95, pw - 20, 1, 0x3a5a28, 0.8).setDepth(32);
    this._els.push(div);

    // Skill-Liste (scrollbar via Container-Clip wäre ideal, hier einfache Liste)
    const skills   = this.skillSys.getSkillsWithStatus(this.resources, lvl);
    const branches = ['natur', 'wild', 'harmonie', 'cross'];
    let   curY     = top + 106;
    const contentH = ph - 116;

    for (const branchId of branches) {
      const bMeta   = SKILL_BRANCHES[branchId];
      const bSkills = skills.filter(s => s.branch === branchId);
      if (!bSkills.length) continue;

      // Branch-Header
      const bhdr = this.scene.add.text(left + 14, curY, bMeta.label, {
        fontFamily: 'sans-serif', fontSize: '10px', fill: bMeta.color, fontStyle: 'bold',
      }).setDepth(32);
      this._els.push(bhdr);
      curY += 14;

      for (const skill of bSkills) {
        if (curY > top + ph - 18) break; // overflow guard
        const rowH = 36;
        const unlocked = skill.unlocked;
        const canDo    = skill.canUnlock && !unlocked;
        const lvlGated = !skill.lvlOk && !unlocked;

        // Zeilen-Hintergrund
        const rowAlpha = unlocked ? 0.35 : canDo ? 0.22 : 0.10;
        const rowColor = unlocked ? 0x1a3a14 : canDo ? 0x122212 : 0x0a0e0a;
        const rowBg = this.scene.add.rectangle(px, curY + rowH/2, pw - 20, rowH - 2, rowColor, rowAlpha)
          .setDepth(31).setStrokeStyle(1, unlocked ? 0x60c040 : canDo ? 0x304820 : 0x1a2214);
        this._els.push(rowBg);

        // Emoji + Name
        const nameCol = unlocked ? '#a0ff60' : canDo ? '#d0e890' : lvlGated ? '#705840' : '#506040';
        const nameTxt = this.scene.add.text(left + 18, curY + 6,
          `${skill.emoji} ${skill.name}`,
          { fontFamily: 'sans-serif', fontSize: '11px', fill: nameCol, fontStyle: unlocked ? 'bold' : 'normal' }
        ).setDepth(32);
        this._els.push(nameTxt);

        // Level-Badge
        const lvlColor = skill.lvlOk || unlocked ? '#70c050' : '#c08040';
        const lvlBadge = this.scene.add.text(left + pw - 26, curY + 4,
          `Lv.${skill.levelRequired}`,
          { fontFamily: 'sans-serif', fontSize: '9px', fill: lvlColor }
        ).setOrigin(1, 0).setDepth(32);
        this._els.push(lvlBadge);

        // Beschreibung oder Sperr-Grund
        const descCol  = unlocked ? '#70a050' : '#506040';
        const descText = unlocked
          ? '✓ ' + skill.description
          : (canDo ? skill.description : (skill.reason ?? skill.description));
        const desc = this.scene.add.text(left + 18, curY + 19, descText, {
          fontFamily: 'sans-serif', fontSize: '9px', fill: descCol,
          wordWrap: { width: pw - 100 },
        }).setDepth(32);
        this._els.push(desc);

        // Kosten-Badge (rechts)
        if (!unlocked) {
          const costParts = [];
          const costIcons = { light: '☀️', water: '💧', nutrients: '🌱', symbiosis: '🔮', essence: '💎' };
          for (const [k, v] of Object.entries(skill.cost)) {
            const has  = (this.resources.get(k) ?? 0) >= v;
            costParts.push({ icon: costIcons[k] || k, val: v, has });
          }
          let cx2 = left + pw - 26;
          for (let ci = costParts.length - 1; ci >= 0; ci--) {
            const cp  = costParts[ci];
            const col = cp.has ? '#80c060' : '#c04040';
            const ct  = this.scene.add.text(cx2, curY + 17, `${cp.icon}${cp.val}`, {
              fontFamily: 'sans-serif', fontSize: '9px', fill: col,
            }).setOrigin(1, 0).setDepth(32);
            this._els.push(ct);
            cx2 -= ct.width + 4;
          }
        }

        // Klick-Handler (nur wenn entsperrbar)
        if (canDo) {
          rowBg.setInteractive({ cursor: 'pointer' });
          rowBg.on('pointerover', () => rowBg.setStrokeStyle(1.5, 0x80d060));
          rowBg.on('pointerout',  () => rowBg.setStrokeStyle(1, 0x304820));
          rowBg.on('pointerdown', () => {
            const res = this.skillSys.unlock(skill.id, this.resources, lvl);
            if (res.ok) {
              // Kurz-Feedback
              const fb = this.scene.add.text(px, py - 20,
                `✨ ${skill.emoji} ${skill.name} freigeschaltet!`,
                { fontFamily: 'sans-serif', fontSize: '12px', fill: '#c0ff80',
                  stroke: '#000', strokeThickness: 2 }
              ).setOrigin(0.5).setDepth(40);
              this.scene.tweens.add({ targets: fb, y: py - 50, alpha: 0, duration: 1500,
                onComplete: () => fb.destroy() });
              // Panel neu aufbauen
              this._build();
            }
          });
        }

        curY += rowH;
      }
      curY += 6;
    }
  }
}
