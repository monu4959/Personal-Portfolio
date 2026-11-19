// Interactive neon tubes behind the Services section (threejs-components TubesCursor).
// The effect bundles its own Three.js (~775 KB). It warms up out of sight before the visitor gets
// to Services (see the bottom of this file), so the download and shader setup don't stall
// scrolling; it pauses itself while off-screen.

const section = document.getElementById('services');
const canvas = document.getElementById('tubes-canvas');
const shuffle = document.getElementById('tubes-shuffle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TUBE_COLORS = ['#f967fb', '#53bc28', '#6958d5'];
const LIGHT_COLORS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

const randomColors = (count) =>
    Array.from({ length: count }, () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));

// A cheap check only (a test WebGL context costs ~150 ms on the main thread). If a context can't
// be created after all, init() fails and the static gradient stays.
function hasWebGL() {
    return !!window.WebGLRenderingContext;
}

async function init() {
    try {
        const { default: TubesCursor } = await import('threejs-components/build/cursors/tubes1.min.js');
        const app = TubesCursor(canvas, {
            tubes: {
                colors: TUBE_COLORS,
                lights: { intensity: 200, colors: LIGHT_COLORS }
            }
        });
        // the library renders at a fixed 2x; cap it so a full-width section stays smooth
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        app.three.minPixelRatio = ratio;
        app.three.maxPixelRatio = ratio;
        app.three.resize();

        const randomize = () => {
            app.tubes.setColors(randomColors(3));
            app.tubes.setLightsColors(randomColors(4));
        };
        canvas.addEventListener('click', randomize);
        shuffle.addEventListener('click', randomize);
        shuffle.hidden = false;
        section.classList.add('has-tubes');
    } catch (err) {
        // keep the static gradient background
        console.warn('Tubes effect unavailable:', err);
    }
}

if (!reducedMotion && hasWebGL()) {
    // The effect only draws while its canvas is on screen, and on a first visit its first second
    // or so of drawing is heavy GPU work (shader compiles) that stalls the page. While it starts
    // up, the canvas is pinned to the viewport (.rk-warm in services/tubes.css) so that work
    // happens right away, out of sight, instead of when Services scrolls into view.
    //  - Desktop: behind the preloader, drawing in full under it until the loader leaves. This is
    //    the only way found to hide all of it (an invisible warm-up after the page appears still
    //    left a ~0.4 s hitch). It adds ~0.5 s to the loader.
    //  - Touch screens, or no preloader: after the page appears (rkLoad.idle), or as the visitor
    //    scrolls towards Services, briefly and invisibly. This keeps the loader short on phones.
    const wrap = canvas.parentElement;
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const behindLoader = desktop && window.rkLoad && document.documentElement.classList.contains('rk-is-loading');
    const idle = window.rkLoad ? window.rkLoad.idle : Promise.resolve();
    const loaded = window.rkLoad ? window.rkLoad.done : Promise.resolve();
    const start = behindLoader ? window.rkLoad.painted : new Promise((resolve) => {
        idle.then(resolve);
        loaded.then(() => {
            const io = new IntersectionObserver(([e]) => {
                if (e.isIntersecting) { io.disconnect(); resolve(); }
            }, { rootMargin: '100% 0px' });
            io.observe(section);
            idle.then(() => io.disconnect());
        });
    });
    const nextFrames = (count) => new Promise((r) => {
        let n = 0;
        const tick = () => (++n < count ? requestAnimationFrame(tick) : r());
        requestAnimationFrame(tick);
    });
    const started = start.then(() => {
        const r = section.getBoundingClientRect();
        const warm = !(r.top < innerHeight && r.bottom > 0); // already on screen: warm up in place
        if (warm) {
            // same size as in the section, so moving back doesn't resize (and rebuild) the effect
            wrap.style.width = section.clientWidth + 'px';
            wrap.style.height = section.clientHeight + 'px';
            wrap.classList.add('rk-warm');
            if (behindLoader) wrap.classList.add('rk-warm-full');
        }
        const unwarm = () => {
            wrap.classList.remove('rk-warm', 'rk-warm-full');
            wrap.style.width = wrap.style.height = '';
        };
        const ready = init().then(() => nextFrames(6)); // a few frames for the GPU work to start
        if (behindLoader) loaded.then(unwarm); // keep drawing under the loader until it leaves
        else ready.finally(unwarm);
        return ready;
    });
    if (behindLoader) window.rkLoad.track(started, 'services tubes');
}
