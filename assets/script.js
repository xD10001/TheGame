(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const TILE_SIZE = 48;
    const GRAVITY = 0.9;
    const MOVE_ACCEL = 0.7;
    const MAX_SPEED = 6;
    const JUMP_FORCE = 16;
    const FRICTION = 0.85;
    const PLAYER_WIDTH = 36;
    const PLAYER_HEIGHT = 56;
    const PLAYER_WIDTH = 32;
    const PLAYER_HEIGHT = 46;

    const LEVELS = [
        {
            name: 'Onboarding-Werkstatt',
            tiles: [
                '..........................',
                '....S.....................',
                '..........C...............',
                '.......====.......====....',
                '..................B.......',
                '....C.........####........',
                '###....#####..............',
                '..P...........W......B...E',
                '########....######....####',
                '########....######....####',
                '########..................',
                '##########################'
                '....................',
                '....................',
                '....S...............',
                '....................',
                '...===..............',
                '.............C......',
                '..C....B............',
                '#####.....====......',
                '..P........W....E...',
                '##########..#######.',
                '##########..#######.',
                '####################'
            ]
        },
        {
            name: 'Sprint der Schluchten',
            tiles: [
                '........S.................',
                '.............C............',
                '......====......====......',
                '..............B...........',
                '...C.....####.............',
                '#####.............#####...',
                '..P....W.............B...E',
                '########..########..######',
                '########..########..######',
                '########..................',
                '########..................',
                '##########################'
                '....................',
                '.....S..............',
                '............C.......',
                '..........====......',
                '..C.................',
                '....====.......B....',
                '###......#####......',
                '..P....W......E.....',
                '####..#######..#####',
                '####..#######..#####',
                '####...............#',
                '####################'
            ]
        },
        {
            name: 'Release-Party',
            tiles: [
                '....S.....................',
                '..............C...........',
                '.....====....====....====.',
                '......B.............B.....',
                '..C.........#######.......',
                '#####....#####......####..',
                '..P....W..............B..E',
                '########..########..######',
                '########..########..######',
                '########..................',
                '########..................',
                '##########################'
                '....................',
                '....S...............',
                '..........C.........',
                '....====.......====.',
                '....................',
                '..B......W.....B....',
                '#####..######..#####',
                '..P............E....',
                '####..########..####',
                '####..########..####',
                '####...............#',
                '####################'
            ]
        }
    ];

    const hud = {
        level: document.getElementById('level-indicator'),
        hp: document.getElementById('hp-fill'),
        lives: document.getElementById('life-counter'),
        score: document.getElementById('score-counter'),
        weapon: document.getElementById('weapon-indicator')
    };

    const overlays = {
        tutorial: document.getElementById('tutorial'),
        levelComplete: document.getElementById('level-complete'),
        puzzle: document.getElementById('puzzle-overlay'),
        gameOver: document.getElementById('game-over'),
        victory: document.getElementById('victory')
    };

    const weaponToast = document.getElementById('weapon-unlock');
    const startButton = document.getElementById('start-button');
    const puzzleButton = document.getElementById('puzzle-button');
    const puzzleReset = document.getElementById('puzzle-reset');
    const levelSummary = document.getElementById('level-summary');
    const victorySummary = document.getElementById('victory-summary');

    const puzzleGrid = document.getElementById('puzzle-grid');
    const puzzlePreview = document.getElementById('puzzle-preview');
    const puzzlePreviewCtx = puzzlePreview ? puzzlePreview.getContext('2d') : null;
    const PUZZLE_SIZE = puzzleGrid ? Number(puzzleGrid.dataset.size || 4) : 4;
    let puzzleTiles = [];
    let emptyIndex = PUZZLE_SIZE * PUZZLE_SIZE - 1;
    const puzzlePiecesContainer = document.querySelector('.puzzle__pieces');
    const puzzlePieces = Array.from(document.querySelectorAll('.puzzle-piece'));
    const puzzleSlots = Array.from(document.querySelectorAll('.puzzle-slot'));

    const restartButtons = Array.from(document.querySelectorAll('[data-action="restart"]'));

    const keys = {
        left: false,
        right: false,
        jump: false
    };

    let state = {
        current: 'tutorial',
        levelIndex: 0,
        score: 0,
        awaitingNextLevel: false
    };

    let level = null;
    let player = null;
    let enemies = [];
    let coffees = [];
    let snippets = [];
    let weapon = null;
    let exit = null;
    let projectiles = [];
    let spawnPoint = { x: 0, y: 0 };

    let lastTime = 0;

    function createPlayer(spawn) {
        return {
            x: spawn.x,
            y: spawn.y,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            vx: 0,
            vy: 0,
            onGround: false,
            hasWeapon: false,
            weaponCooldown: 0,
            facing: 1,
            hp: 100,
            maxHP: 100,
            lives: 3,
            invulnerable: 0
        };
    }

    function openOverlay(el) {
        el.hidden = false;
        el.classList.add('visible');
    }

    function closeOverlay(el) {
        el.classList.remove('visible');
        setTimeout(() => {
            el.hidden = true;
        }, 50);
    }

    function createSolvedPuzzle() {
        return Array.from({ length: PUZZLE_SIZE * PUZZLE_SIZE }, (_, index) => (
            index === PUZZLE_SIZE * PUZZLE_SIZE - 1 ? 0 : index + 1
        ));
    }

    function countInversions(tiles) {
        let inversions = 0;
        for (let i = 0; i < tiles.length; i += 1) {
            if (tiles[i] === 0) {
                continue;
            }
            for (let j = i + 1; j < tiles.length; j += 1) {
                if (tiles[j] !== 0 && tiles[i] > tiles[j]) {
                    inversions += 1;
                }
            }
        }
        return inversions;
    }

    function isPuzzleSolvable(tiles) {
        const inversions = countInversions(tiles);
        if (PUZZLE_SIZE % 2 === 1) {
            return inversions % 2 === 0;
        }
        const emptyRowFromBottom = PUZZLE_SIZE - Math.floor(tiles.indexOf(0) / PUZZLE_SIZE);
        if (emptyRowFromBottom % 2 === 0) {
            return inversions % 2 === 1;
        }
        return inversions % 2 === 0;
    }

    function shufflePuzzleTiles() {
        puzzleTiles = createSolvedPuzzle();
        do {
            for (let i = puzzleTiles.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [puzzleTiles[i], puzzleTiles[j]] = [puzzleTiles[j], puzzleTiles[i]];
            }
            emptyIndex = puzzleTiles.indexOf(0);
        } while (!isPuzzleSolvable(puzzleTiles) || checkPuzzleSolved());
    }

    function renderPuzzleTiles() {
        if (!puzzleGrid) {
            return;
        }
        puzzleGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        puzzleTiles.forEach((value, index) => {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.dataset.index = String(index);
            tile.dataset.value = String(value);
            tile.className = 'slider-puzzle__tile';
            tile.setAttribute('tabindex', value === 0 ? '-1' : '0');
            if (value === 0) {
                tile.classList.add('slider-puzzle__tile--empty');
                tile.setAttribute('aria-label', 'Leeres Feld');
                tile.disabled = true;
            } else {
                tile.textContent = String(value);
                tile.setAttribute('aria-label', `Kachel ${value}`);
            }
            fragment.appendChild(tile);
        });
        puzzleGrid.appendChild(fragment);
    }

    function drawPuzzlePreview() {
        if (!puzzlePreviewCtx || !puzzlePreview) {
            return;
        }
        const { width, height } = puzzlePreview;
        puzzlePreviewCtx.clearRect(0, 0, width, height);
        const gradient = puzzlePreviewCtx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        puzzlePreviewCtx.fillStyle = gradient;
        puzzlePreviewCtx.fillRect(0, 0, width, height);

        // Pixel-Hintergrund
        for (let x = 0; x < width; x += 32) {
            for (let y = 0; y < height; y += 32) {
                puzzlePreviewCtx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(148, 163, 184, 0.08)';
                puzzlePreviewCtx.fillRect(x, y, 32, 32);
            }
        }

        // Plattform
        puzzlePreviewCtx.fillStyle = '#1e293b';
        puzzlePreviewCtx.fillRect(32, height - 64, width - 64, 40);
        puzzlePreviewCtx.fillStyle = '#0ea5e9';
        puzzlePreviewCtx.fillRect(32, height - 72, width - 64, 8);

        // Figur (Roland) in Pixeloptik
        const baseX = width / 2 - 24;
        const baseY = height - 104;
        puzzlePreviewCtx.fillStyle = '#fbbf24'; // Haare
        puzzlePreviewCtx.fillRect(baseX + 12, baseY, 24, 12);
        puzzlePreviewCtx.fillStyle = '#fcd34d';
        puzzlePreviewCtx.fillRect(baseX + 8, baseY + 12, 32, 28); // Kopf
        puzzlePreviewCtx.fillStyle = '#1d4ed8';
        puzzlePreviewCtx.fillRect(baseX + 6, baseY + 40, 36, 40); // Jacke
        puzzlePreviewCtx.fillStyle = '#0f172a';
        puzzlePreviewCtx.fillRect(baseX + 6, baseY + 68, 36, 24); // Hose
        puzzlePreviewCtx.fillStyle = '#e2e8f0';
        puzzlePreviewCtx.fillRect(baseX + 10, baseY + 52, 28, 14); // Shirt
        puzzlePreviewCtx.fillStyle = '#94a3b8';
        puzzlePreviewCtx.fillRect(baseX + 4, baseY + 92, 16, 12); // linker Schuh
        puzzlePreviewCtx.fillRect(baseX + 28, baseY + 92, 16, 12); // rechter Schuh

        // Laptop
        puzzlePreviewCtx.fillStyle = '#38bdf8';
        puzzlePreviewCtx.fillRect(baseX - 42, baseY + 30, 36, 24);
        puzzlePreviewCtx.fillStyle = '#0f172a';
        puzzlePreviewCtx.fillRect(baseX - 40, baseY + 32, 32, 20);

        // Kaffetasse
        puzzlePreviewCtx.fillStyle = '#f97316';
        puzzlePreviewCtx.fillRect(baseX + 48, baseY + 44, 18, 18);
        puzzlePreviewCtx.strokeStyle = '#f97316';
        puzzlePreviewCtx.lineWidth = 4;
        puzzlePreviewCtx.strokeRect(baseX + 64, baseY + 50, 12, 8);
    }

    function attemptMove(index) {
        if (!Number.isInteger(index) || index < 0 || index >= puzzleTiles.length) {
            return;
        }
        const row = Math.floor(index / PUZZLE_SIZE);
        const col = index % PUZZLE_SIZE;
        const emptyRow = Math.floor(emptyIndex / PUZZLE_SIZE);
        const emptyCol = emptyIndex % PUZZLE_SIZE;
        const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;
        if (!isAdjacent) {
            return;
        }
        const previousEmpty = emptyIndex;
        [puzzleTiles[emptyIndex], puzzleTiles[index]] = [puzzleTiles[index], puzzleTiles[emptyIndex]];
        emptyIndex = index;
        renderPuzzleTiles();
        const movedTile = puzzleGrid?.querySelector(`.slider-puzzle__tile[data-index="${previousEmpty}"]`);
        if (movedTile) {
            movedTile.classList.add('slider-puzzle__tile--animate');
            setTimeout(() => movedTile.classList.remove('slider-puzzle__tile--animate'), 220);
        }
        if (checkPuzzleSolved()) {
            resolvePuzzleReward();
        }
    }

    function checkPuzzleSolved() {
        if (puzzleTiles.length === 0) {
            return false;
        }
        for (let i = 0; i < puzzleTiles.length - 1; i += 1) {
            if (puzzleTiles[i] !== i + 1) {
                return false;
            }
        }
        return puzzleTiles[puzzleTiles.length - 1] === 0;
    }

    function resolvePuzzleReward() {
    function resetPuzzle() {
        puzzlePieces.forEach(piece => {
            piece.dataset.locked = 'false';
            piece.setAttribute('draggable', 'true');
            piece.style.removeProperty('top');
            piece.style.removeProperty('left');
            piece.style.removeProperty('position');
            piece.classList.remove('correct');
            puzzlePiecesContainer.appendChild(piece);
        });
        puzzleSlots.forEach(slot => {
            slot.dataset.filled = 'false';
            slot.textContent = slot.dataset.accept === 'api'
                ? 'API-Endpunkt'
                : slot.dataset.accept === 'ui'
                    ? 'Frontend'
                    : 'Deployment';
            slot.classList.remove('shake');
        });
    }

    function shufflePuzzlePieces() {
        const container = document.querySelector('.puzzle__pieces');
        const shuffled = puzzlePieces.slice().sort(() => Math.random() - 0.5);
        shuffled.forEach(piece => container.appendChild(piece));
    }

    function initPuzzle() {
        resetPuzzle();
        shufflePuzzlePieces();
    }

    function setupPuzzleDnD() {
        puzzlePieces.forEach(piece => {
            piece.addEventListener('dragstart', event => {
                if (piece.dataset.locked === 'true') {
                    event.preventDefault();
                    return;
                }
                event.dataTransfer.setData('text/plain', piece.dataset.id);
                setTimeout(() => piece.classList.add('dragging'), 0);
            });

            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
            });
        });

        puzzleSlots.forEach(slot => {
            slot.addEventListener('dragover', event => {
                event.preventDefault();
            });

            slot.addEventListener('drop', event => {
                event.preventDefault();
                const pieceId = event.dataTransfer.getData('text/plain');
                const piece = puzzlePieces.find(p => p.dataset.id === pieceId);
                if (!piece || piece.dataset.locked === 'true') {
                    return;
                }

                if (slot.dataset.accept === pieceId) {
                    slot.dataset.filled = 'true';
                    slot.classList.remove('shake');
                    slot.textContent = '';
                    piece.dataset.locked = 'true';
                    piece.setAttribute('draggable', 'false');
                    piece.classList.add('correct');
                    slot.appendChild(piece);
                    piece.style.position = 'static';
                    checkPuzzleCompletion();
                } else {
                    slot.classList.add('shake');
                    setTimeout(() => slot.classList.remove('shake'), 400);
                }
            });
        });
    }

    function checkPuzzleCompletion() {
        const solved = puzzleSlots.every(slot => slot.dataset.filled === 'true');
        if (!solved) {
            return;
        }
        state.score += 500;
        player.hp = Math.min(player.maxHP, player.hp + 30);
        updateHUD();
        closeOverlay(overlays.puzzle);
        state.awaitingNextLevel = false;

        if (state.levelIndex < LEVELS.length - 1) {
            state.levelIndex += 1;
            loadLevel(state.levelIndex, true);
        } else {
            showVictory();
        }
    }

    function initPuzzle() {
        shufflePuzzleTiles();
        renderPuzzleTiles();
    }

    function updateHUD() {
        const hpPercent = Math.max(0, Math.min(100, Math.round((player.hp / player.maxHP) * 100)));
        hud.hp.style.width = `${hpPercent}%`;
        hud.lives.textContent = String(player.lives);
        hud.score.textContent = String(state.score);
        hud.level.textContent = `${state.levelIndex + 1} / ${LEVELS.length}`;
        hud.weapon.textContent = player.hasWeapon ? 'Debug-Kanone' : 'Keine';
    }

    function loadLevel(index, keepStats = false) {
        state.current = 'running';
        state.awaitingNextLevel = false;
        const definition = LEVELS[index];
        const layout = definition.tiles.map(row => row.split(''));
        enemies = [];
        coffees = [];
        snippets = [];
        projectiles = [];
        weapon = null;
        exit = null;

        for (let y = 0; y < layout.length; y += 1) {
            for (let x = 0; x < layout[y].length; x += 1) {
                const char = layout[y][x];
                const worldX = x * TILE_SIZE;
                const worldY = y * TILE_SIZE;

                switch (char) {
                    case 'P':
                        spawnPoint = {
                            x: worldX + 8,
                            y: worldY + TILE_SIZE - PLAYER_HEIGHT - 2
                        };
                        layout[y][x] = '.';
                        break;
                    case 'B':
                        enemies.push({
                            x: worldX + 8,
                            y: worldY + 10,
                            width: 32,
                            height: 30,
                            vx: Math.random() > 0.5 ? 1.2 : -1.2,
                            range: 96,
                            originX: worldX + 8,
                            alive: true
                        });
                        layout[y][x] = '.';
                        break;
                    case 'C':
                        coffees.push({
                            x: worldX + 10,
                            y: worldY + 14,
                            width: 28,
                            height: 30
                        });
                        layout[y][x] = '.';
                        break;
                    case 'S':
                        snippets.push({
                            x: worldX + 10,
                            y: worldY + 10,
                            width: 28,
                            height: 28,
                            pulse: Math.random() * Math.PI * 2
                        });
                        layout[y][x] = '.';
                        break;
                    case 'W':
                        weapon = {
                            x: worldX + 8,
                            y: worldY + 6,
                            width: 32,
                            height: 32,
                            collected: false
                        };
                        layout[y][x] = '.';
                        break;
                    case 'E':
                        exit = {
                            x: worldX + 4,
                            y: worldY + 4,
                            width: TILE_SIZE - 8,
                            height: TILE_SIZE - 8
                        };
                        layout[y][x] = '.';
                        break;
                    default:
                        break;
                }
            }
        }

        level = {
            name: definition.name,
            layout,
            width: layout[0].length,
            height: layout.length
        };

        const previousStats = player
            ? { hp: player.hp, lives: player.lives }
            : null;

        if (!keepStats || !player) {
            player = createPlayer(spawnPoint);
            if (!keepStats) {
                state.score = 0;
            }
        } else {
            player.x = spawnPoint.x;
            player.y = spawnPoint.y;
            player.vx = 0;
            player.vy = 0;
            player.onGround = false;
            player.hasWeapon = false;
            player.weaponCooldown = 0;
        }

        if (keepStats && previousStats) {
            player.hp = Math.min(player.maxHP, previousStats.hp);
            player.lives = previousStats.lives;
        } else {
            player.hp = player.maxHP;
            player.lives = 3;
        }
        player.invulnerable = 0;

        updateHUD();
    }

    function isSolidTile(tileX, tileY) {
        if (tileY >= level.height) {
            return true;
        }
        if (tileY < 0) {
            return false;
        }
        if (tileX < 0 || tileX >= level.width) {
            return true;
        }
        const tile = level.layout[tileY][tileX];
        return tile === '#' || tile === '=';
    }

    function resolveCollisions(entity, axis) {
        const { width, height } = entity;
        if (axis === 'x') {
            const dir = Math.sign(entity.vx);
            if (dir === 0) {
                return;
            }
            const nextX = entity.x + entity.vx;
            const xEdge = dir > 0 ? nextX + width : nextX;
            const tileX = Math.floor(xEdge / TILE_SIZE);
            const topTile = Math.floor(entity.y / TILE_SIZE);
            const bottomTile = Math.floor((entity.y + height - 1) / TILE_SIZE);

            for (let ty = topTile; ty <= bottomTile; ty += 1) {
                if (isSolidTile(tileX, ty)) {
                    if (dir > 0) {
                        entity.x = tileX * TILE_SIZE - width - 0.1;
                    } else {
                        entity.x = (tileX + 1) * TILE_SIZE + 0.1;
                    }
                    entity.vx = 0;
                    return;
                }
            }
            entity.x = nextX;
        } else {
            const nextY = entity.y + entity.vy;
            const dirY = Math.sign(entity.vy);
            const yEdge = dirY > 0 ? nextY + height : nextY;
            const tileY = Math.floor(yEdge / TILE_SIZE);
            const leftTile = Math.floor(entity.x / TILE_SIZE);
            const rightTile = Math.floor((entity.x + width - 1) / TILE_SIZE);

            for (let tx = leftTile; tx <= rightTile; tx += 1) {
                if (isSolidTile(tx, tileY)) {
                    if (dirY > 0) {
                        entity.y = tileY * TILE_SIZE - height - 0.1;
                        entity.vy = 0;
                        if (entity === player) {
                            player.onGround = true;
                        }
                    } else {
                        entity.y = (tileY + 1) * TILE_SIZE + 0.1;
                        entity.vy = 0;
                    }
                    return;
                }
            }
            entity.y = nextY;
        }
    }

    function rectsOverlap(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function collectItems() {
        coffees = coffees.filter(cup => {
            if (rectsOverlap(player, cup)) {
                player.hp = Math.min(player.maxHP, player.hp + 25);
                state.score += 200;
                updateHUD();
                return false;
            }
            return true;
        });

        snippets = snippets.filter(snippet => {
            if (rectsOverlap(player, snippet)) {
                state.score += 150;
                updateHUD();
                return false;
            }
            return true;
        });

        if (weapon && !weapon.collected && rectsOverlap(player, weapon)) {
            weapon.collected = true;
            player.hasWeapon = true;
            state.score += 250;
            showWeaponToast('Debug-Kanone freigeschaltet! Drücke die Leertaste.');
            updateHUD();
        }
    }

    function handleExit() {
        if (!exit || state.current !== 'running' || player.lives <= 0) {
        if (!exit) {
            return;
        }
        if (rectsOverlap(player, exit)) {
            completeLevel();
        }
    }

    function completeLevel() {
        state.current = 'levelComplete';
        state.awaitingNextLevel = true;
        levelSummary.textContent = `Du hast ${state.score} Punkte gesammelt und ${player.lives} Leben übrig.`;
        puzzleButton.textContent = state.levelIndex === LEVELS.length - 1
            ? 'Finales Schiebe-Puzzle'
            : 'Zum Schiebe-Puzzle';
            ? 'Finales Bonus-Puzzle'
            : 'Zum Bonus-Puzzle';
        closeOverlay(overlays.gameOver);
        openOverlay(overlays.levelComplete);
    }

    function showWeaponToast(message) {
        weaponToast.textContent = message;
        weaponToast.hidden = false;
        weaponToast.style.animation = 'none';
        // Force reflow to restart animation
        void weaponToast.offsetWidth;
        weaponToast.style.animation = '';
        setTimeout(() => {
            weaponToast.hidden = true;
        }, 2400);
    }

    function applyDamage(amount) {
        if (player.invulnerable > 0 || state.current !== 'running') {
            return;
        }
        player.hp -= amount;
        player.invulnerable = 60;
        if (player.hp <= 0) {
            player.lives -= 1;
            updateHUD();
            if (player.lives > 0) {
                player.hp = player.maxHP;
                player.x = spawnPoint.x;
                player.y = spawnPoint.y;
                player.vx = 0;
                player.vy = 0;
                player.onGround = false;
            } else {
                player.hp = 0;
                updateHUD();
                triggerGameOver();
                return;
            }
        }
        updateHUD();
    }

    function triggerGameOver() {
        state.current = 'gameover';
        openOverlay(overlays.gameOver);
    }

    function showVictory() {
        state.current = 'victory';
        victorySummary.textContent = `Score: ${state.score} · Leben übrig: ${Math.max(player.lives, 0)}`;
        openOverlay(overlays.victory);
    }

    function fireWeapon() {
        if (!player.hasWeapon || player.weaponCooldown > 0) {
            return;
        }
        const projectile = {
            x: player.x + (player.facing > 0 ? player.width : -16),
            y: player.y + player.height / 2,
            width: 16,
            height: 6,
            vx: player.facing > 0 ? 12 : -12,
            ttl: 60
        };
        projectiles.push(projectile);
        player.weaponCooldown = 15;
    }

    function updateProjectiles() {
        projectiles = projectiles.filter(projectile => {
            projectile.x += projectile.vx;
            projectile.ttl -= 1;
            if (projectile.ttl <= 0) {
                return false;
            }
            for (const enemy of enemies) {
                if (!enemy.alive) {
                    continue;
                }
                if (rectsOverlap(projectile, enemy)) {
                    enemy.alive = false;
                    state.score += 200;
                    updateHUD();
                    return false;
                }
            }
            const tileX = Math.floor(projectile.x / TILE_SIZE);
            const tileY = Math.floor(projectile.y / TILE_SIZE);
            if (isSolidTile(tileX, tileY)) {
                return false;
            }
            return projectile.x > -32 && projectile.x < canvas.width + 32;
        });
    }

    function updateEnemies() {
        enemies.forEach(enemy => {
            if (!enemy.alive) {
                return;
            }
            enemy.x += enemy.vx;
            const tileBelow = Math.floor((enemy.y + enemy.height + 2) / TILE_SIZE);
            const frontX = enemy.vx > 0 ? enemy.x + enemy.width + 2 : enemy.x - 2;
            const tileFront = Math.floor(frontX / TILE_SIZE);
            const tileY = Math.floor(enemy.y / TILE_SIZE);

            if (isSolidTile(tileFront, tileY) || !isSolidTile(tileFront, tileBelow)) {
                enemy.vx *= -1;
            }

            if (rectsOverlap(player, enemy)) {
                if (player.vy > 0 && player.y + player.height - enemy.y < enemy.height) {
                    enemy.alive = false;
                    player.vy = -10;
                    state.score += 250;
                    updateHUD();
                } else {
                    applyDamage(35);
                }
            }
        });
    }

    function updatePlayer(delta) {
        if (keys.left) {
            player.vx = Math.max(player.vx - MOVE_ACCEL * delta, -MAX_SPEED);
            player.facing = -1;
        } else if (keys.right) {
            player.vx = Math.min(player.vx + MOVE_ACCEL * delta, MAX_SPEED);
            player.facing = 1;
        } else {
            player.vx *= FRICTION;
            if (Math.abs(player.vx) < 0.05) {
                player.vx = 0;
            }
        }

        player.vy += GRAVITY * delta;
        if (player.vy > 18) {
            player.vy = 18;
        }

        player.onGround = false;
        resolveCollisions(player, 'x');
        resolveCollisions(player, 'y');

        if (player.y > canvas.height + 64) {
            applyDamage(player.maxHP);
            player.x = spawnPoint.x;
            player.y = spawnPoint.y;
            player.vx = 0;
            player.vy = 0;
        }

        if (player.weaponCooldown > 0) {
            player.weaponCooldown -= 1;
        }
        if (player.invulnerable > 0) {
            player.invulnerable -= 1;
        }
    }

    function update(delta) {
        if (state.current !== 'running') {
            return;
        }
        updatePlayer(delta);
        if (state.current !== 'running') {
            return;
        }
        updateEnemies();
        if (state.current !== 'running') {
            return;
        }
        updateProjectiles();
        if (state.current !== 'running') {
            return;
        }
        collectItems();
        if (state.current !== 'running') {
            return;
        }
        updateEnemies();
        updateProjectiles();
        collectItems();
        handleExit();
    }

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawTiles() {
        for (let y = 0; y < level.height; y += 1) {
            for (let x = 0; x < level.width; x += 1) {
                const tile = level.layout[y][x];
                if (tile === '#') {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 12, TILE_SIZE, 12);
                } else if (tile === '=') {
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE / 2 - 4, TILE_SIZE, 4);
                }
            }
        }
    }

    function drawPlayer() {
        ctx.save();
        ctx.translate(player.x, player.y);
        if (player.facing < 0) {
            ctx.translate(player.width, 0);
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (player.facing < 0) {
            ctx.scale(-1, 1);
        }
        const alpha = player.invulnerable > 0 ? 0.5 + Math.sin(Date.now() / 60) * 0.3 : 1;
        ctx.globalAlpha = alpha;

        const centerX = player.width / 2;

        // Schatten
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(centerX, player.height + 4, player.width / 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hinterer Arm
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(centerX + 10, 24, 8, 24);

        // Hose
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(centerX - 16, 44, 32, 18);

        // Schuhe
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(centerX - 18, 62, 16, 8);
        ctx.fillRect(centerX + 2, 62, 16, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(centerX - 18, 68, 16, 4);
        ctx.fillRect(centerX + 2, 68, 16, 4);

        // Körper
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(centerX - 18, 20, 36, 30);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(centerX - 8, 20, 16, 30);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(centerX - 12, 28, 24, 10);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(centerX - 14, 22, 28, 6); // Schal

        // Vorderer Arm
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(centerX - 26, 26, 10, 26);
        ctx.fillStyle = '#f4c7b5';
        ctx.fillRect(centerX - 24, 46, 8, 8);

        // Kopf
        ctx.fillStyle = '#f4c7b5';
        ctx.fillRect(centerX - 14, 0, 28, 22);
        ctx.fillStyle = '#2c1810';
        ctx.fillRect(centerX - 16, -4, 32, 10);
        ctx.fillRect(centerX + 6, 2, 8, 10);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(centerX - 12, 12, 24, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(centerX - 10, 10, 6, 4);
        ctx.fillRect(centerX + 4, 10, 6, 4);
        ctx.fillRect(centerX - 2, 16, 4, 4);

        // Laptop-Tasche
        ctx.fillStyle = '#475569';
        ctx.fillRect(centerX + 12, 28, 10, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(centerX + 13, 30, 8, 16);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-player.width / 2 + 6, -player.height / 2 + 6, player.width - 12, player.height - 20);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-player.width / 2 + 4, player.height / 2 - 14, player.width - 8, 8);
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(player.width / 2 - 12, -player.height / 2 + 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    function drawEnemies() {
        enemies.forEach(enemy => {
            if (!enemy.alive) {
                return;
            }
            ctx.save();
            ctx.translate(enemy.x, enemy.y);

            // Unterer Schatten
            ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
            ctx.beginPath();
            ctx.ellipse(enemy.width / 2, enemy.height + 4, enemy.width / 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Roboterkörper
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(4, 6, enemy.width - 8, enemy.height - 12);
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(4, 6, enemy.width - 8, 10);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(enemy.width / 2 - 6, 8, 12, 4);

            // Bildschirm
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(8, 14, enemy.width - 16, 12);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(10, 16, enemy.width - 20, 8);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(12, 18, 4, 4);
            ctx.fillRect(enemy.width - 16, 18, 4, 4);

            // Beine
            ctx.fillStyle = '#475569';
            ctx.fillRect(6, enemy.height - 4, 6, 10);
            ctx.fillRect(enemy.width - 12, enemy.height - 4, 6, 10);

            // Antennen
            ctx.fillStyle = '#facc15';
            ctx.fillRect(enemy.width / 2 - 1, 0, 2, 6);
            ctx.beginPath();
            ctx.arc(enemy.width / 2, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            for (let i = -1; i <= 1; i += 1) {
                ctx.beginPath();
                ctx.moveTo(i * 10, enemy.height / 2);
                ctx.lineTo(i * 10 + (i === 0 ? 0 : 6 * Math.sign(i)), enemy.height / 2 + 12);
                ctx.stroke();
            }
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(-6, -4, 4, 0, Math.PI * 2);
            ctx.arc(6, -4, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    function drawCollectibles() {
        coffees.forEach(cup => {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cup.x, cup.y, cup.width, cup.height);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cup.x + 4, cup.y + 4, cup.width - 8, cup.height - 10);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(cup.x + 6, cup.y + 4, cup.width - 12, 6);
        });

        snippets.forEach(snippet => {
            const pulse = 4 * Math.sin(Date.now() / 200 + snippet.pulse);
            ctx.save();
            ctx.translate(snippet.x + snippet.width / 2, snippet.y + snippet.height / 2);
            ctx.rotate(Math.sin(Date.now() / 400 + snippet.pulse) * 0.1);
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(-snippet.width / 2, -snippet.height / 2, snippet.width, snippet.height);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-snippet.width / 2 + 4, -snippet.height / 2 + 4, snippet.width - 8, snippet.height - 8);
            ctx.restore();
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(snippet.x + snippet.width / 2 - 2, snippet.y + snippet.height + pulse, 4, 6 + pulse);
        });

        if (weapon && !weapon.collected) {
            ctx.save();
            ctx.translate(weapon.x + weapon.width / 2, weapon.y + weapon.height / 2);
            ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-weapon.width / 2, -weapon.height / 2, weapon.width, weapon.height);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-weapon.width / 2 + 6, -weapon.height / 2 + 6, weapon.width - 12, weapon.height - 12);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 3;
            ctx.strokeRect(-weapon.width / 2 + 4, -weapon.height / 2 + 4, weapon.width - 8, weapon.height - 8);
            ctx.restore();
        }

        if (exit) {
            ctx.save();
            ctx.translate(exit.x + exit.width / 2, exit.y + exit.height / 2);
            const gradient = ctx.createRadialGradient(0, 0, 6, 0, 0, exit.width / 2);
            gradient.addColorStop(0, '#38bdf8');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0.2)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, exit.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawProjectiles() {
        ctx.fillStyle = '#f8fafc';
        projectiles.forEach(projectile => {
            ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        });
    }

    function render() {
        drawBackground();
        if (!level) {
            return;
        }
        drawTiles();
        drawCollectibles();
        drawEnemies();
        drawProjectiles();
        drawPlayer();
    }

    function gameLoop(timestamp) {
        const delta = Math.min(2, (timestamp - lastTime) / 16.67 || 1);
        lastTime = timestamp;
        update(delta);
        render();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        closeOverlay(overlays.tutorial);
        state.levelIndex = 0;
        state.score = 0;
        player = null;
        loadLevel(0);
        updateHUD();
    }

    function restartGame() {
        closeOverlay(overlays.gameOver);
        closeOverlay(overlays.victory);
        state.score = 0;
        player = null;
        state.levelIndex = 0;
        loadLevel(0);
        updateHUD();
    }

    startButton.addEventListener('click', () => {
        state.current = 'running';
        startGame();
    });

    if (puzzleGrid) {
        puzzleGrid.addEventListener('click', event => {
            const tile = event.target.closest('.slider-puzzle__tile');
            if (!tile || tile.classList.contains('slider-puzzle__tile--empty')) {
                return;
            }
            const tileIndex = Number.parseInt(tile.dataset.index || '', 10);
            if (Number.isNaN(tileIndex)) {
                return;
            }
            attemptMove(tileIndex);
        });

        puzzleGrid.addEventListener('keydown', event => {
            if (state.current !== 'puzzle') {
                return;
            }
            const tile = event.target.closest('.slider-puzzle__tile');
            if (!tile || tile.classList.contains('slider-puzzle__tile--empty')) {
                return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const tileIndex = Number.parseInt(tile.dataset.index || '', 10);
                if (Number.isNaN(tileIndex)) {
                    return;
                }
                attemptMove(tileIndex);
            }
        });
    }

    puzzleButton.addEventListener('click', () => {
        if (!state.awaitingNextLevel) {
            return;
        }
        closeOverlay(overlays.levelComplete);
        initPuzzle();
        state.current = 'puzzle';
        openOverlay(overlays.puzzle);
    });

    puzzleReset.addEventListener('click', () => {
        initPuzzle();
    });

    restartButtons.forEach(button => {
        button.addEventListener('click', () => {
            restartGame();
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            keys.left = true;
        }
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            keys.right = true;
        }
        if ((event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') && player && player.onGround && state.current === 'running') {
            player.vy = -JUMP_FORCE;
            player.onGround = false;
        }
        if (event.key === ' ' || event.code === 'Space') {
            event.preventDefault();
            if (state.current === 'running') {
                fireWeapon();
            }
        }
    });

    document.addEventListener('keyup', event => {
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            keys.left = false;
        }
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            keys.right = false;
        }
    });

    drawPuzzlePreview();
    if (puzzleGrid) {
        puzzleTiles = createSolvedPuzzle();
        emptyIndex = puzzleTiles.indexOf(0);
        renderPuzzleTiles();
    }
    requestAnimationFrame(gameLoop);
})();
    setupPuzzleDnD();
    requestAnimationFrame(gameLoop);
})();


const stations = Array.from(document.querySelectorAll('.station'));
const progressBar = document.querySelector('.progress__bar span');
const progressLabel = document.querySelector('.progress__label');
const mainElement = document.querySelector('main');
const heroStart = document.querySelector('[data-action="start"]');
const finalSection = document.getElementById('final-stop');
const replayButton = finalSection?.querySelector('[data-action="replay"]');
const hornButton = document.querySelector('[data-horn]');
const hornSecret = document.querySelector('.horn-secret');

let currentIndex = -1;
let hornTaps = 0;
let hornTimeout;

const stationState = new Map();
stations.forEach((station) => stationState.set(station.id, { completed: false }));

function updateProgress() {
  const total = stations.length;
  const current = Math.min(Math.max(currentIndex + 1, 0), total);
  const percent = total === 0 ? 0 : Math.min((current / total) * 100, 100);
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressLabel) progressLabel.textContent = `Station ${current} von ${total}`;
}

function showStation(index) {
  stations.forEach((station, i) => {
    station.hidden = i !== index;
  });
  if (finalSection) finalSection.hidden = true;
  currentIndex = index;
  updateProgress();
}

function showFinal() {
  stations.forEach((station) => (station.hidden = true));
  if (finalSection) finalSection.hidden = false;
  currentIndex = stations.length;
  updateProgress();
}

function enableNext(station) {
  const nextButton = station.querySelector('[data-action="next"]');
  if (nextButton) nextButton.disabled = false;
  if (!stationState.has(station.id)) {
    stationState.set(station.id, { completed: true });
  } else {
    stationState.get(station.id).completed = true;
  }
}

function handleNavigation(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  if (action === 'start') {
    showStation(0);
    if (mainElement) {
      window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
    }
  }

  if (currentIndex < 0) return;
  const currentStation = stations[currentIndex];

  switch (action) {
    case 'next': {
      const state = stationState.get(currentStation.id);
      if (!state || !state.completed) return;
      if (currentIndex === stations.length - 1) {
        showFinal();
        if (mainElement) {
          window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
        }
      } else {
        showStation(currentIndex + 1);
      }
      break;
    }
    case 'prev': {
      if (currentIndex === 0) {
        currentStation.hidden = true;
        currentIndex = -1;
        updateProgress();
        break;
      }
      if (currentIndex > 0) {
        showStation(currentIndex - 1);
      }
      break;
    }
    case 'replay': {
      showStation(0);
      if (mainElement) {
        window.scrollTo({ top: mainElement.offsetTop, behavior: 'smooth' });
      }
      break;
    }
    default:
      break;
  }
}

document.addEventListener('click', handleNavigation);

function initStoryStation(station) {
  const choices = station.querySelectorAll('[data-story-choice]');
  const result = station.querySelector('[data-result="story"]');
  const achievement = station.querySelector('[data-achievement]');

  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      const key = choice.dataset.storyChoice;
      const data = {
        cms: 'CMS-Relaunch: Ich habe Content-Modelle entschlackt und Versionierung eingeführt.',
        intranet: 'Kommunikations-App: Fokus auf Moderationsrechte und mobile Performance.'
      };
      if (result) {
        result.textContent = data[key];
      }
      if (achievement) {
        achievement.textContent = 'Recruiter-Notiz: Ich liefere auch unter Zeitdruck planbar aus.';
      }
      choices.forEach((btn) => btn.classList.toggle('is-active', btn === choice));
      enableNext(station);
    });
  });
}

function initSkillStation(station) {
  const options = station.querySelectorAll('[data-correct]');
  const result = station.querySelector('[data-result="skills"]');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const isCorrect = option.dataset.correct === 'true';
      const proof = option.dataset.proof;
      options.forEach((btn) => btn.classList.remove('is-active', 'is-wrong'));
      option.classList.add(isCorrect ? 'is-active' : 'is-wrong');
      if (result) {
        result.textContent = proof;
        result.style.color = isCorrect ? 'var(--secondary)' : '#f87171';
      }
      if (isCorrect) enableNext(station);
    });
  });
}

function initProjectsStation(station) {
  const projects = station.querySelectorAll('[data-project]');
  const result = station.querySelector('[data-result="projects"]');
  const opened = new Set();

  projects.forEach((project) => {
    const trigger = project.querySelector('[data-project-open]');
    const details = project.querySelector('.project-details');
    if (!trigger || !details) return;
    trigger.addEventListener('click', () => {
      const hidden = details.hasAttribute('hidden');
      details.toggleAttribute('hidden', !hidden);
      project.classList.toggle('is-active', hidden);
      if (hidden) {
        opened.add(project);
      }
      if (result) {
        result.textContent = `${opened.size} Ticket(s) geprüft – gerne zeige ich mehr im Call.`;
      }
      if (opened.size >= 2) {
        enableNext(station);
      }
    });
  });
}

function initPersonalityStation(station) {
  const traits = station.querySelectorAll('[data-trait]');
  const result = station.querySelector('[data-result="personality"]');
  const opened = new Set();

  traits.forEach((trait) => {
    trait.addEventListener('click', () => {
      const text = trait.querySelector('.trait__text');
      const hidden = text.hasAttribute('hidden');
      text.toggleAttribute('hidden', !hidden);
      trait.classList.toggle('is-active', hidden);
      if (hidden) opened.add(trait);
      if (result) {
        result.textContent = `${opened.size}/3 Crew-Karten aufgedeckt`;
      }
      if (opened.size === traits.length) {
        result.textContent = 'Crew komplett – lass uns zusammen den nächsten Sprint planen!';
        enableNext(station);
      }
    });
  });
}

stations.forEach((station) => {
  if (station.id.includes('story')) initStoryStation(station);
  if (station.id.includes('skills')) initSkillStation(station);
  if (station.id.includes('projects')) initProjectsStation(station);
  if (station.id.includes('personality')) initPersonalityStation(station);
});

if (heroStart) {
  heroStart.addEventListener('click', () => {
    showStation(0);
  });
}

if (replayButton) {
  replayButton.addEventListener('click', () => {
    stations.forEach((station) => {
      stationState.set(station.id, { completed: false });
      const nextButton = station.querySelector('[data-action="next"]');
      if (nextButton) nextButton.disabled = true;
      station
        .querySelectorAll('.is-active, .is-wrong')
        .forEach((el) => el.classList.remove('is-active', 'is-wrong'));
      station.querySelectorAll('[data-result]').forEach((res) => {
        res.textContent = '';
        res.removeAttribute('style');
      });
      station.querySelectorAll('.project-details').forEach((details) => details.setAttribute('hidden', ''));
      station.querySelectorAll('.trait__text').forEach((text) => text.setAttribute('hidden', ''));
    });
    hornTaps = 0;
    if (hornSecret) {
      hornSecret.textContent = '';
    }
    showStation(0);
  });
}

if (hornButton) {
  hornButton.addEventListener('click', () => {
    hornTaps += 1;
    clearTimeout(hornTimeout);
    hornTimeout = setTimeout(() => {
      hornTaps = 0;
      if (hornSecret) {
        hornSecret.textContent = '';
      }
    }, 1200);

    if (!hornSecret) return;

    if (hornTaps >= 3) {
      hornSecret.textContent = 'Nightshift-Snack: Franzbrötchen mit kaltem Brew-Kaffee.';
      hornTaps = 0;
    } else {
      hornSecret.textContent = `Hupe ${hornTaps}/3`;
    }
  });
}

updateProgress();

