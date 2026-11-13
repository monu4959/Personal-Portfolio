// Preloader. Every heavy part of the page reports in through window.rkLoad.track(promise):
// the hero console, the Services tubes, the Projects scene and slider (they now start during
// loading instead of mid-scroll, which is what caused the scroll hitches). This script also
// preloads the large images and the pixel fonts. The bar shows real progress; the loader leaves
// when everything has settled, or after MAX_WAIT so a slow network never traps the visitor.
//
// This must be the first module script on the page, so window.rkLoad exists before the others run.

const root = document.documentElement;
const loader = document.getElementById('rk-loader');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_WAIT = 9000; // ms
const MIN_SHOW = reduced ? 0 : 900; // ms; long enough that the wordmark reads, not a delay

const tasks = [];
const pending = new Set();
let settled = 0;
let finish;
const done = new Promise((r) => (finish = r));

window.rkLoad = {
    /** Hold the loader until `p` settles (resolve or reject, both count as done). */
    track(p, label = 'task') {
        if (!p || typeof p.then !== 'function') return p;
        tasks.push(p);
        pending.add(label);
        p.then(() => {}, () => {}).finally(() => { settled++; pending.delete(label); });
        return p;
    },
    /** Labels of tasks still running (handy in the console if the loader seems slow). */
    pending: () => [...pending],
    /** Resolves once the loader has started leaving (use it to start intro animations). */
    done
};

// nothing to do if the loader isn't showing (no markup, or the <head> failsafe already hid it)
if (!loader || !root.classList.contains('rk-is-loading')) {
    finish();
} else {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    run();
}

function preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
    }).then(() => undefined);
}

function run() {
    const start = performance.now();
    const fill = loader;
    const pctEl = loader.querySelector('.rk-loader-pct');

    // images that are large or sit behind lazy loading
    const images = new Set(['images/retro-bg.png', 'images/13.jpg', 'images/sylva-poster.webp']);
    document.querySelectorAll('[data-image]').forEach((el) => images.add(el.dataset.image));
    images.forEach((src) => window.rkLoad.track(preloadImage(src), 'image ' + src));

    // pixel fonts used by the hero and the loader itself
    if (document.fonts && document.fonts.load) {
        window.rkLoad.track(Promise.all([
            document.fonts.load('24px "Press Start 2P"'),
            document.fonts.load('24px "VT323"')
        ]), 'fonts');
    }
    // the page's own resources (stylesheets, markup images)
    window.rkLoad.track(document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((r) => window.addEventListener('load', r, { once: true })), 'window load');

    // module scripts run in order before DOMContentLoaded, so every task is registered by then
    const registered = document.readyState === 'loading'
        ? new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }))
        : Promise.resolve();

    let allSettled = false;
    registered.then(() => Promise.allSettled(tasks.slice())).then(() => (allSettled = true));

    let shown = 0;
    let leaving = false;
    function frame(now) {
        const elapsed = now - start;
        const real = tasks.length ? settled / tasks.length : 0;
        // until everything is in, keep a little headroom so the bar never sits at 100% waiting
        const target = allSettled ? 1 : Math.min(real, 0.96);
        shown += (target - shown) * (allSettled ? 0.2 : 0.08);
        if (target - shown < 0.004) shown = target;

        const pct = Math.round(shown * 100);
        fill.style.setProperty('--rk-p', shown.toFixed(4));
        pctEl.textContent = pct + '%';
        loader.setAttribute('aria-valuenow', String(pct));

        const timedOut = elapsed > MAX_WAIT;
        if (!leaving && ((allSettled && shown === 1 && elapsed >= MIN_SHOW) || timedOut)) {
            leaving = true;
            if (timedOut) { fill.style.setProperty('--rk-p', '1'); pctEl.textContent = '100%'; }
            // a beat at 100% before the wipe
            setTimeout(leave, reduced ? 0 : 220);
            return;
        }
        if (!leaving) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function leave() {
    root.classList.remove('rk-is-loading');
    root.classList.add('rk-loader-exit', 'rk-loaded');
    finish();
    const cleanup = () => {
        root.classList.remove('rk-loader-exit');
        loader.remove();
    };
    if (reduced) setTimeout(cleanup, 320);
    else loader.addEventListener('animationend', (e) => { if (e.target === loader) cleanup(); });
    // safety net in case animationend never fires (e.g. the tab is in the background)
    setTimeout(() => loader.isConnected && cleanup(), 1600);
}
