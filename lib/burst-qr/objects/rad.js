// Rad, the Fluffcore monster from the "Fluffcore Rad Tie-Dye Tee" (character art by Fluffcore, modelled from the
// product image). A tall, egg-shaped orange shag monster with two small purple horns, big odd-sized eyes, a huge
// open grin, one hand up in a shaka and short legs on big three-toe feet.
// Fur: a coat of shells (up to 16, fewer on slow devices) plus a few hundred tufts. On tap the tufts fly into the code.
// Idle: breathing, a small sway, blinking, a shaka wiggle, and Rad looks toward the pointer. Reduced motion: still.
export const radPalette = { dark: '#1e0e08', bg: '#f2e9dc', wash: '#3a7cb0' };

const ORANGE = '#f0761e', TIP = '#ff9a3c', ROOT = '#b4470c';
const SHELLS = [6, 10, 16]; // shells per quality tier
const FUR_LEN = 0.16;
const BODY = { yb: 0.62, yt: 3.92 };
const FACE = { x0: -1.1, y0: 1.7, size: 2.2, px: 1024 }; // front projection used for the face paint and the bald mask
const EYES = [{ x: -0.36, y: 3.0, r: 0.21 }, { x: 0.27, y: 3.12, r: 0.26 }];

// body profile: an egg, a little wider low down, a little flatter front to back
const bodyAt = (v) => { // v 0 bottom .. 1 top (polar), returns y, rx, rz
  const y = BODY.yb + ((1 - Math.cos(Math.PI * v)) / 2) * (BODY.yt - BODY.yb), s = (y - BODY.yb) / (BODY.yt - BODY.yb);
  const rx = Math.pow(Math.sin(Math.PI * v), 0.72) * (1.04 - 0.14 * s);
  return { y, rx, rz: rx * (0.78 + 0.07 * Math.sin(Math.PI * s)) };
};
const bodyZ = (x, y) => { // front surface depth at (x, y)
  const s = Math.min(1, Math.max(0, (y - BODY.yb) / (BODY.yt - BODY.yb))), v = Math.acos(1 - 2 * s) / Math.PI;
  const b = bodyAt(v); return b.rz * Math.sqrt(Math.max(0, 1 - (x / b.rx) ** 2));
};

/** @type {import("../burst-qr").BurstObjectBuilder} */
export function rad({ THREE, rand, paint, V, rig, reduce, quality }) {
  const group = new THREE.Group(), parts = [];

  // ---------- geometry helpers ----------
  // surf(nu, nv, fn): fn(u, v) -> [point, centre]; u goes around, v along. Normals from the surface itself, pointing away from the centre.
  function surf(nu, nv, fn, fur = [1, 0]) {
    const P = (u, v) => fn(u, Math.min(1, Math.max(0, v)));
    const pos = [], nor = [], idx = [], e = 1e-3, a = V(), b = V(), n = V();
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, [p, c] = P(u, v);
      a.fromArray(P(u + e, v)[0]).sub(V().fromArray(P(u - e, v)[0]));
      b.fromArray(P(u, v + e)[0]).sub(V().fromArray(P(u, v - e)[0]));
      n.crossVectors(a, b);
      const out = V().fromArray(p).sub(V().fromArray(c));
      if (n.lengthSq() < 1e-12) n.copy(b).multiplyScalar(v < 0.5 ? -1 : 1);
      if (n.dot(out) < 0) n.negate();
      n.normalize(); pos.push(...p); nor.push(n.x, n.y, n.z);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const k = j * (nu + 1) + i, k2 = k + nu + 1;
      idx.push(k, k2, k + 1, k + 1, k2, k2 + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aFur', new THREE.Float32BufferAttribute(new Array((nu + 1) * (nv + 1)).fill(fur).flat(), 2));
    g.setIndex(idx);
    // make the winding match the outward normals (front faces outside)
    const t0 = idx.length / 2 - ((idx.length / 2) % 3), pa = V().fromArray(pos, idx[t0] * 3), pb = V().fromArray(pos, idx[t0 + 1] * 3), pc = V().fromArray(pos, idx[t0 + 2] * 3);
    const fn0 = pb.clone().sub(pa).cross(pc.clone().sub(pa));
    if (fn0.dot(V().fromArray(nor, idx[t0] * 3)) < 0) { for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; g.setIndex(idx); }
    return g;
  }
  const ellipsoid = (c, r, fur, q) => surf(24, 16, (u, v) => {
    const th = Math.PI * v, ph = 2 * Math.PI * u;
    const p = V(r[0] * Math.sin(th) * Math.sin(ph), -r[1] * Math.cos(th), r[2] * Math.sin(th) * Math.cos(ph));
    if (q) p.applyQuaternion(q);
    return [p.add(V(...c)).toArray(), c];
  }, fur);
  // tube along a curve, radius R(v), closed at both ends
  const tube = (pts, R, fur, nu = 20, nv = 28) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)));
    return surf(nu, nv, (u, v) => {
      const c = curve.getPointAt(v), T = curve.getTangentAt(v);
      const ref = Math.abs(T.z) > 0.9 ? V(1, 0, 0) : V(0, 0, 1);
      const N = V().crossVectors(ref, T).normalize(), B = V().crossVectors(T, N);
      const r = R(v) * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, v))), 0.3), a = 2 * Math.PI * u;
      return [c.clone().addScaledVector(N, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r).toArray(), c.toArray()];
    }, fur);
  };
  const merge = (geos) => {
    const g = new THREE.BufferGeometry(), out = { position: [], normal: [], aFur: [] }, idx = [];
    let off = 0;
    for (const s of geos) {
      for (const k in out) out[k].push(...s.attributes[k].array);
      for (const i of s.index.array) idx.push(i + off);
      off += s.attributes.position.count; s.dispose();
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(out.position, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(out.normal, 3));
    g.setAttribute('aFur', new THREE.Float32BufferAttribute(out.aFur, 2));
    g.setIndex(idx);
    return g;
  };

  // ---------- the face: paint and a bald mask, projected from the front ----------
  const toPx = (x, y) => [((x - FACE.x0) / FACE.size) * FACE.px, ((FACE.y0 + FACE.size - y) / FACE.size) * FACE.px];
  const U = FACE.px / FACE.size; // px per unit
  const mouthPath = (g) => {
    g.beginPath(); g.moveTo(...toPx(-0.5, 2.6));
    g.bezierCurveTo(...toPx(-0.2, 2.5), ...toPx(0.3, 2.6), ...toPx(0.62, 2.78));
    g.bezierCurveTo(...toPx(0.62, 2.1), ...toPx(-0.32, 1.98), ...toPx(-0.5, 2.6));
    g.closePath();
  };
  const creases = (g) => {
    g.beginPath(); g.moveTo(...toPx(-0.55, 2.7)); g.quadraticCurveTo(...toPx(-0.62, 2.62), ...toPx(-0.58, 2.52));
    g.moveTo(...toPx(0.66, 2.88)); g.quadraticCurveTo(...toPx(0.74, 2.8), ...toPx(0.72, 2.7));
    g.moveTo(...toPx(-0.02, 1.98)); g.quadraticCurveTo(...toPx(0.12, 1.93), ...toPx(0.26, 1.98));
  };
  const faceC = document.createElement('canvas'); faceC.width = faceC.height = FACE.px;
  let g = faceC.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); mouthPath(g); g.clip();
  let gr = g.createLinearGradient(0, toPx(0, 2.7)[1], 0, toPx(0, 2.05)[1]);
  gr.addColorStop(0, '#3b1a10'); gr.addColorStop(0.5, '#1f0c08'); gr.addColorStop(1, '#2a110a');
  g.fillStyle = gr; g.fillRect(0, 0, FACE.px, FACE.px);
  g.translate(...toPx(0.2, 2.16)); g.rotate(-0.12); // tongue
  gr = g.createRadialGradient(0, -0.05 * U, 0, 0, 0, 0.34 * U);
  gr.addColorStop(0, '#f47a3c'); gr.addColorStop(0.8, '#d9532a'); gr.addColorStop(1, '#9a3216');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 0.34 * U, 0.2 * U, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,30,10,0.6)'; g.lineWidth = 0.018 * U; g.beginPath(); g.moveTo(0, -0.14 * U); g.lineTo(0.02 * U, 0.06 * U); g.stroke();
  g.restore();
  g.strokeStyle = '#140805'; g.lineWidth = 0.04 * U; mouthPath(g); g.stroke();
  g.lineWidth = 0.028 * U; creases(g); g.stroke();
  for (const e of EYES) { g.lineWidth = 0.045 * U; g.beginPath(); g.arc(...toPx(e.x, e.y), e.r * 1.0 * U, 0, 7); g.stroke(); }
  const faceTex = new THREE.CanvasTexture(faceC); faceTex.colorSpace = THREE.SRGBColorSpace;

  const baldC = document.createElement('canvas'); baldC.width = baldC.height = FACE.px;
  g = baldC.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, FACE.px, FACE.px);
  g.filter = `blur(${0.035 * U}px)`; g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
  mouthPath(g); g.fill(); g.lineWidth = 0.13 * U; g.stroke();
  g.lineWidth = 0.08 * U; creases(g); g.stroke();
  for (const e of EYES) { g.beginPath(); g.arc(...toPx(e.x, e.y), e.r * 1.12 * U, 0, 7); g.fill(); }
  g.filter = 'none';
  const baldData = g.getImageData(0, 0, FACE.px, FACE.px).data;
  const baldAt = (x, y, z) => {
    if (z <= 0) return 0;
    const [px, py] = toPx(x, y);
    if (px < 0 || py < 0 || px >= FACE.px || py >= FACE.px) return 0;
    return baldData[((py | 0) * FACE.px + (px | 0)) * 4] / 255;
  };
  const baldTex = new THREE.CanvasTexture(baldC);

  // ---------- fur material: level 0 is the skin (with the face painted on), levels above are shells ----------
  const furUniforms = { uTime: { value: 0 }, uLen: { value: FUR_LEN }, uDensity: { value: 30 }, tFace: { value: faceTex }, tBald: { value: baldTex },
    uRect: { value: new THREE.Vector4(FACE.x0, FACE.y0, FACE.size, FACE.size) }, uTip: { value: new THREE.Color(TIP) } };
  const furMat = (level) => {
    const m = new THREE.MeshPhysicalMaterial({ color: ORANGE, roughness: 0.88, sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffb070'), envMapIntensity: 0.5 });
    m.userData.level = { value: level };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, furUniforms, { uLevel: m.userData.level });
      sh.vertexShader = 'attribute vec2 aFur; uniform float uLevel, uLen, uTime; varying vec3 vObj; varying vec2 vFur;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vObj = position; vFur = aFur;
        float furL = uLevel * uLen * aFur.x;
        transformed += objectNormal * furL;
        transformed.y -= furL * uLevel * 0.55;
        transformed.x += sin(uTime * 1.3 + position.y * 2.0) * furL * 0.1;`);
      sh.fragmentShader = `uniform float uLevel, uDensity; uniform sampler2D tFace, tBald; uniform vec4 uRect; uniform vec3 uTip; varying vec3 vObj; varying vec2 vFur;
        float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
        ` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 fuv = (vObj.xy - uRect.xy) / uRect.zw;
        float onFace = vFur.y * step(0.0, vObj.z) * step(0.0, fuv.x) * step(fuv.x, 1.0) * step(0.0, fuv.y) * step(fuv.y, 1.0);
        float bald = texture2D(tBald, vec2(fuv.x, fuv.y)).r * onFace;
        if (uLevel > 0.0) {
          float len = (1.0 - bald) * (0.5 + 0.5 * vn(vObj * 3.3)) * vFur.x;
          float lev = uLevel / max(len, 1e-3);
          float s = vn(vObj * uDensity) * 0.6 + vn(vObj * uDensity * 2.3 + 7.0) * 0.4;
          if (lev > 1.0 || s < 0.3 + 0.58 * pow(lev, 0.85)) discard;
          diffuseColor.rgb *= mix(0.5, 1.1, lev);
          diffuseColor.rgb = mix(diffuseColor.rgb, uTip, smoothstep(0.55, 1.0, lev) * 0.35);
        } else {
          diffuseColor.rgb *= mix(0.82, 0.55, clamp(vFur.x, 0.0, 1.0)); // dark under long fur, plain where it is short
          vec4 fc = texture2D(tFace, fuv);
          diffuseColor.rgb = mix(diffuseColor.rgb, fc.rgb, fc.a * onFace);
        }`);
    };
    return m;
  };
  const shellMats = Array.from({ length: SHELLS[2] }, (_, i) => furMat((i + 1) / SHELLS[2]));
  const skinMat = furMat(0);
  const coats = [];
  const coat = (geo, parent = group) => { // the skin plus its shells
    const skin = new THREE.Mesh(geo, skinMat); parent.add(skin);
    const shells = shellMats.map((m) => { const s = new THREE.Mesh(geo, m); s.userData.noShadow = true; parent.add(s); return s; });
    coats.push(shells);
  };

  // ---------- body, legs, feet, arms ----------
  const body = surf(64, 48, (u, v) => { const b = bodyAt(v), a = 2 * Math.PI * u; return [[b.rx * Math.sin(a), b.y, b.rz * Math.cos(a)], [0, b.y, 0]]; }, [1, 1]);
  const limbs = [];
  for (const sx of [-1, 1]) {
    limbs.push(tube([[sx * 0.4, 1.15, 0], [sx * 0.43, 0.6, 0.02], [sx * 0.46, 0.18, 0.04]], (v) => 0.27 - 0.03 * v, [0.8, 0]));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sx * 0.22, 0));
    limbs.push(ellipsoid([sx * 0.52, 0.14, 0.12], [0.4, 0.16, 0.42], [0.55, 0], q));
    for (const t of [-1, 0, 1]) {
      const o = V(t * 0.24, 0, 0.4).applyQuaternion(q);
      limbs.push(ellipsoid([sx * 0.52 + o.x, 0.12, 0.1 + o.z], [0.15, 0.13, 0.15], [0.55, 0]));
    }
  }
  // Rad's right arm (on the left as you look) is raised in a shaka; the other hangs at the side
  limbs.push(tube([[-0.75, 2.1, 0.02], [-1.2, 1.86, 0.14], [-1.46, 2.12, 0.24], [-1.52, 2.46, 0.3]], (v) => 0.25 - 0.06 * v, [0.85, 0]));
  limbs.push(tube([[0.78, 2.3, 0.0], [1.04, 1.8, 0.06], [1.12, 1.25, 0.12], [1.12, 0.95, 0.14]], (v) => 0.25 - 0.05 * v, [0.85, 0]));
  limbs.push(ellipsoid([1.12, 0.84, 0.16], [0.18, 0.2, 0.16], [0.45, 0]));
  limbs.push(ellipsoid([1.03, 0.86, 0.28], [0.08, 0.11, 0.08], [0.45, 0]));
  coat(merge([body, ...limbs]));

  const wrist = V(-1.52, 2.46, 0.3), hand = new THREE.Group(); hand.position.copy(wrist); group.add(hand);
  const at = (x, y, z) => [x - wrist.x, y - wrist.y, z - wrist.z];
  coat(merge([
    ellipsoid(at(-1.53, 2.66, 0.32), [0.24, 0.26, 0.17], [0.4, 0]),
    tube([at(-1.66, 2.62, 0.36), at(-1.86, 2.76, 0.38), at(-2.0, 2.98, 0.38)], (v) => 0.1 - 0.02 * v, [0.4, 0], 14, 14), // thumb
    tube([at(-1.4, 2.78, 0.32), at(-1.36, 2.98, 0.32), at(-1.36, 3.18, 0.3)], (v) => 0.095 - 0.02 * v, [0.4, 0], 14, 14), // little finger
    ...[-1.63, -1.53, -1.43].map((x) => ellipsoid(at(x, 2.8, 0.42), [0.085, 0.09, 0.1], [0.4, 0])), // curled fingers
  ]), hand);

  // ---------- horns ----------
  const hornMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.7 });
  for (const sx of [-1, 1]) {
    const geo = tube([[sx * 0.5, 3.58, -0.05], [sx * 0.64, 3.9, -0.04], [sx * 0.66, 4.12, -0.03], [sx * 0.56, 4.28, -0.02]], (v) => 0.21 * (1 - v) ** 0.8 + 0.015, [0, 0], 16, 20);
    paint(geo, (x, y) => { const k = Math.min(1, Math.max(0, (y - 3.7) / 0.65)); return [new THREE.Color('#5e1a52').lerp(new THREE.Color('#b24f9d'), k).getHexString().padStart(7, '#'), 1]; });
    group.add(new THREE.Mesh(geo, hornMat));
  }

  // ---------- eyes ----------
  const scleraMat = new THREE.MeshPhysicalMaterial({ color: '#f6e8cc', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  const pupilMat = new THREE.MeshPhysicalMaterial({ color: '#150b08', roughness: 0.2, clearcoat: 1 });
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyes = EYES.map((e) => {
    const z = bodyZ(e.x, e.y), nrm = V(e.x / 0.9, 0.12, z / 0.7).normalize();
    const holder = new THREE.Group(); holder.position.copy(V(e.x, e.y, z).addScaledVector(nrm, -0.15 * e.r)); group.add(holder);
    holder.add(new THREE.Mesh(new THREE.SphereGeometry(e.r, 32, 20), scleraMat));
    const pivot = new THREE.Group(); holder.add(pivot);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(e.r * 0.47, 24, 14), pupilMat);
    pupil.scale.z = 0.35; pupil.position.z = e.r * 0.9; pivot.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(e.r * 0.11, 10, 8), glintMat);
    glint.position.set(e.r * 0.15, e.r * 0.17, e.r * 1.02); pivot.add(glint);
    return { holder, pivot };
  });

  // ---------- tufts: the pieces that fly into the code ----------
  const tuftGeos = [0, 1, 2].map(() => {
    const strands = [];
    const n = 11 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const c = new THREE.ConeGeometry(0.1 + rand() * 0.04, 0.6 + rand() * 0.45, 4, 1);
      c.translate(0, c.parameters.height / 2, 0);
      const a = (i / n) * 6.283 + rand() * 0.8, lean = 0.15 + rand() * 0.4, off = 0.04 + rand() * 0.1;
      c.rotateX(lean); c.rotateY(a); c.translate(Math.sin(a) * off, 0, Math.cos(a) * off);
      strands.push(c);
    }
    const centre = new THREE.SphereGeometry(0.2, 8, 6); centre.scale(1, 1.6, 1); strands.push(centre);
    const geo = new THREE.BufferGeometry(), pos = [], nor = [];
    for (const s of strands) { const t = s.toNonIndexed(); pos.push(...t.attributes.position.array); nor.push(...t.attributes.normal.array); s.dispose(); t.dispose(); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.rotateX(Math.PI / 2); // strands point +Z (out of the skin)
    return paint(geo, (x, y, z) => [new THREE.Color(ROOT).lerp(new THREE.Color(TIP), Math.min(1, Math.max(0, z / 0.9)) ** 1.5).getHexString().padStart(7, '#'), 1]);
  });
  const tuftMat = { roughness: 0.85, sheen: 0.8, sheenRoughness: 0.6, sheenColor: '#ff9a50', envMapIntensity: 0.45 };
  // area-weighted points on the coat (body and limbs), skipping the face, soles and the inside of the legs
  const coatGeo = group.children[0].geometry, cp = coatGeo.attributes.position, cn = coatGeo.attributes.normal, ci = coatGeo.index.array;
  const tris = []; let total = 0;
  const A = V(), B = V(), C = V();
  for (let i = 0; i < ci.length; i += 3) {
    A.fromBufferAttribute(cp, ci[i]); B.fromBufferAttribute(cp, ci[i + 1]); C.fromBufferAttribute(cp, ci[i + 2]);
    total += B.clone().sub(A).cross(C.clone().sub(A)).length() / 2; tris.push(total);
  }
  const want = 480; let guard = 0;
  while (parts.length < want && guard++ < 20000) {
    const x = rand() * total; let lo = 0, hi = tris.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid] < x) lo = mid + 1; else hi = mid; }
    let u = rand(), v = rand(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const [a, b, c] = [ci[lo * 3], ci[lo * 3 + 1], ci[lo * 3 + 2]];
    const p = V().fromBufferAttribute(cp, a).multiplyScalar(1 - u - v).addScaledVector(V().fromBufferAttribute(cp, b), u).addScaledVector(V().fromBufferAttribute(cp, c), v);
    const n = V().fromBufferAttribute(cn, a).multiplyScalar(1 - u - v).addScaledVector(V().fromBufferAttribute(cn, b), u).addScaledVector(V().fromBufferAttribute(cn, c), v).normalize();
    if (n.y < -0.55 || p.y < 0.06) continue; // soles
    if (Math.abs(p.x) < 0.3 && p.y < 1.0) continue; // between the legs
    if (baldAt(p.x, p.y, p.z) > 0.02) continue;
    const furLen = coatGeo.attributes.aFur.getX(a);
    if (furLen < 0.6 && rand() < 0.75) continue; // feet and hands stay smoother, like the art
    const front = n.z > 0.55 && p.y > 1.85 && p.y < 3.45 && p.x > -0.8 && p.x < 0.9; // keep the face clean, like the art
    if (front && rand() < 0.85) continue;
    const dir = n.clone().add(V(0, -0.4, 0)).add(V(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.35)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), dir).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), rand() * 6.28));
    const s = (front ? 0.12 : 0.17) * (furLen < 0.6 ? 0.75 : 1) + rand() * 0.06, tint = 0.88 + rand() * 0.22;
    parts.push({ geometry: tuftGeos[parts.length % 3], material: tuftMat, matrix: new THREE.Matrix4().compose(p.addScaledVector(n, -0.02), q, V(s, s, s * (0.85 + rand() * 0.3))), color: new THREE.Color(tint, tint * 0.97, tint * 0.94) });
  }

  // ---------- idle motion ----------
  let last = 0, blinkAt = 2, look = { x: 0, y: 0 };
  const T = V();
  function tick(time, t, ptr) {
    const count = SHELLS[quality.tier] ?? SHELLS[2]; // fewer shells on slow devices, spread over the same length
    for (const shells of coats) shells.forEach((s, i) => { s.visible = i < count; });
    shellMats.forEach((m, i) => { m.userData.level.value = (i + 1) / count; });
    if (reduce) return;
    const dt = Math.min(0.1, Math.max(0, time - last)); last = time;
    furUniforms.uTime.value = time;
    const b = Math.sin(time * 2.1);
    rig.scale.set(1 - 0.008 * b, 1 + 0.016 * b, 1 - 0.008 * b);
    rig.position.y = 0.035 * (1 - Math.cos(time * 2.1)) * 0.5;
    const gx = ptr.active ? ptr.x : 0.35 * Math.sin(time * 0.37), gy = ptr.active ? ptr.y : 0.15 * Math.sin(time * 0.53);
    const k = Math.min(1, dt * 4);
    look.x += (gx - look.x) * k; look.y += (gy - look.y) * k;
    rig.rotation.set(-look.y * 0.06, look.x * 0.4, 0.035 * Math.sin(time * 1.05));
    // eyes follow the pointer, and blink now and then
    if (time > blinkAt + 0.16) blinkAt = time + 2.2 + ((Math.sin(time * 12.9898) * 43758.5453) % 1 + 1) % 1 * 3;
    const shut = time > blinkAt ? Math.sin(Math.PI * Math.min(1, (time - blinkAt) / 0.16)) : 0;
    group.updateWorldMatrix(true, false);
    for (const e of eyes) {
      e.holder.scale.y = 1 - 0.92 * shut;
      T.set(e.holder.position.x + look.x * 1.6, e.holder.position.y + look.y * 1.0, e.holder.position.z + 2.2);
      e.pivot.lookAt(group.localToWorld(T));
    }
    hand.rotation.z = 0.12 * Math.sin(time * 7) * Math.max(0, Math.sin(time * 0.9)) ** 3; // a little shaka shake now and then
  }

  return { group, parts, tick, elevation: 0.1, footR: 1.1, spin: 0, angle: -0.22 };
}
