/**
 * AccountSystem – lokale Nutzerverwaltung
 *
 * localStorage-Struktur:
 *   rootbound_accounts  →  { [username]: { salt, hash, securityQuestion,
 *                             securityAnswerSalt, securityAnswerHash,
 *                             slots: [null|saveData, null|saveData, null|saveData],
 *                             createdAt } }
 *   rootbound_session   →  { username, slotIndex }
 *
 * Hashing: SHA-256 via Web Crypto API + zufälliger Salt (kein npm-Paket).
 * Migration zu echtem Backend: nur _load/_save/_hash durch API-Calls ersetzen.
 */

const ACCOUNTS_KEY = 'rootbound_accounts';
const SESSION_KEY  = 'rootbound_session';
export const MAX_SLOTS = 3;

// ── Crypto-Helfer ──────────────────────────────────────────────────────────
async function _hash(text, salt) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text + salt));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function _salt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── AccountSystem ──────────────────────────────────────────────────────────
export class AccountSystem {

  // ── Persistenz ─────────────────────────────────────────────────────────
  static _load() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); } catch { return {}; }
  }
  static _save(db) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(db));
  }

  // ── Session ────────────────────────────────────────────────────────────
  static getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  static _setSession(username, slotIndex) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, slotIndex }));
  }
  static clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // ── Registrierung ──────────────────────────────────────────────────────
  static async register(username, password, securityQuestion, securityAnswer) {
    username = username.trim().toLowerCase();
    if (!username || username.length < 3)  return { ok: false, reason: 'Benutzername mind. 3 Zeichen.' };
    if (!password || password.length < 6)  return { ok: false, reason: 'Passwort mind. 6 Zeichen.' };
    if (!securityQuestion)                 return { ok: false, reason: 'Sicherheitsfrage fehlt.' };
    if (!securityAnswer || securityAnswer.trim().length < 2)
                                           return { ok: false, reason: 'Sicherheitsantwort zu kurz.' };
    const db = AccountSystem._load();
    if (db[username])                      return { ok: false, reason: 'Benutzername bereits vergeben.' };

    const salt  = _salt();
    const hash  = await _hash(password, salt);
    const aSalt = _salt();
    const aHash = await _hash(securityAnswer.trim().toLowerCase(), aSalt);

    db[username] = {
      salt, hash,
      securityQuestion,
      securityAnswerSalt: aSalt,
      securityAnswerHash: aHash,
      slots: [null, null, null],
      createdAt: Date.now(),
    };
    AccountSystem._save(db);
    return { ok: true };
  }

  // ── Login ──────────────────────────────────────────────────────────────
  static async login(username, password) {
    username = username.trim().toLowerCase();
    const db   = AccountSystem._load();
    const user = db[username];
    if (!user) return { ok: false, reason: 'Benutzer nicht gefunden.' };
    const hash = await _hash(password, user.salt);
    if (hash !== user.hash) return { ok: false, reason: 'Falsches Passwort.' };
    AccountSystem._setSession(username, 0);
    return { ok: true, slots: user.slots };
  }

  // ── Passwort zurücksetzen ──────────────────────────────────────────────
  static getSecurityQuestion(username) {
    username = username.trim().toLowerCase();
    return AccountSystem._load()[username]?.securityQuestion ?? null;
  }

  static async resetPassword(username, securityAnswer, newPassword) {
    username = username.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) return { ok: false, reason: 'Neues Passwort mind. 6 Zeichen.' };
    const db   = AccountSystem._load();
    const user = db[username];
    if (!user) return { ok: false, reason: 'Benutzer nicht gefunden.' };
    const aHash = await _hash(securityAnswer.trim().toLowerCase(), user.securityAnswerSalt);
    if (aHash !== user.securityAnswerHash) return { ok: false, reason: 'Falsche Sicherheitsantwort.' };
    const salt = _salt();
    db[username].salt = salt;
    db[username].hash = await _hash(newPassword, salt);
    AccountSystem._save(db);
    return { ok: true };
  }

  // ── Slots ──────────────────────────────────────────────────────────────
  static getSlots(username) {
    username = username.trim().toLowerCase();
    return AccountSystem._load()[username]?.slots ?? [null, null, null];
  }

  static saveSlot(username, slotIndex, saveData) {
    username = username.trim().toLowerCase();
    const db = AccountSystem._load();
    if (!db[username]) return { ok: false, reason: 'Benutzer nicht gefunden.' };
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) return { ok: false, reason: 'Ungültiger Slot.' };
    db[username].slots[slotIndex] = { ...saveData, savedAt: Date.now() };
    AccountSystem._save(db);
    return { ok: true };
  }

  static loadSlot(username, slotIndex) {
    username = username.trim().toLowerCase();
    return AccountSystem._load()[username]?.slots?.[slotIndex] ?? null;
  }

  static deleteSlot(username, slotIndex) {
    username = username.trim().toLowerCase();
    const db = AccountSystem._load();
    if (!db[username]) return;
    db[username].slots[slotIndex] = null;
    AccountSystem._save(db);
  }

  static MAX_SLOTS = MAX_SLOTS;
}
