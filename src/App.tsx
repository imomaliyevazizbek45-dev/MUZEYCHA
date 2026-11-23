import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientMuseumAudio } from './audio/ambientAudio';
import { ArtworkViewerModal } from './components/ArtworkViewerModal';
import { CreateMuseumModal } from './components/CreateMuseumModal';
import { HeartQRModal } from './components/HeartQRModal';
import { HomeMenuScreen } from './components/HomeMenuScreen';
import { MuseumHUD } from './components/MuseumHUD';
import { WeddingModals } from './components/WeddingModals';
import { createDefaultWeddingConfig, createPresetMuseum } from './data/demoMuseums';
import { MuseumEngine } from './three/MuseumEngine';
import type {
  MuseumData,
  MuseumRuntimeStats,
  MuseumThemeId,
  WeddingStationType,
  WishItem,
} from './types/museum';

const LOCAL_STORAGE_PREFIX = 'muzeycha_museum_';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MuseumEngine | null>(null);
  const audioRef = useRef<AmbientMuseumAudio | null>(null);
  const skipNextReloadRef = useRef(false);

  // Start at Main Menu unless a direct shared link (?m= or ?theme=) is opened
  const [activeView, setActiveView] = useState<'menu' | '3d'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('m') || params.get('theme') ? '3d' : 'menu';
  });

  const [museum, setMuseum] = useState<MuseumData>(() => {
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get('theme');
    if (presetParam === 'wedding-invite' || presetParam === 'romantic-rose' || presetParam === 'dark-gallery') {
      return createPresetMuseum(presetParam);
    }
    return createPresetMuseum('wedding-invite');
  });

  const [stats, setStats] = useState<MuseumRuntimeStats>({
    viewedCount: 0,
    totalCount: museum.artworks.length,
    activeArtworkIndex: null,
    nearbyArtwork: null,
    nearbyStation: null,
    isAutoTour: false,
  });

  const [muted, setMuted] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialTheme, setCreateInitialTheme] = useState<MuseumThemeId | undefined>(undefined);
  const [qrOpen, setQrOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [activeStation, setActiveStation] = useState<WeddingStationType | null>(null);

  // Load shared museum from ?m=id if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('m');
    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/museums/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = (await res.json()) as MuseumData;
          if (!cancelled && data && Array.isArray(data.artworks)) {
            setMuseum(data);
            setActiveView('3d');
            return;
          }
        }
      } catch {
        // Fallback to localStorage below
      }

      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_PREFIX + id);
        if (cached && !cancelled) {
          const parsed = JSON.parse(cached) as MuseumData;
          if (parsed && Array.isArray(parsed.artworks)) {
            setMuseum(parsed);
            setActiveView('3d');
          }
        }
      } catch {
        // Ignore malformed cache
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize Three.js MuseumEngine once inside isolated ref container
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const audio = new AmbientMuseumAudio();
    audioRef.current = audio;

    const engine = new MuseumEngine(mountEl, audio, {
      onStatsChange: (nextStats) => setStats(nextStats),
      onSelectArtwork: (idx) => setViewerIndex(idx),
      onSelectStation: (station) => setActiveStation(station),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      audio.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, []);

  // Load museum data into 3D scene whenever active museum changes
  useEffect(() => {
    if (skipNextReloadRef.current) {
      skipNextReloadRef.current = false;
      return;
    }
    engineRef.current?.loadMuseum(museum);
  }, [museum]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleAutoTour = useCallback(() => {
    setStats((prev) => {
      const nextTour = !prev.isAutoTour;
      engineRef.current?.setAutoTour(nextTour);
      return { ...prev, isAutoTour: nextTour };
    });
  }, []);

  const handleJoystickChange = useCallback((x: number, y: number) => {
    engineRef.current?.setJoystick(x, y);
  }, []);

  const handleEnterSpaceFromMenu = useCallback((theme: MuseumThemeId) => {
    setMuseum(createPresetMuseum(theme));
    setActiveStation(null);
    setViewerIndex(null);
    setActiveView('3d');
  }, []);

  const handleSwitchTheme = useCallback((theme: MuseumThemeId) => {
    setActiveStation(null);
    setMuseum((prev) => {
      const isDemo = prev.id.startsWith('demo-');
      if (isDemo) {
        const nextPreset = createPresetMuseum(theme);
        return prev.avatarGender ? { ...nextPreset, avatarGender: prev.avatarGender } : nextPreset;
      }
      return {
        ...prev,
        theme,
        weddingConfig:
          theme === 'wedding-invite'
            ? prev.weddingConfig ?? createDefaultWeddingConfig()
            : prev.weddingConfig,
        heroText: prev.heroText || (theme === 'romantic-rose' ? 'MARRY ME' : 'BIZNING MUZEYIMIZ'),
      };
    });
  }, []);

  const handleSwitchAvatarGender = useCallback((gender: 'boy' | 'girl') => {
    engineRef.current?.setVisitorGender(gender);
    skipNextReloadRef.current = true;
    setMuseum((prev) => ({
      ...prev,
      avatarGender: gender,
      weddingConfig: prev.weddingConfig
        ? { ...prev.weddingConfig, mannequin: gender === 'girl' ? 'bride' : 'groom' }
        : prev.weddingConfig,
    }));
  }, []);

  const handleJumpToArtwork = useCallback((index: number) => {
    engineRef.current?.jumpToArtwork(index);
  }, []);

  const handleAddWish = useCallback(
    (wish: WishItem) => {
      setMuseum((prev) => {
        const cfg = prev.weddingConfig ?? createDefaultWeddingConfig();
        const updated: MuseumData = {
          ...prev,
          weddingConfig: {
            ...cfg,
            wishes: [wish, ...cfg.wishes],
          },
        };
        if (!prev.id.startsWith('demo-')) {
          void fetch('/api/museums', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          try {
            localStorage.setItem(LOCAL_STORAGE_PREFIX + prev.id, JSON.stringify(updated));
          } catch {
            // Ignore quota
          }
        }
        return updated;
      });
    },
    []
  );

  const handlePublishMuseum = useCallback(async (newMuseum: MuseumData) => {
    let savedId = newMuseum.id;
    try {
      const res = await fetch('/api/museums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMuseum),
      });
      if (res.ok) {
        const result = (await res.json()) as { id: string };
        if (result.id) savedId = result.id;
      }
    } catch {
      // Offline / local fallback still works smoothly
    }

    const finalMuseum: MuseumData = { ...newMuseum, id: savedId };
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + savedId, JSON.stringify(finalMuseum));
    } catch {
      // Ignore storage quota overflow for huge videos
    }

    const url = new URL(window.location.href);
    url.searchParams.set('m', savedId);
    url.searchParams.delete('theme');
    window.history.replaceState({}, '', url.toString());

    setMuseum(finalMuseum);
    setActiveView('3d');
    setCreateOpen(false);
    setQrOpen(true);
  }, []);

  const shareUrl = (() => {
    const url = new URL(window.location.href);
    if (!museum.id.startsWith('demo-')) {
      url.searchParams.set('m', museum.id);
      url.searchParams.delete('theme');
    } else {
      url.searchParams.delete('m');
      url.searchParams.set('theme', museum.theme);
    }
    return url.toString();
  })();

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0b0806] select-none">
      {/* Isolated WebGL mount container */}
      <div ref={canvasMountRef} className="fixed inset-0 w-full h-full" />

      {/* First Entry Menu Screen */}
      {activeView === 'menu' && (
        <HomeMenuScreen
          onSelectSpace={handleEnterSpaceFromMenu}
          onOpenCreate={(presetTheme) => {
            setCreateInitialTheme(presetTheme);
            setCreateOpen(true);
          }}
        />
      )}

      {/* 1:1 Muzeycha.uz HUD Overlay when inside 3D scene */}
      {activeView === '3d' && (
        <MuseumHUD
          museum={museum}
          stats={stats}
          muted={muted}
          onToggleMute={handleToggleMute}
          onToggleAutoTour={handleToggleAutoTour}
          onJoystickChange={handleJoystickChange}
          onOpenCreate={() => {
            setCreateInitialTheme(undefined);
            setCreateOpen(true);
          }}
          onOpenShareQR={() => setQrOpen(true)}
          onOpenMenu={() => {
            setActiveStation(null);
            setViewerIndex(null);
            setActiveView('menu');
          }}
          onSwitchTheme={handleSwitchTheme}
          onSwitchAvatarGender={handleSwitchAvatarGender}
          onJumpToArtwork={handleJumpToArtwork}
          onOpenStation={(st) => setActiveStation(st)}
        />
      )}

      {/* Wedding Hall Station Modals (Location, Wishes, To'yona) */}
      <WeddingModals
        activeStation={activeStation}
        config={museum.weddingConfig ?? createDefaultWeddingConfig()}
        onClose={() => setActiveStation(null)}
        onAddWish={handleAddWish}
      />

      {/* Fullscreen Artwork Lightbox */}
      <ArtworkViewerModal
        artworks={museum.artworks}
        currentIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onChangeIndex={(idx) => {
          setViewerIndex(idx);
          engineRef.current?.jumpToArtwork(idx);
        }}
      />

      {/* Create Museum Studio Modal */}
      {createOpen && (
        <CreateMuseumModal
          open={createOpen}
          initialMuseum={museum}
          initialTheme={createInitialTheme}
          onClose={() => {
            setCreateOpen(false);
            setCreateInitialTheme(undefined);
          }}
          onPublish={handlePublishMuseum}
        />
      )}

      {/* Heart QR & Share Link Modal */}
      <HeartQRModal
        open={qrOpen}
        museumTitle={museum.title}
        shareUrl={shareUrl}
        onClose={() => setQrOpen(false)}
      />
    </main>
  );
}
