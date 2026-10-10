// About section: pixel hobby icons + the animated pitch background.
import { createPitch } from './pitch.js';

// 12x12 pixel icons; each letter maps to a colour
const ICONS = {
    football: {
        pal: { w: '#f4f4f4', k: '#1b1b1b' },
        rows: ['....wwww....', '..wwwkkwww..', '.wwwkkkkwww.', '.wkwwkkwwkw.', 'wkkwwwwwwkkw', 'wkkwwwwwwkkw',
            'wwwwkwwkwwww', 'wwwkkkkkkwww', '.wwwkkkkwww.', '.wkwwwwwwkw.', '..wkkwwkkw..', '....wwww....']
    },
    painting: {
        pal: { b: '#c98a4b', d: '#7a4a24', r: '#ff4f7b', y: '#ffd23f', c: '#4fe3ff', g: '#7dff6a' },
        rows: ['...bbbbbb...', '.bbbbbbbbbb.', 'bbrrbbyybbbb', 'bbrrbbyybbbb', 'bbbbbbbbbbcc', 'bbb..bbbbbcc',
            'bbb..bbbbbbb', 'bbbbbbbbggbb', '.bbbbbbbggb.', '..bbbbbbbb..', '...dd.......', '............']
    },
    cooking: {
        pal: { s: '#c7ccd6', k: '#5b6170', o: '#ff9a3c', w: '#ffffff' },
        rows: ['...w..w.....', '....w..w....', '...w..w.....', '............', '.ssssssss...', 'soooooooskkk',
            'soooooooos..', 'soooooooos..', 'ssssssssss..', '.ssssssss...', '..k....k....', '............']
    },
    astronomy: {
        pal: { p: '#b48bff', d: '#7a4dff', r: '#ffd23f', w: '#ffffff' },
        rows: ['w..........w', '.....pppp...', '...pppppppp.', 'rr.ppdppppp.', '.rrpppppdprr', '..pprrrrrrr.',
            '..ppppprrr..', '...ppdpppp..', '....pppp....', '..........w.', '.w..........', '............']
    },
    games: {
        pal: { g: '#3a3152', k: '#17131f', r: '#ff4f7b', c: '#4fe3ff' },
        rows: ['............', '............', '.gggggggggg.', 'gggggggggggg', 'ggkggggggrgg', 'gkkkggggrgcg',
            'ggkggggggcgg', 'gggggggggggg', 'ggg......ggg', 'gg........gg', '............', '............']
    }
};

function iconSVG(name) {
    const { pal, rows } = ICONS[name];
    let rects = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (pal[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>`;
    }));
    return `<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

document.querySelectorAll('[data-pixel-icon]').forEach((el) => {
    el.insertAdjacentHTML('afterbegin', iconSVG(el.dataset.pixelIcon));
});

const section = document.getElementById('about');
const anchor = section.querySelector('.player-card');
createPitch({
    section,
    anchor,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
});
