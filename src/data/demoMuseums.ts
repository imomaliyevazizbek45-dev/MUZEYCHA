import type { ArtworkItem, MuseumData, MuseumThemeId, WeddingInviteConfig } from '../types/museum';

interface PaintedSceneSpec {
  id: string;
  title: string;
  caption: string;
  palette: [string, string, string];
  motif:
    | 'couple-arch'
    | 'sunset-sea'
    | 'coffee-date'
    | 'bouquet'
    | 'lantern-night'
    | 'city-lights'
    | 'rings'
    | 'mountain-walk'
    | 'umbrella-rain'
    | 'moonlit-pier'
    | 'anniversary-cake';
}

const MEMORY_SPECS: PaintedSceneSpec[] = [
  {
    id: 'mem-1',
    title: 'Ilk uchrashuv',
    caption: 'Sokin oqshom, iliq qahva va unutilmas suhbat.',
    palette: ['#2c1816', '#c97b63', '#f7d8b5'],
    motif: 'coffee-date',
  },
  {
    id: 'mem-2',
    title: 'Baxtli kunimiz',
    caption: 'Oq libos va baxtga to‘la birinchi qadam.',
    palette: ['#2b201c', '#e5c1a1', '#fff5eb'],
    motif: 'couple-arch',
  },
  {
    id: 'mem-3',
    title: 'Dengiz bo‘yidagi quyosh botishi',
    caption: 'Oltin rang ufq va sokin to‘lqinlar sadosi.',
    palette: ['#1a233a', '#d96b52', '#ffd185'],
    motif: 'sunset-sea',
  },
  {
    id: 'mem-4',
    title: 'Atirgullar guldastasi',
    caption: 'Har bir gulda mehr va samimiyat izi bor.',
    palette: ['#241118', '#b8293d', '#f5c7cb'],
    motif: 'bouquet',
  },
  {
    id: 'mem-5',
    title: 'Kechki chiroqlar',
    caption: 'Osmonni bezagan fonuslar ostidagi orzu.',
    palette: ['#111526', '#d98c3f', '#ffe39c'],
    motif: 'lantern-night',
  },
  {
    id: 'mem-6',
    title: 'Shahar sayri',
    caption: 'Tungi ko‘chalarda qo‘l ushlashib yurgan damlar.',
    palette: ['#141a29', '#7f5a83', '#f5c27b'],
    motif: 'city-lights',
  },
  {
    id: 'mem-7',
    title: 'Abadiy va’da',
    caption: 'Ikki yurakni birlashtirgan oltin uzuklar.',
    palette: ['#1f1916', '#c89d54', '#faebd0'],
    motif: 'rings',
  },
  {
    id: 'mem-8',
    title: 'Tog‘lardagi tong',
    caption: 'Toza havo, tumanli cho‘qqilar va birgalikdagi sayohat.',
    palette: ['#1b2a34', '#6b8e9b', '#f2d3b1'],
    motif: 'mountain-walk',
  },
  {
    id: 'mem-9',
    title: 'Yomg‘irli kun',
    caption: 'Bitta soyabon ostidagi iliq xotiralar.',
    palette: ['#18202c', '#5c7d99', '#f7b267'],
    motif: 'umbrella-rain',
  },
  {
    id: 'mem-10',
    title: 'Oy nuri ostida',
    caption: 'Sokin ko‘l bo‘yida yulduzli osmon.',
    palette: ['#0c1224', '#385170', '#f4e8c1'],
    motif: 'moonlit-pier',
  },
  {
    id: 'mem-11',
    title: 'Bir yilligimiz muborak',
    caption: 'Eng chiroyli xotiralarimiz hali oldinda.',
    palette: ['#291318', '#d45d79', '#ffe8d6'],
    motif: 'anniversary-cake',
  },
];

function paintMemoryArtwork(spec: PaintedSceneSpec): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;
  const [c1, c2, c3] = spec.palette;

  const bg = ctx.createLinearGradient(0, 0, 0, 900);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.55, c2);
  bg.addColorStop(1, c3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 720, 900);

  const glow = ctx.createRadialGradient(360, 360, 20, 360, 360, 340);
  glow.addColorStop(0, 'rgba(255, 244, 224, 0.42)');
  glow.addColorStop(1, 'rgba(255, 244, 224, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 720, 900);

  ctx.save();
  switch (spec.motif) {
    case 'couple-arch': {
      ctx.fillStyle = 'rgba(255, 244, 232, 0.22)';
      ctx.beginPath();
      ctx.roundRect(140, 110, 440, 660, [220, 220, 12, 12]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 235, 205, 0.65)';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#fff5ee';
      ctx.beginPath();
      ctx.moveTo(270, 440);
      ctx.quadraticCurveTo(215, 620, 195, 765);
      ctx.lineTo(355, 765);
      ctx.quadraticCurveTo(340, 600, 315, 440);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(292, 392, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1b1718';
      ctx.beginPath();
      ctx.roundRect(380, 420, 105, 345, [28, 28, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#f2d3be';
      ctx.beginPath();
      ctx.arc(432, 372, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1718';
      ctx.beginPath();
      ctx.arc(432, 360, 36, Math.PI, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sunset-sea': {
      ctx.fillStyle = '#ffe59d';
      ctx.beginPath();
      ctx.arc(360, 440, 110, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(20, 28, 48, 0.72)';
      ctx.fillRect(0, 500, 720, 400);

      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `rgba(255, 215, 140, ${0.45 - i * 0.025})`;
        const w = 180 - i * 8;
        ctx.fillRect(360 - w / 2 + Math.sin(i) * 12, 515 + i * 22, w, 7);
      }
      ctx.fillStyle = '#120f14';
      ctx.beginPath();
      ctx.arc(325, 635, 22, 0, Math.PI * 2);
      ctx.arc(385, 645, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(306, 660, 38, 135);
      ctx.fillRect(368, 668, 34, 127);
      break;
    }
    case 'coffee-date': {
      ctx.fillStyle = 'rgba(30, 18, 12, 0.65)';
      ctx.beginPath();
      ctx.ellipse(360, 620, 270, 130, 0, 0, Math.PI * 2);
      ctx.fill();

      for (const cx of [255, 465]) {
        ctx.fillStyle = '#f8efe6';
        ctx.beginPath();
        ctx.arc(cx, 540, 68, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7b4b2a';
        ctx.beginPath();
        ctx.arc(cx, 540, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff5ea';
        ctx.beginPath();
        ctx.arc(cx - 10, 534, 12, 0, Math.PI * 2);
        ctx.arc(cx + 10, 534, 12, 0, Math.PI * 2);
        ctx.moveTo(cx - 22, 539);
        ctx.lineTo(cx, 563);
        ctx.lineTo(cx + 22, 539);
        ctx.fill();
      }
      break;
    }
    case 'bouquet': {
      const petals = [
        [360, 340, '#c9184a'],
        [285, 390, '#e63946'],
        [435, 390, '#d90429'],
        [320, 455, '#ff758f'],
        [405, 455, '#e01e37'],
        [360, 410, '#a4133c'],
      ] as const;
      ctx.fillStyle = '#2d4f38';
      for (let a = -0.8; a <= 0.8; a += 0.32) {
        ctx.save();
        ctx.translate(360, 480);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -140, 38, 110, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#f5e4d7';
      ctx.beginPath();
      ctx.moveTo(220, 460);
      ctx.lineTo(500, 460);
      ctx.lineTo(395, 760);
      ctx.lineTo(325, 760);
      ctx.closePath();
      ctx.fill();
      for (const [rx, ry, col] of petals) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(rx, ry, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 220, 228, 0.38)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rx, ry, 34, 0, Math.PI * 1.4);
        ctx.stroke();
      }
      break;
    }
    case 'lantern-night': {
      const positions = [
        [180, 240, 0.8],
        [360, 180, 1.15],
        [530, 270, 0.9],
        [260, 380, 0.7],
        [450, 410, 0.75],
      ];
      for (const [lx, ly, sc] of positions) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(sc, sc);
        const lg = ctx.createRadialGradient(0, 10, 5, 0, 10, 90);
        lg.addColorStop(0, 'rgba(255, 224, 140, 0.75)');
        lg.addColorStop(1, 'rgba(255, 160, 60, 0)');
        ctx.fillStyle = lg;
        ctx.fillRect(-90, -90, 180, 180);

        ctx.fillStyle = '#ffbd59';
        ctx.beginPath();
        ctx.roundRect(-28, -36, 56, 72, 16);
        ctx.fill();
        ctx.fillStyle = '#fff5cc';
        ctx.beginPath();
        ctx.ellipse(0, 12, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'rings': {
      ctx.strokeStyle = '#f6d37a';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(315, 450, 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(415, 450, 95, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(415, 315);
      ctx.lineTo(440, 345);
      ctx.lineTo(415, 365);
      ctx.lineTo(390, 345);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'anniversary-cake': {
      ctx.fillStyle = '#ffccd5';
      ctx.beginPath();
      ctx.arc(305, 365, 68, 0, Math.PI * 2);
      ctx.arc(415, 365, 68, 0, Math.PI * 2);
      ctx.moveTo(240, 385);
      ctx.lineTo(360, 535);
      ctx.lineTo(480, 385);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = 'italic 600 44px "Cormorant Garamond", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('1 Yil · Abadiy', 360, 640);
      break;
    }
    default: {
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = `rgba(255, 240, 210, ${0.12 + (i % 5) * 0.05})`;
        ctx.beginPath();
        ctx.arc((i * 137) % 720, (i * 97) % 520, 18 + (i % 4) * 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(18, 16, 22, 0.85)';
      ctx.fillRect(0, 680, 720, 220);
      ctx.beginPath();
      ctx.arc(325, 575, 24, 0, Math.PI * 2);
      ctx.arc(395, 585, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(302, 602, 46, 120, 18);
      ctx.roundRect(374, 610, 42, 112, 18);
      ctx.fill();
      break;
    }
  }
  ctx.restore();

  const vig = ctx.createRadialGradient(360, 450, 200, 360, 450, 560);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 720, 900);

  return canvas.toDataURL('image/jpeg', 0.9);
}

let cachedArtworks: ArtworkItem[] | null = null;

export function getDemoArtworks(): ArtworkItem[] {
  if (cachedArtworks) return cachedArtworks;
  cachedArtworks = MEMORY_SPECS.map((spec) => ({
    id: spec.id,
    title: spec.title,
    caption: spec.caption,
    type: 'image',
    src: paintMemoryArtwork(spec),
    aspectRatio: 0.8,
  }));
  return cachedArtworks;
}

export function createDefaultWeddingConfig(): WeddingInviteConfig {
  return {
    weddingDate: '2027-01-01',
    mannequin: 'groom' as const,
    venueName: 'Yakka Saroy Tantanalar Saroyi',
    venueAddress: "Yakka Saroy, Abdulla Qahhor ko'chasi, 40",
    lat: 41.2877,
    lng: 69.2572,
    cardNumber: '5614 6887 1922 5830',
    wishes: [
      {
        id: 'w-1',
        author: 'Bobobek',
        message: "To'ylar muborak! Baxtli bo'linglar!",
        createdAt: Date.now() - 1000 * 60 * 4,
      },
    ],
  };
}

export function createPresetMuseum(preset: MuseumThemeId): MuseumData {
  const all = getDemoArtworks();
  if (preset === 'wedding-invite') {
    return {
      id: 'demo-wedding-invite',
      title: "To'yga Taklifnoma",
      subtitle: 'Sizni baxtli kunimizga taklif etamiz',
      theme: 'wedding-invite',
      heroText: "TO'YGA TAKLIFNOMA",
      music: 'romantic-piano',
      artworks: all,
      weddingConfig: createDefaultWeddingConfig(),
      createdAt: Date.now(),
    };
  }
  if (preset === 'romantic-rose') {
    return {
      id: 'demo-marry-me',
      title: 'Bizning muzeyimiz',
      subtitle: 'Sevgi va baxt yo‘lagi',
      theme: 'romantic-rose',
      heroText: 'MARRY ME',
      music: 'romantic-piano',
      artworks: all.slice(0, 8),
      createdAt: Date.now(),
    };
  }
  return {
    id: 'demo-dark-gallery',
    title: 'Bizning muzeyimiz',
    subtitle: 'Eng sara xotiralar galereyasi',
    theme: 'dark-gallery',
    heroText: 'BIZNING MUZEYIMIZ',
    music: 'romantic-piano',
    artworks: all,
    createdAt: Date.now(),
  };
}
