import * as THREE from 'three';

function configureTexture(tex: THREE.CanvasTexture, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createDarkParquetFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b1410';
  ctx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 256;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * plankW;
      const y = row * plankH + (col % 2 === 0 ? 0 : 128);
      const shade = 20 + ((col * 7 + row * 13) % 14);
      ctx.fillStyle = `rgb(${shade + 8}, ${shade + 2}, ${shade - 3})`;
      ctx.fillRect(x + 1, (y % 512) + 1, plankW - 2, plankH - 2);

      // Subtle wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gx = x + 6 + g * 9;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx + (Math.random() - 0.5) * 3, 512);
        ctx.stroke();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  return configureTexture(tex, 6, 12);
}

export function createCreamMarbleFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#efe2d3');
  grad.addColorStop(0.5, '#e8d7c5');
  grad.addColorStop(1, '#f2e6d8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle marble veins
  ctx.strokeStyle = 'rgba(182, 152, 124, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (Math.random() - 0.5) * 80;
      y += 64;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Tile grout lines
  ctx.strokeStyle = 'rgba(170, 145, 120, 0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  return configureTexture(tex, 4, 8);
}

export function createWhitePearlMarbleFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#faf8f5');
  grad.addColorStop(0.5, '#f5f2ed');
  grad.addColorStop(1, '#fcfaf7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Delicate pale champagne-grey marble veining (no dark grid lines)
  ctx.strokeStyle = 'rgba(188, 178, 168, 0.16)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (Math.random() - 0.5) * 90;
      y += 64;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  return configureTexture(tex, 3, 6);
}

export function createRedCarpetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9c1622';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle woven velvet texture
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 120, 120, 0.05)' : 'rgba(40, 0, 8, 0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle gold trim on left and right edges
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(14, 0, 8, 512);
  ctx.fillRect(490, 0, 8, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  return configureTexture(tex, 1, 7);
}

export function createWallPlasterTexture(baseHex: string, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = maxAnisotropy;
  return configureTexture(tex, 4, 2);
}

export function createPlaqueTexture(
  text: string,
  options: { bg?: string; fg?: string; border?: string; font?: string } = {}
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = options.bg ?? '#1f1814';
  ctx.fillRect(0, 0, 512, 128);

  if (options.border) {
    ctx.strokeStyle = options.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 112);
  }

  ctx.fillStyle = options.fg ?? '#f5e6d3';
  ctx.font = options.font ?? '600 38px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 66, 460);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createMuzeychaBrandWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 768, 384);

  // Draw cute house-with-photos emblem matching muzeycha.uz in the video
  const cx = 384;
  const cy = 128;

  // House body
  ctx.fillStyle = '#f8f1e7';
  ctx.beginPath();
  ctx.roundRect(cx - 58, cy - 10, 116, 86, 12);
  ctx.fill();

  // Roof
  ctx.fillStyle = '#3a2d28';
  ctx.beginPath();
  ctx.moveTo(cx - 78, cy - 6);
  ctx.lineTo(cx, cy - 68);
  ctx.lineTo(cx + 78, cy - 6);
  ctx.closePath();
  ctx.fill();

  // Mini picture frames on the house
  ctx.fillStyle = '#e48d9a';
  ctx.fillRect(cx - 40, cy + 8, 34, 28);
  ctx.fillStyle = '#9ac6e3';
  ctx.fillRect(cx + 6, cy + 8, 34, 28);
  ctx.fillStyle = '#f2c879';
  ctx.fillRect(cx - 18, cy + 44, 36, 26);

  // "muzeycha.uz" label
  ctx.fillStyle = '#4a372c';
  ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('muzeycha.uz', cx, 290);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
