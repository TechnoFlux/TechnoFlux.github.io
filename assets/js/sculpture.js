import * as THREE from 'three';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';

// Original procedural sculpture: nested trust boundaries, separated by user input.
// No remote assets, trackers, or generated claims about a real target.
function roundedPath(path, size, radius) {
  const h = size / 2, r = radius;
  path.moveTo(-h + r, -h); path.lineTo(h - r, -h);
  path.quadraticCurveTo(h, -h, h, -h + r); path.lineTo(h, h - r);
  path.quadraticCurveTo(h, h, h - r, h); path.lineTo(-h + r, h);
  path.quadraticCurveTo(-h, h, -h, h - r); path.lineTo(-h, -h + r);
  path.quadraticCurveTo(-h, -h, -h + r, -h);
  return path;
}
function frameGeometry(size, width, depth) {
  const shape = roundedPath(new THREE.Shape(), size, .32);
  shape.holes.push(roundedPath(new THREE.Path(), size - width * 2, .23));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: .04, bevelThickness: .04, curveSegments: 12 });
  g.center(); return g;
}
function circuitTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d');
  c.fillStyle = '#101d34'; c.fillRect(0, 0, 512, 512);
  c.strokeStyle = '#304a70'; c.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 64 + i * 48;
    c.beginPath(); c.moveTo(0, y); c.lineTo(60 + i * 11, y); c.lineTo(100 + i * 11, y - 28); c.lineTo(190, y - 28); c.stroke();
    c.beginPath(); c.moveTo(512, y); c.lineTo(442 - i * 9, y); c.lineTo(402 - i * 9, y + 28); c.lineTo(320, y + 28); c.stroke();
    c.fillStyle = '#9cb9dd'; c.fillRect(60 + i * 11 - 3, y - 3, 6, 6); c.fillRect(442 - i * 9 - 3, y - 3, 6, 6);
  }
  c.strokeStyle = '#849cb9'; c.strokeRect(180, 180, 152, 152);
  c.fillStyle = '#405b80'; c.fillRect(192, 192, 128, 128);
  c.strokeStyle = '#e2b197'; c.lineWidth = 3; c.strokeRect(211, 211, 90, 90);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export function createSculpture(canvas, isStory) {
  const host = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.2 : 1.7));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, .04);
  scene.environment = env.texture; scene.environmentIntensity = .85;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc5ddff, 0x12203f, 2.2));
  const key = new THREE.DirectionalLight(0xd9eaff, 5); key.position.set(2, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x719de8, 4); rim.position.set(-4, -1, -2); scene.add(rim);
  const warm = new THREE.PointLight(0xffb38e, 14, 9); warm.position.set(0, 0, 2); scene.add(warm);
  const root = new THREE.Group(); scene.add(root);
  const silver = new THREE.MeshStandardMaterial({ color: 0xb5c8e2, metalness: .96, roughness: .22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x203755, metalness: .85, roughness: .3 });
  const pearl = new THREE.MeshStandardMaterial({ color: 0x719dcb, metalness: .8, roughness: .23 });
  const light = new THREE.MeshBasicMaterial({ color: 0xa7d9ff });
  const amber = new THREE.MeshStandardMaterial({ color: 0xeac0a3, metalness: .75, roughness: .21, emissive: 0xb45425, emissiveIntensity: .35 });
  const layers = [];
  const frameGeo = frameGeometry(2.55, .17, .13);
  for (let i = 0; i < 5; i++) {
    const layer = new THREE.Group();
    const frame = new THREE.Mesh(frameGeo, i % 2 === 0 ? silver : dark); layer.add(frame);
    // Thin illuminated registration strips along the edges of each shell.
    const stripGeo = new THREE.BoxGeometry(.5, .014, .022);
    for (const sign of [-1, 1]) {
      const strip = new THREE.Mesh(stripGeo, light); strip.position.set(sign * .65, sign * 1.27, .08); layer.add(strip);
    }
    for (const x of [-1.08, 1.08]) for (const y of [-1.08, 1.08]) {
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .025, 10), pearl);
      rivet.rotation.x = Math.PI / 2; rivet.position.set(x, y, .09); layer.add(rivet);
    }
    if (i === 0 || i === 4) {
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.13, 2.13), new THREE.MeshStandardMaterial({ color: 0x547299, metalness: .58, roughness: .26, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }));
      layer.add(plate);
    }
    root.add(layer); layers.push(layer);
  }
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.87, 1.87, .085), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: circuitTexture(), metalness: .65, roughness: .35 }), dark]);
  root.add(board);
  const core = new THREE.Group();
  const coreShape = roundedPath(new THREE.Shape(), .69, .09);
  const coreGeo = new THREE.ExtrudeGeometry(coreShape, { depth: .3, bevelEnabled: true, bevelSize: .055, bevelThickness: .055, bevelSegments: 4, curveSegments: 10 }); coreGeo.center();
  const chip = new THREE.Mesh(coreGeo, amber); core.add(chip);
  const chipFace = new THREE.Mesh(frameGeometry(.44, .025, .01), new THREE.MeshBasicMaterial({ color: 0xffdfc5 })); chipFace.position.z = .21; core.add(chipFace);
  for (let j = 0; j < 4; j++) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(.025, .16, .008), light);
    mark.position.set(-.105 + j * .07, 0, .219); core.add(mark);
  }
  root.add(core);
  const routeGroup = new THREE.Group(); root.add(routeGroup);
  const routeMaterial = new THREE.MeshBasicMaterial({ color: 0xc8e4ff, transparent: true, opacity: .75 });
  const points = [new THREE.Vector3(-1.15, -.82, -.9), new THREE.Vector3(-.58, -.82, -.9), new THREE.Vector3(-.58, .12, .4), new THREE.Vector3(.28, .12, .4), new THREE.Vector3(.28, .86, 1.2), new THREE.Vector3(1.15, .86, 1.2)];
  const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', .05);
  const route = new THREE.Mesh(new THREE.TubeGeometry(path, 80, .012, 6, false), routeMaterial); routeGroup.add(route);
  const nodes = points.map((position, i) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(i === 5 ? .065 : .037, 12, 12), i === 5 ? amber : light); node.position.copy(position); routeGroup.add(node); return node;
  });
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(.042, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffe3c4 })); routeGroup.add(pulse);
  // A technical axis sits behind the sculpture, in world space rather than screen decoration.
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.08, .006, 4, 160), new THREE.MeshBasicMaterial({ color: 0x344c70, transparent: true, opacity: .6 }));
  orbit.rotation.x = .8; orbit.rotation.y = .3; scene.add(orbit);
  let handoff = 0, desired = 0, current = 0, paused = false, visible = true, frame = 0, dirty = true;
  const pointer = { x: 0, y: 0 };
  let width = 1, height = 1, lastTime = 0;
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  function resize() {
    width = host.clientWidth; height = host.clientHeight;
    renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); dirty = true; start();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0 }); visibility.observe(host);
  host.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const r = host.getBoundingClientRect(); pointer.x = (event.clientX - r.left) / r.width - .5; pointer.y = (event.clientY - r.top) / r.height - .5; dirty = true; start();
  }, { passive: true });
  host.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; dirty = true; start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); stop(); host.classList.remove('webgl-ready'); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  function draw(time) {
    if (!visible || document.hidden) { frame = 0; return; }
    const t = paused ? 0 : time * .001;
    const delta = Math.min(.05, lastTime ? (time - lastTime) / 1000 : 1 / 60);
    lastTime = time;
    current += (desired - current) * (paused ? 1 : 1 - Math.exp(-delta / .18));
    const separation = Math.min(1, current);
    const trace = Math.max(0, current - 1);
    layers.forEach((layer, i) => {
      layer.position.z = (i - 2) * (.22 + separation * .72);
      layer.rotation.z = (i - 2) * (.035 + separation * .08) + trace * (i - 2) * .11;
      layer.position.x = trace * (i - 2) * .1;
    });
    core.position.z = .27 + separation * .53 + trace * .3;
    board.position.z = -.12;
    root.rotation.set(.22 + current * .10 + Math.sin(t * .28) * .035 + pointer.y * .1, -.52 - current * .36 + pointer.x * .15, -.37 + current * .13);
    root.rotation.x *= 1 - handoff * .9;
    root.rotation.y *= 1 - handoff * .95;
    root.rotation.z *= 1 - handoff;
    core.scale.setScalar(1 - handoff * .95);
    root.position.y = Math.sin(t * .45) * .04 + (isStory ? .13 : 0);
    routeGroup.visible = trace > .05;
    routeMaterial.opacity = trace * .85;
    pulse.position.copy(path.getPoint((t * .15) % 1));
    const mobile = width < 650;
    let distance = isStory ? (mobile ? 10.8 : 8.5) - trace * .9 : (mobile ? 10.6 : 8.5) + current * .7;
    distance *= 1 - handoff * .76;
    camera.position.set(isStory ? .2 - current * .3 : .1, .55 + current * .12, distance);
    camera.lookAt(0, 0, 0);
    if (isStory && width > 900) { camera.setViewOffset(width, height, -width * .18, 0, width, height); } else camera.clearViewOffset();
    orbit.rotation.z = current * .4; orbit.material.opacity = .45 - trace * .2;
    renderer.render(scene, camera); host.classList.add('webgl-ready'); dirty = false;
    frame = 0;
    if (!paused || Math.abs(current - desired) > .002) frame = requestAnimationFrame(draw);
  }
  function start() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  resize();
  return {
    setHandoff(value) { if (handoff === value) return; handoff = value; dirty = true; start(); },
    setMode(value) { desired = value; dirty = true; start(); },
    setProgress(value) { if (desired === value * 2) return; desired = value * 2; dirty = true; start(); },
    setPaused(value) { paused = value; dirty = true; start(); }
  };
}
