# 🌿 Rootbound

> *Du bist ein uralter Baum. Lass ein Ökosystem um dich herum erwachen.*

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

## Tech Stack

- **Phaser.js 3** – Game Engine (Canvas Rendering)
- **Vite** – Build Tool & Dev Server
- **GitHub Pages** – Hosting

## Woche 1 – Scope

- [x] Baum wächst visuell durch 3 Phasen (Sämling → Junger Baum → Ausgewachsen)
- [x] 3 Primärressourcen: Licht ☀️, Wasser 💧, Nährstoffe 🌱
- [x] Jahreszeiten-Zyklus (Frühling → Sommer → Herbst → Winter)
- [x] Passiver Ressourcen-Idle-Loop
- [x] Klick-Interaktion: Baum manuell boosten
- [x] Visuelles UI mit Ressourcenleisten und Jahreszeit-Anzeige

## Projektstruktur

```
src/
├── main.js              # Phaser Game Init
├── config/
│   └── seasons.js       # Jahreszeiten-Konfiguration
├── scenes/
│   └── GameScene.js     # Haupt-Spielszene
└── systems/
    ├── ResourceSystem.js # Ressourcen-Loop
    ├── TreeSystem.js     # Baum-Wachstum & Rendering
    └── SeasonSystem.js   # Jahreszeiten-Management
```
