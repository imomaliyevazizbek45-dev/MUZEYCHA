import * as THREE from 'three';
import { createRadialShadowTexture } from './museumTextures';

export interface PenguinRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  updateAnimation: (dt: number, speed: number, isWaving: boolean) => void;
  dispose: () => void;
}

/**
 * Composite 12-part procedural 3D Penguin character matching the cute penguin in Muzeycha.uz:
 * - Plump dark charcoal body + soft white belly
 * - Rounded head + dual-curve white face mask + shiny dark eyes + glossy catchlights + orange beak
 * - Articulated wings/flippers + orange webbed feet + grounded contact shadow
 */
export function createPenguinCharacter(): PenguinRig {
  const root = new THREE.Group();
  root.name = 'PenguinCharacter';

  // Ground contact shadow (prevents floating appearance)
  const shadowTex = createRadialShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.015;
  root.add(shadowPlane);

  // Materials with distinct roughness contrast per Three.js directives (>= 0.25 delta)
  const blackFeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c21,
    roughness: 0.82,
    metalness: 0.04,
  });

  const whiteBellyMat = new THREE.MeshStandardMaterial({
    color: 0xf9f6f1,
    roughness: 0.78,
    metalness: 0.02,
  });

  const orangeBeakFootMat = new THREE.MeshStandardMaterial({
    color: 0xf46b25,
    roughness: 0.45,
    metalness: 0.05,
  });

  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0b0e,
    roughness: 0.08,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const catchlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const blushMat = new THREE.MeshStandardMaterial({
    color: 0xf2939c,
    roughness: 0.85,
    transparent: true,
    opacity: 0.55,
  });

  // Body pivot sits at bottom-center above feet
  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.09;
  root.add(bodyPivot);

  // 1. Primary silhouette: plump torso
  const torsoGeo = new THREE.SphereGeometry(0.42, 28, 24);
  torsoGeo.scale(1.02, 1.18, 0.94);
  const torso = new THREE.Mesh(torsoGeo, blackFeatherMat);
  torso.position.y = 0.48;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  // 2. White oval belly patch (front is +Z in local penguin space)
  const bellyGeo = new THREE.SphereGeometry(0.35, 24, 20);
  bellyGeo.scale(0.88, 1.08, 0.55);
  const belly = new THREE.Mesh(bellyGeo, whiteBellyMat);
  belly.position.set(0, 0.45, 0.23);
  belly.castShadow = false;
  belly.receiveShadow = true;
  bodyPivot.add(belly);

  // 3. Tail tuft at back (-Z)
  const tailGeo = new THREE.ConeGeometry(0.11, 0.22, 12);
  const tail = new THREE.Mesh(tailGeo, blackFeatherMat);
  tail.position.set(0, 0.21, -0.39);
  tail.rotation.x = -Math.PI * 0.36;
  tail.castShadow = true;
  bodyPivot.add(tail);

  // 4. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.96, 0.02);
  bodyPivot.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.34, 28, 24);
  headGeo.scale(1.06, 0.95, 1.0);
  const head = new THREE.Mesh(headGeo, blackFeatherMat);
  head.castShadow = true;
  head.receiveShadow = true;
  headGroup.add(head);

  // White cheek face mask (left + right overlapping domes for heart-like widow's peak)
  const cheekGeo = new THREE.SphereGeometry(0.18, 20, 16);
  cheekGeo.scale(0.95, 1.05, 0.55);
  const leftCheek = new THREE.Mesh(cheekGeo, whiteBellyMat);
  leftCheek.position.set(-0.095, -0.04, 0.245);
  const rightCheek = new THREE.Mesh(cheekGeo, whiteBellyMat);
  rightCheek.position.set(0.095, -0.04, 0.245);
  const chinMask = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), whiteBellyMat);
  chinMask.scale.set(1.25, 0.72, 0.52);
  chinMask.position.set(0, -0.14, 0.24);
  headGroup.add(leftCheek, rightCheek, chinMask);

  // Eyes + glossy catchlights
  const eyeGeo = new THREE.SphereGeometry(0.046, 16, 14);
  const catchGeo = new THREE.SphereGeometry(0.015, 10, 8);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * 0.125, 0.015, 0.31);
    const catchlight = new THREE.Mesh(catchGeo, catchlightMat);
    catchlight.position.set(side * 0.115, 0.032, 0.348);
    headGroup.add(eye, catchlight);

    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), blushMat);
    blush.scale.set(1.2, 0.7, 0.4);
    blush.position.set(side * 0.195, -0.06, 0.28);
    headGroup.add(blush);
  }

  // Cute rounded beak
  const beakGeo = new THREE.ConeGeometry(0.082, 0.16, 16);
  const beak = new THREE.Mesh(beakGeo, orangeBeakFootMat);
  beak.rotation.x = Math.PI * 0.52;
  beak.scale.set(1.15, 1.0, 0.72);
  beak.position.set(0, -0.055, 0.37);
  beak.castShadow = true;
  headGroup.add(beak);

  // 5. Wings / Flippers
  const wingGeo = new THREE.SphereGeometry(0.14, 18, 16);
  wingGeo.scale(0.48, 1.85, 0.72);

  const leftWing = new THREE.Group();
  leftWing.position.set(-0.4, 0.66, 0.02);
  const leftWingMesh = new THREE.Mesh(wingGeo, blackFeatherMat);
  leftWingMesh.position.set(-0.04, -0.18, 0);
  leftWingMesh.castShadow = true;
  leftWing.add(leftWingMesh);
  bodyPivot.add(leftWing);

  const rightWing = new THREE.Group();
  rightWing.position.set(0.4, 0.66, 0.02);
  const rightWingMesh = new THREE.Mesh(wingGeo, blackFeatherMat);
  rightWingMesh.position.set(0.04, -0.18, 0);
  rightWingMesh.castShadow = true;
  rightWing.add(rightWingMesh);
  bodyPivot.add(rightWing);

  // 6. Orange webbed feet (bottom-center grounded at y = 0)
  function buildFoot(): THREE.Group {
    const fg = new THREE.Group();
    const padGeo = new THREE.BoxGeometry(0.17, 0.055, 0.24);
    const pad = new THREE.Mesh(padGeo, orangeBeakFootMat);
    pad.position.set(0, 0.028, 0.06);
    pad.castShadow = true;
    pad.receiveShadow = true;
    fg.add(pad);

    // Three rounded toes
    const toeGeo = new THREE.SphereGeometry(0.042, 12, 10);
    toeGeo.scale(0.85, 0.65, 1.45);
    for (const tx of [-0.055, 0, 0.055]) {
      const toe = new THREE.Mesh(toeGeo, orangeBeakFootMat);
      toe.position.set(tx, 0.028, 0.18);
      toe.castShadow = true;
      fg.add(toe);
    }
    return fg;
  }

  const leftFoot = buildFoot();
  leftFoot.position.set(-0.16, 0, 0.04);
  const rightFoot = buildFoot();
  rightFoot.position.set(0.16, 0, 0.04);
  root.add(leftFoot, rightFoot);

  let walkPhase = 0;
  let idlePhase = 0;

  function updateAnimation(dt: number, speed: number, isWaving: boolean) {
    idlePhase += dt * 2.4;
    const isMoving = speed > 0.08;

    if (isMoving) {
      walkPhase += dt * (4.5 + speed * 2.4);
      const step = Math.sin(walkPhase);
      const liftL = Math.max(0, Math.sin(walkPhase));
      const liftR = Math.max(0, -Math.sin(walkPhase));

      // Waddle tilt & bounce
      bodyPivot.rotation.z = step * 0.11;
      bodyPivot.position.y = 0.09 + Math.abs(step) * 0.035;
      headGroup.rotation.z = -step * 0.06;
      headGroup.rotation.y = Math.sin(walkPhase * 0.5) * 0.05;

      // Feet stride
      leftFoot.position.z = 0.04 + Math.sin(walkPhase) * 0.11;
      leftFoot.position.y = liftL * 0.055;
      leftFoot.rotation.x = -liftL * 0.25;

      rightFoot.position.z = 0.04 - Math.sin(walkPhase) * 0.11;
      rightFoot.position.y = liftR * 0.055;
      rightFoot.rotation.x = -liftR * 0.25;

      // Wing balance flap
      leftWing.rotation.z = 0.36 + Math.sin(walkPhase) * 0.2;
      rightWing.rotation.z = -0.36 + Math.sin(walkPhase) * 0.2;
      leftWing.rotation.x = -step * 0.22;
      rightWing.rotation.x = step * 0.22;
    } else {
      // Gentle breathing & optional friendly wave
      bodyPivot.rotation.z = THREE.MathUtils.damp(bodyPivot.rotation.z, 0, 8, dt);
      bodyPivot.position.y = 0.09 + Math.sin(idlePhase) * 0.012;
      headGroup.rotation.y = Math.sin(idlePhase * 0.55) * 0.08;
      headGroup.rotation.z = Math.sin(idlePhase * 0.7) * 0.03;

      leftFoot.position.z = THREE.MathUtils.damp(leftFoot.position.z, 0.04, 10, dt);
      leftFoot.position.y = THREE.MathUtils.damp(leftFoot.position.y, 0, 10, dt);
      leftFoot.rotation.x = THREE.MathUtils.damp(leftFoot.rotation.x, 0, 10, dt);

      rightFoot.position.z = THREE.MathUtils.damp(rightFoot.position.z, 0.04, 10, dt);
      rightFoot.position.y = THREE.MathUtils.damp(rightFoot.position.y, 0, 10, dt);
      rightFoot.rotation.x = THREE.MathUtils.damp(rightFoot.rotation.x, 0, 10, dt);

      if (isWaving) {
        rightWing.rotation.z = -1.65 + Math.sin(idlePhase * 2.8) * 0.32;
        rightWing.rotation.x = 0.15;
        leftWing.rotation.z = 0.32 + Math.sin(idlePhase) * 0.05;
        leftWing.rotation.x = 0;
      } else {
        leftWing.rotation.z = THREE.MathUtils.damp(
          leftWing.rotation.z,
          0.26 + Math.sin(idlePhase) * 0.04,
          6,
          dt
        );
        rightWing.rotation.z = THREE.MathUtils.damp(
          rightWing.rotation.z,
          -0.26 - Math.sin(idlePhase) * 0.04,
          6,
          dt
        );
        leftWing.rotation.x = THREE.MathUtils.damp(leftWing.rotation.x, 0, 8, dt);
        rightWing.rotation.x = THREE.MathUtils.damp(rightWing.rotation.x, 0, 8, dt);
      }
    }
  }

  function dispose() {
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    shadowTex.dispose();
  }

  return {
    root,
    bodyPivot,
    headGroup,
    leftWing,
    rightWing,
    leftFoot,
    rightFoot,
    updateAnimation,
    dispose,
  };
}
