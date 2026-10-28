// A premium gamepad of our own design for the IMPerfect lab (no console maker's shapes, logos or button symbols).
// Glossy black shell with a honeycomb grip texture, symmetric thumbsticks, d-pad, four plain face buttons with lime
// light rings, bumpers and triggers, and an RGB light strip in the team's lime running around the face.
// It hovers over a lime ring on the floor. On tap the grip tiles, buttons, sticks, bumpers and lime sparks fly into the code.
// Idle: float and a slow turn, the strip runs and pulses, a button or stick moves now and then. Reduced motion: still.
// Needs an engine with the 'neon' style and tick(time, t, pointer, style) (the IMPerfect copy); works without them too.
export const controllerPalette = { dark: '#0b0f02', bg: '#e9eae4', wash: '#b3c93a', night: '#0a0b08', glow: '#C8E400', glow2: '#effcc4' };

const LIME = '#C8E400';
const FZ = 0.31; // front face of the shell (z)

/** @type {import("../burst-qr").BurstObjectBuilder} */
export function controller({ THREE, rand, paint, V, rig, reduce }) {
  const group = new THREE.Group(), parts = [];
  const body = new THREE.Group(); // tilted back so the face looks up at the camera
  body.rotation.x = -0.34; group.add(body); body.updateMatrix();
  const TILT = body.matrix.clone();
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const part = (geometry, material, pos, q = new THREE.Quaternion(), s = 1, extra = {}) =>
    parts.push({ geometry, material, matrix: TILT.clone().multiply(new THREE.Matrix4().compose(pos, q, V(s, s, s))), ...extra });
  const qz = (a) => new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), a);

  // ---------- shell outline: right half as bezier segments, the left half is its mirror ----------
  const right = [
    [[0.5, 0.66], [0.95, 0.75], [1.2, 0.73]],
    [[1.48, 0.71], [1.62, 0.48], [1.63, 0.18]],
    [[1.64, -0.22], [1.64, -0.72], [1.44, -1.04]],
    [[1.3, -1.25], [0.98, -1.26], [0.86, -1.06]],
    [[0.72, -0.84], [0.64, -0.56], [0.42, -0.5]],
    [[0.26, -0.46], [0.12, -0.46], [0, -0.46]],
  ];
  const sh = new THREE.Shape(); sh.moveTo(0, 0.66);
  for (const [c1, c2, p] of right) sh.bezierCurveTo(...c1, ...c2, ...p);
  for (let i = right.length - 1; i >= 0; i--) {
    const [c1, c2] = right[i], s0 = i ? right[i - 1][2] : [0, 0.66];
    sh.bezierCurveTo(-c2[0], c2[1], -c1[0], c1[1], -s0[0], s0[1]);
  }
  const shellGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 10, curveSegments: 48 });
  shellGeo.translate(0, 0, -0.17);
  const shellMat = new THREE.MeshPhysicalMaterial({ color: '#0d0e0f', roughness: 0.34, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.22 });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: '#1c1e20', roughness: 0.42, metalness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.45 });
  add(shellGeo, [shellMat, sideMat]);

  // outline as a polygon, for the light strip and to keep tiles inside
  const poly = sh.getSpacedPoints(260).slice(0, -1);
  const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
  const edgeDist = (x, y) => { let d = 9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ab = V(b.x - a.x, b.y - a.y), t = Math.max(0, Math.min(1, ((x - a.x) * ab.x + (y - a.y) * ab.y) / ab.lengthSq())); d = Math.min(d, Math.hypot(a.x + ab.x * t - x, a.y + ab.y * t - y)); } return d; };

  // ---------- RGB light strip: a tube just inside the edge, with a running emissive pattern ----------
  const stripC = document.createElement('canvas'); stripC.width = 512; stripC.height = 4;
  const sg = stripC.getContext('2d'), grad = sg.createLinearGradient(0, 0, 512, 0);
  for (let i = 0; i <= 8; i++) { const k = i / 8; grad.addColorStop(k, i % 2 ? 'rgb(70,80,0)' : 'rgb(255,255,255)'); }
  sg.fillStyle = grad; sg.fillRect(0, 0, 512, 4);
  const stripTex = new THREE.CanvasTexture(stripC); stripTex.colorSpace = THREE.SRGBColorSpace; stripTex.wrapS = THREE.RepeatWrapping; stripTex.repeat.set(3, 1);
  const stripMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveMap: stripTex, emissiveIntensity: 1.6, roughness: 0.35 });
  const inset = poly.map((p, i) => {
    const a = poly[(i + poly.length - 1) % poly.length], b = poly[(i + 1) % poly.length], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
    return V(p.x + (ty / l) * 0.06, p.y - (tx / l) * 0.06, FZ + 0.004); // clockwise outline: (ty, -tx) points inside
  });
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inset, true), 400, 0.016, 8, true), stripMat).userData.noShadow = true;

  // ---------- wells under the controls, with glowing rings ----------
  const wellMat = new THREE.MeshPhysicalMaterial({ color: '#070708', roughness: 0.55, metalness: 0.2 });
  const ringMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.2, roughness: 0.4 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#c9ccd1', metalness: 1, roughness: 0.18 });
  const well = (x, y, r, lit) => {
    const w = add(new THREE.CylinderGeometry(r, r, 0.02, 64), wellMat, x, y, FZ - 0.004); w.rotation.x = Math.PI / 2;
    const ring = add(new THREE.TorusGeometry(r, 0.011, 10, 96), lit ? ringMat : chrome, x, y, FZ + 0.004);
    return ring;
  };
  const DPAD = V(-0.92, 0.2), FACE = V(0.92, 0.2), STICKS = [V(-0.5, -0.24), V(0.5, -0.24)];
  well(DPAD.x, DPAD.y, 0.27, false); well(FACE.x, FACE.y, 0.3, false);
  const stickRings = STICKS.map((p) => well(p.x, p.y, 0.215, true));
  // stick bases: dark domes the caps sit on
  for (const p of STICKS) { const d = add(new THREE.SphereGeometry(0.15, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), wellMat, p.x, p.y, FZ); d.rotation.x = Math.PI / 2; d.scale.y = 0.45; }
  // player lights: four small lime dots above the home button
  const dotMat = new THREE.MeshStandardMaterial({ color: '#141a00', emissive: LIME, emissiveIntensity: 1.4 });
  const dots = [-0.09, -0.03, 0.03, 0.09].map((x) => { const d = add(new THREE.SphereGeometry(0.011, 12, 8), dotMat, x, 0.5, FZ + 0.003); d.scale.z = 0.4; return d; });

  // ---------- controls (parts) ----------
  const btnMat = { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, metalness: 0.1, envMapIntensity: 0.9 };
  const rubber = { roughness: 0.7, envMapIntensity: 0.5 };
  const satin = { roughness: 0.5, metalness: 0.05, envMapIntensity: 0.3 }; // flat tops: gloss would mirror the light and read white
  const satin2 = { ...satin }; // one material per geometry
  const roundBox = (w, h, d, r, bev = 0.012) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -bev); return g; // back face at z = 0
  };
  const lathe = (pts, seg = 40) => { const g = new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg); g.rotateX(Math.PI / 2); return g; };
  const shade = (z0, z1, lo = 0.55, hi = 1.1) => (z) => lo + (hi - lo) * Math.max(0, Math.min(1, (z - z0) / (z1 - z0)));

  // d-pad: four arms
  const arm = roundBox(0.11, 0.15, 0.045, 0.03);
  const armS = shade(0, 0.057);
  paint(arm, (x, y, z) => ['#26292d', armS(z)]); arm.userData.press = 'press';
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; part(arm, satin, V(DPAD.x + Math.sin(a) * 0.11, DPAD.y + Math.cos(a) * 0.11, FZ), qz(-a)); }
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 32), new THREE.MeshPhysicalMaterial({ color: '#202326', roughness: 0.3, clearcoat: 1 }), DPAD.x, DPAD.y, FZ + 0.02).rotation.x = Math.PI / 2;

  // face buttons: smoky domes with a lime light ring on top, no symbols
  const btn = lathe([[0, 0.07], [0.036, 0.068], [0.042, 0.067], [0.05, 0.065], [0.056, 0.062], [0.075, 0.05], [0.083, 0.03], [0.085, 0]]);
  paint(btn, (x, y, z) => { const r = Math.hypot(x, y); return r > 0.04 && r < 0.054 && z > 0.06 ? [LIME, 1.15] : ['#2a2d31', 0.5 + 8 * z]; });
  btn.userData.press = 'press';
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; part(btn, btnMat, V(FACE.x + Math.sin(a) * 0.19, FACE.y + Math.cos(a) * 0.19, FZ)); }

  // thumbstick caps: concave top with a raised grip rim
  const cap = lathe([[0, 0.135], [0.06, 0.128], [0.11, 0.14], [0.142, 0.15], [0.158, 0.138], [0.16, 0.11], [0.13, 0.085], [0.06, 0.07], [0.055, 0]], 48);
  paint(cap, (x, y, z) => { const r = Math.hypot(x, y); return r > 0.135 && z > 0.12 ? ['#55585e', 1] : ['#1b1c1f', 0.6 + 3 * z]; });
  cap.userData.press = 'tilt';
  for (const p of STICKS) part(cap, rubber, V(p.x, p.y, FZ + 0.03));

  // centre: two pill buttons and a round home button
  const pill = roundBox(0.11, 0.045, 0.02, 0.02, 0.008);
  paint(pill, (x, y, z) => ['#2c2f33', 0.6 + 12 * z]); pill.userData.press = 'press';
  for (const sx of [-1, 1]) part(pill, satin2, V(sx * 0.22, 0.34, FZ));
  const home = lathe([[0, 0.032], [0.04, 0.03], [0.05, 0.022], [0.055, 0]]);
  paint(home, (x, y, z) => (Math.hypot(x, y) > 0.044 ? [LIME, 1.1] : ['#1e2023', 0.7 + 10 * z])); home.userData.press = 'press';
  part(home, btnMat, V(0, 0.15, FZ));

  // bumpers and triggers along the top edge (built facing +Z, turned to face up)
  const up = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2);
  const bump = roundBox(0.56, 0.2, 0.07, 0.07);
  paint(bump, (x, y, z) => (y > 0.075 ? [LIME, 0.9] : ['#202326', 0.6 + 6 * z]));
  const trig = roundBox(0.44, 0.26, 0.13, 0.1);
  paint(trig, (x, y, z) => ['#17191b', 0.55 + 4 * z]);
  for (const sx of [-1, 1]) {
    part(bump, btnMat, V(sx * 0.98, 0.82, 0.07), up.clone().multiply(qz(sx * 0.1)));
    part(trig, btnMat, V(sx * 0.98, 0.82, -0.17), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -Math.PI / 2 + 0.35).multiply(qz(sx * 0.1)));
  }

  // honeycomb grip tiles on both grips
  const hex = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 6, 1); hex.rotateX(Math.PI / 2); hex.rotateZ(Math.PI / 6);
  paint(hex, (x, y, z) => ['#2c2f34', z < 0 ? 0.3 : 0.4 + 0.55 * Math.min(1, Math.hypot(x, y) * 2.2)]);
  const hexLit = hex.clone(); paint(hexLit, (x, y, z) => [LIME, z < 0 ? 0.3 : 0.75 + 0.35 * Math.min(1, Math.hypot(x, y) * 2.2)]);
  const hexMat = { roughness: 0.62, metalness: 0.1, envMapIntensity: 0.35 }; // matte rubber grip
  const hexLitMat = { ...hexMat }; // one material per geometry
  const R = 0.043, dx = Math.sqrt(3) * R, dy = 1.5 * R;
  const clear = [[DPAD, 0.33], [FACE, 0.36], [STICKS[0], 0.27], [STICKS[1], 0.27], [V(0, 0.15), 0.12]];
  for (let row = 0, y = -1.3; y < 0.1; row++, y += dy)
    for (let x = -1.7 + (row % 2) * dx / 2; x < 1.7; x += dx) {
      const fadeIn = (0.05 - y) / 0.25; // ragged top edge: the pattern thins out going up
      if (Math.abs(x) < 0.66 || !inside(x, y) || edgeDist(x, y) < 0.13 || clear.some(([c, r]) => Math.hypot(x - c.x, y - c.y) < r)) continue;
      if (fadeIn < 1 && rand() > fadeIn) continue;
      const lit = rand() < 0.09;
      part(lit ? hexLit : hex, lit ? hexLitMat : hexMat, V(x, y, FZ + 0.004), qz(0), R * 2 * 0.9);
    }

  // lime sparks hidden inside the shell: they burst out and fill the rest of the code
  const spark = new THREE.OctahedronGeometry(0.5, 0);
  paint(spark, () => [LIME, 1.1]);
  for (let i = 0; i < 140; i++) part(spark, { roughness: 0.35, metalness: 0.1 }, V((rand() - 0.5) * 2.4, (rand() - 0.5) * 1.2 - 0.1, (rand() - 0.5) * 0.2), qz(rand() * 6), 0.07, { hidden: true });

  // hover pad: a lime ring on the floor under the controller
  const padY = -1.62;
  const pad = add(new THREE.TorusGeometry(1.05, 0.016, 10, 160), ringMat, 0, padY, 0.05, group); pad.rotation.x = Math.PI / 2; pad.userData.noShadow = true;
  const pad2 = add(new THREE.TorusGeometry(0.82, 0.008, 8, 160), dotMat, 0, padY, 0.05, group); pad2.rotation.x = Math.PI / 2; pad2.userData.noShadow = true;

  // ---------- idle motion ----------
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const press = { mesh: null, i: 0, start: 0, next: 1.2, kind: 'press', ax: V(1, 0, 0) }, base = new THREE.Matrix4(), tmp = new THREE.Matrix4(), sc = V();
  // The engine only writes piece matrices while the burst moves. At rest (t = 0) this moves one button instance and puts it back.
  function pressTick(time, t) {
    if (t > 0) { press.mesh = null; return; } // the engine owns the pieces while they move
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
  }

  const tick = (time, t, ptr, style) => {
    const neon = style === 'neon', live = 1 - smooth(0, 0.35, t);
    const look = ptr && ptr.active ? ptr.x * 0.18 : 0;
    rig.position.y = 0.07 * Math.sin(time * 1.3);
    rig.rotation.set(0.04 * Math.sin(time * 0.9), 0.42 * Math.sin(time * 0.32) + look, 0.025 * Math.sin(time * 0.7));
    stripTex.offset.x = -time * 0.1;
    stripMat.emissiveIntensity = (neon ? 2.4 : 1.5) * (0.78 + 0.22 * Math.sin(time * 2.2)) * live;
    ringMat.emissiveIntensity = (neon ? 1.8 : 1.1) * (0.7 + 0.3 * Math.sin(time * 2.2 + 1.5));
    dotMat.emissiveIntensity = neon ? 2 : 1.3;
    dots.forEach((d, i) => { d.visible = i <= Math.floor(time * 0.8) % 4; });
    stickRings.forEach((r, i) => { r.scale.setScalar(1 + 0.02 * Math.sin(time * 3 + i * Math.PI)); });
    if (!reduce) pressTick(time, t);
  };

  return { group, parts, tick, spin: 0, angle: 0, elevation: 0.24, footR: 1.15 };
}
