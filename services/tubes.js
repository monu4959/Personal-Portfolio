// Interactive neon tubes behind the Services section (threejs-components TubesCursor).
// The effect bundles its own Three.js (~775 KB), so it is only fetched when the section nears the viewport.

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
    const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        init();
    }, { rootMargin: '400px 0px' });
    io.observe(section);
}
