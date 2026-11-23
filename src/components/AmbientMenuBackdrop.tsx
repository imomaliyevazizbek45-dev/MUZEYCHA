import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  hue: 'gold' | 'rose' | 'ivory';
  alpha: number;
  kind: 'mote' | 'bokeh' | 'heart';
}

export const AmbientMenuBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Calibrated particle count for both mobile phones and wide desktops
    const isNarrow = width < 640;
    const count = isNarrow ? 34 : 58;

    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const kind: Particle['kind'] =
        i % 9 === 0 ? 'bokeh' : i % 7 === 0 ? 'heart' : 'mote';
      const hue: Particle['hue'] =
        i % 3 === 0 ? 'rose' : i % 3 === 1 ? 'gold' : 'ivory';
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r:
          kind === 'bokeh'
            ? 18 + Math.random() * 34
            : kind === 'heart'
            ? 3.2 + Math.random() * 2.5
            : 1.1 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.22,
        vy:
          kind === 'bokeh'
            ? -(0.12 + Math.random() * 0.16)
            : -(0.22 + Math.random() * 0.35),
        phase: Math.random() * Math.PI * 2,
        hue,
        alpha:
          kind === 'bokeh'
            ? 0.045 + Math.random() * 0.055
            : 0.25 + Math.random() * 0.5,
        kind,
      };
    });

    const colorRgb = (hue: Particle['hue']) => {
      if (hue === 'rose') return '244, 114, 146';
      if (hue === 'gold') return '234, 189, 108';
      return '255, 245, 232';
    };

    const drawHeart = (cx: number, cy: number, s: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.35);
      ctx.bezierCurveTo(
        cx - s * 1.15,
        cy - s * 0.45,
        cx - s * 0.55,
        cy - s * 1.35,
        cx,
        cy - s * 0.45
      );
      ctx.bezierCurveTo(
        cx + s * 0.55,
        cy - s * 1.35,
        cx + s * 1.15,
        cy - s * 0.45,
        cx,
        cy + s * 0.35
      );
      ctx.closePath();
      ctx.fill();
    };

    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / Math.max(1, width) - 0.5) * 18;
      pointerY = (e.clientY / Math.max(1, height) - 0.5) * 14;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 2.5);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Subtle architectural diagonal light shafts (slow shimmer)
      const t = now * 0.00035;
      const beamAlpha = 0.03 + Math.sin(t) * 0.01;
      const beamGrad = ctx.createLinearGradient(0, 0, width * 0.85, height);
      beamGrad.addColorStop(0, `rgba(234, 189, 108, ${beamAlpha})`);
      beamGrad.addColorStop(0.5, `rgba(244, 114, 146, ${beamAlpha * 0.55})`);
      beamGrad.addColorStop(1, 'rgba(18, 14, 12, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(width * 0.1, 0);
      ctx.lineTo(width * 0.48, 0);
      ctx.lineTo(width * 0.9, height);
      ctx.lineTo(width * 0.36, height);
      ctx.closePath();
      ctx.fill();

      for (const p of particles) {
        if (!prefersReduced) {
          p.phase += 0.015 * dt;
          p.x += (p.vx + Math.sin(p.phase) * 0.18) * dt;
          p.y += p.vy * dt;

          if (p.y < -p.r - 20) {
            p.y = height + p.r + 20;
            p.x = Math.random() * width;
          }
          if (p.x < -p.r - 20) p.x = width + p.r;
          if (p.x > width + p.r + 20) p.x = -p.r;
        }

        const parallax = p.kind === 'bokeh' ? 0.45 : 1;
        const drawX = p.x - pointerX * parallax;
        const drawY = p.y - pointerY * parallax;
        const twinkle = prefersReduced ? 1 : 0.72 + Math.sin(p.phase * 1.4) * 0.28;
        const alpha = p.alpha * twinkle;
        const rgb = colorRgb(p.hue);

        if (p.kind === 'bokeh') {
          const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, p.r);
          grad.addColorStop(0, `rgba(${rgb}, ${alpha})`);
          grad.addColorStop(0.55, `rgba(${rgb}, ${alpha * 0.35})`);
          grad.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'heart') {
          ctx.fillStyle = `rgba(${rgb}, ${alpha * 0.8})`;
          drawHeart(drawX, drawY, p.r);
        } else {
          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Deep warm obsidian base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#16100d] via-[#120d0b] to-[#0b0807]" />

      {/* Compositor-only drifting warm champagne & rose aurora glow */}
      <div
        className="animate-aurora-a absolute -top-32 -left-24 w-[68vw] h-[68vw] max-w-[680px] max-h-[680px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(225, 29, 72, 0.2) 0%, rgba(190, 24, 60, 0.06) 45%, transparent 72%)',
        }}
      />
      <div
        className="animate-aurora-b absolute -bottom-24 -right-24 w-[74vw] h-[74vw] max-w-[760px] max-h-[760px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(212, 168, 86, 0.2) 0%, rgba(180, 128, 44, 0.05) 48%, transparent 72%)',
        }}
      />

      {/* Interactive animated particle & bokeh canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
