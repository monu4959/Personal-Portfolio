// Space background for the Contact section: layered twinkling stars, slow drift, occasional shooting star.
const section = document.getElementById('contact');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (section) {
    const canvas = document.createElement('canvas');
    canvas.className = 'rk-space';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, dpr = 1, stars = [], shooting = null, nextShot = 3, t = 0;
    const TINTS = ['#ffffff', '#cfe0ff', '#ffd9f7', '#bff6ff'];

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = section.clientWidth;
        h = section.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round((w * h) / 2600);
        stars = Array.from({ length: count }, () => {
            const depth = Math.random(); // 0 far .. 1 near
            return {
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.4 + depth * 1.3,
                speed: 2 + depth * 10, // px/s drift
                phase: Math.random() * Math.PI * 2,
                rate: 0.6 + Math.random() * 1.8,
                base: 0.35 + depth * 0.55,
                tint: TINTS[(Math.random() * TINTS.length) | 0]
            };
        });
    }

    function draw(dt) {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            if (!reduced) {
                s.x -= s.speed * dt;
                if (s.x < -2) { s.x = w + 2; s.y = Math.random() * h; }
            }
            const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.rate + s.phase);
            ctx.globalAlpha = s.base * tw;
            ctx.fillStyle = s.tint;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
            if (s.r > 1.4) {
                // soft glow on the nearest stars
                ctx.globalAlpha = s.base * tw * 0.18;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        if (reduced) return;
        nextShot -= dt;
        if (!shooting && nextShot <= 0) {
            shooting = { x: Math.random() * w * 0.7 + w * 0.3, y: Math.random() * h * 0.4, vx: -520, vy: 220, life: 0 };
            nextShot = 6 + Math.random() * 8;
        }
        if (shooting) {
            const s = shooting;
            s.life += dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            const fade = Math.max(0, 1 - s.life / 0.9);
            const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.18, s.y - s.vy * 0.18);
            g.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
            g.addColorStop(1, 'rgba(160,190,255,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 0.18, s.y - s.vy * 0.18);
            ctx.stroke();
            if (fade <= 0) shooting = null;
        }
    }

    let running = false, last = 0, raf = 0;
    function loop(now) {
        if (!running) return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        t += dt;
        draw(dt);
    }
    function start() {
        if (running || reduced) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    build();
    draw(0);
    new ResizeObserver(() => { build(); draw(0); }).observe(section);
    let onScreen = false;
    new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        onScreen && !document.hidden ? start() : stop();
    }).observe(section);
    document.addEventListener('visibilitychange', () => (onScreen && !document.hidden ? start() : stop()));
}
