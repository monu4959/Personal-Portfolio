// Hero bootstrap: picks WebGL or the CSS-3D fallback, wires keyboard / touch / button input.
import { createScreen } from './screen.js';

const hero = document.getElementById('header');
const stage = document.getElementById('rk-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const canTilt = !reducedMotion && finePointer;
const forceFallback = new URLSearchParams(location.search).has('fallback');

const screen = createScreen({
    reducedMotion,
    onStateChange: (s) => { hero.dataset.game = s; }
});

hero.classList.toggle('is-touch', !finePointer);

let device = null; // { press(name, dir), setActive(bool) }
let heroVisible = true;

// ---------- actions shared by every input method ----------
function act(name, dir) {
    const s = screen.state;
    if (name === 'dir') return screen.direction(dir);
    if (name === 'select') return screen.select();
    if (name === 'start') return screen.start();
    // tapping the screen or pressing A works like START, except mid-game
    if ((name === 'screen' || name === 'a') && s !== 'playing') return screen.start();
}

// ---------- background polish ----------
function addStars() {
    const layer = hero.querySelector('.rk-stars');
    if (!layer) return;
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 28; i++) {
        const s = document.createElement('span');
        s.style.left = (r() * 100).toFixed(2) + '%';
        s.style.top = (r() * 42).toFixed(2) + '%';
        s.style.animationDelay = (r() * 6).toFixed(2) + 's';
        s.style.animationDuration = (3 + r() * 4).toFixed(2) + 's';
        if (r() > 0.7) s.className = 'big';
        layer.appendChild(s);
    }
}
addStars();

if (canTilt) {
    // very small background parallax opposite to the cursor
    window.addEventListener('pointermove', (ev) => {
        if (ev.pointerType !== 'mouse') return;
        hero.style.setProperty('--px', ((ev.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        hero.style.setProperty('--py', ((ev.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    }, { passive: true });
}

// ---------- CSS-3D fallback console ----------
function createCssConsole() {
    const el = document.createElement('div');
    el.className = 'cc';
    el.innerHTML = `
      <div class="cc-tilt">
        <div class="cc-body">
          <div class="cc-pcb"></div>
          <div class="cc-part cc-bezel" style="--x:0;--y:1.2;--w:2.6;--h:2.15">
            <span class="cc-led"></span><span class="cc-power">POWER</span>
          </div>
          <div class="cc-part cc-well" style="--x:0.12;--y:1.2;--w:1.9;--h:1.71"></div>
          <div class="cc-part cc-brand" style="--x:-0.3;--y:-0.05;--w:2;--h:0.25">ROHAN <em>RK-01</em></div>
          <div class="cc-part cc-dpad" style="--x:-0.82;--y:-1.08;--w:0.88;--h:0.88">
            <button type="button" class="cc-d up" data-dir="up" aria-label="Up"></button>
            <button type="button" class="cc-d down" data-dir="down" aria-label="Down"></button>
            <button type="button" class="cc-d left" data-dir="left" aria-label="Left"></button>
            <button type="button" class="cc-d right" data-dir="right" aria-label="Right"></button>
            <span class="cc-d-center"></span>
          </div>
          <div class="cc-part cc-abpad" style="--x:0.815;--y:-1.115;--w:1.12;--h:0.56"></div>
          <button type="button" class="cc-part cc-btn" data-act="b" style="--x:0.55;--y:-1.25;--w:0.42;--h:0.42" aria-label="B"></button>
          <button type="button" class="cc-part cc-btn" data-act="a" style="--x:1.08;--y:-0.98;--w:0.42;--h:0.42" aria-label="A"></button>
          <span class="cc-part cc-label" style="--x:0.55;--y:-1.57;--w:0.3;--h:0.12">B</span>
          <span class="cc-part cc-label" style="--x:1.08;--y:-1.3;--w:0.3;--h:0.12">A</span>
          <button type="button" class="cc-part cc-pill" data-act="select" style="--x:-0.33;--y:-1.95;--w:0.32;--h:0.1" aria-label="Select"></button>
          <button type="button" class="cc-part cc-pill" data-act="start" style="--x:0.27;--y:-1.95;--w:0.32;--h:0.1" aria-label="Start"></button>
          <span class="cc-part cc-label tilted" style="--x:-0.33;--y:-2.15;--w:0.5;--h:0.1">SELECT</span>
          <span class="cc-part cc-label tilted" style="--x:0.27;--y:-2.15;--w:0.5;--h:0.1">START</span>
          <div class="cc-part cc-speaker" style="--x:0.94;--y:-2.0;--w:0.7;--h:0.6">
            <i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
      </div>`;
    el.querySelector('.cc-well').appendChild(screen.canvas);
    stage.appendChild(el);

    const tiltEl = el.querySelector('.cc-tilt');
    const pressTimers = new Map();
    function press(name, dir) {
        const target = name === 'dpad'
            ? el.querySelector(`.cc-d[data-dir="${dir}"]`)
            : el.querySelector(`[data-act="${name}"]`);
        if (!target) return;
        target.classList.add('is-pressed');
        clearTimeout(pressTimers.get(target));
        pressTimers.set(target, setTimeout(() => target.classList.remove('is-pressed'), 140));
    }

    el.addEventListener('pointerdown', (ev) => {
        const d = ev.target.closest('[data-dir]');
        const b = ev.target.closest('[data-act]');
        if (d) { act('dir', d.dataset.dir); press('dpad', d.dataset.dir); ev.preventDefault(); }
        else if (b) { act(b.dataset.act); press(b.dataset.act); ev.preventDefault(); }
        else if (ev.target === screen.canvas) act('screen');
    });
    // keyboard users tabbing onto the fallback buttons
    el.addEventListener('click', (ev) => {
        if (ev.detail !== 0) return; // real clicks were handled on pointerdown
        const d = ev.target.closest('[data-dir]');
        const b = ev.target.closest('[data-act]');
        if (d) act('dir', d.dataset.dir);
        else if (b) act(b.dataset.act);
    });

    if (canTilt) {
        window.addEventListener('pointermove', (ev) => {
            if (ev.pointerType !== 'mouse') return;
            const x = (ev.clientX / window.innerWidth) * 2 - 1;
            const y = (ev.clientY / window.innerHeight) * 2 - 1;
            tiltEl.style.setProperty('--ry', (x * 13).toFixed(2) + 'deg');
            tiltEl.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
        }, { passive: true });
    }
    return { press, setActive(v) { el.classList.toggle('is-paused', !v); } };
}

// ---------- boot ----------
function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
}

async function boot() {
    // start fetching Three.js right away, in parallel with the font
    const useGL = !forceFallback && hasWebGL();
    const glModule = useGL ? import('./console3d.js') : null;
    if (glModule) glModule.catch(() => {}); // handled below

    // the screen and printed labels are drawn with the pixel font, so wait for it (briefly)
    try {
        await Promise.race([
            document.fonts.load('24px "Press Start 2P"'),
            new Promise((r) => setTimeout(r, 2500))
        ]);
    } catch (e) { /* draw with the fallback font */ }

    if (glModule) {
        try {
            const { createConsole3D } = await glModule;
            device = createConsole3D({
                container: stage,
                screen,
                reducedMotion,
                canTilt,
                onAction: act
            });
            hero.classList.add('is-webgl');
        } catch (err) {
            console.warn('RK-01: WebGL console unavailable, using CSS fallback.', err);
            stage.querySelectorAll('canvas.rk-gl').forEach((c) => c.remove());
            device = null;
        }
    }
    if (!device) {
        device = createCssConsole();
        hero.classList.add('is-css');
    }
    if (!heroVisible) device.setActive(false);
    hero.classList.add('is-ready');
    setTimeout(() => screen.boot(), reducedMotion ? 0 : 450);
}
boot();

// ---------- keyboard ----------
const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
};
window.addEventListener('keydown', (ev) => {
    if (!device || !heroVisible || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const playing = screen.state === 'playing';

    if (ev.key === 'Enter') {
        // let Enter activate a focused link/button as usual (nav links, fallback buttons)
        if (t && t.closest && t.closest('a, button')) return;
        ev.preventDefault();
        device.press('start');
        act('start');
        return;
    }
    if (KEYS[ev.key] && playing) {
        ev.preventDefault();
        device.press('dpad', KEYS[ev.key]);
        act('dir', KEYS[ev.key]);
        return;
    }
    if (playing && (ev.key === ' ' || ev.key === 'Escape' || ev.key === 'p' || ev.key === 'P')) {
        ev.preventDefault();
        if (ev.key !== ' ') { device.press('start'); act('start'); }
    }
});

// ---------- swipe (touch) ----------
let swipe = null;
stage.addEventListener('touchstart', (ev) => {
    if (screen.state !== 'playing' || ev.touches.length !== 1) { swipe = null; return; }
    swipe = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
}, { passive: true });
stage.addEventListener('touchmove', (ev) => {
    if (!swipe || screen.state !== 'playing') return;
    ev.preventDefault(); // keep the page still while steering
    const t = ev.touches[0];
    const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    act('dir', d);
    device && device.press('dpad', d);
    swipe = { x: t.clientX, y: t.clientY }; // allow chained swipes without lifting
}, { passive: false });
stage.addEventListener('touchend', () => { swipe = null; }, { passive: true });

// ---------- pause when the hero leaves the viewport ----------
new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    if (!heroVisible) screen.pause();
    device && device.setActive(heroVisible);
    hero.classList.toggle('is-offscreen', !heroVisible);
}, { threshold: 0.35 }).observe(hero);
