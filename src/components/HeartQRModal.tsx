import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Heart, X } from 'lucide-react';

interface HeartQRModalProps {
  open: boolean;
  museumTitle: string;
  shareUrl: string;
  onClose: () => void;
}

export const HeartQRModal: React.FC<HeartQRModalProps> = ({
  open,
  museumTitle,
  shareUrl,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 640;
    canvas.width = size;
    canvas.height = size;

    // Soft dark-rose luxury backdrop
    const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 40, size / 2, size / 2, 340);
    bgGrad.addColorStop(0, '#fff5f7');
    bgGrad.addColorStop(1, '#ffe4ea');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Draw outer Heart silhouette card
    const drawHeartPath = (cx: number, cy: number, scale: number) => {
      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2 + 0.02; t += 0.02) {
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)
        );
        const px = cx + hx * scale;
        const py = cy + hy * scale;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // Subtle soft shadow behind heart
    ctx.save();
    ctx.shadowColor = 'rgba(190, 24, 60, 0.22)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    drawHeartPath(size / 2, size / 2 - 10, 17.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Heart border stroke
    drawHeartPath(size / 2, size / 2 - 10, 17.5);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Inner decorative dashed/soft pink heart rim
    drawHeartPath(size / 2, size / 2 - 10, 16.5);
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Generate real scannable QR matrix inside the heart
    const qr = QRCode.create(shareUrl, { errorCorrectionLevel: 'H' });
    const count = qr.modules.size;
    const qrBox = 248;
    const cellSize = qrBox / count;
    const startX = (size - qrBox) / 2;
    const startY = size / 2 - qrBox / 2 - 14;

    // Quiet white zone behind QR so camera scanning is 100% reliable
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(startX - 12, startY - 12, qrBox + 24, qrBox + 24, 14);
    ctx.fill();

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!qr.modules.get(r, c)) continue;
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;

        // Finder patterns in deep rose crimson, data modules in deep wine-charcoal
        const inTopLeft = r < 7 && c < 7;
        const inTopRight = r < 7 && c >= count - 7;
        const inBottomLeft = r >= count - 7 && c < 7;

        ctx.fillStyle = inTopLeft || inTopRight || inBottomLeft ? '#be123c' : '#2a1218';
        ctx.beginPath();
        ctx.roundRect(x + 0.35, y + 0.35, cellSize - 0.7, cellSize - 0.7, cellSize * 0.25);
        ctx.fill();
      }
    }

    // Center mini heart emblem inside QR (safe with ErrorCorrectionLevel H)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, startY + qrBox / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    drawHeartPath(size / 2, startY + qrBox / 2 + 1, 0.85);
    ctx.fillStyle = '#e11d48';
    ctx.fill();

    // Bottom signature inside heart card
    ctx.fillStyle = '#881337';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('muzeycha.uz', size / 2, size - 50);

    ctx.fillStyle = '#9f1239';
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(museumTitle.slice(0, 32), size / 2, size - 25);
  }, [open, shareUrl, museumTitle]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback select
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `muzeycha-qr-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#181312] border border-white/15 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto muzey-scroll shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h2 className="text-lg font-semibold">Yurakcha QR va Havola</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-white/65 mb-4">
          Yaqiningiz telefon kamerasi bilan ushbu yurakcha QR kodni skaner qilsa, 3D muzeyingiz darhol ochiladi.
        </p>

        <div className="rounded-2xl overflow-hidden border border-rose-300/25 bg-[#fff5f7] aspect-square max-w-[300px] mx-auto mb-4 shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Share URL box */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/12 rounded-xl px-3 py-2 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs text-white/85 outline-none truncate font-mono-num"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 text-xs font-medium text-white shrink-0 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Yurakcha QR yuklab olish (PNG)</span>
        </button>
      </div>
    </div>
  );
};
