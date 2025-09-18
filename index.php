<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rolands Debug Dash</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="hud" aria-live="polite">
    <div class="hud__group">
        <span class="hud__label">Level</span>
        <span id="level-indicator">Tutorial</span>
    </div>
    <div class="hud__group hud__group--hp">
        <span class="hud__label">HP</span>
        <div class="hp-bar" role="img" aria-label="Lebensbalken">
            <div id="hp-fill"></div>
        </div>
    </div>
    <div class="hud__group">
        <span class="hud__label">Leben</span>
        <span id="life-counter">3</span>
    </div>
    <div class="hud__group">
        <span class="hud__label">Score</span>
        <span id="score-counter">0</span>
    </div>
    <div class="hud__group">
        <span class="hud__label">Waffe</span>
        <span id="weapon-indicator">Keine</span>
    </div>
</header>
<main>
    <section id="tutorial" class="overlay visible" role="dialog" aria-modal="true">
        <div class="overlay__content">
            <h1>Willkommen bei Rolands Debug Dash</h1>
            <p>Steuere Roland mit <strong>WASD</strong> oder den Pfeiltasten. Springe auf Bugs, sammle Kaffee für Heilung und sichere dir Debug-Werkzeuge. Nach jedem Sprint wartet ein 4x4-Schiebe-Puzzle auf dich – löse es für zusätzliche HP und Punkte.</p>
            <ul class="tutorial-list">
                <li><span class="key">W / ↑</span> springt · <span class="key">A / ←</span> bewegt nach links · <span class="key">D / →</span> bewegt nach rechts.</li>
                <li>Springe auf kleinere Bugs oder nutze die <strong>Debug-Kanone</strong> (Taste <span class="key">Leertaste</span>) nachdem du sie freigeschaltet hast.</li>
                <li>Sammle <strong>Kaffeetassen</strong>, um HP zu regenerieren, und <strong>Code-Snippets</strong> für Punkte.</li>
                <li>Nach jedem Level wartet ein kurzes <strong>4x4-Schiebe-Puzzle</strong>. Sortiere die Kacheln durch Verschieben, um Bonus-HP zu kassieren.</li>
            </ul>
            <button id="start-button" class="btn btn--primary">Debug-Reise starten</button>
        </div>
    </section>

    <section id="game-area" aria-live="polite">
        <canvas id="game-canvas" width="1280" height="720" role="img" aria-label="2D Plattform-Abenteuer"></canvas>
        <div id="weapon-unlock" class="toast" aria-live="assertive" hidden></div>
    </section>

    <section id="level-complete" class="overlay" role="dialog" aria-modal="true" hidden>
        <div class="overlay__content">
            <h2>Level geschafft!</h2>
            <p id="level-summary">Du hast alle Bugs in diesem Sprint beseitigt.</p>
            <button id="puzzle-button" class="btn btn--primary">Zum Schiebe-Puzzle</button>
        </div>
    </section>

    <section id="puzzle-overlay" class="overlay" role="dialog" aria-modal="true" hidden>
        <div class="overlay__content overlay__content--wide">
            <h2>Schiebe-Puzzle Debug</h2>
            <p>Ordne die Debug-Kacheln, indem du sie verschiebst. Wenn alles richtig liegt, erhältst du Kaffee (+HP) und Bonuspunkte.</p>
            <div class="slider-puzzle" role="application" aria-label="15-Puzzle mit Debug-Szenen">
                <div id="puzzle-grid" class="slider-puzzle__grid" data-size="4"></div>
                <div class="slider-puzzle__preview">
                    <h3>Vorschau</h3>
                    <canvas id="puzzle-preview" width="256" height="256" aria-hidden="true"></canvas>
                </div>
            </div>
            <div class="puzzle__actions">
                <button id="puzzle-reset" class="btn">Neu mischen</button>
            </div>
        </div>
    </section>

    <section id="game-over" class="overlay" role="alertdialog" aria-modal="true" hidden>
        <div class="overlay__content">
            <h2>Game Over</h2>
            <p>Die Bugs waren diesmal schneller. Versuch es direkt noch einmal!</p>
            <button class="btn btn--primary" data-action="restart">Neu starten</button>
        </div>
    </section>

    <section id="victory" class="overlay" role="alertdialog" aria-modal="true" hidden>
        <div class="overlay__content">
            <h2>Du hast die Release-Party erreicht!</h2>
            <p id="victory-summary">Alle drei Level erledigt – der Code ist produktionsreif.</p>
            <button class="btn btn--primary" data-action="restart">Nochmal spielen</button>
        </div>
    </section>
</main>
<script src="assets/script.js"></script>
</body>
</html>
