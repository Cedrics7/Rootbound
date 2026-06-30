# 🐾 Rootbound

> *Du erwachst als kleines Tier in einem leeren Wald. Du findest einen Samen. Du pflanzst ihn. Ein Ökosystem beginnt.*

## Konzept

Rootbound verbindet drei Spielprinzipien:

| Inspiration | Element in Rootbound |
|---|---|
| **Shakes & Fidget** | Tier mit Equipment, Quests, Seltenheiten |
| **Clash of Clans** | Zwei parallele Progressionen (Tier + Baum) |
| **Spore** | Tier entwickelt sich visuell und mechanisch weiter |

### Der Spielfluss

```
[Start] Tier erwacht im leeren Wald
    ↓
Erste Quests: Erkunden, Ressourcen sammeln
    ↓
Quest: "Du findest einen uralten Samen..."
    ↓
Spieler pflanzt Samen → Baum-Progression startet
    ↓
[Loop] Tier & Baum wachsen unabhängig, stärken sich gegenseitig
```

### Tier-System
- **3 Archetypen**: Vogel 🐦 (Erkundung), Nagetier 🐭 (Ressourcen), Insekt 🐛 (Symbiose)
- **Quests**: Sammeln, Erkunden, Bestäuben, Graben, Wacht halten
- **Evolution**: alle 3 Level visuelle Veränderung + neue Fähigkeit
- **Metamorphose**: Max-Level → selteneres Tier → exklusive Baum-Mutationen
- **Equipment**: Item-Drops aus Quests (Gewöhnlich → Legendär)

### Baum-System
- Passiver Ressourcen-Loop: Licht ☀️, Wasser 💧, Nährstoffe 🌱
- Jahreszeiten-Zyklus mit Krisen und Ereignissen
- Mutationen, Symbiosen, Waldaufbau
- Höhere Baum-Phase = bessere Quests für das Tier

### Verbindung beider Systeme
```
Baum  →  Lebensraum-Qualität  →  bessere Quests für Tier
Tier  →  Item-Drops & XP      →  exklusive Mutationen für Baum
Tier  →  Krisenbewältigung   →  schützt den Baum aktiv
Baum-Tod → Tier flühtet, behält Items → Genetisches Gedächtnis für nächsten Run
```

---

## Setup

```bash
npm install
npm run dev
```

Öffne dann `http://localhost:5173/Rootbound/`

## Build & Deploy

```bash
npm run build
```

Deploy läuft automatisch via GitHub Actions auf GitHub Pages.

---

## Tech Stack

- **Phaser.js 3** – Game Engine (Canvas Rendering, prozedurale Grafiken)
- **Vite** – Build Tool & Dev Server
- **GitHub Pages** – Hosting

---

## Roadmap

### ✅ Implementiert
- Baum wächst visuell durch Phasen (Sämling → Urbaum)
- 3 Primärressourcen + Symbiose
- Jahreszeiten-Zyklus mit Krisen und Ereignissen
- Mutations- & Symbiose-System
- Wald-System (Bäume pflanzen, Wurzeltiefe)
- Ökosystem-Codex
- Autosave / Spielstand laden
- HUD mit Wachstums-Fortschrittsbalken

### 🔧 MVP – Tier-System (nächster Meilenstein)
- [ ] `CreatureSystem.js` – Archetyp-Wahl, Level, XP, Quest-State
- [ ] Tier prozedural auf Spielbildschirm (Phaser-Grafik, kein externes Asset)
- [ ] Spiel startet mit Tier, Baum folgt nach ersten Quests
- [ ] 3 Basis-Quests (Sammeln, Erkunden, Bestäuben) mit Timer
- [ ] Item-Drops (nur Gewöhnlich) + Inventar-UI
- [ ] Quest-Rückkehr-Animation + XP-Anzeige

### 🔮 Phase 2 – Evolution & Seltenheiten
- [ ] Visuelle Evolution alle 3 Level
- [ ] Metamorphose-Event + seltene Tiere
- [ ] Seltene bis legendäre Item-Drops
- [ ] Exklusive Baum-Mutationen durch Tier-Rarität

### 🌍 Phase 3 – Tiefe Integration
- [ ] Krisenbewältigung durch Tier (aktiver Einsatz)
- [ ] Genetisches Gedächtnis bei Game Over
- [ ] Autonomes Leveln: Wald & Tiere entwickeln sich eigenständig
- [ ] Saisonale Entscheidungsmomente

### 🚀 Phase 4 – Infrastruktur & Multiplayer
- [ ] Benutzerverwaltung (Supabase o.ä.)
- [ ] Server-seitiger Spielstand
- [ ] Kooperativer oder asynchroner Multiplayer

---

## Projektstruktur

```
src/
├── main.js
├── config/
│   ├── seasons.js        # Jahreszeiten, Baum-Phasen
│   └── forest.js         # Waldbaum-Typen, Wurzeltiefen
├── scenes/
│   └── GameScene.js      # Haupt-Spielszene
└── systems/
    ├── ResourceSystem.js
    ├── TreeSystem.js
    ├── SeasonSystem.js
    ├── MutationSystem.js
    ├── ForestSystem.js
    ├── ForestRenderer.js
    ├── UISystem.js
    ├── CodexSystem.js
    ├── SaveSystem.js
    └── CreatureSystem.js  # 🔧 geplant: MVP
```

---

## Grafiken

Aktuell: prozedurale Phaser-Grafiken (kein externes Asset nötig).
Geplant: eigene Sprites via KI-Tools (Leonardo.ai, Midjourney) – Prompt-Stil: `flat vector illustration, forest creature, transparent background, game asset`.
