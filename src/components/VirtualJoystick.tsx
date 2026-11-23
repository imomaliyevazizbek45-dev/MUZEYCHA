import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onChange: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const updateFromPointer = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxRadius = Math.max(22, rect.width * 0.32);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnob({ x: dx, y: dy });
    onChange(dx / maxRadius, dy / maxRadius);
  };

  const reset = () => {
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Muzeyda yurish joystigi"
      onPointerDown={(e) => {
        e.stopPropagation();
        activePointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        reset();
      }}
      onPointerCancel={() => reset()}
      className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white/18 border border-white/30 flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing shadow-lg"
    >
      <div
        className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/95 shadow-md pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
        }}
      />
    </div>
  );
};
