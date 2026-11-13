// Interactive neon tubes behind the Services section (threejs-components TubesCursor).
// The effect bundles its own Three.js (~775 KB). It starts during the preloader (loader/loader.js) so
// the download and shader setup don't stall scrolling later; it pauses itself while off-screen.

const section = document.getElementById('services');
const canvas = document.getElementById('tubes-canvas');
const shuffle = document.getElementById('tubes-shuffle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TUBE_COLORS = ['#f967fb', '#53bc28', '#6958d5'];
const LIGHT_COLORS = ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'];

const randomColors = (count) =>
    Array.from({ length: count }, () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));

function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
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
    // The effect only draws while its canvas is on screen, so it would compile its shaders (a
    // 1-3 s freeze) the first time Services scrolls into view. While the preloader is up, pin the
    // canvas to the viewport behind it so those first frames happen now, then put it back.
    const wrap = canvas.parentElement;
    const warm = window.rkLoad && document.documentElement.classList.contains('rk-is-loading');
    if (warm) wrap.classList.add('rk-warm');
    const started = init().then(() => new Promise((r) => {
        // a few frames on screen are enough for the GPU work to finish
        let n = 0;
        const tick = () => (++n < 6 ? requestAnimationFrame(tick) : r());
        requestAnimationFrame(tick);
    }));
    window.rkLoad && window.rkLoad.track(started, 'services tubes');
    if (warm) window.rkLoad.done.then(() => wrap.classList.remove('rk-warm'));
}
