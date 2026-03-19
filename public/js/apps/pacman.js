(function () {
    'use strict';

    // ───────────────────────── MAZE DATA ─────────────────────────
    // 28 columns x 31 rows.  1 = wall, 2 = dot, 3 = power pellet, 0 = empty
    const MAZE_TEMPLATE = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
        [0,0,0,0,0,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,0,0,0,0,0],
        [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const TILE  = 16;
    const COLS  = 28;
    const ROWS  = 31;
    const W     = COLS * TILE; // 448
    const H     = ROWS * TILE; // 496

    const DIR = {
        NONE:  { x:  0, y:  0 },
        UP:    { x:  0, y: -1 },
        DOWN:  { x:  0, y:  1 },
        LEFT:  { x: -1, y:  0 },
        RIGHT: { x:  1, y:  0 },
    };

    const GHOST_COLORS  = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']; // red, pink, cyan, orange
    const GHOST_SCARED   = '#2121DE';
    const GHOST_FLASH    = '#FFFFFF';
    const PAC_COLOR      = '#FFE000';
    const WALL_COLOR     = '#2121DE';
    const DOT_COLOR      = '#FFFFFF';
    const BG_COLOR       = '#000000';

    const SPEED          = 2;            // pixels per frame
    const GHOST_SPEED    = 1.8;
    const GHOST_SCARED_SPEED = 1.2;
    const SCATTER_TIME   = 5000;         // ms per scatter/chase cycle

    // ───────────────────────── APP ─────────────────────────
    const PacManApp = {
        canvas: null,
        ctx: null,
        animId: null,
        abortController: null,
        container: null,

        // Game state
        maze: null,
        pacman: null,
        ghosts: [],
        score: 0,
        lives: 3,
        totalDots: 0,
        dotsEaten: 0,
        powerTimer: 0,
        gameOver: false,
        won: false,
        paused: false,
        started: false,
        lastTime: 0,
        mouthAngle: 0,
        mouthDir: 1,

        // ─── INIT ───
        init(containerEl) {
            this.container = containerEl;
            this.abortController = new AbortController();

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;background:#000;width:100%;height:100%;overflow:hidden;';

            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width  = W;
            this.canvas.height = H;
            this.canvas.style.cssText = 'display:block;max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated;';
            this.ctx = this.canvas.getContext('2d');

            wrapper.appendChild(this.canvas);
            containerEl.appendChild(wrapper);

            this.resetGame();
            this.bindKeys();
            this.started = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        },

        // ─── DESTROY ───
        destroy() {
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            if (this.container) {
                this.container.innerHTML = '';
                this.container = null;
            }
            this.canvas = null;
            this.ctx = null;
            this.started = false;
        },

        // ─── RESET ───
        resetGame() {
            this.maze = MAZE_TEMPLATE.map(row => [...row]);
            this.score = 0;
            this.lives = 3;
            this.dotsEaten = 0;
            this.totalDots = 0;
            this.powerTimer = 0;
            this.gameOver = false;
            this.won = false;
            this.mouthAngle = 0.25;
            this.mouthDir = 1;

            // Count dots
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (this.maze[r][c] === 2 || this.maze[r][c] === 3) this.totalDots++;
                }
            }

            this.resetPositions();
        },

        resetPositions() {
            this.pacman = {
                x: 14 * TILE,
                y: 23 * TILE + TILE / 2,
                dir: DIR.LEFT,
                nextDir: DIR.LEFT,
                moving: true,
            };

            this.ghosts = [
                this.makeGhost(14, 11, GHOST_COLORS[0], 'chase'),    // Red - chaser
                this.makeGhost(14, 14, GHOST_COLORS[1], 'ambush'),   // Pink - ambusher
                this.makeGhost(12, 14, GHOST_COLORS[2], 'random'),   // Cyan - random
                this.makeGhost(16, 14, GHOST_COLORS[3], 'patrol'),   // Orange - patrol
            ];
        },

        makeGhost(col, row, color, ai) {
            return {
                x: col * TILE,
                y: row * TILE + TILE / 2,
                dir: DIR.UP,
                color,
                ai,
                scared: false,
                eaten: false,
                scatterTarget: { x: 0, y: 0 },
                releaseTimer: ai === 'chase' ? 0 : (ai === 'ambush' ? 2000 : ai === 'random' ? 4000 : 6000),
                inHouse: ai !== 'chase',
            };
        },

        // ─── KEYBOARD ───
        bindKeys() {
            const signal = this.abortController.signal;

            document.addEventListener('keydown', (e) => {
                if (!this.started) return;

                if (this.gameOver || this.won) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.resetGame();
                        this.lastTime = performance.now();
                    }
                    return;
                }

                switch (e.key) {
                    case 'ArrowUp':    case 'w': case 'W': this.pacman.nextDir = DIR.UP;    e.preventDefault(); break;
                    case 'ArrowDown':  case 's': case 'S': this.pacman.nextDir = DIR.DOWN;  e.preventDefault(); break;
                    case 'ArrowLeft':  case 'a': case 'A': this.pacman.nextDir = DIR.LEFT;  e.preventDefault(); break;
                    case 'ArrowRight': case 'd': case 'D': this.pacman.nextDir = DIR.RIGHT; e.preventDefault(); break;
                }
            }, { signal });
        },

        // ─── GAME LOOP ───
        loop(timestamp) {
            if (!this.started) return;
            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (!this.gameOver && !this.won) {
                this.update(dt);
            }
            this.draw();

            this.animId = requestAnimationFrame((t) => this.loop(t));
        },

        // ─── UPDATE ───
        update(dt) {
            // Update power pellet timer
            if (this.powerTimer > 0) {
                this.powerTimer -= dt;
                if (this.powerTimer <= 0) {
                    this.powerTimer = 0;
                    this.ghosts.forEach(g => { g.scared = false; });
                }
            }

            // Update Pac-Man
            this.updatePacman();

            // Update ghosts
            this.ghosts.forEach(g => this.updateGhost(g, dt));

            // Check ghost collisions
            this.checkGhostCollisions();

            // Animate mouth
            this.mouthAngle += 0.04 * this.mouthDir;
            if (this.mouthAngle >= 0.35) this.mouthDir = -1;
            if (this.mouthAngle <= 0.02) this.mouthDir = 1;
        },

        // ─── PAC-MAN MOVEMENT ───
        updatePacman() {
            const p = this.pacman;

            // Try turning to next direction first
            if (p.nextDir !== p.dir) {
                if (this.canMove(p.x, p.y, p.nextDir, SPEED)) {
                    // Snap to grid when turning
                    p.x = this.snapToGrid(p.x);
                    p.y = this.snapToGrid(p.y);
                    p.dir = p.nextDir;
                }
            }

            // Move in current direction
            if (this.canMove(p.x, p.y, p.dir, SPEED)) {
                p.x += p.dir.x * SPEED;
                p.y += p.dir.y * SPEED;
                p.moving = true;
            } else {
                p.moving = false;
            }

            // Tunnel wrap
            if (p.x < -TILE) p.x = W;
            if (p.x > W) p.x = -TILE;

            // Eat dots
            const col = Math.round(p.x / TILE);
            const row = Math.round(p.y / TILE);
            if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
                const cell = this.maze[row][col];
                if (cell === 2) {
                    this.maze[row][col] = 0;
                    this.score += 10;
                    this.dotsEaten++;
                } else if (cell === 3) {
                    this.maze[row][col] = 0;
                    this.score += 50;
                    this.dotsEaten++;
                    this.activatePowerPellet();
                }
            }

            // Win check
            if (this.dotsEaten >= this.totalDots) {
                this.won = true;
            }
        },

        activatePowerPellet() {
            this.powerTimer = 5000;
            this.ghosts.forEach(g => {
                if (!g.eaten) g.scared = true;
            });
        },

        // ─── GHOST AI ───
        updateGhost(ghost, dt) {
            // Handle release timer for ghosts in the house
            if (ghost.inHouse) {
                ghost.releaseTimer -= dt;
                if (ghost.releaseTimer <= 0) {
                    ghost.inHouse = false;
                    ghost.x = 14 * TILE;
                    ghost.y = 11 * TILE + TILE / 2;
                    ghost.dir = DIR.LEFT;
                }
                return;
            }

            // If eaten, head back to ghost house
            if (ghost.eaten) {
                const homeX = 14 * TILE;
                const homeY = 14 * TILE;
                const dx = homeX - ghost.x;
                const dy = homeY - ghost.y;
                if (Math.abs(dx) < TILE && Math.abs(dy) < TILE) {
                    ghost.eaten = false;
                    ghost.scared = false;
                    ghost.x = homeX;
                    ghost.y = homeY;
                    ghost.inHouse = true;
                    ghost.releaseTimer = 2000;
                    return;
                }
            }

            const speed = ghost.scared ? GHOST_SCARED_SPEED : (ghost.eaten ? SPEED * 2 : GHOST_SPEED);

            // Check if ghost is on a grid intersection
            const onGridX = Math.abs(ghost.x - this.snapToGrid(ghost.x)) < speed;
            const onGridY = Math.abs(ghost.y - this.snapToGrid(ghost.y)) < speed;

            if (onGridX && onGridY) {
                ghost.x = this.snapToGrid(ghost.x);
                ghost.y = this.snapToGrid(ghost.y);

                // Pick new direction at intersection
                const target = this.getGhostTarget(ghost);
                const newDir = this.chooseGhostDirection(ghost, target, speed);
                if (newDir) ghost.dir = newDir;
            }

            // Move
            if (this.canMoveGhost(ghost.x, ghost.y, ghost.dir, speed)) {
                ghost.x += ghost.dir.x * speed;
                ghost.y += ghost.dir.y * speed;
            } else {
                // Pick a random valid direction if stuck
                ghost.x = this.snapToGrid(ghost.x);
                ghost.y = this.snapToGrid(ghost.y);
                const newDir = this.chooseGhostDirection(ghost, this.getGhostTarget(ghost), speed);
                if (newDir) ghost.dir = newDir;
            }

            // Tunnel wrap
            if (ghost.x < -TILE) ghost.x = W;
            if (ghost.x > W) ghost.x = -TILE;
        },

        getGhostTarget(ghost) {
            const p = this.pacman;

            if (ghost.eaten) {
                return { x: 14 * TILE, y: 14 * TILE };
            }

            if (ghost.scared) {
                // Run away - pick random corner
                const corners = [
                    { x: TILE, y: TILE },
                    { x: (COLS - 2) * TILE, y: TILE },
                    { x: TILE, y: (ROWS - 2) * TILE },
                    { x: (COLS - 2) * TILE, y: (ROWS - 2) * TILE },
                ];
                return corners[Math.floor(Math.random() * 4)];
            }

            switch (ghost.ai) {
                case 'chase':
                    // Directly target Pac-Man
                    return { x: p.x, y: p.y };

                case 'ambush': {
                    // Target 4 tiles ahead of Pac-Man
                    const tx = p.x + p.dir.x * TILE * 4;
                    const ty = p.y + p.dir.y * TILE * 4;
                    return { x: tx, y: ty };
                }

                case 'random':
                    // Random direction change at each intersection
                    return {
                        x: Math.random() * W,
                        y: Math.random() * H,
                    };

                case 'patrol': {
                    // Chase if close, scatter if far
                    const dist = Math.hypot(p.x - ghost.x, p.y - ghost.y);
                    if (dist < 8 * TILE) {
                        return { x: p.x, y: p.y };
                    }
                    // Patrol bottom-left
                    return { x: TILE, y: (ROWS - 2) * TILE };
                }

                default:
                    return { x: p.x, y: p.y };
            }
        },

        chooseGhostDirection(ghost, target, speed) {
            const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
            const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };

            // Filter to valid directions (no reversing, no walls)
            const valid = dirs.filter(d => {
                // No reversing
                if (d.x === opposite.x && d.y === opposite.y) return false;
                return this.canMoveGhost(ghost.x, ghost.y, d, speed);
            });

            if (valid.length === 0) {
                // If stuck, allow reversing
                const any = dirs.filter(d => this.canMoveGhost(ghost.x, ghost.y, d, speed));
                return any.length > 0 ? any[0] : null;
            }

            if (ghost.scared && !ghost.eaten) {
                // Random when scared
                return valid[Math.floor(Math.random() * valid.length)];
            }

            // Pick direction closest to target
            let best = valid[0];
            let bestDist = Infinity;
            for (const d of valid) {
                const nx = ghost.x + d.x * TILE;
                const ny = ghost.y + d.y * TILE;
                const dist = Math.hypot(target.x - nx, target.y - ny);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = d;
                }
            }
            return best;
        },

        // ─── COLLISION ───
        checkGhostCollisions() {
            const p = this.pacman;
            for (const g of this.ghosts) {
                if (g.inHouse || g.eaten) continue;
                const dist = Math.hypot(p.x - g.x, p.y - g.y);
                if (dist < TILE * 0.8) {
                    if (g.scared) {
                        // Eat ghost
                        g.eaten = true;
                        g.scared = false;
                        this.score += 200;
                    } else {
                        // Pac-Man dies
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver = true;
                        } else {
                            this.resetPositions();
                        }
                        return;
                    }
                }
            }
        },

        // ─── MOVEMENT HELPERS ───
        snapToGrid(val) {
            return Math.round(val / TILE) * TILE;
        },

        canMove(x, y, dir, speed) {
            const nx = x + dir.x * speed;
            const ny = y + dir.y * speed;
            return !this.hitsWall(nx, ny);
        },

        canMoveGhost(x, y, dir, speed) {
            const nx = x + dir.x * speed;
            const ny = y + dir.y * speed;
            return !this.hitsWall(nx, ny);
        },

        hitsWall(px, py) {
            // Check the four corners of the entity's bounding box (slightly smaller than a tile)
            const margin = TILE * 0.4;
            const points = [
                { x: px - margin, y: py - margin },
                { x: px + margin, y: py - margin },
                { x: px - margin, y: py + margin },
                { x: px + margin, y: py + margin },
            ];
            for (const pt of points) {
                const col = Math.floor(pt.x / TILE + 0.5);
                const row = Math.floor(pt.y / TILE + 0.5);
                // Allow tunnel passage
                if (col < 0 || col >= COLS) continue;
                if (row < 0 || row >= ROWS) return true;
                if (this.maze[row][col] === 1) return true;
            }
            return false;
        },

        // ─── DRAWING ───
        draw() {
            const ctx = this.ctx;
            if (!ctx) return;

            ctx.fillStyle = BG_COLOR;
            ctx.fillRect(0, 0, W, H);

            this.drawMaze(ctx);
            this.drawPacman(ctx);
            this.drawGhosts(ctx);
            this.drawHUD(ctx);

            if (this.gameOver) this.drawGameOver(ctx);
            if (this.won) this.drawWin(ctx);
        },

        drawMaze(ctx) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const x = c * TILE;
                    const y = r * TILE;
                    const cell = this.maze[r][c];

                    if (cell === 1) {
                        // Draw wall with rounded style
                        ctx.fillStyle = WALL_COLOR;
                        ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);

                        // Add subtle inner highlight
                        ctx.strokeStyle = '#4242FF';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
                    } else if (cell === 2) {
                        // Dot
                        ctx.fillStyle = DOT_COLOR;
                        ctx.beginPath();
                        ctx.arc(x + TILE / 2, y + TILE / 2, 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (cell === 3) {
                        // Power pellet (pulsing)
                        const pulse = 3 + Math.sin(performance.now() / 200) * 1.5;
                        ctx.fillStyle = DOT_COLOR;
                        ctx.beginPath();
                        ctx.arc(x + TILE / 2, y + TILE / 2, pulse, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        },

        drawPacman(ctx) {
            const p = this.pacman;
            let angle = 0;
            if (p.dir === DIR.RIGHT) angle = 0;
            else if (p.dir === DIR.DOWN) angle = Math.PI / 2;
            else if (p.dir === DIR.LEFT) angle = Math.PI;
            else if (p.dir === DIR.UP) angle = -Math.PI / 2;

            const mouth = p.moving ? this.mouthAngle : 0.05;

            ctx.fillStyle = PAC_COLOR;
            ctx.beginPath();
            ctx.arc(p.x, p.y, TILE / 2, angle + mouth * Math.PI, angle - mouth * Math.PI);
            ctx.lineTo(p.x, p.y);
            ctx.closePath();
            ctx.fill();
        },

        drawGhosts(ctx) {
            for (const g of this.ghosts) {
                if (g.inHouse && g.releaseTimer > 0) {
                    // Draw ghost in house
                    this.drawSingleGhost(ctx, g.x, g.y, g.color, false, false);
                    continue;
                }
                if (g.eaten) {
                    // Draw eyes only
                    this.drawGhostEyes(ctx, g.x, g.y, g.dir);
                    continue;
                }

                const flashing = g.scared && this.powerTimer < 2000 && this.powerTimer > 0;
                this.drawSingleGhost(ctx, g.x, g.y, g.color, g.scared, flashing);
            }
        },

        drawSingleGhost(ctx, x, y, color, scared, flashing) {
            const r = TILE / 2;

            if (scared) {
                ctx.fillStyle = flashing && Math.floor(performance.now() / 150) % 2 ? GHOST_FLASH : GHOST_SCARED;
            } else {
                ctx.fillStyle = color;
            }

            // Ghost body: rounded top + wavy bottom
            ctx.beginPath();
            ctx.arc(x, y - 2, r, Math.PI, 0, false);
            ctx.lineTo(x + r, y + r - 2);

            // Wavy bottom
            const waves = 3;
            const ww = (r * 2) / waves;
            for (let i = 0; i < waves; i++) {
                const bx = x + r - (i + 1) * ww;
                ctx.quadraticCurveTo(
                    x + r - i * ww - ww / 2, y + r + 2,
                    bx, y + r - 2
                );
            }
            ctx.closePath();
            ctx.fill();

            // Eyes
            if (scared) {
                // Scared face
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2);
                ctx.arc(x + 3, y - 3, 2, 0, Math.PI * 2);
                ctx.fill();

                // Scared mouth (wavy line)
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 4, y + 3);
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(x - 4 + i * 2.5 + 1, y + (i % 2 ? 1 : 4));
                }
                ctx.stroke();
            } else {
                this.drawGhostEyes(ctx, x, y, null);
            }
        },

        drawGhostEyes(ctx, x, y, dir) {
            // White of eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(x - 3, y - 3, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 3, y - 3, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils - look toward pac-man or in movement direction
            let px = 0, py = 0;
            if (dir && dir !== DIR.NONE) {
                px = dir.x * 1.5;
                py = dir.y * 1.5;
            } else {
                const p = this.pacman;
                if (p) {
                    const ang = Math.atan2(p.y - y, p.x - x);
                    px = Math.cos(ang) * 1.5;
                    py = Math.sin(ang) * 1.5;
                }
            }

            ctx.fillStyle = '#00F';
            ctx.beginPath();
            ctx.arc(x - 3 + px, y - 3 + py, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 3 + px, y - 3 + py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        },

        drawHUD(ctx) {
            // Score
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('SCORE: ' + this.score, 8, 12);

            // High score area
            ctx.textAlign = 'center';
            ctx.fillText('PAC-MAN', W / 2, 12);

            // Lives
            ctx.textAlign = 'right';
            for (let i = 0; i < this.lives; i++) {
                const lx = W - 16 - i * 20;
                const ly = 8;
                ctx.fillStyle = PAC_COLOR;
                ctx.beginPath();
                ctx.arc(lx, ly, 6, 0.2 * Math.PI, -0.2 * Math.PI);
                ctx.lineTo(lx, ly);
                ctx.closePath();
                ctx.fill();
            }
        },

        drawGameOver(ctx) {
            // Darken
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 30px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', W / 2, H / 2 - 30);

            ctx.fillStyle = '#FFF';
            ctx.font = '16px monospace';
            ctx.fillText('Score: ' + this.score, W / 2, H / 2 + 10);

            ctx.fillStyle = '#FFE000';
            ctx.font = '14px monospace';
            ctx.fillText('Press ENTER or SPACE to play again', W / 2, H / 2 + 50);
        },

        drawWin(ctx) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#FFE000';
            ctx.font = 'bold 30px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('YOU WIN!', W / 2, H / 2 - 30);

            ctx.fillStyle = '#FFF';
            ctx.font = '16px monospace';
            ctx.fillText('Score: ' + this.score, W / 2, H / 2 + 10);

            ctx.fillStyle = '#FFE000';
            ctx.font = '14px monospace';
            ctx.fillText('Press ENTER or SPACE to play again', W / 2, H / 2 + 50);
        },
    };

    window.PacManApp = PacManApp;
})();
