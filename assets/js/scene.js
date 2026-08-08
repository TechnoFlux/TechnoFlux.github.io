// Background node graph. Scroll position morphs the point cloud between layouts.
import * as THREE from 'three';

const canvas = document.getElementById('bg');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
} catch {
  document.body.classList.add('no-webgl');
}

if (renderer) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 700;

  const COUNT = small ? 120 : 190;
  const RADIUS = 3.1;
  const LINK_DIST = (4.2 * RADIUS) / Math.sqrt(COUNT);
  const MAX_EDGES = 1000;
  const NARROW = small ? 0.5 : 1; // keep wide layouts on-screen for phones

  // Seeded so every layout is identical on each load and node i keeps its index.
  const rand = mulberry32(0x5eed);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

  const group = new THREE.Group();
  scene.add(group);

  const CYAN = new THREE.Color(0x4dd8e6);
  const INDIGO = new THREE.Color(0x8b9bff);

  /* -------- layouts: one Float32Array per scroll state -------- */

  // 0: shell
  const sphere = build((i) => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    const j = 0.86 + rand() * 0.28;
    return [Math.cos(th) * r * RADIUS * j, y * RADIUS * j, Math.sin(th) * r * RADIUS * j];
  });

  // 1: clusters
  const centers = [
    [-3.3 * NARROW, 0.6, 0],
    [0, -0.5, 0.6],
    [3.3 * NARROW, 0.7, -0.5],
  ];
  const clusters = build((i) => {
    const c = centers[i % 3];
    const r = 1.15 * Math.cbrt(rand());
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 2 - 1);
    return [
      c[0] + r * Math.sin(ph) * Math.cos(th),
      c[1] + r * Math.sin(ph) * Math.sin(th),
      c[2] + r * Math.cos(ph),
    ];
  });

  // 2: helix
  const helix = build((i) => {
    const t = i / (COUNT - 1);
    const a = t * Math.PI * 6.5;
    const r = (1.5 + Math.sin(t * Math.PI) * 0.85) * NARROW;
    return [Math.cos(a) * r, (t - 0.5) * 7.2, Math.sin(a) * r];
  });

  // 3: ring
  const ring = build((i) => {
    const a = (i / COUNT) * Math.PI * 2;
    const r = (3.15 + (rand() - 0.5) * 0.5) * NARROW;
    return [Math.cos(a) * r, (rand() - 0.5) * 0.7, Math.sin(a) * r];
  });

  const STATES = [sphere, clusters, helix, ring];
  const CAM_Z = [7.2, 8.0, 8.6, 7.6];

  /* -------- geometry -------- */
  const nodePos = new Float32Array(sphere); // live buffer, mutated each frame
  const nodeCol = new Float32Array(COUNT * 3);
  const c = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    c.copy(CYAN).lerp(INDIGO, (sphere[i * 3 + 1] / RADIUS + 1) / 2);
    nodeCol.set([c.r, c.g, c.b], i * 3);
  }

  const nodeGeo = new THREE.BufferGeometry();
  const nodeAttr = new THREE.BufferAttribute(nodePos, 3);
  nodeAttr.setUsage(THREE.DynamicDrawUsage);
  nodeGeo.setAttribute('position', nodeAttr);
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));

  group.add(
    new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({
        size: 0.105,
        map: glowSprite(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })
    )
  );

  // Adjacency computed once from the shell, then frozen.
  const pairs = [];
  const d = new THREE.Vector3();
  outer: for (let i = 0; i < COUNT; i++) {
    for (let j = i + 1; j < COUNT; j++) {
      d.set(
        sphere[i * 3] - sphere[j * 3],
        sphere[i * 3 + 1] - sphere[j * 3 + 1],
        sphere[i * 3 + 2] - sphere[j * 3 + 2]
      );
      if (d.length() > LINK_DIST) continue;
      pairs.push(i, j);
      if (pairs.length / 2 >= MAX_EDGES) break outer;
    }
  }

  const edgePos = new Float32Array(pairs.length * 3);
  const edgeCol = new Float32Array(pairs.length * 3);
  for (let e = 0; e < pairs.length; e++) {
    const n = pairs[e];
    edgeCol.set([nodeCol[n * 3], nodeCol[n * 3 + 1], nodeCol[n * 3 + 2]], e * 3);
  }

  const edgeGeo = new THREE.BufferGeometry();
  const edgeAttr = new THREE.BufferAttribute(edgePos, 3);
  edgeAttr.setUsage(THREE.DynamicDrawUsage);
  edgeGeo.setAttribute('position', edgeAttr);
  edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3));

  group.add(
    new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );

  /* -------- scroll -------- */
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  let targetP = 0;
  let currentP = 0;
  window.addEventListener(
    'scroll',
    () => {
      targetP = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
    },
    { passive: true }
  );

  const pointer = { x: 0, y: 0 };
  if (!reduced) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });

  function applyState(p) {
    const seg = p * (STATES.length - 1);
    const i0 = Math.min(STATES.length - 2, Math.floor(seg));
    const t = smoothstep(seg - i0);
    const A = STATES[i0];
    const B = STATES[i0 + 1];

    for (let k = 0; k < nodePos.length; k++) nodePos[k] = A[k] + (B[k] - A[k]) * t;
    nodeAttr.needsUpdate = true;

    for (let e = 0; e < pairs.length; e++) {
      const n = pairs[e] * 3;
      edgePos[e * 3] = nodePos[n];
      edgePos[e * 3 + 1] = nodePos[n + 1];
      edgePos[e * 3 + 2] = nodePos[n + 2];
    }
    edgeAttr.needsUpdate = true;

    camera.position.z = CAM_Z[i0] + (CAM_Z[i0 + 1] - CAM_Z[i0]) * t;
  }

  group.rotation.set(0.35, 0.4, 0);
  applyState(0);

  if (reduced) {
    renderer.render(scene, camera);
  } else {
    let drift = 0;
    (function loop() {
      requestAnimationFrame(loop);
      if (document.hidden) return;

      currentP += (targetP - currentP) * 0.075;
      drift += 0.0005;

      applyState(currentP);
      group.rotation.y = 0.4 + currentP * Math.PI * 1.5 + drift + pointer.x * 0.16;
      group.rotation.x = 0.35 + currentP * 0.5 + pointer.y * 0.1;

      renderer.render(scene, camera);
    })();
  }

  /* -------- helpers -------- */
  function build(fn) {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) arr.set(fn(i), i * 3);
    return arr;
  }
}

function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function glowSprite() {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
