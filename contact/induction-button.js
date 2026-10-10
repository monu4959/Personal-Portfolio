// "Induction" buttons: electric arcs crawling around a dark plate, flaring on hover and flashing on click.
// Adapted from the ThreeUI Community "Induction Button" (VALENCE CORE) shader, MIT License,
// https://github.com/MengTo/threeui. Changes: transparent output so it sits on any background,
// runs on real <button>/<a> elements (so forms and downloads still work), pauses off-screen.
//
// Usage: <a class="induction-btn" data-induction href="...">Label</a>

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_arcs;
uniform float u_flash;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+vec2(9.7,3.1); a*=0.5; }
  return v;
}
float sdRBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float ar = u_res.x / u_res.y;
  vec2 hs = vec2(ar * 0.5 - 0.2, 0.5 - 0.2);
  float d = sdRBox(p, hs, 0.14);
  float t = u_time;
  float hover = clamp(u_arcs / 6.0, 0.0, 1.0);
  float plate = 1.0 - smoothstep(-0.004, 0.004, d);
  vec3 plateCol = vec3(0.04, 0.05, 0.055);
  plateCol += vec3(0.014, 0.022, 0.035) * fbm(p * 9.0);
  plateCol += vec3(0.0, 0.25, 0.3) * exp(d * 9.0) * (0.25 + hover * 0.6);
  vec3 col = plateCol * plate;
  float a = atan(p.y, p.x);
  vec3 arcCol = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float w = clamp(u_arcs - fi, 0.0, 1.0);
    float n1 = fbm(vec2(a * 2.4 + fi * 11.3, t * (1.6 + fi * 0.27) + fi * 53.1));
    float off = (n1 - 0.5) * (0.11 + u_flash * 0.1);
    float seg = smoothstep(0.35, 0.75, noise(vec2(a * 1.8 + fi * 7.7, t * (0.9 + fi * 0.13) + fi * 19.0)));
    seg = 0.3 + 0.7 * seg;
    float g = 0.0042 / (abs(d + off) + 0.006);
    arcCol += (vec3(0.0, 0.75, 0.9) * g + vec3(0.6, 1.0, 0.95) * g * g * 0.55) * w * seg;
  }
  float outerMask = 1.0 - smoothstep(0.04, 0.15, d);
  col += arcCol * (0.6 + 0.4 * hover) * outerMask;
  float ring = 0.006 / (abs(d) + 0.006);
  col += vec3(0.8, 0.98, 1.0) * ring * u_flash * 1.5 * outerMask;
  col += vec3(0.7, 0.95, 1.0) * u_flash * 0.16 * outerMask;
  // premultiplied alpha: the plate is opaque, glow fades out into whatever is behind the button
  float alpha = max(plate, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
  gl_FragColor = vec4(col, alpha);
}`;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
}

function enhance(btn) {
    const canvas = document.createElement('canvas');
    canvas.className = 'induction-gl';
    canvas.setAttribute('aria-hidden', 'true');
    btn.prepend(canvas);
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) {
        btn.classList.add('induction-fallback');
        canvas.remove();
        return;
    }
    let prog;
    try {
        prog = gl.createProgram();
        gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
        console.warn('Induction button shader failed:', err);
        btn.classList.add('induction-fallback');
        canvas.remove();
        return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const locP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uArcs = gl.getUniformLocation(prog, 'u_arcs');
    const uFlash = gl.getUniformLocation(prog, 'u_flash');
    gl.clearColor(0, 0, 0, 0);

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
        }
    }

    let arcs = 2.4, arcsTarget = 2.4, flash = 0, crawl = 0, last = performance.now();
    let visible = false, raf = 0;
    const hot = () => (arcsTarget = 5.8);
    const cool = () => (arcsTarget = 2.4);
    btn.addEventListener('pointerenter', hot);
    btn.addEventListener('pointerleave', cool);
    btn.addEventListener('focus', hot);
    btn.addEventListener('blur', cool);
    btn.addEventListener('click', () => { flash = 1; wake(); });

    function draw(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        arcs += (arcsTarget - arcs) * Math.min(1, dt * 5);
        flash *= Math.exp(-3.6 * dt);
        crawl += dt * (0.6 + (arcs / 6) * 1.1 + flash * 2.0);
        resize();
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, reduced ? 3.0 : crawl);
        gl.uniform1f(uArcs, arcs);
        gl.uniform1f(uFlash, flash);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
        draw(now);
        raf = visible && !reduced ? requestAnimationFrame(loop) : 0;
    }
    function wake() {
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }

    new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible) wake();
    }, { rootMargin: '100px' }).observe(btn);
    if (reduced) {
        // one still frame; hover/focus redraw it once
        const once = () => requestAnimationFrame(draw);
        ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach((ev) => btn.addEventListener(ev, once));
        new ResizeObserver(once).observe(btn);
    }
}

document.querySelectorAll('[data-induction]').forEach(enhance);
