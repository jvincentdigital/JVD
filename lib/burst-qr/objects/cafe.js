// A steaming cup of café con leche on a saucer, with roasted beans on the table.
// On tap the beans (and more beans from inside the cup) fly into the QR squares.
export const cafePalette = { dark: '#2b160b', bg: '#f5f0e8', wash: '#b98a5e' };

/** @type {import("../burst-qr").BurstObjectBuilder} */
export function cafe({ THREE, rand, paint, V }) {
  const group = new THREE.Group(), parts = [];
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#f7f4ee', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
  const lathe = (pts, mat, y = 0) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 72), mat); m.position.y = y; group.add(m); return m; };

  // saucer, cup, a green band (JVD green) and the handle
  lathe([[0, 0], [0.3, 0], [0.32, 0.02], [0.34, 0.03], [0.45, 0.04], [0.7, 0.07], [0.82, 0.108], [0.846, 0.116], [0.853, 0.124], [0.845, 0.131], [0.828, 0.127], [0.68, 0.095], [0.45, 0.075], [0.35, 0.07], [0, 0.07]], ceramic);
  const cupY = 0.07;
  lathe([[0, 0], [0.22, 0], [0.25, 0.02], [0.27, 0.06], [0.3, 0.1], [0.38, 0.25], [0.42, 0.42], [0.44, 0.52], [0.446, 0.538], [0.444, 0.551], [0.436, 0.556], [0.427, 0.552], [0.422, 0.538], [0.41, 0.48], [0.37, 0.3], [0.3, 0.15], [0, 0.12]], ceramic, cupY);
  lathe([[0.4025, 0.33], [0.4135, 0.38]], new THREE.MeshPhysicalMaterial({ color: '#007a4d', roughness: 0.25, clearcoat: 1, side: THREE.DoubleSide }), cupY);
  const handle = new THREE.CatmullRomCurve3([V(0.4, 0.45, 0), V(0.56, 0.44, 0), V(0.62, 0.32, 0), V(0.54, 0.2, 0), V(0.33, 0.16, 0)]);
  const h = new THREE.Mesh(new THREE.TubeGeometry(handle, 32, 0.03, 10), ceramic); h.position.y = cupY; group.add(h);

  // the coffee: crema with a latte-art heart
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  let gr = g.createRadialGradient(256, 256, 0, 256, 256, 256);
  gr.addColorStop(0, '#8a5530'); gr.addColorStop(0.75, '#7a4524'); gr.addColorStop(0.92, '#b27b4c'); gr.addColorStop(1, '#5a2f16');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.filter = 'blur(5px)'; g.fillStyle = '#efe0c6';
  g.beginPath(); g.moveTo(256, 380); g.bezierCurveTo(120, 300, 110, 170, 200, 160); g.bezierCurveTo(240, 156, 256, 190, 256, 210);
  g.bezierCurveTo(256, 190, 272, 156, 312, 160); g.bezierCurveTo(402, 170, 392, 300, 256, 380); g.fill();
  g.filter = 'blur(2px)'; g.strokeStyle = '#8a5530'; g.lineWidth = 9; g.beginPath(); g.moveTo(256, 120); g.lineTo(256, 370); g.stroke();
  const crema = new THREE.CanvasTexture(c); crema.colorSpace = THREE.SRGBColorSpace;
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.405, 64), new THREE.MeshPhysicalMaterial({ map: crema, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = cupY + 0.465; group.add(coffee);

  // a spoon on the saucer
  const steel = new THREE.MeshPhysicalMaterial({ color: '#d9dadc', metalness: 1, roughness: 0.22 });
  const spoon = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), steel); bowl.scale.set(0.09, 0.025, 0.13); spoon.add(bowl);
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.36), steel); stick.position.set(0, 0.012, 0.22); stick.rotation.x = -0.08; spoon.add(stick);
  spoon.position.set(0.15, 0.1, 0.58); spoon.rotation.y = -0.9; group.add(spoon);

  // steam: three soft ribbons that sway
  const sc = document.createElement('canvas'); sc.width = 64; sc.height = 256;
  const sg = sc.getContext('2d');
  for (let y = 0; y < 256; y++) {
    const v = y / 255, a = Math.sin(Math.PI * Math.pow(1 - v, 1.3)) * 0.55;
    const row = sg.createLinearGradient(0, 0, 64, 0);
    row.addColorStop(0, 'rgba(255,255,255,0)'); row.addColorStop(0.5, `rgba(255,255,255,${a})`); row.addColorStop(1, 'rgba(255,255,255,0)');
    sg.fillStyle = row; sg.fillRect(0, y, 64, 1);
  }
  const steamTex = new THREE.CanvasTexture(sc);
  const ribbons = [0, 1, 2].map((i) => {
    const geo = new THREE.PlaneGeometry(0.2, 0.7, 1, 24); geo.translate(0, 0.35, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false }));
    m.position.set((i - 1) * 0.1, cupY + 0.5, (i - 1) * 0.04); m.rotation.y = (i * Math.PI) / 3;
    group.add(m);
    return { m, base: geo.attributes.position.array.slice(), ph: i * 2.1 };
  });
  const tick = (time) => {
    for (const r of ribbons) {
      const a = r.m.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) { const y = r.base[i * 3 + 1]; a.array[i * 3] = r.base[i * 3] + Math.sin(y * 5 - time * 1.6 + r.ph) * 0.07 * y; }
      a.needsUpdate = true;
    }
  };

  // roasted coffee bean: oval, flat side up with an S-shaped crease
  const bean = new THREE.SphereGeometry(0.5, 16, 12);
  const p = bean.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) * 0.72, y = p.getY(i), z = p.getZ(i) * 0.5;
    if (z > 0) { z *= 0.6; const d = Math.abs(x - 0.05 * Math.sin(y * 5)); if (d < 0.07) z -= 0.09 * (1 - d / 0.07); }
    p.setXYZ(i, x, y, z);
  }
  bean.computeVertexNormals();
  paint(bean, (x, y, z) => (z > 0 && Math.abs(x - 0.05 * Math.sin(y * 5)) < 0.05 ? '#140904' : ['#4b2a16', 0.75 + 0.35 * (z + 0.25)]));
  const beanMat = { roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.7 };
  const addBean = (pos, flat, hidden) => {
    const q = new THREE.Quaternion().setFromEuler(flat ? new THREE.Euler(-Math.PI / 2, 0, rand() * 6.28, 'XYZ') : new THREE.Euler(rand() * 6, rand() * 6, rand() * 6));
    const s = 0.1 + rand() * 0.025, tint = 0.8 + rand() * 0.35;
    parts.push({ geometry: bean, material: beanMat, matrix: new THREE.Matrix4().compose(pos, q, V(s, s, s)), color: new THREE.Color(tint, tint, tint), hidden });
  };
  for (let i = 0; i < 12; i++) { const a = 2.2 + rand() * 2.6, r = 0.55 + rand() * 0.2; addBean(V(Math.cos(a) * r, 0.1 + (r - 0.55) * 0.12, Math.sin(a) * r), true); }
  for (let i = 0; i < 34; i++) { // a loose scatter on the table, heavier at the front right
    const a = -0.4 + rand() * 2.2 + (rand() < 0.3 ? rand() * 3 : 0), r = 0.95 + Math.pow(rand(), 1.8) * 0.3;
    addBean(V(Math.cos(a) * r, 0.027, Math.sin(a) * r), true);
  }
  for (let i = 0; i < 140; i++) { const a = rand() * 6.28, r = Math.sqrt(rand()) * 0.3; addBean(V(Math.cos(a) * r, cupY + 0.47, Math.sin(a) * r), false, true); }
  // two sugar cubes on the saucer
  const cube = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
  for (const [x, z, ry] of [[-0.5, 0.42, 0.3], [-0.42, 0.55, 1.1]]) parts.push({ geometry: cube, material: 'matte', matrix: new THREE.Matrix4().compose(V(x, 0.12, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), V(0.09, 0.09, 0.09)), color: '#fbf8f2' });

  return { group, parts, tick, elevation: 0.5, footR: 0.85 };
}
