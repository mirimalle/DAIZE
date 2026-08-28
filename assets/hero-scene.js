import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const container = document.getElementById('heroLogo');
const canvas = document.getElementById('heroLogoCanvas');

if (container && canvas) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 4.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Studio-style environment lighting for the glossy PBR material
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xbfffe0, 0.4);
  fillLight.position.set(-4, -2, -3);
  scene.add(fillLight);

  // Rig holds both pieces together so the whole logo can be rotated as one
  const rig = new THREE.Group();
  scene.add(rig);

  // Static S-curve body
  const bodyGroup = new THREE.Group();
  rig.add(bodyGroup);

  // Draggable ball (position is local to the rig)
  const ballGroup = new THREE.Group();
  const restPosition = new THREE.Vector3(0.08, 0.5, 0.3);
  ballGroup.position.copy(restPosition);
  rig.add(ballGroup);

  const loader = new GLTFLoader();
  let ballMesh = null;

  loader.load('assets/models/body.glb', (gltf) => {
    bodyGroup.add(gltf.scene);
  });

  loader.load('assets/models/ball.glb', (gltf) => {
    gltf.scene.scale.setScalar(0.136);
    ballGroup.add(gltf.scene);
    ballMesh = gltf.scene;
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // --- Pointer interaction ---
  // Drag the ball itself to move it (springs back on release).
  // Drag anywhere else to rotate the whole logo (springs back to its original pose on release).
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const planeIntersect = new THREE.Vector3();
  const dragOffset = new THREE.Vector3();
  const ballWorldPos = new THREE.Vector3();
  const targetPosition = restPosition.clone();
  const maxDragRadius = 0.85;

  const rotateSensitivity = 0.006;
  const maxPitch = THREE.MathUtils.degToRad(55);
  const rotationTarget = { x: 0, y: 0 };
  const rotationSpringVel = { x: 0, y: 0 }; // angular velocity used once the drag is released
  const ballSpringVel = { x: 0, y: 0, z: 0 }; // velocity used once the ball is released
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastMoveTime = 0;
  let pointerMode = null; // 'ball' | 'rotate'

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    pointerNDC.x = ((point.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((point.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function intersectsBall() {
    if (!ballMesh) return false;
    raycaster.setFromCamera(pointerNDC, camera);
    return raycaster.intersectObject(ballMesh, true).length > 0;
  }

  canvas.addEventListener('pointermove', (e) => {
    updatePointer(e);
    if (pointerMode === 'ball') {
      raycaster.setFromCamera(pointerNDC, camera);
      if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
        const nextWorld = planeIntersect.clone().add(dragOffset);
        const nextLocal = rig.worldToLocal(nextWorld);
        const fromRest = nextLocal.clone().sub(restPosition);
        if (fromRest.length() > maxDragRadius) {
          fromRest.setLength(maxDragRadius);
          nextLocal.copy(restPosition).add(fromRest);
        }
        targetPosition.copy(nextLocal);
      }
    } else if (pointerMode === 'rotate') {
      const now = performance.now();
      const dt = Math.max((now - lastMoveTime) / 1000, 1 / 120);
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastMoveTime = now;

      rotationTarget.y += dx * rotateSensitivity;
      rotationTarget.x = THREE.MathUtils.clamp(rotationTarget.x + dy * rotateSensitivity, -maxPitch, maxPitch);
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    updatePointer(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* no active pointer to capture (e.g. synthetic events) */ }

    if (intersectsBall()) {
      pointerMode = 'ball';
      ballSpringVel.x = 0;
      ballSpringVel.y = 0;
      ballSpringVel.z = 0;
      ballGroup.getWorldPosition(ballWorldPos);

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      dragPlane.setFromNormalAndCoplanarPoint(camDir, ballWorldPos);

      raycaster.setFromCamera(pointerNDC, camera);
      raycaster.ray.intersectPlane(dragPlane, planeIntersect);
      dragOffset.copy(ballWorldPos).sub(planeIntersect);
    } else {
      pointerMode = 'rotate';
      rotationSpringVel.x = 0;
      rotationSpringVel.y = 0;
      rotationTarget.x = rig.rotation.x;
      rotationTarget.y = rig.rotation.y;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastMoveTime = performance.now();
    }
  });

  function endDrag(e) {
    if (!pointerMode) return;
    pointerMode = null;
    if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // Frame-rate independent exponential smoothing: current + (target - current) * (1 - e^(-lambda * dt))
  function damp(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
  }

  const ballLambda = prefersReducedMotion ? Infinity : 12;
  const rotateLambda = prefersReducedMotion ? Infinity : 10;
  // Damped spring pulling the rotation back to its original orientation on release
  const springStiffness = prefersReducedMotion ? 0 : 90;
  const springDamping = prefersReducedMotion ? 0 : 12;

  const clock = new THREE.Clock();
  (function animate() {
    const dt = Math.min(clock.getDelta(), 1 / 15);

    if (pointerMode === 'ball') {
      ballGroup.position.x = damp(ballGroup.position.x, targetPosition.x, ballLambda, dt);
      ballGroup.position.y = damp(ballGroup.position.y, targetPosition.y, ballLambda, dt);
      ballGroup.position.z = damp(ballGroup.position.z, targetPosition.z, ballLambda, dt);
    } else if (prefersReducedMotion) {
      ballGroup.position.copy(restPosition);
    } else {
      // Spring-back to rest (slight overshoot then settle), same feel as the rotation spring
      const accelX = -springStiffness * (ballGroup.position.x - restPosition.x) - springDamping * ballSpringVel.x;
      const accelY = -springStiffness * (ballGroup.position.y - restPosition.y) - springDamping * ballSpringVel.y;
      const accelZ = -springStiffness * (ballGroup.position.z - restPosition.z) - springDamping * ballSpringVel.z;
      ballSpringVel.x += accelX * dt;
      ballSpringVel.y += accelY * dt;
      ballSpringVel.z += accelZ * dt;
      ballGroup.position.x += ballSpringVel.x * dt;
      ballGroup.position.y += ballSpringVel.y * dt;
      ballGroup.position.z += ballSpringVel.z * dt;
    }

    if (pointerMode === 'rotate') {
      rig.rotation.y = damp(rig.rotation.y, rotationTarget.y, rotateLambda, dt);
      rig.rotation.x = damp(rig.rotation.x, rotationTarget.x, rotateLambda, dt);
    } else if (prefersReducedMotion) {
      rig.rotation.set(0, 0, 0);
    } else {
      // Spring-back to the original pose (slight overshoot then settle)
      const accelX = -springStiffness * rig.rotation.x - springDamping * rotationSpringVel.x;
      const accelY = -springStiffness * rig.rotation.y - springDamping * rotationSpringVel.y;
      rotationSpringVel.x += accelX * dt;
      rotationSpringVel.y += accelY * dt;
      rig.rotation.x += rotationSpringVel.x * dt;
      rig.rotation.y += rotationSpringVel.y * dt;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  })();
}
