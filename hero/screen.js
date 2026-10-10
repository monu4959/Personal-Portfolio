// RK-01 screen: a 480x432 canvas that runs the intro typewriter and the Snake game.
// It is used as a texture by the WebGL console and shown directly by the CSS fallback.

const W = 480;
const H = 432;
const CELL = 24;
const COLS = 20;
const ROWS = 16;
const HUD = H - ROWS * CELL; // 48px status bar on top
const FONT = '"Press Start 2P", ui-monospace, monospace';
const HI_KEY = 'rk01.snake.hi';

const PALETTES = [
    // old monochrome LCD
    { bg: '#1c3a22', grid: '#21442a', dim: '#5d8a44', text: '#b6dd78', hi: '#e6ffb4', apple: '#e6ffb4', stem: '#8fbf5a' },
    // neon, matches the synthwave background
    { bg: '#170726', grid: '#1f0b33', dim: '#7c3c95', text: '#ff8ae0', hi: '#7df9ff', apple: '#ff4f7b', stem: '#7df9ff' }
];

const APPLE = [
    '...##...',
    '....#...',
    '.######.',
    '########',
    '########',
    '########',
    '.######.',
    '..####..'
];

const LINES = ['Hi, my name is', 'Rohan'];
const TYPE_MS = 90;

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const VECTORS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function readHi() {
    try { return parseInt(localStorage.getItem(HI_KEY), 10) || 0; } catch (e) { return 0; }
}
function writeHi(v) {
    try { localStorage.setItem(HI_KEY, String(v)); } catch (e) { /* storage blocked */ }
}

export function createScreen({ reducedMotion = false, onStateChange = () => {} } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.className = 'rk-screen-canvas';
    const ctx = canvas.getContext('2d');

    let pal = PALETTES[0];
    let state = 'off'; // off | typing | title | playing | paused | gameover
    let version = 0;
    let dirty = true;
    let lastBlink = -1;

    // typewriter
    let typed = 0; // characters revealed across both lines
    const total = LINES[0].length + LINES[1].length;
    let nextTypeAt = 0;
    let titleReadyAt = 0;

    // snake
    let snake, dir, queue, apple, score, hi = readHi(), newHi = false, stepMs, nextStepAt, won;

    function setState(s) {
        if (state === s) return;
        state = s;
        dirty = true;
        onStateChange(s);
    }

    // ---------- drawing helpers ----------
    function text(str, x, y, size, color, align = 'left') {
        ctx.font = `${size}px ${FONT}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillText(str, x, y);
    }

    function clear() {
        ctx.fillStyle = pal.bg;
        ctx.fillRect(0, 0, W, H);
    }

    function lcdOverlay() {
        // faint pixel grid so it reads as an LCD rather than a flat fill
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
        for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H);
        // soft vignette
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    function blinkOn(now, period = 530) {
        if (reducedMotion) return true;
        return Math.floor(now / period) % 2 === 0;
    }

    // ---------- intro ----------
    function drawIntro(now) {
        clear();
        text('RK-01', 16, 16, 12, pal.dim);
        const s1 = 24, s2 = 48;
        const x1 = (W - LINES[0].length * s1) / 2;
        const x2 = (W - LINES[1].length * s2) / 2;
        const y1 = 150, y2 = 200;
        const n1 = Math.min(typed, LINES[0].length);
        const n2 = Math.max(0, typed - LINES[0].length);
        text(LINES[0].slice(0, n1), x1, y1, s1, pal.text);
        if (n2) text(LINES[1].slice(0, n2), x2, y2, s2, pal.hi);

        // block cursor: solid while typing, blinking when idle
        const typing = state === 'typing';
        if (typing || blinkOn(now)) {
            ctx.fillStyle = pal.hi;
            // once line one is complete the cursor "returns" to line two
            if (n1 === LINES[0].length) ctx.fillRect(x2 + n2 * s2 + 4, y2, s2 * 0.75, s2);
            else ctx.fillRect(x1 + n1 * s1 + 2, y1, s1 * 0.75, s1);
        }

        if (state === 'title' && now >= titleReadyAt) {
            if (blinkOn(now, 600)) {
                text('START', W / 2, 352, 24, pal.hi, 'center');
                // little arrow
                ctx.fillStyle = pal.hi;
                const ax = W / 2 - 92, ay = 352;
                for (let i = 0; i < 6; i++) ctx.fillRect(ax + i * 3, ay + i * 2, 3, 24 - i * 4);
            }
            if (hi > 0) text(`HI ${hi}`, W / 2, 396, 12, pal.dim, 'center');
        }
    }

    // ---------- snake ----------
    function resetGame(now) {
        const y = Math.floor(ROWS / 2);
        snake = [[7, y], [6, y], [5, y], [4, y]];
        dir = 'right';
        queue = [];
        score = 0;
        newHi = false;
        won = false;
        stepMs = 140;
        nextStepAt = now + 400; // brief beat before it moves
        placeApple();
    }

    function placeApple() {
        const occupied = new Set(snake.map(([x, y]) => y * COLS + x));
        const free = [];
        for (let i = 0; i < COLS * ROWS; i++) if (!occupied.has(i)) free.push(i);
        if (!free.length) { apple = null; return false; }
        const i = free[Math.floor(Math.random() * free.length)];
        apple = [i % COLS, Math.floor(i / COLS)];
        return true;
    }

    function step() {
        if (queue.length) dir = queue.shift();
        const [dx, dy] = VECTORS[dir];
        const head = [snake[0][0] + dx, snake[0][1] + dy];
        const eating = apple && head[0] === apple[0] && head[1] === apple[1];
        const body = eating ? snake : snake.slice(0, -1); // tail moves away unless we grow
        const hitWall = head[0] < 0 || head[1] < 0 || head[0] >= COLS || head[1] >= ROWS;
        const hitSelf = body.some(([x, y]) => x === head[0] && y === head[1]);
        if (hitWall || hitSelf) return endGame();
        snake.unshift(head);
        if (eating) {
            score += 10;
            stepMs = Math.max(70, stepMs - 3);
            if (!placeApple()) { won = true; return endGame(); }
        } else {
            snake.pop();
        }
        dirty = true;
    }

    function endGame() {
        if (score > hi) { hi = score; newHi = true; writeHi(hi); }
        setState('gameover');
    }

    function drawBoard() {
        clear();
        // HUD
        text(`SCORE ${score}`, 14, 17, 16, pal.text);
        text(`HI ${Math.max(hi, score)}`, W - 14, 17, 16, pal.dim, 'right');
        ctx.fillStyle = pal.dim;
        ctx.fillRect(0, HUD - 3, W, 3);
        // checkerboard field
        ctx.fillStyle = pal.grid;
        for (let y = 0; y < ROWS; y++)
            for (let x = (y % 2); x < COLS; x += 2) ctx.fillRect(x * CELL, HUD + y * CELL, CELL, CELL);
        // apple
        if (apple) {
            const ox = apple[0] * CELL, oy = HUD + apple[1] * CELL;
            for (let r = 0; r < 8; r++)
                for (let c = 0; c < 8; c++)
                    if (APPLE[r][c] === '#') {
                        ctx.fillStyle = r < 2 ? pal.stem : pal.apple;
                        ctx.fillRect(ox + c * 3, oy + r * 3, 3, 3);
                    }
        }
        // snake
        snake.forEach(([x, y], i) => {
            ctx.fillStyle = i === 0 ? pal.hi : pal.text;
            ctx.fillRect(x * CELL + 2, HUD + y * CELL + 2, CELL - 4, CELL - 4);
        });
        // eyes
        const [hx, hy] = snake[0];
        const [dx, dy] = VECTORS[dir];
        ctx.fillStyle = pal.bg;
        const cx = hx * CELL + CELL / 2 + dx * 4, cy = HUD + hy * CELL + CELL / 2 + dy * 4;
        const px = dy !== 0 ? 5 : 0, py = dx !== 0 ? 5 : 0;
        ctx.fillRect(cx - px - 2, cy - py - 2, 4, 4);
        ctx.fillRect(cx + px - 2, cy + py - 2, 4, 4);
    }

    function panel(y, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, HUD, W, H - HUD);
        ctx.fillStyle = pal.bg;
        ctx.fillRect(48, y, W - 96, h);
        ctx.fillStyle = pal.text;
        ctx.fillRect(48, y, W - 96, 3);
        ctx.fillRect(48, y + h - 3, W - 96, 3);
        ctx.fillRect(48, y, 3, h);
        ctx.fillRect(W - 51, y, 3, h);
    }

    function drawGameOver(now) {
        drawBoard();
        panel(110, 250);
        text(won ? 'YOU WIN!' : 'GAME OVER', W / 2, 140, 32, pal.hi, 'center');
        text(`SCORE ${score}`, W / 2, 205, 16, pal.text, 'center');
        if (newHi) { if (blinkOn(now, 300)) text('NEW HI-SCORE!', W / 2, 238, 12, pal.hi, 'center'); }
        else text(`HI ${hi}`, W / 2, 238, 12, pal.dim, 'center');
        if (blinkOn(now, 600)) text('PRESS START', W / 2, 305, 16, pal.text, 'center');
    }

    function drawPaused(now) {
        drawBoard();
        panel(160, 120);
        text('PAUSED', W / 2, 190, 24, pal.hi, 'center');
        if (blinkOn(now, 600)) text('PRESS START', W / 2, 240, 12, pal.text, 'center');
    }

    function drawOff() {
        ctx.fillStyle = '#0d1a10';
        ctx.fillRect(0, 0, W, H);
    }

    // ---------- loop ----------
    function frame(now) {
        if (state === 'typing' && now >= nextTypeAt) {
            typed++;
            dirty = true;
            if (typed >= total) {
                setState('title');
                titleReadyAt = now + 500;
            } else {
                // a short beat at the line break, like someone hitting return
                nextTypeAt = now + (typed === LINES[0].length ? TYPE_MS * 4 : TYPE_MS);
            }
        }
        if (state === 'playing' && now >= nextStepAt) {
            step();
            nextStepAt = now + stepMs;
        }
        const blink = reducedMotion ? 0 : Math.floor(now / 150);
        if (blink !== lastBlink && state !== 'playing') { lastBlink = blink; dirty = true; }

        if (dirty) {
            dirty = false;
            if (state === 'off') drawOff();
            else if (state === 'typing' || state === 'title') drawIntro(now);
            else if (state === 'playing') drawBoard();
            else if (state === 'paused') drawPaused(now);
            else if (state === 'gameover') drawGameOver(now);
            if (state !== 'off') lcdOverlay();
            version++;
        }
        requestAnimationFrame(frame);
    }

    drawOff();
    requestAnimationFrame(frame);

    // ---------- public API ----------
    return {
        canvas,
        get version() { return version; },
        get state() { return state; },
        boot() {
            const now = performance.now();
            if (reducedMotion) {
                typed = total;
                setState('title');
                titleReadyAt = now;
            } else {
                typed = 0;
                nextTypeAt = now + 350;
                setState('typing');
            }
        },
        // START / Enter / tapping the screen
        start() {
            const now = performance.now();
            if (state === 'typing') { typed = total; titleReadyAt = now; setState('title'); }
            else if (state === 'title' || state === 'gameover') { resetGame(now); setState('playing'); }
            else if (state === 'playing') setState('paused');
            else if (state === 'paused') { nextStepAt = now + 250; setState('playing'); }
        },
        pause() { if (state === 'playing') setState('paused'); },
        select() { pal = pal === PALETTES[0] ? PALETTES[1] : PALETTES[0]; dirty = true; },
        direction(d) {
            if (state !== 'playing' || !VECTORS[d]) return;
            const last = queue.length ? queue[queue.length - 1] : dir;
            if (d === last || d === OPPOSITE[last]) return;
            if (queue.length < 3) queue.push(d);
        }
    };
}
