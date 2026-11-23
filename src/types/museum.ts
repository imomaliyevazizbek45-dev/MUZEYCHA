export type MuseumThemeId = 'dark-gallery' | 'romantic-rose' | 'wedding-invite';

export type MusicMood = 'romantic-piano' | 'warm-strings' | 'music-box' | 'silent';

export type WeddingStationType = 'location' | 'wishes' | 'toyona';

export interface WishItem {
  id: string;
  author: string;
  message: string;
  createdAt: number;
}

export interface WeddingInviteConfig {
  weddingDate: string; // YYYY-MM-DD e.g. '2027-01-01'
  mannequin: 'groom' | 'bride';
  heroPortraitSrc?: string;
  venueName: string;
  venueAddress: string;
  lat: number;
  lng: number;
  cardNumber: string;
  wishes: WishItem[];
}

export interface ArtworkItem {
  id: string;
  title: string;
  caption?: string;
  type: 'image' | 'video';
  src: string;
  aspectRatio?: number;
}

export interface MuseumData {
  id: string;
  title: string;
  subtitle?: string;
  theme: MuseumThemeId;
  avatarGender?: 'boy' | 'girl';
  heroText?: string;
  music: MusicMood;
  artworks: ArtworkItem[];
  weddingConfig?: WeddingInviteConfig;
  createdAt: number;
}

export interface MuseumRuntimeStats {
  viewedCount: number;
  totalCount: number;
  activeArtworkIndex: number | null;
  nearbyArtwork: ArtworkItem | null;
  nearbyStation: WeddingStationType | null;
  isAutoTour: boolean;
}
