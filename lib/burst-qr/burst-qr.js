// Burst QR: a 3D object that bursts into a scannable QR code when tapped. Tap again and it goes back.
// Framework-free ES module. three.js 0.160.0 loads from cdn.jsdelivr.net on first use (nothing to install).
// See README.md for the options and how to add a new object.
import { encodeQR } from './qr.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
const ROOM_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js/+esm';
let threeP = null;
const loadThree = () =>
  (threeP ||= Promise.all([
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ THREE_URL),
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ ROOM_URL),
  ]).then(([T, R]) => ({ THREE: T, RoomEnvironment: R.RoomEnvironment })));

const QUIET = 4, ANIM = 1.7, MAX_DELAY = 0.35, Y0 = -1.85, QR_W = 3.6, QR_Y = 0.05, OBJ_SIZE = 3.3;
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const isEye = (x, y, n) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

/**
 * @param {HTMLElement} el  element to fill (give it a size)
 * @param {object} opts  { link, object, palette, style, label, quality, onToggle }
 */
export async function createBurstQR(el, opts) {
  const { THREE, RoomEnvironment } = await loadThree();
  const o = { style: 'realistic', label: 'Tap to turn this into a QR code', ...opts };
  const pal = () => ({ dark: '#241510', bg: '#f5f0e8', wash: '#c9a27a', ...o.palette });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const lin = (hex) => new THREE.Color(hex);
  const ZA = V(0, 0, 1);

  // ---------- renderer and scene ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = renderer.domElement;
  Object.assign(cv.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'pointer', outline: 'none' });
  cv.tabIndex = 0;
  cv.setAttribute('role', 'button');
  cv.setAttribute('aria-label', o.label);
  cv.setAttribute('aria-pressed', 'false');
  const fadeCv = document.createElement('canvas'); // reduced motion: crossfade instead of the flight
  Object.assign(fadeCv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', opacity: '0' });
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.append(cv, fadeCv);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(renderer), 0.04);
  scene.environment = envRT.texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc2, 0.2));
  const sun = new THREE.DirectionalLight(0xfff3e4, 1.7);
  sun.position.set(2.5, 8, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.035;
  Object.assign(sun.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 2, far: 18 });
  scene.add(sun);

  const canvasTex = (size, draw) => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = Y0; ground.receiveShadow = true; scene.add(ground);
  const contactMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, map: canvasTex(128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(40,30,20,0.5)'); gr.addColorStop(0.45, 'rgba(40,30,20,0.25)'); gr.addColorStop(1, 'rgba(40,30,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }) });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactMat);
  contact.rotation.x = -Math.PI / 2; contact.position.y = Y0 + 0.003; scene.add(contact);
  // The code: a white card, dark tiles under every data square, solid finder eyes. Not tone mapped, so exact colours.
  const cardMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5), transparent: true, opacity: 0, toneMapped: false });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cardMat);
  card.position.set(0, QR_Y, -0.02); card.renderOrder = -1; scene.add(card);
  const tileMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const quad = new THREE.PlaneGeometry(1, 1);

  // Part materials: in the object a piece shows its own vertex colours times its tint; in the code
  // (iMix = 1) the vertex colours drop out and the tint becomes the dark QR colour.
  const KINDS = {
    soft: { roughness: 0.6, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0.35, 0.35, 0.35), envMapIntensity: 0.55 },
    gloss: { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.8 },
    matte: { roughness: 0.85, envMapIntensity: 0.5 },
  };
  const mats = new Map();
  const partMat = (kind = 'soft') => {
    if (mats.has(kind)) return mats.get(kind);
    const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, side: THREE.DoubleSide, ...(KINDS[kind] || kind) });
    m.userData.base = { env: m.envMapIntensity, sheen: m.sheenColor.clone(), cc: m.clearcoat, rough: m.roughness };
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = 'attribute float iMix;\n' + sh.vertexShader.replace('#include <color_vertex>', `
        vColor = vec3(1.0);
        #ifdef USE_COLOR
          vColor *= color;
        #endif
        vColor = mix(vColor, vec3(1.0), iMix);
        #ifdef USE_INSTANCING_COLOR
          vColor *= instanceColor.xyz;
        #endif`);
    };
    mats.set(kind, m);
    return m;
  };

  // ---------- watercolor: render with depth, then one painting pass ----------
  const wcTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  wcTarget.depthTexture = new THREE.DepthTexture(1, 1);
  const srgb = (hex) => { const c = new THREE.Color(hex); c.convertLinearToSRGB(); return V(c.r, c.g, c.b); };
  const wcMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: wcTarget.texture }, tDepth: { value: wcTarget.depthTexture }, uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 }, uK: { value: 1 }, uNear: { value: 0.1 }, uFar: { value: 100 }, uPaper: { value: V(0.96, 0.94, 0.91) }, uWash: { value: V(0.85, 0.8, 0.75) },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D tColor, tDepth; uniform vec2 uRes; uniform float uTime, uK, uNear, uFar; uniform vec3 uPaper, uWash;
      varying vec2 vUv;
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
      float linZ(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
      vec3 aces(vec3 c) {
        const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        c = I * (c / 0.6); c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081); return clamp(O * c, 0.0, 1.0); }
      vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      vec3 disp(vec2 uv) { return toSRGB(aces(texture2D(tColor, uv).rgb)); }
      float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main() {
        vec2 px = 1.0 / uRes, asp = vec2(uRes.x / uRes.y, 1.0);
        float k = uK;
        vec2 w = vec2(fbm(vUv * asp * 7.0 + 1.7), fbm(vUv * asp * 7.0 + 9.2)) - 0.5;
        vec2 uv = vUv + w * px * 9.0 * k;                      // wobbly, hand-drawn edges
        float d0 = texture2D(tDepth, uv).x;
        bool bg = d0 > 0.99999;
        vec3 sharp = disp(uv);
        vec3 sum = vec3(0.0); float fg = 0.0;                  // colour bleeding
        float jit = hash(gl_FragCoord.xy) * 6.283;
        for (int i = 0; i < 16; i++) {
          float fi = float(i), a = fi * 2.39996 + jit, r = sqrt((fi + 0.5) / 16.0) * 5.5;
          vec2 uu = uv + vec2(cos(a), sin(a)) * r * px * (0.4 + k);
          float f = step(texture2D(tDepth, uu).x, 0.99999);
          sum += disp(uu) * f; fg += f;
        }
        vec3 blur = fg > 0.0 ? sum / fg : uPaper;
        float zc = linZ(min(d0, 0.99999)), e = 0.0, ce = 0.0; // edges from depth and colour
        for (int i = 0; i < 4; i++) {
          vec2 o = (i == 0 ? vec2(1.0, 0.0) : i == 1 ? vec2(-1.0, 0.0) : i == 2 ? vec2(0.0, 1.0) : vec2(0.0, -1.0)) * px * 1.5;
          e += abs(linZ(min(texture2D(tDepth, uv + o).x, 0.99999)) - zc) / zc;
          ce += abs(lum(disp(uv + o)) - lum(sharp));
        }
        e = clamp(e * 2.5, 0.0, 1.0); ce = clamp(ce * 1.4, 0.0, 1.0);
        float paper = 1.0 + 0.09 * (fbm(gl_FragCoord.xy / 2.6) - 0.47) + 0.04 * (fbm(gl_FragCoord.xy / 38.0 + 3.0) - 0.47);
        float gran = fbm(gl_FragCoord.xy / 2.0 + vec2(uTime * 0.6, 0.0));
        vec3 col;
        if (bg) {                                             // loose wash backdrop
          vec2 q = (vUv - vec2(0.48, 0.5)) * asp;
          float n = fbm(vUv * asp * 1.6 + 4.0) * 0.38 + (0.62 - length(q * vec2(0.8, 1.0))) * 1.1;
          float m = smoothstep(0.4, 0.47, n);
          float rim = (1.0 - smoothstep(0.0, 0.03, abs(n - 0.415))) * step(0.4, n);
          vec3 washC = mix(uPaper, uWash, 0.35 + 0.4 * fbm(vUv * asp * 3.0 + 2.0));
          col = mix(uPaper, washC, m * 0.55);
          col = mix(col, washC * washC * 1.04, rim * 0.5);
          vec4 floorPaint = texture2D(tColor, uv);           // painted puddle (alpha = how much paint)
          if (floorPaint.a > 0.002) col *= mix(vec3(1.0), toSRGB(aces(floorPaint.rgb / floorPaint.a * 1.6)), clamp(floorPaint.a * 1.6, 0.0, 1.0));
          col = mix(col, blur * mix(vec3(1.0), uPaper, 0.25), fg / 16.0 * 0.5 * k);
        } else {
          col = mix(sharp, blur, 0.6 * k);
          float L = max(lum(col), 1e-3), Lq = (floor(L * 4.0) + 0.55) / 4.0;
          col *= mix(1.0, Lq / L, 0.45 * k);                   // few tone bands
          col = mix(col, vec3(lum(col)), 0.12 * k);            // softer palette
          col = mix(col, uPaper, 0.06 * k);
          float pool = clamp(e * 1.4 + ce, 0.0, 1.0);
          col = mix(col, col * col * 0.9, pool * 0.65 * k);    // pigment pools at edges
          col *= 1.0 - smoothstep(0.35, 1.0, e) * 0.3 * k;     // soft ink line
          col *= 1.0 - (1.0 - lum(col)) * (gran - 0.47) * 0.35 * (0.3 + 0.7 * k); // granulation
        }
        col *= mix(1.0, paper, 0.45 + 0.55 * k);               // cold-press paper
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false, toneMapped: false,
  });
  const wcScene = new THREE.Scene(), wcCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  wcScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), wcMat));
  const puddleMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const puddle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), puddleMat);
  puddle.rotation.x = -Math.PI / 2; puddle.position.y = Y0 + 0.004; scene.add(puddle);
  const puddleTexture = (hex) => canvasTex(512, (g) => {
    const r = mulberry32(77), c = new THREE.Color(hex).lerp(new THREE.Color('#7a8196'), 0.5); c.convertLinearToSRGB();
    const rgba = (a) => `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`;
    const blob = (R, wob) => { const p1 = r() * 6, p2 = r() * 6; g.beginPath();
      for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2, rr = R * (1 + wob * (0.6 * Math.sin(a * 3 + p1) + 0.4 * Math.sin(a * 7 + p2))); g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr * 0.62); }
      g.closePath(); };
    g.filter = 'blur(1.5px)';
    blob(210, 0.12); g.fillStyle = rgba(0.18); g.fill(); g.lineWidth = 5; g.strokeStyle = rgba(0.3); g.stroke();
    blob(120, 0.1); g.fillStyle = rgba(0.28); g.fill();
    g.filter = 'none';
    for (let i = 0; i < 36; i++) { const a = r() * 6.28, d = 200 + r() * 50; g.fillStyle = rgba(0.25 + r() * 0.3); g.beginPath(); g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d * 0.62, 1 + r() * 4, 0, 7); g.fill(); }
  });

  // ---------- object kit (handed to the builder) ----------
  // paint(geo, fn): fn(x, y, z) returns a hex colour or [hex, brightness]; written as vertex colours.
  const paint = (geo, fn) => {
    const p = geo.attributes.position, arr = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const r = fn(p.getX(i), p.getY(i), p.getZ(i));
      const [hex, k = 1] = Array.isArray(r) ? r : [r];
      c.set(hex).multiplyScalar(k); arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return geo;
  };

  // Fallback when a builder gives no parts: sample pieces from the surface of its meshes.
  const chunk = new THREE.IcosahedronGeometry(0.5, 0);
  function samplePieces(group, count, rand) {
    group.updateMatrixWorld(true);
    const tris = [], a = V(), b = V(), c = V();
    let total = 0;
    group.traverse((m) => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, N = idx ? idx.count : pos.count;
      for (let i = 0; i + 2 < N; i += 3) {
        const at = (k) => (idx ? idx.getX(i + k) : i + k);
        a.fromBufferAttribute(pos, at(0)).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(pos, at(1)).applyMatrix4(m.matrixWorld); c.fromBufferAttribute(pos, at(2)).applyMatrix4(m.matrixWorld);
        total += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
        tris.push({ a: a.clone(), b: b.clone(), c: c.clone(), sum: total, color: m.material.color || new THREE.Color(1, 1, 1) });
      }
    });
    const size = new THREE.Box3().setFromObject(group).getSize(V()), sc = Math.max(size.x, size.y, size.z) / 40;
    return Array.from({ length: Math.min(count, 1500) }, () => {
      const x = rand() * total; let lo = 0, hi = tris.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].sum < x) lo = mid + 1; else hi = mid; }
      const t = tris[lo]; let u = rand(), v = rand(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const p = t.a.clone().addScaledVector(t.b.clone().sub(t.a), u).addScaledVector(t.c.clone().sub(t.a), v);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6));
      return { geometry: chunk, material: 'matte', color: t.color, matrix: new THREE.Matrix4().compose(p, q, V(sc, sc, sc)) };
    });
  }

  // ---------- build ----------
  const state = { open: false, t: 0, theta: 0.3, drag: null, paused: false, visible: true };
  const ptr = { x: 0, y: 0, active: false }; // pointer relative to the canvas centre, -1..1 (y up), for tick()
  let model = null;
  const spin = new THREE.Group(); spin.position.y = Y0; scene.add(spin);
  const stage = new THREE.Group(); spin.add(stage);

  function disposeModel() {
    if (!model) return;
    model.group.traverse((m) => { if (m.geometry) m.geometry.dispose(); for (const mt of [].concat(m.material || [])) { for (const v of Object.values(mt)) if (v && v.isTexture) v.dispose(); mt.dispose(); } });
    for (const m of model.meshes) { m.geometry.dispose(); m.dispose(); }
    model.rig.clear();
    stage.clear();
    scene.remove(model.tiles, model.eyes); model.tiles.dispose(); model.eyes.dispose();
    model = null;
  }

  function build() {
    const p = pal(), qr = encodeQR(o.link, { ecl: 'H' });
    disposeModel();
    const n = qr.size, s = QR_W / (n + QUIET * 2), rand = mulberry32(hashStr(o.link));
    const cell = (x, y) => V((x - n / 2 + 0.5) * s, QR_Y - (y - n / 2 + 0.5) * s, 0);
    const dataCells = [], eyeCells = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules[y][x]) (isEye(x, y, n) ? eyeCells : dataCells).push({ x, y });

    // rig: parent of the object and its pieces. tick() may move it (breathing, sway); it eases back to rest as the burst starts.
    const rig = new THREE.Group();
    const made = o.object({ THREE, rand: mulberry32(7), palette: p, paint, V, lin, rig, reduce, quality });
    const group = made.group || new THREE.Group();
    const list = made.parts && made.parts.length ? made.parts : samplePieces(group, dataCells.length, rand);
    group.traverse((m) => { if (m.isMesh && !m.material.transparent && !m.userData.noShadow) { m.castShadow = true; m.receiveShadow = true; } });

    // fit the object to a standard size, standing on the floor, turning around its centre
    const box = new THREE.Box3().setFromObject(group);
    const pieces = list.map((q) => {
      const bP = V(), bQ = new THREE.Quaternion(), bS = V();
      q.matrix.decompose(bP, bQ, bS);
      box.expandByPoint(bP);
      return { ...q, role: q.role || 'fly', bP, bQ, bS: q.hidden ? V() : bS, c0: new THREE.Color(q.color ?? '#ffffff') };
    });
    const size = box.getSize(V()), ctr = box.getCenter(V());
    const k = OBJ_SIZE / Math.max(size.x, size.y, size.z);
    stage.scale.setScalar(k);
    stage.position.set(-ctr.x * k, -box.min.y * k, -ctr.z * k);
    stage.add(rig); rig.add(group);
    if (made.angle != null) state.theta = made.angle;
    const footR = (made.footR ?? Math.max(size.x, size.z) / 2) * k;

    // every dark square gets a flying piece; copies burst out of real pieces if there are too few
    const flyers = pieces.filter((q) => q.role === 'fly'), leaves = pieces.filter((q) => q.role === 'leaf');
    for (let i = flyers.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [flyers[i], flyers[j]] = [flyers[j], flyers[i]]; }
    const real = flyers.length;
    while (real && flyers.length < dataCells.length) {
      const copy = { ...flyers[Math.floor(rand() * real)], bS: V(), spawn: true };
      flyers.push(copy); pieces.push(copy);
    }
    const chosen = flyers.slice(0, dataCells.length).sort((a, b) => b.bP.y - a.bP.y);
    const rows = dataCells.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const band = Math.max(1, Math.floor(rows.length / 8));
    for (let b0 = 0; b0 < rows.length; b0 += band)
      for (let i = Math.min(b0 + band, rows.length) - 1; i > b0; i--) { const j = b0 + Math.floor(rand() * (i - b0 + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
    chosen.forEach((q, i) => { q.cell = rows[i]; });
    const accent = dataCells.filter(() => rand() < 0.1);
    leaves.forEach((q, i) => { q.cell = accent.length && i % 3 === 0 ? accent[i % accent.length] : null; });
    const darkC = lin(p.dark);
    for (const q of pieces) {
      q.extra = !q.cell;
      q.c1 = darkC.clone().multiplyScalar(q.role === 'leaf' ? 0.8 : 0.85 + rand() * 0.25);
      q.roll = Math.floor(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.3; // quarter turns keep pieces inside their square
      q.delay = q.cell && q.role === 'fly' ? MAX_DELAY * (0.55 * (q.cell.y / n) + 0.45 * rand()) : rand() * MAX_DELAY;
      q.burst = q.bP.clone().sub(ctr).normalize().multiplyScalar((0.5 + rand() * 0.8) / k).add(V(0, (rand() * 0.5) / k, 0));
    }

    // one InstancedMesh per part geometry
    const byGeo = new Map(), meshes = [];
    for (const q of pieces) { if (!byGeo.has(q.geometry)) byGeo.set(q.geometry, []); byGeo.get(q.geometry).push(q); }
    for (const [geo, items] of byGeo) {
      const g = geo.clone();
      geo.dispose();
      if (!g.attributes.color) paint(g, () => '#ffffff');
      if (!g.attributes.normal) g.computeVertexNormals();
      g.setAttribute('iMix', new THREE.InstancedBufferAttribute(new Float32Array(items.length), 1));
      g.computeBoundingBox();
      const bb = g.boundingBox, info = { center: bb.getCenter(V()), radius: Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y) / 2 || 0.5 };
      const m = new THREE.InstancedMesh(g, partMat(items[0].material), items.length);
      m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      items.forEach((q, i) => { q.mesh = m; q.i = i; q.info = info; m.setColorAt(i, q.c0); });
      meshes.push(m); rig.add(m);
    }

    const tiles = new THREE.InstancedMesh(quad, tileMat, dataCells.length);
    const eyes = new THREE.InstancedMesh(quad, tileMat, eyeCells.length);
    tileMat.color.copy(darkC);
    tiles.frustumCulled = eyes.frustumCulled = false;
    scene.add(tiles, eyes);
    card.scale.set(s * (n + QUIET * 2), s * (n + QUIET * 2), 1);
    contact.scale.setScalar(footR * 2.3);
    if (puddleMat.userData.tint !== p.wash) { puddleMat.map?.dispose(); puddleMat.map = puddleTexture(p.wash); puddleMat.userData.tint = p.wash; puddleMat.needsUpdate = true; }
    puddle.scale.setScalar(Math.min(3.6, 1 + footR * 3.4));
    const w = srgb(p.wash), paperV = srgb(p.bg);
    wcMat.uniforms.uPaper.value.copy(paperV);
    wcMat.uniforms.uWash.value.copy(paperV).multiplyScalar(0.6).addScaledVector(w, 0.4);

    // static materials fade out as the object drops away
    const statics = [];
    group.traverse((m) => { for (const mt of [].concat(m.material || [])) if (!statics.includes(mt)) { mt.userData.op ??= mt.opacity; mt.userData.tr ??= mt.transparent; statics.push(mt); } });

    // camera framing (the object turns, so use its widest radius)
    let rmax = 0;
    for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) rmax = Math.max(rmax, Math.hypot(x - ctr.x, z - ctr.z) * k);
    const h = size.y * k;
    const el = made.elevation ?? 0.2; // seen from above, depth adds to the height on screen
    const fit = { cy: Y0 + h / 2, h: Math.max(h, h * Math.cos(el) + rmax * 2 * Math.sin(el)) + 0.45, w: rmax * 2 + 0.3, rmax, el };

    model = { group, rig, pieces, meshes, tiles, eyes, dataCells, eyeCells, cell, s, n, statics, fit, tick: made.tick, k, spin: made.spin ?? 0.25, angle: made.angle ?? state.theta };
    setTargets();
    pose(state.t);
  }

  // QR spots are fixed in the world; the object turns, so targets are converted into its frame.
  const _m = new THREE.Matrix4(), _p = V(), _q = new THREE.Quaternion(), _s = V(), _c = new THREE.Color();
  function setTargets() {
    spin.rotation.y = state.theta;
    spin.updateMatrixWorld(true);
    const inv = stage.matrixWorld.clone().invert(), { s } = model;
    for (const q of model.pieces) {
      if (q.cell) {
        const kk = (s * (q.role === 'leaf' ? 0.4 : 0.46)) / q.info.radius;
        const rot = new THREE.Quaternion().setFromAxisAngle(ZA, q.roll), sc = V(kk, kk, kk * 0.2);
        const pos = model.cell(q.cell.x, q.cell.y).setZ(q.role === 'leaf' ? 0.07 : 0.035).sub(q.info.center.clone().multiply(sc).applyQuaternion(rot));
        const local = inv.clone().multiply(new THREE.Matrix4().compose(pos, rot, sc));
        q.qP = V(); q.qQ = new THREE.Quaternion(); q.qS = V();
        local.decompose(q.qP, q.qQ, q.qS);
      } else {
        q.qP = q.bP.clone().addScaledVector(q.burst, 2.2); q.qQ = q.bQ; q.qS = V();
      }
    }
  }

  const span = 1 - MAX_DELAY;
  function pose(t) {
    const { pieces, tiles, eyes, dataCells, eyeCells, s } = model;
    const uByCell = new Map();
    for (const q of pieces) {
      const u = ease(clamp01((t - q.delay) / span));
      _p.copy(q.bP).lerp(q.qP, u).addScaledVector(q.burst, Math.sin(Math.PI * u) * (q.extra ? 0.3 : 0.9));
      _q.copy(q.bQ).slerp(q.qQ, u);
      _s.copy(q.bS).lerp(q.qS, u);
      q.mesh.setMatrixAt(q.i, _m.compose(_p, _q, _s));
      const kc = smooth(0.3, 0.9, u);
      q.mesh.setColorAt(q.i, _c.copy(q.c0).lerp(q.c1, kc));
      q.mesh.geometry.attributes.iMix.array[q.i] = smooth(0.65, 1, u); // natural colours darken first, then drop out
      if (q.cell && q.role === 'fly') uByCell.set(q.cell, u);
    }
    for (const m of model.meshes) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.geometry.attributes.iMix.needsUpdate = true; }
    dataCells.forEach((c, i) => { const kk = smooth(0.72, 1, uByCell.get(c) || 0) * s * 1.02; tiles.setMatrixAt(i, _m.compose(model.cell(c.x, c.y), _q.identity(), _s.set(kk, kk, 1))); });
    const ke = smooth(0.55, 1, t) * s * 1.02;
    eyeCells.forEach((c, i) => eyes.setMatrixAt(i, _m.compose(model.cell(c.x, c.y).setZ(0.01), _q.identity(), _s.set(ke, ke, 1))));
    tiles.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = true;
    tiles.visible = eyes.visible = t > 0.001;
    const fade = smooth(0, 0.5, t);
    for (const mt of model.statics) { mt.opacity = mt.userData.op * (1 - fade); const tr = mt.userData.tr || fade > 0; if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; } }
    model.group.position.y = (-3 * smooth(0.05, 0.75, t)) / model.k;
    model.group.visible = t < 0.97;
    groundMat.opacity = 0.12 * (1 - fade);
    contactMat.opacity = puddleMat.opacity = 1 - fade;
    cardMat.opacity = smooth(0.35, 0.85, t); card.visible = cardMat.opacity > 0.001;
    wcMat.uniforms.uK.value = 1 - 0.9 * smooth(0.3, 0.9, t); // the code stays crisp and dark
    const calm = 1 - smooth(0.2, 0.8, t); // no sheen, gloss or reflections on the code
    for (const m of mats.values()) {
      const b = m.userData.base;
      m.sheenColor.copy(b.sheen).multiplyScalar(calm);
      m.clearcoat = Math.max(0.001, b.cc * calm);
      m.roughness = b.rough + (0.92 - b.rough) * (1 - calm);
      m.envMapIntensity = b.env * (0.25 + 0.75 * calm);
    }
    placeCamera(t);
  }

  function fitDistance(w, h, aspect) {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2, hz = Math.atan(Math.tan(v) * aspect);
    return Math.max(h / 2 / Math.tan(v), w / 2 / Math.tan(hz));
  }
  function placeCamera(t) {
    const e = ease(clamp01(t)), f = model.fit, cw = card.scale.x;
    const dB = fitDistance(f.w * 0.92, f.h * 0.98, camera.aspect) + f.rmax * 0.15;
    const dQ = fitDistance(cw * 1.08, cw * 1.22, camera.aspect);
    camera.position.copy(V(0, f.cy + dB * Math.sin(f.el), dB * Math.cos(f.el))).lerp(V(0, QR_Y, dQ), e);
    camera.lookAt(V(0, f.cy, 0).lerp(V(0, QR_Y, 0), e));
  }

  // ---------- drawing and quality ----------
  const bg = new THREE.Color();
  function drawWatercolor() {
    const w = cv.width, h = cv.height;
    if (wcTarget.width !== w || wcTarget.height !== h) wcTarget.setSize(w, h);
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(wcTarget); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    const u = wcMat.uniforms; u.uRes.value.set(w, h); u.uNear.value = camera.near; u.uFar.value = camera.far;
    renderer.render(wcScene, wcCam);
  }
  function draw() {
    const wc = o.style === 'watercolor';
    ground.visible = contact.visible = !wc; puddle.visible = wc;
    if (wc) return drawWatercolor();
    scene.background = bg.set(pal().bg);
    renderer.render(scene, camera);
  }
  // tier 2: up to 2x pixels; tier 1: 1.5x; tier 0: 1x and smaller shadows. Steps down by itself if slow.
  const quality = { tier: o.quality ?? 2, frames: 0, n: 0, time: 0, settled: o.quality != null };
  function applyQuality() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, [1, 1.5, 2][quality.tier]));
    if (quality.tier === 0 && sun.shadow.mapSize.x !== 1024) { sun.shadow.mapSize.set(1024, 1024); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    resize();
  }
  function resize() {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    if (model) { placeCamera(state.t); draw(); }
  }
  const ro = new ResizeObserver(resize); ro.observe(el);
  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; }); io.observe(el);

  let raf = 0, last = performance.now(), clock = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    if (state.paused || document.hidden || !state.visible) return;
    if (!quality.settled && ++quality.frames > 5) { // skip shader warm-up, then time 30 frames or 3 s
      quality.n++; quality.time += raw;
      if (quality.n >= 30 || quality.time > 3) {
        if (quality.n / quality.time < 40 && quality.tier > 0) { quality.tier--; applyQuality(); } else quality.settled = true;
        quality.frames = quality.n = quality.time = 0;
      }
    }
    const goal = state.open ? 1 : 0;
    if (state.t !== goal) {
      state.t = goal > state.t ? Math.min(1, state.t + dt / ANIM) : Math.max(0, state.t - dt / ANIM);
      pose(state.t);
    } else if (!state.open && !state.drag && !reduce) {
      if (model.spin) state.theta += dt * model.spin; // turntable
      else state.theta += (model.angle - state.theta) * Math.min(1, dt * 2); // spin 0: ease back to its own angle after a drag
      spin.rotation.y = state.theta;
    }
    if (!reduce) { clock += dt; wcMat.uniforms.uTime.value = clock * 0.05; }
    model.tick?.(clock, state.t, ptr);
    const r = model.rig, w = smooth(0, 0.15, state.t); // the burst starts from rest, so pieces land on their squares
    if (w > 0) { r.position.multiplyScalar(1 - w); r.quaternion.slerp(_q.identity(), w); r.scale.lerp(_s.set(1, 1, 1), w); }
    draw();
  }

  // ---------- input ----------
  function toggle() {
    if (!state.open) setTargets(); // freeze the turn so pieces fly to the right spots
    state.open = !state.open;
    cv.setAttribute('aria-pressed', String(state.open));
    if (reduce) { // skip the flight: crossfade from the old picture to the new one
      fadeCv.width = cv.width; fadeCv.height = cv.height;
      fadeCv.getContext('2d').drawImage(cv, 0, 0);
      fadeCv.style.transition = 'none'; fadeCv.style.opacity = '1';
      state.t = state.open ? 1 : 0; pose(state.t); draw();
      requestAnimationFrame(() => requestAnimationFrame(() => { fadeCv.style.transition = 'opacity .45s ease'; fadeCv.style.opacity = '0'; }));
    }
    o.onToggle?.(state.open);
  }
  cv.addEventListener('pointerdown', (e) => { state.drag = { x: e.clientX, moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch {} });
  cv.addEventListener('pointermove', (e) => {
    if (!state.drag) return;
    const dx = e.clientX - state.drag.x; state.drag.x = e.clientX; state.drag.moved += Math.abs(dx);
    if (!state.open && state.t === 0) { state.theta += dx * 0.01; spin.rotation.y = state.theta; }
  });
  cv.addEventListener('pointerup', () => { const d = state.drag; state.drag = null; if (d && d.moved < 6) toggle(); });
  cv.addEventListener('pointercancel', () => { state.drag = null; });
  const onPointer = (e) => {
    const r = el.getBoundingClientRect(); if (!r.width) return;
    ptr.x = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2)));
    ptr.y = Math.max(-1, Math.min(1, -(e.clientY - r.top - r.height / 2) / (r.height / 2)));
    ptr.active = true;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

  // PNG of the flat code: one straight-on square render where the card fills the frame.
  function toPNG(px = 1200) {
    const keepT = state.t, keepRatio = renderer.getPixelRatio();
    if (keepT !== 1) { setTargets(); pose(1); }
    renderer.setPixelRatio(1); renderer.setSize(px, px, false);
    camera.aspect = 1; camera.updateProjectionMatrix();
    const wc = o.style === 'watercolor'; // watercolor keeps a painted border around the card
    camera.position.set(0, QR_Y, (card.scale.x * (wc ? 1.28 : 1)) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    camera.lookAt(0, QR_Y, 0);
    if (wc) drawWatercolor(); else { scene.background = new THREE.Color('#ffffff'); renderer.render(scene, camera); }
    const url = cv.toDataURL('image/png');
    renderer.setPixelRatio(keepRatio);
    pose(keepT);
    resize();
    return url;
  }

  function destroy() {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onPointer);
    disposeModel();
    for (const sc of [scene, wcScene]) sc.traverse((m) => { if (m.geometry) m.geometry.dispose(); for (const mt of [].concat(m.material || [])) { for (const v of Object.values(mt)) if (v && v.isTexture) v.dispose(); mt.dispose(); } });
    for (const m of mats.values()) m.dispose();
    chunk.dispose(); envRT.dispose(); pmrem.dispose(); wcTarget.depthTexture.dispose(); wcTarget.dispose(); wcMat.dispose(); sun.shadow.map?.dispose();
    renderer.dispose(); renderer.forceContextLoss();
    cv.remove(); fadeCv.remove();
  }

  try { applyQuality(); build(); } catch (err) { destroy(); throw err; }
  raf = requestAnimationFrame(frame);

  return {
    toggle,
    get isOpen() { return state.open; },
    setStyle(v) { o.style = v === 'watercolor' ? 'watercolor' : 'realistic'; draw(); },
    setLink(v) { const old = o.link; o.link = v; try { build(); } catch (err) { o.link = old; throw err; } draw(); },
    setObject(object, palette) { o.object = object; if (palette) o.palette = palette; build(); draw(); },
    toPNG,
    /** Test hook: freeze the loop and draw one exact moment (0 = object, 1 = code). */
    still(t) { state.paused = true; state.open = t >= 0.5; state.t = t; setTargets(); pose(t); draw(); },
    resume() { state.paused = false; },
    quality,
    destroy,
  };
}
