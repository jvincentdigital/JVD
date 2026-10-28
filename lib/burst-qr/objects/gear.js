// Gaming gear of our own design for the IMPerfect lab, in the familiar shapes players know:
// - padTwoTone: white wings, black centre, big touchpad with lime light bars, sticks side by side.
// - padOffset: rounder matte black pad, left stick high and right stick low.
// - padPro: pro pad with a striped faceplate and four back paddles that show under the grips.
// - pcSetup: compact keyboard (lime WASD, RGB under-glow) and a mouse on a desk mat; the keycaps fly into the code.
// No console maker's logos, button symbols or names. Same palette and idle motion as controller.js.
// Needs an engine with tick(time, t, pointer, style) for the neon boost (the IMPerfect copy); works without it too.
export const gearPalette = { dark: '#0b0f02', bg: '#e9eae4', wash: '#b3c93a', night: '#0a0b08', glow: '#C8E400', glow2: '#effcc4' };

const accent = (kit) => kit.palette.glow || '#C8E400'; // light colour: lime for IMPerfect, any palette.glow elsewhere
const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------- shared helpers ----------
function kitHelpers({ THREE, V }) {
  const roundBox = (w, h, d, r, bev = 0.012) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -bev); return g; // back face at z = 0
  };
  const lathe = (pts, seg = 40) => { const g = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg); g.rotateX(Math.PI / 2); return g; };
  const qz = (a) => new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), a);
  return { roundBox, lathe, qz };
}

// One button or stick moves now and then while the object rests (t = 0); the engine owns the pieces once they move.
function makePressTick(THREE, V, rig) {
  const press = { mesh: null, i: 0, start: 0, next: 1.2, kind: 'press', ax: V(1, 0, 0) }, base = new THREE.Matrix4(), tmp = new THREE.Matrix4(), sc = V();
  return (time, t) => {
    if (t > 0) { press.mesh = null; return; }
    const k = time - press.start;
    if (press.mesh && k > 0.32) { press.mesh.setMatrixAt(press.i, base); press.mesh.instanceMatrix.needsUpdate = true; press.mesh = null; }
    if (!press.mesh && time > press.next) {
      const ms = rig.children.filter((m) => m.isInstancedMesh && m.geometry.userData.press);
      const m = ms[Math.floor(Math.random() * ms.length)];
      if (m) {
        const i = Math.floor(Math.random() * m.count); m.getMatrixAt(i, base); sc.setFromMatrixScale(base);
        if (sc.x > 1e-4) Object.assign(press, { mesh: m, i, start: time, kind: m.geometry.userData.press, ax: V(Math.random() - 0.5, Math.random() - 0.5, 0).normalize() });
      }
      press.next = time + 0.7 + Math.random() * 1.4;
    }
    if (press.mesh) {
      const u = Math.sin(Math.PI * Math.min(1, k / 0.32));
      tmp.copy(base).multiply(press.kind === 'tilt' ? new THREE.Matrix4().makeRotationAxis(press.ax, 0.32 * u) : new THREE.Matrix4().makeTranslation(0, 0, -0.022 * u));
      press.mesh.setMatrixAt(press.i, tmp); press.mesh.instanceMatrix.needsUpdate = true;
    }
  };
}

// ---------- a gamepad from a config ----------
function buildPad(kit, cfg) {
  const LIME = accent(kit);
  const { THREE, rand, paint, V, rig, reduce } = kit;
  const { roundBox, lathe, qz } = kitHelpers(kit);
  const FZ = 0.31;
  const group = new THREE.Group(), parts = [];
  const body = new THREE.Group(); body.rotation.x = -0.34; group.add(body); body.updateMatrix();
  const TILT = body.matrix.clone();
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const part = (geometry, material, pos, q = new THREE.Quaternion(), s = 1, extra = {}) =>
    parts.push({ geometry, material, matrix: TILT.clone().multiply(new THREE.Matrix4().compose(pos, q, V(s, s, s))), ...extra });

  // shell: right half as bezier segments, the left half is its mirror
  const start = [0, cfg.right[0][0][1]];
  const sh = new THREE.Shape(); sh.moveTo(...start);
  for (const [c1, c2, p] of cfg.right) sh.bezierCurveTo(...c1, ...c2, ...p);
  for (let i = cfg.right.length - 1; i >= 0; i--) {
    const [c1, c2] = cfg.right[i], s0 = i ? cfg.right[i - 1][2] : start;
    sh.bezierCurveTo(-c2[0], c2[1], -c1[0], c1[1], -s0[0], s0[1]);
  }
  const shellGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 10, curveSegments: 48 });
  shellGeo.translate(0, 0, -0.17);
  const shellMat = new THREE.MeshPhysicalMaterial({ color: cfg.shell, roughness: cfg.shellRough, metalness: 0.04, clearcoat: cfg.clearcoat, clearcoatRoughness: 0.1, envMapIntensity: 0.3 });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: cfg.side, roughness: 0.45, metalness: 0.2, clearcoat: 0.5, envMapIntensity: 0.4 });
  add(shellGeo, [shellMat, sideMat]);

  // pro pad: a swappable-looking faceplate with lime stripes, slightly inside the outline
  if (cfg.faceplate) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#16181b'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = LIME; g.globalAlpha = 0.85;
    for (let i = -256; i < 512; i += 128) { g.lineWidth = 26; g.beginPath(); g.moveTo(i, 256); g.lineTo(i + 256, 0); g.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(0.28, 0.28); tex.anisotropy = 8;
    const plateGeo = new THREE.ShapeGeometry(sh, 48);
    const fp = add(plateGeo, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.2 }), 0, 0, FZ + 0.002);
    fp.scale.setScalar(0.93); fp.position.y = -0.03;
  }

  const poly = sh.getSpacedPoints(260).slice(0, -1);
  const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
  const edgeDist = (x, y) => { let d = 9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ab = V(b.x - a.x, b.y - a.y), t = Math.max(0, Math.min(1, ((x - a.x) * ab.x + (y - a.y) * ab.y) / ab.lengthSq())); d = Math.min(d, Math.hypot(a.x + ab.x * t - x, a.y + ab.y * t - y)); } return d; };

  // glowing materials (driven in tick)
  const ringMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.2, roughness: 0.4 });
  const barMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.6, roughness: 0.35 });
  const dotMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.4 });
  const wellMat = new THREE.MeshPhysicalMaterial({ color: cfg.well, roughness: 0.55, metalness: 0.2 });

  // black centre plate (two-tone)
  if (cfg.plate) {
    const p = cfg.plate;
    add(roundBox(p.w, p.h, 0.03, p.r, 0.01), new THREE.MeshPhysicalMaterial({ color: '#121316', roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.15 }), 0, p.y, FZ - 0.025);
  }
  // touchpad with light bars on both sides
  const bars = [];
  if (cfg.touchpad) {
    const t = cfg.touchpad;
    add(roundBox(t.w, t.h, 0.02, 0.06, 0.008), new THREE.MeshPhysicalMaterial({ color: '#1d1f23', roughness: 0.62, metalness: 0.05 }), 0, t.y, FZ + 0.004);
    for (const sx of [-1, 1]) { const b = add(roundBox(0.022, t.h * 0.86, 0.012, 0.01, 0.004), barMat, sx * (t.w / 2 + 0.035), t.y, FZ + 0.006); b.userData.noShadow = true; bars.push(b); }
  }

  const well = (x, y, r, lit) => {
    const w = add(new THREE.CylinderGeometry(r, r, 0.02, 64), wellMat, x, y, FZ - 0.004); w.rotation.x = Math.PI / 2;
    return add(new THREE.TorusGeometry(r, 0.011, 10, 96), lit ? ringMat : new THREE.MeshPhysicalMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.25 }), x, y, FZ + 0.004);
  };
  const { DPAD, FACE, STICKS, HOME } = cfg;
  well(DPAD.x, DPAD.y, 0.25, false); well(FACE.x, FACE.y, 0.29, false);
  const stickRings = STICKS.map((p) => well(p.x, p.y, 0.2, true));
  for (const p of STICKS) { const d = add(new THREE.SphereGeometry(0.14, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), wellMat, p.x, p.y, FZ); d.rotation.x = Math.PI / 2; d.scale.y = 0.45; }
  const dots = [-0.09, -0.03, 0.03, 0.09].map((x) => { const d = add(new THREE.SphereGeometry(0.011, 12, 8), dotMat, x, cfg.dotsY, FZ + 0.003); d.scale.z = 0.4; return d; });

  // controls
  const btnMat = { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0.1, envMapIntensity: 0.9 };
  const satin = { roughness: 0.5, metalness: 0.05, envMapIntensity: 0.3 };
  const arm = roundBox(0.1, 0.14, 0.045, 0.03);
  paint(arm, (x, y, z) => [cfg.dpadColor, 0.55 + 10 * z]); arm.userData.press = 'press';
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; part(arm, { ...satin }, V(DPAD.x + Math.sin(a) * 0.105, DPAD.y + Math.cos(a) * 0.105, FZ), qz(-a)); }

  const btn = lathe([[0, 0.07], [0.036, 0.068], [0.042, 0.067], [0.05, 0.065], [0.056, 0.062], [0.075, 0.05], [0.083, 0.03], [0.085, 0]]);
  paint(btn, (x, y, z) => { const r = Math.hypot(x, y); return r > 0.04 && r < 0.054 && z > 0.06 ? [LIME, 1.15] : [cfg.btnColor, 0.5 + 8 * z]; });
  btn.userData.press = 'press';
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; part(btn, { ...btnMat }, V(FACE.x + Math.sin(a) * 0.18, FACE.y + Math.cos(a) * 0.18, FZ)); }

  const cap = lathe([[0, 0.135], [0.06, 0.128], [0.11, 0.14], [0.142, 0.15], [0.158, 0.138], [0.16, 0.11], [0.13, 0.085], [0.06, 0.07], [0.055, 0]], 48);
  paint(cap, (x, y, z) => { const r = Math.hypot(x, y); return r > 0.135 && z > 0.12 ? ['#55585e', 1] : ['#1b1c1f', 0.6 + 3 * z]; });
  cap.userData.press = 'tilt';
  for (const p of STICKS) part(cap, { roughness: 0.7, envMapIntensity: 0.5 }, V(p.x, p.y, FZ + 0.03), new THREE.Quaternion(), 0.92);

  const pill = roundBox(0.09, 0.04, 0.02, 0.018, 0.008);
  paint(pill, (x, y, z) => ['#2c2f33', 0.6 + 12 * z]); pill.userData.press = 'press';
  for (const [x, y] of cfg.small) part(pill, { ...satin }, V(x, y, FZ));
  const home = lathe([[0, 0.032], [0.04, 0.03], [0.05, 0.022], [0.055, 0]]);
  paint(home, (x, y, z) => (Math.hypot(x, y) > 0.044 ? [LIME, 1.1] : ['#1e2023', 0.7 + 10 * z])); home.userData.press = 'press';
  part(home, { ...btnMat }, V(HOME.x, HOME.y, FZ), new THREE.Quaternion(), cfg.homeScale || 1);

  // bumpers and triggers
  const up = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2);
  const bump = roundBox(0.54, 0.19, 0.07, 0.07);
  paint(bump, (x, y, z) => (y > 0.07 ? [LIME, 0.9] : [cfg.bumpColor, 0.6 + 6 * z]));
  const trig = roundBox(0.42, 0.25, 0.13, 0.1);
  paint(trig, (x, y, z) => [cfg.trigColor, 0.55 + 4 * z]);
  for (const sx of [-1, 1]) {
    part(bump, { ...btnMat }, V(sx * cfg.shoulderX, cfg.shoulderY, 0.07), up.clone().multiply(qz(sx * 0.1)));
    part(trig, { ...btnMat }, V(sx * cfg.shoulderX, cfg.shoulderY, -0.17), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2 + 0.35).multiply(qz(sx * 0.1)));
  }

  // grip texture: small round studs on the grips
  const stud = new THREE.CylinderGeometry(0.5, 0.42, 0.22, 16, 1); stud.rotateX(Math.PI / 2);
  paint(stud, (x, y, z) => [cfg.studColor, z < 0 ? 0.35 : 0.65 + 0.4 * (1 - Math.hypot(x, y) * 1.6)]);
  const studLit = stud.clone(); paint(studLit, () => [LIME, 1]);
  const studMat = { roughness: 0.6, metalness: 0.05, envMapIntensity: 0.35 }, studLitMat = { ...studMat };
  const R = 0.034, dx = 2.3 * R, dy = 2 * R;
  const clear = [[DPAD, 0.31], [FACE, 0.35], [STICKS[0], 0.25], [STICKS[1], 0.25], [HOME, 0.11]];
  for (let row = 0, y = -1.45; y < 0.2; row++, y += dy)
    for (let x = -1.85 + (row % 2) * dx / 2; x < 1.85; x += dx) {
      if (!cfg.grip(x, y) || !inside(x, y) || edgeDist(x, y) < 0.12 || clear.some(([c, r]) => Math.hypot(x - c.x, y - c.y) < r)) continue;
      const lit = rand() < 0.07;
      part(lit ? studLit : stud, lit ? studLitMat : studMat, V(x, y, FZ + 0.004), undefined, R * 1.7);
    }

  // back paddles: lime tabs under the grips (they fly into the code too)
  if (cfg.paddles) {
    const pad = roundBox(0.13, 0.5, 0.04, 0.06, 0.012);
    paint(pad, (x, y, z) => [LIME, 0.75 + 0.5 * (y + 0.21)]); pad.userData.press = 'press';
    for (const [x, y, a] of cfg.paddles) part(pad, { roughness: 0.3, clearcoat: 1, metalness: 0.1 }, V(x, y, -0.26), qz(a));
  }

  // lime sparks hidden inside: they burst out and fill the rest of the code
  const spark = new THREE.OctahedronGeometry(0.5, 0);
  paint(spark, () => [LIME, 1.1]);
  for (let i = 0; i < 140; i++) part(spark, { roughness: 0.35, metalness: 0.1 }, V((rand() - 0.5) * 2.4, (rand() - 0.5) * 1.2 - 0.1, (rand() - 0.5) * 0.2), qz(rand() * 6), 0.07, { hidden: true });

  // hover pad
  const padY = -1.7;
  const pad = add(new THREE.TorusGeometry(1.1, 0.016, 10, 160), ringMat, 0, padY, 0.05, group); pad.rotation.x = Math.PI / 2; pad.userData.noShadow = true;
  const pad2 = add(new THREE.TorusGeometry(0.86, 0.008, 8, 160), dotMat, 0, padY, 0.05, group); pad2.rotation.x = Math.PI / 2; pad2.userData.noShadow = true;

  const pressTick = makePressTick(THREE, V, rig);
  const tick = (time, t, ptr, style) => {
    const neon = style === 'neon', live = 1 - smooth(0, 0.35, t);
    const look = ptr && ptr.active ? ptr.x * 0.18 : 0;
    rig.position.y = 0.07 * Math.sin(time * 1.3);
    rig.rotation.set(0.04 * Math.sin(time * 0.9), (cfg.swing || 0.42) * Math.sin(time * 0.32) + look, 0.025 * Math.sin(time * 0.7));
    barMat.emissiveIntensity = (neon ? 2.6 : 1.6) * (0.75 + 0.25 * Math.sin(time * 2.2)) * live;
    ringMat.emissiveIntensity = (neon ? 1.8 : 1.1) * (0.7 + 0.3 * Math.sin(time * 2.2 + 1.5));
    dotMat.emissiveIntensity = neon ? 2 : 1.3;
    dots.forEach((d, i) => { d.visible = i <= Math.floor(time * 0.8) % 4; });
    stickRings.forEach((r, i) => { r.scale.setScalar(1 + 0.02 * Math.sin(time * 3 + i * Math.PI)); });
    if (!reduce) pressTick(time, t);
  };
  return { group, parts, tick, spin: 0, angle: 0, elevation: 0.24, footR: 1.2 };
}

/** White wings, black centre, big touchpad, sticks side by side. @type {import("../burst-qr").BurstObjectBuilder} */
export function padTwoTone(kit) {
  const { V } = kit;
  return buildPad(kit, {
    right: [
      [[0.5, 0.74], [1.05, 0.74], [1.38, 0.64]],
      [[1.62, 0.56], [1.74, 0.36], [1.76, 0.08]],
      [[1.8, -0.42], [1.9, -0.95], [1.74, -1.32]],
      [[1.6, -1.6], [1.18, -1.58], [1.06, -1.28]],
      [[0.94, -0.95], [0.78, -0.52], [0.46, -0.42]],
      [[0.3, -0.39], [0.14, -0.38], [0, -0.38]],
    ],
    shell: '#eceef1', side: '#d5d8dd', shellRough: 0.32, clearcoat: 0.9, well: '#16171a',
    plate: { w: 1.42, h: 1.1, y: 0.07, r: 0.3 },
    touchpad: { w: 0.84, h: 0.46, y: 0.44 },
    DPAD: V(-1.12, 0.22), FACE: V(1.12, 0.22), STICKS: [V(-0.4, -0.16), V(0.4, -0.16)], HOME: V(0, -0.1),
    small: [[-0.6, 0.56], [0.6, 0.56], [0, -0.3]], dotsY: 0.16,
    dpadColor: '#b9bec6', btnColor: '#3a3e45', bumpColor: '#d9dce1', trigColor: '#cfd3d9', studColor: '#c4c8cf',
    shoulderX: 1.14, shoulderY: 0.9,
    grip: (x, y) => Math.abs(x) > 0.85 && y < -0.3,
  });
}

/** Rounder matte black pad, left stick high and right stick low. @type {import("../burst-qr").BurstObjectBuilder} */
export function padOffset(kit) {
  const { V } = kit;
  return buildPad(kit, {
    right: [
      [[0.45, 0.62], [0.95, 0.72], [1.25, 0.62]],
      [[1.52, 0.52], [1.62, 0.25], [1.62, -0.05]],
      [[1.62, -0.45], [1.55, -0.85], [1.36, -1.06]],
      [[1.18, -1.25], [0.9, -1.18], [0.8, -0.98]],
      [[0.68, -0.76], [0.55, -0.58], [0.34, -0.56]],
      [[0.2, -0.55], [0.1, -0.54], [0, -0.54]],
    ],
    shell: '#1b1c1f', side: '#26282c', shellRough: 0.58, clearcoat: 0.15, well: '#0b0b0c',
    DPAD: V(-0.46, -0.24), FACE: V(0.92, 0.24), STICKS: [V(-0.92, 0.24), V(0.46, -0.24)], HOME: V(0, 0.46),
    homeScale: 1.6,
    small: [[-0.2, 0.16], [0.2, 0.16], [0, 0.04]], dotsY: 0.58,
    dpadColor: '#2b2e33', btnColor: '#2a2d31', bumpColor: '#222428', trigColor: '#17191b', studColor: '#34373c',
    shoulderX: 0.98, shoulderY: 0.78,
    grip: (x, y) => Math.abs(x) > 0.72 && y < -0.3,
  });
}

/** Pro pad: offset sticks, lime-striped faceplate, four back paddles, a wider idle turn to show them. @type {import("../burst-qr").BurstObjectBuilder} */
export function padPro(kit) {
  const { V } = kit;
  return buildPad(kit, {
    right: [
      [[0.42, 0.66], [0.9, 0.74], [1.24, 0.64]],
      [[1.5, 0.56], [1.64, 0.3], [1.66, 0.0]],
      [[1.68, -0.42], [1.6, -0.86], [1.4, -1.1]],
      [[1.2, -1.32], [0.9, -1.24], [0.8, -1.0]],
      [[0.7, -0.78], [0.56, -0.6], [0.34, -0.58]],
      [[0.2, -0.57], [0.1, -0.56], [0, -0.56]],
    ],
    shell: '#141517', side: '#1f2124', shellRough: 0.62, clearcoat: 0.1, well: '#0b0b0c',
    faceplate: true,
    paddles: [[-1.24, -1.12, -0.35], [-1.0, -1.1, -0.2], [1.0, -1.1, 0.2], [1.24, -1.12, 0.35]],
    swing: 0.8,
    DPAD: V(-0.46, -0.24), FACE: V(0.92, 0.24), STICKS: [V(-0.92, 0.24), V(0.46, -0.24)], HOME: V(0, 0.46),
    homeScale: 1.4,
    small: [[-0.2, 0.18], [0.2, 0.18]], dotsY: 0.62,
    dpadColor: '#2b2e33', btnColor: '#25282c', bumpColor: '#222428', trigColor: '#17191b', studColor: '#2a2d31',
    shoulderX: 0.98, shoulderY: 0.78,
    grip: (x, y) => Math.abs(x) > 0.74 && y < -0.42,
  });
}

/** Compact keyboard and a mouse on a desk mat. @type {import("../burst-qr").BurstObjectBuilder} */
export function pcSetup(kit) {
  const LIME = accent(kit);
  const { THREE, rand, paint, V, rig, reduce } = kit;
  const { roundBox, qz } = kitHelpers(kit);
  const group = new THREE.Group(), parts = [];
  const desk = new THREE.Group(); desk.rotation.x = -Math.PI / 2; group.add(desk); desk.updateMatrix(); // local x right, y away, z up
  const FLAT = desk.matrix.clone();
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); desk.add(m); return m; };
  const part = (geometry, material, pos, q = new THREE.Quaternion(), s = V(1, 1, 1), extra = {}) =>
    parts.push({ geometry, material, matrix: FLAT.clone().multiply(new THREE.Matrix4().compose(pos, q, s)), ...extra });

  const glowMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.6, roughness: 0.4 });

  // desk mat with a lime stitched edge
  const MAT = { w: 4.6, h: 1.9, x: 0.35, y: 0 };
  add(roundBox(MAT.w, MAT.h, 0.025, 0.14, 0.008), new THREE.MeshPhysicalMaterial({ color: '#0f1012', roughness: 0.9 }), MAT.x, MAT.y, 0);
  const mw = MAT.w / 2 - 0.05, mh = MAT.h / 2 - 0.05;
  const edge = new THREE.CatmullRomCurve3([V(-mw, -mh, 0), V(mw, -mh, 0), V(mw, mh, 0), V(-mw, mh, 0)].map((p) => p.add(V(MAT.x, MAT.y, 0.03))), true, 'catmullrom', 0.02);
  add(new THREE.TubeGeometry(edge, 200, 0.008, 6, true), glowMat).userData.noShadow = true;

  // keyboard case and the RGB plate under the keys
  const U = 0.19, KW = 15 * U, KH = 5 * U, KX = -0.45, KY = 0.02;
  add(roundBox(KW + 0.16, KH + 0.16, 0.12, 0.07, 0.03), new THREE.MeshPhysicalMaterial({ color: '#1c1e22', roughness: 0.38, metalness: 0.6, clearcoat: 0.4 }), KX, KY, 0.03);
  const under = add(new THREE.PlaneGeometry(KW, KH), glowMat, KX, KY, 0.185); under.userData.noShadow = true;
  // a thin lime line where the case meets the mat
  const g2 = new THREE.CatmullRomCurve3([V(-1, -1, 0), V(1, -1, 0), V(1, 1, 0), V(-1, 1, 0)].map((p) => V(KX + p.x * (KW / 2 + 0.09), KY + p.y * (KH / 2 + 0.09), 0.035)), true, 'catmullrom', 0.05);
  const glowLine = add(new THREE.TubeGeometry(g2, 160, 0.01, 6, true), glowMat); glowLine.userData.noShadow = true;

  // keycaps: one geometry (and one material) per width; lime caps for Esc, WASD and Enter
  const caps = new Map();
  const capGeo = (w, lit) => {
    const k = `${w}${lit ? 'L' : ''}`;
    if (!caps.has(k)) {
      const g = roundBox(w * U - 0.03, U - 0.03, 0.075, 0.025, 0.012);
      paint(g, (x, y, z) => (lit ? [LIME, 0.75 + 4 * z] : ['#2a2d32', 0.55 + 6 * z]));
      g.userData.press = 'press';
      caps.set(k, { g, m: { roughness: 0.48, metalness: 0.05, clearcoat: 0.3, envMapIntensity: 0.4 } });
    }
    return caps.get(k);
  };
  const rows = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
    [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
    [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
  ];
  const litKeys = new Set(['0:0', '1:2', '2:1', '2:2', '2:3', '2:12']); // Esc, W, A, S, D, Enter
  rows.forEach((row, r) => {
    let x = KX - KW / 2;
    row.forEach((w, i) => {
      const { g, m } = capGeo(w, litKeys.has(`${r}:${i}`));
      part(g, m, V(x + (w * U) / 2, KY + KH / 2 - U / 2 - r * U, 0.19));
      x += w * U;
    });
  });

  // mouse: a smooth shell, lime wheel and a light ring at its base
  const MX = 2.0, MY = -0.05;
  const shell = add(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshPhysicalMaterial({ color: '#17191c', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }), MX, MY, 0.03);
  shell.scale.set(0.3, 0.5, 0.2);
  const base = add(new THREE.TorusGeometry(1, 0.02, 8, 96), glowMat, MX, MY, 0.05); base.scale.set(0.29, 0.49, 1); base.userData.noShadow = true;
  const wheel = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 24); wheel.rotateZ(Math.PI / 2); wheel.rotateX(Math.PI / 2);
  paint(wheel, () => [LIME, 1]); wheel.userData.press = 'press';
  part(wheel, { roughness: 0.4 }, V(MX, MY + 0.2, 0.22));
  const btnGeo = roundBox(0.2, 0.3, 0.03, 0.08, 0.01); paint(btnGeo, (x, y, z) => ['#2b2e33', 0.6 + 8 * z]); btnGeo.userData.press = 'press';
  for (const sx of [-1, 1]) part(btnGeo, { roughness: 0.4, clearcoat: 0.6 }, V(MX + sx * 0.11, MY + 0.27, 0.17), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.32));

  // lime sparks hidden under the keyboard: they fill the rest of the code
  const spark = new THREE.OctahedronGeometry(0.5, 0);
  paint(spark, () => [LIME, 1.1]);
  for (let i = 0; i < 120; i++) part(spark, { roughness: 0.35, metalness: 0.1 }, V(KX + (rand() - 0.5) * KW, KY + (rand() - 0.5) * KH, 0.1), qz(rand() * 6), V(0.07, 0.07, 0.07), { hidden: true });

  const pressTick = makePressTick(THREE, V, rig);
  const tick = (time, t, ptr, style) => {
    const neon = style === 'neon', live = 1 - smooth(0, 0.35, t);
    const look = ptr && ptr.active ? ptr.x * 0.15 : 0;
    rig.rotation.set(0, 0.22 * Math.sin(time * 0.3) + look, 0);
    glowMat.emissiveIntensity = (neon ? 2.2 : 1.3) * (0.7 + 0.3 * Math.sin(time * 1.8)) * (0.35 + 0.65 * live);
    if (!reduce) pressTick(time, t);
  };
  return { group, parts, tick, spin: 0, angle: 0, elevation: 0.62, footR: 2.4 };
}
