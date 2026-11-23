import * as THREE from 'three';
import type { WeddingInviteConfig, WeddingStationType } from '../types/museum';
import { createPlaqueTexture } from './museumTextures';

export interface WeddingStationRef {
  type: WeddingStationType;
  pos: THREE.Vector3;
  hitMeshes: THREE.Mesh[];
  animatedMesh?: THREE.Object3D;
}

const UZ_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

export function createWeddingCalendarTexture(dateStr: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Clean luminous architectural white panel
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = '#efe7dc';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 988, 988);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const year = match ? Number(match[1]) : 2027;
  const monthIdx = match ? Math.max(0, Math.min(11, Number(match[2]) - 1)) : 0;
  const day = match ? Math.max(1, Math.min(31, Number(match[3]))) : 1;

  const dd = String(day).padStart(2, '0');
  const mm = String(monthIdx + 1).padStart(2, '0');

  // Top big date: 01.01.2027
  ctx.fillStyle = '#1b1715';
  ctx.font = '700 88px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${dd}.${mm}.${year}`, 512, 130);

  // Month & year subtitle: Yanvar 2027
  ctx.fillStyle = '#5f4e43';
  ctx.font = 'italic 600 50px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`${UZ_MONTHS[monthIdx]} ${year}`, 512, 224);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(170, 286);
  ctx.lineTo(854, 286);
  ctx.stroke();

  const weekdays = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  const startX = 148;
  const colW = 121;
  ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#8b7768';
  weekdays.forEach((wd, i) => {
    ctx.fillText(wd, startX + i * colW, 355);
  });

  const firstJsDay = new Date(year, monthIdx, 1).getDay();
  const offset = (firstJsDay + 6) % 7;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const startY = 448;
  const rowH = 98;

  for (let d = 1; d <= daysInMonth; d++) {
    const slot = offset + (d - 1);
    const col = slot % 7;
    const row = Math.floor(slot / 7);
    const cx = startX + col * colW;
    const cy = startY + row * rowH;

    if (d === day) {
      ctx.save();
      ctx.translate(cx, cy + 4);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      const s = 2.6;
      for (let t = 0; t <= Math.PI * 2 + 0.05; t += 0.05) {
        const hx = 16 * Math.pow(Math.sin(t), 3) * s;
        const hy =
          -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
        if (t === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(d), cx, cy + 2);
    } else {
      ctx.fillStyle = col >= 5 ? '#9f4a54' : '#26201c';
      ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(String(d), cx, cy);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createAtmScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, 480);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 640, 480);

  // Subtle gold frame border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 612, 452);

  // Top terminal status bar
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(16, 16, 608, 52);
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('UZCARD  •  HUMO  •  VISA', 34, 48);
  ctx.fillStyle = '#34d399';
  ctx.textAlign = 'right';
  ctx.fillText('ONLINE', 604, 48);

  // Center luxury virtual card preview
  const cardGrad = ctx.createLinearGradient(160, 100, 480, 270);
  cardGrad.addColorStop(0, '#b48836');
  cardGrad.addColorStop(0.5, '#f2d388');
  cardGrad.addColorStop(1, '#9c6e22');
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(150, 96, 340, 185, 20);
  ctx.fill();

  // EMV chip
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.beginPath();
  ctx.roundRect(184, 145, 48, 36, 6);
  ctx.fill();

  // Heart emblem on card
  ctx.fillStyle = '#881337';
  ctx.beginPath();
  ctx.arc(432, 142, 14, 0, Math.PI * 2);
  ctx.arc(458, 142, 14, 0, Math.PI * 2);
  ctx.moveTo(418, 147);
  ctx.lineTo(445, 178);
  ctx.lineTo(472, 147);
  ctx.fill();

  ctx.fillStyle = '#291c0b';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('5614  6887  ••••  5830', 184, 224);
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText("TO'YONA HADYA KARTASI", 184, 255);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("TO'YONA YUBORISH", 320, 348);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText("Karta raqamini ko'rish va nusxalash uchun bosing", 320, 392);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createVenueMapTexture(venueName: string, venueAddress: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5efe6';
  ctx.fillRect(0, 0, 640, 640);

  // Subtle city parks & green zones
  ctx.fillStyle = '#dbead5';
  ctx.beginPath();
  ctx.roundRect(45, 65, 175, 130, 26);
  ctx.roundRect(425, 385, 170, 145, 28);
  ctx.fill();

  // Stylized canal / river ribbon
  ctx.strokeStyle = '#bddcf0';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 490);
  ctx.bezierCurveTo(180, 440, 280, 290, 640, 240);
  ctx.stroke();

  // Secondary streets
  ctx.strokeStyle = '#e4dacd';
  ctx.lineWidth = 10;
  for (let i = 90; i < 600; i += 110) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - 25, 640);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(640, i + 20);
    ctx.stroke();
  }

  // Main avenue
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(70, 560);
  ctx.quadraticCurveTo(310, 330, 570, 95);
  ctx.stroke();
  ctx.strokeStyle = '#e7c982';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Center golden venue target rings
  ctx.strokeStyle = '#c89b3c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(320, 310, 58, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(225, 29, 72, 0.14)';
  ctx.beginPath();
  ctx.arc(320, 310, 38, 0, Math.PI * 2);
  ctx.fill();

  // Compass rose top-right
  ctx.fillStyle = '#5c4938';
  ctx.font = '700 22px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', 565, 58);
  ctx.strokeStyle = '#8b6f47';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(565, 86, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Venue banner bottom
  ctx.fillStyle = 'rgba(255, 252, 247, 0.94)';
  ctx.beginPath();
  ctx.roundRect(42, 496, 556, 110, 16);
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#291e17';
  ctx.font = '700 28px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(venueName.slice(0, 30), 320, 538);
  ctx.fillStyle = '#6e5a4d';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(venueAddress.slice(0, 42), 320, 578);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createGuestbookPagesTexture(wishCount: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm parchment spread
  const grad = ctx.createLinearGradient(0, 0, 768, 0);
  grad.addColorStop(0, '#f9f3e8');
  grad.addColorStop(0.47, '#fffcf7');
  grad.addColorStop(0.5, '#d8cab8');
  grad.addColorStop(0.53, '#fffcf7');
  grad.addColorStop(1, '#f7efe2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 512);

  // Page borders
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 340, 464);
  ctx.strokeRect(404, 24, 340, 464);

  // Left page decorative quote
  ctx.fillStyle = '#7b2d3b';
  ctx.font = 'italic 700 34px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tilaklar Kitobi', 194, 96);

  ctx.fillStyle = '#8b735b';
  ctx.font = 'italic 500 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Aziz mehmonlarimizdan', 194, 152);
  ctx.fillText('samimiy ezgu tilaklar', 194, 186);

  ctx.fillStyle = '#e11d48';
  ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`♥  ${wishCount} ta tilak`, 194, 290);

  // Right page ruled lines
  ctx.strokeStyle = 'rgba(166, 140, 110, 0.35)';
  ctx.lineWidth = 1.5;
  for (let y = 96; y <= 430; y += 44) {
    ctx.beginPath();
    ctx.moveTo(432, y);
    ctx.lineTo(716, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a382c';
  ctx.font = 'italic 600 22px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Baxtli va saodatli bo‘ling!', 440, 134);
  ctx.fillText('Umringiz mazmunli o‘tsin...', 440, 222);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Rich 5-tier warm glowing golden crystal dome chandelier matching Video 2 (00:00 & 00:12)
 */
export function createCrystalChandelier(): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a84e,
    roughness: 0.22,
    metalness: 0.88,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xffe9bd,
    emissive: 0xffba52,
    emissiveIntensity: 1.05,
    roughness: 0.12,
    metalness: 0.2,
  });

  // Ceiling canopy & suspension chain/rod
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.14, 18), goldMat);
  canopy.position.y = -0.07;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 10), goldMat);
  rod.position.y = -0.58;
  group.add(canopy, rod);

  // Warm inner core bulb glow
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 14),
    new THREE.MeshBasicMaterial({ color: 0xffe4a8 })
  );
  core.position.y = -1.48;
  core.scale.set(1.2, 0.85, 1.2);
  group.add(core);

  // 5 dense cascading golden crystal tiers forming a lush inverted dome
  const tiers = [
    { y: -1.12, r: 1.15, count: 24, dropH: 0.38 },
    { y: -1.36, r: 0.96, count: 20, dropH: 0.36 },
    { y: -1.6, r: 0.76, count: 16, dropH: 0.34 },
    { y: -1.84, r: 0.54, count: 12, dropH: 0.3 },
    { y: -2.06, r: 0.32, count: 8, dropH: 0.26 },
  ];

  tiers.forEach((tier) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(tier.r, 0.026, 8, 36), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = tier.y;
    group.add(ring);

    for (let i = 0; i < tier.count; i++) {
      const a = (i / tier.count) * Math.PI * 2;
      const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 0), crystalMat);
      drop.scale.set(0.68, tier.dropH / 0.13, 0.68);
      drop.position.set(
        Math.cos(a) * tier.r,
        tier.y - tier.dropH * 0.45,
        Math.sin(a) * tier.r
      );
      group.add(drop);
    }
  });

  // Bottom finial crystal
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), crystalMat);
  finial.scale.set(0.8, 1.7, 0.8);
  finial.position.y = -2.38;
  group.add(finial);

  const light = new THREE.PointLight(0xffe1ad, 16, 18, 1.35);
  light.position.y = -1.65;
  group.add(light);

  return group;
}

/**
 * True curved Roman Archway divider wall built with ExtrudeGeometry (matching 00:00 & 00:08)
 */
export function createRomanArchwayWall(
  roomWidth: number,
  roomHeight: number,
  title: string,
  disposables: Array<{ dispose: () => void }>
): THREE.Group {
  const group = new THREE.Group();
  const halfW = roomWidth / 2;
  const archR = 2.15;
  const springY = 2.45; // Straight jambs up to 2.45m, semicircular arch peaks at 4.6m
  const thickness = 0.46;

  const shape = new THREE.Shape();
  shape.moveTo(-halfW, 0);
  shape.lineTo(-archR, 0);
  shape.lineTo(-archR, springY);
  shape.absarc(0, springY, archR, Math.PI, 0, true);
  shape.lineTo(archR, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, roomHeight);
  shape.lineTo(-halfW, roomHeight);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 32,
  });
  geo.translate(0, 0, -thickness / 2);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf7f3ed,
    roughness: 0.72,
    metalness: 0.02,
  });
  const archWall = new THREE.Mesh(geo, wallMat);
  archWall.castShadow = true;
  archWall.receiveShadow = true;
  group.add(archWall);

  // Subtle gold/champagne architrave trim tracing the arch curve
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xdcc7a4,
    roughness: 0.42,
    metalness: 0.35,
  });
  const archCurveTrim = new THREE.Mesh(
    new THREE.TorusGeometry(archR + 0.05, 0.06, 10, 40, Math.PI),
    trimMat
  );
  archCurveTrim.position.set(0, springY, thickness / 2 + 0.01);
  group.add(archCurveTrim);

  for (const side of [-1, 1]) {
    const jambTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, springY, 0.08),
      trimMat
    );
    jambTrim.position.set(side * (archR + 0.05), springY / 2, thickness / 2 + 0.01);
    group.add(jambTrim);
  }

  // "To'yga Taklifnoma" frieze above the arch peak
  const signTex = createPlaqueTexture(title || "To'yga Taklifnoma", {
    bg: '#f7f3ed',
    fg: '#2f241e',
    border: '#d6c19c',
    font: '600 46px "Cormorant Garamond", Georgia, serif',
  });
  disposables.push(signTex);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.68),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  sign.position.set(0, 5.18, thickness / 2 + 0.02);
  group.add(sign);

  return group;
}

/**
 * Raised neoclassical wainscoting & molding panels along side walls (matching 00:02-00:06)
 */
export function createNeoclassicalWallPanels(
  roomLength: number,
  roomHeight: number,
  roomWidth: number,
  centerZ = 0
): THREE.Group {
  const group = new THREE.Group();
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xeae3da,
    roughness: 0.58,
    metalness: 0.02,
  });

  const baySpacing = 4.2;

  for (const side of [-1, 1]) {
    const wallX = side * (roomWidth / 2 - 0.028);

    // Baseboard + Chair rail + Ceiling crown molding
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, roomLength), trimMat);
    base.position.set(wallX, 0.12, 0);

    const chairRail = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, roomLength), trimMat);
    chairRail.position.set(wallX, 1.05, 0);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, roomLength), trimMat);
    crown.position.set(wallX, roomHeight - 0.11, 0);

    group.add(base, chairRail, crown);

    // Vertical pilaster strips aligned strictly between the 4.2m photo bays
    for (let z = roomLength / 2 - 0.8; z >= -roomLength / 2 + 0.8; z -= baySpacing) {
      const worldZ = z + centerZ;
      if (Math.abs(worldZ) < 0.75) continue;

      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.05, roomHeight - 0.34, 0.14), trimMat);
      pilaster.position.set(wallX, roomHeight / 2, z);
      group.add(pilaster);

      // Subtle lower wainscoting panel molding box inside each bay
      const nextZ = z - baySpacing;
      const nextWorldZ = nextZ + centerZ;
      if (nextZ >= -roomLength / 2 + 0.5 && !(worldZ > 0 && nextWorldZ < 0)) {
        const bayMidZ = (z + nextZ) / 2;
        const panelW = baySpacing - 0.9;
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, panelW), trimMat);
        topBar.position.set(wallX, 0.88, bayMidZ);
        const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, panelW), trimMat);
        botBar.position.set(wallX, 0.38, bayMidZ);
        group.add(topBar, botBar);
      }
    }
  }

  return group;
}

/**
 * Natural, sculpted multi-petal rose floral urn on a neoclassical pedestal
 */
export function createFloralArrangement(includePedestal = true): THREE.Group {
  const fGroup = new THREE.Group();

  const pedWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f4, roughness: 0.34 });
  const trimGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.88,
  });
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf6efe6,
    roughness: 0.2,
    metalness: 0.08,
  });

  let baseTopY = 0;
  if (includePedestal) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.64), pedWhiteMat);
    plinth.position.y = 0.04;
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.88, 0.52), pedWhiteMat);
    col.position.y = 0.52;
    col.castShadow = true;
    col.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.6), pedWhiteMat);
    cap.position.y = 0.995;
    const goldBand = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.55), trimGoldMat);
    goldBand.position.y = 0.95;
    fGroup.add(plinth, col, cap, goldBand);
    baseTopY = 1.03;
  }

  // Sculpted classical chalice urn via LatheGeometry
  const urnPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.14, 0.0),
    new THREE.Vector2(0.14, 0.03),
    new THREE.Vector2(0.06, 0.07),
    new THREE.Vector2(0.055, 0.14),
    new THREE.Vector2(0.16, 0.24),
    new THREE.Vector2(0.21, 0.36),
    new THREE.Vector2(0.18, 0.44),
    new THREE.Vector2(0.23, 0.47),
    new THREE.Vector2(0.19, 0.47),
  ];
  const urnGeo = new THREE.LatheGeometry(urnPts, 24);
  const urn = new THREE.Mesh(urnGeo, porcelainMat);
  urn.position.y = baseTopY;
  urn.castShadow = true;

  const urnRim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.014, 8, 28), trimGoldMat);
  urnRim.rotation.x = Math.PI / 2;
  urnRim.position.y = baseTopY + 0.46;
  fGroup.add(urn, urnRim);

  // Organic fanned eucalyptus & rose leaves (never a smooth ball)
  const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x3b6344, roughness: 0.68, side: THREE.DoubleSide });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x567d5e, roughness: 0.72, side: THREE.DoubleSide });
  const leafGeo = new THREE.SphereGeometry(0.085, 8, 6);
  leafGeo.scale(0.55, 0.14, 1.45);

  const domeY = baseTopY + 0.54;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + (i % 2) * 0.15;
    const r = 0.2 + (i % 3) * 0.04;
    const leaf = new THREE.Mesh(leafGeo, i % 2 === 0 ? leafMat1 : leafMat2);
    leaf.position.set(Math.cos(a) * r, domeY - 0.02 + (i % 2) * 0.06, Math.sin(a) * r);
    leaf.rotation.set(0.35 + (i % 3) * 0.15, -a + Math.PI / 2, (i % 2 === 0 ? 1 : -1) * 0.25);
    fGroup.add(leaf);
  }

  // Cupped layered rose blooms in blush pink, rose, cream, and peach
  const rosePalettes = [
    { outer: 0xf6b6c6, inner: 0xe66f8d },
    { outer: 0xfff3f6, inner: 0xfadadd },
    { outer: 0xf28ba6, inner: 0xd14b6e },
    { outer: 0xffe5da, inner: 0xf4a896 },
  ];

  const outerPetalGeo = new THREE.SphereGeometry(0.056, 10, 8, 0, Math.PI * 2, 0.2, Math.PI * 0.75);
  outerPetalGeo.scale(1.0, 0.85, 1.0);
  const innerBudGeo = new THREE.SphereGeometry(0.036, 8, 8);

  const roseCoords: Array<[number, number, number, number]> = [
    [0, 0.22, 0, 1.15],
    [0.12, 0.17, 0.08, 1.0],
    [-0.13, 0.16, 0.07, 1.02],
    [0.04, 0.16, -0.14, 0.96],
    [-0.08, 0.15, -0.12, 0.95],
    [0.21, 0.07, -0.02, 0.9],
    [-0.21, 0.06, 0.01, 0.92],
    [0.14, 0.06, 0.18, 0.88],
    [-0.14, 0.07, 0.17, 0.9],
    [0.16, 0.06, -0.16, 0.86],
    [-0.16, 0.06, -0.15, 0.88],
    [0.0, 0.05, 0.22, 0.86],
    [0.0, 0.06, -0.22, 0.88],
  ];

  roseCoords.forEach(([rx, ry, rz, sc], idx) => {
    const pal = rosePalettes[idx % rosePalettes.length];
    const rose = new THREE.Group();
    rose.position.set(rx, domeY + ry, rz);
    rose.scale.setScalar(sc);
    rose.rotation.set(rz * 1.4, idx * 1.1, -rx * 1.4);

    const outerMat = new THREE.MeshStandardMaterial({ color: pal.outer, roughness: 0.52 });
    const innerMat = new THREE.MeshStandardMaterial({ color: pal.inner, roughness: 0.45 });

    const center = new THREE.Mesh(innerBudGeo, innerMat);
    center.position.y = 0.015;
    rose.add(center);

    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(outerPetalGeo, outerMat);
      petal.position.set(Math.cos(pa) * 0.032, 0, Math.sin(pa) * 0.032);
      petal.rotation.set(0.32, -pa, 0.18);
      rose.add(petal);
    }

    fGroup.add(rose);
  });

  return fGroup;
}

/**
 * Natural multi-height pillar candles inside hurricane glass on a brass saucer
 */
export function createCandleCluster(
  isSoftwareGl: boolean,
  animatedFlames: THREE.Mesh[]
): THREE.Group {
  const cg = new THREE.Group();

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.86,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.08,
    transparent: true,
    opacity: isSoftwareGl ? 0.3 : 0.42,
    transmission: isSoftwareGl ? 0 : 0.72,
    depthWrite: false,
  });
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xfbf4e8,
    roughness: 0.56,
    metalness: 0.0,
  });
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x241d19, roughness: 0.9 });
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xffaa33,
    transparent: true,
    opacity: 0.82,
  });
  const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xfff7cf });

  // Brushed brass circular tray base
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.024, 24), brassMat);
  tray.position.y = 0.012;
  cg.add(tray);

  const pillars = [
    { x: -0.055, z: -0.03, r: 0.058, h: 0.36 },
    { x: 0.075, z: 0.025, r: 0.052, h: 0.26 },
    { x: -0.02, z: 0.085, r: 0.046, h: 0.19 },
  ];

  pillars.forEach((p) => {
    const glassH = p.h + 0.14;
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(p.r + 0.022, p.r + 0.022, glassH, 16, 1, true),
      glassMat
    );
    glass.position.set(p.x, 0.024 + glassH / 2, p.z);

    const glassRim = new THREE.Mesh(
      new THREE.TorusGeometry(p.r + 0.022, 0.004, 6, 18),
      brassMat
    );
    glassRim.rotation.x = Math.PI / 2;
    glassRim.position.set(p.x, 0.024 + glassH, p.z);

    const wax = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r * 1.02, p.h, 14), waxMat);
    wax.position.set(p.x, 0.024 + p.h / 2, p.z);

    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.025, 6), wickMat);
    wick.position.set(p.x, 0.024 + p.h + 0.01, p.z);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), outerFlameMat);
    flame.scale.set(0.68, 1.75, 0.68);
    flame.position.set(p.x, 0.024 + p.h + 0.044, p.z);

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), innerFlameMat);
    core.scale.set(0.7, 1.5, 0.7);
    flame.add(core);

    animatedFlames.push(flame);
    cg.add(glass, glassRim, wax, wick, flame);
  });

  return cg;
}

/**
 * Tailored anatomical Groom / Bride figure (composite Lathe + Capsule PBR assembly)
 */
export function createWeddingMannequin(kind: 'groom' | 'bride'): THREE.Group {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xecc4aa, roughness: 0.48 });
  const darkSuitMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.72 });
  const lapelMat = new THREE.MeshStandardMaterial({ color: 0x0e1015, roughness: 0.28, metalness: 0.12 });
  const whiteShirtMat = new THREE.MeshStandardMaterial({ color: 0xfcf9f5, roughness: 0.48 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1815, roughness: 0.76 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x111010, roughness: 0.24, metalness: 0.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.26, metalness: 0.88 });

  // Stepped ivory marble & brushed gold podium
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.22, 0.14, 36),
    new THREE.MeshStandardMaterial({ color: 0xfaf6f0, roughness: 0.3 })
  );
  podium.position.y = 0.07;
  podium.receiveShadow = true;
  group.add(podium);

  const podiumRim = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.024, 10, 42), goldMat);
  podiumRim.rotation.x = Math.PI / 2;
  podiumRim.position.y = 0.145;
  group.add(podiumRim);

  const standY = 0.14;

  if (kind === 'groom') {
    // Tailored trousers + Oxford shoes
    for (const side of [-1, 1]) {
      const lx = side * 0.105;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.076, 0.76, 6, 14), darkSuitMat);
      leg.position.set(lx, standY + 0.48, side * 0.01);
      leg.rotation.z = side * -0.025;
      leg.castShadow = true;
      group.add(leg);

      const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.13, 6, 12), leatherMat);
      shoe.rotation.x = Math.PI / 2;
      shoe.scale.set(1.0, 1.0, 0.72);
      shoe.position.set(lx, standY + 0.042, 0.06);
      group.add(shoe);
    }

    // Anatomical V-tapered tuxedo torso via LatheGeometry
    const torsoPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.18, 0.02),
      new THREE.Vector2(0.165, 0.22),
      new THREE.Vector2(0.215, 0.52),
      new THREE.Vector2(0.225, 0.66),
      new THREE.Vector2(0.11, 0.72),
      new THREE.Vector2(0.0, 0.73),
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 24), darkSuitMat);
    torso.scale.set(1.14, 1, 0.68);
    torso.position.set(0, standY + 0.86, 0);
    torso.castShadow = true;
    group.add(torso);

    // Crisp white shirt V-front & tuxedo satin peak lapels + onyx buttons
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.04, 0.42, 12), whiteShirtMat);
    shirt.scale.set(1.1, 1, 0.35);
    shirt.position.set(0, standY + 1.38, 0.135);
    group.add(shirt);

    for (const side of [-1, 1]) {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.38, 0.025), lapelMat);
      lapel.position.set(side * 0.072, standY + 1.37, 0.15);
      lapel.rotation.z = side * -0.22;
      lapel.rotation.y = side * 0.18;
      group.add(lapel);
    }

    // 3D sculpted bow tie
    const bowCenter = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.028), lapelMat);
    bowCenter.position.set(0, standY + 1.56, 0.162);
    group.add(bowCenter);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.055, 8), lapelMat);
      wing.rotation.z = side * (Math.PI / 2);
      wing.position.set(side * 0.036, standY + 1.56, 0.162);
      group.add(wing);
    }

    // Articulated shoulders, natural bent arms, cuffs & hands
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), darkSuitMat);
      shoulder.position.set(side * 0.255, standY + 1.49, 0);
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.26, 6, 12), darkSuitMat);
      upperArm.position.set(side * 0.285, standY + 1.32, 0.01);
      upperArm.rotation.z = side * 0.14;
      upperArm.rotation.x = -0.08;
      upperArm.castShadow = true;

      const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.24, 6, 12), darkSuitMat);
      forearm.position.set(side * 0.295, standY + 1.07, 0.065);
      forearm.rotation.x = -0.32;
      forearm.rotation.z = side * -0.08;
      forearm.castShadow = true;

      const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), whiteShirtMat);
      cuff.position.set(side * 0.285, standY + 0.93, 0.11);
      cuff.rotation.x = -0.32;

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), skinMat);
      hand.scale.set(0.85, 1.2, 0.72);
      hand.position.set(side * 0.28, standY + 0.88, 0.125);

      group.add(shoulder, upperArm, forearm, cuff, hand);
    }

    // Boutonniere rose on left lapel
    const bout = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.025, 0),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 })
    );
    bout.position.set(0.09, standY + 1.44, 0.17);
    group.add(bout);

    // Natural sculpted neck, face, jawline & layered swept hair
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.07, 0.13, 14), skinMat);
    neck.position.set(0, standY + 1.63, 0.01);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 22, 20), skinMat);
    head.scale.set(0.88, 1.12, 0.95);
    head.position.set(0, standY + 1.79, 0.02);
    head.castShadow = true;

    const hairBack = new THREE.Mesh(
      new THREE.SphereGeometry(0.142, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairBack.scale.set(0.92, 1.05, 1.0);
    hairBack.position.set(0, standY + 1.82, 0.0);
    hairBack.rotation.x = -0.35;

    const hairQuiff = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.11, 6, 12), hairMat);
    hairQuiff.rotation.z = Math.PI / 2;
    hairQuiff.rotation.y = 0.2;
    hairQuiff.position.set(0, standY + 1.92, 0.05);

    group.add(neck, head, hairBack, hairQuiff);
  } else {
    const gownMat = new THREE.MeshStandardMaterial({ color: 0xfffaf6, roughness: 0.54 });
    const satinMat = new THREE.MeshStandardMaterial({ color: 0xf5ebe0, roughness: 0.3 });

    // Flowing sculpted ballgown via LatheGeometry
    const gownPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.68, 0.0),
      new THREE.Vector2(0.58, 0.35),
      new THREE.Vector2(0.42, 0.72),
      new THREE.Vector2(0.16, 1.02),
      new THREE.Vector2(0.15, 1.14),
      new THREE.Vector2(0.19, 1.46),
      new THREE.Vector2(0.12, 1.54),
      new THREE.Vector2(0.0, 1.55),
    ];
    const gown = new THREE.Mesh(new THREE.LatheGeometry(gownPts, 32), gownMat);
    gown.scale.set(1.02, 1, 0.92);
    gown.position.set(0, standY, 0);
    gown.castShadow = true;
    group.add(gown);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.022, 8, 24), satinMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.set(0, standY + 1.08, 0);
    group.add(sash);

    // Graceful arms holding a small bridal bouquet
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.44, 6, 12), skinMat);
      arm.position.set(side * 0.21, standY + 1.24, 0.11);
      arm.rotation.z = side * 0.24;
      arm.rotation.x = -0.52;
      group.add(arm);
    }

    const bouquetStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.14, 10), satinMat);
    bouquetStem.position.set(0, standY + 1.0, 0.26);
    bouquetStem.rotation.x = 0.4;
    const bouquetWrap = new THREE.Group();
    bouquetWrap.position.set(0, standY + 1.08, 0.28);
    const rosePink = new THREE.MeshStandardMaterial({ color: 0xf7b2c4, roughness: 0.5 });
    const roseCream = new THREE.MeshStandardMaterial({ color: 0xfff3f6, roughness: 0.5 });
    for (let b = 0; b < 6; b++) {
      const ba = (b / 6) * Math.PI * 2;
      const fl = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.048, 0),
        b % 2 === 0 ? rosePink : roseCream
      );
      fl.position.set(Math.cos(ba) * 0.06, 0.02 + (b % 2) * 0.02, Math.sin(ba) * 0.06);
      bouquetWrap.add(fl);
    }
    group.add(bouquetStem, bouquetWrap);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12), skinMat);
    neck.position.set(0, standY + 1.59, 0.01);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.128, 22, 18), skinMat);
    head.scale.set(0.88, 1.1, 0.94);
    head.position.set(0, standY + 1.74, 0.015);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.65),
      hairMat
    );
    hair.position.set(0, standY + 1.77, -0.005);
    hair.rotation.x = -0.25;
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), hairMat);
    bun.position.set(0, standY + 1.79, -0.14);
    const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 22, Math.PI), goldMat);
    tiara.position.set(0, standY + 1.87, 0.02);
    const veil = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 1.35),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    veil.position.set(0, standY + 1.24, -0.24);
    veil.rotation.x = 0.18;
    group.add(neck, head, hair, bun, tiara, veil);
  }

  return group;
}

export function createWeddingPedestalBase(): THREE.Group {
  const g = new THREE.Group();
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f3, roughness: 0.26 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.88 });

  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 0.94), marbleMat);
  basePlinth.position.y = 0.04;
  const baseGold = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, 0.86), goldMat);
  baseGold.position.y = 0.1;

  const col = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.96, 0.72), marbleMat);
  col.position.y = 0.6;
  col.castShadow = true;
  col.receiveShadow = true;

  // Decorative recessed gold trim moldings on column faces
  const midTrim = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.025, 0.75), goldMat);
  midTrim.position.y = 0.96;

  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.055, 0.88), goldMat);
  topTrim.position.y = 1.11;
  const capSlab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.92), marbleMat);
  capSlab.position.y = 1.16;

  g.add(basePlinth, baseGold, col, midTrim, topTrim, capSlab);
  return g;
}

export function createWeddingStations(
  config: WeddingInviteConfig,
  disposables: Array<{ dispose: () => void }>,
  room2BackZ: number
): { group: THREE.Group; stations: WeddingStationRef[] } {
  const root = new THREE.Group();
  const stations: WeddingStationRef[] = [];

  // 1. Natural Concierge Map Table & Brass/Ruby Location Pin (Right of Room 2)
  {
    const pedPos = new THREE.Vector3(3.45, 0, room2BackZ + 5.6);
    const ped = createWeddingPedestalBase();
    ped.position.copy(pedPos);
    ped.rotation.y = -0.28;

    // Angled luxury city map console resting on podium top
    const mapConsole = new THREE.Group();
    mapConsole.position.set(0, 1.24, 0);
    mapConsole.rotation.x = -0.34;

    const brassFrameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.24,
      metalness: 0.88,
    });
    const frameBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 0.76), brassFrameMat);
    frameBox.userData.stationType = 'location';

    const mapTex = createVenueMapTexture(config.venueName, config.venueAddress);
    disposables.push(mapTex);
    const mapPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.68),
      new THREE.MeshBasicMaterial({ map: mapTex })
    );
    mapPlane.rotation.x = -Math.PI / 2;
    mapPlane.position.y = 0.028;
    mapPlane.userData.stationType = 'location';

    mapConsole.add(frameBox, mapPlane);
    ped.add(mapConsole);

    // Floating Faceted Gold & Ruby Glass Location Pin above map
    const pinGroup = new THREE.Group();
    pinGroup.position.set(0, 1.72, 0);

    const rubyMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x5c081d,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.1,
      clearcoat: 1.0,
    });

    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 12, 28), brassFrameMat);
    ringOuter.position.y = 0.18;
    ringOuter.userData.stationType = 'location';

    const pinDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.045, 24), rubyMat);
    pinDisc.rotation.x = Math.PI / 2;
    pinDisc.position.y = 0.18;
    pinDisc.userData.stationType = 'location';

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 18), brassFrameMat);
    tip.rotation.x = Math.PI;
    tip.position.y = -0.06;
    tip.userData.stationType = 'location';

    const centerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
    );
    centerDot.position.y = 0.18;

    pinGroup.add(ringOuter, pinDisc, tip, centerDot);
    ped.add(pinGroup);
    root.add(ped);

    stations.push({
      type: 'location',
      pos: pedPos,
      hitMeshes: [frameBox, mapPlane, ringOuter, pinDisc, tip],
      animatedMesh: pinGroup,
    });
  }

  // 2. Luxury Tilaklar Kitobi (Open Guestbook Lectern & Brass Lamp, Right-Back of Room 2)
  {
    const pedPos = new THREE.Vector3(2.45, 0, room2BackZ + 2.95);
    const ped = createWeddingPedestalBase();
    ped.position.copy(pedPos);
    ped.rotation.y = -0.18;

    const walnutMat = new THREE.MeshStandardMaterial({ color: 0x4b3224, roughness: 0.44 });
    const leatherCoverMat = new THREE.MeshStandardMaterial({ color: 0x7c1d32, roughness: 0.55 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.88 });

    // Angled lectern desk
    const lectern = new THREE.Group();
    lectern.position.set(0, 1.24, 0.02);
    lectern.rotation.x = -0.32;

    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.045, 0.62), walnutMat);
    desk.userData.stationType = 'wishes';

    // Open Hardcover Guestbook (left + right cover + open written parchment spread)
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.03, 0.46), leatherCoverMat);
    cover.position.set(0, 0.035, 0.02);
    cover.userData.stationType = 'wishes';

    const bookTex = createGuestbookPagesTexture(config.wishes.length);
    disposables.push(bookTex);
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.63, 0.036, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xfbf5ea, roughness: 0.78 })
    );
    pages.position.set(0, 0.056, 0.02);

    const spreadFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.41),
      new THREE.MeshBasicMaterial({ map: bookTex })
    );
    spreadFace.rotation.x = -Math.PI / 2;
    spreadFace.position.set(0, 0.076, 0.02);
    spreadFace.userData.stationType = 'wishes';

    // Gold bookmark ribbon & brass pen resting on open page
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.48), brassMat);
    ribbon.position.set(0.0, 0.078, 0.05);

    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.005, 0.22, 8), brassMat);
    pen.rotation.z = Math.PI / 2;
    pen.rotation.y = 0.42;
    pen.position.set(0.16, 0.088, 0.14);

    lectern.add(desk, cover, pages, spreadFace, ribbon, pen);

    // Classic brass desk lamp on back corner of pedestal
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.34, 10), brassMat);
    lampStem.position.set(-0.28, 1.36, -0.24);
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xffcf7a, emissiveIntensity: 0.6, roughness: 0.3 })
    );
    lampShade.position.set(-0.22, 1.5, -0.2);
    lampShade.rotation.z = -0.35;
    ped.add(lectern, lampStem, lampShade);

    // Floating framed calligraphy plaque softly hovering above book
    const wishGroup = new THREE.Group();
    wishGroup.position.set(0, 1.78, -0.05);
    const wishFrame = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.26, 0.03), brassMat);
    wishFrame.userData.stationType = 'wishes';
    const wishTex = createPlaqueTexture(`Tilaklar (${config.wishes.length})`, {
      bg: '#fff9f5',
      fg: '#7c1d32',
      border: '#d4af37',
      font: '700 44px "Cormorant Garamond", Georgia, serif',
    });
    disposables.push(wishTex);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.21),
      new THREE.MeshBasicMaterial({ map: wishTex })
    );
    face.position.z = 0.018;
    face.userData.stationType = 'wishes';
    wishGroup.add(wishFrame, face);
    ped.add(wishGroup);

    root.add(ped);

    stations.push({
      type: 'wishes',
      pos: pedPos,
      hitMeshes: [desk, cover, spreadFace, wishFrame, face],
      animatedMesh: wishGroup,
    });
  }

  // 3. Realistic Luxury Wedding ATM Kiosk ("TO'YONA BANKOMATI", Left of Room 2)
  {
    const atmPos = new THREE.Vector3(-3.55, 0, room2BackZ + 5.6);
    const atmGroup = new THREE.Group();
    atmGroup.position.copy(atmPos);
    atmGroup.rotation.y = Math.PI * 0.28;

    const champagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd1aa62,
      roughness: 0.26,
      metalness: 0.86,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1b2029,
      roughness: 0.3,
      metalness: 0.78,
    });
    const brushedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.24,
      metalness: 0.88,
    });
    const granitePlinthMat = new THREE.MeshStandardMaterial({
      color: 0x221f22,
      roughness: 0.35,
      metalness: 0.15,
    });

    // Dark marble plinth base
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.1, 0.76), granitePlinthMat);
    plinth.position.y = 0.05;
    atmGroup.add(plinth);

    // Main lower cabinet body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.92, 0.66), champagneGoldMat);
    lowerBody.position.y = 0.56;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    lowerBody.userData.stationType = 'toyona';
    atmGroup.add(lowerBody);

    // Solid champagne-gold outer back wall tucked cleanly between pillars (zero coplanar faces)
    const upperOuterBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.96, 0.14),
      champagneGoldMat
    );
    upperOuterBack.position.set(0, 1.5, -0.26);
    upperOuterBack.castShadow = true;
    upperOuterBack.receiveShadow = true;
    upperOuterBack.userData.stationType = 'toyona';
    atmGroup.add(upperOuterBack);

    // Inner dark recessed bay tucked strictly inside the golden outer frame (|x| <= 0.40, z >= -0.185)
    const upperBack = new THREE.Mesh(new THREE.BoxGeometry(0.796, 0.82, 0.38), darkSteelMat);
    upperBack.position.set(0, 1.43, 0.005);
    upperBack.castShadow = true;
    upperBack.userData.stationType = 'toyona';
    atmGroup.add(upperBack);

    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.98, 0.66), champagneGoldMat);
      pillar.position.set(side * 0.455, 1.51, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      pillar.userData.stationType = 'toyona';
      atmGroup.add(pillar);
    }

    const topCanopy = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.24, 0.7), champagneGoldMat);
    topCanopy.position.set(0, 1.94, 0.02);
    topCanopy.castShadow = true;
    topCanopy.userData.stationType = 'toyona';
    atmGroup.add(topCanopy);

    // Illuminated Header Marquee Sign
    const headerTex = createPlaqueTexture("TO'YONA BANKOMATI", {
      bg: '#1c1512',
      fg: '#fde68a',
      border: '#d4af37',
      font: '700 34px "Plus Jakarta Sans", sans-serif',
    });
    disposables.push(headerTex);
    const headerSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.16),
      new THREE.MeshBasicMaterial({ map: headerTex })
    );
    headerSign.position.set(0, 1.93, 0.373);
    headerSign.userData.stationType = 'toyona';
    atmGroup.add(headerSign);

    // Recessed glossy tilted touchscreen display + bezel
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 1.44, 0.245);
    screenGroup.rotation.x = -0.1;

    const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.56, 0.04), darkSteelMat);
    screenBezel.userData.stationType = 'toyona';
    screenGroup.add(screenBezel);

    const screenTex = createAtmScreenTexture();
    disposables.push(screenTex);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.48),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screen.position.set(0, 0, 0.023);
    screen.userData.stationType = 'toyona';
    screenGroup.add(screen);
    atmGroup.add(screenGroup);

    // 4 physical side function keys on left & right of display
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const key = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.038, 0.025), brushedSteelMat);
        key.position.set(side * 0.365, 1.31 + k * 0.088, 0.268 - k * 0.008);
        key.rotation.x = -0.1;
        atmGroup.add(key);
      }
    }

    // Sloped metallic keypad shelf + 4x4 PIN pad + colored Cancel/Clear/Enter keys
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.09, 0.34), brushedSteelMat);
    shelf.position.set(0, 1.04, 0.34);
    shelf.rotation.x = 0.22;
    shelf.userData.stationType = 'toyona';
    atmGroup.add(shelf);

    // Keypad recess & 12 metallic number buttons
    const padWell = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.24), darkSteelMat);
    padWell.position.set(-0.14, 1.09, 0.35);
    padWell.rotation.x = 0.22;
    atmGroup.add(padWell);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const btn = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.016, 0.038), brushedSteelMat);
        btn.position.set(-0.2 + c * 0.06, 1.105 - r * 0.01, 0.3 + r * 0.045);
        btn.rotation.x = 0.22;
        atmGroup.add(btn);
      }
    }

    // Green Enter, Yellow Clear, Red Cancel buttons beside numpad
    const actionColors = [0xef4444, 0xf59e0b, 0x10b981];
    actionColors.forEach((col, idx) => {
      const aBtn = new THREE.Mesh(
        new THREE.BoxGeometry(0.054, 0.018, 0.038),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })
      );
      aBtn.position.set(0.0, 1.105 - idx * 0.01, 0.3 + idx * 0.048);
      aBtn.rotation.x = 0.22;
      atmGroup.add(aBtn);
    });

    // Illuminated Card Reader Slot + NFC Contactless Pad on right side of shelf
    const cardBezel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.09), darkSteelMat);
    cardBezel.position.set(0.24, 1.1, 0.33);
    cardBezel.rotation.x = 0.22;
    const cardLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.01, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    cardLed.position.set(0.24, 1.115, 0.375);
    atmGroup.add(cardBezel, cardLed);

    // Lower Cash / Receipt Dispenser Bay + Privacy Hood
    const dispenserWell = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.08), darkSteelMat);
    dispenserWell.position.set(0, 0.72, 0.31);
    const receiptSlot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.04), granitePlinthMat);
    receiptSlot.position.set(0.22, 0.88, 0.325);
    atmGroup.add(dispenserWell, receiptSlot);

    root.add(atmGroup);

    stations.push({
      type: 'toyona',
      pos: atmPos,
      hitMeshes: [lowerBody, upperOuterBack, upperBack, headerSign, screenBezel, screen, shelf],
    });
  }

  return { group: root, stations };
}
