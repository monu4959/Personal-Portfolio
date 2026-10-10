// Mounts the project slider (React + framer-motion) once the Projects section nears the viewport.
const el = document.getElementById('rk-project-slider');

if (el) {
    const io = new IntersectionObserver(async ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const { mountProjectSlider } = await import('./slider.jsx');
        mountProjectSlider(el);
    }, { rootMargin: '600px 0px' });
    io.observe(el);
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

// The Sylva scene runs inside an iframe that ThreeUI builds itself, so this script is prepended to
// each iframe's document as it is created. It does two things:
//  1. Caps the scene at 30 fps. The scene runs in the same browser process as the page, so every
//     frame it draws holds up the whole page (and the slider): uncapped, the page sat at ~30 fps;
//     capped, it stays smooth. The scene drifts slowly, so 30 fps looks the same.
//  2. If WebGL is unavailable or the context is lost (e.g. Chrome's GPU process crashing under
//     memory pressure), makes the scene's document transparent so the still image behind it
//     (projects/sylva.css) shows instead of a blank grey panel.
const SCENE_FPS = 30;
function scenePatch(fps) {
    var raf = window.requestAnimationFrame.bind(window), last = -1e9, step = 1000 / fps - 2;
    window.requestAnimationFrame = function (cb) {
        return raf(function tick(now) {
            // every callback queued for an allowed frame runs; the rest wait for the next one
            if (now - last >= step || now === last) { last = now; cb(now); } else { raf(tick); }
        });
    };
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
    const patch = (frame) => {
        const doc = frame.getAttribute('srcdoc');
        if (!doc || doc.includes('data-rk-fps')) return;
        frame.setAttribute('srcdoc', doc.replace('<head>', '<head>' + SCENE_PATCH));
    };
    new MutationObserver((records) => {
        for (const r of records) r.addedNodes.forEach((n) => {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'IFRAME') patch(n);
            else n.querySelectorAll?.('iframe').forEach(patch);
        });
    }).observe(sylva, { childList: true, subtree: true });
}
