// Preloader. It waits for the first screen (the hero console, which reports in through
// window.rkLoad.track(promise), the hero background and the pixel fonts) plus the two 3D scenes
// whose first start stalls the whole page wherever it happens: the Projects scene (~3 s on a
// first visit, see projects/projects.js) and, on desktop, the Services tubes (services/tubes.js).
// Behind the loader is the least visible place for that. To keep it short:
//  - nothing heavy starts until the loading screen is on screen (rkLoad.painted);
//  - the hero console compiles its shaders in parallel instead of blocking the page;
//  - the rest (project slider, images further down, the tubes on phones) starts on rkLoad.idle,
//    shortly after the page is showing, or as the visitor scrolls towards it.
// The bar shows real progress; the loader leaves when those have settled, or after MAX_WAIT so a
// slow network never traps the visitor.
//
// This must be the first module script on the page, so window.rkLoad exists before the others run.

const root = document.documentElement;
const loader = document.getElementById('rk-loader');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_WAIT = 6500; // ms
const MIN_SHOW = reduced ? 0 : 900; // ms; long enough that the wordmark reads, not a delay

const tasks = [];
const pending = new Set();
let settled = 0;
let finish;
const done = new Promise((r) => (finish = r));
// once the loading screen is actually on screen (first contentful paint): heavy setup (WebGL)
// waits for this, so it can't hold up the first frame. Starting a 3D scene's shader compile blocks
// the browser's graphics process, which would otherwise delay showing even an already-drawn frame.
const painted = new Promise((r) => {
    const fallback = () => requestAnimationFrame(() => setTimeout(r, 0));
    setTimeout(r, 2500); // never wait long
    try {
        if (!PerformanceObserver.supportedEntryTypes.includes('paint')) throw 0;
        new PerformanceObserver((list, obs) => {
            if (list.getEntries().some((e) => e.name === 'first-contentful-paint')) { obs.disconnect(); r(); }
        }).observe({ type: 'paint', buffered: true });
    } catch (e) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fallback, { once: true });
        else fallback();
    }
});
// shortly after the loader has gone and the hero's entrance animation has played: the moment for
// background work (building the scenes further down the page)
const idle = done.then(() => new Promise((r) => setTimeout(() => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => r(), { timeout: 1000 });
    else r();
}, reduced ? 0 : 1400)));

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
    /** Resolves once the first frame (the loading screen) has been painted. */
    painted,
    /** Resolves once the loader has started leaving (use it to start intro animations). */
    done,
    /** Resolves a little after that, once the page is quiet (use it to start background work). */
    idle
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

    // the hero's background (everything else on the page loads as it's needed)
    window.rkLoad.track(preloadImage('images/retro-bg.png'), 'hero background');

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

// Once the page is showing, fetch and decode the images further down (lazy-loaded) in the
// background, so they don't load and decode mid-scroll.
idle.then(() => {
    const srcs = new Set();
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => srcs.add(img.currentSrc || img.src));
    document.querySelectorAll('[data-image]').forEach((el) => srcs.add(new URL(el.dataset.image, document.baseURI).href));
    srcs.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        img.decode().catch(() => {});
    });
});

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
