import * as THREE from 'three';
import { createRadialShadowTexture } from './museumTextures';

export type VisitorGender = 'boy' | 'girl';

export interface VisitorCharacterRig {
  root: THREE.Group;
  gender: VisitorGender;
  updateAnimation: (dt: number, speed: number, isWaving: boolean) => void;
  dispose: () => void;
}

export type BoyCharacterRig = VisitorCharacterRig;

function createFabricTexture(baseHex: string, threadHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = threadHex;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.16;
  for (let i = -256; i < 512; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.06;
  for (let y = 0; y < 256; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(0, y, 256, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ecc2a6');
  grad.addColorStop(0.5, '#f2c9ae');
  grad.addColorStop(0.85, '#e8ba9d');
  grad.addColorStop(1, '#deb295');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 160; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 6 + Math.random() * 14;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 2 === 0 ? 'rgba(235, 165, 140, 0.05)' : 'rgba(255, 228, 208, 0.05)');
    g.addColorStop(1, 'rgba(240, 199, 171, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHairTexture(base: string, hi: string, lo: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let x = 0; x < 256; x += 2) {
    ctx.strokeStyle = x % 6 === 0 ? hi : x % 4 === 0 ? lo : base;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 3, 85, x - 3, 170, x, 256);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Shared realistic oval head builder with guaranteed 360-degree Lathe hair skullcap
 * (+10mm thicker than skin across crown/temples/nape so zero skin ever pokes through).
 */
function buildNaturalHead(opts: {
  skinMat: THREE.Material;
  hairMat: THREE.Material;
  lipMat: THREE.Material;
  scleraMat: THREE.Material;
  irisMat: THREE.Material;
  pupilMat: THREE.Material;
  catchlightMat: THREE.Material;
  isGirl: boolean;
  accentMat?: THREE.Material;
}): THREE.Group {
  const {
    skinMat,
    hairMat,
    lipMat,
    scleraMat,
    irisMat,
    pupilMat,
    catchlightMat,
    isGirl,
    accentMat,
  } = opts;

  const headGroup = new THREE.Group();

  // Tapered jaw + cheekbones + oval cranium
  const headProfile = isGirl
    ? [
        new THREE.Vector2(0.004, -0.108),
        new THREE.Vector2(0.036, -0.098),
        new THREE.Vector2(0.062, -0.066),
        new THREE.Vector2(0.077, -0.025),
        new THREE.Vector2(0.082, 0.025),
        new THREE.Vector2(0.078, 0.072),
        new THREE.Vector2(0.058, 0.102),
        new THREE.Vector2(0.004, 0.114),
      ]
    : [
        new THREE.Vector2(0.004, -0.114),
        new THREE.Vector2(0.042, -0.104),
        new THREE.Vector2(0.067, -0.07),
        new THREE.Vector2(0.081, -0.026),
        new THREE.Vector2(0.085, 0.025),
        new THREE.Vector2(0.081, 0.074),
        new THREE.Vector2(0.061, 0.105),
        new THREE.Vector2(0.004, 0.116),
      ];

  const headGeo = new THREE.LatheGeometry(headProfile, 28);
  headGeo.scale(0.92, 1.0, 1.05);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Subtle Ears
  const earGeo = new THREE.SphereGeometry(0.022, 12, 10);
  earGeo.scale(0.36, 1.24, 0.72);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(side * (isGirl ? 0.077 : 0.08), -0.006, -0.005);
    ear.rotation.z = side * -0.1;
    ear.castShadow = true;
    headGroup.add(ear);
  }

  // 1) Seamless 360-degree Upper Hair Skullcap (exact headProfile + 0.011m margin from forehead line up!)
  const upperCapProfile = [
    new THREE.Vector2(0.089, 0.052),
    new THREE.Vector2(0.092, 0.074),
    new THREE.Vector2(0.075, 0.108),
    new THREE.Vector2(0.042, 0.123),
    new THREE.Vector2(0.004, 0.128),
  ];
  const upperCapGeo = new THREE.LatheGeometry(upperCapProfile, 28);
  upperCapGeo.scale(0.94, 1.0, 1.08);
  const upperCap = new THREE.Mesh(upperCapGeo, hairMat);
  upperCap.rotation.x = -0.1; // Slight natural tilt back to reveal forehead while covering crown completely
  upperCap.position.set(0, 0.004, -0.006);
  upperCap.castShadow = true;
  headGroup.add(upperCap);

  // 2) Seamless Side & Back Hair Wrap (from right temple around back of head to left temple)
  const backWrapProfile = [
    new THREE.Vector2(0.07, -0.076),
    new THREE.Vector2(0.088, -0.032),
    new THREE.Vector2(0.094, 0.022),
    new THREE.Vector2(0.092, 0.068),
    new THREE.Vector2(0.074, 0.102),
  ];
  // LatheGeometry: phi=0 is +Z (face), phi=PI is -Z (back). Cover phi from 0.36*PI to 1.64*PI cleanly!
  const backWrapGeo = new THREE.LatheGeometry(
    backWrapProfile,
    24,
    Math.PI * 0.36,
    Math.PI * 1.28
  );
  backWrapGeo.scale(0.95, 1.0, 1.09);
  const backWrap = new THREE.Mesh(backWrapGeo, hairMat);
  backWrap.castShadow = true;
  headGroup.add(backWrap);

  if (!isGirl) {
    // Natural Boy Cut: clean sideburns + softly swept wavy front hair lock (covers upper hairline smoothly)
    const frontSweep = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.024, 0.075, 8, 12),
      hairMat
    );
    frontSweep.rotation.z = Math.PI * 0.44;
    frontSweep.rotation.y = 0.16;
    frontSweep.position.set(0.012, 0.086, 0.056);
    frontSweep.scale.set(1.0, 1.0, 0.85);
    frontSweep.castShadow = true;
    headGroup.add(frontSweep);

    const sideSweep = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.052, 8, 12),
      hairMat
    );
    sideSweep.rotation.z = Math.PI * 0.56;
    sideSweep.rotation.y = -0.25;
    sideSweep.position.set(-0.036, 0.078, 0.055);
    sideSweep.castShadow = true;
    headGroup.add(sideSweep);

    for (const side of [-1, 1]) {
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.05, 0.032), hairMat);
      temple.position.set(side * 0.076, 0.02, 0.014);
      headGroup.add(temple);
    }
  } else {
    // Natural Girl Hairstyle: parted soft bangs + long flowing back locks + delicate front shoulder strands
    for (const side of [-1, 1]) {
      // Soft parted front fringe curving toward temples
      const bang = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.068, 8, 12), hairMat);
      bang.position.set(side * 0.044, 0.072, 0.058);
      bang.rotation.z = side * 0.58;
      bang.rotation.y = side * -0.3;
      bang.castShadow = true;
      headGroup.add(bang);

      // Face-framing shoulder lock hanging gracefully down past the jawline
      const sideLock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.22, 8, 12),
        hairMat
      );
      sideLock.scale.set(0.75, 1.0, 0.95);
      sideLock.position.set(side * 0.078, -0.075, -0.012);
      sideLock.rotation.z = side * 0.08;
      sideLock.castShadow = true;
      headGroup.add(sideLock);
    }

    // Lush flowing back hair cascade falling down behind shoulders
    const backCascadeProfile = [
      new THREE.Vector2(0.01, -0.27),
      new THREE.Vector2(0.115, -0.26),
      new THREE.Vector2(0.106, -0.14),
      new THREE.Vector2(0.095, -0.02),
      new THREE.Vector2(0.088, 0.045),
    ];
    const backCascadeGeo = new THREE.LatheGeometry(
      backCascadeProfile,
      20,
      Math.PI * 0.58,
      Math.PI * 0.84
    );
    backCascadeGeo.scale(1.02, 1.0, 1.15);
    const backCascade = new THREE.Mesh(backCascadeGeo, hairMat);
    backCascade.position.set(0, 0.0, -0.015);
    backCascade.castShadow = true;
    headGroup.add(backCascade);

    // Subtle delicate golden headband / pearl diadem accent
    if (accentMat) {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.088, 0.0042, 8, 28, Math.PI * 0.95),
        accentMat
      );
      band.position.set(0, 0.028, 0.018);
      band.rotation.y = Math.PI / 2;
      band.rotation.z = Math.PI * 0.025;
      band.rotation.x = -0.35;
      headGroup.add(band);
    }
  }

  // Facial Features (natural calm eyebrows, almond eyes, subtle nose & lips)
  const scleraGeo = new THREE.SphereGeometry(0.0125, 14, 12);
  scleraGeo.scale(1.18, 0.72, 0.55);
  const irisGeo = new THREE.SphereGeometry(0.0068, 12, 10);
  irisGeo.scale(1.0, 1.0, 0.5);
  const pupilGeo = new THREE.SphereGeometry(0.0038, 10, 8);
  pupilGeo.scale(1.0, 1.0, 0.5);
  const catchGeo = new THREE.SphereGeometry(0.0018, 8, 8);
  const browGeo = new THREE.CapsuleGeometry(0.0022, 0.024, 4, 8);

  for (const side of [-1, 1]) {
    const eyeX = side * 0.03;
    const eyeY = 0.008;
    const eyeZ = 0.08;

    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.position.set(eyeX, eyeY, eyeZ);

    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(eyeX * 0.98, eyeY, eyeZ + 0.004);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(eyeX * 0.98, eyeY, eyeZ + 0.0058);

    const catchlight = new THREE.Mesh(catchGeo, catchlightMat);
    catchlight.position.set(eyeX * 0.94, eyeY + 0.0022, eyeZ + 0.0075);

    // Subtle upper lash/eyelid line for realism (especially flattering on girl)
    if (isGirl) {
      const lash = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.0018, 0.02, 4, 8),
        hairMat
      );
      lash.rotation.z = Math.PI / 2 + side * -0.06;
      lash.position.set(eyeX, eyeY + 0.0075, eyeZ + 0.005);
      headGroup.add(lash);
    }

    const brow = new THREE.Mesh(browGeo, hairMat);
    brow.rotation.z = Math.PI / 2 + side * (isGirl ? -0.08 : -0.04);
    brow.position.set(eyeX, eyeY + 0.02, eyeZ + 0.002);

    headGroup.add(sclera, iris, pupil, catchlight, brow);
  }

  // Sculpted Nose
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.0058, 0.02, 6, 10), skinMat);
  noseBridge.position.set(0, -0.006, 0.089);
  noseBridge.rotation.x = -0.2;
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.0082, 10, 8), skinMat);
  noseTip.scale.set(1.05, 0.85, 1.0);
  noseTip.position.set(0, -0.019, 0.092);
  headGroup.add(noseBridge, noseTip);

  // Subtle Natural Lips
  const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.0034, 0.02, 6, 10), lipMat);
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, -0.044, 0.082);
  const lowerLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.016, 6, 10), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.05, 0.081);
  headGroup.add(upperLip, lowerLip);

  return headGroup;
}

export function createBoyCharacter(): VisitorCharacterRig {
  const root = new THREE.Group();
  root.name = 'BoyCharacter';

  const shadowTex = createRadialShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.012;
  root.add(shadowPlane);

  const suitTex = createFabricTexture('#1e2736', '#334155');
  const trouserTex = createFabricTexture('#1a202c', '#2d3748');
  const skinTex = createSkinTexture();
  const hairTex = createHairTexture('#221813', '#36271f', '#140d0a');

  const skinMat = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.64, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ map: hairTex, roughness: 0.86, metalness: 0.04 });
  const blazerMat = new THREE.MeshStandardMaterial({ map: suitTex, roughness: 0.8, metalness: 0.04 });
  const trouserMat = new THREE.MeshStandardMaterial({ map: trouserTex, roughness: 0.82, metalness: 0.03 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: 0.72, metalness: 0.02 });
  const tieMat = new THREE.MeshStandardMaterial({ color: 0x9b1c36, roughness: 0.48, metalness: 0.08 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 0.38, metalness: 0.14 });
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xc8a454, roughness: 0.24, metalness: 0.86 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x241914, roughness: 0.34, metalness: 0.12 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x141110, roughness: 0.78, metalness: 0.04 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf9f7f4, roughness: 0.32 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x2d1e15, roughness: 0.12, metalness: 0.04, clearcoat: 0.9 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090808 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xbf7869, roughness: 0.62 });

  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.88;
  root.add(bodyPivot);

  // Sculpted Torso with gentle natural shoulder curve (no knobby spheres sticking out)
  const torsoProfile = [
    new THREE.Vector2(0.01, -0.02),
    new THREE.Vector2(0.146, 0.0),
    new THREE.Vector2(0.15, 0.08),
    new THREE.Vector2(0.14, 0.16),
    new THREE.Vector2(0.162, 0.28),
    new THREE.Vector2(0.178, 0.4),
    new THREE.Vector2(0.184, 0.448),
    new THREE.Vector2(0.152, 0.488),
    new THREE.Vector2(0.085, 0.522),
    new THREE.Vector2(0.056, 0.545),
    new THREE.Vector2(0.01, 0.545),
  ];
  const torsoGeo = new THREE.LatheGeometry(torsoProfile, 28);
  torsoGeo.scale(1.12, 1.0, 0.68);
  const torsoMesh = new THREE.Mesh(torsoGeo, blazerMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyPivot.add(torsoMesh);

  // Belt & Buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.154, 0.032, 24), beltMat);
  belt.scale.set(1.12, 1, 0.69);
  belt.position.set(0, 0.055, 0);
  bodyPivot.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.034, 0.018), buckleMat);
  buckle.position.set(0, 0.055, 0.105);
  bodyPivot.add(buckle);

  // Clean V-neck Shirt Insert (narrows smoothly up into collar, no jutting white top corners)
  const shirtShape = new THREE.Shape();
  shirtShape.moveTo(0, 0.19);
  shirtShape.lineTo(-0.056, 0.465);
  shirtShape.lineTo(-0.028, 0.515);
  shirtShape.lineTo(0.028, 0.515);
  shirtShape.lineTo(0.056, 0.465);
  shirtShape.closePath();
  const shirtInsertGeo = new THREE.ExtrudeGeometry(shirtShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  const shirtInsert = new THREE.Mesh(shirtInsertGeo, shirtMat);
  shirtInsert.position.set(0, 0.02, 0.106);
  shirtInsert.rotation.x = -0.068;
  bodyPivot.add(shirtInsert);

  // Contoured Blazer Lapels wrapping V-opening
  for (const side of [-1, 1]) {
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0, 0);
    lapelShape.lineTo(side * 0.03, 0.02);
    lapelShape.lineTo(side * 0.048, 0.27);
    lapelShape.lineTo(side * 0.014, 0.295);
    lapelShape.closePath();

    const lapelGeo = new THREE.ExtrudeGeometry(lapelShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    const lapel = new THREE.Mesh(lapelGeo, blazerMat);
    lapel.position.set(side * 0.012, 0.205, 0.118);
    lapel.rotation.y = side * 0.18;
    lapel.rotation.x = -0.068;
    lapel.castShadow = true;
    bodyPivot.add(lapel);
  }

  // Tie + Pocket Square + Buttons
  const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.022, 0.018), tieMat);
  tieKnot.position.set(0, 0.486, 0.128);
  const tieBlade = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.19, 0.011), tieMat);
  tieBlade.position.set(0, 0.382, 0.13);
  tieBlade.rotation.x = -0.068;
  bodyPivot.add(tieKnot, tieBlade);

  const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.012, 0.012), tieMat);
  pocketSquare.position.set(0.096, 0.372, 0.119);
  pocketSquare.rotation.z = -0.14;
  pocketSquare.rotation.y = 0.24;
  bodyPivot.add(pocketSquare);

  for (const by of [0.165, 0.105]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.008, 12), buckleMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.01, by, 0.112);
    bodyPivot.add(btn);
  }

  // Neck & Neat Angled Shirt Collar
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.054, 0.11, 18), skinMat);
  neck.position.set(0, 0.565, 0.005);
  neck.castShadow = true;
  bodyPivot.add(neck);

  const collarBand = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.062, 0.028, 18), shirtMat);
  collarBand.position.set(0, 0.532, 0.007);
  bodyPivot.add(collarBand);

  const headGroup = buildNaturalHead({
    skinMat,
    hairMat,
    lipMat,
    scleraMat,
    irisMat,
    pupilMat,
    catchlightMat,
    isGirl: false,
  });
  headGroup.position.set(0, 0.708, 0.012);
  bodyPivot.add(headGroup);

  // Seamless Blended Arms (shoulder sphere tucked flush into torso slope, no protruding bulge)
  function buildArm(side: -1 | 1): { shoulderPivot: THREE.Group; elbowPivot: THREE.Group } {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * 0.194, 0.435, 0);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 14), blazerMat);
    shoulderCap.scale.set(0.92, 0.94, 0.9);
    shoulderCap.castShadow = true;
    shoulderPivot.add(shoulderCap);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.04, 0.24, 16), blazerMat);
    upperArm.position.set(side * 0.004, -0.12, 0);
    upperArm.castShadow = true;
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(side * 0.005, -0.24, 0);
    shoulderPivot.add(elbowPivot);

    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.039, 14, 12), blazerMat);
    elbowPivot.add(elbowJoint);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.039, 0.032, 0.225, 16), blazerMat);
    forearm.position.set(0, -0.112, 0);
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.031, 0.022, 14), shirtMat);
    cuff.position.set(0, -0.228, 0);
    elbowPivot.add(cuff);

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.025, 0.02, 12), skinMat);
    wrist.position.set(0, -0.245, 0);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.023, 0.056, 0.046), skinMat);
    palm.position.set(0, -0.28, 0.004);
    palm.castShadow = true;
    const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 6, 10), skinMat);
    fingers.scale.set(0.78, 1.0, 1.42);
    fingers.position.set(0, -0.316, 0.004);
    fingers.castShadow = true;
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0075, 0.02, 6, 8), skinMat);
    thumb.position.set(-side * 0.006, -0.286, 0.026);
    thumb.rotation.x = 0.45;
    elbowPivot.add(wrist, palm, fingers, thumb);

    return { shoulderPivot, elbowPivot };
  }

  const leftArmRig = buildArm(-1);
  const rightArmRig = buildArm(1);
  bodyPivot.add(leftArmRig.shoulderPivot, rightArmRig.shoulderPivot);

  function buildLeg(side: -1 | 1): { hipPivot: THREE.Group; kneePivot: THREE.Group } {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.09, 0.88, 0);

    const thighProfile = [
      new THREE.Vector2(0.055, -0.41),
      new THREE.Vector2(0.067, -0.22),
      new THREE.Vector2(0.08, -0.02),
      new THREE.Vector2(0.071, 0.02),
    ];
    const thigh = new THREE.Mesh(new THREE.LatheGeometry(thighProfile, 20), trouserMat);
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.41, 0);
    hipPivot.add(kneePivot);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), trouserMat);
    kneePivot.add(kneeCap);

    const calfProfile = [
      new THREE.Vector2(0.042, -0.39),
      new THREE.Vector2(0.057, -0.21),
      new THREE.Vector2(0.056, -0.04),
      new THREE.Vector2(0.053, 0.0),
    ];
    const calf = new THREE.Mesh(new THREE.LatheGeometry(calfProfile, 20), trouserMat);
    calf.castShadow = true;
    calf.receiveShadow = true;
    kneePivot.add(calf);

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.47, 0);

    const heel = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.026, 0.074), soleMat);
    heel.position.set(0, 0.013, -0.022);
    const frontSole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.144), soleMat);
    frontSole.position.set(0, 0.008, 0.052);
    const shoeHeelUpper = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.054, 0.084), shoeMat);
    shoeHeelUpper.position.set(0, 0.05, -0.018);
    shoeHeelUpper.castShadow = true;
    const shoeVamp = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.088, 8, 12), shoeMat);
    shoeVamp.rotation.x = Math.PI / 2;
    shoeVamp.scale.set(1.08, 1.0, 0.72);
    shoeVamp.position.set(0, 0.038, 0.058);
    shoeVamp.castShadow = true;

    shoeGroup.add(heel, frontSole, shoeHeelUpper, shoeVamp);
    kneePivot.add(shoeGroup);

    return { hipPivot, kneePivot };
  }

  const leftLegRig = buildLeg(-1);
  const rightLegRig = buildLeg(1);
  root.add(leftLegRig.hipPivot, rightLegRig.hipPivot);

  let walkPhase = 0;
  let idlePhase = 0;

  function updateAnimation(dt: number, speed: number, isWaving: boolean) {
    idlePhase += dt * 2.1;
    const isMoving = speed > 0.08;

    if (isMoving) {
      walkPhase += dt * (4.0 + speed * 2.0);
      const stride = Math.sin(walkPhase);
      const bob = Math.abs(Math.cos(walkPhase));

      bodyPivot.position.y = 0.88 + bob * 0.024;
      bodyPivot.rotation.z = stride * 0.022;
      bodyPivot.rotation.y = stride * 0.055;
      headGroup.rotation.y = -stride * 0.04;
      headGroup.rotation.z = -stride * 0.015;

      leftLegRig.hipPivot.rotation.x = stride * 0.44;
      rightLegRig.hipPivot.rotation.x = -stride * 0.44;
      leftLegRig.kneePivot.rotation.x = Math.max(0.06, Math.sin(walkPhase + 0.65) * 0.48);
      rightLegRig.kneePivot.rotation.x = Math.max(0.06, -Math.sin(walkPhase + 0.65) * 0.48);

      leftArmRig.shoulderPivot.rotation.x = -stride * 0.36;
      rightArmRig.shoulderPivot.rotation.x = stride * 0.36;
      leftArmRig.shoulderPivot.rotation.z = 0.06;
      rightArmRig.shoulderPivot.rotation.z = -0.06;
      leftArmRig.elbowPivot.rotation.x = -0.22 - Math.max(0, -stride) * 0.22;
      rightArmRig.elbowPivot.rotation.x = -0.22 - Math.max(0, stride) * 0.22;
    } else {
      bodyPivot.rotation.z = THREE.MathUtils.damp(bodyPivot.rotation.z, 0, 8, dt);
      bodyPivot.rotation.y = THREE.MathUtils.damp(bodyPivot.rotation.y, 0, 8, dt);
      bodyPivot.position.y = 0.88 + Math.sin(idlePhase) * 0.006;

      headGroup.rotation.y = Math.sin(idlePhase * 0.5) * 0.07;
      headGroup.rotation.z = Math.sin(idlePhase * 0.65) * 0.02;

      leftLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(leftLegRig.hipPivot.rotation.x, 0, 10, dt);
      rightLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(rightLegRig.hipPivot.rotation.x, 0, 10, dt);
      leftLegRig.kneePivot.rotation.x = THREE.MathUtils.damp(leftLegRig.kneePivot.rotation.x, 0.04, 10, dt);
      rightLegRig.kneePivot.rotation.x = THREE.MathUtils.damp(rightLegRig.kneePivot.rotation.x, 0.04, 10, dt);

      if (isWaving) {
        rightArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          rightArmRig.shoulderPivot.rotation.z,
          -1.85 + Math.sin(idlePhase * 3.2) * 0.16,
          10,
          dt
        );
        rightArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.shoulderPivot.rotation.x, 0.35, 10, dt);
        rightArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(
          rightArmRig.elbowPivot.rotation.x,
          -1.05 + Math.sin(idlePhase * 3.2) * 0.15,
          10,
          dt
        );
        leftArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.z, 0.06, 8, dt);
        leftArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        leftArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.elbowPivot.rotation.x, -0.14, 8, dt);
      } else {
        leftArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          leftArmRig.shoulderPivot.rotation.z,
          0.05 + Math.sin(idlePhase) * 0.015,
          6,
          dt
        );
        rightArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          rightArmRig.shoulderPivot.rotation.z,
          -0.05 - Math.sin(idlePhase) * 0.015,
          6,
          dt
        );
        leftArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        rightArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        leftArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.elbowPivot.rotation.x, -0.14, 8, dt);
        rightArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.elbowPivot.rotation.x, -0.14, 8, dt);
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
    suitTex.dispose();
    trouserTex.dispose();
    skinTex.dispose();
    hairTex.dispose();
  }

  return { root, gender: 'boy', updateAnimation, dispose };
}

/**
 * Natural, graceful Girl / Bride human character (~1.64m tall):
 * - Tailored ivory-silk gown bodice + flowing pleated midi-length skirt + champagne-gold sash belt
 * - Long layered chestnut hair with parted front bangs, shoulder locks & pearl headband
 * - Articulated 2-segment arms & legs with natural stride & greeting wave
 */
export function createGirlCharacter(): VisitorCharacterRig {
  const root = new THREE.Group();
  root.name = 'GirlCharacter';

  const shadowTex = createRadialShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.012;
  root.add(shadowPlane);

  const dressTex = createFabricTexture('#faf4ec', '#e9decb');
  const skinTex = createSkinTexture();
  const hairTex = createHairTexture('#261a14', '#402c22', '#170f0b');

  const skinMat = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.62, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ map: hairTex, roughness: 0.84, metalness: 0.04 });
  const dressMat = new THREE.MeshStandardMaterial({ map: dressTex, roughness: 0.64, metalness: 0.04 });
  const sashMat = new THREE.MeshStandardMaterial({ color: 0xd9b366, roughness: 0.34, metalness: 0.55 });
  const pearlMat = new THREE.MeshStandardMaterial({ color: 0xfffaf2, roughness: 0.2, metalness: 0.15 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf4ece2, roughness: 0.36, metalness: 0.1 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf9f7f4, roughness: 0.32 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x2f1e14, roughness: 0.12, metalness: 0.04, clearcoat: 0.9 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090808 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xc97074, roughness: 0.55 });

  // Hip pivot at y = 0.84m
  const bodyPivot = new THREE.Group();
  bodyPivot.position.y = 0.84;
  root.add(bodyPivot);

  // Feminine Bodice (LatheGeometry with tapered waist -> bust -> delicate sloped shoulders)
  const bodiceProfile = [
    new THREE.Vector2(0.01, -0.01),
    new THREE.Vector2(0.122, 0.01), // waist
    new THREE.Vector2(0.128, 0.12),
    new THREE.Vector2(0.154, 0.26), // bust/ribcage
    new THREE.Vector2(0.158, 0.36),
    new THREE.Vector2(0.146, 0.42), // shoulder line
    new THREE.Vector2(0.115, 0.452),
    new THREE.Vector2(0.068, 0.48),
    new THREE.Vector2(0.044, 0.498),
    new THREE.Vector2(0.01, 0.498),
  ];
  const bodiceGeo = new THREE.LatheGeometry(bodiceProfile, 28);
  bodiceGeo.scale(1.06, 1.0, 0.68);
  const bodice = new THREE.Mesh(bodiceGeo, dressMat);
  bodice.castShadow = true;
  bodice.receiveShadow = true;
  bodyPivot.add(bodice);

  // Flowing Pleated A-Line Midi Skirt (from waist y = 0.02 down to mid-calf y = -0.52)
  const skirtProfile = [
    new THREE.Vector2(0.245, -0.52),
    new THREE.Vector2(0.228, -0.35),
    new THREE.Vector2(0.195, -0.18),
    new THREE.Vector2(0.152, -0.05),
    new THREE.Vector2(0.125, 0.03),
  ];
  const skirtGeo = new THREE.LatheGeometry(skirtProfile, 30);
  skirtGeo.scale(1.06, 1.0, 0.84);
  const skirt = new THREE.Mesh(skirtGeo, dressMat);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  bodyPivot.add(skirt);

  // Champagne-gold satin waist belt + subtle back bow accent
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.129, 0.132, 0.038, 26), sashMat);
  sash.scale.set(1.07, 1, 0.72);
  sash.position.set(0, 0.025, 0);
  bodyPivot.add(sash);

  // Delicate pearl necklace at collarbone
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.24;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), pearlMat);
    pearl.position.set(Math.sin(a) * 0.058, 0.485 - Math.cos(a) * 0.012, Math.cos(a) * 0.052 + 0.005);
    bodyPivot.add(pearl);
  }

  // Graceful Slim Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.105, 18), skinMat);
  neck.position.set(0, 0.525, 0.005);
  neck.castShadow = true;
  bodyPivot.add(neck);

  const headGroup = buildNaturalHead({
    skinMat,
    hairMat,
    lipMat,
    scleraMat,
    irisMat,
    pupilMat,
    catchlightMat,
    isGirl: true,
    accentMat: sashMat,
  });
  headGroup.position.set(0, 0.662, 0.012);
  bodyPivot.add(headGroup);

  // Graceful Arms (sheer/tailored sleeve to elbow + bare natural forearm & sculpted hand)
  function buildGirlArm(side: -1 | 1): { shoulderPivot: THREE.Group; elbowPivot: THREE.Group } {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * 0.168, 0.415, 0);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 12), dressMat);
    shoulderCap.scale.set(0.9, 0.94, 0.9);
    shoulderCap.castShadow = true;
    shoulderPivot.add(shoulderCap);

    const upperSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.032, 0.22, 16), dressMat);
    upperSleeve.position.set(side * 0.003, -0.11, 0);
    upperSleeve.castShadow = true;
    shoulderPivot.add(upperSleeve);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(side * 0.004, -0.22, 0);
    shoulderPivot.add(elbowPivot);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.023, 0.21, 14), skinMat);
    forearm.position.set(0, -0.105, 0);
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.048, 0.038), skinMat);
    palm.position.set(0, -0.228, 0.003);
    palm.castShadow = true;
    const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.026, 6, 10), skinMat);
    fingers.scale.set(0.75, 1.0, 1.38);
    fingers.position.set(0, -0.258, 0.003);
    fingers.castShadow = true;
    elbowPivot.add(palm, fingers);

    return { shoulderPivot, elbowPivot };
  }

  const leftArmRig = buildGirlArm(-1);
  const rightArmRig = buildGirlArm(1);
  bodyPivot.add(leftArmRig.shoulderPivot, rightArmRig.shoulderPivot);

  // Graceful Legs (natural calves & ivory dress shoes visible beneath midi skirt)
  function buildGirlLeg(side: -1 | 1): { hipPivot: THREE.Group; kneePivot: THREE.Group } {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.075, 0.84, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.045, 0.39, 16), skinMat);
    thigh.position.set(0, -0.195, 0);
    hipPivot.add(thigh);

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.39, 0);
    hipPivot.add(kneePivot);

    const calfProfile = [
      new THREE.Vector2(0.032, -0.38),
      new THREE.Vector2(0.046, -0.21),
      new THREE.Vector2(0.045, -0.04),
      new THREE.Vector2(0.043, 0.0),
    ];
    const calf = new THREE.Mesh(new THREE.LatheGeometry(calfProfile, 18), skinMat);
    calf.castShadow = true;
    kneePivot.add(calf);

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.45, 0);
    const heel = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.035, 0.04), shoeMat);
    heel.position.set(0, 0.017, -0.032);
    const shoeVamp = new THREE.Mesh(new THREE.CapsuleGeometry(0.029, 0.095, 8, 12), shoeMat);
    shoeVamp.rotation.x = Math.PI / 2;
    shoeVamp.scale.set(1.02, 1.0, 0.65);
    shoeVamp.position.set(0, 0.026, 0.036);
    shoeVamp.castShadow = true;
    shoeGroup.add(heel, shoeVamp);
    kneePivot.add(shoeGroup);

    return { hipPivot, kneePivot };
  }

  const leftLegRig = buildGirlLeg(-1);
  const rightLegRig = buildGirlLeg(1);
  root.add(leftLegRig.hipPivot, rightLegRig.hipPivot);

  let walkPhase = 0;
  let idlePhase = 0;

  function updateAnimation(dt: number, speed: number, isWaving: boolean) {
    idlePhase += dt * 2.1;
    const isMoving = speed > 0.08;

    if (isMoving) {
      walkPhase += dt * (4.1 + speed * 2.0);
      const stride = Math.sin(walkPhase);
      const bob = Math.abs(Math.cos(walkPhase));

      bodyPivot.position.y = 0.84 + bob * 0.02;
      bodyPivot.rotation.z = stride * 0.022;
      bodyPivot.rotation.y = stride * 0.045;
      skirt.rotation.z = -stride * 0.035;
      headGroup.rotation.y = -stride * 0.035;

      // Graceful shorter stride so knees stay cleanly inside the flared skirt
      leftLegRig.hipPivot.rotation.x = stride * 0.32;
      rightLegRig.hipPivot.rotation.x = -stride * 0.32;
      leftLegRig.kneePivot.rotation.x = Math.max(0.05, Math.sin(walkPhase + 0.65) * 0.42);
      rightLegRig.kneePivot.rotation.x = Math.max(0.05, -Math.sin(walkPhase + 0.65) * 0.42);

      leftArmRig.shoulderPivot.rotation.x = -stride * 0.3;
      rightArmRig.shoulderPivot.rotation.x = stride * 0.3;
      leftArmRig.shoulderPivot.rotation.z = 0.07;
      rightArmRig.shoulderPivot.rotation.z = -0.07;
      leftArmRig.elbowPivot.rotation.x = -0.22 - Math.max(0, -stride) * 0.18;
      rightArmRig.elbowPivot.rotation.x = -0.22 - Math.max(0, stride) * 0.18;
    } else {
      bodyPivot.rotation.z = THREE.MathUtils.damp(bodyPivot.rotation.z, 0, 8, dt);
      bodyPivot.rotation.y = THREE.MathUtils.damp(bodyPivot.rotation.y, 0, 8, dt);
      skirt.rotation.z = THREE.MathUtils.damp(skirt.rotation.z, 0, 8, dt);
      bodyPivot.position.y = 0.84 + Math.sin(idlePhase) * 0.005;

      headGroup.rotation.y = Math.sin(idlePhase * 0.5) * 0.07;
      headGroup.rotation.z = Math.sin(idlePhase * 0.65) * 0.02;

      leftLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(leftLegRig.hipPivot.rotation.x, 0, 10, dt);
      rightLegRig.hipPivot.rotation.x = THREE.MathUtils.damp(rightLegRig.hipPivot.rotation.x, 0, 10, dt);
      leftLegRig.kneePivot.rotation.x = THREE.MathUtils.damp(leftLegRig.kneePivot.rotation.x, 0.04, 10, dt);
      rightLegRig.kneePivot.rotation.x = THREE.MathUtils.damp(rightLegRig.kneePivot.rotation.x, 0.04, 10, dt);

      if (isWaving) {
        rightArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          rightArmRig.shoulderPivot.rotation.z,
          -1.8 + Math.sin(idlePhase * 3.2) * 0.15,
          10,
          dt
        );
        rightArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.shoulderPivot.rotation.x, 0.35, 10, dt);
        rightArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(
          rightArmRig.elbowPivot.rotation.x,
          -1.0 + Math.sin(idlePhase * 3.2) * 0.14,
          10,
          dt
        );
        leftArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.z, 0.07, 8, dt);
        leftArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        leftArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.elbowPivot.rotation.x, -0.15, 8, dt);
      } else {
        leftArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          leftArmRig.shoulderPivot.rotation.z,
          0.06 + Math.sin(idlePhase) * 0.015,
          6,
          dt
        );
        rightArmRig.shoulderPivot.rotation.z = THREE.MathUtils.damp(
          rightArmRig.shoulderPivot.rotation.z,
          -0.06 - Math.sin(idlePhase) * 0.015,
          6,
          dt
        );
        leftArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        rightArmRig.shoulderPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.shoulderPivot.rotation.x, 0, 8, dt);
        leftArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.elbowPivot.rotation.x, -0.15, 8, dt);
        rightArmRig.elbowPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.elbowPivot.rotation.x, -0.15, 8, dt);
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
    dressTex.dispose();
    skinTex.dispose();
    hairTex.dispose();
  }

  return { root, gender: 'girl', updateAnimation, dispose };
}

export function createVisitorCharacter(gender: VisitorGender): VisitorCharacterRig {
  return gender === 'girl' ? createGirlCharacter() : createBoyCharacter();
}
