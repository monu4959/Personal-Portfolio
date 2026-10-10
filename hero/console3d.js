// RK-01: an original clear-shell handheld, modelled procedurally in Three.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BW = 3.1;   // body width
const BH = 5.2;   // body height
const BD = 0.62;  // body depth
const BR = 0.28;  // corner radius
const F = BD / 2; // front face z

const MAX_TILT_Y = THREE.MathUtils.degToRad(13);
const MAX_TILT_X = THREE.MathUtils.degToRad(10);

function roundedRectShape(w, h, r, cx = 0, cy = 0) {
    const s = new THREE.Shape();
    const x = cx - w / 2, y = cy - h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

// deterministic random so the circuit board looks the same every load
function rng(seed) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function pcbTexture() {
    const w = 512, h = Math.round(512 * BH / BW);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const r = rng(42);
    g.fillStyle = '#c4cbd7';
    g.fillRect(0, 0, w, h);
    // traces
    g.strokeStyle = '#97a2b5';
    g.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
        let x = Math.round(r() * w / 8) * 8, y = Math.round(r() * h / 8) * 8;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
            if (r() > 0.5) x += (r() - 0.5) * 160; else y += (r() - 0.5) * 160;
            x = Math.round(x / 8) * 8; y = Math.round(y / 8) * 8;
            g.lineTo(x, y);
        }
        g.stroke();
        g.fillStyle = '#b4bccb';
        g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
    }
    // chip footprints
    g.fillStyle = '#9aa4b4';
    for (let i = 0; i < 14; i++) {
        const cw = 20 + r() * 50, ch = 12 + r() * 40;
        g.fillRect(r() * (w - cw), r() * (h - ch), cw, ch);
    }
    // mounting holes
    g.fillStyle = '#e9edf3';
    [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]].forEach(([x, y]) => {
        g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = '#98a2b2';
    g.font = '14px monospace';
    g.fillText('RK-01  REV.A  2026', 40, h - 60);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

// printed labels & wordmark, drawn on a transparent layer over the shell
function decalTexture() {
    const w = 1024, h = Math.round(1024 * BH / BW);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const k = w / BW;
    const px = (x) => (x + BW / 2) * k;
    const py = (y) => (BH / 2 - y) * k;
    const pixel = '"Press Start 2P", monospace';

    g.textBaseline = 'alphabetic';
    // wordmark where a brand name usually sits
    g.fillStyle = '#3a3152';
    g.font = `${Math.round(0.17 * k)}px ${pixel}`;
    g.fillText('ROHAN', px(-1.28), py(-0.12));
    const markEnd = px(-1.28) + g.measureText('ROHAN').width;
    g.fillStyle = '#d6337f';
    g.font = `italic ${Math.round(0.12 * k)}px ${pixel}`;
    g.fillText('RK-01', markEnd + 0.1 * k, py(-0.12));

    // power label, sits on the bezel under the LED
    g.fillStyle = '#6b6f7c';
    g.font = `${Math.round(0.055 * k)}px ${pixel}`;
    g.textAlign = 'center';
    g.fillText('POWER', px(-1.08), py(1.3));

    // button labels
    g.fillStyle = '#4a4560';
    g.font = `${Math.round(0.09 * k)}px ${pixel}`;
    g.fillText('B', px(0.55), py(-1.6));
    g.fillText('A', px(1.08), py(-1.33));

    // START / SELECT labels (tilted like the buttons)
    g.font = `${Math.round(0.065 * k)}px ${pixel}`;
    [['SELECT', -0.33], ['START', 0.27]].forEach(([label, x]) => {
        g.save();
        g.translate(px(x), py(-2.17));
        g.rotate(-0.45);
        g.fillText(label, 0, 0);
        g.restore();
    });

    // fine top trim lines
    g.fillStyle = 'rgba(80,70,110,0.25)';
    g.fillRect(px(-1.25), py(2.42), 2.5 * k, 3);
    g.fillRect(px(-1.25), py(2.38), 2.5 * k, 3);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

export function createConsole3D({ container, screen, reducedMotion, canTilt, onAction }) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'rk-gl';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

    // ---------- lights: soft key + synthwave rims ----------
    scene.add(new THREE.HemisphereLight(0xfff0ff, 0x2a0a40, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 6);
    scene.add(key);
    const rimPink = new THREE.DirectionalLight(0xff3fb4, 3.2);
    rimPink.position.set(-5, 2, -2);
    scene.add(rimPink);
    const rimPurple = new THREE.DirectionalLight(0x7a4dff, 3.2);
    rimPurple.position.set(5, -1, -2);
    scene.add(rimPurple);
    const under = new THREE.DirectionalLight(0xff9a3c, 0.9);
    under.position.set(0, -6, 2);
    scene.add(under);

    const root = new THREE.Group();   // float
    const tilt = new THREE.Group();   // pointer tilt
    root.add(tilt);
    scene.add(root);

    // ---------- body ----------
    const shellGeo = new RoundedBoxGeometry(BW, BH, BD, 6, BR);
    const shellFront = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
        color: 0xe3e8f2, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15,
        transparent: true, opacity: 0.4, depthWrite: false, envMapIntensity: 0.9
    }));
    shellFront.renderOrder = 10;
    const shellBack = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
        color: 0xd8deea, roughness: 0.5, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.BackSide
    }));
    shellBack.renderOrder = 9;
    tilt.add(shellBack, shellFront);

    // internal board, seen faintly through the frosted shell
    const pcb = new THREE.Mesh(
        new THREE.ShapeGeometry(roundedRectShape(BW - 0.34, BH - 0.34, 0.16)),
        new THREE.MeshStandardMaterial({ map: pcbTexture(), roughness: 0.8 })
    );
    // ShapeGeometry UVs are in shape units, remap to 0..1
    {
        const uv = pcb.geometry.attributes.uv, pos = pcb.geometry.attributes.position;
        for (let i = 0; i < uv.count; i++) {
            uv.setXY(i, (pos.getX(i) + (BW - 0.34) / 2) / (BW - 0.34), (pos.getY(i) + (BH - 0.34) / 2) / (BH - 0.34));
        }
    }
    pcb.position.z = 0.02;
    tilt.add(pcb);

    const chipMat = new THREE.MeshStandardMaterial({ color: 0x6a7082, roughness: 0.55 });
    [[0.15, -0.45, 0.36, 0.36], [-0.32, -0.42, 0.2, 0.2], [0.62, -0.42, 0.22, 0.14]].forEach(([x, y, w, h]) => {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), chipMat);
        chip.position.set(x, y, 0.05);
        tilt.add(chip);
    });
    const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 32), chipMat);
    magnet.rotation.x = Math.PI / 2;
    magnet.position.set(0.88, -2.0, 0.06);
    tilt.add(magnet);

    // ---------- screen assembly ----------
    const SX = 0.12, SY = 1.2;              // screen window centre
    const WIN_W = 1.9, WIN_H = 1.71;        // 480:432 aspect
    const bezelShape = roundedRectShape(2.6, 2.15, 0.14, 0, SY);
    bezelShape.holes.push(roundedRectShape(WIN_W, WIN_H, 0.04, SX, SY));
    const bezel = new THREE.Mesh(
        new THREE.ExtrudeGeometry(bezelShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 8 }),
        new THREE.MeshPhysicalMaterial({ color: 0xdfe3ea, roughness: 0.45, clearcoat: 0.4 })
    );
    bezel.position.z = F;
    tilt.add(bezel);

    const well = new THREE.Mesh(
        new THREE.ShapeGeometry(roundedRectShape(WIN_W, WIN_H, 0.04, SX, SY)),
        new THREE.MeshStandardMaterial({ color: 0x0e1012, roughness: 0.9 })
    );
    well.position.z = F + 0.004;
    tilt.add(well);

    const screenTex = new THREE.CanvasTexture(screen.canvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.minFilter = THREE.LinearFilter;
    screenTex.generateMipmaps = false;
    const lcd = new THREE.Mesh(
        new THREE.PlaneGeometry(WIN_W - 0.06, WIN_H - 0.06),
        new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
    );
    lcd.position.set(SX, SY, F + 0.008);
    lcd.userData.action = 'screen';
    tilt.add(lcd);

    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(WIN_W, WIN_H),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.05, clearcoat: 1, depthWrite: false, envMapIntensity: 1.4 })
    );
    glass.position.set(SX, SY, F + 0.04);
    glass.renderOrder = 12;
    tilt.add(glass);

    const led = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.03, 20),
        new THREE.MeshStandardMaterial({ color: 0xff2a4d, emissive: 0xff2a4d, emissiveIntensity: 2.2 })
    );
    led.rotation.x = Math.PI / 2;
    led.position.set(-1.08, 1.45, F + 0.05);
    tilt.add(led);

    // printed labels
    const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(BW, BH),
        new THREE.MeshBasicMaterial({ map: decalTexture(), transparent: true, depthWrite: false, toneMapped: false })
    );
    decal.position.z = F + 0.05;
    decal.renderOrder = 11;
    tilt.add(decal);

    // ---------- controls ----------
    const recessMat = new THREE.MeshStandardMaterial({ color: 0xaeb5c2, roughness: 0.6, transparent: true, opacity: 0.55 });
    const blackMat = new THREE.MeshPhysicalMaterial({ color: 0x17181c, roughness: 0.42, clearcoat: 0.35 });
    const redMat = new THREE.MeshPhysicalMaterial({ color: 0xc81e3c, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 });
    const pillMat = new THREE.MeshPhysicalMaterial({ color: 0x2c2e36, roughness: 0.5, clearcoat: 0.3 });

    const buttons = {}; // name -> { obj, baseZ, press, kind }
    function registerButton(name, obj, action, depth = 0.035) {
        obj.traverse((o) => { if (o.isMesh) o.userData.action = action; });
        buttons[name] = { obj, baseZ: obj.position.z, press: 0, depth, dir: null };
    }

    // D-pad
    const dpad = new THREE.Group();
    dpad.position.set(-0.82, -1.08, F + 0.065);
    const dpadBase = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 48), recessMat);
    dpadBase.rotation.x = Math.PI / 2;
    dpadBase.position.set(-0.82, -1.08, F + 0.006);
    tilt.add(dpadBase);
    const armH = new THREE.Mesh(new RoundedBoxGeometry(0.68, 0.23, 0.12, 3, 0.035), blackMat);
    const armV = new THREE.Mesh(new RoundedBoxGeometry(0.23, 0.68, 0.12, 3, 0.035), blackMat);
    const dimple = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 24), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.7 }));
    dimple.rotation.x = Math.PI / 2;
    dimple.position.z = 0.061;
    dpad.add(armH, armV, dimple);
    tilt.add(dpad);
    registerButton('dpad', dpad, 'dpad', 0);

    // A / B — domed buttons on a slanted pad
    const slant = Math.atan2(0.27, 0.53);
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(1.12, 0.56, 0.28)), recessMat);
    pad.position.set(0.815, -1.115, F + 0.006);
    pad.rotation.z = slant;
    tilt.add(pad);
    const domePts = [[0.21, 0], [0.205, 0.05], [0.185, 0.08], [0.14, 0.098], [0.08, 0.108], [0, 0.11]].map(([x, y]) => new THREE.Vector2(x, y));
    const domeGeo = new THREE.LatheGeometry(domePts, 40);
    domeGeo.rotateX(Math.PI / 2);
    [['b', 0.55, -1.25], ['a', 1.08, -0.98]].forEach(([name, x, y]) => {
        const m = new THREE.Mesh(domeGeo, redMat);
        m.position.set(x, y, F + 0.008);
        tilt.add(m);
        registerButton(name, m, name, 0.04);
    });

    // START / SELECT pills
    const pillGeo = new THREE.CapsuleGeometry(0.052, 0.2, 4, 16);
    pillGeo.scale(1, 1, 0.55);
    [['select', -0.33], ['start', 0.27]].forEach(([name, x]) => {
        const recess = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(0.4, 0.15, 0.075)), recessMat);
        recess.position.set(x, -1.95, F + 0.006);
        recess.rotation.z = 0.45;
        tilt.add(recess);
        const m = new THREE.Mesh(pillGeo, pillMat);
        m.rotation.z = Math.PI / 2 + 0.45;
        m.position.set(x, -1.95, F + 0.03);
        tilt.add(m);
        registerButton(name, m, name, 0.025);
    });

    // speaker grille
    const slotGeo = new RoundedBoxGeometry(0.05, 0.46, 0.02, 2, 0.02);
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x24262d, roughness: 0.8 });
    for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(slotGeo, slotMat);
        s.position.set(0.62 + i * 0.1, -2.02, F + 0.004);
        s.rotation.z = 0.45;
        tilt.add(s);
    }

    // ---------- sizing ----------
    function resize() {
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const dist = Math.max((BH / 2) * 1.1 / t, (BW / 2) * 1.18 / (t * camera.aspect));
        camera.position.set(0, 0, dist);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(container);
    resize();

    // ---------- interaction ----------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function hitTest(ev) {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        // the shell, glass and decal layers are see-through, so take the first interactive hit
        const hits = raycaster.intersectObjects(tilt.children, true);
        return hits.find((h) => h.object.userData.action) || null;
    }

    function pressVisual(name, dir) {
        const b = buttons[name];
        if (!b) return;
        b.press = 1;
        b.dir = dir || null;
    }

    function dpadDirection(point) {
        const local = dpad.worldToLocal(point.clone());
        if (Math.hypot(local.x, local.y) < 0.05) return null;
        return Math.abs(local.x) > Math.abs(local.y) ? (local.x > 0 ? 'right' : 'left') : (local.y > 0 ? 'up' : 'down');
    }

    renderer.domElement.addEventListener('pointerdown', (ev) => {
        const hit = hitTest(ev);
        if (!hit) return;
        const action = hit.object.userData.action;
        if (action === 'dpad') {
            const d = dpadDirection(hit.point);
            if (!d) return;
            pressVisual('dpad', d);
            onAction('dir', d);
        } else {
            if (buttons[action]) pressVisual(action);
            onAction(action);
        }
        ev.preventDefault();
    });

    let pointerFine = window.matchMedia('(pointer: fine)').matches;
    let hoverQueued = null;
    renderer.domElement.addEventListener('pointermove', (ev) => {
        if (!pointerFine) return;
        if (!hoverQueued) requestAnimationFrame(() => {
            const hit = hitTest(hoverQueued);
            renderer.domElement.style.cursor = hit ? 'pointer' : '';
            hoverQueued = null;
        });
        hoverQueued = ev;
    });

    // pointer tilt target, tracked over the whole window
    const target = { x: 0, y: 0 };
    if (canTilt) {
        window.addEventListener('pointermove', (ev) => {
            if (ev.pointerType !== 'mouse') return;
            target.x = (ev.clientX / window.innerWidth) * 2 - 1;
            target.y = (ev.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
        document.documentElement.addEventListener('mouseleave', () => { target.x = 0; target.y = 0; });
    }

    // ---------- loop ----------
    let active = true;
    let lastVersion = -1;
    const clock = new THREE.Clock();
    function tick() {
        requestAnimationFrame(tick);
        if (!active) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;

        if (!reducedMotion) {
            root.position.y = Math.sin(t * 1.1) * 0.08;
            root.rotation.z = Math.sin(t * 0.7) * 0.012;
            led.material.emissiveIntensity = 1.8 + Math.sin(t * 2.2) * 0.5;
        }
        if (canTilt && !reducedMotion) {
            const k = 1 - Math.pow(0.002, dt);
            tilt.rotation.y += (target.x * MAX_TILT_Y - tilt.rotation.y) * k;
            tilt.rotation.x += (target.y * MAX_TILT_X - tilt.rotation.x) * k;
        }

        for (const name in buttons) {
            const b = buttons[name];
            if (b.press <= 0) continue;
            b.press = Math.max(0, b.press - dt * 6);
            const p = Math.sin(Math.min(1, b.press) * Math.PI / 2);
            if (name === 'dpad') {
                const a = 0.16 * p;
                b.obj.rotation.set(b.dir === 'up' ? -a : b.dir === 'down' ? a : 0, b.dir === 'right' ? a : b.dir === 'left' ? -a : 0, 0);
                b.obj.position.z = b.baseZ - 0.015 * p;
            } else {
                b.obj.position.z = b.baseZ - b.depth * p;
            }
        }

        if (screen.version !== lastVersion) {
            lastVersion = screen.version;
            screenTex.needsUpdate = true;
        }
        renderer.render(scene, camera);
    }
    tick();

    return {
        element: renderer.domElement,
        press: pressVisual,
        setActive(v) {
            if (v && !active) clock.getDelta(); // drop the paused gap
            active = v;
        }
    };
}
