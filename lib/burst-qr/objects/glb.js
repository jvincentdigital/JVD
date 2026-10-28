// Ready-made glTF/GLB models (CC0, for example from Grab3D) as burst-qr objects.
// Object builders are synchronous, so load first, then hand the engine the builder:
//   const object = await loadModels([{ url: '/lab/models/sedan.glb', height: 1 }]);
//   createBurstQR(el, { link, object, ... });
// Each item is scaled to `height`, stood on the floor, centred on (x, z) and turned by `turn` radians.
// The QR pieces are hidden inside the models and burst out on tap, in `colors` (picked to match the model).
const LOADER = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm';

export async function loadModels(items, { spin = 0, angle = 0.4, elevation = 0.25, colors = ['#888888'], count = 160 } = {}) {
  const { GLTFLoader } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ LOADER);
  const loader = new GLTFLoader();
  const loaded = await Promise.all(items.map((it) => loader.loadAsync(it.url)));

  /** @type {import("../burst-qr").BurstObjectBuilder} */
  return ({ THREE, rand }) => {
    const group = new THREE.Group(), parts = [];
    items.forEach((it, i) => {
      // a fresh copy each build: the engine disposes geometries and materials when it is done
      const s = loaded[i].scene.clone(true);
      s.traverse((m) => {
        if (!m.isMesh) return;
        m.geometry = m.geometry.clone();
        m.material = Array.isArray(m.material) ? m.material[0].clone() : m.material.clone();
      });
      const box = new THREE.Box3().setFromObject(s), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      s.position.set(-c.x, -box.min.y, -c.z);
      const holder = new THREE.Group();
      holder.add(s);
      holder.scale.setScalar((it.height ?? 1) / size.y);
      holder.rotation.y = it.turn ?? 0;
      holder.position.set(it.x ?? 0, 0, it.z ?? 0);
      group.add(holder);
    });
    // hidden pieces: small chunks at random points of the models' surfaces
    group.updateMatrixWorld(true);
    const pts = [], v = new THREE.Vector3();
    group.traverse((m) => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += Math.max(1, Math.floor(pos.count / 400))) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
    });
    const chunk = new THREE.IcosahedronGeometry(0.5, 0), size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
    const k = Math.max(size.x, size.y, size.z) / 30;
    for (let i = 0; i < count && pts.length; i++) {
      const p = pts[Math.floor(rand() * pts.length)];
      parts.push({ geometry: chunk, material: 'soft', color: colors[i % colors.length], hidden: true,
        matrix: new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6)), new THREE.Vector3(k, k, k)) });
    }
    return { group, parts, spin, angle, elevation };
  };
}
