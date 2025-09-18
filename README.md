# Rolands Debug Dash

Ein 2D-Portfolio-Platformer für Bewerbungen: Recruiter steuern Roland Burmberger per WASD durch drei Level, springen über Schluchten, zerquetschen Bugs, sammeln Kaffee für HP und lösen ein Bonus-Puzzle für Extrapunkte.

## Features
- **Direkte Steuerung:** WASD/Arrow-Keys + Leertaste für die Debug-Kanone. Springe auf Bugs oder schieße sie mit freigeschalteter Waffe ab.
- **Lebensverwaltung:** HP-Balken, Leben und Score im HUD. Kaffee heilt, Puzzle-Bonus pusht HP + Punkte.
- **Level-Design:** Drei Level mit Pits, beweglichen Gegnern, Sammelobjekten, Exit-Portalen und einem finalen Victory-Screen.
- **Bonus-Minispiel:** Drag-and-Drop-Codepuzzle nach jedem Level für zusätzliche Ressourcen.
- **Reines Frontend:** Kein Framework, nur PHP als Wrapper für statisches HTML, CSS und Vanilla JavaScript.

## Starten
```bash
php -S localhost:8000
```

Danach im Browser `http://localhost:8000/index.php` öffnen.

## Projektstruktur
- `index.php` – HTML-Grundgerüst, HUD, Overlays und Canvas.
- `assets/style.css` – Neon-Night-Styling, HUD, Overlays, Puzzle-Look.
- `assets/script.js` – Canvas-Plattformer, Gegner-Logik, Puzzle-System, HUD-Updates.

Viel Spaß beim Bug-Hopping! ☕🐛
