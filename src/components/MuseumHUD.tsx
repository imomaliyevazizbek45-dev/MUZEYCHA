import React, { useEffect, useState } from 'react';
import {
  CalendarHeart,
  ChevronDown,
  Eye,
  Heart,
  Home,
  Images,
  MapPin,
  MessageSquareHeart,
  Moon,
  Pause,
  Play,
  QrCode,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import type {
  MuseumData,
  MuseumRuntimeStats,
  MuseumThemeId,
  WeddingStationType,
} from '../types/museum';
import { VirtualJoystick } from './VirtualJoystick';
import { MuzeychaLogo } from './MuzeychaLogo';

interface MuseumHUDProps {
  museum: MuseumData;
  stats: MuseumRuntimeStats;
  muted: boolean;
  onToggleMute: () => void;
  onToggleAutoTour: () => void;
  onJoystickChange: (x: number, y: number) => void;
  onOpenCreate: () => void;
  onOpenShareQR: () => void;
  onOpenMenu: () => void;
  onSwitchTheme: (theme: MuseumThemeId) => void;
  onSwitchAvatarGender: (gender: 'boy' | 'girl') => void;
  onJumpToArtwork: (index: number) => void;
  onOpenStation: (station: WeddingStationType) => void;
}

export const MuseumHUD: React.FC<MuseumHUDProps> = ({
  museum,
  stats,
  muted,
  onToggleMute,
  onToggleAutoTour,
  onJoystickChange,
  onOpenCreate,
  onOpenShareQR,
  onOpenMenu,
  onSwitchTheme,
  onSwitchAvatarGender,
  onJumpToArtwork,
  onOpenStation,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stripOpen, setStripOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const isWedding = museum.theme === 'wedding-invite';
  const currentGender: 'boy' | 'girl' =
    museum.avatarGender === 'girl' || museum.weddingConfig?.mannequin === 'bride'
      ? 'girl'
      : 'boy';

  useEffect(() => {
    setShowHint(true);
    const timer = window.setTimeout(() => setShowHint(false), 6500);
    return () => clearTimeout(timer);
  }, [museum.id, museum.theme]);

  const stationCtaLabel =
    stats.nearbyStation === 'location'
      ? "Manzilni ko‘rish"
      : stats.nearbyStation === 'wishes'
      ? 'Tilak qoldirish'
      : stats.nearbyStation === 'toyona'
      ? "To‘yona yuborish"
      : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-left: Museum Title + Space Switcher + Main Menu */}
        <div className="relative pointer-events-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            title="Bosh menyu"
            aria-label="Bosh menyu"
            className="w-11 h-11 rounded-2xl bg-[#1a1512]/82 hover:bg-[#1a1512]/95 text-white border border-white/15 shadow-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <MuzeychaLogo size="sm" showWordmark={false} />
          </button>

          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setStripOpen(false);
            }}
            className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#1a1512]/82 hover:bg-[#1a1512]/95 text-white border border-white/15 shadow-lg transition-colors text-xs sm:text-base font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="max-w-[116px] sm:max-w-[260px] truncate">{museum.title}</span>
            <ChevronDown
              className={`w-4 h-4 text-white/70 transition-transform shrink-0 ${
                menuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-13 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl bg-[#161210]/96 border border-white/15 p-3 shadow-2xl text-white z-20">
              <div className="px-2 pb-2.5 mb-2 border-b border-white/10 flex items-center justify-between gap-2">
                <MuzeychaLogo size="sm" />
                <p className="text-[11px] text-white/50">Zalni tanlang</p>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTheme('wedding-invite');
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                    museum.theme === 'wedding-invite'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/35'
                      : 'hover:bg-white/10 text-white/85'
                  }`}
                >
                  <CalendarHeart className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-medium leading-tight">To‘yga Taklifnoma</div>
                    <div className="text-xs text-white/55">Kalendar · Manzil · Tilaklar · Bankomat</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTheme('dark-gallery');
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                    museum.theme === 'dark-gallery'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/35'
                      : 'hover:bg-white/10 text-white/85'
                  }`}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-medium leading-tight">Tungi Galereya</div>
                    <div className="text-xs text-white/55">Klassik qorong‘i zal · Projektorlar</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchTheme('romantic-rose');
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                    museum.theme === 'romantic-rose'
                      ? 'bg-rose-500/20 text-rose-200 border border-rose-400/35'
                      : 'hover:bg-white/10 text-white/85'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-medium leading-tight">Sevgi Yo‘lagi (Marry Me)</div>
                    <div className="text-xs text-white/55">Qizil gilam · Shamlar · Atirgul arka</div>
                  </div>
                </button>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-white/10">
                <p className="px-1 pb-1.5 text-[11px] text-white/55">3D qahramon</p>
                <div className="grid grid-cols-2 gap-1.5 bg-black/35 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchAvatarGender('boy');
                      setMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentGender === 'boy'
                        ? 'bg-amber-400 text-[#161210]'
                        : 'text-white/75 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    O‘g‘il bola
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchAvatarGender('girl');
                      setMenuOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentGender === 'girl'
                        ? 'bg-rose-400 text-[#161210]'
                        : 'text-white/75 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Qiz bola
                  </button>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenShareQR();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-rose-300" />
                  <span>Havola va Yurakcha QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setStripOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-white/10 text-white/85 transition-colors cursor-pointer"
                >
                  <Images className="w-4 h-4 text-amber-300" />
                  <span>Barcha suratlar ({museum.artworks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenMenu();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-white/10 text-white/85 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4 text-white/75" />
                  <span>Bosh menyuga qaytish</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-right: QR button + "Yaratish" / "O'zingiz ham yarating" */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={onOpenShareQR}
            title="Havola va Yurakcha QR"
            aria-label="Havola va Yurakcha QR"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1a1512]/82 hover:bg-[#1a1512]/95 text-white border border-white/15 shadow-lg transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-rose-300" />
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-[#1a1512]/82 hover:bg-[#1a1512]/95 text-white border border-white/15 shadow-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white text-white shrink-0" />
            <span className="sm:hidden">Yaratish</span>
            <span className="hidden sm:inline">
              {isWedding ? 'O‘zingiz ham yarating' : 'Yaratish'}
            </span>
          </button>
        </div>
      </div>

      {/* Center-Bottom Prompts + Controls */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Wedding Interactive Station Action Button (matches Video 2 golden pill!) */}
        {stationCtaLabel && stats.nearbyStation && (
          <button
            type="button"
            onClick={() => onOpenStation(stats.nearbyStation!)}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#e9c87b] hover:bg-[#f2d692] text-[#2c1e14] font-semibold text-sm shadow-xl border border-amber-200/60 transition-transform active:scale-95 cursor-pointer"
          >
            {stats.nearbyStation === 'location' && <MapPin className="w-4 h-4" />}
            {stats.nearbyStation === 'wishes' && <MessageSquareHeart className="w-4 h-4" />}
            {stats.nearbyStation === 'toyona' && <Wallet className="w-4 h-4" />}
            <span>{stationCtaLabel}</span>
          </button>
        )}

        {/* Helpful walk hint on entry (auto-fades) */}
        {!stationCtaLabel && showHint && !stripOpen && (
          <div className="px-4 py-2 rounded-2xl bg-black/62 border border-white/12 text-[11px] sm:text-xs text-white/90 text-center max-w-xs sm:max-w-sm">
            O‘ngdagi doira bilan yuring · ekranni surib aylantiring
          </div>
        )}

        {/* Nearby artwork caption */}
        {!stationCtaLabel && !showHint && stats.nearbyArtwork && !stripOpen && (
          <button
            type="button"
            onClick={() => {
              if (stats.activeArtworkIndex !== null) {
                onJumpToArtwork(stats.activeArtworkIndex);
              }
            }}
            className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-black/55 border border-white/12 text-xs sm:text-sm text-white/90 max-w-xs truncate transition-opacity cursor-pointer"
          >
            {stats.nearbyArtwork.title}
          </button>
        )}

        {/* Quick-jump artwork thumbnail strip */}
        {stripOpen && (
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#14100e]/92 border border-white/15 p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-medium text-white/75">
                Galereyadagi xotiralar · {museum.artworks.length} ta
              </span>
              <button
                type="button"
                onClick={() => setStripOpen(false)}
                className="text-xs text-white/60 hover:text-white cursor-pointer"
              >
                Yopish
              </button>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 muzey-scroll">
              {museum.artworks.map((art, idx) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => {
                    onJumpToArtwork(idx);
                    setStripOpen(false);
                  }}
                  className={`group shrink-0 flex flex-col items-center gap-1 rounded-xl p-1 border transition-colors cursor-pointer ${
                    stats.activeArtworkIndex === idx
                      ? 'border-amber-400 bg-amber-500/15'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  {art.type === 'video' ? (
                    <video
                      src={art.src}
                      muted
                      playsInline
                      className="w-14 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={art.src}
                      alt={art.title}
                      className="w-14 h-16 object-cover rounded-lg"
                    />
                  )}
                  <span className="text-[11px] text-white/80 max-w-[60px] truncate">
                    {idx + 1}. {art.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom HUD Row */}
        <div className="w-full flex items-end justify-between gap-2">
          {/* Bottom-left: Audio + Eye Counter */}
          <div className="flex flex-col items-start gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Musiqani yoqish' : 'Musiqani o‘chirish'}
              className="w-11 h-11 rounded-full bg-[#1a1512]/82 hover:bg-[#1a1512]/95 border border-white/15 flex items-center justify-center text-white shadow-lg transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-5 h-5 text-white/85" />
              ) : (
                <Volume2 className="w-5 h-5 text-amber-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setStripOpen((v) => !v)}
              title="Suratlar ro‘yxati"
              className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-[#1a1512]/82 hover:bg-[#1a1512]/95 border border-white/15 text-white text-xs sm:text-sm font-medium shadow-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-4 h-4 text-white/80 shrink-0" />
              <span className="font-mono-num">
                {stats.viewedCount} / {stats.totalCount}
                <span className="hidden sm:inline">{isWedding ? ' ko‘rildi' : ''}</span>
              </span>
            </button>
          </div>

          {/* Bottom-center: Sayohat / To'xtatish */}
          <div className="pointer-events-auto mb-0.5 sm:mb-1">
            <button
              type="button"
              onClick={onToggleAutoTour}
              className="min-h-[44px] flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-2xl bg-[#1a1512]/84 hover:bg-[#1a1512]/95 border border-white/15 text-white text-xs sm:text-base font-medium shadow-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {stats.isAutoTour ? (
                <>
                  <Pause className="w-4 h-4 fill-white text-white shrink-0" />
                  <span>To‘xtatish</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white shrink-0" />
                  <span>{isWedding ? 'Sayohat' : 'Davom etish'}</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom-right: Virtual Joystick */}
          <div className="pointer-events-auto shrink-0">
            <VirtualJoystick onChange={onJoystickChange} />
          </div>
        </div>
      </div>
    </div>
  );
};
