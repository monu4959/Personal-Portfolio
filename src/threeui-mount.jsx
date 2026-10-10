import { createRoot } from 'react-dom/client';
import { threeuiComponents } from './threeui-registry.js';

let styles;
const loadStyles = () => (styles ||= import('@designcodeio/threeui/style.css'));

export async function mountIsland(el) {
    const name = el.dataset.threeui;
    const load = threeuiComponents[name];
    if (!load) {
        console.warn(`ThreeUI: "${name}" is not registered in src/threeui-registry.js`);
        return;
    }
    let props = {};
    try {
        props = el.dataset.props ? JSON.parse(el.dataset.props) : {};
    } catch (e) {
        console.warn(`ThreeUI: invalid data-props JSON on "${name}"`, e);
    }
    const [Component] = await Promise.all([load(), loadStyles()]);
    createRoot(el).render(<Component {...props} />);
}
