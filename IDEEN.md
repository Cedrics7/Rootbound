# 🌳 Rootbound – Ideen & Vision

> **Kernprinzip:** Der Baum ist und bleibt der Mittelpunkt. Alles andere – der Wald, die Symbionten, die Wurzeln – dient ihm und wächst *um* ihn.

---

## 🗺️ Spielvision

Rootbound ist ein langsames, meditatives Ökosystem-Spiel. Der Spieler ist ein uralter Baum, der über Jahrzehnte wächst, Mutationen entwickelt, einen Wald aufbaut und tief in die Erde vordringt. Kein Kämpfen – stattdessen Gleichgewicht, Symbiose, und das Überleben durch kluge Entscheidungen.

---

## ✅ Bereits umgesetzt

- [x] 5 Baum-Wachstumsphasen (Sämling → Urbaum)
- [x] 4 Jahreszeiten mit Ereignissen (Dürre, Frost, Sturm, Blüte …)
- [x] 14 Mutationen mit je 3 Upgrade-Stufen
- [x] Upgrade-Slots pro Phase (strategische Wahl)
- [x] Visuelle Symbionten am Baum (Eule, Hirsch, Glühwürmchen, Biene, Pilze, Flechten)
- [x] Myzel-Netzwerk-Rendering
- [x] Ökosystem-Codex (Entdeckungsbuch)
- [x] Event-Log & HUD
- [x] Save/Load + Autosave
- [x] Game-Over + Neustart
- [x] Boot-Szene (Weiterspielen / Neues Spiel)

---

## 🌲 Wald-System *(in Arbeit)*

### Idee
Der Hauptbaum kann im Laufe des Spiels **Begleitbäume pflanzen**, die ihn passiv mit Ressourcen versorgen. Der Wald gehört dem Hauptbaum – er ist sein verlängerter Arm.

### Begleitbaum-Typen
| Typ | Emoji | Bonus | Freischaltung |
|---|---|---|---|
| Birke | 🌿 | +Licht | Phase 2 |
| Eiche | 🌳 | +Nährstoffe | Phase 2 |
| Tanne | 🌲 | +Wasser (Winter) | Phase 3 |
| Farn | 🌱 | +Symbiose | Phase 2 |
| Weidbaum | 🌾 | +Wasser | Phase 3 |
| Uralte Eiche | 🏛️ | +Alle Raten | Phase 4 |

### Mechanik
- Max. **6 Begleitbäume** gleichzeitig
- Jeder Baum hat 3 eigene Wachstumsstufen
- Bäume sterben in extremen Krisen wenn nicht durch Mutationen geschützt
- Myzelnetz verbindet alle Bäume visuell

---

## 🪨 Wurzeltiefe-System *(in Arbeit)*

### Idee
Die Wurzeln des Hauptbaums graben sich mit der Zeit tiefer in die Erde – und erschließen neue Ressourcen und Geheimnisse.

### Tiefenebenen
| Ebene | Name | Tiefe | Effekt | Freischaltung |
|---|---|---|---|---|
| 0 | Humus | 0–2m | Basis-Nährstoffe | Start |
| 1 | Tonschicht | 2–8m | Nährstoffe +25%, Wasser gespeichert | Phase 2 |
| 2 | Steinwurzeln | 8–25m | Sturm-Immunität, Nährstoffe +50% | Phase 3 + Sturmwurzeln |
| 3 | Grundwasser | 25–80m | Wasser-Floor: nie unter 30, +Wasser konstant | Phase 4 + Tiefe Wurzeln Lvl 2 |
| 4 | Fossilienschicht | 80–200m | Nährstoffe +100%, neue Codex-Einträge | Phase 4 |
| 5 | Erdadern | 200m+ | Symbiose +100%, Weltenwurzel freischalten | Urbaum |

### Visuell
- Unterhalb der Erde wird ein **Querschnitt** der Wurzeln animiert
- Jede Ebene hat eine eigene Farbe und Partikeleffekte
- Grundwasser schimmert blau, Erdadern leuchten rot/orange

---

## 💡 Weitere Ideen (Backlog)

### Gameplay
- [ ] **Jahreszeit-Gedächtnis**: Ereignisse hinterlassen permanente Spuren (z.B. Dürreriss im Stamm)
- [ ] **Wanderarten**: Tiere wandern saisonal ein und aus, beeinflussen Ressourcen temporär
- [ ] **Parasiten-Mechanik**: Schmarotzer-Pflanzen wachsen wenn Ressourcen zu hoch – müssen aktiv "verdrängt" werden
- [ ] **Blitz-Ereignis**: Kann Äste abbrechen lassen – neue Ast-Wachstums-Mechanik
- [ ] **Pollenflug**: Im Frühling verbreitet der Baum Pollen → neue Begleitbäume entstehen zufällig
- [ ] **Tag/Nacht-Zyklus**: Sichtbare Sonne/Mond-Bewegung, Lichtrate nachts = 0, Biolumineszenz wichtiger
- [ ] **Meilenstein-Events**: Bei jeder neuen Baum-Phase eine cineastische Kamera-Fahrt

### Visuals
- [ ] **Untererd-Ansicht** toggle: Spieler kann zwischen Oberfläche und Wurzelquerschnitt wechseln
- [ ] **Wetterlayer**: Regen-Partikel, Schneefall, Herbstblätter fallen herab
- [ ] **Baum-Silhouetten** im Hintergrund (Wald-Tiefe simulieren)
- [ ] **Wachstums-Animationen**: Neue Äste spriessen sichtbar beim Phasenwechsel
- [ ] **Jahresringe**: Stamm zeigt sichtbare Jahresringe als Zähler

### Audio (Ideen)
- [ ] Ambientsound pro Jahreszeit (Vogelgezwitscher, Wind, Regen, Stille)
- [ ] Sanfte Musik-Generierung je nach Ressourcenlage (reich = harmonisch, Krise = dissonant)
- [ ] Klickgeräusch beim Baum-Klick

### UI/UX
- [ ] **Minimap der Waldebene**: Zeigt alle Begleitbäume als Dots
- [ ] **Zeitraffer-Button**: Saison schnell vorspulen (kostet Ressourcen)
- [ ] **Baum-Tagebuch**: Automatische Einträge zu wichtigen Ereignissen ("Jahr 12: Erste Dürre überlebt")
- [ ] **Achievements**: Stille Meilensteine ("100 Jahre alt", "Alle Symbiosen aktiv" …)

### Lore & Atmosphäre
- [ ] **Lore-Fragmente**: Tiefenebenen schalten Lore-Texte frei (Fossilien = Erinnerungen an Dinosaurier-Zeit)
- [ ] **Traumsequenzen**: Bei bestimmten Ereignissen kurze Text-Vignetten aus der Sicht des Baums
- [ ] **Endspiel-Lore**: Weltenwurzel Stufe 3 = kurze Geschichte über den Baum als Mittelpunkt allen Lebens

---

## 🏗️ Technische Schulden / Fixes

- [ ] `ResourceSystem`: Event-Suppression und Floors aus Mutations-Bonuses noch nicht vollständig angewendet
- [ ] `CodexSystem`: `CODEX_ENTRIES` aus seasons.js noch nicht vollständig verdrahtet
- [ ] Saison-Events nutzen `eventSuppression`-Felder noch nicht
- [ ] Responsive Neuberechnung aller UI-Elemente bei Resize fehlt
- [ ] Mobile-Touch-Optimierung (Buttons zu klein)

---

## 🛤️ Roadmap

```
v0.3 (aktuell)  → 5 Phasen, 14 Mutationen, Symbionten
v0.4            → ForestSystem + RootDepthSystem
v0.5            → Tag/Nacht, Wetterlayer, Untererd-Ansicht
v0.6            → Audio, Achievements, Baum-Tagebuch
v1.0            → Vollständige Lore, Endspiel, Mobile-ready
```

---

*Letzte Aktualisierung: 2026-06-29*
