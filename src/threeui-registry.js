// ThreeUI components available to `data-threeui` placeholders.
// Each entry is a lazy import, so unused components never reach the browser.
// Browse the catalog at https://threeui.com and add entries like the one below, using the
// component subpath: '@designcodeio/threeui/components/<Name>'.
//
// Note: a few components (landscape scenes, landing pages, sketchbook…) render full HTML documents
// and need their runtime files copied from node_modules/@designcodeio/threeui/lib-dist/assets/
// into public/ (see the ThreeUI README).

export const threeuiComponents = {
    CrtBackground: () => import('@designcodeio/threeui/components/CrtBackground').then((m) => m.CrtBackground),
    SylvaLivingWorldScene: () =>
        import('@designcodeio/threeui/components/SylvaLivingWorldScene').then((m) => m.SylvaLivingWorldScene)
};
