// Builds the "Sylva / living green" background scene from @designcodeio/threeui (MIT License,
// Copyright (c) 2026 Meng To). The scene's document is assembled the same way ThreeUI's
// SylvaLivingWorldScene component does it, but the iframe is created once and kept, instead of
// being deleted and rebuilt each time the section scrolls out of and back into view.
// The package only exports the React component, so its source files are imported by path.
import sceneHtml from '../node_modules/@designcodeio/threeui/lib-dist/shaders/sylva-living-world/sources/inner-green-3d.html.js';
import threeRuntime from '../node_modules/@designcodeio/threeui/lib-dist/shaders/sylva-living-world/sources/inner-green-assets/three.min.js';

const MAIN = '<main class="hero" id="hero"><canvas id="scene" role="img" aria-label="Sylva Living Green"></canvas><div class="stage" id="stage" aria-hidden="true"></div></main>';
const FIT = '<style data-threeui-sylva-scene>html,body{width:100%!important;height:100%!important;min-height:0!important;margin:0!important;overflow:hidden!important}body{position:relative!important;background:#4a4d44!important}.hero{height:100%!important;min-height:0!important}#scene{pointer-events:auto!important}</style>';
const THREE_TAG = '<script src="inner-green-assets/three.min.js"><\/script>';

function buildDocument(reducedMotion, patch) {
    const start = sceneHtml.indexOf('<main class="hero" id="hero">');
    const three = sceneHtml.indexOf(THREE_TAG);
    if (start < 0 || three < 0 || three <= start) throw new Error('Sylva scene source has an unexpected layout');
    let doc = `${sceneHtml.slice(0, start)}${MAIN}\n\n${sceneHtml.slice(three)}`
        .replace('</head>', `${FIT}</head>`)
        .replace(THREE_TAG, `<script data-threeui-three-runtime>${threeRuntime}<\/script>`);
    if (reducedMotion) {
        // draw a single still frame
        doc = doc.replace(
            '(function loop() { requestAnimationFrame(loop); tick(); })();',
            '(function loop() { if (!REDUCED) requestAnimationFrame(loop); tick(); })();'
        );
    }
    if (patch) doc = doc.replace('<head>', '<head>' + patch);
    return doc;
}

/**
 * Adds the scene to `host`. Resolves with the iframe once its document has loaded and drawn its
 * first frames (rejects if the source can't be assembled; the still image in CSS then stays).
 */
export function createSylvaScene(host, { patch } = {}) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = document.createElement('iframe');
    frame.className = 'rk-sylva-frame';
    frame.title = 'Sylva Living Green';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    const ready = new Promise((resolve) => {
        frame.addEventListener('load', () => setTimeout(() => resolve(frame), 600), { once: true });
    });
    frame.srcdoc = buildDocument(reduced, patch);
    host.appendChild(frame);
    return ready;
}
