// Mounts ThreeUI (React) components into plain-HTML placeholders:
//
//   <div data-threeui="CrtBackground" data-props='{"variant": "..."}' style="height: 400px"></div>
//
// React and the component code are only downloaded when such an element exists and nears the viewport.
// To use another ThreeUI component, add it to `threeuiComponents` in ./threeui-registry.js.

const islands = document.querySelectorAll('[data-threeui]');

if (islands.length) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
            if (!entry.isIntersecting) return;
            io.unobserve(entry.target);
            const { mountIsland } = await import('./threeui-mount.jsx');
            mountIsland(entry.target);
        });
    }, { rootMargin: '300px 0px' });
    islands.forEach((el) => io.observe(el));
}
