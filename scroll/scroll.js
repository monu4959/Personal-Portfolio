// Smooth scrolling (Lenis) and scroll-driven section transitions:
//  - each section enters with a slanted top edge that straightens as it reaches the top, while its
//    content rises into place;
//  - the section being left darkens as it scrolls away;
//  - headings, cards and panels fade up into view (once) as they enter the viewport.
// Everything here is skipped for visitors who prefer reduced motion.
import Lenis from 'lenis';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loaded = window.rkLoad?.done ?? Promise.resolve();

// ---------- smooth scroll ----------
function initSmoothScroll() {
    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out expo
        smoothWheel: true
    });
    lenis.stop();
    loaded.then(() => {
        lenis.start();
        // deep link (e.g. /#projects): go there once the page is ready
        const target = location.hash && document.querySelector(location.hash);
        if (target) lenis.scrollTo(target, { immediate: true });
    });

    const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // in-page links (nav, "ENTER PORTFOLIO", "See the work") glide instead of jumping
    document.addEventListener('click', (e) => {
        const a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
        const id = a.getAttribute('href');
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
        history.replaceState(null, '', id);
        if (typeof window.closemenu === 'function' && window.innerWidth <= 600) window.closemenu();
    });

    window.rkLenis = lenis;
}

// ---------- section transitions ----------
const sections = [...document.querySelectorAll('#header, #about, #services, #projects, #contact')];
const shades = new Map();
const last = new WeakMap(); // previous values per section, to skip redundant writes
if (!reduced) {
    sections.forEach((s) => {
        s.classList.add('rk-sec');
        const shade = document.createElement('div');
        shade.className = 'rk-sec-shade';
        shade.setAttribute('aria-hidden', 'true');
        s.appendChild(shade);
        shades.set(s, shade);
    });
    window.addEventListener('scroll', updateSections, { passive: true });
    window.addEventListener('resize', updateSections);
    updateSections();
}

function updateSections() {
    const vh = window.innerHeight;
    // read everything first, then write, so the browser lays out once per frame
    const rects = sections.map((s) => s.getBoundingClientRect());
    sections.forEach((s, i) => {
        const r = rects[i];
        // 0 when the section's top is at the bottom of the screen, 1 once it is 85% of the way up
        const enter = i === 0 ? 1 : clamp((vh - r.top) / (vh * 0.85));
        // 0 while the section's bottom is below the screen, up to 1 as it scrolls off the top
        const leave = clamp(1 - r.bottom / vh);
        const prev = last.get(s);
        if (prev && prev.enter === enter && prev.leave === leave) return;
        last.set(s, { enter, leave });

        s.style.setProperty('--rk-enter', enter.toFixed(4));
        s.classList.toggle('is-entering', enter < 1 && enter > 0);
        shades.get(s).style.opacity = (leave * 0.7).toFixed(3);
    });
}

function clamp(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ---------- reveal on enter ----------
function initReveals() {
    const groups = [
        '.rk-about-head > *',
        '.rk-about-grid > *',
        '.rk-services-head, .tc-hint',
        '.tc-grid > .tc',
        '#projects .sub-title, #projects .pj-intro, #rk-project-slider',
        '.contact-left > *',
        '.contact-right'
    ];
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            entry.target.classList.add('is-in');
        });
    }, { rootMargin: '0px 0px -12% 0px' });

    groups.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('rk-reveal');
            el.style.setProperty('--i', String(Math.min(i, 5)));
            io.observe(el);
        });
    });
    // don't animate anything until the loader has gone, so the first reveals are seen
    root.classList.add('rk-reveal-hold');
    loaded.then(() => setTimeout(() => root.classList.remove('rk-reveal-hold'), 400));
}

if (!reduced) {
    root.classList.add('rk-motion');
    initReveals();
    initSmoothScroll();
}
