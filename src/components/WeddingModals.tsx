import React, { useEffect, useState } from 'react';
import { Check, Copy, MapPin, MessageSquareHeart, Send, X } from 'lucide-react';
import type { WeddingInviteConfig, WeddingStationType, WishItem } from '../types/museum';

interface WeddingModalsProps {
  activeStation: WeddingStationType | null;
  config: WeddingInviteConfig;
  onClose: () => void;
  onAddWish: (wish: WishItem) => void;
}

export const WeddingModals: React.FC<WeddingModalsProps> = ({
  activeStation,
  config,
  onClose,
  onAddWish,
}) => {
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Auto-copy card number when opening To'yona modal (matches 00:46 in Video 2)
  useEffect(() => {
    if (activeStation === 'toyona') {
      const digits = config.cardNumber.replace(/\s+/g, '');
      void navigator.clipboard?.writeText(digits).catch(() => {});
      setCopiedCard(true);
    } else {
      setCopiedCard(false);
    }
  }, [activeStation, config.cardNumber]);

  if (!activeStation) return null;

  if (activeStation === 'location') {
    const query = encodeURIComponent(config.venueAddress);
    const yandexUrl = `https://yandex.com/maps/?text=${query}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    return (
      <div
        className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white text-slate-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto shadow-2xl relative text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900">To‘y manzili</h3>
          <p className="text-xs text-slate-500 mt-1 mb-2">{config.venueName}</p>
          <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 mb-4">
            {config.venueAddress}
          </p>

          <p className="text-xs text-slate-400 mb-3">Xaritada ochish uchun tanlang:</p>

          <div className="space-y-2.5">
            <a
              href={yandexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 rounded-xl bg-[#f44e73] hover:bg-[#e13b60] text-white text-sm font-semibold transition-colors"
            >
              Yandex Xaritada ochish
            </a>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
            >
              Google Xaritada ochish
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(config.venueAddress).catch(() => {});
                setCopiedAddress(true);
                window.setTimeout(() => setCopiedAddress(false), 2000);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Manzil nusxalandi</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Manzilni nusxalash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeStation === 'wishes') {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!author.trim() || !message.trim()) return;
      onAddWish({
        id: `w-${Date.now().toString(36)}`,
        author: author.trim(),
        message: message.trim(),
        createdAt: Date.now(),
      });
      setAuthor('');
      setMessage('');
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white text-slate-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-slate-900">
                Tilaklar ({config.wishes.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2.5 mb-4 pr-1">
            {config.wishes.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">{w.author}</span>
                  <span className="text-[11px] text-slate-400">Mehmon</span>
                </div>
                <p className="text-sm text-slate-600">{w.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ismingiz"
              maxLength={40}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 outline-none text-sm text-slate-900"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tilagingizni yozing..."
              rows={2}
              maxLength={220}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 outline-none text-sm text-slate-900 resize-none"
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f44e73] hover:bg-[#e13b60] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Yuborish</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // activeStation === 'toyona'
  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white text-slate-900 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto shadow-2xl relative text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="absolute top-4 right-4 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          {copiedCard ? 'Karta raqami nusxalandi' : 'To‘yona yuborish'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Karta raqamini ilovangiz orqali o‘tkazishingiz mumkin
        </p>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 py-3.5 px-4 mb-4 font-mono-num text-lg font-bold tracking-wider text-slate-900">
          {config.cardNumber}
        </div>

        <button
          type="button"
          onClick={() => {
            const digits = config.cardNumber.replace(/\s+/g, '');
            void navigator.clipboard?.writeText(digits).catch(() => {});
            setCopiedCard(true);
          }}
          className="w-full py-3 px-4 rounded-xl bg-[#f44e73] hover:bg-[#e13b60] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Yana nusxalash
        </button>
      </div>
    </div>
  );
};
