import Phaser from 'phaser';
import { AccountSystem } from '../systems/AccountSystem.js';

/**
 * AuthScene – Login / Registrierung / Passwort-Reset / Slot-Auswahl
 * Startet GameScene mit { username, slotIndex, loadSave } sobald ein Slot gewählt wird.
 */
export class AuthScene extends Phaser.Scene {
  constructor() { super({ key: 'AuthScene' }); }

  create() {
    this._els = [];
    const session = AccountSystem.getSession();
    if (session?.username) {
      this._showSlotSelect(session.username);
    } else {
      this._showLogin();
    }
  }

  // ── Interne Helfer ─────────────────────────────────────────────────────
  _clear() {
    for (const el of this._els) { try { el.destroy(); } catch(e) {} }
    this._els = [];
  }
  _push(el) { this._els.push(el); return el; }

  _bg() {
    const W = this.scale.width, H = this.scale.height;
    this._push(this.add.rectangle(W/2, H/2, W, H, 0x080e08, 1).setDepth(0));
    this._push(this.add.text(W/2, H * 0.09, '🌳 Rootbound', {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: '32px', fill: '#a0d878',
    }).setOrigin(0.5).setDepth(1));
  }

  _label(x, y, text, color = '#a0b890') {
    return this._push(this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '12px', fill: color,
    }).setDepth(2));
  }

  _errField(x, y) {
    return this._push(this.add.text(x, y, '', {
      fontFamily: 'sans-serif', fontSize: '11px', fill: '#ff7060',
    }).setOrigin(0.5).setDepth(3));
  }

  /** Erstellt ein natives DOM-<input> und positioniert es über dem Canvas. */
  _input(sceneX, sceneY, w, placeholder, isPassword = false) {
    const input = document.createElement('input');
    input.type        = isPassword ? 'password' : 'text';
    input.placeholder = placeholder;
    input.autocomplete = isPassword ? 'current-password' : 'username';
    input.style.cssText = [
      'position:fixed',
      'background:#101a10',
      'color:#c0d8a0',
      'border:1px solid #3a6a2a',
      'border-radius:4px',
      'padding:5px 10px',
      'font-size:13px',
      'font-family:sans-serif',
      'outline:none',
      'box-sizing:border-box',
      'z-index:100',
    ].join(';');
    document.body.appendChild(input);
    this._positionInput(input, sceneX, sceneY, w);
    this._els.push({ destroy: () => { try { input.remove(); } catch(e) {} } });
    return input;
  }

  _positionInput(input, sceneX, sceneY, w) {
    const rect   = this.game.canvas.getBoundingClientRect();
    const scaleX = rect.width  / this.scale.width;
    const scaleY = rect.height / this.scale.height;
    const pw = w * scaleX;
    const ph = 30 * scaleY;
    input.style.left     = (rect.left + sceneX * scaleX - pw / 2) + 'px';
    input.style.top      = (rect.top  + sceneY * scaleY - ph / 2) + 'px';
    input.style.width    = pw + 'px';
    input.style.height   = ph + 'px';
    input.style.fontSize = Math.round(13 * Math.min(scaleX, scaleY)) + 'px';
  }

  _button(x, y, w, label, bgColor, textColor, cb) {
    const bg = this._push(
      this.add.rectangle(x, y, w, 30, bgColor, 0.95)
        .setOrigin(0.5).setDepth(2).setInteractive({ cursor: 'pointer' })
        .setStrokeStyle(1, 0x4a8a3a)
    );
    this._push(this.add.text(x, y, label, {
      fontFamily: 'sans-serif', fontSize: '13px', fill: textColor,
    }).setOrigin(0.5).setDepth(3));
    bg.on('pointerover', () => bg.setAlpha(1));
    bg.on('pointerout',  () => bg.setAlpha(0.95));
    bg.on('pointerdown', cb);
    return bg;
  }

  _link(x, y, text, cb) {
    const t = this._push(this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '11px', fill: '#6090a0',
    }).setOrigin(0.5).setDepth(2).setInteractive({ cursor: 'pointer' }));
    t.on('pointerover', () => t.setStyle({ fill: '#90c0d0' }));
    t.on('pointerout',  () => t.setStyle({ fill: '#6090a0' }));
    t.on('pointerdown', cb);
    return t;
  }

  // ── Login ─────────────────────────────────────────────────────────────
  _showLogin() {
    this._clear();
    const W = this.scale.width, H = this.scale.height;
    this._bg();
    this._label(W/2, H*0.20, 'Einloggen', '#c0d878').setOrigin(0.5);

    this._label(W/2 - 140, H*0.29, 'Benutzername');
    const uIn = this._input(W/2, H*0.33, 280, 'benutzername');

    this._label(W/2 - 140, H*0.40, 'Passwort');
    const pIn = this._input(W/2, H*0.44, 280, '••••••••', true);

    const err = this._errField(W/2, H*0.52);

    const doLogin = async () => {
      err.setText('⏳ ...');
      const r = await AccountSystem.login(uIn.value, pIn.value);
      if (r.ok) { this._clear(); this._showSlotSelect(uIn.value.trim().toLowerCase()); }
      else err.setText(r.reason);
    };

    this._button(W/2, H*0.58, 280, '▶  Einloggen', 0x1a3a1a, '#80d060', doLogin);
    pIn.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    this._link(W/2, H*0.67, 'Noch kein Konto? Registrieren →', () => this._showRegister());
    this._link(W/2, H*0.73, 'Passwort vergessen?', () => this._showResetStep1());
  }

  // ── Registrierung ──────────────────────────────────────────────────────
  _showRegister() {
    this._clear();
    const W = this.scale.width, H = this.scale.height;
    this._bg();
    this._label(W/2, H*0.17, 'Neues Konto erstellen', '#c0d878').setOrigin(0.5);

    this._label(W/2 - 140, H*0.25, 'Benutzername (mind. 3 Zeichen)');
    const uIn  = this._input(W/2, H*0.29, 280, 'benutzername');

    this._label(W/2 - 140, H*0.35, 'Passwort (mind. 6 Zeichen)');
    const pIn  = this._input(W/2, H*0.39, 280, '••••••••', true);

    this._label(W/2 - 140, H*0.45, 'Passwort wiederholen');
    const p2In = this._input(W/2, H*0.49, 280, '••••••••', true);

    // Sicherheitsfrage als DOM-Select
    this._label(W/2 - 140, H*0.55, 'Sicherheitsfrage');
    const questions = [
      'Name deines ersten Haustieres?',
      'Geburtsstadt deiner Mutter?',
      'Lieblingsfilm als Kind?',
      'Name deines besten Freundes als Kind?',
    ];
    const sel = document.createElement('select');
    sel.style.cssText = [
      'position:fixed', 'background:#101a10', 'color:#c0d8a0',
      'border:1px solid #3a6a2a', 'border-radius:4px',
      'padding:5px 10px', 'font-size:13px', 'font-family:sans-serif',
      'outline:none', 'box-sizing:border-box', 'z-index:100',
    ].join(';');
    questions.forEach(q => {
      const o = document.createElement('option');
      o.value = q; o.textContent = q; sel.appendChild(o);
    });
    document.body.appendChild(sel);
    this._positionInput(sel, W/2, H*0.59, 280);
    this._els.push({ destroy: () => { try { sel.remove(); } catch(e) {} } });

    this._label(W/2 - 140, H*0.65, 'Deine Antwort (wird gehasht)');
    const aIn = this._input(W/2, H*0.69, 280, 'antwort');

    const err = this._errField(W/2, H*0.76);

    this._button(W/2, H*0.82, 280, '✓  Konto erstellen', 0x0a2a1a, '#70d090', async () => {
      if (pIn.value !== p2In.value) { err.setText('Passwörter stimmen nicht überein.'); return; }
      err.setText('⏳ ...');
      const r = await AccountSystem.register(uIn.value, pIn.value, sel.value, aIn.value);
      if (r.ok) {
        this._clear();
        this._showLogin();
        this.time.delayedCall(80, () => {
          const fb = this.add.text(this.scale.width/2, this.scale.height * 0.92,
            '✓ Konto erstellt – bitte einloggen',
            { fontFamily: 'sans-serif', fontSize: '12px', fill: '#80d060' }
          ).setOrigin(0.5).setDepth(5);
          this.tweens.add({ targets: fb, alpha: 0, delay: 2500, duration: 600, onComplete: () => fb.destroy() });
        });
      } else err.setText(r.reason);
    });

    this._link(W/2, H*0.89, '← Zurück zum Login', () => this._showLogin());
  }

  // ── Passwort-Reset Schritt 1 ───────────────────────────────────────────
  _showResetStep1() {
    this._clear();
    const W = this.scale.width, H = this.scale.height;
    this._bg();
    this._label(W/2, H*0.22, 'Passwort zurücksetzen', '#e0c878').setOrigin(0.5);
    this._label(W/2 - 140, H*0.32, 'Benutzername');
    const uIn = this._input(W/2, H*0.36, 280, 'benutzername');
    const err = this._errField(W/2, H*0.44);

    this._button(W/2, H*0.50, 280, 'Weiter →', 0x2a1a0a, '#d0a060', () => {
      const username = uIn.value.trim().toLowerCase();
      const q = AccountSystem.getSecurityQuestion(username);
      if (!q) { err.setText('Benutzer nicht gefunden.'); return; }
      this._clear();
      this._showResetStep2(username, q);
    });
    this._link(W/2, H*0.58, '← Zurück', () => this._showLogin());
  }

  // ── Passwort-Reset Schritt 2 ───────────────────────────────────────────
  _showResetStep2(username, question) {
    this._clear();
    const W = this.scale.width, H = this.scale.height;
    this._bg();
    this._label(W/2, H*0.20, 'Passwort zurücksetzen', '#e0c878').setOrigin(0.5);
    this._label(W/2, H*0.28, '❓ ' + question, '#c0b888').setOrigin(0.5);

    this._label(W/2 - 140, H*0.35, 'Deine Antwort');
    const aIn  = this._input(W/2, H*0.39, 280, 'antwort');

    this._label(W/2 - 140, H*0.45, 'Neues Passwort');
    const pIn  = this._input(W/2, H*0.49, 280, '••••••••', true);

    this._label(W/2 - 140, H*0.55, 'Wiederholen');
    const p2In = this._input(W/2, H*0.59, 280, '••••••••', true);

    const err = this._errField(W/2, H*0.66);

    this._button(W/2, H*0.72, 280, '✓  Passwort setzen', 0x2a1a0a, '#d0a060', async () => {
      if (pIn.value !== p2In.value) { err.setText('Passwörter stimmen nicht überein.'); return; }
      err.setText('⏳ ...');
      const r = await AccountSystem.resetPassword(username, aIn.value, pIn.value);
      if (r.ok) {
        this._clear();
        this._showLogin();
      } else err.setText(r.reason);
    });
    this._link(W/2, H*0.80, '← Zurück', () => this._showLogin());
  }

  // ── Slot-Auswahl ───────────────────────────────────────────────────────
  _showSlotSelect(username) {
    this._clear();
    AccountSystem._setSession(username, 0);
    const W = this.scale.width, H = this.scale.height;
    this._bg();
    this._label(W/2, H*0.18, '👤 ' + username, '#a0d878').setOrigin(0.5);
    this._label(W/2, H*0.25, 'Spielstand wählen', '#708060').setOrigin(0.5);

    const slots  = AccountSystem.getSlots(username);
    const slotW  = 190;
    const slotH  = 96;
    const gap    = 18;
    const totalW = AccountSystem.MAX_SLOTS * slotW + (AccountSystem.MAX_SLOTS - 1) * gap;
    const startX = W/2 - totalW/2;

    slots.forEach((slot, i) => {
      const cx     = startX + i * (slotW + gap) + slotW / 2;
      const cy     = H * 0.48;
      const empty  = slot === null;

      const bg = this._push(
        this.add.rectangle(cx, cy, slotW, slotH, empty ? 0x0c120a : 0x102010, 0.93)
          .setOrigin(0.5).setDepth(2).setInteractive({ cursor: 'pointer' })
          .setStrokeStyle(1.5, empty ? 0x2a4a2a : 0x4a8a3a)
      );

      if (empty) {
        this._push(this.add.text(cx, cy, '＋ Neues Spiel', {
          fontFamily: 'sans-serif', fontSize: '14px', fill: '#4a7a3a',
        }).setOrigin(0.5).setDepth(3));
      } else {
        const d       = new Date(slot.savedAt);
        const dateStr = d.toLocaleDateString('de-DE') + ' ' +
                        d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        this._push(this.add.text(cx, cy - 32, 'Slot ' + (i + 1), {
          fontFamily: 'sans-serif', fontSize: '11px', fill: '#607850',
        }).setOrigin(0.5).setDepth(3));
        this._push(this.add.text(cx, cy - 14, '🌳 ' + (slot.tree?.phaseIndex !== undefined ? 'Phase ' + (slot.tree.phaseIndex + 1) : 'Sämling'), {
          fontFamily: '"Cormorant Garamond",Georgia,serif', fontSize: '15px', fill: '#c0d878',
        }).setOrigin(0.5).setDepth(3));
        this._push(this.add.text(cx, cy + 8, 'Jahr ' + (slot.seasons?.year ?? 1), {
          fontFamily: 'sans-serif', fontSize: '11px', fill: '#808060',
        }).setOrigin(0.5).setDepth(3));
        this._push(this.add.text(cx, cy + 24, dateStr, {
          fontFamily: 'sans-serif', fontSize: '10px', fill: '#506040',
        }).setOrigin(0.5).setDepth(3));
        this._push(this.add.text(cx, cy + 38, slot.creature?.archetype ? '🐾 ' + slot.creature.archetype : '', {
          fontFamily: 'sans-serif', fontSize: '10px', fill: '#608050',
        }).setOrigin(0.5).setDepth(3));

        // Löschen-Button (×, oben rechts)
        const del = this._push(
          this.add.text(cx + slotW/2 - 8, cy - slotH/2 + 6, '×', {
            fontFamily: 'sans-serif', fontSize: '14px', fill: '#804040',
          }).setOrigin(1, 0).setDepth(4).setInteractive({ cursor: 'pointer' })
        );
        del.on('pointerover', () => del.setStyle({ fill: '#ff6050' }));
        del.on('pointerout',  () => del.setStyle({ fill: '#804040' }));
        del.on('pointerdown', (ptr) => {
          ptr.event?.stopPropagation?.();
          AccountSystem.deleteSlot(username, i);
          this._showSlotSelect(username);
        });
      }

      bg.on('pointerover', () => bg.setStrokeStyle(1.5, 0x80d060));
      bg.on('pointerout',  () => bg.setStrokeStyle(1.5, empty ? 0x2a4a2a : 0x4a8a3a));
      bg.on('pointerdown', () => {
        AccountSystem._setSession(username, i);
        this._clear();
        this.scene.start('GameScene', { username, slotIndex: i, loadSave: !empty });
      });
    });

    this._link(W/2, H*0.72, '← Abmelden', () => {
      AccountSystem.clearSession();
      this._showLogin();
    });
    this._label(W/2, H*0.80,
      'Fortschritt wird automatisch alle 30s gespeichert.',
      '#405040'
    ).setOrigin(0.5);
  }
}
