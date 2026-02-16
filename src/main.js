import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const app = document.querySelector('#app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a12);
scene.fog = new THREE.FogExp2(0x0a1020, 0.026);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(0, 1.75, 11);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

renderer.domElement.addEventListener('click', () => controls.lock());

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

const officeHalfX = 18;
const officeHalfZ = 14;

function clampPlayer() {
  const p = controls.getObject().position;
  p.x = THREE.MathUtils.clamp(p.x, -officeHalfX + 1.1, officeHalfX - 1.1);
  p.z = THREE.MathUtils.clamp(p.z, -officeHalfZ + 1.1, officeHalfZ - 1.1);
  p.y = 1.75;
}

function makeMaterial(base, emissive = 0x000000, eInt = 0) {
  return new THREE.MeshStandardMaterial({
    color: base,
    roughness: 0.55,
    metalness: 0.18,
    emissive,
    emissiveIntensity: eInt,
  });
}

scene.add(new THREE.HemisphereLight(0x94b8ff, 0x2d1d14, 0.42));

const keyLight = new THREE.DirectionalLight(0xffd5ad, 1.05);
keyLight.position.set(9, 14, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -30;
keyLight.shadow.camera.right = 30;
keyLight.shadow.camera.top = 30;
keyLight.shadow.camera.bottom = -30;
scene.add(keyLight);

const cyanFill = new THREE.PointLight(0x42d9ff, 4, 26, 2.1);
cyanFill.position.set(-8, 3.2, -4);
scene.add(cyanFill);

const magentaFill = new THREE.PointLight(0xff4cd7, 3.6, 24, 2.2);
magentaFill.position.set(8, 3, -5);
scene.add(magentaFill);

// Floor (warm loft wood tone)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(42, 32, 8, 8),
  new THREE.MeshStandardMaterial({ color: 0x6b4e38, roughness: 0.85, metalness: 0.05 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const rug = new THREE.Mesh(
  new THREE.CircleGeometry(5.3, 48),
  new THREE.MeshStandardMaterial({
    color: 0x1f2238,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x1b3650,
    emissiveIntensity: 0.2,
  })
);
rug.rotation.x = -Math.PI / 2;
rug.position.y = 0.01;
scene.add(rug);

// Walls and beams
const wallMat = new THREE.MeshStandardMaterial({ color: 0x141a2a, roughness: 0.78, metalness: 0.12 });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(40, 7, 0.6), wallMat);
backWall.position.set(0, 3.5, -14.25);
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 28), wallMat);
leftWall.position.set(-20.2, 3.5, 0);
scene.add(leftWall);

const rightWall = leftWall.clone();
rightWall.position.x = 20.2;
scene.add(rightWall);

for (let i = -3; i <= 3; i++) {
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 7.3, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x4f3728, roughness: 0.85, metalness: 0.08 })
  );
  beam.position.set(i * 5.8, 3.65, -13.9);
  scene.add(beam);
}

// Central hologram table
const tableBase = new THREE.Mesh(
  new THREE.CylinderGeometry(2.35, 2.7, 1.1, 32),
  makeMaterial(0x2f3345, 0x122436, 0.16)
);
tableBase.position.set(0, 0.55, 0);
tableBase.castShadow = true;
tableBase.receiveShadow = true;
scene.add(tableBase);

const holoDisk = new THREE.Mesh(
  new THREE.CylinderGeometry(2.5, 2.5, 0.12, 42),
  new THREE.MeshStandardMaterial({
    color: 0x3ac8ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.12,
    metalness: 0.88,
    emissive: 0x33c6ff,
    emissiveIntensity: 0.8,
  })
);
holoDisk.position.set(0, 1.36, 0);
scene.add(holoDisk);

const holoCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.75, 0),
  new THREE.MeshStandardMaterial({
    color: 0x89eaff,
    metalness: 0.35,
    roughness: 0.2,
    transparent: true,
    opacity: 0.82,
    emissive: 0x45d9ff,
    emissiveIntensity: 0.65,
  })
);
holoCore.position.set(0, 2.2, 0);
scene.add(holoCore);

// Floating rings
const rings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.1 + i * 0.38, 0.025, 14, 64),
    new THREE.MeshStandardMaterial({
      color: 0x48d5ff,
      emissive: 0x2fb2ff,
      emissiveIntensity: 0.6,
      metalness: 0.75,
      roughness: 0.22,
      transparent: true,
      opacity: 0.9,
    })
  );
  ring.position.set(0, 1.8 + i * 0.38, 0);
  ring.rotation.x = Math.PI / 2.35;
  scene.add(ring);
  rings.push(ring);
}

// Agent stations + labels + status cards
function makeLabelTexture(title, lines = []) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext('2d');

  c.fillStyle = 'rgba(7,12,20,0.88)';
  c.fillRect(0, 0, canvas.width, canvas.height);

  const grd = c.createLinearGradient(0, 0, canvas.width, canvas.height);
  grd.addColorStop(0, 'rgba(61, 216, 255, 0.25)');
  grd.addColorStop(1, 'rgba(255, 190, 115, 0.18)');
  c.fillStyle = grd;
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.strokeStyle = 'rgba(120,240,255,0.9)';
  c.lineWidth = 8;
  c.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  c.fillStyle = '#8bf3ff';
  c.font = '700 76px Inter, sans-serif';
  c.fillText(title, 48, 112);

  c.fillStyle = '#ffe0bc';
  c.font = '500 44px Inter, sans-serif';
  lines.forEach((line, i) => c.fillText(line, 48, 212 + i * 62));

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createStation({ name, role, status, x, z, tint }) {
  const group = new THREE.Group();

  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.24, 1.6), makeMaterial(0x3b2d24));
  desk.position.set(0, 0.75, 0);
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk);

  const supportL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 1.42), makeMaterial(0x1f2331));
  supportL.position.set(-1.35, 0.42, 0);
  const supportR = supportL.clone();
  supportR.position.x = 1.35;
  group.add(supportL, supportR);

  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.68, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x141824, emissive: tint, emissiveIntensity: 0.45, metalness: 0.2, roughness: 0.5 })
  );
  monitor.position.set(0, 1.35, -0.46);
  group.add(monitor);

  const glow = new THREE.PointLight(tint, 1.6, 6, 2);
  glow.position.set(0, 1.4, -0.3);
  group.add(glow);

  const card = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeLabelTexture(name, [role, status]),
    transparent: true,
    depthWrite: false,
  }));
  card.scale.set(2.9, 1.45, 1);
  card.position.set(0, 2.35, -0.2);
  group.add(card);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.03, 12, 44),
    new THREE.MeshStandardMaterial({ color: tint, emissive: tint, emissiveIntensity: 0.6, metalness: 0.78, roughness: 0.18 })
  );
  halo.position.set(0, 1.9, -0.12);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  group.position.set(x, 0, z);
  group.userData = { card, halo, phase: Math.random() * Math.PI * 2 };
  scene.add(group);
  return group;
}

const stations = [
  createStation({ name: 'Agent Atlas', role: 'Systems + Routing', status: 'Status: Online', x: -11, z: -7, tint: 0x4ed9ff }),
  createStation({ name: 'Agent Echo', role: 'Comms + QA', status: 'Status: In Review', x: 11, z: -7, tint: 0xff7be7 }),
  createStation({ name: 'Agent Forge', role: 'Build + Infra', status: 'Status: Deploying', x: -11, z: 7, tint: 0xffb467 }),
  createStation({ name: 'Agent Nova', role: 'Research + UX', status: 'Status: Syncing', x: 11, z: 7, tint: 0x88ffbe }),
];

// Ambient particles
const particleCount = 280;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
const particleSeed = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;
  particlePos[i3] = (Math.random() - 0.5) * 38;
  particlePos[i3 + 1] = Math.random() * 5.5 + 0.2;
  particlePos[i3 + 2] = (Math.random() - 0.5) * 28;
  particleSeed[i] = Math.random() * 100;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

const particles = new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({
    color: 0x89e9ff,
    size: 0.06,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
scene.add(particles);

// Neon strips
for (let i = -1; i <= 1; i++) {
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 26),
    new THREE.MeshStandardMaterial({
      color: 0x65e8ff,
      emissive: 0x4ad9ff,
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.25,
    })
  );
  strip.position.set(i * 9.2, 6.15, 0);
  scene.add(strip);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function setMove(code, pressed) {
  if (code === 'KeyW') keys.forward = pressed;
  if (code === 'KeyS') keys.backward = pressed;
  if (code === 'KeyA') keys.left = pressed;
  if (code === 'KeyD') keys.right = pressed;
  if (code === 'ShiftLeft' || code === 'ShiftRight') keys.sprint = pressed;
}

window.addEventListener('keydown', (e) => setMove(e.code, true));
window.addEventListener('keyup', (e) => setMove(e.code, false));

const forward = new THREE.Vector3();
const right = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const dt = Math.min(clock.getDelta(), 0.035);

  // Hologram animation
  holoCore.rotation.x += 0.006;
  holoCore.rotation.y += 0.012;
  holoCore.position.y = 2.15 + Math.sin(elapsed * 1.6) * 0.12;
  holoDisk.material.opacity = 0.3 + Math.sin(elapsed * 2.2) * 0.08;

  rings.forEach((ring, i) => {
    ring.rotation.z = elapsed * (0.4 + i * 0.21) * (i % 2 === 0 ? 1 : -1);
    ring.position.y = 1.7 + i * 0.36 + Math.sin(elapsed * 1.8 + i) * 0.05;
  });

  stations.forEach((st, i) => {
    const { card, halo, phase } = st.userData;
    card.position.y = 2.3 + Math.sin(elapsed * 1.8 + phase) * 0.11;
    card.material.opacity = 0.86 + Math.sin(elapsed * 2.3 + i) * 0.09;
    halo.rotation.z = elapsed * (0.6 + i * 0.15);
  });

  // Ambient particle drift
  const pos = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    pos[i3 + 1] += Math.sin(elapsed * 0.9 + particleSeed[i]) * 0.0009;
    if (pos[i3 + 1] > 6.2) pos[i3 + 1] = 0.2;
    if (pos[i3 + 1] < 0.2) pos[i3 + 1] = 6.2;
  }
  particleGeo.attributes.position.needsUpdate = true;

  // Movement
  if (controls.isLocked) {
    const speed = keys.sprint ? 8.8 : 5.2;

    direction.set(0, 0, 0);
    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;
    if (direction.lengthSq() > 0) direction.normalize();

    velocity.x = THREE.MathUtils.damp(velocity.x, direction.x * speed, 8, dt);
    velocity.z = THREE.MathUtils.damp(velocity.z, direction.z * speed, 8, dt);

    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();

    controls.getObject().position.addScaledVector(forward, velocity.z * dt);
    controls.getObject().position.addScaledVector(right, -velocity.x * dt);

    clampPlayer();
  }

  // Light pulse
  cyanFill.intensity = 3.5 + Math.sin(elapsed * 1.4) * 0.6;
  magentaFill.intensity = 3.2 + Math.sin(elapsed * 1.1 + 1.8) * 0.7;

  renderer.render(scene, camera);
}

animate();
