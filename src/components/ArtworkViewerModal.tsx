import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ArtworkItem } from '../types/museum';

interface ArtworkViewerModalProps {
  artworks: ArtworkItem[];
  currentIndex: number | null;
  onClose: () => void;
  onChangeIndex: (idx: number) => void;
}

export const ArtworkViewerModal: React.FC<ArtworkViewerModalProps> = ({
  artworks,
  currentIndex,
  onClose,
  onChangeIndex,
}) => {
  if (currentIndex === null || !artworks[currentIndex]) return null;
  const item = artworks[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < artworks.length - 1;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/88 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-[#171311] border border-white/15 overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/10">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate">{item.title}</h3>
            {item.caption && <p className="text-xs text-white/60 mt-0.5 truncate">{item.caption}</p>}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-mono-num text-xs text-white/60">
              {currentIndex + 1} / {artworks.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative bg-black flex items-center justify-center max-h-[72dvh] min-h-[260px] pb-[env(safe-area-inset-bottom)]">
          {item.type === 'video' ? (
            <video
              src={item.src}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-[68dvh] w-auto object-contain"
            />
          ) : (
            <img
              src={item.src}
              alt={item.title}
              className="max-h-[68dvh] w-auto object-contain"
            />
          )}

          {hasPrev && (
            <button
              type="button"
              onClick={() => onChangeIndex(currentIndex - 1)}
              aria-label="Oldingi surat"
              className="absolute left-2.5 sm:left-3 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => onChangeIndex(currentIndex + 1)}
              aria-label="Keyingi surat"
              className="absolute right-2.5 sm:right-3 w-11 h-11 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
