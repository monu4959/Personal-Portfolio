// Top-down football pitch with tiny 8-bit players, drawn on a canvas behind the About section.
// Simulation runs in pitch metres (105 x 68); the pitch lies horizontally on wide screens and
// vertically on tall ones, and its centre circle sits under the player card.

const L = 105, Wd = 68;          // pitch length / width (m)
const STRIPES = 12;              // mowing stripes across the length
const RUN = 3.4, SPRINT = 5.2;   // m/s, kept slow so the background stays calm
const PASS_SPEED = 13, SHOT_SPEED = 21;

// 8x12 sprites. H hair, S skin, J jersey, P shorts, L socks, B boots
const BODY = [
    '..HHH...',
    '.HSSSH..',
    '..SSS...',
    '.JJJJJ..',
    'JJJJJJJ.',
    'S.JJJ.S.',
    '..JJJ...',
    '..PPP...'
];
const LEGS = {
    stand: ['..P.P...', '..L.L...', '..L.L...', '.BB.BB..'],
    run1: ['..PP.P..', '..L..L..', '.L....L.', 'BB....BB'],
    run2: ['..P.PP..', '..L.L...', '...LL...', '..BBBB..']
};
const TEAMS = [
    { J: '#ff4fd8', P: '#2b1240', L: '#ff4fd8', keeper: '#ffd23f' },
    { J: '#4fe3ff', P: '#14263a', L: '#4fe3ff', keeper: '#9dff6a' }
];
const COMMON = { H: '#2a1a12', S: '#e8b48a', B: '#111111' };

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.u - b.u, a.v - b.v);

export function createPitch({ section, anchor, reducedMotion }) {
    const canvas = document.createElement('canvas');
    canvas.className = 'rk-pitch';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas'); // static pitch, redrawn only on resize
    const lctx = layer.getContext('2d');

    let dpr = 1, cw = 0, ch = 0;
    let view = { cx: 0, cy: 0, s: 10, portrait: false, px: 2 };

    // ---------- geometry ----------
    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        cw = section.clientWidth;
        ch = section.clientHeight;
        canvas.width = layer.width = Math.round(cw * dpr);
        canvas.height = layer.height = Math.round(ch * dpr);
        const portrait = ch > cw * 1.15 && cw < 900;
        const s = portrait ? (cw * 0.92) / Wd : Math.min((cw * 0.94) / L, (ch * 0.9) / Wd);
        // centre spot under the card's feet
        const sr = section.getBoundingClientRect();
        const ar = anchor.getBoundingClientRect();
        const cx = ar.left - sr.left + ar.width / 2;
        const cy = ar.bottom - sr.top - ar.height * 0.06;
        view = { cx, cy, s, portrait, px: clamp(Math.round(s * 0.22), 2, 4) };
        drawLayer();
    }

    // pitch metres -> CSS pixels
    function toScreen(u, v) {
        const du = (u - L / 2) * view.s, dv = (v - Wd / 2) * view.s;
        return view.portrait ? { x: view.cx + dv, y: view.cy + du } : { x: view.cx + du, y: view.cy + dv };
    }

    function drawLayer() {
        const g = lctx;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        // mowing stripes fill the whole section, aligned to the halfway line
        const stripe = (L / STRIPES) * view.s;
        const along = view.portrait ? ch : cw;
        const origin = (view.portrait ? view.cy : view.cx) - stripe * 6;
        const first = Math.floor((0 - origin) / stripe) - 1;
        for (let i = first; origin + i * stripe < along + stripe; i++) {
            g.fillStyle = ((i % 2) + 2) % 2 ? '#2c6a37' : '#33763f';
            const p = origin + i * stripe;
            if (view.portrait) g.fillRect(0, p, cw, stripe + 1);
            else g.fillRect(p, 0, stripe + 1, ch);
        }

        // markings, drawn in metres
        g.save();
        g.translate(view.cx, view.cy);
        if (view.portrait) g.rotate(Math.PI / 2);
        g.scale(view.s, view.s);
        g.translate(-L / 2, -Wd / 2);
        g.strokeStyle = 'rgba(255,255,255,0.78)';
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.lineWidth = Math.max(2, view.s * 0.12) / view.s;
        const line = (pts) => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach((p) => g.lineTo(...p)); g.stroke(); };
        const spot = (u, v, r = 0.35) => { g.beginPath(); g.arc(u, v, r, 0, Math.PI * 2); g.fill(); };

        g.strokeRect(0, 0, L, Wd);
        line([[L / 2, 0], [L / 2, Wd]]);
        g.beginPath(); g.arc(L / 2, Wd / 2, 9.15, 0, Math.PI * 2); g.stroke();
        spot(L / 2, Wd / 2);
        const arcA = Math.acos(5.5 / 9.15);
        [[0, 1], [L, -1]].forEach(([gx, dir]) => {
            const pb = 16.5, pw = 40.32, gb = 5.5, gw = 18.32;
            line([[gx, (Wd - pw) / 2], [gx + dir * pb, (Wd - pw) / 2], [gx + dir * pb, (Wd + pw) / 2], [gx, (Wd + pw) / 2]]);
            line([[gx, (Wd - gw) / 2], [gx + dir * gb, (Wd - gw) / 2], [gx + dir * gb, (Wd + gw) / 2], [gx, (Wd + gw) / 2]]);
            spot(gx + dir * 11, Wd / 2);
            g.beginPath();
            if (dir > 0) g.arc(gx + 11, Wd / 2, 9.15, -arcA, arcA);
            else g.arc(gx - 11, Wd / 2, 9.15, Math.PI - arcA, Math.PI + arcA);
            g.stroke();
            // goal frame and net
            g.save();
            g.strokeStyle = 'rgba(255,255,255,0.9)';
            line([[gx, (Wd - 7.32) / 2], [gx - dir * 2, (Wd - 7.32) / 2], [gx - dir * 2, (Wd + 7.32) / 2], [gx, (Wd + 7.32) / 2]]);
            g.strokeStyle = 'rgba(255,255,255,0.25)';
            g.lineWidth /= 2;
            for (let k = 1; k < 7; k++) line([[gx, (Wd - 7.32) / 2 + k * 1.046], [gx - dir * 2, (Wd - 7.32) / 2 + k * 1.046]]);
            g.restore();
        });
        [[0, 0, 0], [L, 0, Math.PI / 2], [L, Wd, Math.PI], [0, Wd, Math.PI * 1.5]].forEach(([u, v, a]) => {
            g.beginPath(); g.arc(u, v, 1, a, a + Math.PI / 2); g.stroke();
        });
        g.restore();

        // soft vignette keeps the edges calm behind text panels
        const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
        vg.addColorStop(0, 'rgba(10,4,24,0.12)');
        vg.addColorStop(1, 'rgba(10,4,24,0.55)');
        g.fillStyle = vg;
        g.fillRect(0, 0, cw, ch);
    }

    // ---------- players ----------
    const players = [];
    function addPlayer(team, u, v, keeper = false) {
        players.push({ team, keeper, home: { u, v }, u, v, tu: u, tv: v, step: 0, moving: false, face: team ? -1 : 1, phase: rand(0, 6), kickUntil: 0, waiting: false });
    }
    [[0, 3, 34, true], [0, 30, 20], [0, 30, 48], [0, 46, 34],
     [1, 102, 34, true], [1, 75, 20], [1, 75, 48], [1, 59, 34]].forEach((p) => addPlayer(...p));

    const ball = { u: L / 2, v: Wd / 2, h: 0, holder: null, flight: null };
    let holdUntil = 0, resetAt = 0;
    let t = 0;

    function giveBall(p) {
        ball.holder = p;
        ball.flight = null;
        p.waiting = false;
        holdUntil = t + rand(1.2, 2.6);
        // dribble upfield a little
        const dir = p.team === 0 ? 1 : -1;
        p.tu = clamp(p.u + dir * rand(6, 14), 8, L - 8);
        p.tv = clamp(p.v + rand(-8, 8), 6, Wd - 6);
    }

    function kick(to, speed, lob, onArrive) {
        const from = { u: ball.u, v: ball.v };
        const d = Math.hypot(to.u - from.u, to.v - from.v);
        if (ball.holder) ball.holder.kickUntil = t + 0.22;
        ball.holder = null;
        ball.flight = { from, to, t0: t, dur: Math.max(0.35, d / speed), peak: lob ? Math.min(d * 0.18, 4.5) : Math.min(d * 0.05, 1), onArrive };
    }

    function decide(p) {
        const goalU = p.team === 0 ? L : 0;
        const toGoal = Math.abs(goalU - p.u);
        if (!p.keeper && toGoal < 32 && Math.random() < 0.5) {
            const keeper = players.find((k) => k.keeper && k.team !== p.team);
            const aim = { u: goalU, v: Wd / 2 + rand(-4.5, 4.5) };
            keeper.tv = clamp(aim.v + rand(-2.5, 2.5), 30, 38);
            return kick(aim, SHOT_SPEED, false, () => {
                const scored = Math.abs(aim.v - keeper.v) > 1.6 && Math.random() < 0.6;
                if (scored) {
                    ball.u = goalU + (p.team === 0 ? 1.2 : -1.2);
                    resetAt = t + 1.4; // short pause in the net, then restart
                    ball.restartTeam = 1 - p.team;
                } else {
                    giveBall(keeper);
                    holdUntil = t + 1;
                }
            });
        }
        // pass: mostly to a teammate, sometimes intercepted by the other side
        const pool = players.filter((q) => q !== p && !q.keeper && (Math.random() < 0.82 ? q.team === p.team : q.team !== p.team));
        const mates = pool.length ? pool : players.filter((q) => q !== p && !q.keeper);
        const r = mates[Math.floor(Math.random() * mates.length)];
        r.waiting = true;
        r.tu = r.u; r.tv = r.v;
        kick({ u: r.u, v: r.v }, PASS_SPEED, dist(p, r) > 14, () => giveBall(r));
    }

    function update(dt) {
        t += dt;
        // restart after a goal
        if (resetAt && t >= resetAt) {
            resetAt = 0;
            players.forEach((p) => { p.u = p.home.u; p.v = p.home.v; });
            const taker = players.find((p) => !p.keeper && p.team === ball.restartTeam && p.home.v === 34);
            taker.u = L / 2 + (taker.team === 0 ? -0.8 : 0.8); taker.v = Wd / 2;
            ball.u = L / 2; ball.v = Wd / 2;
            giveBall(taker);
        }

        // ball
        if (ball.flight) {
            const f = ball.flight;
            const k = Math.min(1, (t - f.t0) / f.dur);
            ball.u = f.from.u + (f.to.u - f.from.u) * k;
            ball.v = f.from.v + (f.to.v - f.from.v) * k;
            ball.h = 4 * f.peak * k * (1 - k);
            if (k >= 1) { ball.h = 0; const cb = f.onArrive; ball.flight = null; cb(); }
        } else if (ball.holder && !resetAt) {
            const p = ball.holder;
            ball.u = p.u + p.face * 0.7 * (view.portrait ? 0 : 1);
            ball.v = p.v + 0.6;
            ball.h = 0;
            if (t >= holdUntil) decide(p);
        }

        // players
        for (const p of players) {
            if (p.keeper) {
                p.tu = p.home.u;
                if (!ball.holder || ball.holder !== p) p.tv = clamp(ball.v, 30, 38);
            } else if (!p.waiting && ball.holder !== p && !resetAt) {
                // drift with play around a home position
                p.tu = clamp(p.home.u + (ball.u - L / 2) * 0.35 + Math.sin(t * 0.4 + p.phase) * 3, 4, L - 4);
                p.tv = clamp(p.home.v + (ball.v - Wd / 2) * 0.3 + Math.cos(t * 0.3 + p.phase) * 3, 3, Wd - 3);
            }
            const du = p.tu - p.u, dv = p.tv - p.v, d = Math.hypot(du, dv);
            p.moving = d > 0.4;
            if (p.moving) {
                const sp = Math.min(d, (ball.holder === p ? RUN : p.keeper ? 2.5 : d > 10 ? SPRINT : RUN) * dt);
                p.u += (du / d) * sp;
                p.v += (dv / d) * sp;
                p.step += sp;
                const sx = view.portrait ? dv : du; // facing follows screen-space direction
                if (Math.abs(sx) > 0.05) p.face = sx > 0 ? 1 : -1;
            }
        }
    }

    // ---------- drawing ----------
    function drawSprite(p) {
        const { x, y } = toScreen(p.u, p.v);
        const px = view.px;
        const team = TEAMS[p.team];
        const pal = { ...COMMON, J: p.keeper ? team.keeper : team.J, P: team.P, L: p.keeper ? team.keeper : team.L };
        const legs = t < p.kickUntil ? LEGS.run1 : !p.moving ? LEGS.stand : (Math.floor(p.step / 0.9) % 2 ? LEGS.run1 : LEGS.run2);
        const rows = BODY.concat(legs);
        const ox = Math.round(x - 4 * px), oy = Math.round(y - 12 * px);
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(ox + px, oy + 11.5 * px, 6 * px, px);
        for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < 8; c++) {
                const ch_ = rows[r][p.face < 0 ? 7 - c : c];
                if (ch_ === '.') continue;
                ctx.fillStyle = pal[ch_];
                ctx.fillRect(ox + c * px, oy + r * px, px, px);
            }
        }
    }

    function drawBall() {
        const { x, y } = toScreen(ball.u, ball.v);
        const px = view.px;
        const lift = ball.h * view.s * 0.9;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(Math.round(x - px), Math.round(y), px * 2, px);
        const bx = Math.round(x - px), by = Math.round(y - px * 2 - lift);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, by, px * 2, px * 2);
        ctx.fillStyle = '#222';
        ctx.fillRect(bx + px, by + px, px, px);
    }

    function render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(layer, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // draw back-to-front so nearer players overlap correctly
        const order = players.slice().sort((a, b) => toScreen(a.u, a.v).y - toScreen(b.u, b.v).y);
        order.forEach(drawSprite);
        drawBall();
    }

    // ---------- loop: ~30fps, only while on screen ----------
    let running = false, last = 0, acc = 0, raf = 0;
    const FRAME = 1 / 30;
    function frame(now) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        acc += dt;
        if (acc < FRAME) return;
        update(Math.min(acc, 0.1));
        acc = 0;
        render();
    }
    function start() {
        if (running || reducedMotion) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    layout();
    giveBall(players[3]);
    holdUntil = 1.5;
    render();

    new ResizeObserver(() => { layout(); render(); }).observe(section);
    let onScreen = false;
    new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        onScreen && !document.hidden ? start() : stop();
    }, { rootMargin: '100px' }).observe(section);
    document.addEventListener('visibilitychange', () => (onScreen && !document.hidden ? start() : stop()));

    return { get running() { return running; } };
}
