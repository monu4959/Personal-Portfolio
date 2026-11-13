// Mounts the project slider (React + framer-motion). It mounts during the preloader
// (loader/loader.js) so its code is ready before the visitor scrolls down.
const el = document.getElementById('rk-project-slider');

if (el) {
    const mounted = import('./slider.jsx').then(({ mountProjectSlider }) => mountProjectSlider(el));
    window.rkLoad && window.rkLoad.track(mounted, 'project slider');
}

// Render the Sylva background at reduced resolution (see projects/sylva.css). Keep the scene's
// own frame at least 960px wide on desktop so it keeps its wide layout and full particle count.
const section = document.getElementById('projects');
const sylva = section?.querySelector('.rk-sylva');
if (sylva) {
    const MIN_FRAME = 960;
    const fit = () => {
        const w = section.clientWidth;
        const res = w <= 900 ? 0.5 : Math.min(1, Math.max(0.7, MIN_FRAME / w));
        sylva.style.setProperty('--sylva-res', res.toFixed(3));
    };
    new ResizeObserver(fit).observe(section);
    fit();
}

// The Sylva scene runs in a sandboxed iframe (built in projects/sylva-scene.js). This script is
// added to the top of that iframe's document. It does three things:
//  1. Caps the scene at 30 fps. The scene runs in the same browser process as the page, so every
//     frame it draws holds up the whole page (and the slider): uncapped, the page sat at ~30 fps;
//     capped, it stays smooth. The scene drifts slowly, so 30 fps looks the same.
//  2. If WebGL is unavailable or the context is lost (e.g. Chrome's GPU process crashing under
//     memory pressure), makes the scene's document transparent so the still image behind it
//     (projects/sylva.css) shows instead of a blank grey panel.
//  3. Pauses the scene while the Projects section is off-screen. The scene is built once, during the
//     preloader, and kept; without this it would keep drawing while the visitor is elsewhere.
//     The page sends {rkPause: true|false} (the iframe is sandboxed, so postMessage is the only way in).
const SCENE_FPS = 30;
function scenePatch(fps) {
    var raf = window.requestAnimationFrame.bind(window), last = -1e9, step = 1000 / fps - 2;
    var paused = false, held = [];
    window.requestAnimationFrame = function (cb) {
        return raf(function tick(now) {
            if (paused) { held.push(tick); return; }
            // every callback queued for an allowed frame runs; the rest wait for the next one
            if (now - last >= step || now === last) { last = now; cb(now); } else { raf(tick); }
        });
    };
    window.addEventListener('message', function (e) {
        if (e.source !== window.parent || !e.data || typeof e.data.rkPause !== 'boolean') return;
        paused = e.data.rkPause;
        if (!paused) { var h = held; held = []; h.forEach(function (t) { raf(t); }); }
    });
    var failed = false;
    // clears the page, the sky layer (<main id="hero">) and the canvas so the still image shows through
    function fail() {
        if (failed) return;
        failed = true;
        var s = document.createElement('style');
        s.textContent = 'html,html body,#hero{background:transparent!important}canvas{visibility:hidden!important}';
        (document.head || document.documentElement).appendChild(s);
    }
    try {
        var probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!probe) fail();
        else if (probe.getExtension('WEBGL_lose_context')) probe.getExtension('WEBGL_lose_context').loseContext(); // free the probe
    } catch (e) { fail(); }
    document.addEventListener('webglcontextlost', fail, true); // capture: the event doesn't bubble
}
const SCENE_PATCH = '<script data-rk-fps>(' + scenePatch.toString() + ')(' + SCENE_FPS + ');<\/script>';
if (sylva) {
    // build the scene once, during the preloader, and keep it (ThreeUI's own component deletes and
    // rebuilds it every time the section scrolls in and out of view, which stalled scrolling).
    // Browsers don't run off-screen iframes, so while the preloader is up the scene is pinned to the
    // viewport behind it; it compiles and draws its first frames there instead of mid-scroll.
    const warm = window.rkLoad && document.documentElement.classList.contains('rk-is-loading');
    if (warm) {
        sylva.classList.add('rk-warm');
        window.rkLoad.done.then(() => sylva.classList.remove('rk-warm'));
    }
    const ready = import('./sylva-scene.js').then(({ createSylvaScene }) =>
        createSylvaScene(sylva, { patch: SCENE_PATCH })
    );
    window.rkLoad && window.rkLoad.track(ready, 'sylva scene');

    // pause it while the section is well off-screen
    let visible = false;
    let frame = null;
    const tell = () => frame && frame.contentWindow && frame.contentWindow.postMessage({ rkPause: !visible }, '*');
    ready.then((f) => { frame = f; tell(); }, () => {});
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        tell();
    }, { rootMargin: '300px 0px' }).observe(section);
}
