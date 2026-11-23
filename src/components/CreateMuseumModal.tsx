import React, { useRef, useState } from 'react';
import {
  CalendarHeart,
  Heart,
  ImagePlus,
  Loader2,
  Moon,
  Music,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ArtworkItem, MuseumData, MuseumThemeId, MusicMood } from '../types/museum';
import { createDefaultWeddingConfig, getDemoArtworks } from '../data/demoMuseums';
import { MuzeychaLogo } from './MuzeychaLogo';

interface CreateMuseumModalProps {
  open: boolean;
  initialMuseum: MuseumData;
  initialTheme?: MuseumThemeId;
  onClose: () => void;
  onPublish: (museum: MuseumData) => Promise<void>;
}

const THEME_MAX_SLOTS: Record<MuseumThemeId, number> = {
  'wedding-invite': 12,
  'dark-gallery': 12,
  'romantic-rose': 10,
};

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o‘qib bo‘lmadi'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasmni ochib bo‘lmadi'));
      img.onload = () => {
        const maxDim = 960;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function readVideoFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    } else {
      resolve(URL.createObjectURL(file));
    }
  });
}

export const CreateMuseumModal: React.FC<CreateMuseumModalProps> = ({
  open,
  initialMuseum,
  initialTheme,
  onClose,
  onPublish,
}) => {
  const defaultWedding = initialMuseum.weddingConfig ?? createDefaultWeddingConfig();
  const startingTheme = initialTheme ?? initialMuseum.theme;

  const [title, setTitle] = useState(() => {
    if (startingTheme === 'wedding-invite') {
      return initialMuseum.title && initialMuseum.title !== 'Bizning muzeyimiz'
        ? initialMuseum.title
        : "To'yga Taklifnoma";
    }
    return initialMuseum.title || 'Bizning muzeyimiz';
  });
  const [theme, setTheme] = useState<MuseumThemeId>(startingTheme);
  const [heroText, setHeroText] = useState(initialMuseum.heroText || 'MARRY ME');
  const [music, setMusic] = useState<MusicMood>(initialMuseum.music);
  const [artworks, setArtworks] = useState<ArtworkItem[]>(() =>
    initialMuseum.artworks.slice(0, THEME_MAX_SLOTS[startingTheme])
  );

  // Wedding invitation fields
  const [weddingDate, setWeddingDate] = useState(defaultWedding.weddingDate);
  const [mannequin, setMannequin] = useState<'groom' | 'bride'>(() =>
    initialMuseum.avatarGender === 'girl' || defaultWedding.mannequin === 'bride'
      ? 'bride'
      : 'groom'
  );
  const [venueName, setVenueName] = useState(defaultWedding.venueName);
  const [venueAddress, setVenueAddress] = useState(defaultWedding.venueAddress);
  const [cardNumber, setCardNumber] = useState(defaultWedding.cardNumber);

  const [saving, setSaving] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const maxSlots = THEME_MAX_SLOTS[theme];
  const userArtworks = artworks.filter((item) => !item.id.startsWith('mem-'));
  const hasOnlyDemo = artworks.length > 0 && userArtworks.length === 0;
  const remainingSlots = Math.max(0, maxSlots - userArtworks.length);
  const isFull = userArtworks.length >= maxSlots;
  const isOverLimit = userArtworks.length > maxSlots;

  const handleSelectTheme = (nextTheme: MuseumThemeId) => {
    setTheme(nextTheme);
    const nextMax = THEME_MAX_SLOTS[nextTheme];
    if (hasOnlyDemo && artworks.length > nextMax) {
      setArtworks((prev) => prev.slice(0, nextMax));
    }
    if (nextTheme === 'wedding-invite' && title === 'Bizning muzeyimiz') {
      setTitle("To'yga Taklifnoma");
    } else if (nextTheme !== 'wedding-invite' && title === "To'yga Taklifnoma") {
      setTitle('Bizning muzeyimiz');
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Automatically remove built-in demo artworks (mem-*) when the user picks their own files
    const currentUserCount = artworks.filter((item) => !item.id.startsWith('mem-')).length;
    const availableSlots = Math.max(0, maxSlots - currentUserCount);

    if (availableSlots <= 0) {
      setErrorMsg(`Joy qolmadi! Bu zalga ko‘pi bilan ${maxSlots} ta rasm yoki video qo‘yish mumkin.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const mediaFiles = Array.from(files).filter(
      (f) => f.type.startsWith('video/') || f.type.startsWith('image/')
    );
    const overflowCount = Math.max(0, mediaFiles.length - availableSlots);
    const acceptedFiles = mediaFiles.slice(0, availableSlots);

    setUploadingFiles(true);
    setErrorMsg(null);
    try {
      const nextItems: ArtworkItem[] = [];
      for (const file of acceptedFiles) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 32);
        if (file.type.startsWith('video/')) {
          const src = await readVideoFileAsDataUrl(file);
          nextItems.push({
            id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: cleanName || 'Video xotira',
            type: 'video',
            src,
          });
        } else if (file.type.startsWith('image/')) {
          const src = await compressImageFile(file);
          nextItems.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: cleanName || 'Shirin xotira',
            type: 'image',
            src,
          });
        }
      }
      if (nextItems.length > 0) {
        setArtworks((prev) => [...prev.filter((item) => !item.id.startsWith('mem-')), ...nextItems]);
      }
      if (overflowCount > 0) {
        setErrorMsg(
          `Joy qolmadi! Faqat ${nextItems.length} ta fayl qo‘shildi, qolgan ${overflowCount} ta rasmga zalda joy qolmadi (maksimal ${maxSlots} ta).`
        );
      }
    } catch {
      setErrorMsg('Ayrim fayllarni yuklashda xatolik yuz berdi.');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (artworks.length === 0) {
      setErrorMsg('Kamida 1 ta surat yoki video tanlang.');
      return;
    }
    if (artworks.length > maxSlots) {
      setErrorMsg(
        `Joy qolmadi! Bu zalga ko‘pi bilan ${maxSlots} ta rasm yoki video sig‘adi (ortiqchasini o‘chiring).`
      );
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload: MuseumData = {
        id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: title.trim() || (theme === 'wedding-invite' ? "To'yga Taklifnoma" : 'Bizning muzeyimiz'),
        theme,
        heroText: heroText.trim() || 'MARRY ME',
        music,
        avatarGender: mannequin === 'bride' ? 'girl' : 'boy',
        artworks,
        weddingConfig:
          theme === 'wedding-invite'
            ? {
                ...defaultWedding,
                weddingDate,
                mannequin,
                venueName: venueName.trim() || defaultWedding.venueName,
                venueAddress: venueAddress.trim() || defaultWedding.venueAddress,
                cardNumber: cardNumber.trim() || defaultWedding.cardNumber,
              }
            : undefined,
        createdAt: Date.now(),
      };
      await onPublish(payload);
    } catch {
      setErrorMsg('Muzeyni saqlashda muammo yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/82 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-[#161210] border border-white/15 shadow-2xl text-white overflow-hidden sm:my-auto max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-7 pt-4 sm:pt-5 pb-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#1c1613]">
          <div className="flex items-center gap-3">
            <MuzeychaLogo size="md" showWordmark={false} />
            <div>
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
                Muzeycha<span className="text-amber-300">.uz</span>
              </h2>
              <p className="text-xs sm:text-sm text-white/65">
                3D Muzey yoki Onlayn To‘y Taklifnomasi yarating
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5 overflow-y-auto muzey-scroll">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm">
            <span className="text-white/85">
              Allaqachon <strong className="text-amber-300 font-mono-num">39 056</strong> kishi Muzeychadan foydalanmoqda
            </span>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
          </div>

          {/* Museum / Invite Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/90">
              Sarlavha / Zal nomi
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: To'yga Taklifnoma"
              maxLength={48}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-rose-400 outline-none text-sm text-white"
            />
          </div>

          {/* Theme Picker (3 Spaces) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">
              3D Zal uslubi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectTheme('wedding-invite')}
                className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  theme === 'wedding-invite'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/10'
                }`}
              >
                <CalendarHeart className="w-5 h-5 text-amber-300" />
                <div className="text-sm font-semibold">To‘yga Taklifnoma</div>
                <div className="text-xs text-white/60">
                  Kalendar, Manzil, Tilaklar va Bankomat
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('dark-gallery')}
                className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  theme === 'dark-gallery'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/10'
                }`}
              >
                <Moon className="w-5 h-5 text-amber-200" />
                <div className="text-sm font-semibold">Tungi Galereya</div>
                <div className="text-xs text-white/60">
                  Qorong‘i zal, projektor nurlari
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('romantic-rose')}
                className={`flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  theme === 'romantic-rose'
                    ? 'bg-rose-500/15 border-rose-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/75 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-5 h-5 text-rose-300" />
                <div className="text-sm font-semibold">Sevgi Yo‘lagi</div>
                <div className="text-xs text-white/60">
                  Qizil gilam, shamlar, atirgul arka
                </div>
              </button>
            </div>
          </div>

          {theme === 'wedding-invite' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/80">To‘y sanasi</label>
                <input
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/80">
                  3D qahramon va maniken
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMannequin('groom')}
                    className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                      mannequin === 'groom'
                        ? 'bg-white text-[#161210] border-white'
                        : 'bg-black/30 text-white/80 border-white/12'
                    }`}
                  >
                    Kuyov libosi
                  </button>
                  <button
                    type="button"
                    onClick={() => setMannequin('bride')}
                    className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                      mannequin === 'bride'
                        ? 'bg-white text-[#161210] border-white'
                        : 'bg-black/30 text-white/80 border-white/12'
                    }`}
                  >
                    Kelin libosi
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/80">To‘yxona nomi</label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/80">Manzil</label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-medium text-white/80">
                  To‘yona uchun karta raqami
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="5614 6887 1922 5830"
                  maxLength={24}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white font-mono-num outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {theme === 'romantic-rose' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/90">
                Atirgul arkasidagi yozuv
              </label>
              <input
                type="text"
                value={heroText}
                onChange={(e) => setHeroText(e.target.value)}
                placeholder="MARRY ME"
                maxLength={28}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-rose-400 outline-none text-sm text-white"
              />
            </div>
          )}

          {/* Music Mood */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-white/90">
              <Music className="w-4 h-4 text-amber-300" />
              <span>Fon musiqasi</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['romantic-piano', 'Fortepiano'],
                  ['warm-strings', 'Mayin torlar'],
                  ['music-box', 'Musiqa quti'],
                  ['silent', 'Ovozsiz'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMusic(val)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    music === val
                      ? 'bg-white text-[#161210] border-white'
                      : 'bg-white/5 text-white/80 border-white/12 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo & Video Upload Zone + Side-by-Side Groom/Bride Figure */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-white/90">
                  Surat va videolar
                </label>
                <span
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold font-mono-num border ${
                    isOverLimit || isFull
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/40'
                      : 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                  }`}
                >
                  {userArtworks.length} / {maxSlots} ta
                </span>
                <span
                  className={`text-xs font-medium ${
                    isOverLimit || isFull ? 'text-rose-300' : 'text-white/60'
                  }`}
                >
                  {isOverLimit
                    ? `Joy qolmadi (${userArtworks.length - maxSlots} ta ortiqcha)`
                    : isFull
                    ? 'Joy qolmadi'
                    : hasOnlyDemo
                    ? `${artworks.length} ta namuna · ${maxSlots} tagacha rasm qo‘yish mumkin`
                    : `Yana ${remainingSlots} ta joy bor`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {artworks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setArtworks([]);
                      setErrorMsg(null);
                    }}
                    className="text-white/55 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Hammasini tozalash
                  </button>
                )}
                {artworks.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setArtworks(getDemoArtworks().slice(0, maxSlots));
                      setErrorMsg(null);
                    }}
                    className="text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    Namuna suratlarni tiklash
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => void handleFilesSelected(e.target.files)}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
              <div
                onClick={() => {
                  if (isFull || isOverLimit) {
                    setErrorMsg(
                      `Joy qolmadi! Bu zalga ko‘pi bilan ${maxSlots} ta rasm yoki video qo‘yish mumkin.`
                    );
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleFilesSelected(e.dataTransfer.files);
                }}
                className={`sm:col-span-8 border-2 border-dashed rounded-2xl p-5 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isFull || isOverLimit
                    ? 'border-rose-400/55 bg-rose-950/20 hover:bg-rose-950/30'
                    : 'border-white/20 hover:border-rose-400/70 bg-white/5 hover:bg-white/8'
                }`}
              >
                {uploadingFiles ? (
                  <Loader2 className="w-7 h-7 text-rose-400 animate-spin" />
                ) : (
                  <ImagePlus
                    className={`w-7 h-7 ${
                      isFull || isOverLimit ? 'text-rose-400' : 'text-rose-300'
                    }`}
                  />
                )}
                <div className="text-sm font-medium text-white">
                  {uploadingFiles
                    ? 'Suratlar tayyorlanmoqda...'
                    : isFull || isOverLimit
                    ? `Joy qolmadi (${userArtworks.length} / ${maxSlots} ta to‘ldi)`
                    : 'Galereyadan surat yoki video tanlang'}
                </div>
                <p className="text-xs text-white/60">
                  {isFull || isOverLimit
                    ? 'Yangi rasm qo‘shish uchun pastdagi rasmlardan birini o‘chiring'
                    : hasOnlyDemo
                    ? `1–${maxSlots} ta rasm/video tanlang — galereyadagi namunalar avtomatik o‘chadi`
                    : `Bu zalga 1 tadan ${maxSlots} tagacha rasm/video qo‘yish kerak (${remainingSlots} ta joy qoldi)`}
                </p>
              </div>

              {/* Groom / Bride Standing Companion beside Upload Zone */}
              <div className="sm:col-span-4 rounded-2xl bg-gradient-to-b from-[#231b17] to-[#17120f] border border-amber-400/25 p-3 flex flex-col items-center justify-between gap-2">
                <div className="flex items-center gap-1 w-full bg-black/35 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMannequin('groom')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      mannequin === 'groom'
                        ? 'bg-amber-400 text-[#161210]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Kuyov
                  </button>
                  <button
                    type="button"
                    onClick={() => setMannequin('bride')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      mannequin === 'bride'
                        ? 'bg-rose-400 text-[#161210]'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Kelin
                  </button>
                </div>

                {mannequin === 'groom' ? (
                  <svg viewBox="0 0 80 110" className="w-16 h-20 drop-shadow" aria-hidden="true">
                    <ellipse cx="40" cy="104" rx="22" ry="4" fill="rgba(212,175,55,0.28)" />
                    <path d="M29 66 L27 101 L36 101 L39 74 L41 74 L44 101 L53 101 L51 66 Z" fill="#181b22" />
                    <path d="M22 38 C22 33 28 30 40 30 C52 30 58 33 58 38 L54 68 L26 68 Z" fill="#1d2028" />
                    <polygon points="34,31 46,31 40,52" fill="#fbf7f0" />
                    <polygon points="35,34 40,36 35,38" fill="#111" />
                    <polygon points="45,34 40,36 45,38" fill="#111" />
                    <circle cx="40" cy="20" r="8.5" fill="#ecc4aa" />
                    <path d="M31.5 18 C32 10 48 10 48.5 18 C46 14 34 14 31.5 18 Z" fill="#1f1814" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 80 110" className="w-16 h-20 drop-shadow" aria-hidden="true">
                    <ellipse cx="40" cy="104" rx="26" ry="4" fill="rgba(244,114,182,0.25)" />
                    <path d="M32 52 L16 101 L64 101 L48 52 Z" fill="#fffaf5" />
                    <path d="M31 32 C31 29 49 29 49 32 L47 52 L33 52 Z" fill="#f7efe7" />
                    <rect x="33" y="50" width="14" height="3" rx="1.5" fill="#d4af37" />
                    <circle cx="40" cy="60" r="5" fill="#f48fb1" />
                    <circle cx="36" cy="58" r="3.5" fill="#fff0f5" />
                    <circle cx="44" cy="58" r="3.5" fill="#fff0f5" />
                    <circle cx="40" cy="20" r="8" fill="#ecc4aa" />
                    <path d="M32 19 C32 11 48 11 48 19 C45 14 35 14 32 19 Z" fill="#231915" />
                    <path d="M34 12 Q40 8 46 12" stroke="#d4af37" strokeWidth="2" fill="none" />
                  </svg>
                )}

                <span className="text-[11px] text-amber-200/85 text-center leading-tight">
                  {mannequin === 'groom'
                    ? '3D qahramon: O‘g‘il bola (Kuyov)'
                    : '3D qahramon: Qiz bola (Kelin)'}
                </span>
              </div>
            </div>

            {(isFull || isOverLimit || (errorMsg && errorMsg.startsWith('Joy qolmadi'))) && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 font-medium">
                {errorMsg && errorMsg.startsWith('Joy qolmadi')
                  ? errorMsg
                  : isOverLimit
                  ? `Joy qolmadi! Bu zalga ko‘pi bilan ${maxSlots} ta rasm/video sig‘adi — ${artworks.length - maxSlots} tasini o‘chiring.`
                  : `Joy qolmadi! Maksimal ${maxSlots} ta rasm/video joylandi.`}
              </div>
            )}

            {artworks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {artworks.map((art, idx) => (
                  <div
                    key={art.id}
                    className={`group relative rounded-xl overflow-hidden bg-black/40 border ${
                      idx === 0 ? 'border-amber-400/70' : 'border-white/12'
                    }`}
                  >
                    {art.type === 'video' ? (
                      <video
                        src={art.src}
                        muted
                        playsInline
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <img
                        src={art.src}
                        alt={art.title}
                        className="w-full h-24 object-cover"
                      />
                    )}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-amber-400 text-[#161210] text-[10px] font-bold">
                        Katta portret
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setArtworks((prev) => {
                            const picked = prev[idx];
                            if (!picked) return prev;
                            return [picked, ...prev.filter((_, i) => i !== idx)];
                          })
                        }
                        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 hover:bg-amber-400 hover:text-[#161210] text-white text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Portret qilish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setArtworks((prev) => prev.filter((item) => item.id !== art.id))
                      }
                      aria-label="O‘chirish"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={art.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setArtworks((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, title: val } : p))
                        );
                      }}
                      className="w-full px-2 py-1.5 bg-[#14100e] text-[11px] text-white/90 outline-none border-t border-white/10"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/35 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-white cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving || uploadingFiles}
              className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{saving ? 'Yaratilmoqda...' : '3D Zalni Yaratish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
