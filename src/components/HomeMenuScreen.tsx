import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarHeart,
  Heart,
  ImageIcon,
  Plus,
  Star,
} from 'lucide-react';
import type { MuseumThemeId } from '../types/museum';
import { AmbientMenuBackdrop } from './AmbientMenuBackdrop';
import { MuzeychaLogo } from './MuzeychaLogo';

interface HomeMenuScreenProps {
  onSelectSpace: (theme: MuseumThemeId) => void;
  onOpenCreate: (theme?: MuseumThemeId) => void;
}

const SpacePreviewImage: React.FC<{ src: string; alt: string; accentClass: string }> = ({
  src,
  alt,
  accentClass,
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/10 bg-[#140f0d]">
      {!failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-2 ${accentClass}`}
        >
          <ImageIcon className="w-7 h-7 opacity-60" />
          <span className="text-xs opacity-70">{alt}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#191311] via-[#191311]/15 to-transparent" />
    </div>
  );
};

export const HomeMenuScreen: React.FC<HomeMenuScreenProps> = ({
  onSelectSpace,
  onOpenCreate,
}) => {
  const scrollToSpaces = () => {
    document.getElementById('zallar-bolimi')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-30 h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#120e0c] text-white muzey-scroll">
      <AmbientMenuBackdrop />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-[max(0.85rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] min-h-full flex flex-col justify-between">
        {/* Top Bar — 3-zone balanced contract */}
        <header className="flex items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-white/10">
          <MuzeychaLogo size="md" />

          <nav
            aria-label="Asosiy bo‘limlar"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-white/70 whitespace-nowrap"
          >
            <button
              type="button"
              onClick={scrollToSpaces}
              className="hover:text-white transition-colors cursor-pointer"
            >
              3D Zallar
            </button>
            <button
              type="button"
              onClick={() => onOpenCreate('wedding-invite')}
              className="hover:text-amber-200 transition-colors cursor-pointer"
            >
              To‘y Taklifnomasi
            </button>
            <button
              type="button"
              onClick={() => onOpenCreate()}
              className="hover:text-rose-300 transition-colors cursor-pointer"
            >
              Shaxsiy muzey
            </button>
          </nav>

          <button
            type="button"
            onClick={() => onOpenCreate()}
            className="min-h-[44px] flex items-center gap-2 px-3.5 sm:px-4.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-rose-950/50"
          >
            <Heart className="w-4 h-4 fill-white text-white shrink-0" />
            <span className="sm:hidden">Yaratish</span>
            <span className="hidden sm:inline">O‘zingiz ham yarating</span>
          </button>
        </header>

        {/* Main Hero + Space Cards */}
        <main className="py-6 sm:py-10 space-y-8 sm:space-y-11">
          <section className="max-w-3xl space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-sm text-amber-200/80 font-medium tracking-wide">
              <span>3D Virtual Galereya</span>
              <span aria-hidden="true" className="text-white/35">·</span>
              <span>Onlayn To‘y Taklifnomasi</span>
              <span aria-hidden="true" className="text-white/35">·</span>
              <span>Yurakcha QR</span>
            </div>

            <h1 className="font-serif-display text-[2rem] sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
              Xotiralaringiz va taklifnomangizni{' '}
              <span className="text-rose-300 italic font-medium">3D olamga</span> aylantiring
            </h1>

            <p className="text-sm sm:text-base text-white/72 max-w-2xl leading-relaxed">
              Tayyor 3D zallardan birini tanlab telefon yoki kompyuterdan sayr qiling, yoki
              o‘zingizning surat va to‘y ma’lumotlaringizdan shaxsiy 3D zal yarating.
            </p>

            {/* Primary & Secondary Action Buttons (mobile-first >=48px tall) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenCreate('wedding-invite')}
                className="min-h-[48px] flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#edd088] to-[#dfb35b] hover:from-[#f3da9b] hover:to-[#e6bd6b] active:scale-[0.98] text-[#1f150e] text-sm sm:text-base font-bold transition-all shadow-lg shadow-amber-950/40 cursor-pointer"
              >
                <CalendarHeart className="w-4 h-4 shrink-0" />
                <span>To‘yga Taklifnomani ochish</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onOpenCreate()}
                className="min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/16 active:scale-[0.98] border border-white/18 text-white text-sm sm:text-base font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0 text-rose-300" />
                <span>O‘z muzeyingizni yaratish</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1 text-xs sm:text-sm text-white/75">
              <span>
                <strong className="text-amber-300 font-mono-num">39 056+</strong> foydalanuvchi
              </span>
              <span aria-hidden="true" className="text-white/25">·</span>
              <div className="flex items-center gap-1 text-amber-400" aria-label="5 yulduz">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span className="text-white/55 text-xs">Telefon va kompyuterda moslashgan</span>
            </div>
          </section>

          {/* 3 Experience Destination Cards with Architectural 3D Previews */}
          <section id="zallar-bolimi" className="space-y-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xs sm:text-sm uppercase tracking-[0.14em] text-white/55 font-semibold">
                Tayyor 3D zallar
              </h2>
              <span className="text-xs text-white/45 font-mono-num">01 — 03</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* 1. To'yga Taklifnoma */}
              <button
                type="button"
                onClick={() => onSelectSpace('wedding-invite')}
                className="group text-left rounded-2xl bg-[#191311]/92 hover:bg-[#221a17] border border-white/12 hover:border-amber-300/50 overflow-hidden flex flex-col justify-between transition-all cursor-pointer shadow-xl"
              >
                <SpacePreviewImage
                  src="/src/assets/images/wedding_hall_preview_1795421259372.jpg"
                  alt="To‘yga Taklifnoma — ikki zalli klassik oq saroy"
                  accentClass="bg-gradient-to-br from-amber-950/60 to-[#191311] text-amber-200"
                />

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-amber-300/85 font-semibold mb-1.5">
                      Ikki zalli oq saroy
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      To‘yga Taklifnoma
                    </h3>
                    <p className="text-xs sm:text-sm text-white/68 leading-relaxed">
                      Fotosessiya suratlari, to‘y sanasi kalendari, manzil xaritasi, tilaklar va to‘yona bankomati.
                    </p>
                  </div>

                  <div className="min-h-[44px] pt-3 border-t border-white/10 flex items-center justify-between text-sm font-semibold text-amber-200">
                    <span>Taklifnomaga kirish</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>

              {/* 2. Bizning muzeyimiz */}
              <button
                type="button"
                onClick={() => onSelectSpace('dark-gallery')}
                className="group text-left rounded-2xl bg-[#191311]/92 hover:bg-[#221a17] border border-white/12 hover:border-white/35 overflow-hidden flex flex-col justify-between transition-all cursor-pointer shadow-xl"
              >
                <SpacePreviewImage
                  src="/src/assets/images/dark_gallery_preview_1795421262256.jpg"
                  alt="Bizning muzeyimiz — klassik tungi galereya"
                  accentClass="bg-gradient-to-br from-stone-900 to-[#14100e] text-white"
                />

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-white/60 font-semibold mb-1.5">
                      Klassik tungi galereya
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Bizning muzeyimiz
                    </h3>
                    <p className="text-xs sm:text-sm text-white/68 leading-relaxed">
                      Iliq projektor nurlari ostidagi xotira ramkalari, musiqiy hamrohlik va zal bo‘ylab sayr.
                    </p>
                  </div>

                  <div className="min-h-[44px] pt-3 border-t border-white/10 flex items-center justify-between text-sm font-semibold text-white">
                    <span>Muzeyga kirish</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>

              {/* 3. Sevgi Yo'lagi */}
              <button
                type="button"
                onClick={() => onSelectSpace('romantic-rose')}
                className="group text-left rounded-2xl bg-[#191311]/92 hover:bg-[#221a17] border border-white/12 hover:border-rose-400/50 overflow-hidden flex flex-col justify-between transition-all cursor-pointer shadow-xl"
              >
                <SpacePreviewImage
                  src="/src/assets/images/romantic_rose_preview_1795421260834.jpg"
                  alt="Sevgi Yo‘lagi — qizil gilam va atirgul arkasi"
                  accentClass="bg-gradient-to-br from-rose-950/60 to-[#191311] text-rose-200"
                />

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-rose-300/85 font-semibold mb-1.5">
                      Romantik sayr
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      Sevgi Yo‘lagi (MARRY ME)
                    </h3>
                    <p className="text-xs sm:text-sm text-white/68 leading-relaxed">
                      Qizil gilam, sochilgan atirgul barglari, shisha shamlar va zal oxirida MARRY ME atirgul arkasi.
                    </p>
                  </div>

                  <div className="min-h-[44px] pt-3 border-t border-white/10 flex items-center justify-between text-sm font-semibold text-rose-300">
                    <span>Zalga kirish</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            </div>
          </section>
        </main>

        {/* Quiet Footer */}
        <footer className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/50">
          <div className="flex items-center gap-2.5">
            <MuzeychaLogo size="sm" showWordmark={false} />
            <span>Muzeycha.uz · Shaxsiy 3D muzey va onlayn taklifnomalar</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreate()}
            className="min-h-[44px] flex items-center text-white/80 hover:text-white underline underline-offset-4 cursor-pointer"
          >
            Yangi 3D muzey yaratish
          </button>
        </footer>
      </div>
    </div>
  );
};
