// Mounts ThreeUI (React) components into plain-HTML placeholders:
//
//   <div data-threeui="CrtBackground" data-props='{"variant": "..."}' style="height: 400px"></div>
//
// They mount during the preloader (loader/loader.js), so React, the component code and the scene's
// shaders are ready before the visitor scrolls to them instead of loading mid-scroll.

const islands = document.querySelectorAll('[data-threeui]');

if (islands.length) {
    const mounting = import('./threeui-mount.jsx').then(({ mountIsland }) =>
        Promise.all([...islands].map((el) => mountIsland(el)))
    );
    window.rkLoad && window.rkLoad.track(mounting, 'threeui islands');
}
