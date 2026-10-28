// Small-business objects for the 3D QR gallery, our own designs, no brands or logos:
// barber (pole, scissors, comb), salon (nail polish, lipstick, glitter), bakery (layer cake on a stand).
// Each bursts into the QR: the visible small pieces fly first, more pieces burst out of the main object.
export const barberPalette = { dark: '#14161f', bg: '#f1f0ec', wash: '#5f7fb8' };
export const salonPalette = { dark: '#2a0f1c', bg: '#f8eef1', wash: '#d9779b' };
export const bakeryPalette = { dark: '#2b1610', bg: '#fbf3ea', wash: '#e7a2b4' };

const phys = (THREE, o) => new THREE.MeshPhysicalMaterial(o);
const chrome = (THREE) => phys(THREE, { color: '#e3e5e8', metalness: 1, roughness: 0.16 });
const q = (THREE, x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
const M = (THREE, p, r, s) => new THREE.Matrix4().compose(p, r, typeof s === 'number' ? new THREE.Vector3(s, s, s) : s);
const lathe = (THREE, group, pts, mat, y = 0, seg = 64) => {
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), seg), mat);
  m.position.y = y; group.add(m); return m;
};
const put = (THREE, group, geo, mat, x = 0, y = 0, z = 0, r = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(...r); group.add(m); return m;
};
// pieces scattered on a disc on the table (visible) or hidden inside a box (burst out on tap)
const scatter = (THREE, rand, parts, geo, mat, colors, n, { r0 = 0.9, r1 = 1.3, y = 0.02, s = 0.08, hidden = false, box } = {}) => {
  for (let i = 0; i < n; i++) {
    let p;
    if (box) p = new THREE.Vector3(box[0] + rand() * (box[1] - box[0]), box[2] + rand() * (box[3] - box[2]), box[4] + rand() * (box[5] - box[4]));
    else { const a = rand() * 6.28, r = r0 + Math.pow(rand(), 1.5) * (r1 - r0); p = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r); }
    const k = s * (0.8 + rand() * 0.4);
    parts.push({ geometry: geo, material: mat, color: colors[i % colors.length], hidden, matrix: M(THREE, p, q(THREE, hidden ? rand() * 6 : -Math.PI / 2, 0, rand() * 6.28), k) });
  }
};

/** Barber pole on a chrome base, with scissors and a comb on the counter. @type {import("../burst-qr").BurstObjectBuilder} */
export function barber({ THREE, rand }) {
  const group = new THREE.Group(), parts = [];
  // the stripes: red, white and blue spiral
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d'); g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, 256, 512);
  for (let i = -4; i < 10; i++) for (const [col, off] of [['#c8262c', 0], ['#2b4f9e', 64]]) {
    g.fillStyle = col; g.beginPath();
    const y = i * 128 + off; g.moveTo(0, y); g.lineTo(256, y - 128); g.lineTo(256, y - 128 + 40); g.lineTo(0, y + 40); g.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  put(THREE, group, new THREE.CylinderGeometry(0.28, 0.28, 1.6, 48, 1, true), phys(THREE, { map: tex, roughness: 0.35, clearcoat: 1 }), 0, 1.05, 0);
  put(THREE, group, new THREE.CylinderGeometry(0.34, 0.34, 1.6, 48, 1, true), phys(THREE, { color: '#ffffff', transmission: 1, thickness: 0.05, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 1.05, 0).userData.noShadow = true;
  const ch = chrome(THREE);
  lathe(THREE, group, [[0, 0], [0.42, 0], [0.44, 0.06], [0.38, 0.12], [0.36, 0.25], [0, 0.25]], ch);
  lathe(THREE, group, [[0, 0], [0.38, 0], [0.4, 0.05], [0.3, 0.1], [0.3, 0.14], [0.2, 0.3], [0.12, 0.38], [0, 0.4]], ch, 1.85);
  // scissors: two blades and two rings, lying open on the counter
  const steel = phys(THREE, { color: '#c9ccd1', metalness: 1, roughness: 0.25 });
  for (const s of [-1, 1]) {
    const blade = put(THREE, group, new THREE.BoxGeometry(0.9, 0.02, 0.07), steel, 0.85, 0.02, 0.55, [0, s * 0.18, 0]);
    blade.geometry.translate(0.3, 0, 0);
    put(THREE, group, new THREE.TorusGeometry(0.09, 0.025, 10, 28), phys(THREE, { color: '#1c1c1f', roughness: 0.4 }), 0.75 - 0.18, 0.025, 0.55 + s * 0.12, [Math.PI / 2, 0, 0]);
  }
  // comb
  const comb = new THREE.Group(); comb.position.set(-0.9, 0.02, 0.45); comb.rotation.y = 0.4; group.add(comb);
  const combMat = phys(THREE, { color: '#232327', roughness: 0.35, clearcoat: 0.6 });
  put(THREE, comb, new THREE.BoxGeometry(0.8, 0.03, 0.08), combMat, 0, 0, -0.07);
  for (let i = 0; i < 22; i++) put(THREE, comb, new THREE.BoxGeometry(0.018, 0.03, 0.12), combMat, -0.38 + i * 0.036, 0, 0.03);
  // pieces: cut hair on the counter and stripe chips inside the pole
  const chip = new THREE.BoxGeometry(1, 1, 0.25);
  scatter(THREE, rand, parts, chip, 'matte', ['#2a201c', '#3b2c25', '#1b1512'], 40, { r0: 0.55, r1: 1.2, s: 0.06 });
  scatter(THREE, rand, parts, chip, 'gloss', ['#c8262c', '#f7f7f4', '#2b4f9e'], 150, { hidden: true, box: [-0.2, 0.2, 0.4, 1.7, -0.2, 0.2], s: 0.09 });
  return { group, parts, elevation: 0.3, footR: 1.1 };
}

/** A nail polish bottle and a lipstick with glitter around them. @type {import("../burst-qr").BurstObjectBuilder} */
export function salon({ THREE, rand }) {
  const group = new THREE.Group(), parts = [];
  // nail polish: glass bottle, pink lacquer inside, tall black cap
  const bottle = new THREE.Group(); bottle.position.set(-0.35, 0, 0); group.add(bottle);
  lathe(THREE, bottle, [[0, 0.04], [0.33, 0.04], [0.36, 0.1], [0.37, 0.5], [0.33, 0.62], [0, 0.62]], phys(THREE, { color: '#d63a6e', roughness: 0.15, clearcoat: 1 }));
  lathe(THREE, bottle, [[0, 0], [0.38, 0], [0.42, 0.06], [0.42, 0.62], [0.36, 0.72], [0.16, 0.78], [0.14, 0.86], [0, 0.86]], phys(THREE, { color: '#ffffff', transmission: 1, thickness: 0.3, roughness: 0.04, ior: 1.5, transparent: true })).userData.noShadow = true;
  put(THREE, bottle, new THREE.CylinderGeometry(0.15, 0.17, 0.75, 32), phys(THREE, { color: '#141416', roughness: 0.25, clearcoat: 1 }), 0, 1.22, 0);
  // lipstick: gold tube and a slanted red bullet
  const lip = new THREE.Group(); lip.position.set(0.55, 0, 0.25); lip.rotation.z = -0.08; group.add(lip);
  const gold = phys(THREE, { color: '#d8b46a', metalness: 1, roughness: 0.25 });
  put(THREE, lip, new THREE.CylinderGeometry(0.16, 0.16, 0.7, 40), gold, 0, 0.35, 0);
  put(THREE, lip, new THREE.CylinderGeometry(0.13, 0.13, 0.22, 40), gold, 0, 0.8, 0);
  const bullet = new THREE.CylinderGeometry(0.11, 0.11, 0.38, 40);
  const bp = bullet.attributes.position; for (let i = 0; i < bp.count; i++) if (bp.getY(i) > 0) bp.setY(i, bp.getY(i) - 0.16 * (bp.getX(i) / 0.11 + 1) * 0.5); bullet.computeVertexNormals();
  put(THREE, lip, bullet, phys(THREE, { color: '#b3123c', roughness: 0.3, clearcoat: 0.8 }), 0, 1.08, 0);
  // pieces: glitter on the table and inside the bottle
  const sequin = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 6); sequin.rotateX(Math.PI / 2);
  const glit = { metalness: 0.8, roughness: 0.2 };
  scatter(THREE, rand, parts, sequin, glit, ['#e8a0b8', '#d8b46a', '#f4d3dc', '#b3123c'], 45, { r0: 0.7, r1: 1.3, s: 0.07 });
  scatter(THREE, rand, parts, sequin, glit, ['#d63a6e', '#e8a0b8', '#d8b46a'], 150, { hidden: true, box: [-0.6, -0.1, 0.1, 0.55, -0.25, 0.25], s: 0.08 });
  return { group, parts, elevation: 0.25, footR: 1.1 };
}

/** A two-layer cake on a stand, with sprinkles and cherries. @type {import("../burst-qr").BurstObjectBuilder} */
export function bakery({ THREE, rand }) {
  const group = new THREE.Group(), parts = [];
  const stand = phys(THREE, { color: '#f7f4ee', roughness: 0.2, clearcoat: 1 });
  lathe(THREE, group, [[0, 0], [0.45, 0], [0.42, 0.05], [0.14, 0.12], [0.1, 0.45], [0.18, 0.5], [0.95, 0.52], [0.96, 0.56], [0, 0.56]], stand);
  const cakeMat = phys(THREE, { color: '#f6d9e2', roughness: 0.6, sheen: 0.5, sheenColor: '#ffffff' });
  const frost = phys(THREE, { color: '#fff7f2', roughness: 0.45, clearcoat: 0.3 });
  put(THREE, group, new THREE.CylinderGeometry(0.78, 0.78, 0.45, 64), cakeMat, 0, 0.79, 0);
  put(THREE, group, new THREE.CylinderGeometry(0.55, 0.55, 0.4, 64), cakeMat, 0, 1.21, 0);
  // frosting rims: little piped dollops around each layer
  for (const [r, y, n] of [[0.78, 1.02, 30], [0.55, 1.42, 22], [0.8, 0.58, 30]]) for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    put(THREE, group, new THREE.SphereGeometry(0.07, 14, 10), frost, Math.cos(a) * r, y, Math.sin(a) * r);
  }
  put(THREE, group, new THREE.CylinderGeometry(0.56, 0.56, 0.03, 64), frost, 0, 1.425, 0);
  // cherries on top
  const cherry = phys(THREE, { color: '#b3123c', roughness: 0.15, clearcoat: 1 });
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; put(THREE, group, new THREE.SphereGeometry(0.08, 18, 14), cherry, Math.cos(a) * 0.32, 1.5, Math.sin(a) * 0.32); }
  // pieces: sprinkles on the top and the stand, more inside the cake
  const spr = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8); spr.rotateZ(Math.PI / 2);
  const sc = ['#f2c14e', '#6cc4a1', '#e7739a', '#7aa7e0', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    const a = rand() * 6.28, r = Math.sqrt(rand()) * 0.45;
    parts.push({ geometry: spr, material: 'gloss', color: sc[i % 5], matrix: M(THREE, new THREE.Vector3(Math.cos(a) * r, 1.45, Math.sin(a) * r), q(THREE, 0, rand() * 6.28, 0), 0.06) });
  }
  scatter(THREE, rand, parts, spr, 'gloss', sc, 150, { hidden: true, box: [-0.4, 0.4, 0.7, 1.3, -0.4, 0.4], s: 0.07 });
  return { group, parts, elevation: 0.35, footR: 1.0 };
}
