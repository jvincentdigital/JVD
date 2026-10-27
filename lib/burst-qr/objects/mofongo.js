// Mofongo relleno de camarones: a dome of mashed fried plantain with chicharrón, shrimp in criolla
// sauce, cilantro, diced peppers and tostones, on a cream plate with a terracotta rim.
// On tap the dome comes apart chunk by chunk and the pieces fly into the QR squares.
export const mofongoPalette = { dark: '#3a1d0b', bg: '#f5f0e8', wash: '#d09a52' };

/** @type {import("../burst-qr").BurstObjectBuilder} */
export function mofongo({ THREE, rand, paint, V }) {
  const group = new THREE.Group(), parts = [];
  const M = (pos, q, s) => new THREE.Matrix4().compose(pos, q, typeof s === 'number' ? V(s, s, s) : s);
  const randQ = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28));
  const tint = (lo, hi) => { const k = lo + rand() * (hi - lo); return new THREE.Color(k, k, k); };

  // plate
  const plate = new THREE.LatheGeometry([[0, 0], [0.5, 0], [0.52, 0.02], [0.55, 0.03], [0.62, 0.04], [0.95, 0.12], [1.12, 0.17], [1.15, 0.18], [1.13, 0.19], [0.94, 0.145], [0.62, 0.065], [0, 0.06]].map(([r, h]) => new THREE.Vector2(r, h)), 96);
  paint(plate, (x, y, z) => { const r = Math.hypot(x, z); return r > 1.03 ? '#b5552b' : r > 1.0 ? '#7a3218' : '#f3eee4'; });
  group.add(new THREE.Mesh(plate, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.07, side: THREE.DoubleSide })));

  // criolla sauce pool
  const sh = new THREE.Shape(), ph = rand() * 6;
  for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2, r = 0.66 * (1 + 0.05 * Math.sin(a * 5 + ph) + 0.03 * Math.sin(a * 11)); i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const sauceGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.03, bevelSegments: 3, curveSegments: 4 });
  paint(sauceGeo, (x, y) => ['#a3290d', 0.8 + 0.3 * Math.hypot(x, y)]);
  const sauce = new THREE.Mesh(sauceGeo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.5 }));
  sauce.rotation.x = -Math.PI / 2; sauce.position.set(0.05, 0.062, 0.05); group.add(sauce);

  // mofongo: a solid core plus a crust of plantain chunks and chicharrón bits
  const R = 0.42, H = 0.5, Y = 0.08;
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9a6526', roughness: 0.9 }));
  core.scale.set(R * 0.93, H * 0.93, R * 0.93); core.position.y = Y; group.add(core);
  const lump = (seed, flat) => { // a rough, knobbly ball (noise depends on position, so seams stay closed)
    const r = ((a) => () => { a = (a * 16807) % 2147483647; return a / 2147483647; })(seed);
    const g = new THREE.SphereGeometry(0.5, 12, 9), p = g.attributes.position, bumps = Array.from({ length: 6 }, () => [V(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), 0.04 + r() * 0.06]);
    for (let i = 0; i < p.count; i++) {
      const v = V(p.getX(i), p.getY(i), p.getZ(i)), n = v.clone().normalize();
      let k = 1; for (const [d, a] of bumps) k += a * Math.max(0, n.dot(d)) ** 3;
      const h = Math.sin(n.x * 12.9 + n.y * 78.2 + n.z * 37.7 + seed) * 43758.5;
      v.multiplyScalar(k * (0.92 + 0.12 * (h - Math.floor(h)))); v.y *= flat; p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  };
  const plantain = [1, 2, 3].map((s) => paint(lump(s * 97, 0.75), () => { const r = rand(); return r < 0.3 ? ['#8a531c', 0.9 + rand() * 0.2] : r < 0.4 ? '#e2b860' : ['#c98d36', 0.85 + rand() * 0.25]; }));
  const chich = paint(lump(555, 0.55), (x, y) => (y > 0.08 ? '#e6c58c' : ['#7e461a', 0.85 + rand() * 0.3]));
  const crust = { roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(0.25, 0.2, 0.1), envMapIntensity: 0.5 };
  const domeAt = (polar, az, inset) => { const f = R * (1 + 0.1 * (polar / (Math.PI / 2)) ** 3) * inset; return V(Math.sin(polar) * Math.cos(az) * f, Y + Math.cos(polar) * H * inset, Math.sin(polar) * Math.sin(az) * f); };
  for (const [count, inset, size] of [[340, 1, 0.15], [140, 0.88, 0.16]]) {
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count, polar = Math.acos(1 - t * 1.02) * 0.99, az = i * 2.39996 + rand() * 0.2;
      const isChich = rand() < 0.14;
      parts.push({ geometry: isChich ? chich : plantain[i % 3], material: crust, matrix: M(domeAt(Math.min(polar, 1.55), az, inset), randQ(), size * (0.8 + rand() * 0.45)), color: tint(0.88, 1.1) });
    }
  }

  // shrimp: a tapered curl, orange with lighter bands
  const curve = new THREE.CurvePath();
  const pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 11) * Math.PI * 1.45, r = 0.1 - (i / 11) * 0.045; return V(Math.cos(a) * r, Math.sin(a) * r, 0); });
  curve.add(new THREE.CatmullRomCurve3(pts));
  const shrimp = new THREE.TubeGeometry(curve, 40, 1, 10);
  { const p = shrimp.attributes.position, ring = 11;
    for (let i = 0; i < p.count; i++) {
      const t = Math.floor(i / ring) / 40, c = curve.getPointAt(t), v = V(p.getX(i), p.getY(i), p.getZ(i)).sub(c);
      v.multiplyScalar(0.042 * (1 - 0.72 * t) + 0.004); p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z * 0.85);
    }
    shrimp.computeVertexNormals();
    paint(shrimp, (x, y) => { const a = Math.atan2(y, x); return Math.sin(a * 9) > 0.85 ? '#f6a77c' : a > 3.6 || a < -2.2 ? '#c2311a' : '#e8603a'; });
  }
  const glossy = { roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.18, envMapIntensity: 0.85 };
  for (let i = 0; i < 9; i++) { // on top of the dome and in the sauce
    const top = i < 5, az = (i / (top ? 5 : 4)) * 6.28 + rand() * 0.5;
    const pos = top ? domeAt(0.35 + rand() * 0.5, az, 1.08) : V(Math.cos(az) * 0.56, 0.1, Math.sin(az) * 0.56);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (top ? 0.6 : 0.15), az + rand(), rand() * 6.28, 'YXZ'));
    parts.push({ geometry: shrimp, material: glossy, matrix: M(pos, q, 1.25 + rand() * 0.25) });
  }

  // cilantro: small three-lobed leaves
  const leaf = new THREE.Shape();
  for (let i = 0; i <= 60; i++) { const a = (i / 60) * Math.PI * 2, r = 0.5 * (0.72 + 0.28 * Math.abs(Math.cos(1.5 * a)) + 0.04 * Math.sin(a * 14)); const fx = Math.cos(a) * r, fy = Math.sin(a) * r; i ? leaf.lineTo(fx, fy) : leaf.moveTo(fx, fy); }
  const cil = new THREE.ShapeGeometry(leaf, 6);
  { const p = cil.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.25 * (p.getX(i) ** 2 + p.getY(i) ** 2)); cil.computeVertexNormals(); }
  paint(cil, (x, y) => ['#2f7a22', 0.8 + 0.4 * Math.hypot(x, y)]);
  for (let i = 0; i < 30; i++) {
    const onTop = i < 16, az = rand() * 6.28;
    const pos = onTop ? domeAt(rand() * 0.9, az, 1.07) : V(Math.cos(az) * (0.5 + rand() * 0.15), 0.095, Math.sin(az) * (0.5 + rand() * 0.15));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (rand() - 0.5) * 0.8, rand() * 6.28, rand() * 6.28, 'YXZ'));
    parts.push({ geometry: cil, material: 'soft', matrix: M(pos, q, 0.12 + rand() * 0.05), role: 'leaf' });
  }

  // diced pepper and onion in the sauce
  const dice = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 70; i++) {
    const az = rand() * 6.28, r = 0.46 + rand() * 0.2;
    parts.push({ geometry: dice, material: glossy, matrix: M(V(Math.cos(az) * r, 0.085, Math.sin(az) * r), randQ(), V(0.035, 0.018, 0.03)), color: ['#d8361e', '#4c9a2a', '#f1ead8', '#e8a21c'][i % 4] });
  }

  // tostones: flattened fried plantain discs leaning at the back left
  const tos = new THREE.SphereGeometry(0.5, 32, 16);
  { const p = tos.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), r = Math.hypot(p.getX(i), p.getZ(i)), k = 1 + 0.06 * Math.sin(a * 5) + 0.04 * Math.sin(a * 9 + 1); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, p.getY(i) * 0.3 * (1 + 0.15 * Math.sin(p.getX(i) * 31) * Math.sin(p.getZ(i) * 27))); }
    tos.computeVertexNormals();
    paint(tos, (x, y, z) => { const r = Math.hypot(x, z), spot = Math.sin(x * 23 + 1) * Math.sin(z * 19) + 0.5 * Math.sin(r * 34); return r > 0.45 ? ['#8a5018', 0.9] : spot > 0.55 ? '#a8681f' : ['#d29a3a', 0.85 + 0.2 * Math.sin(r * 30) ** 2]; });
  }
  for (let i = 0; i < 4; i++) {
    const a = 2.25 + (i - 1.5) * 0.36, r = 0.84;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -a + Math.PI / 2, 0, 'YXZ'));
    parts.push({ geometry: tos, material: crust, matrix: M(V(Math.cos(a) * r, 0.16, Math.sin(a) * r), q, 0.27 + rand() * 0.03) });
  }

  return { group, parts, elevation: 0.62, footR: 1.15 };
}
