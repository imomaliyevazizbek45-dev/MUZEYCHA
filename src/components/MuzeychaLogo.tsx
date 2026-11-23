import React, { useId } from 'react';

interface MuzeychaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const MuzeychaLogo: React.FC<MuzeychaLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `muz-bg-${uid}`;
  const goldId = `muz-gold-${uid}`;
  const roseId = `muz-rose-${uid}`;

  const boxSize =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl';

  const textClass =
    size === 'sm'
      ? 'text-base font-bold'
      : size === 'lg'
      ? 'text-xl sm:text-2xl font-bold'
      : 'text-lg sm:text-xl font-bold';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 whitespace-nowrap shrink-0 ${className}`}>
      <div
        className={`${boxSize} relative flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-black/40 border border-amber-300/35 bg-[#1b1411]`}
      >
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id={bgId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#261b17" />
              <stop offset="100%" stopColor="#120d0b" />
            </linearGradient>
            <linearGradient id={goldId} x1="14" y1="10" x2="50" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fae3a7" />
              <stop offset="50%" stopColor="#e0b25c" />
              <stop offset="100%" stopColor="#b57d26" />
            </linearGradient>
            <linearGradient id={roseId} x1="22" y1="24" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          <rect width="64" height="64" fill={`url(#${bgId})`} />

          {/* Classical Museum Arch */}
          <path
            d="M15.5 50.5V29C15.5 19.3 22.9 11.5 32 11.5C41.1 11.5 48.5 19.3 48.5 29V50.5"
            stroke={`url(#${goldId})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M21 50.5V30C21 23.2 25.9 17.8 32 17.8C38.1 17.8 43 23.2 43 30V50.5"
            stroke={`url(#${goldId})`}
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Pedestal baseline */}
          <line
            x1="12"
            y1="50.5"
            x2="52"
            y2="50.5"
            stroke={`url(#${goldId})`}
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Heart Emblem inside Museum Arch */}
          <path
            d="M32 41.8C32 41.8 23.2 35.9 23.2 30.2C23.2 27 25.7 24.6 28.7 24.6C30.4 24.6 31.6 25.5 32 26.7C32.4 25.5 33.6 24.6 35.3 24.6C38.3 24.6 40.8 27 40.8 30.2C40.8 35.9 32 41.8 32 41.8Z"
            fill={`url(#${roseId})`}
          />
        </svg>
      </div>

      {showWordmark && (
        <span className={`${textClass} tracking-tight text-white leading-none`}>
          Muzeycha<span className="text-amber-300">.uz</span>
        </span>
      )}
    </div>
  );
};
