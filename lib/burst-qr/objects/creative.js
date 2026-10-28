// Two showpiece objects for the 3D QR gallery, our own designs, no brands or logos:
// - phone: a modern phone showing a generic business profile; hearts float up off it. On tap the hearts
//   (and more hearts from inside the phone) fly into the QR, so the code is made of hearts.
// - arcade: a retro arcade cabinet with a glowing screen, a lit marquee, joystick and buttons. On tap glowing
//   pixels burst out of the screen and the tokens on the floor fly into the code.
export const phonePalette = { dark: '#1b1030', bg: '#f4f1f8', wash: '#c06fd8' };
export const arcadePalette = { dark: '#120c24', bg: '#eeeaf4', wash: '#6a4fd0' };

const tex = (THREE, w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
};
const roundRect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// a heart that faces +Z, centred, about 1 unit wide
function heartGeometry(THREE) {
  const s = new THREE.Shape();
  s.moveTo(5, 5); s.bezierCurveTo(5, 5, 4, 0, 0, 0); s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19); s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0); s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.6, bevelSegments: 4, curveSegments: 16 });
  g.rotateZ(Math.PI); g.center(); g.scale(1 / 22, 1 / 22, 1 / 22);
  g.computeVertexNormals();
  return g;
}

/** A phone with a business profile on screen and hearts floating up. @type {import("../burst-qr").BurstObjectBuilder} */
export function phone({ THREE, rand, rig, reduce }) {
  const group = new THREE.Group(), parts = [];
  const W = 0.78, H = 1.6, D = 0.085, R = 0.12;
  const body = new THREE.Group(); body.position.y = 1.05; body.rotation.x = -0.12; group.add(body);

  // body: a rounded slab with soft edges, titanium frame
  const outline = new THREE.Shape(); outline.moveTo(-W / 2 + R, -H / 2);
  outline.lineTo(W / 2 - R, -H / 2); outline.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  outline.lineTo(W / 2, H / 2 - R); outline.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  outline.lineTo(-W / 2 + R, H / 2); outline.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  outline.lineTo(-W / 2, -H / 2 + R); outline.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  const slab = new THREE.ExtrudeGeometry(outline, { depth: D - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 6, curveSegments: 24 });
  slab.translate(0, 0, -(D - 0.03) / 2);
  const frame = new THREE.MeshPhysicalMaterial({ color: '#2c2a31', metalness: 0.9, roughness: 0.32, clearcoat: 0.6 });
  const glassBlack = new THREE.MeshPhysicalMaterial({ color: '#07070a', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 });
  const m = new THREE.Mesh(slab, [glassBlack, frame]); body.add(m);
  // back camera bump
  const bump = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.03), frame); bump.position.set(-0.18, 0.55, -D / 2 - 0.012); body.add(bump);
  for (const [x, y] of [[-0.24, 0.61], [-0.12, 0.61], [-0.24, 0.49]]) {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 32), glassBlack);
    lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -D / 2 - 0.03); body.add(lens);
  }

  // the screen: a generic business profile (no real app or network)
  const sx = 512, sy = Math.round(512 * (H - 0.08) / (W - 0.06));
  const screenTex = tex(THREE, sx, sy, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111'; g.font = '600 22px system-ui, sans-serif'; g.fillText('9:41', 34, 44);
    g.beginPath(); g.ellipse(w / 2, 32, 60, 16, 0, 0, 7); g.fillStyle = '#000'; g.fill(); // camera island
    const av = g.createLinearGradient(40, 90, 170, 220); av.addColorStop(0, '#f9a23b'); av.addColorStop(0.5, '#e8467c'); av.addColorStop(1, '#7a3ff2');
    g.fillStyle = av; g.beginPath(); g.arc(105, 155, 62, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(105, 155, 54, 0, 7); g.fill();
    g.fillStyle = '#2b2140'; g.beginPath(); g.arc(105, 155, 50, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '700 40px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('YB', 105, 170);
    g.fillStyle = '#111'; g.font = '700 30px system-ui, sans-serif';
    for (const [n, label, x] of [['248', 'posts', 245], ['12.4k', 'followers', 345], ['310', 'following', 445]]) {
      g.fillText(n, x, 150); g.font = '400 20px system-ui, sans-serif'; g.fillText(label, x, 178); g.font = '700 30px system-ui, sans-serif';
    }
    g.textAlign = 'left'; g.font = '700 26px system-ui, sans-serif'; g.fillText('Your Business', 40, 262);
    g.font = '400 21px system-ui, sans-serif'; g.fillStyle = '#555'; g.fillText('Made in Puerto Rico · Open today 9–6', 40, 294);
    g.fillStyle = '#2f6ef6'; roundRect(g, 40, 318, 210, 50, 12); g.fill();
    g.fillStyle = '#efeff2'; roundRect(g, 262, 318, 210, 50, 12); g.fill();
    g.font = '600 22px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText('Follow', 145, 351); g.fillStyle = '#111'; g.fillText('Message', 367, 351);
    const tile = (w - 4) / 3, top = 392;
    const pal = [['#ffb86b', '#e8467c'], ['#5ee7df', '#3a6ff7'], ['#ffe066', '#f76b1c'], ['#a18cd1', '#fbc2eb'], ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'], ['#f6d365', '#fda085'], ['#667eea', '#764ba2'], ['#89f7fe', '#66a6ff'], ['#fddb92', '#d1fdff'], ['#e0c3fc', '#8ec5fc']];
    for (let i = 0; i < 12; i++) {
      const x = (i % 3) * (tile + 2), y = top + Math.floor(i / 3) * (tile + 2);
      if (y > h - 70) break;
      const gr = g.createLinearGradient(x, y, x + tile, y + tile); gr.addColorStop(0, pal[i][0]); gr.addColorStop(1, pal[i][1]);
      g.fillStyle = gr; g.fillRect(x, y, tile, tile);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + tile / 2, y + tile / 2, tile * 0.16, 0, 7); g.fill();
    }
    g.fillStyle = '#ffffff'; g.fillRect(0, h - 64, w, 64); g.fillStyle = '#111'; roundRect(g, w / 2 - 70, h - 22, 140, 8, 4); g.fill();
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.08), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = D / 2 + 0.0008; body.add(screen);

  // floating hearts: rise from the phone, drift and fade (idle only)
  const heart = heartGeometry(THREE);
  const heartMat = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, transparent: true });
  const floaters = Array.from({ length: 7 }, (_, i) => {
    const mesh = new THREE.Mesh(heart, heartMat(['#ff3b6b', '#ff6f91', '#e8467c'][i % 3]));
    mesh.userData.noShadow = true; group.add(mesh);
    return { mesh, ph: i / 7, x: 0.25 + rand() * 0.35, sway: 0.5 + rand() };
  });

  // pieces: a few hearts resting by the phone, and hearts hidden inside it
  const pinks = ['#ff3b6b', '#ff6f91', '#e8467c', '#ff8fab'];
  for (let i = 0; i < 9; i++) {
    const a = 2.2 + rand() * 2.0, r = 0.7 + rand() * 0.4, k = 0.12 + rand() * 0.06;
    parts.push({ geometry: heart, material: 'gloss', color: pinks[i % 4], matrix: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, k * 0.4, Math.sin(a) * r + 0.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.2, rand() - 0.5, rand() - 0.5)), new THREE.Vector3(k, k, k)) });
  }
  for (let i = 0; i < 150; i++) {
    const k = 0.09 + rand() * 0.03;
    parts.push({ geometry: heart, material: 'gloss', color: pinks[i % 4], hidden: true, matrix: new THREE.Matrix4().compose(new THREE.Vector3((rand() - 0.5) * 0.6, 0.4 + rand() * 1.3, 0), new THREE.Quaternion(), new THREE.Vector3(k, k, k)) });
  }

  const tick = (time) => {
    if (reduce) { for (const f of floaters) f.mesh.visible = false; return; }
    rig.position.y = Math.sin(time * 1.2) * 0.03;
    for (const f of floaters) {
      const u = (time * 0.22 + f.ph) % 1; // 0..1 over the rise
      f.mesh.position.set(f.x + Math.sin(u * 6 * f.sway) * 0.12, 1.5 + u * 1.3, 0.2 + u * 0.25);
      const s = 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 0.001;
      f.mesh.scale.setScalar(s); f.mesh.rotation.z = Math.sin(time * 2 + f.ph * 6) * 0.25;
      f.mesh.material.opacity = 1 - Math.max(0, (u - 0.6) / 0.4);
    }
  };
  return { group, parts, tick, spin: 0, angle: -0.3, elevation: 0.12, footR: 0.8 };
}

/** A retro arcade cabinet. @type {import("../burst-qr").BurstObjectBuilder} */
export function arcade({ THREE, rand, reduce }) {
  const group = new THREE.Group(), parts = [];
  const WIDTH = 0.92;
  // side profile in (z, y): back, floor, front, control panel, screen, marquee, top
  const P = [[-0.45, 0], [0.36, 0], [0.36, 0.98], [0.52, 1.02], [0.52, 1.1], [0.26, 1.22], [0.2, 1.26], [0.05, 1.72], [0.25, 1.77], [0.31, 2.02], [-0.45, 2.02]];
  const side = new THREE.Shape(); side.moveTo(...P[0]); for (const p of P.slice(1)) side.lineTo(...p); side.closePath();
  const art = tex(THREE, 512, 1024, (g, w, h) => {
    const gr = g.createLinearGradient(0, h, w, 0); gr.addColorStop(0, '#2a0f5c'); gr.addColorStop(0.55, '#5b21b6'); gr.addColorStop(1, '#0f766e');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.strokeStyle = ['#22d3ee', '#f472b6', '#facc15'][i % 3]; g.globalAlpha = 0.85; g.lineWidth = 14; g.beginPath(); g.moveTo(-50, h * 0.9 - i * 60); g.lineTo(w + 50, h * 0.55 - i * 60); g.stroke(); }
    g.globalAlpha = 1;
  });
  art.repeat.set(1 / 0.97, 1 / 2.02); art.offset.set(0.45 / 0.97, 0);
  const sideMat = new THREE.MeshPhysicalMaterial({ map: art, roughness: 0.4, clearcoat: 0.5 });
  const black = new THREE.MeshPhysicalMaterial({ color: '#141218', roughness: 0.55 });
  const cab = new THREE.ExtrudeGeometry(side, { depth: WIDTH, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 });
  cab.rotateY(-Math.PI / 2); cab.translate(WIDTH / 2, 0, 0);
  group.add(new THREE.Mesh(cab, [sideMat, black]));
  // T-molding: glowing edge strips along the profile, both sides
  const edge = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#22d3ee', emissiveIntensity: 1.4 });
  for (const x of [-WIDTH / 2 - 0.013, WIDTH / 2 + 0.013]) for (let i = 2; i < P.length - 2; i++) {
    const [z0, y0] = P[i], [z1, y1] = P[i + 1], len = Math.hypot(z1 - z0, y1 - y0);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, len), edge);
    strip.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); strip.rotation.x = -Math.atan2(y1 - y0, z1 - z0); group.add(strip);
  }
  // a plane placed on a slanted face of the profile, from point a to point b (z, y), facing out
  const onFace = (mat, a, b, w, inset) => { // inset: out past the 0.012 bevel
    const [z0, y0] = a, [z1, y1] = b, len = Math.hypot(z1 - z0, y1 - y0);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len * 0.92), mat);
    const ang = Math.atan2(z0 - z1, y1 - y0); // lean back as it rises
    m.rotation.x = -ang; m.position.set(0, (y0 + y1) / 2, (z0 + z1) / 2);
    m.position.add(new THREE.Vector3(0, Math.sin(ang), Math.cos(ang)).multiplyScalar(inset)); group.add(m); return m;
  };
  // screen: our own little space game, with scanlines
  const screenTex = tex(THREE, 512, 400, (g, w, h) => {
    g.fillStyle = '#05061a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`; g.fillRect(rand() * w, rand() * h, 2, 2); }
    const cols = ['#f472b6', '#facc15', '#22d3ee', '#a3e635', '#fb923c'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) { g.fillStyle = cols[r]; g.fillRect(40 + c * 44, 50 + r * 26, 36, 18); }
    g.fillStyle = '#e5e7eb'; g.beginPath(); g.moveTo(w / 2, h - 70); g.lineTo(w / 2 - 26, h - 30); g.lineTo(w / 2 + 26, h - 30); g.fill();
    g.fillStyle = '#22d3ee'; g.fillRect(w / 2 - 2, h - 150, 4, 40);
    g.fillStyle = '#fff'; g.font = '700 22px monospace'; g.fillText('SCORE 012340', 16, 30); g.fillText('HI 099000', w - 140, 30);
    g.font = '700 26px monospace'; g.fillStyle = '#facc15'; g.fillText('PRESS START', w / 2 - 92, h / 2 + 50);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 2);
  });
  onFace(new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: screenTex, emissiveIntensity: 1.25 }), P[6], P[7], WIDTH - 0.2, 0.022);
  onFace(black, P[6], P[7], WIDTH - 0.08, 0.016); // bezel
  // marquee
  const marqTex = tex(THREE, 512, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(1, '#db2777');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.font = '900 78px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = '#1e0b3a'; g.strokeText('PLAY', w / 2, h / 2 + 4); g.fillStyle = '#fde68a'; g.fillText('PLAY', w / 2, h / 2 + 4);
  });
  onFace(new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: marqTex, emissiveIntensity: 1.3 }), P[8], P[9], WIDTH - 0.06, 0.02);
  // control panel: joystick and six buttons, standing on the slanted panel
  const [pz0, py0] = P[4], [pz1, py1] = P[5];
  const tan = new THREE.Vector3(0, py1 - py0, pz1 - pz0).normalize(), nrm = new THREE.Vector3(0, -tan.z, tan.y).multiplyScalar(-1);
  if (nrm.y < 0) nrm.negate();
  const onPanel = (obj, t, x) => { obj.position.set(x, py0 + (py1 - py0) * t, pz0 + (pz1 - pz0) * t).addScaledVector(nrm, 0.014); obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); group.add(obj); return obj; };
  const stick = new THREE.Group();
  stick.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.015, 24), black));
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 12), new THREE.MeshPhysicalMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.25 })); shaft.position.y = 0.07; stick.add(shaft);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 18), new THREE.MeshPhysicalMaterial({ color: '#e11d48', roughness: 0.15, clearcoat: 1 })); ball.position.y = 0.15; stick.add(ball);
  onPanel(stick, 0.45, -0.22);
  const btnCols = ['#facc15', '#22d3ee', '#f472b6', '#a3e635', '#fb923c', '#e5e7eb'];
  btnCols.forEach((c, i) => {
    const b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.012, 24), black));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, emissive: c, emissiveIntensity: 0.25 }));
    dome.position.y = 0.006; dome.scale.y = 0.7; b.add(dome);
    onPanel(b, i < 3 ? 0.3 : 0.62, 0.02 + (i % 3) * 0.1);
  });
  // coin door with two glowing slots
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.01), new THREE.MeshPhysicalMaterial({ color: '#2a2730', metalness: 0.8, roughness: 0.35 }));
  door.position.set(0, 0.48, 0.378); group.add(door);
  for (const x of [-0.07, 0.07]) { const slot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.07, 0.012), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fb923c', emissiveIntensity: 2 })); slot.position.set(x, 0.54, 0.384); group.add(slot); }

  // pieces: tokens on the floor, and glowing pixels hidden behind the screen
  const token = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 28); token.rotateX(Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const a = rand() * 6.28, r = 0.75 + rand() * 0.45;
    parts.push({ geometry: token, material: { metalness: 1, roughness: 0.25 }, color: '#e9c46a', matrix: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, 0.012, Math.sin(a) * r + 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rand() * 6)), new THREE.Vector3(0.09, 0.09, 0.09)) });
  }
  const px = new THREE.BoxGeometry(1, 1, 0.4);
  const pcols = ['#f472b6', '#facc15', '#22d3ee', '#a3e635', '#fb923c'];
  for (let i = 0; i < 160; i++) parts.push({ geometry: px, material: { roughness: 0.3, emissive: pcols[i % 5], emissiveIntensity: 0.6 }, color: pcols[i % 5], hidden: true, matrix: new THREE.Matrix4().compose(new THREE.Vector3((rand() - 0.5) * 0.6, 1.3 + rand() * 0.38, 0.05 + rand() * 0.08), new THREE.Quaternion(), new THREE.Vector3(0.07, 0.07, 0.07)) });

  const tick = (time) => {
    if (reduce) return;
    edge.emissive.setHSL((0.52 + Math.sin(time * 0.7) * 0.08 + 1) % 1, 0.9, 0.55); // the side lights drift through cyan and blue
    ball.position.x = Math.sin(time * 3) * 0.012; // joystick wiggle
  };
  return { group, parts, tick, spin: 0, angle: 0.55, elevation: 0.18, footR: 0.9 };
}
