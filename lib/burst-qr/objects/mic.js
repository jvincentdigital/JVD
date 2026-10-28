// A studio microphone on a desk stand: round weighted base, yoke mount, pop filter on a gooseneck and a cable.
// The grille is made of hundreds of small perforated hex tiles. On tap they fly into the QR squares.
// Idle: sound-wave rings pulse out from the grille, an equalizer ring on the floor bounces, the status light breathes.
// Generic design: no brand, no logo. Works with the Frecuencia 787 engine copy (styles realistic, watercolor, neon).
export const micPalette = { dark: '#05121a', bg: '#eef2f4', wash: '#7fb6c8', night: '#04060a', glow: '#16e0ff', glow2: '#ff3da6' };

/** @type {import("../burst-qr").BurstObjectBuilder} */
export function mic({ THREE, rand, paint, V }) {
  const group = new THREE.Group(), parts = [];
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); group.add(m); return m; };
  const lathe = (pts, mat, y = 0, seg = 72) => add(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg), mat, 0, y);

  const matte = new THREE.MeshPhysicalMaterial({ color: '#16191f', metalness: 0.55, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  const gun = new THREE.MeshPhysicalMaterial({ color: '#2a2f38', metalness: 0.85, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#dfe3e8', metalness: 1, roughness: 0.14 });
  const rubber = new THREE.MeshPhysicalMaterial({ color: '#0c0d10', roughness: 0.85 });
  const glow = new THREE.MeshStandardMaterial({ color: '#06323b', emissive: '#16e0ff', emissiveIntensity: 1.6, roughness: 0.4 });
  const rec = new THREE.MeshStandardMaterial({ color: '#3a0a20', emissive: '#ff3da6', emissiveIntensity: 2, roughness: 0.4 });

  // weighted base and pole
  lathe([[0, 0], [0.5, 0], [0.54, 0.012], [0.555, 0.04], [0.55, 0.07], [0.52, 0.085], [0.2, 0.1], [0.08, 0.11], [0, 0.11]], matte);
  lathe([[0.5, 0.002], [0.53, 0.008], [0.52, 0.016], [0.49, 0.012]], rubber);
  add(new THREE.CylinderGeometry(0.03, 0.034, 0.86, 24), gun, 0, 0.53);
  lathe([[0, 0], [0.06, 0], [0.065, 0.04], [0.05, 0.07], [0, 0.07]], chrome, 0.1);

  // yoke: a U around the body with two big knobs at the pivots
  const yoke = new THREE.CatmullRomCurve3([V(-0.285, 1.33, 0), V(-0.29, 1.05, 0), V(-0.2, 0.95, 0), V(0, 0.93, 0), V(0.2, 0.95, 0), V(0.29, 1.05, 0), V(0.285, 1.33, 0)]);
  add(new THREE.TubeGeometry(yoke, 64, 0.022, 12), gun);
  for (const sx of [-1, 1]) {
    const k = add(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 32), matte, sx * 0.315, 1.33, 0); k.rotation.z = Math.PI / 2;
    const c = add(new THREE.CylinderGeometry(0.03, 0.03, 0.054, 24), chrome, sx * 0.318, 1.33, 0); c.rotation.z = Math.PI / 2;
  }

  // body: machined cylinder with fine grooves, glowing ring on top, a small on-air light on the front
  const body = [[0, 1.02], [0.12, 1.02], [0.19, 1.035], [0.215, 1.07], [0.22, 1.12]];
  for (let i = 0; i < 4; i++) { const y = 1.16 + i * 0.03; body.push([0.22, y], [0.214, y + 0.006], [0.22, y + 0.012]); }
  body.push([0.22, 1.56], [0.224, 1.57], [0, 1.57]);
  lathe(body.map(([r, y]) => [r, y - 1.02]), gun, 1.02);
  const ring = add(new THREE.TorusGeometry(0.222, 0.009, 12, 96), glow, 0, 1.575); ring.rotation.x = Math.PI / 2;
  lathe([[0.226, 0], [0.228, 0.03], [0.222, 0.045], [0.21, 0.05]], chrome, 1.585);
  const led = add(new THREE.SphereGeometry(0.012, 16, 10), rec, 0, 1.47, 0.218); led.scale.z = 0.5;
  // inner capsule: the dark core you see through the gaps in the grille
  lathe([[0.2, 0], [0.2, 0.37], ...Array.from({ length: 13 }, (_, i) => { const a = (i + 1) / 13 * Math.PI / 2; return [0.2 * Math.cos(a), 0.37 + 0.2 * Math.sin(a)]; })], new THREE.MeshStandardMaterial({ color: '#07080a', roughness: 0.9 }), 1.6, 48);

  // grille tiles: hex discs with a dark centre, so the shell reads as perforated metal
  const hex = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 6, 1);
  hex.rotateX(Math.PI / 2);
  paint(hex, (x, y, z) => ['#c3c9d1', z < 0 ? 0.3 : 0.32 + 1.15 * Math.min(1, Math.hypot(x, y) * 2.1)]);
  const tileMat = { metalness: 0.75, roughness: 0.4, envMapIntensity: 0.9 };
  const R = 0.218, cols = 30, step = (2 * Math.PI * R) / cols, sc = step * 0.96, Y = 1.61;
  const tile = (pos, normal, hidden) => {
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), normal);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 6));
    parts.push({ geometry: hex, material: tileMat, matrix: new THREE.Matrix4().compose(pos, q, V(sc, sc, sc)), hidden });
  };
  const rows = Math.floor(0.36 / (step * 0.866));
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c < cols; c++) {
      const a = ((c + (r % 2) * 0.5) / cols) * Math.PI * 2, n = V(Math.sin(a), 0, Math.cos(a));
      tile(V(n.x * R, Y + r * step * 0.866, n.z * R), n);
    }
  const capN = Math.round((2 * Math.PI * R * R) / (step * step * 0.866));
  const top = Y + 0.36;
  for (let i = 0; i < capN; i++) { // Fibonacci dome
    const h = 1 - (i + 0.5) / capN, rr = Math.sqrt(1 - h * h), a = i * 2.39996;
    if (h < 0.06) continue;
    const n = V(Math.cos(a) * rr, h, Math.sin(a) * rr);
    tile(V(n.x * R, top + n.y * R, n.z * R), n);
  }
  // spare tiles hidden inside the capsule burst out if the code needs more squares
  for (let i = 0; i < 90; i++) { const a = rand() * 6.28; tile(V(Math.cos(a) * 0.1, Y + 0.05 + rand() * 0.4, Math.sin(a) * 0.1), V(Math.sin(a), 0, Math.cos(a)), true); }

  // pop filter on a gooseneck clamped to the pole
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 20), matte, 0, 0.82);
  const neck = new THREE.CatmullRomCurve3([V(0.04, 0.82, 0.03), V(0.2, 0.92, 0.22), V(0.24, 1.18, 0.46), V(0.12, 1.42, 0.6), V(0, 1.48, 0.62)]);
  add(new THREE.TubeGeometry(neck, 64, 0.012, 8), gun);
  const hoop = add(new THREE.TorusGeometry(0.3, 0.016, 12, 96), rubber, 0, 1.79, 0.62);
  const mc = document.createElement('canvas'); mc.width = mc.height = 256;
  const mg = mc.getContext('2d');
  mg.fillStyle = 'rgba(12,14,18,0.16)'; mg.fillRect(0, 0, 256, 256);
  mg.strokeStyle = 'rgba(8,9,12,0.4)'; mg.lineWidth = 1;
  for (let i = 0; i < 256; i += 4) { mg.beginPath(); mg.moveTo(i, 0); mg.lineTo(i, 256); mg.moveTo(0, i); mg.lineTo(256, i); mg.stroke(); }
  const meshTex = new THREE.CanvasTexture(mc); meshTex.colorSpace = THREE.SRGBColorSpace; meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.repeat.set(3, 3);
  add(new THREE.CircleGeometry(0.296, 64), new THREE.MeshStandardMaterial({ map: meshTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.9 }), 0, 1.79, 0.62);
  hoop.renderOrder = 1;

  // cable: out of the bottom of the body, down behind the stand and along the desk
  const cable = new THREE.CatmullRomCurve3([V(0, 1.02, -0.02), V(0, 0.96, -0.1), V(0.05, 0.7, -0.22), V(0.12, 0.25, -0.38), V(0.2, 0.02, -0.62), V(0.36, 0.015, -0.82)]);
  add(new THREE.TubeGeometry(cable, 80, 0.016, 10), rubber);

  // equalizer ring on the desk around the base
  const bars = [], barGeo = new THREE.BoxGeometry(0.022, 1, 0.045); barGeo.translate(0, 0.5, 0);
  const barMat = new THREE.MeshStandardMaterial({ color: '#04161c', emissive: '#16e0ff', emissiveIntensity: 0.9, roughness: 0.5 });
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2, b = add(barGeo, barMat, Math.sin(a) * 0.7, 0.002, Math.cos(a) * 0.7);
    b.rotation.y = a; b.scale.y = 0.05; bars.push(b);
  }

  // sound-wave rings around the grille
  const waveMat = new THREE.MeshBasicMaterial({ color: '#16e0ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const waves = [0, 1, 2].map(() => { const w = add(new THREE.TorusGeometry(1, 0.012, 8, 128), waveMat.clone(), 0, 1.8); w.rotation.x = Math.PI / 2; w.scale.setScalar(0.3); return w; });

  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const tick = (time, t, style) => {
    const live = 1 - smooth(0, 0.35, t), neon = style === 'neon';
    bars.forEach((b, i) => { b.scale.y = 0.02 + 0.11 * Math.abs(Math.sin(time * 2.6 + i * 0.75) * Math.sin(time * 1.3 + i * 0.29)); });
    waves.forEach((w, i) => {
      const ph = (time * 0.4 + i / 3) % 1, r = 0.27 + ph * 0.5;
      w.scale.set(r, r, r * 0.4 + 0.6);
      w.material.opacity = (neon ? 0.7 : 0.45) * Math.pow(1 - ph, 1.6) * live;
      w.material.blending = neon ? THREE.AdditiveBlending : THREE.NormalBlending;
      w.material.color.set(neon ? '#16e0ff' : '#0b9bbd');
    });
    barMat.emissiveIntensity = neon ? 0.75 : 0.9;
    glow.emissiveIntensity = (neon ? 2.2 : 1.3) + 0.5 * Math.sin(time * 2);
    rec.emissiveIntensity = 1.6 + 0.8 * Math.sin(time * 3.1);
  };

  return { group, parts, tick, elevation: 0.26, footR: 0.6 };
}
